import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import firebaseConfigJson from "../../../firebase-applet-config.json";

const firebaseConfig = {
  apiKey: firebaseConfigJson.apiKey,
  authDomain: firebaseConfigJson.authDomain,
  projectId: firebaseConfigJson.projectId,
  storageBucket: firebaseConfigJson.storageBucket,
  messagingSenderId: firebaseConfigJson.messagingSenderId,
  appId: firebaseConfigJson.appId,
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: "select_account",
});

// Initialize Firestore with custom databaseId if configured
const customDbId = firebaseConfigJson.firestoreDatabaseId && firebaseConfigJson.firestoreDatabaseId !== "(default)"
  ? firebaseConfigJson.firestoreDatabaseId
  : undefined;

export const db = customDbId ? getFirestore(app, customDbId) : getFirestore(app);

/**
 * Sign in with Google using popup or redirect fallback
 */
export async function signInWithGoogle(): Promise<User | null> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    if (result.user) {
      await syncUserProfile(result.user);
    }
    return result.user;
  } catch (error: any) {
    console.warn("Popup sign-in failed or blocked, attempting redirect fallback...", error);
    if (error.code === "auth/popup-blocked" || error.code === "auth/popup-closed-by-user") {
      try {
        await signInWithRedirect(auth, googleProvider);
      } catch (redirectErr) {
        console.error("Google redirect sign-in failed:", redirectErr);
        throw redirectErr;
      }
    } else {
      throw error;
    }
  }
  return null;
}

/**
 * Sign out current user
 */
export async function logOutUser(): Promise<void> {
  await signOut(auth);
}

/**
 * Sync user profile details in Firestore
 */
export async function syncUserProfile(user: User, additionalData?: Record<string, any>) {
  if (!user) return;
  const userRef = doc(db, "users", user.uid);
  const snap = await getDoc(userRef);

  const payload: Record<string, any> = {
    uid: user.uid,
    email: user.email || "",
    displayName: user.displayName || user.email?.split("@")[0] || "Student / Guardian",
    photoURL: user.photoURL || "",
    updatedAt: new Date().toISOString(),
    ...additionalData,
  };

  if (!snap.exists()) {
    payload.createdAt = new Date().toISOString();
    payload.role = additionalData?.role || "user";
  }

  await setDoc(userRef, payload, { merge: true });
}

/**
 * Save user chat history to Firestore
 */
export async function saveUserChatSession(
  userId: string,
  messages: Array<{ role: string; text: string }>,
  mode: string = "gemini-3.5-flash"
) {
  if (!userId) return;
  const chatRef = doc(db, "chatHistory", userId);
  await setDoc(
    chatRef,
    {
      userId,
      messages,
      mode,
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );
}

/**
 * Load user chat history from Firestore
 */
export async function getUserChatSession(userId: string) {
  if (!userId) return null;
  const chatRef = doc(db, "chatHistory", userId);
  const snap = await getDoc(chatRef);
  if (snap.exists()) {
    return snap.data();
  }
  return null;
}

/**
 * Bookmark notice to Firestore
 */
export async function toggleNoticeBookmark(userId: string, notice: { id: string; title: string }) {
  if (!userId || !notice?.id) return false;
  const docId = `${userId}_${notice.id}`;
  const noticeRef = doc(db, "userNotices", docId);
  const snap = await getDoc(noticeRef);

  if (snap.exists()) {
    await deleteDoc(noticeRef);
    return false; // unbookmarked
  } else {
    await setDoc(noticeRef, {
      userId,
      noticeId: notice.id,
      title: notice.title || "",
      savedAt: new Date().toISOString(),
    });
    return true; // bookmarked
  }
}

/**
 * Fetch all bookmarked notices for user
 */
export async function getUserBookmarkedNotices(userId: string) {
  if (!userId) return [];
  const q = query(collection(db, "userNotices"), where("userId", "==", userId));
  const querySnap = await getDocs(q);
  const result: any[] = [];
  querySnap.forEach((docSnap) => {
    result.push({ id: docSnap.id, ...docSnap.data() });
  });
  return result;
}
