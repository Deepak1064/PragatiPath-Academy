import { useState, useEffect } from 'react';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile,
    sendPasswordResetEmail
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { ADMIN_EMAIL } from '../utils/constants';

export const useAuth = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAdminMode, setIsAdminMode] = useState(false);

    // Auth state listener
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                setIsAdminMode(currentUser.email === ADMIN_EMAIL);
            } else {
                setIsAdminMode(false);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const login = async (email, password) => {
        await signInWithEmailAndPassword(auth, email, password);
    };

    const signup = async (email, password, fullName) => {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, {
            displayName: fullName
        });
    };

    const logout = async () => {
        await signOut(auth);
    };

    const resetPassword = async (email) => {
        await sendPasswordResetEmail(auth, email);
    };

    return {
        user,
        loading,
        isAdminMode,
        login,
        signup,
        logout,
        resetPassword
    };
};
