# Farm2Art Production Migration Guide

## Overview
This guide covers migrating from mock in-memory storage to production Firebase services and deploying to Vercel.

## 1. Database Migration (Firestore)

### Current State
- All features use in-memory mock data
- Data lost on server restart
- No persistence layer

### Migration Steps

#### Step 1: Enable Firestore in Firebase Console
```bash
1. Go to Firebase Console > farm2art project
2. Navigate to Firestore Database
3. Create Database in Production mode
4. Set location: us-central1 (or closest to Vietnam: ap-southeast-1)
5. Add Security Rules (see Step 3)
```

#### Step 2: Update API Endpoints

**Example: Migrate Chat Messages**

```typescript
// OLD: app/api/admin-chat/route.ts (mock)
const messages: AdminChatMessage[] = [];

// NEW: app/api/admin-chat/route.ts (Firestore)
import { db } from '@/firebase/config';
import { collection, addDoc, query, where, getDocs, orderBy, limit } from 'firebase/firestore';

export async function GET(request: NextRequest) {
  try {
    const messagesRef = collection(db, 'chat_messages');
    const q = query(
      messagesRef,
      orderBy('timestamp', 'desc'),
      limit(50)
    );
    const snapshot = await getDocs(q);
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Firestore error:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const docRef = await addDoc(collection(db, 'chat_messages'), {
      ...body,
      timestamp: new Date(),
    });
    return NextResponse.json({ id: docRef.id, ...body });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save message' }, { status: 500 });
  }
}
```

#### Step 3: Firestore Security Rules

```javascript
// Firebase Console > Firestore > Rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Chat messages - only admins can read/write
    match /chat_messages/{document=**} {
      allow read, write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Reviews - anyone can read, users can write their own
    match /reviews/{document=**} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth.uid == resource.data.userId;
    }
    
    // Listings - anyone can read, sellers can write their own
    match /listings/{document=**} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth.uid == resource.data.sellerId;
    }
    
    // User data - users can read/write their own
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
      allow read: if true;
    }
    
    // Wishlist - users can read/write their own
    match /wishlists/{userId}/{document=**} {
      allow read, write: if request.auth.uid == userId;
    }
    
    // Conversations - participants only
    match /conversations/{conversationId} {
      allow read: if request.auth.uid in resource.data.participants;
      allow update: if request.auth.uid in resource.data.participants;
    }
    
    match /conversations/{conversationId}/messages/{messageId} {
      allow read: if request.auth.uid in get(/databases/$(database)/documents/conversations/$(conversationId)).data.participants;
      allow create: if request.auth.uid == request.resource.data.senderId;
    }
  }
}
```

#### Step 4: Create Migration Script

```typescript
// scripts/migrate-to-firestore.ts
import { db } from '../firebase/config';
import { collection, addDoc } from 'firebase/firestore';

// Mock data to migrate
const mockListings = [...]; // From existing mock data
const mockReviews = [...];
const mockUsers = [...];

export async function migrateData() {
  console.log('Starting migration...');
  
  // Migrate listings
  for (const listing of mockListings) {
    await addDoc(collection(db, 'listings'), listing);
  }
  console.log('✓ Listings migrated');
  
  // Migrate reviews
  for (const review of mockReviews) {
    await addDoc(collection(db, 'reviews'), review);
  }
  console.log('✓ Reviews migrated');
  
  // Migrate users
  for (const user of mockUsers) {
    await addDoc(collection(db, 'users'), user);
  }
  console.log('✓ Users migrated');
}

// Run: npx ts-node scripts/migrate-to-firestore.ts
```

## 2. Email Service Setup

### Option A: Firebase Email (Recommended)
```bash
1. Install Firebase Extensions:
   - Go to Firebase Console > Extensions
   - Search "Email"
   - Install "Trigger Email from Firestore"

2. Configure:
   - Create "mail" collection in Firestore
   - Documents trigger email sending
```

### Option B: SendGrid
```typescript
// .env.local
SENDGRID_API_KEY=your_api_key_here

// lib/email/sendgrid.ts
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export async function sendEmail(to: string, subject: string, html: string) {
  await sgMail.send({
    to,
    from: 'noreply@farm2art.com',
    subject,
    html,
  });
}
```

### Usage in API
```typescript
// app/api/email/send/route.ts
import { sendEmail } from '@/lib/email/sendgrid';

export async function POST(request: NextRequest) {
  const { to, subject, type, data } = await request.json();
  
  let html = '';
  if (type === 'order-confirmation') {
    html = `<h2>Order #${data.orderId}</h2>...`;
  }
  
  await sendEmail(to, subject, html);
  return NextResponse.json({ success: true });
}
```

## 3. Payment Integration

### VNPay Setup
```typescript
// lib/payments/vnpay.ts
import crypto from 'crypto';

