import React, { useState } from 'react';
import { LogOut, QrCode, Globe, Users, CalendarDays, LayoutDashboard } from 'lucide-react';
import { SCHOOL_NAME } from '../../utils/constants';
import TabButton from './TabButton';
import AdminQRGenerator from './AdminQRGenerator';
import AdminNetworkConfig from './AdminNetworkConfig';
import AdminDailyReport from './AdminDailyReport';
import AdminMonthlyReport from './AdminMonthlyReport';

const AdminDashboard = ({ user, onLogout, currentIP, allowedSchoolIP }) => {
    const [activeTab, setActiveTab] = useState('qr');

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-slate-900 text-white shadow-lg sticky top-0 z-20">
                <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                            <LayoutDashboard className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="font-bold text-lg leading-tight">{SCHOOL_NAME}</h1>
                            <p className="text-xs text-slate-400">Admin Console</p>
                        </div>
                    </div>
                    <button onClick={onLogout} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
                        <LogOut className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                <div className="max-w-4xl mx-auto px-4 flex gap-6 text-sm font-medium mt-2 overflow-x-auto">
                    <TabButton active={activeTab === 'qr'} onClick={() => setActiveTab('qr')} icon={<QrCode size={16} />} label="QR Code" />
                    <TabButton active={activeTab === 'network'} onClick={() => setActiveTab('network')} icon={<Globe size={16} />} label="Network" />
                    <TabButton active={activeTab === 'daily'} onClick={() => setActiveTab('daily')} icon={<Users size={16} />} label="Daily Log" />
                    <TabButton active={activeTab === 'monthly'} onClick={() => setActiveTab('monthly')} icon={<CalendarDays size={16} />} label="Reports" />
                </div>
            </div>

            <div className="max-w-4xl mx-auto p-6">
                {activeTab === 'qr' && <AdminQRGenerator />}
                {activeTab === 'network' && <AdminNetworkConfig currentIP={currentIP} allowedSchoolIP={allowedSchoolIP} />}
                {activeTab === 'daily' && <AdminDailyReport />}
                {activeTab === 'monthly' && <AdminMonthlyReport />}
            </div>
        </div>
    );
};

export default AdminDashboard;
