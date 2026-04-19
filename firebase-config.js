// ============================================================
//  firebase-config.js  —  Surtika
// ============================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth }       from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore }  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getStorage }    from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

const firebaseConfig = {
  apiKey:            "AIzaSyCfFiO59S3U6T3_lAZl_FJauEUa27vVTro",
  authDomain:        "surtika-135.firebaseapp.com",
  projectId:         "surtika-135",
  storageBucket:     "surtika-135.firebasestorage.app",
  messagingSenderId: "804588074503",
  appId:             "1:804588074503:web:906e9bc44e7406a6ee1ca2"
};

const app        = initializeApp(firebaseConfig);
export const auth    = getAuth(app);
export const db      = getFirestore(app);
export const storage = getStorage(app);
