import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, limit, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc, getDocs, getDoc } from 'firebase/firestore';
import { Html5Qrcode } from 'html5-qrcode';
import { QrCode, CheckCircle, Loader2, WifiOff, Smartphone, RefreshCw, LogIn, LogOut, Clock, AlertTriangle } from 'lucide-react';
import { db } from '../../config/firebase';
import { getTodayDateString } from '../../utils/dateUtils';
import Button from '../shared/Button';

const AttendanceMarker = ({ user, currentIP, allowedSchoolIP }) => {
    const [status, setStatus] = useState('idle');
    const [errorMessage, setErrorMessage] = useState('');
    const [arrivalRecord, setArrivalRecord] = useState(null);
    const [leavingRecord, setLeavingRecord] = useState(null);
    const [dailyCode, setDailyCode] = useState(null);
    const [cameraPermissionError, setCameraPermissionError] = useState(false);
    const [resetting, setResetting] = useState(false);
    const [attendanceType, setAttendanceType] = useState(null); // 'arrival' or 'leaving'
    const [isLate, setIsLate] = useState(false);

    useEffect(() => {
        const qCode = query(
            collection(db, 'daily_codes'),
            orderBy('timestamp', 'desc'),
            limit(1)
        );

        const unsubCode = onSnapshot(qCode, (snap) => {
            if (!snap.empty) {
                const data = snap.docs[0].data();
                if (data.dateString === getTodayDateString()) {
                    setDailyCode(data);
                } else {
                    setDailyCode(null);
                }
            } else {
                setDailyCode(null);
            }
        });

        const todayStr = getTodayDateString();
        const qAttendance = query(
            collection(db, 'attendance'),
            where('userId', '==', user.uid),
            where('dateString', '==', todayStr)
        );

        const unsubAtt = onSnapshot(qAttendance, (snap) => {
            const records = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            const arrival = records.find(r => r.type === 'arrival');
            const leaving = records.find(r => r.type === 'leaving');
            setArrivalRecord(arrival || null);
            setLeavingRecord(leaving || null);
        });

        return () => { unsubCode(); unsubAtt(); };
    }, [user]);

    const handleScan = (type) => {
        if (allowedSchoolIP && currentIP !== allowedSchoolIP) {
            setStatus('error');
            setErrorMessage(`You must be connected to school WiFi to mark attendance. Your IP: ${currentIP}, Required: ${allowedSchoolIP}`);
            return;
        }
        setAttendanceType(type);
        setStatus('scanning');
        setCameraPermissionError(false);
    };

    useEffect(() => {
        let html5QrCode = null;

        if (status === 'scanning') {
            const startScanner = async () => {
                try {
                    html5QrCode = new Html5Qrcode("reader");
                    const config = {
                        fps: 5,
                        qrbox: 300,
                        aspectRatio: 1.0,
                        disableFlip: false,
                        verbose: true
                    };

                    await html5QrCode.start(
                        { facingMode: "environment" },
                        config,
                        (decodedText) => {
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
                            html5QrCode.stop().then(() => {
                                html5QrCode.clear();
                            }).catch(err => console.error("Failed to stop scanner", err));
                        },
                        () => { }
                    );
                } catch (err) {
                    console.error("Error starting scanner:", err);
                    setCameraPermissionError(true);
                    setStatus('idle');
                    setAttendanceType(null);
                }
            };
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
        if (!dailyCode || !dailyCode.code) {
            setStatus('error');
            setErrorMessage("No daily QR code available. Please ask admin to generate today's code.");
            return;
        }

        if (scannedCode === dailyCode.code) {
            processAttendance();
        } else {
            setStatus('error');
            setErrorMessage(`Invalid QR Code. Please scan the correct QR code.`);
        }
    };

    const processAttendance = async () => {
        setStatus('processing');
        setIsLate(false);

        if (allowedSchoolIP && currentIP !== allowedSchoolIP) {
            setStatus('error');
            setErrorMessage(`Network verification failed. You must be on school WiFi.`);
            return;
        }

        try {
            // Check if arrival is late
            let lateStatus = false;
            if (attendanceType === 'arrival') {
                let arrivalTime = null;
                let graceMinutes = 15;

                // First check for personalized timing in teacher profile
                const profileDoc = await getDoc(doc(db, 'teacher_profiles', user.uid));
                if (profileDoc.exists()) {
                    const profile = profileDoc.data();
                    if (profile.customArrivalTime) {
                        arrivalTime = profile.customArrivalTime;
                    }
                }

                // Fallback to school-wide settings if no personalized timing
                if (!arrivalTime) {
                    const settingsDoc = await getDoc(doc(db, 'settings', 'holidays'));
                    if (settingsDoc.exists()) {
                        const settings = settingsDoc.data();
                        arrivalTime = settings.arrivalTime || '09:00';
                        graceMinutes = settings.graceMinutes ?? 15;
                    }
                }

                // Calculate if late
                if (arrivalTime) {
                    const [arrivalHour, arrivalMin] = arrivalTime.split(':').map(Number);
                    const maxArrivalMinutes = arrivalHour * 60 + arrivalMin + graceMinutes;

                    const now = new Date();
                    const currentMinutes = now.getHours() * 60 + now.getMinutes();

                    lateStatus = currentMinutes > maxArrivalMinutes;
                    setIsLate(lateStatus);
                }
            }

            await addDoc(collection(db, 'attendance'), {
                timestamp: serverTimestamp(),
                dateString: getTodayDateString(),
                userName: user.displayName,
                userId: user.uid,
                ipAddress: currentIP,
                method: 'qr_verified',
                qrCodeUsed: dailyCode.code,
                networkVerified: currentIP === allowedSchoolIP,
                type: attendanceType, // 'arrival' or 'leaving'
                isLate: attendanceType === 'arrival' ? lateStatus : false
            });
            setStatus('success');
        } catch (error) {
            console.error(error);
            setStatus('error');
            setErrorMessage("Database Error: Could not save attendance.");
        }
    };

    const handleReset = async () => {
        if (!confirm("Reset today's attendance to test again?")) return;
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
            setArrivalRecord(null);
            setLeavingRecord(null);
            setStatus('idle');
        } catch (e) {
            console.error(e);
            alert("Failed to reset: " + e.message);
        }
        setResetting(false);
    };

    const canScanArrival = !arrivalRecord;
    const canScanLeaving = arrivalRecord && !leavingRecord;
    const allDone = arrivalRecord && leavingRecord;

    // Show success screen briefly then return to main view
    useEffect(() => {
        if (status === 'success') {
            const timer = setTimeout(() => {
                setStatus('idle');
                setAttendanceType(null);
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [status]);

    return (
        <div className="flex flex-col items-center">
            {cameraPermissionError && (
                <div className="w-full bg-red-50 border border-red-100 p-4 rounded-xl mb-6 text-center">
                    <p className="text-red-600 font-bold mb-1">Camera Access Denied</p>
                    <p className="text-xs text-red-500">
                        Please allow camera permissions in your browser settings.
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
                                Your IP: <span className="font-mono">{currentIP}</span>
                            </p>
                        </div>
                    )}

                    {!dailyCode && (
                        <div className="w-full bg-yellow-50 border border-yellow-200 p-4 rounded-xl mb-6 text-center">
                            <p className="text-yellow-700 font-medium mb-1">⏳ Waiting for Today's QR Code</p>
                            <p className="text-xs text-yellow-600">
                                The admin has not generated today's attendance QR code yet.
                            </p>
                        </div>
                    )}

                    {/* Status Cards */}
                    <div className="w-full grid grid-cols-2 gap-4 mb-6">
                        <div className={`p-4 rounded-xl border-2 ${arrivalRecord?.isLate ? 'bg-orange-50 border-orange-200' : arrivalRecord ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                            <div className="flex items-center gap-2 mb-2">
                                <LogIn className={`w-5 h-5 ${arrivalRecord?.isLate ? 'text-orange-600' : arrivalRecord ? 'text-green-600' : 'text-gray-400'}`} />
                                <span className={`font-semibold ${arrivalRecord?.isLate ? 'text-orange-700' : arrivalRecord ? 'text-green-700' : 'text-gray-600'}`}>Arrival</span>
                                {arrivalRecord?.isLate && (
                                    <span className="text-xs bg-orange-200 text-orange-700 px-1.5 py-0.5 rounded font-medium">Late</span>
                                )}
                            </div>
                            {arrivalRecord ? (
                                <p className={`text-lg font-bold ${arrivalRecord?.isLate ? 'text-orange-600' : 'text-green-600'}`}>
                                    {arrivalRecord.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            ) : (
                                <p className="text-sm text-gray-400">Not marked</p>
                            )}
                        </div>

                        <div className={`p-4 rounded-xl border-2 ${leavingRecord ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-gray-200'}`}>
                            <div className="flex items-center gap-2 mb-2">
                                <LogOut className={`w-5 h-5 ${leavingRecord ? 'text-orange-600' : 'text-gray-400'}`} />
                                <span className={`font-semibold ${leavingRecord ? 'text-orange-700' : 'text-gray-600'}`}>Leaving</span>
                            </div>
                            {leavingRecord ? (
                                <p className="text-lg font-bold text-orange-600">
                                    {leavingRecord.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            ) : (
                                <p className="text-sm text-gray-400">Not marked</p>
                            )}
                        </div>
                    </div>

                    {allDone ? (
                        <div className="w-full bg-green-50 border border-green-200 rounded-xl p-6 text-center">
                            <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
                            <h3 className="text-lg font-bold text-green-700">All Done for Today!</h3>
                            <p className="text-sm text-green-600 mt-1">Both arrival and leaving attendance marked.</p>
                        </div>
                    ) : (
                        <>
                            <div className="w-full bg-blue-50 border border-blue-100 rounded-2xl p-8 mb-6 flex flex-col items-center justify-center aspect-square max-h-60 relative">
                                <QrCode className="w-24 h-24 text-blue-300 mb-4 opacity-50" />
                                <p className="text-center text-blue-800 font-medium">
                                    Scan QR Code from Admin Screen
                                </p>
                            </div>

                            <div className="w-full space-y-3">
                                <Button
                                    onClick={() => handleScan('arrival')}
                                    disabled={!canScanArrival || !dailyCode || (allowedSchoolIP && currentIP !== allowedSchoolIP)}
                                    className={`w-full py-4 text-lg ${canScanArrival ? 'bg-green-600 hover:bg-green-700 shadow-lg shadow-green-200' : ''}`}
                                >
                                    <LogIn className="w-5 h-5" />
                                    {arrivalRecord ? '✓ Arrival Marked' : 'Mark Arrival'}
                                </Button>

                                <Button
                                    onClick={() => handleScan('leaving')}
                                    disabled={!canScanLeaving || !dailyCode || (allowedSchoolIP && currentIP !== allowedSchoolIP)}
                                    className={`w-full py-4 text-lg ${canScanLeaving ? 'bg-orange-600 hover:bg-orange-700 shadow-lg shadow-orange-200' : 'bg-gray-300'}`}
                                >
                                    <LogOut className="w-5 h-5" />
                                    {leavingRecord ? '✓ Leaving Marked' : 'Mark Leaving'}
                                </Button>
                            </div>
                        </>
                    )}

                    {(arrivalRecord || leavingRecord) && (
                        <div className="mt-6">
                            <Button variant="ghost" onClick={handleReset} disabled={resetting} className="text-xs text-gray-400 hover:text-red-500">
                                {resetting ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                                Test Mode: Reset Today's Attendance
                            </Button>
                        </div>
                    )}
                </>
            )}

            {status === 'scanning' && (
                <>
                    <div className="w-full mb-4">
                        <div className={`px-4 py-2 rounded-lg text-center font-semibold ${attendanceType === 'arrival' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                            }`}>
                            {attendanceType === 'arrival' ? '📥 Marking Arrival' : '📤 Marking Leaving'}
                        </div>
                    </div>
                    <div className="w-full bg-black rounded-2xl overflow-hidden relative">
                        <div id="reader" className="w-full h-64 bg-black"></div>
                        <Button
                            onClick={() => { setStatus('idle'); setAttendanceType(null); }}
                            variant="secondary"
                            className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 opacity-80 hover:opacity-100"
                        >
                            Cancel Scan
                        </Button>
                    </div>
                    <div className="w-full bg-blue-50 border border-blue-100 rounded-xl p-4 mt-4">
                        <p className="text-sm font-semibold text-blue-800 mb-2">📱 Scanning Tips:</p>
                        <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
                            <li>Hold your phone steady and keep the QR code in view</li>
                            <li>Keep about 6-12 inches away from the screen</li>
                            <li>Make sure there's good lighting (no glare)</li>
                        </ul>
                    </div>
                </>
            )}

            {status === 'processing' && (
                <div className="py-20 flex flex-col items-center">
                    <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
                    <p className="text-gray-600">Processing {attendanceType} attendance...</p>
                </div>
            )}

            {status === 'success' && (
                <div className="py-10 flex flex-col items-center text-center animate-in fade-in zoom-in duration-500">
                    <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 ${isLate ? 'bg-orange-100' : attendanceType === 'arrival' ? 'bg-green-100' : 'bg-orange-100'
                        }`}>
                        {isLate ? (
                            <AlertTriangle className="w-12 h-12 text-orange-600" />
                        ) : (
                            <CheckCircle className={`w-12 h-12 ${attendanceType === 'arrival' ? 'text-green-600' : 'text-orange-600'}`} />
                        )}
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800">
                        {attendanceType === 'arrival' ? 'Arrival' : 'Leaving'} Marked!
                    </h2>
                    {isLate && attendanceType === 'arrival' && (
                        <p className="text-orange-600 font-medium mt-2">⚠️ Marked as Late</p>
                    )}
                    <p className="text-gray-500 mt-2">Redirecting...</p>
                </div>
            )}

            {status === 'error' && (
                <div className="w-full py-10 flex flex-col items-center text-center">
                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4">
                        <WifiOff className="w-10 h-10 text-red-500" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Check Failed</h3>
                    <p className="text-gray-600 mb-6 px-4">{errorMessage}</p>
                    <Button onClick={() => { setStatus('idle'); setAttendanceType(null); }} variant="outline">Try Again</Button>
                </div>
            )}
        </div>
    );
};

export default AttendanceMarker;
