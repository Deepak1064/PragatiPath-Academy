import React, { useState, useEffect, useRef } from 'react';
import { collection, onSnapshot, query, orderBy, doc, setDoc, deleteDoc, serverTimestamp, getDocs, where, getDoc, updateDoc } from 'firebase/firestore';
import { User, Phone, Mail, Briefcase, Calendar, GraduationCap, ChevronRight, Search, Loader2, X, ArrowLeft, Plus, Edit, Trash2, Save, Camera, LogIn, LogOut, Clock, AlertTriangle } from 'lucide-react';
import { db } from '../../config/firebase';
import Button from '../shared/Button';

// Fields that ONLY admin can set (Employment section)
const ADMIN_FIELDS = {
    employeeId: 'Employee ID',
    designation: 'Designation',
    dateOfJoining: 'Date of Joining',
    currentClasses: 'Current Classes'
};

const AdminEmployeeList = ({ initialEmployee, onEmployeeViewed }) => {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedEmployee, setSelectedEmployee] = useState(initialEmployee || null);
    const [showForm, setShowForm] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState(null);

    // Handle initialEmployee from parent (when clicking from Daily Log)
    useEffect(() => {
        if (initialEmployee) {
            setSelectedEmployee(initialEmployee);
            if (onEmployeeViewed) onEmployeeViewed();
        }
    }, [initialEmployee]);

    useEffect(() => {
        const q = query(
            collection(db, 'teacher_profiles'),
            orderBy('name', 'asc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setEmployees(data);
            setLoading(false);
        }, (error) => {
            console.error('Error fetching employees:', error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const filteredEmployees = employees.filter(emp =>
        emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.employeeId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.designation?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleAddNew = () => {
        setEditingEmployee(null);
        setShowForm(true);
    };

    const handleEdit = (employee) => {
        setEditingEmployee(employee);
        setShowForm(true);
    };

    const handleFormClose = () => {
        setShowForm(false);
        setEditingEmployee(null);
    };

    if (showForm) {
        return (
            <EmployeeForm
                employee={editingEmployee}
                onClose={handleFormClose}
                existingIds={employees.map(e => e.employeeId)}
            />
        );
    }

    if (selectedEmployee) {
        return (
            <EmployeeDetail
                employee={selectedEmployee}
                onBack={() => setSelectedEmployee(null)}
                onEdit={() => handleEdit(selectedEmployee)}
            />
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <User className="w-5 h-5 text-blue-600" />
                        Employees ({employees.length})
                    </h2>
                    <Button onClick={handleAddNew} className="py-2 px-4">
                        <Plus className="w-4 h-4" />
                        Add Employee
                    </Button>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by name, ID, or designation..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    {searchTerm && (
                        <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-12">
                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                </div>
            ) : filteredEmployees.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                    {searchTerm ? 'No employees found' : (
                        <div>
                            <p className="mb-4">No employees added yet</p>
                            <Button onClick={handleAddNew}>
                                <Plus className="w-4 h-4" /> Add First Employee
                            </Button>
                        </div>
                    )}
                </div>
            ) : (
                <div className="divide-y divide-gray-100">
                    {filteredEmployees.map((employee) => (
                        <div
                            key={employee.id}
                            onClick={() => setSelectedEmployee(employee)}
                            className="flex items-center gap-4 p-4 hover:bg-gray-50 cursor-pointer"
                        >
                            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden">
                                {employee.profilePicture ? (
                                    <img src={employee.profilePicture} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <User className="w-6 h-6 text-blue-600" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-gray-800 truncate">{employee.name || 'Unnamed'}</h3>
                                <p className="text-sm text-gray-500 truncate">
                                    {employee.designation || 'No designation'} • {employee.employeeId || 'No ID'}
                                </p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-gray-400" />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// Admin Form - ONLY for Employment fields
const EmployeeForm = ({ employee, onClose, existingIds }) => {
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [validationErrors, setValidationErrors] = useState([]);

    const [formData, setFormData] = useState({
        employeeId: employee?.employeeId || '',
        designation: employee?.designation || '',
        dateOfJoining: employee?.dateOfJoining || '',
        currentClasses: employee?.currentClasses || '',
        // For new employees, also need email to link account
        email: employee?.email || '',
        // Personalized timing
        customArrivalTime: employee?.customArrivalTime || '',
        customLeavingTime: employee?.customLeavingTime || ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setValidationErrors(prev => prev.filter(field => field !== name));
    };

    const validateForm = () => {
        const errors = [];
        if (!formData.employeeId.trim()) errors.push('employeeId');
        if (!formData.designation.trim()) errors.push('designation');
        if (!formData.dateOfJoining) errors.push('dateOfJoining');
        if (!employee && !formData.email.trim()) errors.push('email');
        setValidationErrors(errors);
        return errors.length === 0;
    };

    const handleSave = async () => {
        setMessage({ type: '', text: '' });

        if (!validateForm()) {
            setMessage({ type: 'error', text: 'Please fill all required fields' });
            return;
        }

        // Check duplicate ID
        if (!employee || employee.employeeId !== formData.employeeId) {
            if (existingIds.includes(formData.employeeId)) {
                setMessage({ type: 'error', text: 'Employee ID already exists' });
                return;
            }
        }

        setSaving(true);
        try {
            const docId = employee?.id || `emp_${formData.employeeId}_${Date.now()}`;
            await setDoc(doc(db, 'teacher_profiles', docId), {
                ...formData,
                updatedAt: serverTimestamp(),
                ...(employee ? {} : { createdAt: serverTimestamp(), name: '', phone: '', gender: '' })
            }, { merge: true });
            setMessage({ type: 'success', text: employee ? 'Updated!' : 'Employee added!' });
            setTimeout(onClose, 1000);
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to save: ' + error.message });
        }
        setSaving(false);
    };

    const handleDelete = async () => {
        if (!employee || !window.confirm(`Delete ${employee.name || 'this employee'}?`)) return;
        setDeleting(true);
        try {
            await deleteDoc(doc(db, 'teacher_profiles', employee.id));
            onClose();
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to delete' });
        }
        setDeleting(false);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <button onClick={onClose} className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium">
                    <ArrowLeft className="w-4 h-4" /> Back
                </button>
                {employee && (
                    <button onClick={handleDelete} disabled={deleting} className="flex items-center gap-2 text-red-500 hover:text-red-600">
                        {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        Delete
                    </button>
                )}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
                <h2 className="text-xl font-bold text-gray-800">
                    {employee ? 'Edit Employment Details' : 'Add New Employee'}
                </h2>

                {employee && (
                    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden">
                            {employee.profilePicture ? (
                                <img src={employee.profilePicture} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <User className="w-6 h-6 text-blue-600" />
                            )}
                        </div>
                        <div>
                            <h3 className="font-semibold">{employee.name || 'Unnamed'}</h3>
                            <p className="text-sm text-gray-500">{employee.email}</p>
                        </div>
                    </div>
                )}

                {message.text && (
                    <div className={`p-3 rounded-lg text-sm ${message.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                        {message.text}
                    </div>
                )}

                <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-blue-700">
                    <strong>Admin Section:</strong> These employment details can only be set by administrators.
                </div>

                {!employee && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Employee Email <span className="text-red-500">*</span>
                        </label>
                        <input type="email" name="email" value={formData.email} onChange={handleChange}
                            placeholder="employee@email.com"
                            className={`w-full px-3 py-2 border rounded-lg ${validationErrors.includes('email') ? 'border-red-500' : 'border-gray-300'}`}
                        />
                        <p className="text-xs text-gray-400 mt-1">Employee will use this email to login</p>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Employee ID <span className="text-red-500">*</span>
                        </label>
                        <input type="text" name="employeeId" value={formData.employeeId} onChange={handleChange}
                            placeholder="EMP001"
                            className={`w-full px-3 py-2 border rounded-lg ${validationErrors.includes('employeeId') ? 'border-red-500' : 'border-gray-300'}`}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Designation <span className="text-red-500">*</span>
                        </label>
                        <input type="text" name="designation" value={formData.designation} onChange={handleChange}
                            placeholder="Senior Teacher"
                            className={`w-full px-3 py-2 border rounded-lg ${validationErrors.includes('designation') ? 'border-red-500' : 'border-gray-300'}`}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Date of Joining <span className="text-red-500">*</span>
                        </label>
                        <input type="date" name="dateOfJoining" value={formData.dateOfJoining} onChange={handleChange}
                            className={`w-full px-3 py-2 border rounded-lg ${validationErrors.includes('dateOfJoining') ? 'border-red-500' : 'border-gray-300'}`}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Current Classes</label>
                        <input type="text" name="currentClasses" value={formData.currentClasses} onChange={handleChange}
                            placeholder="Class 8, 9, 10"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                    </div>
                </div>

                {/* Personalized Work Schedule */}
                <div className="bg-purple-50 border border-purple-100 rounded-lg p-4 mt-4">
                    <h4 className="text-sm font-semibold text-purple-800 mb-3 flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Personalized Work Schedule
                    </h4>
                    <p className="text-xs text-purple-600 mb-3">Leave empty to use school default timing</p>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Arrival Time</label>
                            <input type="time" name="customArrivalTime" value={formData.customArrivalTime} onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Leaving Time</label>
                            <input type="time" name="customLeavingTime" value={formData.customLeavingTime} onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            />
                        </div>
                    </div>
                </div>

                <Button onClick={handleSave} disabled={saving} className="w-full py-3">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {saving ? 'Saving...' : (employee ? 'Update Details' : 'Add Employee')}
                </Button>
            </div>
        </div>
    );
};

// Employee Detail View
const EmployeeDetail = ({ employee, onBack, onEdit }) => {
    const [attendance, setAttendance] = useState([]);
    const [loadingAttendance, setLoadingAttendance] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
    const [holidaySettings, setHolidaySettings] = useState({ weeklyOffs: [0], holidays: [] });
    const [togglingLate, setTogglingLate] = useState(null); // Track which record is being toggled

    // Function to toggle late status
    const handleToggleLate = async (record) => {
        if (!record?.id) return;
        setTogglingLate(record.id);
        try {
            await updateDoc(doc(db, 'attendance', record.id), {
                isLate: !record.isLate
            });
            // Refresh attendance data
            fetchAttendance();
        } catch (error) {
            console.error('Error toggling late status:', error);
            alert('Failed to update late status');
        }
        setTogglingLate(null);
    };

    useEffect(() => {
        fetchHolidaySettings();
    }, []);

    useEffect(() => {
        fetchAttendance();
    }, [employee, selectedMonth]);

    const fetchHolidaySettings = async () => {
        try {
            const docRef = doc(db, 'settings', 'holidays');
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setHolidaySettings(docSnap.data());
            }
        } catch (error) {
            console.error('Error fetching holiday settings:', error);
        }
    };

    const fetchAttendance = async () => {
        setLoadingAttendance(true);
        try {
            const [year, month] = selectedMonth.split('-');
            const startDate = `${year}-${month}-01`;
            const endDate = `${year}-${month}-31`;

            // Simple query by userId only (avoids composite index)
            let q = query(
                collection(db, 'attendance'),
                where('userId', '==', employee.id)
            );

            let snapshot = await getDocs(q);
            let allData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Filter by date range in JavaScript
            let data = allData.filter(record =>
                record.dateString >= startDate && record.dateString <= endDate
            ).sort((a, b) => b.dateString.localeCompare(a.dateString));

            // If no results, the profile might have been created by admin with different ID
            // Try matching by email - find attendance by users with same email
            if (data.length === 0 && employee.email) {
                // Get all attendance records for this month
                const allAttendanceQ = query(collection(db, 'attendance'));
                const allAttendanceSnapshot = await getDocs(allAttendanceQ);

                // Get all profiles to build email -> uid map
                const profilesSnapshot = await getDocs(collection(db, 'teacher_profiles'));
                const uidForEmail = {};
                profilesSnapshot.docs.forEach(doc => {
                    const p = doc.data();
                    if (p.email) uidForEmail[p.email.toLowerCase()] = doc.id;
                });

                // Find the correct UID for this employee's email
                const correctUid = uidForEmail[employee.email.toLowerCase()];

                if (correctUid) {
                    // Filter all attendance for this UID and date range
                    data = allAttendanceSnapshot.docs
                        .map(doc => ({ id: doc.id, ...doc.data() }))
                        .filter(record =>
                            record.userId === correctUid &&
                            record.dateString >= startDate &&
                            record.dateString <= endDate
                        )
                        .sort((a, b) => b.dateString.localeCompare(a.dateString));
                }
            }

            setAttendance(data);
        } catch (error) {
            console.error('Error fetching attendance:', error);
        }
        setLoadingAttendance(false);
    };

    const monthOptions = [];
    for (let i = 0; i < 6; i++) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const value = date.toISOString().slice(0, 7);
        const label = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        monthOptions.push({ value, label });
    }

    const getDaysInMonth = (yearMonth) => {
        const [year, month] = yearMonth.split('-');
        return new Date(parseInt(year), parseInt(month), 0).getDate();
    };

    // Calculate working days excluding weekly offs and custom holidays
    const getWorkingDays = (yearMonth) => {
        const [year, month] = yearMonth.split('-');
        const totalDays = new Date(parseInt(year), parseInt(month), 0).getDate();
        let workingDays = 0;

        for (let day = 1; day <= totalDays; day++) {
            const date = new Date(parseInt(year), parseInt(month) - 1, day);
            const dayOfWeek = date.getDay(); // 0 = Sunday
            const dateString = `${year}-${month}-${String(day).padStart(2, '0')}`;

            // Check if this is a weekly off
            if (holidaySettings.weeklyOffs?.includes(dayOfWeek)) {
                continue;
            }

            // Check if this is a custom holiday
            const isHoliday = holidaySettings.holidays?.some(h => h.date === dateString);
            if (isHoliday) {
                continue;
            }

            workingDays++;
        }

        return workingDays;
    };

    const InfoRow = ({ icon: Icon, label, value }) => (
        <div className="flex items-start gap-3 py-2">
            <Icon className="w-4 h-4 text-gray-400 mt-0.5" />
            <div className="flex-1">
                <p className="text-xs text-gray-500">{label}</p>
                <p className="text-sm font-medium text-gray-800">{value || '-'}</p>
            </div>
        </div>
    );

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <button onClick={onBack} className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium">
                    <ArrowLeft className="w-4 h-4" /> Back to List
                </button>
                <Button onClick={onEdit} className="py-2 px-4">
                    <Edit className="w-4 h-4" /> Edit Employment
                </Button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex flex-col items-center text-center mb-6">
                    <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden mb-3">
                        {employee.profilePicture ? (
                            <img src={employee.profilePicture} alt="" className="w-full h-full object-cover" />
                        ) : (
                            <User className="w-12 h-12 text-blue-600" />
                        )}
                    </div>
                    <h2 className="text-xl font-bold text-gray-800">{employee.name || 'Unnamed'}</h2>
                    <p className="text-blue-600 font-medium">{employee.designation || 'No designation'}</p>
                    <p className="text-sm text-gray-500">ID: {employee.employeeId || '-'}</p>
                </div>

                <div className="divide-y divide-gray-100">
                    <div className="py-3">
                        <h3 className="font-semibold text-gray-700 text-sm uppercase mb-2">Contact</h3>
                        <InfoRow icon={Mail} label="Email" value={employee.email} />
                        <InfoRow icon={Phone} label="Phone" value={employee.phone} />
                    </div>

                    <div className="py-3 bg-blue-50 -mx-6 px-6 border-l-4 border-blue-500">
                        <h3 className="font-semibold text-blue-800 text-sm uppercase mb-2">Employment (Admin Only)</h3>
                        <InfoRow icon={Briefcase} label="Employee ID" value={employee.employeeId} />
                        <InfoRow icon={Briefcase} label="Designation" value={employee.designation} />
                        <InfoRow icon={Calendar} label="Date of Joining" value={employee.dateOfJoining} />
                        <InfoRow icon={User} label="Current Classes" value={employee.currentClasses} />
                    </div>

                    <div className="py-3">
                        <h3 className="font-semibold text-gray-700 text-sm uppercase mb-2">Personal</h3>
                        <InfoRow icon={User} label="Gender" value={employee.gender} />
                        <InfoRow icon={User} label="Marital Status" value={employee.maritalStatus} />
                        <InfoRow icon={User} label="Address" value={employee.address} />
                    </div>

                    <div className="py-3">
                        <h3 className="font-semibold text-gray-700 text-sm uppercase mb-2">Education</h3>
                        <InfoRow icon={GraduationCap} label="Education" value={employee.educationBackground} />
                        <InfoRow icon={Briefcase} label="Experience" value={employee.yearsOfExperience ? `${employee.yearsOfExperience} years` : '-'} />
                        <InfoRow icon={GraduationCap} label="Certificates" value={employee.certificates} />
                    </div>
                </div>
            </div>

            {/* Attendance History Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-green-600" />
                        Attendance History
                    </h3>
                    <select
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500"
                    >
                        {monthOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                </div>

                {loadingAttendance ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                    </div>
                ) : (
                    <>
                        {/* Calculate unique present days (days with arrival) */}
                        {(() => {
                            const uniqueDates = new Set();
                            attendance.forEach(r => {
                                if (r.type === 'arrival' || !r.type) uniqueDates.add(r.dateString);
                            });
                            const presentDays = uniqueDates.size;
                            const workingDays = getWorkingDays(selectedMonth);
                            const absentDays = Math.max(0, workingDays - presentDays);
                            const percentage = workingDays > 0 ? Math.round((presentDays / workingDays) * 100) : 0;

                            return (
                                <div className="grid grid-cols-3 gap-4 mb-4">
                                    <div className="bg-green-50 rounded-lg p-3 text-center">
                                        <p className="text-2xl font-bold text-green-600">{presentDays}</p>
                                        <p className="text-xs text-green-700">Present</p>
                                    </div>
                                    <div className="bg-red-50 rounded-lg p-3 text-center">
                                        <p className="text-2xl font-bold text-red-600">{absentDays}</p>
                                        <p className="text-xs text-red-700">Absent</p>
                                    </div>
                                    <div className="bg-blue-50 rounded-lg p-3 text-center">
                                        <p className="text-2xl font-bold text-blue-600">{percentage}%</p>
                                        <p className="text-xs text-blue-700">Attendance</p>
                                    </div>
                                </div>
                            );
                        })()}

                        {attendance.length === 0 ? (
                            <p className="text-center text-gray-500 py-4">No attendance records for this month</p>
                        ) : (
                            <div className="max-h-64 overflow-y-auto space-y-2">
                                {/* Group attendance by date */}
                                {(() => {
                                    const byDate = {};
                                    attendance.forEach(record => {
                                        if (!byDate[record.dateString]) {
                                            byDate[record.dateString] = { arrival: null, leaving: null };
                                        }
                                        if (record.type === 'arrival') {
                                            byDate[record.dateString].arrival = record;
                                        } else if (record.type === 'leaving') {
                                            byDate[record.dateString].leaving = record;
                                        } else {
                                            if (!byDate[record.dateString].arrival) {
                                                byDate[record.dateString].arrival = record;
                                            }
                                        }
                                    });
                                    return Object.entries(byDate)
                                        .sort((a, b) => b[0].localeCompare(a[0]))
                                        .map(([dateStr, data]) => (
                                            <div key={dateStr} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-medium text-gray-700">{dateStr}</span>
                                                    {data.arrival?.isLate && (
                                                        <span className="text-xs bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded font-medium">Late</span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="flex items-center gap-1">
                                                        <LogIn className={`w-3 h-3 ${data.arrival?.isLate ? 'text-orange-600' : data.arrival ? 'text-green-600' : 'text-gray-300'}`} />
                                                        <span className={`text-xs font-semibold ${data.arrival?.isLate ? 'text-orange-600' : data.arrival ? 'text-green-600' : 'text-gray-400'}`}>
                                                            {data.arrival?.timestamp?.toDate ? data.arrival.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <LogOut className={`w-3 h-3 ${data.leaving ? 'text-orange-600' : 'text-gray-300'}`} />
                                                        <span className={`text-xs font-semibold ${data.leaving ? 'text-orange-600' : 'text-gray-400'}`}>
                                                            {data.leaving?.timestamp?.toDate ? data.leaving.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                                                        </span>
                                                    </div>
                                                    {/* Late Toggle Button */}
                                                    {data.arrival && (
                                                        <button
                                                            onClick={() => handleToggleLate(data.arrival)}
                                                            disabled={togglingLate === data.arrival.id}
                                                            className={`text-xs px-2 py-1 rounded font-medium transition-colors ${data.arrival.isLate
                                                                    ? 'bg-green-100 text-green-600 hover:bg-green-200'
                                                                    : 'bg-orange-100 text-orange-600 hover:bg-orange-200'
                                                                }`}
                                                            title={data.arrival.isLate ? 'Remove late status (for emergency)' : 'Mark as late'}
                                                        >
                                                            {togglingLate === data.arrival.id ? (
                                                                <Loader2 className="w-3 h-3 animate-spin" />
                                                            ) : data.arrival.isLate ? (
                                                                '✓ Remove Late'
                                                            ) : (
                                                                '⚠ Mark Late'
                                                            )}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ));
                                })()}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default AdminEmployeeList;
