import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { User } from 'lucide-react';

const AdminMonthlyReport = ({ onViewEmployee }) => {
    const [stats, setStats] = useState([]);
    const [profiles, setProfiles] = useState({});
    const [selectedMonth] = useState(new Date().toLocaleString('default', { month: 'long', year: 'numeric' }));

    // Fetch all teacher profiles for name lookup
    useEffect(() => {
        const fetchProfiles = async () => {
            try {
                const snapshot = await getDocs(collection(db, 'teacher_profiles'));
                const profileMap = {};
                snapshot.docs.forEach(doc => {
                    profileMap[doc.id] = { id: doc.id, ...doc.data() };
                });
                setProfiles(profileMap);
            } catch (error) {
                console.error('Error fetching profiles:', error);
            }
        };
        fetchProfiles();
    }, []);

    useEffect(() => {
        const q = query(
            collection(db, 'attendance'),
            orderBy('timestamp', 'desc'),
            limit(500)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const all = snapshot.docs
                .map(d => ({ id: d.id, ...d.data() }))
                .filter(r => r.timestamp && r.timestamp.toDate().toLocaleString('default', { month: 'long', year: 'numeric' }) === selectedMonth);

            const userStats = {};
            all.forEach(r => {
                if (!userStats[r.userId]) userStats[r.userId] = { userId: r.userId, name: r.userName, days: 0 };
                userStats[r.userId].days += 1;
            });
            setStats(Object.values(userStats).sort((a, b) => b.days - a.days));
        });

        return () => unsubscribe();
    }, [selectedMonth]);

    // Get current name from profile
    const getDisplayName = (stat) => {
        const profile = profiles[stat.userId];
        return profile?.name || stat.name || 'Unknown';
    };

    const handleNameClick = (stat) => {
        const profile = profiles[stat.userId];
        if (profile && onViewEmployee) {
            onViewEmployee(profile);
        }
    };

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
                        <button
                            onClick={() => handleNameClick(stat)}
                            className="flex items-center gap-3 text-left hover:text-blue-600 transition-colors"
                        >
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden">
                                {profiles[stat.userId]?.profilePicture ? (
                                    <img src={profiles[stat.userId].profilePicture} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <User className="w-5 h-5 text-blue-600" />
                                )}
                            </div>
                            <h3 className="font-bold text-gray-800">{getDisplayName(stat)}</h3>
                        </button>
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

