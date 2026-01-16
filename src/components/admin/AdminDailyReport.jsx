import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { getTodayDateString } from '../../utils/dateUtils';
import { User, LogIn, LogOut } from 'lucide-react';

const AdminDailyReport = ({ onViewEmployee }) => {
    const [groupedRecords, setGroupedRecords] = useState({});
    const [profiles, setProfiles] = useState({});

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
        const today = getTodayDateString();
        const q = query(
            collection(db, 'attendance'),
            orderBy('timestamp', 'desc'),
            limit(200)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const all = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            const todayRecords = all.filter(r => r.dateString === today);

            // Group by userId
            const byUser = {};
            todayRecords.forEach(record => {
                if (!byUser[record.userId]) {
                    byUser[record.userId] = { userId: record.userId, arrival: null, leaving: null };
                }
                if (record.type === 'arrival') {
                    byUser[record.userId].arrival = record;
                } else if (record.type === 'leaving') {
                    byUser[record.userId].leaving = record;
                } else {
                    // Legacy record without type
                    if (!byUser[record.userId].arrival) {
                        byUser[record.userId].arrival = record;
                    }
                }
            });

            setGroupedRecords(byUser);
        });

        return () => unsubscribe();
    }, []);

    const getDisplayName = (userId) => {
        const profile = profiles[userId];
        return profile?.name || 'Unknown';
    };

    const handleNameClick = (userId) => {
        const profile = profiles[userId];
        if (profile && onViewEmployee) {
            onViewEmployee(profile);
        }
    };

    const formatTime = (record) => {
        if (!record?.timestamp) return '-';
        return record.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const userIds = Object.keys(groupedRecords);
    const presentCount = userIds.filter(id => groupedRecords[id].arrival).length;

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="font-bold text-gray-800 text-lg">Today's Attendance</h2>
                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                    {presentCount} Present
                </span>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 uppercase text-xs">
                            <tr>
                                <th className="px-6 py-4 font-semibold">Teacher</th>
                                <th className="px-6 py-4 font-semibold text-center">
                                    <div className="flex items-center justify-center gap-1">
                                        <LogIn className="w-3 h-3" /> Arrival
                                    </div>
                                </th>
                                <th className="px-6 py-4 font-semibold text-center">
                                    <div className="flex items-center justify-center gap-1">
                                        <LogOut className="w-3 h-3" /> Leaving
                                    </div>
                                </th>
                                <th className="px-6 py-4 font-semibold text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {userIds.map(userId => {
                                const data = groupedRecords[userId];
                                return (
                                    <tr key={userId} className="hover:bg-gray-50/50">
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => handleNameClick(userId)}
                                                className="flex items-center gap-2 text-left hover:text-blue-600 transition-colors"
                                            >
                                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden">
                                                    {profiles[userId]?.profilePicture ? (
                                                        <img src={profiles[userId].profilePicture} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <User className="w-4 h-4 text-blue-600" />
                                                    )}
                                                </div>
                                                <span className="font-medium text-gray-900 hover:text-blue-600">
                                                    {getDisplayName(userId)}
                                                </span>
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`font-semibold ${data.arrival ? 'text-green-600' : 'text-gray-300'}`}>
                                                {formatTime(data.arrival)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`font-semibold ${data.leaving ? 'text-orange-600' : 'text-gray-300'}`}>
                                                {formatTime(data.leaving)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {data.arrival && data.leaving ? (
                                                <span className="text-green-600 bg-green-50 px-2 py-1 rounded-md text-xs font-medium border border-green-100">
                                                    Complete
                                                </span>
                                            ) : data.arrival ? (
                                                <span className="text-blue-600 bg-blue-50 px-2 py-1 rounded-md text-xs font-medium border border-blue-100">
                                                    At Work
                                                </span>
                                            ) : (
                                                <span className="text-gray-400 bg-gray-50 px-2 py-1 rounded-md text-xs font-medium border border-gray-100">
                                                    Pending
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                            {userIds.length === 0 && (
                                <tr>
                                    <td colSpan="4" className="px-6 py-12 text-center text-gray-400">
                                        No attendance today.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminDailyReport;
