import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { QRCodeSVG } from 'qrcode.react';
import { Loader2, RefreshCw, CheckCircle } from 'lucide-react';
import { db } from '../../config/firebase';
import { APP_ID } from '../../utils/constants';
import Button from '../shared/Button';

const AdminQRGenerator = () => {
    const [todayCode, setTodayCode] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(
            collection(db, 'artifacts', APP_ID, 'public', 'data', 'daily_codes'),
            orderBy('timestamp', 'desc'),
            limit(5)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const codes = snapshot.docs.map(d => d.data());
            const today = new Date().toLocaleDateString();
            const existing = codes.find(c => c.dateString === today);
            setTodayCode(existing);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const generateCode = async () => {
        setLoading(true);
        const code = Math.random().toString(36).substring(2, 8).toUpperCase();
        try {
            await addDoc(collection(db, 'artifacts', APP_ID, 'public', 'data', 'daily_codes'), {
                code: code,
                timestamp: serverTimestamp(),
                dateString: new Date().toLocaleDateString(),
                active: true
            });
        } catch (e) {
            console.error("Error generating code", e);
        }
        setLoading(false);
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 flex flex-col items-center text-center animate-in fade-in slide-in-from-bottom-4">
            <div className="w-full max-w-lg">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Daily Attendance QR</h2>
                <p className="text-gray-500 mb-8">Project this screen. Teachers must be on School WiFi to scan.</p>

                {loading ? (
                    <div className="h-64 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                    </div>
                ) : todayCode ? (
                    <div className="bg-blue-50 border-4 border-blue-100 rounded-3xl p-10 mb-6 shadow-xl">
                        <div className="mb-6 relative flex justify-center">
                            <QRCodeSVG
                                value={JSON.stringify({ type: 'school_attendance', code: todayCode.code })}
                                size={256}
                                level="H"
                                includeMargin={true}
                                className="mx-auto"
                            />
                        </div>
                        <div className="bg-white border border-blue-200 rounded-lg py-3 px-6 inline-block shadow-sm">
                            <span className="text-sm text-gray-400 font-bold uppercase tracking-wider block text-xs mb-1">Today's Security Code</span>
                            <span className="text-4xl font-mono font-black text-blue-600 tracking-widest">{todayCode.code}</span>
                        </div>
                        <p className="text-sm text-green-600 font-medium mt-6 flex items-center justify-center gap-2">
                            <CheckCircle className="w-5 h-5" /> Active for {new Date().toLocaleDateString()}
                        </p>
                    </div>
                ) : (
                    <div className="py-12 border-2 border-dashed border-gray-200 rounded-2xl mb-6 bg-gray-50/50">
                        <p className="text-gray-400 mb-4">No code generated for today.</p>
                        <Button onClick={generateCode} size="lg" className="mx-auto shadow-xl shadow-blue-100">
                            <RefreshCw className="w-4 h-4" /> Generate New Code
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminQRGenerator;
