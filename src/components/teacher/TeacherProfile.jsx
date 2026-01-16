import React, { useState, useEffect, useRef } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { User, Phone, Mail, Calendar, Briefcase, GraduationCap, Award, Loader2, Save, Camera, Edit, X } from 'lucide-react';
import { db } from '../../config/firebase';
import Button from '../shared/Button';

// Fields that ONLY admin can edit
const ADMIN_ONLY_FIELDS = ['employeeId', 'designation', 'dateOfJoining', 'currentClasses'];

// Required fields for teacher to fill
const REQUIRED_FIELDS = {
    name: 'Full Name',
    phone: 'Phone Number',
    gender: 'Gender'
};

const TeacherProfile = ({ user }) => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editing, setEditing] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [validationErrors, setValidationErrors] = useState([]);
    const fileInputRef = useRef(null);

    const [profile, setProfile] = useState({
        name: '',
        phone: '',
        email: '',
        dateOfJoining: '',
        gender: '',
        maritalStatus: '',
        address: '',
        profilePicture: '',
        employeeId: '',
        designation: '',
        educationBackground: '',
        yearsOfExperience: '',
        currentClasses: '',
        certificates: ''
    });

    useEffect(() => {
        loadProfile();
    }, [user]);

    const loadProfile = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const docRef = doc(db, 'teacher_profiles', user.uid);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setProfile(prev => ({ ...prev, ...docSnap.data() }));
            } else {
                setProfile(prev => ({
                    ...prev,
                    name: user.displayName || '',
                    email: user.email || ''
                }));
            }
        } catch (error) {
            console.error('Error loading profile:', error);
            setMessage({ type: 'error', text: 'Failed to load profile' });
        }
        setLoading(false);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        // Don't allow changing admin-only fields
        if (ADMIN_ONLY_FIELDS.includes(name)) return;
        setProfile(prev => ({ ...prev, [name]: value }));
        setValidationErrors(prev => prev.filter(field => field !== name));
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 500000) {
                setMessage({ type: 'error', text: 'Image too large. Max 500KB.' });
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfile(prev => ({ ...prev, profilePicture: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const validateForm = () => {
        const errors = [];
        Object.entries(REQUIRED_FIELDS).forEach(([field]) => {
            if (!profile[field] || profile[field].trim() === '') {
                errors.push(field);
            }
        });
        setValidationErrors(errors);
        return errors.length === 0;
    };

    const handleSave = async () => {
        setMessage({ type: '', text: '' });

        if (!validateForm()) {
            const missingFields = Object.entries(REQUIRED_FIELDS)
                .filter(([field]) => !profile[field] || profile[field].trim() === '')
                .map(([, label]) => label)
                .join(', ');
            setMessage({ type: 'error', text: `Please fill required fields: ${missingFields}` });
            return;
        }

        setSaving(true);
        try {
            await setDoc(doc(db, 'teacher_profiles', user.uid), {
                ...profile,
                email: user.email,
                updatedAt: serverTimestamp()
            }, { merge: true });
            setMessage({ type: 'success', text: 'Profile saved successfully!' });
            setEditing(false);
        } catch (error) {
            console.error('Error saving profile:', error);
            setMessage({ type: 'error', text: 'Failed to save profile: ' + error.message });
        }
        setSaving(false);
    };

    const InfoRow = ({ icon: Icon, label, value }) => (
        <div className="flex items-start gap-3 py-2">
            <Icon className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500">{label}</p>
                <p className="text-sm font-medium text-gray-800 break-words">{value || '-'}</p>
            </div>
        </div>
    );

    const RequiredLabel = ({ children }) => (
        <span>{children} <span className="text-red-500">*</span></span>
    );

    if (loading) {
        return (
            <div className="flex justify-center items-center py-20">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <User className="w-5 h-5 text-blue-600" />
                    My Profile
                </h2>
                {!editing ? (
                    <Button onClick={() => setEditing(true)} className="py-2 px-4">
                        <Edit className="w-4 h-4" />
                        Edit Profile
                    </Button>
                ) : (
                    <button onClick={() => setEditing(false)} className="text-gray-500 hover:text-gray-700">
                        <X className="w-5 h-5" />
                    </button>
                )}
            </div>

            {message.text && (
                <div className={`p-3 rounded-lg text-sm ${message.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                    {message.text}
                </div>
            )}

            {/* Profile Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                {/* Profile Picture */}
                <div className="flex flex-col items-center mb-6">
                    <div
                        className={`w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden border-4 border-blue-50 ${editing ? 'cursor-pointer hover:border-blue-300' : ''}`}
                        onClick={() => editing && fileInputRef.current?.click()}
                    >
                        {profile.profilePicture ? (
                            <img src={profile.profilePicture} alt="" className="w-full h-full object-cover" />
                        ) : (
                            <User className="w-12 h-12 text-blue-600" />
                        )}
                    </div>
                    {editing && (
                        <>
                            <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                            <p className="text-xs text-gray-400 mt-1">Tap to change photo</p>
                        </>
                    )}
                    {!editing && (
                        <>
                            <h2 className="text-xl font-bold text-gray-800 mt-3">{profile.name || 'Unnamed'}</h2>
                            <p className="text-blue-600 font-medium">{profile.designation || 'Teacher'}</p>
                            <p className="text-sm text-gray-500">ID: {profile.employeeId || '-'}</p>
                        </>
                    )}
                </div>

                {editing ? (
                    /* EDIT MODE */
                    <div className="space-y-4">
                        <p className="text-xs text-gray-500">Fields marked with <span className="text-red-500">*</span> are mandatory</p>

                        {/* Editable Fields */}
                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1"><RequiredLabel>Full Name</RequiredLabel></label>
                                <input type="text" name="name" value={profile.name} onChange={handleChange}
                                    className={`w-full px-3 py-2 border rounded-lg ${validationErrors.includes('name') ? 'border-red-500' : 'border-gray-300'}`}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input type="email" value={profile.email || user.email} disabled
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-100 text-gray-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1"><RequiredLabel>Phone Number</RequiredLabel></label>
                                <input type="tel" name="phone" value={profile.phone} onChange={handleChange}
                                    className={`w-full px-3 py-2 border rounded-lg ${validationErrors.includes('phone') ? 'border-red-500' : 'border-gray-300'}`}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1"><RequiredLabel>Gender</RequiredLabel></label>
                                    <select name="gender" value={profile.gender} onChange={handleChange}
                                        className={`w-full px-3 py-2 border rounded-lg ${validationErrors.includes('gender') ? 'border-red-500' : 'border-gray-300'}`}
                                    >
                                        <option value="">Select</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Marital Status</label>
                                    <select name="maritalStatus" value={profile.maritalStatus} onChange={handleChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                    >
                                        <option value="">Select</option>
                                        <option value="Single">Single</option>
                                        <option value="Married">Married</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                                <textarea name="address" value={profile.address} onChange={handleChange} rows={2}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Education Background</label>
                                <textarea name="educationBackground" value={profile.educationBackground} onChange={handleChange} rows={2}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Years of Experience</label>
                                <input type="number" name="yearsOfExperience" value={profile.yearsOfExperience} onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Certificates & Achievements</label>
                                <textarea name="certificates" value={profile.certificates} onChange={handleChange} rows={2}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                />
                            </div>
                        </div>

                        {/* Admin-Only Fields (Read Only) */}
                        <div className="bg-gray-50 rounded-lg p-4 mt-4">
                            <h4 className="text-sm font-semibold text-gray-600 mb-2 flex items-center gap-2">
                                <Briefcase className="w-4 h-4" />
                                Employment Details
                                <span className="text-xs font-normal text-gray-400">(Contact admin to update)</span>
                            </h4>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                    <p className="text-gray-500">Employee ID</p>
                                    <p className="font-medium">{profile.employeeId || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500">Designation</p>
                                    <p className="font-medium">{profile.designation || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500">Date of Joining</p>
                                    <p className="font-medium">{profile.dateOfJoining || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500">Current Classes</p>
                                    <p className="font-medium">{profile.currentClasses || '-'}</p>
                                </div>
                            </div>
                        </div>

                        <Button onClick={handleSave} disabled={saving} className="w-full py-3 mt-4">
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            {saving ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                ) : (
                    /* VIEW MODE */
                    <div className="divide-y divide-gray-100">
                        <div className="py-3">
                            <h3 className="font-semibold text-gray-700 text-sm uppercase mb-2">Contact</h3>
                            <InfoRow icon={Mail} label="Email" value={profile.email} />
                            <InfoRow icon={Phone} label="Phone" value={profile.phone} />
                        </div>

                        <div className="py-3">
                            <h3 className="font-semibold text-gray-700 text-sm uppercase mb-2">Employment</h3>
                            <InfoRow icon={Briefcase} label="Employee ID" value={profile.employeeId} />
                            <InfoRow icon={Briefcase} label="Designation" value={profile.designation} />
                            <InfoRow icon={Calendar} label="Date of Joining" value={profile.dateOfJoining} />
                            <InfoRow icon={User} label="Current Classes" value={profile.currentClasses} />
                        </div>

                        <div className="py-3">
                            <h3 className="font-semibold text-gray-700 text-sm uppercase mb-2">Personal</h3>
                            <InfoRow icon={User} label="Gender" value={profile.gender} />
                            <InfoRow icon={User} label="Marital Status" value={profile.maritalStatus} />
                            <InfoRow icon={User} label="Address" value={profile.address} />
                        </div>

                        <div className="py-3">
                            <h3 className="font-semibold text-gray-700 text-sm uppercase mb-2">Education & Experience</h3>
                            <InfoRow icon={GraduationCap} label="Education" value={profile.educationBackground} />
                            <InfoRow icon={Briefcase} label="Experience" value={profile.yearsOfExperience ? `${profile.yearsOfExperience} years` : '-'} />
                            <InfoRow icon={Award} label="Certificates" value={profile.certificates} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TeacherProfile;
