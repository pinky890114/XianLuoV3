
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCDOXEHdCcRHL4a5mbmF1DGWnGoEma6AgA",
  authDomain: "nocy-79c94.firebaseapp.com",
  projectId: "nocy-79c94",
  storageBucket: "nocy-79c94.firebasestorage.app",
  messagingSenderId: "735264962935",
  appId: "1:735264962935:web:b265f6f486083bf0ba4972",
  measurementId: "G-KZWN0J4XC1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();

export { auth, db, storage, googleProvider };
