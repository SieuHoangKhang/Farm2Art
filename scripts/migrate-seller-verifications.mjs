import fs from "fs";
import path from "path";
import process from "process";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const SOURCE_COLLECTION = "sellerVerifications";
const TARGET_COLLECTION = "seller_verifications";
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

function parseArgs() {
  return { dryRun: process.argv.includes("--dry-run") };
}

async function run() {
  loadEnvLocal();
  const { dryRun } = parseArgs();
  const db = initAdminDb();

  const sourceSnap = await db.collection(SOURCE_COLLECTION).get();
  let processed = 0;
  let copied = 0;
  let skipped = 0;

  let batch = db.batch();
  let batchOps = 0;

  for (const srcDoc of sourceSnap.docs) {
    processed += 1;
    const targetRef = db.collection(TARGET_COLLECTION).doc(srcDoc.id);
    const targetSnap = await targetRef.get();

    if (targetSnap.exists) {
      skipped += 1;
      continue;
    }

    copied += 1;

    if (!dryRun) {
      batch.set(targetRef, srcDoc.data(), { merge: true });
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

  console.log("Seller verification migration completed");
  console.log(`- sourceCollection: ${SOURCE_COLLECTION}`);
  console.log(`- targetCollection: ${TARGET_COLLECTION}`);
  console.log(`- processed: ${processed}`);
  console.log(`- copied: ${copied}`);
  console.log(`- skippedExisting: ${skipped}`);
  console.log(`- mode: ${dryRun ? "dry-run" : "write"}`);
}

run().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
