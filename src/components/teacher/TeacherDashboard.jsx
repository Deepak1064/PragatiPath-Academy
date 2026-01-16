import React, { useState } from 'react';
import { LogOut, QrCode, History, Wifi, User } from 'lucide-react';
import { SCHOOL_NAME } from '../../utils/constants';
import NavButton from './NavButton';
import NetworkStatusBanner from './NetworkStatusBanner';
import AttendanceMarker from './AttendanceMarker';
import AttendanceHistory from './AttendanceHistory';
import Settings from './Settings';
import TeacherProfile from './TeacherProfile';

const TeacherDashboard = ({ user, onLogout, currentIP, allowedSchoolIP, fetchIP }) => {
    const [activeTab, setActiveTab] = useState('mark');

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <div className="bg-white shadow-sm px-4 py-4 sticky top-0 z-10">
                <div className="max-w-md mx-auto flex justify-between items-center">
                    <div>
                        <h1 className="font-bold text-gray-800">{SCHOOL_NAME}</h1>
                        <p className="text-xs text-gray-500">
                            {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                        </p>
                    </div>
                    <button onClick={onLogout} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                        <LogOut className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="max-w-md mx-auto p-4">
                <NetworkStatusBanner currentIP={currentIP} allowedSchoolIP={allowedSchoolIP} refreshIP={fetchIP} />

                <div className="mt-6">
                    {activeTab === 'mark' && (
                        <AttendanceMarker
                            user={user}
                            currentIP={currentIP}
                            allowedSchoolIP={allowedSchoolIP}
                        />
                    )}
                    {activeTab === 'history' && (
                        <AttendanceHistory user={user} />
                    )}
                    {activeTab === 'profile' && (
                        <TeacherProfile user={user} />
                    )}
                    {activeTab === 'settings' && (
                        <Settings
                            currentIP={currentIP}
                            fetchIP={fetchIP}
                            user={user}
                        />
                    )}
                </div>
            </div>

            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 flex justify-around items-center z-20 max-w-md mx-auto">
                <NavButton icon={<QrCode />} label="Attend" isActive={activeTab === 'mark'} onClick={() => setActiveTab('mark')} />
                <NavButton icon={<History />} label="History" isActive={activeTab === 'history'} onClick={() => setActiveTab('history')} />
                <NavButton icon={<User />} label="Profile" isActive={activeTab === 'profile'} onClick={() => setActiveTab('profile')} />
                <NavButton icon={<Wifi />} label="Settings" isActive={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
            </div>
        </div>
    );
};

export default TeacherDashboard;

