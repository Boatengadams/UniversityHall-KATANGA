import { auth } from "../../firebase.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";

export const registerWithEmailPassword = async ({ email, password, name }) => {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(credential.user, { displayName: name });
  return credential;
};

export const loginWithEmailPassword = async ({ email, password }) =>
  signInWithEmailAndPassword(auth, email, password);

export const getTokenClaims = async (user) => {
  const token = await user.getIdTokenResult(true);
  return token.claims || {};
};
