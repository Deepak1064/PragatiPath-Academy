import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, limit, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { Html5Qrcode } from 'html5-qrcode';
import { QrCode, CheckCircle, Loader2, WifiOff, Smartphone, RefreshCw } from 'lucide-react';
import { db } from '../../config/firebase';
import { APP_ID } from '../../utils/constants';
import Button from '../shared/Button';

const AttendanceMarker = ({ user, currentIP, allowedSchoolIP }) => {
    const [status, setStatus] = useState('idle');
    const [errorMessage, setErrorMessage] = useState('');
    const [todayRecord, setTodayRecord] = useState(null);
    const [dailyCode, setDailyCode] = useState(null);
    const [cameraPermissionError, setCameraPermissionError] = useState(false);
    const [resetting, setResetting] = useState(false);

    useEffect(() => {
        const qCode = query(
            collection(db, 'artifacts', APP_ID, 'public', 'data', 'daily_codes'),
            orderBy('timestamp', 'desc'),
            limit(1)
        );

        const unsubCode = onSnapshot(qCode, (snap) => {
            if (!snap.empty) {
                const data = snap.docs[0].data();
                if (data.dateString === new Date().toLocaleDateString()) {
                    setDailyCode(data);
                } else {
                    setDailyCode(null);
                }
            }
        });

        const todayStr = new Date().toLocaleDateString();
        const qAttendance = query(
            collection(db, 'artifacts', APP_ID, 'public', 'data', 'attendance'),
            where('userId', '==', user.uid)
        );

        const unsubAtt = onSnapshot(qAttendance, (snap) => {
            const myRecs = snap.docs.map(d => d.data());
            myRecs.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
            const found = myRecs.find(r => r.dateString === todayStr);
            if (found) {
                setTodayRecord(found);
                setStatus('success');
            }
        });

        return () => { unsubCode(); unsubAtt(); };
    }, [user]);

    const handleScan = () => {
        if (!allowedSchoolIP) {
            // Network not configured yet, but allow scanning
        }
        setStatus('scanning');
        setCameraPermissionError(false);
    };

    useEffect(() => {
        let html5QrCode = null;

        if (status === 'scanning') {
            const startScanner = async () => {
                try {
                    html5QrCode = new Html5Qrcode("reader");
                    await html5QrCode.start(
                        { facingMode: "environment" },
                        {
                            fps: 10,
                            qrbox: { width: 250, height: 250 }
                        },
                        (decodedText) => {
                            // Success callback
                            try {
                                const data = JSON.parse(decodedText);
                                if (data.type === 'school_attendance' && data.code) {
                                    handleVerify(data.code);
                                } else {
                                    handleVerify(decodedText);
                                }
                            } catch (e) {
                                handleVerify(decodedText);
                            }
                            // Stop scanning after success
                            html5QrCode.stop().then(() => {
                                html5QrCode.clear();
                            }).catch(err => console.error("Failed to stop scanner", err));
                        },
                        (errorMessage) => {
                            // parse error, ignore it.
                        }
                    );
                } catch (err) {
                    console.error("Error starting scanner", err);
                    setCameraPermissionError(true);
                    setStatus('idle');
                }
            };

            // Small delay to ensure DOM is ready
            setTimeout(startScanner, 100);
        }

        return () => {
            if (html5QrCode && html5QrCode.isScanning) {
                html5QrCode.stop().then(() => {
                    html5QrCode.clear();
                }).catch(err => console.error("Failed to stop scanner on cleanup", err));
            }
        };
    }, [status]);

    const handleVerify = (scannedCode) => {
        if (scannedCode === dailyCode.code) {
            processAttendance();
        } else {
            setStatus('error');
            setErrorMessage("Invalid QR Code. Please try again.");
        }
    };

    const processAttendance = async () => {
        setStatus('processing');
        try {
            await addDoc(collection(db, 'artifacts', APP_ID, 'public', 'data', 'attendance'), {
                timestamp: serverTimestamp(),
                dateString: new Date().toLocaleDateString(),
                userName: user.displayName,
                userId: user.uid,
                ipAddress: currentIP,
                method: 'qr_verified',
                qrCodeUsed: dailyCode.code
            });
        } catch (error) {
            console.error(error);
            setStatus('error');
            setErrorMessage("Database Error: Could not save attendance.");
        }
    };

    const handleReset = async () => {
        if (!confirm("Reset attendance to test scanning again?")) return;
        setResetting(true);
        try {
            const today = new Date().toLocaleDateString();
            const q = query(
                collection(db, 'artifacts', APP_ID, 'public', 'data', 'attendance'),
                where('userId', '==', user.uid),
                where('dateString', '==', today)
            );
            const snapshot = await (await import('firebase/firestore')).getDocs(q);
            const deletePromises = snapshot.docs.map(d => deleteDoc(d.ref));
            await Promise.all(deletePromises);
            setTodayRecord(null);
            setStatus('idle');
        } catch (e) {
            console.error(e);
            alert("Failed to reset: " + e.message);
        }
        setResetting(false);
    };

    if (todayRecord) {
        return (
            <div className="flex flex-col items-center justify-center py-10 text-center animate-in fade-in zoom-in duration-500">
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle className="w-12 h-12 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Attendance Marked!</h2>
                <div className="mt-6 bg-white border border-gray-100 shadow-sm px-6 py-4 rounded-xl w-full">
                    <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-500">Time:</span>
                        <span className="font-medium text-gray-800">{todayRecord.timestamp?.toDate().toLocaleTimeString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Code:</span>
                        <span className="font-mono bg-gray-100 px-2 rounded text-xs py-0.5">{todayRecord.qrCodeUsed || 'STATIC'}</span>
                    </div>
                </div>

                <div className="mt-8">
                    <Button variant="ghost" onClick={handleReset} disabled={resetting} className="text-xs text-gray-400 hover:text-red-500">
                        {resetting ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                        Test Mode: Reset & Scan Again
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center">
            {cameraPermissionError && (
                <div className="w-full bg-red-50 border border-red-100 p-4 rounded-xl mb-6 text-center">
                    <p className="text-red-600 font-bold mb-1">Camera Access Denied</p>
                    <p className="text-xs text-red-500">
                        Please allow camera permissions in your browser settings. <br />
                        Note: Camera only works on HTTPS or Localhost.
                    </p>
                </div>
            )}

            {status === 'idle' && (
                <>
                    <div className="w-full bg-blue-50 border border-blue-100 rounded-2xl p-8 mb-6 flex flex-col items-center justify-center aspect-square max-h-80 relative">
                        <QrCode className="w-32 h-32 text-blue-300 mb-4 opacity-50" />
                        <p className="text-center text-blue-800 font-medium z-10">
                            Locate the QR Code on the<br />Admin Screen
                        </p>
                    </div>
                    <Button onClick={handleScan} className="w-full py-4 text-lg shadow-lg shadow-blue-200">
                        <Smartphone className="w-5 h-5" />
                        Scan QR Code
                    </Button>
                </>
            )}

            {status === 'scanning' && (
                <div className="w-full bg-black rounded-2xl overflow-hidden relative">
                    <div id="reader" className="w-full h-64 bg-black"></div>
                    <Button
                        onClick={() => setStatus('idle')}
                        variant="secondary"
                        className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 opacity-80 hover:opacity-100"
                    >
                        Cancel Scan
                    </Button>
                </div>
            )}

            {status === 'processing' && (
                <div className="py-20 flex flex-col items-center">
                    <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
                    <p className="text-gray-600">Verifying Network Security...</p>
                </div>
            )}

            {status === 'error' && (
                <div className="w-full py-10 flex flex-col items-center text-center">
                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4">
                        <WifiOff className="w-10 h-10 text-red-500" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Check Failed</h3>
                    <p className="text-gray-600 mb-6 px-4">{errorMessage}</p>
                    <Button onClick={() => setStatus('idle')} variant="outline">Try Again</Button>
                </div>
            )}
        </div>
    );
};

export default AttendanceMarker;
