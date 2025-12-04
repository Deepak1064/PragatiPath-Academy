import React, { useState } from 'react';
import { collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { MapPin, RefreshCw, Loader2 } from 'lucide-react';
import { db } from '../../config/firebase';
import { APP_ID } from '../../utils/constants';
import Button from '../shared/Button';

const Settings = ({ currentIP, fetchIP, user }) => {
    const [resetting, setResetting] = useState(false);

    const handleResetAttendance = async () => {
        if (!confirm("Are you sure? This will delete your attendance record for today so you can test scanning again.")) return;

        setResetting(true);
        try {
            const today = new Date().toLocaleDateString();
            const q = query(
                collection(db, 'artifacts', APP_ID, 'public', 'data', 'attendance'),
                where('userId', '==', user.uid),
                where('dateString', '==', today)
            );
            const snapshot = await getDocs(q);
            const deletePromises = snapshot.docs.map(d => deleteDoc(d.ref));
            await Promise.all(deletePromises);
            alert("Attendance reset! Go back to the Attend tab to scan again.");
        } catch (e) {
            console.error(e);
            alert("Failed to reset: " + e.message);
        }
        setResetting(false);
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-bold text-gray-800 mb-2">Debug Settings</h2>
                <p className="text-sm text-gray-500 mb-4">
                    Use this to spoof your current IP for testing. <br />
                    (Note: You cannot change the School IP here anymore; only Admin can do that).
                </p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 space-y-4">
                <div>
                    <label className="text-xs font-bold text-gray-400 uppercase">Your Detected IP</label>
                    <div className="flex items-center gap-2 mt-1">
                        <MapPin className="w-4 h-4 text-blue-500" />
                        <span className="font-mono text-gray-800">{currentIP || 'Loading...'}</span>
                    </div>
                </div>
            </div>
            <div className="grid gap-3">
                <Button onClick={() => { localStorage.setItem('mock_current_ip', "192.168.1.100"); fetchIP(); }}>
                    Spoof IP to "192.168.1.100"
                </Button>
                <Button variant="secondary" onClick={() => { localStorage.removeItem('mock_current_ip'); fetchIP(); }}>
                    Reset to Real IP
                </Button>
                <div className="h-px bg-gray-200 my-2"></div>
                <Button variant="danger" onClick={handleResetAttendance} disabled={resetting}>
                    {resetting ? <Loader2 className="animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                    Reset Today's Attendance
                </Button>
            </div>
        </div>
    );
};

export default Settings;