export function createVnpayUrl(amount: number, orderId: string) {
  const vnp_Url = 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
  
  const date = new Date();
  const vnp_CreateDate = date.toISOString().replace(/[-T:\.Z]/g, '').slice(0, 14);
  
  const params: Record<string, string> = {
    vnp_Version: '2.1.0',
    vnp_Command: 'pay',
    vnp_TmnCode: process.env.VNPAY_TMN_CODE!,
    vnp_Amount: String(amount * 100), // VNPay wants in cents
    vnp_CurrCode: 'VND',
    vnp_CreateDate: vnp_CreateDate,
    vnp_OrderInfo: `Order ${orderId}`,
    vnp_OrderType: 'goods',
    vnp_ReturnUrl: `${process.env.NEXT_PUBLIC_URL}/api/payments/vnpay-return`,
    vnp_IpAddr: '127.0.0.1',
    vnp_Locale: 'vn',
  };
  
  // Sort and sign
  const sortedParams = Object.fromEntries(
    Object.entries(params).sort()
  );
  
  const signData = new URLSearchParams(sortedParams).toString();
  const hmac = crypto.createHmac('sha512', process.env.VNPAY_HASH_SECRET!);
  const signed = hmac.update(signData).digest('hex');
  
  return `${vnp_Url}?${signData}&vnp_SecureHash=${signed}`;
}
```

## 4. Vercel Deployment

### Setup
```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Link project
vercel link
```

### Environment Variables
```bash
# .env.production
NEXT_PUBLIC_FIREBASE_API_KEY=xxx
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=xxx
NEXT_PUBLIC_FIREBASE_PROJECT_ID=xxx
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=xxx
FIREBASE_SERVICE_ACCOUNT_KEY=xxx
SENDGRID_API_KEY=xxx
VNPAY_TMN_CODE=xxx
VNPAY_HASH_SECRET=xxx
```

### Deploy
```bash
# Preview deployment
vercel

# Production deployment
vercel --prod

# Check deployment logs
vercel logs
```

### Fix Build Errors
```bash
# Clear cache and rebuild
vercel --prod --force

# Check what's failing
npm run build

# Common issues:
# 1. TypeScript errors: fix all type issues before deploying
# 2. Missing env vars: ensure all are set in Vercel dashboard
# 3. Dependencies: npm install before building
```

## 5. Monitoring & Maintenance

### Firebase Monitoring
```typescript
// lib/monitoring/analytics.ts
import { getAnalytics, logEvent } from 'firebase/analytics';

const analytics = getAnalytics();

export function trackOrderCreated(orderId: string, amount: number) {
  logEvent(analytics, 'order_created', {
    order_id: orderId,
    amount: amount,
    timestamp: new Date(),
  });
}
```

### Error Tracking (Sentry)
```bash
npm install @sentry/nextjs

# .env.local
SENTRY_AUTH_TOKEN=xxx
NEXT_PUBLIC_SENTRY_DSN=xxx
```

### Performance Monitoring
```typescript
// lib/monitoring/performance.ts
export function measureAPILatency(endpoint: string, duration: number) {
  if (duration > 5000) {
    console.warn(`Slow API: ${endpoint} took ${duration}ms`);
  }
}
```

## 6. Rollback Plan

If production breaks:
```bash
# Revert to previous working deployment
vercel rollback

# Or deploy specific commit
vercel --prod --git-commit=<commit-hash>

# Check deployment status
vercel deployments
```

## 7. Migration Checklist

- [ ] Firestore database created and secured
- [ ] Security rules implemented
- [ ] All API endpoints migrated to Firestore
- [ ] Email service configured (SendGrid or Firebase)
- [ ] Payment gateway credentials added
- [ ] Environment variables set in Vercel
- [ ] Build passes locally: `npm run build`
- [ ] Deploy to staging: `vercel --yes`
- [ ] Test all features on staging
- [ ] Deploy to production: `vercel --prod`
- [ ] Monitor errors and performance
- [ ] Set up automated backups

## 8. Ongoing Maintenance

### Weekly
- Check Firestore usage and costs
- Review error logs in Sentry
- Check payment transaction reports

### Monthly
- Audit Firestore security rules
- Update dependencies: `npm update`
- Review and optimize slow queries
- Database backup (Firebase auto-backups daily)

## Support

For issues:
1. Check deployment logs: `vercel logs`
2. Check Firestore logs in Firebase Console
3. Check browser console for client-side errors
4. Test locally first: `npm run dev`

---

**Status**: This migration will complete the remaining 5 features and move the app to production-ready state.
