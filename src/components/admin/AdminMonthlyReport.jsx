import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { APP_ID } from '../../utils/constants';

const AdminMonthlyReport = () => {
    const [stats, setStats] = useState([]);
    const [selectedMonth] = useState(new Date().toLocaleString('default', { month: 'long', year: 'numeric' }));

    useEffect(() => {
        const q = query(
            collection(db, 'artifacts', APP_ID, 'public', 'data', 'attendance'),
            orderBy('timestamp', 'desc'),
            limit(500)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const all = snapshot.docs
                .map(d => d.data())
                .filter(r => r.timestamp && r.timestamp.toDate().toLocaleString('default', { month: 'long', year: 'numeric' }) === selectedMonth);

            const userStats = {};
            all.forEach(r => {
                if (!userStats[r.userId]) userStats[r.userId] = { name: r.userName, days: 0 };
                userStats[r.userId].days += 1;
            });
            setStats(Object.values(userStats).sort((a, b) => b.days - a.days));
        });

        return () => unsubscribe();
    }, [selectedMonth]);

    return (
        <div className="space-y-4">
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex justify-between">
                <span className="font-semibold text-gray-600">{selectedMonth}</span>
                <span className="text-sm font-bold text-gray-800">
                    {stats.reduce((acc, curr) => acc + curr.days, 0)} Total Records
                </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {stats.map((stat, idx) => (
                    <div key={idx} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                        <h3 className="font-bold text-gray-800">{stat.name}</h3>
                        <div className="text-center bg-blue-50 px-4 py-2 rounded-lg border border-blue-100">
                            <span className="block text-2xl font-bold text-blue-600">{stat.days}</span>
                            <span className="text-[10px] text-blue-400 uppercase font-bold tracking-wider">Days</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AdminMonthlyReport;
