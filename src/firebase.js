import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCKMuxcG7d5KXNXoqYR-c2T5z8TJGB5HsA",
  authDomain: "proctorcheck-1e5a4.appspot.com",
  projectId: "proctorcheck-1e5a4",
  storageBucket: "proctorcheck-1e5a4.firebasestorage.app",
  messagingSenderId: "677267779830",
  appId: "1:677267779830:web:a0105d5bb1e300c03afcd7",
  measurementId: "G-9T4EXKNG3P"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
