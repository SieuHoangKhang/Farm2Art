import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as admin from 'firebase-admin';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env.local manually
const envPath = path.join(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && !key.startsWith('#')) {
    envVars[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
  }
});

// Initialize Firebase Admin
if (!admin.apps.length) {
  try {
    const serviceAccount = {
      type: 'service_account',
      project_id: envVars.FIREBASE_ADMIN_PROJECT_ID,
      private_key_id: envVars.FIREBASE_ADMIN_PRIVATE_KEY_ID || '',
      private_key: (envVars.FIREBASE_ADMIN_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
      client_email: envVars.FIREBASE_ADMIN_CLIENT_EMAIL,
      client_id: envVars.FIREBASE_ADMIN_CLIENT_ID || '',
      auth_uri: envVars.FIREBASE_ADMIN_AUTH_URI || 'https://accounts.google.com/o/oauth2/auth',
      token_uri: envVars.FIREBASE_ADMIN_TOKEN_URI || 'https://oauth2.googleapis.com/token',
    };

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: `https://${envVars.FIREBASE_ADMIN_PROJECT_ID}.firebaseio.com`,
    });
    console.log('✅ Firebase initialized');
  } catch (err) {
    console.error('❌ Firebase init error:', err.message);
    process.exit(1);
  }
}

const db = admin.firestore();

async function exportCollectionToJSON(collectionName) {
  try {
    console.log(`📥 Đang lấy dữ liệu từ collection: ${collectionName}...`);

    const snapshot = await db.collection(collectionName).get();
    const data = [];

    snapshot.forEach(doc => {
      data.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    // Tạo thư mục nếu chưa có
    const outputDir = path.join(__dirname, 'firestore-exports');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Lưu file JSON
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const filename = path.join(outputDir, `${collectionName}-${timestamp}.json`);
    fs.writeFileSync(filename, JSON.stringify(data, null, 2), 'utf-8');

    console.log(`\n✅ Thành công!`);
    console.log(`📊 Tổng documents: ${data.length}`);
    console.log(`📁 File lưu tại: ${filename}`);
    console.log(`\n💾 JSON content preview (first 3 docs):`);
    console.log(JSON.stringify(data.slice(0, 3), null, 2));

    return filename;
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Chạy export
const collection = process.argv[2] || 'chat_logs';
exportCollectionToJSON(collection).then(() => process.exit(0));
