import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { APP_ID } from '../utils/constants';

export const useNetworkConfig = (user) => {
    const [allowedSchoolIP, setAllowedSchoolIP] = useState(null);

    useEffect(() => {
        if (!user) return;

        const configRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'settings', 'network_config');
        const unsubscribe = onSnapshot(configRef, (docSnap) => {
            if (docSnap.exists()) {
                setAllowedSchoolIP(docSnap.data().schoolIP);
            }
        });

        return () => unsubscribe();
    }, [user]);

    return { allowedSchoolIP };
};
