import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, limit, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc, getDocs } from 'firebase/firestore';
import { Html5Qrcode } from 'html5-qrcode';
import { QrCode, CheckCircle, Loader2, WifiOff, Smartphone, RefreshCw } from 'lucide-react';
import { db } from '../../config/firebase';
import { getTodayDateString } from '../../utils/dateUtils';
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
            collection(db, 'daily_codes'),
            orderBy('timestamp', 'desc'),
            limit(1)
        );

        const unsubCode = onSnapshot(qCode, (snap) => {
            console.log("Daily codes snapshot received, docs:", snap.docs.length);
            if (!snap.empty) {
                const data = snap.docs[0].data();
                console.log("Latest code data:", data);
                if (data.dateString === getTodayDateString()) {
                    setDailyCode(data);
                } else {
                    console.log("Code is from a different day:", data.dateString, "vs", getTodayDateString());
                    setDailyCode(null);
                }
            } else {
                console.log("No daily codes found");
                setDailyCode(null);
            }
        }, (err) => {
            console.error("Error fetching daily codes:", err);
            setErrorMessage("Unable to fetch QR code: " + err.message);
        });

        const todayStr = getTodayDateString();
        const qAttendance = query(
            collection(db, 'attendance'),
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
        }, (err) => {
            console.error("Error fetching attendance:", err);
        });

        return () => { unsubCode(); unsubAtt(); };
    }, [user]);

    const handleScan = () => {
        // Enforce school WiFi requirement
        if (allowedSchoolIP && currentIP !== allowedSchoolIP) {
            setStatus('error');
            setErrorMessage(`You must be connected to school WiFi to mark attendance. Your IP: ${currentIP}, Required: ${allowedSchoolIP}`);
            return;
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

                    // Enhanced configuration for better QR detection
                    const config = {
                        fps: 5,  // Lower FPS for better compatibility and performance
                        qrbox: 300,  // Larger square box for easier scanning
                        aspectRatio: 1.0,  // Square aspect ratio
                        disableFlip: false,  // Allow flipping for better detection
                        verbose: true  // Enable logging for debugging
                    };

                    await html5QrCode.start(
                        { facingMode: "environment" },
                        config,
                        (decodedText) => {
                            // Success callback
                            console.log("QR Code detected:", decodedText);
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
                            // Parse error - this fires constantly while scanning, so we can ignore it
                        }
                    );
                    console.log("Scanner started successfully");
                } catch (err) {
                    console.error("Error starting scanner:", err);
                    console.error("Error name:", err.name);
                    console.error("Error message:", err.message);
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
        console.log("Verifying scanned code:", scannedCode);
        console.log("Expected daily code:", dailyCode);

        if (!dailyCode || !dailyCode.code) {
            setStatus('error');
            setErrorMessage("No daily QR code available. Please ask admin to generate today's code.");
            return;
        }

        if (scannedCode === dailyCode.code) {
            console.log("Code matched! Processing attendance...");
            processAttendance();
        } else {
            console.log("Code mismatch. Scanned:", scannedCode, "Expected:", dailyCode.code);
            setStatus('error');
            setErrorMessage(`Invalid QR Code. Scanned: "${scannedCode}" - Please scan the correct QR code.`);
        }
    };

    const processAttendance = async () => {
        setStatus('processing');

        // Final IP verification before saving (security check)
        if (allowedSchoolIP && currentIP !== allowedSchoolIP) {
            setStatus('error');
            setErrorMessage(`Network verification failed. You must be on school WiFi. Your IP: ${currentIP}`);
            return;
        }

        try {
            await addDoc(collection(db, 'attendance'), {
                timestamp: serverTimestamp(),
                dateString: getTodayDateString(),
                userName: user.displayName,
                userId: user.uid,
                ipAddress: currentIP,
                method: 'qr_verified',
                qrCodeUsed: dailyCode.code,
                networkVerified: currentIP === allowedSchoolIP
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
            const today = getTodayDateString();
            const q = query(
                collection(db, 'attendance'),
                where('userId', '==', user.uid),
                where('dateString', '==', today)
            );
            const snapshot = await getDocs(q);
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
                    {/* Warning: Not on school WiFi */}
                    {allowedSchoolIP && currentIP !== allowedSchoolIP && (
                        <div className="w-full bg-red-50 border border-red-200 p-4 rounded-xl mb-6 text-center">
                            <p className="text-red-700 font-bold mb-1">🚫 Not on School WiFi</p>
                            <p className="text-xs text-red-600">
                                You must be connected to school WiFi to mark attendance.<br />
                                Your IP: <span className="font-mono">{currentIP}</span><br />
                                Required: <span className="font-mono">{allowedSchoolIP}</span>
                            </p>
                        </div>
                    )}

                    {!dailyCode && (
                        <div className="w-full bg-yellow-50 border border-yellow-200 p-4 rounded-xl mb-6 text-center">
                            <p className="text-yellow-700 font-medium mb-1">⏳ Waiting for Today's QR Code</p>
                            <p className="text-xs text-yellow-600">
                                The admin has not generated today's attendance QR code yet.<br />
                                Please wait or ask your admin to generate the code.
                            </p>
                        </div>
                    )}
                    <div className="w-full bg-blue-50 border border-blue-100 rounded-2xl p-8 mb-6 flex flex-col items-center justify-center aspect-square max-h-80 relative">
                        <QrCode className="w-32 h-32 text-blue-300 mb-4 opacity-50" />
                        <p className="text-center text-blue-800 font-medium z-10">
                            Locate the QR Code on the<br />Admin Screen
                        </p>
                    </div>
                    <Button
                        onClick={handleScan}
                        disabled={!dailyCode || (allowedSchoolIP && currentIP !== allowedSchoolIP)}
                        className="w-full py-4 text-lg shadow-lg shadow-blue-200"
                    >
                        <Smartphone className="w-5 h-5" />
                        {!dailyCode
                            ? 'Waiting for QR Code...'
                            : (allowedSchoolIP && currentIP !== allowedSchoolIP)
                                ? 'Connect to School WiFi First'
                                : 'Scan QR Code'
                        }
                    </Button>
                </>
            )}

            {status === 'scanning' && (
                <>
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
                    <div className="w-full bg-blue-50 border border-blue-100 rounded-xl p-4 mt-4">
                        <p className="text-sm font-semibold text-blue-800 mb-2">📱 Scanning Tips:</p>
                        <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
                            <li>Hold your phone steady and keep the QR code in the green box</li>
                            <li>Keep about 6-12 inches away from the screen</li>
                            <li>Make sure there's good lighting (no glare)</li>
                            <li>Wait a few seconds - scanning can take 2-5 seconds</li>
                        </ul>
                    </div>
                </>
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
