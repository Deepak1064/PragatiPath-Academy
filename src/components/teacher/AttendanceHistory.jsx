import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { History, LogIn, LogOut, AlertTriangle } from 'lucide-react';
import { db } from '../../config/firebase';

const AttendanceHistory = ({ user }) => {
    const [groupedRecords, setGroupedRecords] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        const q = query(
            collection(db, 'attendance'),
            where('userId', '==', user.uid)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            let rawRecords = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            rawRecords.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
            rawRecords = rawRecords.slice(0, 100);

            // Group by date (not just month) to show arrival and leaving together
            const byDate = {};
            rawRecords.forEach(record => {
                if (!record.dateString) return;
                if (!byDate[record.dateString]) {
                    byDate[record.dateString] = { arrival: null, leaving: null, date: record.dateString };
                }
                if (record.type === 'arrival') {
                    byDate[record.dateString].arrival = record;
                } else if (record.type === 'leaving') {
                    byDate[record.dateString].leaving = record;
                } else {
                    // Legacy records without type - treat as arrival
                    if (!byDate[record.dateString].arrival) {
                        byDate[record.dateString].arrival = record;
                    }
                }
            });

            // Group by month
            const groups = {};
            Object.values(byDate).forEach(dayRecord => {
                const timestamp = dayRecord.arrival?.timestamp || dayRecord.leaving?.timestamp;
                if (!timestamp) return;
                const key = timestamp.toDate().toLocaleString('default', { month: 'long', year: 'numeric' });
                if (!groups[key]) groups[key] = [];
                groups[key].push(dayRecord);
            });

            // Sort each month's records by date descending
            Object.keys(groups).forEach(key => {
                groups[key].sort((a, b) => b.date.localeCompare(a.date));
            });

            setGroupedRecords(groups);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    if (loading) return <div className="p-10 text-center text-gray-500">Loading history...</div>;

    const months = Object.keys(groupedRecords);

    const formatTime = (record) => {
        if (!record?.timestamp) return '-';
        return record.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
    };

    // Calculate total late days
    const totalLateDays = Object.values(groupedRecords)
        .flat()
        .filter(r => r.arrival?.isLate).length;

    return (
        <div>
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <History className="w-5 h-5 text-blue-600" /> My Attendance
            </h2>

            {/* Late Days Count Banner */}
            {totalLateDays > 0 && (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6 flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                        <AlertTriangle className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                        <p className="font-bold text-orange-700">Late Days: {totalLateDays}</p>
                        <p className="text-xs text-orange-600">Total days you arrived late</p>
                    </div>
                </div>
            )}

            {months.length === 0 && (
                <div className="text-center text-gray-400 py-10">No attendance records yet</div>
            )}
            {months.map(month => (
                <div key={month} className="mb-6">
                    <div className="flex items-center justify-between mb-3 px-1">
                        <h3 className="font-bold text-gray-700 text-sm">{month}</h3>
                        <span className="text-xs font-medium bg-blue-50 text-blue-600 px-2 py-1 rounded-full">
                            {groupedRecords[month].length} Days
                        </span>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        {groupedRecords[month].map((dayRecord, index) => (
                            <div
                                key={dayRecord.date}
                                className={`px-4 py-3 flex items-center justify-between ${index !== groupedRecords[month].length - 1 ? 'border-b border-gray-100' : ''}`}
                            >
                                <div className="flex items-center gap-2">
                                    <p className="font-medium text-gray-800 text-sm min-w-[90px]">
                                        {formatDate(dayRecord.date)}
                                    </p>
                                    {dayRecord.arrival?.isLate && (
                                        <span className="text-xs bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded font-medium">Late</span>
                                    )}
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-1">
                                        <LogIn className={`w-3 h-3 ${dayRecord.arrival?.isLate ? 'text-orange-600' : dayRecord.arrival ? 'text-green-600' : 'text-gray-300'}`} />
                                        <span className={`text-xs font-semibold ${dayRecord.arrival?.isLate ? 'text-orange-600' : dayRecord.arrival ? 'text-green-600' : 'text-gray-400'}`}>
                                            {formatTime(dayRecord.arrival)}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <LogOut className={`w-3 h-3 ${dayRecord.leaving ? 'text-orange-600' : 'text-gray-300'}`} />
                                        <span className={`text-xs font-semibold ${dayRecord.leaving ? 'text-orange-600' : 'text-gray-400'}`}>
                                            {formatTime(dayRecord.leaving)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default AttendanceHistory;
