// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCzgKRaJVpsQ8a1wVRIGo-LA13Law3kAPE",
  authDomain: "bone-ember-tattoo.firebaseapp.com",
  projectId: "bone-ember-tattoo",
  storageBucket: "bone-ember-tattoo.firebasestorage.app",
  messagingSenderId: "622480402730",
  appId: "1:622480402730:web:945a7bc5ab38118a9d1653",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export so form.js and dashboard.js can use them
export const db = getFirestore(app);
export const auth = getAuth(app);
