import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Database, Loader2, CheckCircle, Trash2 } from 'lucide-react';
import Button from '../shared/Button';

const AdminTestData = () => {
    const [loading, setLoading] = useState(false);
    const [teachers, setTeachers] = useState([]);
    const [selectedTeacher, setSelectedTeacher] = useState('');
    const [months, setMonths] = useState(2);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [recordsCreated, setRecordsCreated] = useState(0);

    useEffect(() => {
        loadTeachers();
    }, []);

    const loadTeachers = async () => {
        try {
            const snapshot = await getDocs(collection(db, 'teacher_profiles'));
            const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setTeachers(list);
            if (list.length > 0) setSelectedTeacher(list[0].id);
        } catch (error) {
            console.error('Error loading teachers:', error);
        }
    };

    const generateRandomTime = (hour, minRange) => {
        const minutes = Math.floor(Math.random() * minRange);
        return { hour, minutes };
    };

    const seedAttendance = async () => {
        if (!selectedTeacher) {
            setMessage({ type: 'error', text: 'Please select a teacher' });
            return;
        }

        setLoading(true);
        setMessage({ type: '', text: '' });
        setRecordsCreated(0);

        const teacher = teachers.find(t => t.id === selectedTeacher);
        const today = new Date();
        let count = 0;

        try {
            // Generate records for past N months
            for (let m = 0; m < months; m++) {
                const monthDate = new Date(today.getFullYear(), today.getMonth() - m, 1);
                const daysInMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate();

                // Generate 18-22 attendance days per month (random)
                const attendanceDays = Math.floor(Math.random() * 5) + 18;
                const usedDays = new Set();

                for (let d = 0; d < attendanceDays && usedDays.size < daysInMonth; d++) {
                    let day;
                    do {
                        day = Math.floor(Math.random() * daysInMonth) + 1;
                    } while (usedDays.has(day));
                    usedDays.add(day);

                    const date = new Date(monthDate.getFullYear(), monthDate.getMonth(), day);

                    // Skip Sundays
                    if (date.getDay() === 0) continue;

                    // Skip future dates
                    if (date > today) continue;

                    const dateString = date.toISOString().split('T')[0];

                    // Create arrival record (8:00 - 9:30 AM)
                    const arrivalTime = generateRandomTime(8, 90);
                    const arrivalDate = new Date(date);
                    arrivalDate.setHours(arrivalTime.hour, arrivalTime.minutes, 0, 0);

                    await addDoc(collection(db, 'attendance'), {
                        timestamp: Timestamp.fromDate(arrivalDate),
                        dateString: dateString,
                        userName: teacher.name || 'Unknown',
                        userId: selectedTeacher,
                        ipAddress: '192.168.1.' + Math.floor(Math.random() * 255),
                        method: 'qr_verified',
                        qrCodeUsed: 'TEST_' + dateString,
                        networkVerified: true,
                        type: 'arrival'
                    });
                    count++;

                    // Create leaving record (4:00 - 6:00 PM) - 80% chance
                    if (Math.random() > 0.2) {
                        const leavingTime = generateRandomTime(16, 120);
                        const leavingDate = new Date(date);
                        leavingDate.setHours(leavingTime.hour, leavingTime.minutes, 0, 0);

                        await addDoc(collection(db, 'attendance'), {
                            timestamp: Timestamp.fromDate(leavingDate),
                            dateString: dateString,
                            userName: teacher.name || 'Unknown',
                            userId: selectedTeacher,
                            ipAddress: '192.168.1.' + Math.floor(Math.random() * 255),
                            method: 'qr_verified',
                            qrCodeUsed: 'TEST_' + dateString,
                            networkVerified: true,
                            type: 'leaving'
                        });
                        count++;
                    }

                    setRecordsCreated(count);
                }
            }

            setMessage({ type: 'success', text: `Created ${count} attendance records!` });
        } catch (error) {
            console.error('Error seeding data:', error);
            setMessage({ type: 'error', text: 'Error: ' + error.message });
        }

        setLoading(false);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-purple-600" />
                <h2 className="text-xl font-bold text-gray-800">Test Data Generator</h2>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-700">
                <strong>⚠️ For Testing Only:</strong> This will create dummy attendance records for the selected teacher.
            </div>

            {message.text && (
                <div className={`p-3 rounded-lg text-sm ${message.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
                    }`}>
                    {message.text}
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Teacher</label>
                    <select
                        value={selectedTeacher}
                        onChange={(e) => setSelectedTeacher(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500"
                    >
                        {teachers.map(t => (
                            <option key={t.id} value={t.id}>{t.name || t.email || t.id}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Months to Generate</label>
                    <select
                        value={months}
                        onChange={(e) => setMonths(parseInt(e.target.value))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500"
                    >
                        <option value="1">1 Month</option>
                        <option value="2">2 Months</option>
                        <option value="3">3 Months</option>
                        <option value="6">6 Months</option>
                    </select>
                </div>

                {loading && (
                    <div className="text-center py-4">
                        <Loader2 className="w-6 h-6 text-purple-600 animate-spin mx-auto mb-2" />
                        <p className="text-sm text-gray-500">Creating records... {recordsCreated} created</p>
                    </div>
                )}

                <Button
                    onClick={seedAttendance}
                    disabled={loading || !selectedTeacher}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                >
                    {loading ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Generating...
                        </>
                    ) : (
                        <>
                            <Database className="w-4 h-4" />
                            Generate Test Attendance Data
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
};

export default AdminTestData;
