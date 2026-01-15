import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';

export const useNetworkConfig = (user) => {
    const [allowedSchoolIP, setAllowedSchoolIP] = useState(null);

    useEffect(() => {
        if (!user) return;

        const configRef = doc(db, 'settings', 'network_config');
        const unsubscribe = onSnapshot(configRef, (docSnap) => {
            if (docSnap.exists()) {
                setAllowedSchoolIP(docSnap.data().schoolIP);
            }
        });

        return () => unsubscribe();
    }, [user]);

    return { allowedSchoolIP };
};
