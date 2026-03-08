#!/usr/bin/env node

/**
 * Script: Migrate orders to Escrow Model
 * Tính commission & payout cho orders hiện tại
 * 
 * Usage: node scripts/migrate-escrow-model.mjs
 */

import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

// Initialize Firebase
const serviceAccountPath = process.env.FIREBASE_KEY_PATH || './firebase-key.json';
if (!fs.existsSync(serviceAccountPath)) {
  console.error(`❌ Firebase key not found at ${serviceAccountPath}`);
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf-8'));
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const DEFAULT_COMMISSION_RATE = 0.1; // 10%

async function migrateOrders() {
  console.log('🔄 Starting Escrow Model migration...\n');

  try {
    const ordersRef = db.collection('orders');
    const snapshot = await ordersRef.get();

    if (snapshot.empty) {
      console.log('❌ No orders found');
      return;
    }

    console.log(`📦 Found ${snapshot.size} orders\n`);

    let updated = 0;
    let skipped = 0;
    let errors = 0;

    for (const doc of snapshot.docs) {
      const order = doc.data();
      const orderId = doc.id;

      try {
        // Kiểm tra đã migrate chưa
        if (order.commissionAmount !== undefined && order.payoutAmount !== undefined) {
          console.log(`⏭️  ${orderId} - Already migrated`);
          skipped++;
          continue;
        }

        // Lấy grandTotal
        const grandTotal = order.grandTotal || order.totalAmount || 0;
        if (!grandTotal) {
          console.log(`⚠️  ${orderId} - No grandTotal found, skipping`);
          skipped++;
          continue;
        }

        // Tính commission & payout
        const commissionRate = order.commissionRate || DEFAULT_COMMISSION_RATE;
        const commissionAmount = Math.round(grandTotal * commissionRate);
        const payoutAmount = grandTotal - commissionAmount;

        // Set escrow status nếu ngầu đã thanh toán
        let escrowStatus = 'pending';
        if (order.paymentStatus === 'success' && order.completedAt) {
          escrowStatus = 'released';
        } else if (order.paymentStatus === 'success') {
          escrowStatus = 'held';
        }

        // Update order
        await db.collection('orders').doc(orderId).update({
          commissionRate,
          commissionAmount,
          payoutAmount,
          escrowStatus,
          payoutStatus: order.status === 'completed' ? 'scheduled' : 'pending',
          // Set paymentReceivedAt if not set
          paymentReceivedAt: order.paidAt || admin.firestore.FieldValue.serverTimestamp(),
        });

        console.log(
          `✅ ${orderId.slice(0, 12)} - Commission: ${commissionAmount.toLocaleString('vi-VN')}đ, Payout: ${payoutAmount.toLocaleString('vi-VN')}đ`
        );
        updated++;
      } catch (err) {
        console.error(`❌ ${orderId} - ${err.message}`);
        errors++;
      }
    }

    console.log(`\n📊 Migration Summary:`);
    console.log(`   ✅ Updated: ${updated}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    console.log(`   ❌ Errors: ${errors}`);
    console.log(`\n✨ Migration complete!\n`);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrateOrders().then(() => {
  process.exit(0);
});
