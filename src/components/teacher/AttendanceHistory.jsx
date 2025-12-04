import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { History } from 'lucide-react';
import { db } from '../../config/firebase';
import { APP_ID } from '../../utils/constants';

const AttendanceHistory = ({ user }) => {
    const [groupedRecords, setGroupedRecords] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        const q = query(
            collection(db, 'artifacts', APP_ID, 'public', 'data', 'attendance'),
            where('userId', '==', user.uid)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            let rawRecords = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            rawRecords.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
            rawRecords = rawRecords.slice(0, 50);

            const groups = {};
            rawRecords.forEach(record => {
                if (!record.timestamp) return;
                const key = record.timestamp.toDate().toLocaleString('default', { month: 'long', year: 'numeric' });
                if (!groups[key]) groups[key] = [];
                groups[key].push(record);
            });
            setGroupedRecords(groups);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    if (loading) return <div className="p-10 text-center text-gray-500">Loading history...</div>;

    const months = Object.keys(groupedRecords);

    return (
        <div>
            <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                <History className="w-5 h-5 text-blue-600" /> My Attendance
            </h2>
            {months.map(month => (
                <div key={month} className="mb-6">
                    <div className="flex items-center justify-between mb-3 px-1">
                        <h3 className="font-bold text-gray-700 text-sm">{month}</h3>
                        <span className="text-xs font-medium bg-blue-50 text-blue-600 px-2 py-1 rounded-full">
                            {groupedRecords[month].length} Days
                        </span>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        {groupedRecords[month].map((record, index) => (
                            <div
                                key={record.id}
                                className={`p-4 flex justify-between items-center ${index !== groupedRecords[month].length - 1 ? 'border-b border-gray-50' : ''
                                    }`}
                            >
                                <div>
                                    <p className="font-medium text-gray-800 text-sm">
                                        {record.timestamp?.toDate().toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' })}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-semibold text-blue-600">
                                        {record.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
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
