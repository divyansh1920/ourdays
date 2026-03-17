import React, { createContext, useContext, useState, useEffect } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase/config";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [coupleId, setCoupleId] = useState(null);
  const [loading, setLoading] = useState(true);

  const signup = async (email, password, displayName) => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(result.user, { displayName });
    await setDoc(doc(db, "users", result.user.uid), {
      displayName,
      email,
      coupleId: null,
      createdAt: new Date().toISOString(),
    });
    return result;
  };

  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    setCoupleId(null);
    return signOut(auth);
  };

  const loadCoupleId = async (uid) => {
    try {
      const userDoc = await getDoc(doc(db, "users", uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        const id = data.coupleId || null;
        setCoupleId(id);
        return id;
      }
      setCoupleId(null);
      return null;
    } catch (err) {
      console.error("Error loading coupleId:", err);
      setCoupleId(null);
      return null;
    }
  };

  const refreshCoupleId = async () => {
    if (currentUser) {
      return await loadCoupleId(currentUser.uid);
    }
    return null;
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await loadCoupleId(user.uid);
      } else {
        setCoupleId(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    coupleId,
    signup,
    login,
    logout,
    refreshCoupleId,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};