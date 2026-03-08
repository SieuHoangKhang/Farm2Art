import fs from "fs";
import path from "path";
import process from "process";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const PLATFORM_FEE_RATE = 0.025;
const DEFAULT_STORAGE_DAYS = 2;
const STORAGE_FEE_PER_DAY = 2000;
const PROCESSING_FEE_WAREHOUSE = 15000;
const SHIPPING_FEE_WAREHOUSE = 30000;
const BATCH_LIMIT = 400;

function loadEnvLocal() {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;

  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const eqIndex = line.indexOf("=");
    if (eqIndex <= 0) continue;

    const key = line.slice(0, eqIndex).trim();
    let value = line.slice(eqIndex + 1).trim();

    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing env var ${name}. Please set it in .env.local or shell env.`);
  }
  return value;
}

function initAdminDb() {
  if (!getApps().length) {
    const projectId = requiredEnv("FIREBASE_ADMIN_PROJECT_ID");
    const clientEmail = requiredEnv("FIREBASE_ADMIN_CLIENT_EMAIL");
    const privateKey = requiredEnv("FIREBASE_ADMIN_PRIVATE_KEY").replace(/\\n/g, "\n");

    initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
    });
  }

  return getFirestore();
}

function computeSubTotal(order) {
  if (typeof order.subTotal === "number") return order.subTotal;
  if (typeof order.totalAmount === "number") return order.totalAmount;

  if (Array.isArray(order.items)) {
    return order.items.reduce((sum, item) => {
      const price = Number(item?.price || 0);
      const quantity = Number(item?.quantity || 0);
      return sum + price * quantity;
    }, 0);
  }

  return 0;
}

function computeWarehouseService(order) {
  if (order?.warehouseService && typeof order.warehouseService === "object") {
    const existing = order.warehouseService;
    const storageFee = Number(existing.storageFee || 0);
    const processingFee = Number(existing.processingFee || 0);
    const shippingFee = Number(existing.shippingFee || 0);

    return {
      enabled: existing.enabled !== false,
      processingMode: existing.processingMode === "seller_self" ? "seller_self" : "warehouse",
      storageDays: Number.isFinite(existing.storageDays) ? Number(existing.storageDays) : DEFAULT_STORAGE_DAYS,
      storageFee,
      processingFee,
      shippingFee,
      serviceFeeTotal:
        Number.isFinite(existing.serviceFeeTotal)
          ? Number(existing.serviceFeeTotal)
          : storageFee + processingFee + shippingFee,
      warehouseStatus: existing.warehouseStatus || "awaiting_intake",
    };
  }

  // Legacy orders that never had warehouse flow should default to zero service fee.
  const storageDays = 0;
  const storageFee = 0;
  const processingFee = 0;
  const shippingFee = 0;

  return {
    enabled: false,
    processingMode: "seller_self",
    storageDays,
    storageFee,
    processingFee,
    shippingFee,
    serviceFeeTotal: storageFee + processingFee + shippingFee,
    warehouseStatus: "ready_to_ship",
  };
}

function parseArgs() {
  const dryRun = process.argv.includes("--dry-run");
  return { dryRun };
}

async function run() {
  loadEnvLocal();
  const { dryRun } = parseArgs();
  const db = initAdminDb();

  const snapshot = await db.collection("orders").get();
  let processed = 0;
  let changed = 0;
  let skipped = 0;

  let batch = db.batch();
  let batchOps = 0;

  for (const orderDoc of snapshot.docs) {
    processed += 1;
    const order = orderDoc.data();

    const subTotal = computeSubTotal(order);
    const platformFee =
      typeof order.platformFee === "number"
        ? order.platformFee
        : Math.round(subTotal * PLATFORM_FEE_RATE);

    const warehouseService = computeWarehouseService(order);
    const serviceFeeTotal = Number(warehouseService.serviceFeeTotal || 0);

    const totalAmount = typeof order.totalAmount === "number" ? order.totalAmount : subTotal;
    const grandTotal =
      typeof order.grandTotal === "number"
        ? order.grandTotal
        : subTotal + platformFee + serviceFeeTotal;

    const sellerPayout =
      typeof order.sellerPayout === "number"
        ? order.sellerPayout
        : Math.max(subTotal - platformFee, 0);

    const patch = {};

    if (typeof order.subTotal !== "number") patch.subTotal = subTotal;
    if (typeof order.totalAmount !== "number") patch.totalAmount = totalAmount;
    if (typeof order.platformFee !== "number") patch.platformFee = platformFee;
    if (!order.warehouseService || typeof order.warehouseService !== "object") {
      patch.warehouseService = warehouseService;
    } else {
      const existing = order.warehouseService;
      const needsServiceTotal = !Number.isFinite(existing.serviceFeeTotal);
      const needsEnabled = typeof existing.enabled !== "boolean";
      const needsStatus = !existing.warehouseStatus;

      if (needsServiceTotal || needsEnabled || needsStatus) {
        patch.warehouseService = warehouseService;
      }
    }
    if (typeof order.grandTotal !== "number") patch.grandTotal = grandTotal;
    if (typeof order.sellerPayout !== "number") patch.sellerPayout = sellerPayout;

    if (Object.keys(patch).length === 0) {
      skipped += 1;
      continue;
    }

    changed += 1;

    if (!dryRun) {
      batch.update(orderDoc.ref, patch);
      batchOps += 1;

      if (batchOps >= BATCH_LIMIT) {
        await batch.commit();
        batch = db.batch();
        batchOps = 0;
      }
    }
  }

  if (!dryRun && batchOps > 0) {
    await batch.commit();
  }

  console.log("Backfill completed");
  console.log(`- processed: ${processed}`);
  console.log(`- changed: ${changed}`);
  console.log(`- skipped: ${skipped}`);
  console.log(`- mode: ${dryRun ? "dry-run" : "write"}`);
}

run().catch((error) => {
  console.error("Backfill failed:", error);
  process.exit(1);
});
