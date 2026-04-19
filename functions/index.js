// ============================================================
//  functions/index.js  —  Surtika Firebase Cloud Functions
//  Deploy via:  firebase deploy --only functions
//
//  Includes:
//    1. setAdminClaim     — grants admin role to authorized emails
//    2. processOrder      — secure, anti-fraud checkout function
// ============================================================

const functions  = require("firebase-functions");
const admin      = require("firebase-admin");
const crypto     = require("crypto");

admin.initializeApp();
const db = admin.firestore();

// ──────────────────────────────────────────────────────────────
//  1. SET ADMIN CUSTOM CLAIM
//  Triggered automatically when a new user signs in.
//  Checks the 'authorized_admins' collection by email.
//  If found, sets { admin: true } as a Firebase Custom Claim.
// ──────────────────────────────────────────────────────────────
exports.setAdminClaim = functions.auth.user().onCreate(async (user) => {
  try {
    const adminRef = db.collection("authorized_admins").doc(user.email);
    const adminSnap = await adminRef.get();

    if (adminSnap.exists) {
      // Grant admin claim
      await admin.auth().setCustomUserClaims(user.uid, { admin: true });
      console.log(`✅ Admin claim granted to: ${user.email}`);

      // Log this action
      await db.collection("admin_logs").add({
        action:    `ADMIN_CLAIM_GRANTED`,
        adminUid:  user.uid,
        email:     user.email,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
  } catch (err) {
    console.error("Error setting admin claim:", err);
  }
});

// ──────────────────────────────────────────────────────────────
//  2. PROCESS ORDER (Secure Checkout)
//  Anti-fraud, server-side validated checkout.
//  Client sends: { cartItems: [{ productId, quantity }] }
//  Server: validates prices, checks stock, creates pending order.
// ──────────────────────────────────────────────────────────────
exports.processOrder = functions.https.onCall(async (data, context) => {
  // ── Auth Guard ─────────────────────────────────────────────
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "You must be logged in to place an order."
    );
  }

  const userId    = context.auth.uid;
  const cartItems = data.cartItems; // [{ productId, quantity }]

  if (!cartItems || cartItems.length === 0) {
    throw new functions.https.HttpsError("invalid-argument", "Cart is empty.");
  }

  // ── STEP 1: Re-calculate total from Firestore (anti-fraud) ─
  let serverCalculatedTotal = 0;
  const validatedItems = [];

  for (const item of cartItems) {
    const productSnap = await db.collection("products").doc(item.productId).get();

    if (!productSnap.exists) {
      throw new functions.https.HttpsError(
        "not-found",
        `Product ${item.productId} not found.`
      );
    }

    const product = productSnap.data();

    // ── STEP 2: Stock Check ───────────────────────────────────
    if (product.stock < item.quantity) {
      throw new functions.https.HttpsError(
        "failed-precondition",
        `"${product.title}" is out of stock. Only ${product.stock} left.`
      );
    }

    const price = product.discountedPrice || product.price;
    serverCalculatedTotal += price * item.quantity;

    validatedItems.push({
      productId:  item.productId,
      title:      product.title,
      quantity:   item.quantity,
      priceAtPurchase: price,
    });
  }

  // ── STEP 3: Create a 'pending' order in Firestore ──────────
  const orderId  = db.collection("orders").doc().id;
  const orderRef = db.collection("orders").doc(orderId);

  await orderRef.set({
    orderId,
    userId,
    items:       validatedItems,
    totalAmount: serverCalculatedTotal,
    status:      "pending",
    trackingId:  null,
    paymentId:   null,
    createdAt:   admin.firestore.FieldValue.serverTimestamp(),
  });

  // ── Return the validated total and orderId to the frontend ─
  // Frontend then uses this to create a Razorpay/Stripe Payment Intent.
  return {
    orderId,
    totalAmount: serverCalculatedTotal,
    message: "Order validated. Proceed to payment.",
  };
});

// ──────────────────────────────────────────────────────────────
//  3. PAYMENT WEBHOOK (Razorpay / Stripe)
//  Called by the payment gateway after successful payment.
//  Verifies signature and atomically updates stock & order status.
// ──────────────────────────────────────────────────────────────
exports.paymentWebhook = functions.https.onRequest(async (req, res) => {
  const secret    = process.env.PAYMENT_WEBHOOK_SECRET;
  const signature = req.headers["x-razorpay-signature"] || req.headers["stripe-signature"];
  const body      = JSON.stringify(req.body);

  // ── Verify webhook signature ────────────────────────────────
  const expectedSig = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");

  if (signature !== expectedSig) {
    console.error("❌ Invalid webhook signature — possible fraud attempt.");
    return res.status(400).send("Invalid signature.");
  }

  const { orderId, paymentId, paidAmount } = req.body;

  const orderRef  = db.collection("orders").doc(orderId);
  const orderSnap = await orderRef.get();

  if (!orderSnap.exists) {
    return res.status(404).send("Order not found.");
  }

  const order = orderSnap.data();

  // ── STEP 4: Fraud Check — Amount Mismatch ──────────────────
  if (Math.abs(paidAmount - order.totalAmount) > 0.01) {
    console.error(`❌ FRAUD DETECTED: Order ${orderId} — expected ₹${order.totalAmount}, got ₹${paidAmount}`);
    await orderRef.update({ status: "FRAUD", paymentId });
    return res.status(400).send("Amount mismatch — order flagged.");
  }

  // ── STEP 5: Atomic Stock Decrement + Status Update ─────────
  await db.runTransaction(async (transaction) => {
    for (const item of order.items) {
      const productRef  = db.collection("products").doc(item.productId);
      const productSnap = await transaction.get(productRef);

      if (!productSnap.exists) {
        throw new Error(`Product ${item.productId} not found during transaction.`);
      }

      const currentStock = productSnap.data().stock;
      if (currentStock < item.quantity) {
        throw new Error(`Insufficient stock for ${item.productId}.`);
      }

      transaction.update(productRef, {
        stock: currentStock - item.quantity,
      });
    }

    // Mark order as paid
    transaction.update(orderRef, {
      status:    "paid",
      paymentId: paymentId,
    });
  });

  console.log(`✅ Order ${orderId} marked as PAID.`);
  return res.status(200).send("Webhook processed successfully.");
});
