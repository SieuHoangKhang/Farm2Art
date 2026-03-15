import fs from 'fs';
import path from 'path';
import process from 'process';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

function loadEnvLocal() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return;

  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const eqIndex = line.indexOf('=');
    if (eqIndex <= 0) continue;

    const key = line.slice(0, eqIndex).trim();
    let value = line.slice(eqIndex + 1).trim();

    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    if (!process.env[key]) process.env[key] = value;
  }
}

function requiredEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var ${name}`);
  return v;
}

function initAdminDb() {
  if (!getApps().length) {
    const projectId = requiredEnv('FIREBASE_ADMIN_PROJECT_ID');
    const clientEmail = requiredEnv('FIREBASE_ADMIN_CLIENT_EMAIL');
    const privateKey = requiredEnv('FIREBASE_ADMIN_PRIVATE_KEY').replace(/\\n/g, '\n');

    initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
    });
  }
  return getFirestore();
}

async function run() {
  loadEnvLocal();
  const outDir = path.resolve(process.cwd(), 'scripts');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const db = initAdminDb();
  console.log('Querying chat_logs...');
  const snapshot = await db.collection('chat_logs').orderBy('createdAt', 'asc').get();

  const outPath = path.join(outDir, 'chat_logs.jsonl');
  const fd = fs.openSync(outPath, 'w');

  let count = 0;
  for (const doc of snapshot.docs) {
    const d = doc.data();

    const record = {
      id: doc.id,
      userMessage: typeof d.userMessage === 'string' ? d.userMessage : '',
      userMessageNormalized: typeof d.userMessageNormalized === 'string' ? d.userMessageNormalized : '',
      botReply: typeof d.botReply === 'string' ? d.botReply : '',
      matchedCategory: d.matchedCategory || null,
      usedModel: d.usedModel || null,
      createdAt: d.createdAt || null,
    };

    fs.writeSync(fd, JSON.stringify(record) + '\n');
    count += 1;
  }

  fs.closeSync(fd);
  console.log(`Exported ${count} chat logs to ${outPath}`);
}

run().catch((err) => {
  console.error('Export failed:', err);
  process.exitCode = 1;
});
