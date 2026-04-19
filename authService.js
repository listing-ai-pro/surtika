// ============================================================
//  authService.js  —  Surtika / Surtika
//  Hybrid Authentication: Email/Password + Google OAuth
//  Admin flow uses Firebase Custom Claims via Cloud Function.
// ============================================================

import { auth, db } from "./firebase-config.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const googleProvider = new GoogleAuthProvider();

// ── Helpers ──────────────────────────────────────────────────

/**
 * Creates a user document in Firestore (only on first signup).
 * @param {import("firebase/auth").User} user
 */
async function createUserDocument(user) {
  const userRef = doc(db, "users", user.uid);
  const snap = await getDoc(userRef);

  if (!snap.exists()) {
    await setDoc(userRef, {
      uid:           user.uid,
      email:         user.email,
      displayName:   user.displayName || "",
      role:          "customer",           // Default role
      savedAddresses: [],
      orderHistory:  [],
      createdAt:     serverTimestamp(),
    });
  }
}

/**
 * After login, force-refresh the ID token and check for
 * admin custom claim. Redirects to admin or customer area.
 * @param {import("firebase/auth").User} user
 */
async function handlePostLogin(user) {
  const tokenResult = await user.getIdTokenResult(/* forceRefresh */ true);
  if (tokenResult.claims.admin === true) {
    window.location.href = "/admin.html";
  } else {
    window.location.href = "/index.html";
  }
}

// ── Sign Up ──────────────────────────────────────────────────

/**
 * Standard Email/Password Sign Up.
 * Creates user in Firebase Auth + Firestore users collection.
 * @param {string} email
 * @param {string} password
 */
export async function signUpWithEmail(email, password) {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  await createUserDocument(credential.user);
  await handlePostLogin(credential.user);
}

// ── Login ────────────────────────────────────────────────────

/**
 * Standard Email/Password Login.
 * @param {string} email
 * @param {string} password
 */
export async function loginWithEmail(email, password) {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  await handlePostLogin(credential.user);
}

/**
 * Google OAuth Login / Sign Up.
 * Creates a Firestore document if the user is new.
 */
export async function loginWithGoogle() {
  const credential = await signInWithPopup(auth, googleProvider);
  await createUserDocument(credential.user);
  await handlePostLogin(credential.user);
}

// ── Logout ───────────────────────────────────────────────────

export async function logout() {
  await signOut(auth);
  window.location.href = "/login.html";
}

// ── Auth State Observer ──────────────────────────────────────

/**
 * Attaches an auth state listener.
 * Pass a callback that receives the user object (or null).
 * @param {(user: import("firebase/auth").User | null) => void} callback
 */
export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}

/**
 * Route guard for pages that require authentication.
 * Redirects to /login.html if no user is logged in.
 */
export function requireAuth() {
  onAuthStateChanged(auth, (user) => {
    if (!user) window.location.href = "/login.html";
  });
}

/**
 * Route guard for Admin-only pages.
 * Requires the custom claim { admin: true }.
 */
export function requireAdmin() {
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      window.location.href = "/login.html";
      return;
    }
    const tokenResult = await user.getIdTokenResult();
    if (tokenResult.claims.admin !== true) {
      window.location.href = "/index.html";
    }
  });
}
