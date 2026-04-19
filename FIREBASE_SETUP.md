# Surtika Firebase Backend — Deployment Guide

## Files Created

| File | Purpose |
|---|---|
| `firebase-config.js` | Firebase SDK init — replace with your real credentials |
| `authService.js` | Hybrid Auth: Email/Password + Google OAuth + Admin Guards |
| `firestore.rules` | Security Rules for products, users, orders, admin_logs |
| `functions/index.js` | Cloud Functions: setAdminClaim, processOrder, paymentWebhook |
| `login.html` | Gen-Z Dark + Hari Mirch Green Login page (Stitch design) |
| `signup.html` | Gen-Z Dark + Hari Mirch Green Signup page (Stitch design) |

---

## Step-by-Step Firebase Deployment

### 1. Create a Firebase Project
Go to [https://console.firebase.google.com](https://console.firebase.google.com) → Create Project → Enable Auth, Firestore, Functions, Hosting.

### 2. Update `firebase-config.js`
Copy your project credentials from Firebase Console → Project Settings → Your Apps.

### 3. Enable Auth Providers
Firebase Console → Authentication → Sign-in method:
- ✅ Email/Password
- ✅ Google

### 4. Deploy Security Rules
```bash
firebase deploy --only firestore:rules
```

### 5. Deploy Cloud Functions
```bash
cd functions
npm install firebase-admin firebase-functions
cd ..
firebase deploy --only functions
```

### 6. Set Admin Webhook Secret (for payment fraud check)
```bash
firebase functions:config:set payment.webhook_secret="YOUR_RAZORPAY_WEBHOOK_SECRET"
```

### 7. Add First Admin
In Firebase Console → Firestore → Create collection `authorized_admins` → Add document with ID = admin email address (e.g., `admin@yourstore.com`). The Cloud Function will automatically grant the admin claim on next login.

---

## Firestore Data Schema

### `products/{productId}`
```json
{
  "title": "Hari Mirch Kurti",
  "price": 2500,
  "discountedPrice": 1999,
  "stock": 100,
  "category": "Tops",
  "images": ["url1", "url2"],
  "sizes": ["XS", "S", "M", "L", "XL"],
  "isTrending": true
}
```

### `users/{uid}`
```json
{
  "uid": "...",
  "email": "user@example.com",
  "displayName": "Priya Sharma",
  "role": "customer",
  "savedAddresses": [],
  "orderHistory": [],
  "createdAt": "timestamp"
}
```

### `orders/{orderId}`
```json
{
  "orderId": "...",
  "userId": "...",
  "items": [{ "productId": "...", "title": "...", "quantity": 2, "priceAtPurchase": 1999 }],
  "totalAmount": 3998,
  "status": "pending | paid | shipped | delivered | FRAUD",
  "trackingId": null,
  "paymentId": null,
  "createdAt": "timestamp"
}
```

### `authorized_admins/{email}`
Just create the document — no fields needed. Its existence grants admin claim.

### `admin_logs/{logId}`
```json
{
  "action": "ADMIN_CLAIM_GRANTED",
  "adminUid": "...",
  "timestamp": "timestamp"
}
```
