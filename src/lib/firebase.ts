import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyDULy7PJKDaiWoix6MzN1RLrxFNhh8CsWc",
  authDomain: "evals-snt.firebaseapp.com",
  projectId: "evals-snt",
  storageBucket: "evals-snt.firebasestorage.app",
  messagingSenderId: "4072490637",
  appId: "1:4072490637:web:d297e8584104ef4ccbc4c4",
  measurementId: "G-Y90MHL0V9J"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const analytics = getAnalytics(app);