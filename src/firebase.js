// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDMXwgOv1DtrprL2J91yfnD_I-FPD04SeY",
  authDomain: "education-navigator-99d5f.firebaseapp.com",
  projectId: "education-navigator-99d5f",
  storageBucket: "education-navigator-99d5f.firebasestorage.app",
  messagingSenderId: "1499496658",
  appId: "1:1499496658:web:bb659dd0b998483851ed0b"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);