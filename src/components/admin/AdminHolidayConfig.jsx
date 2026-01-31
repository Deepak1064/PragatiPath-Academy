import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Calendar, Plus, Loader2, Save, Trash2, Clock } from 'lucide-react';
import Button from '../shared/Button';

const WEEKDAYS = [
    { value: 0, label: 'Sunday' },
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' }
];

const AdminHolidayConfig = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Weekly offs (0 = Sunday, 1 = Monday, etc.)
    const [weeklyOffs, setWeeklyOffs] = useState([0]); // Sunday default

    // Custom holidays (dates)
    const [holidays, setHolidays] = useState([]);
    const [newHolidayDate, setNewHolidayDate] = useState('');
    const [newHolidayName, setNewHolidayName] = useState('');

    // School timings
    const [arrivalTime, setArrivalTime] = useState('09:00'); // Default 9 AM
    const [leavingTime, setLeavingTime] = useState('17:00'); // Default 5 PM
    const [graceMinutes, setGraceMinutes] = useState(15); // Grace period in minutes

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        setLoading(true);
        try {
            const docRef = doc(db, 'settings', 'holidays');
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                setWeeklyOffs(data.weeklyOffs || [0]);
                setHolidays(data.holidays || []);
                setArrivalTime(data.arrivalTime || '09:00');
                setLeavingTime(data.leavingTime || '17:00');
                setGraceMinutes(data.graceMinutes ?? 15);
            }
        } catch (error) {
            console.error('Error loading holiday settings:', error);
        }
        setLoading(false);
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage({ type: '', text: '' });
        try {
            await setDoc(doc(db, 'settings', 'holidays'), {
                weeklyOffs,
                holidays,
                arrivalTime,
                leavingTime,
                graceMinutes,
                updatedAt: new Date().toISOString()
            });
            setMessage({ type: 'success', text: 'Settings saved!' });
        } catch (error) {
            console.error('Error saving:', error);
            setMessage({ type: 'error', text: 'Failed to save: ' + error.message });
        }
        setSaving(false);
    };

    const toggleWeeklyOff = (day) => {
        if (weeklyOffs.includes(day)) {
            setWeeklyOffs(weeklyOffs.filter(d => d !== day));
        } else {
            setWeeklyOffs([...weeklyOffs, day].sort());
        }
    };

    const addHoliday = () => {
        if (!newHolidayDate) return;
        const exists = holidays.some(h => h.date === newHolidayDate);
        if (exists) {
            setMessage({ type: 'error', text: 'This date is already added' });
            return;
        }
        setHolidays([...holidays, {
            date: newHolidayDate,
            name: newHolidayName || 'Holiday'
        }].sort((a, b) => a.date.localeCompare(b.date)));
        setNewHolidayDate('');
        setNewHolidayName('');
    };

    const removeHoliday = (date) => {
        setHolidays(holidays.filter(h => h.date !== date));
    };

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    School Settings
                </h2>
                <Button onClick={handleSave} disabled={saving}>
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {saving ? 'Saving...' : 'Save Settings'}
                </Button>
            </div>

            {message.text && (
                <div className={`p-3 rounded-lg text-sm ${message.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                    {message.text}
                </div>
            )}

            {/* School Timings */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-600" />
                    School Timings
                </h3>
                <p className="text-sm text-gray-500 mb-4">Set arrival time - teachers arriving after this time (+ grace period) will be marked as <span className="text-orange-600 font-medium">Late</span></p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Arrival Time
                        </label>
                        <input
                            type="time"
                            value={arrivalTime}
                            onChange={(e) => setArrivalTime(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Grace Period (minutes)
                        </label>
                        <input
                            type="number"
                            min="0"
                            max="60"
                            value={graceMinutes}
                            onChange={(e) => setGraceMinutes(parseInt(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Leaving Time
                        </label>
                        <input
                            type="time"
                            value={leavingTime}
                            onChange={(e) => setLeavingTime(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>

                <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
                    <strong>Example:</strong> With arrival at {arrivalTime} and {graceMinutes} min grace, teachers arriving after {(() => {
                        const [h, m] = arrivalTime.split(':').map(Number);
                        const totalMins = h * 60 + m + graceMinutes;
                        const newH = Math.floor(totalMins / 60) % 24;
                        const newM = totalMins % 60;
                        return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
                    })()} will be marked Late.
                </div>
            </div>

            {/* Weekly Offs */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-800 mb-4">Weekly Off Days</h3>
                <p className="text-sm text-gray-500 mb-4">Select days that are weekly holidays (attendance not required)</p>

                <div className="flex flex-wrap gap-2">
                    {WEEKDAYS.map(day => (
                        <button
                            key={day.value}
                            onClick={() => toggleWeeklyOff(day.value)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${weeklyOffs.includes(day.value)
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            {day.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Custom Holidays */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-800 mb-4">Custom Holidays</h3>
                <p className="text-sm text-gray-500 mb-4">Add specific dates that are holidays</p>

                {/* Add Holiday Form */}
                <div className="flex gap-2 mb-4">
                    <input
                        type="date"
                        value={newHolidayDate}
                        onChange={(e) => setNewHolidayDate(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                        type="text"
                        placeholder="Holiday name (optional)"
                        value={newHolidayName}
                        onChange={(e) => setNewHolidayName(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <Button onClick={addHoliday}>
                        <Plus className="w-4 h-4" /> Add
                    </Button>
                </div>

                {/* Holiday List */}
                {holidays.length === 0 ? (
                    <p className="text-center text-gray-400 py-4">No custom holidays added</p>
                ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                        {holidays.map(holiday => (
                            <div key={holiday.date} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div>
                                    <span className="font-medium text-gray-800">{holiday.name}</span>
                                    <span className="text-sm text-gray-500 ml-2">{holiday.date}</span>
                                </div>
                                <button
                                    onClick={() => removeHoliday(holiday.date)}
                                    className="text-red-500 hover:text-red-600 p-1"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminHolidayConfig;
