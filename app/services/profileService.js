import { db } from "../../firebase.js";
import { doc, getDoc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

export const getUserProfile = async (uid) => {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? snap.data() : null;
};

export const saveUserProfile = async (uid, payload) => {
  await setDoc(
    doc(db, "users", uid),
    {
      ...payload,
      updatedAt: serverTimestamp(),
      createdAt: payload.createdAt || serverTimestamp()
    },
    { merge: true }
  );
};
