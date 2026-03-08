import fs from "fs";
import path from "path";
import process from "process";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

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

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
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

function toNumber(value) {
  return Number.isFinite(value) ? Number(value) : 0;
}

function parseArgs() {
  return { fix: process.argv.includes("--fix") };
}

async function run() {
  loadEnvLocal();
  const { fix } = parseArgs();
  const db = initAdminDb();
  const ordersSnap = await db.collection("orders").get();

  let total = 0;
  let ok = 0;
  let fixed = 0;
  const issues = [];

  for (const orderDoc of ordersSnap.docs) {
    total += 1;
    const order = orderDoc.data();

    const subTotal = toNumber(order.subTotal);
    const platformFee = toNumber(order.platformFee);
    const serviceFeeTotal =
      order?.warehouseService?.serviceFeeTotal ??
      (toNumber(order?.warehouseService?.storageFee) +
        toNumber(order?.warehouseService?.processingFee) +
        toNumber(order?.warehouseService?.shippingFee));

    const expectedGrandTotal = subTotal + platformFee + toNumber(serviceFeeTotal);
    const expectedPayout = Math.max(subTotal - platformFee, 0);
    const baseTotalNoWarehouse = subTotal + platformFee;

    const grandTotalOk = toNumber(order.grandTotal) === expectedGrandTotal;
    const sellerPayoutOk = toNumber(order.sellerPayout) === expectedPayout;

    if (grandTotalOk && sellerPayoutOk) {
      ok += 1;
      continue;
    }

    if (
      fix &&
      toNumber(order.grandTotal) === baseTotalNoWarehouse &&
      toNumber(serviceFeeTotal) > 0
    ) {
      await orderDoc.ref.update({
        warehouseService: {
          enabled: false,
          processingMode: "seller_self",
          storageDays: 0,
          storageFee: 0,
          processingFee: 0,
          shippingFee: 0,
          serviceFeeTotal: 0,
          warehouseStatus: "ready_to_ship",
        },
      });
      fixed += 1;
      ok += 1;
      continue;
    }

    issues.push({
      orderId: orderDoc.id,
      grandTotal: order.grandTotal,
      expectedGrandTotal,
      sellerPayout: order.sellerPayout,
      expectedSellerPayout: expectedPayout,
      status: order.status || "unknown",
    });
  }

  console.log("Order fee audit completed");
  console.log(`- total: ${total}`);
  console.log(`- ok: ${ok}`);
  console.log(`- fixed: ${fixed}`);
  console.log(`- issueCount: ${issues.length}`);
  console.log(`- mode: ${fix ? "fix" : "audit"}`);

  if (issues.length > 0) {
    console.log("- issues:");
    for (const issue of issues) {
      console.log(JSON.stringify(issue));
    }
    process.exitCode = 2;
  }
}

run().catch((error) => {
  console.error("Audit failed:", error);
  process.exit(1);
});
