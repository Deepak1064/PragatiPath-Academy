import React, { useState } from 'react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Globe, MapPin, ShieldCheck, Lock, Loader2 } from 'lucide-react';
import { db } from '../../config/firebase';
import Button from '../shared/Button';

const AdminNetworkConfig = ({ currentIP, allowedSchoolIP }) => {
    const [saving, setSaving] = useState(false);

    const setIP = async () => {
        setSaving(true);
        try {
            await setDoc(doc(db, 'settings', 'network_config'), {
                schoolIP: currentIP,
                updatedAt: serverTimestamp()
            });
        } catch (e) {
            console.error(e);
        }
        setSaving(false);
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="mb-6 border-b border-gray-100 pb-4">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <Globe className="w-6 h-6 text-blue-600" />
                    Network Security Configuration
                </h2>
                <p className="text-gray-500 mt-1 text-sm">Define the authorized network for attendance.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                        <label className="text-xs font-bold text-blue-600 uppercase tracking-wide">Your Current IP</label>
                        <div className="flex items-center gap-2 mt-1">
                            <MapPin className="w-5 h-5 text-blue-500" />
                            <span className="text-2xl font-mono font-bold text-gray-800">{currentIP || 'Loading...'}</span>
                        </div>
                    </div>
                    <Button onClick={setIP} disabled={saving || !currentIP} className="w-full h-12">
                        {saving ? <Loader2 className="animate-spin" /> : <Lock className="w-4 h-4" />}
                        Set as Allowed School IP
                    </Button>
                    <p className="text-xs text-gray-400 text-center">
                        Clicking this will whitelist your current network for all teachers.
                    </p>
                </div>

                <div className="space-y-4">
                    <div className="bg-green-50 p-4 rounded-lg border border-green-100 h-full">
                        <label className="text-xs font-bold text-green-600 uppercase tracking-wide">Currently Whitelisted IP</label>
                        <div className="flex items-center gap-2 mt-2">
                            <ShieldCheck className="w-8 h-8 text-green-500" />
                            {allowedSchoolIP ? (
                                <span className="text-2xl font-mono font-bold text-gray-800">{allowedSchoolIP}</span>
                            ) : (
                                <span className="text-xl font-mono text-gray-400 italic">Not Configured</span>
                            )}
                        </div>
                        <div className="mt-4 text-sm text-green-800">
                            {allowedSchoolIP === currentIP
                                ? "✅ You are connected to the allowed network."
                                : "⚠️ Your current IP does not match the whitelist."}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminNetworkConfig;
