import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
const firebaseConfig = {
  apiKey: "AIzaSyAcFRmDU0bGA8i0HxYGtAlZKpTDVK1nDM4",
  authDomain: "school-b1f8e.firebaseapp.com",
  projectId: "school-b1f8e",
  storageBucket: "school-b1f8e.firebasestorage.app",
  messagingSenderId: "1075904310446",
  appId: "1:1075904310446:web:29c77e8c5490344135d13f",
  measurementId: "G-SGW1DBKGHN"
};
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);