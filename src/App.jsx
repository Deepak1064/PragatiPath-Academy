import React, { useState, useEffect, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  limit,
  doc,
  setDoc,
  getDocs,
  deleteDoc
} from 'firebase/firestore';
import {
  Wifi, WifiOff, QrCode, CheckCircle, LogOut, History, MapPin,
  Loader2, ShieldCheck, Smartphone, CalendarDays, Users,
  LayoutDashboard, RefreshCw, Globe, Lock
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Html5Qrcode } from 'html5-qrcode';

// --- CONFIGURATION ---
const SCHOOL_NAME = "PragatiPath Academy";

// --- 1. FIREBASE CONFIG ---
const firebaseConfig = {
  apiKey: "AIzaSyAcFRmDU0bGA8i0HxYGtAlZKpTDVK1nDM4",
  authDomain: "school-b1f8e.firebaseapp.com",
  projectId: "school-b1f8e",
  storageBucket: "school-b1f8e.firebasestorage.app",
  messagingSenderId: "1075904310446",
  appId: "1:1075904310446:web:29c77e8c5490344135d13f",
  measurementId: "G-SGW1DBKGHN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// We keep this stable so your data doesn't disappear
const appId = 'school-attendance-v2';

// --- Shared Components ---

const Button = ({ children, onClick, variant = 'primary', className = '', disabled = false, type = "button" }) => {
  const baseStyle = "px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 shadow-sm active:scale-95";
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed",
    secondary: "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 disabled:bg-gray-50",
    danger: "bg-red-50 text-red-600 hover:bg-red-100 border border-red-100",
    success: "bg-green-600 text-white hover:bg-green-700 disabled:bg-green-300",
    ghost: "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyle} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

const Input = ({ label, type, value, onChange, placeholder, required = false }) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
    />
  </div>
);

// --- Main App Component ---

export default function AttendanceApp() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdminMode, setIsAdminMode] = useState(false);

  const [currentIP, setCurrentIP] = useState(null);
  const [allowedSchoolIP, setAllowedSchoolIP] = useState(null);

  // Login Form States
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [authError, setAuthError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const fetchIP = useCallback(async () => {
    try {
      const mockIP = localStorage.getItem('mock_current_ip');
      if (mockIP) {
        setCurrentIP(mockIP);
        return;
      }
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      setCurrentIP(data.ip);
    } catch (error) {
      console.error("Failed to fetch IP", error);
    }
  }, []);

  // 1. Auth Listener & IP Fetch
  useEffect(() => {
    fetchIP();
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        if (currentUser.email === 'draj12345raj@gmail.com') {
          setIsAdminMode(true);
        } else {
          setIsAdminMode(false);
        }
      }
      setLoading(false);
    });
    return () => unsubscribeAuth();
  }, [fetchIP]);

  // 2. Global Config Listener
  useEffect(() => {
    if (!user) return;
    const configRef = doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'network_config');
    const configUnsub = onSnapshot(configRef, (docSnap) => {
      if (docSnap.exists()) {
        setAllowedSchoolIP(docSnap.data().schoolIP);
      }
    });
    return () => configUnsub();
  }, [user]);

  const handleAuthAction = async (e) => {
    e.preventDefault();
    setAuthError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, {
          displayName: fullName
        });
      }
    } catch (error) {
      console.error(error);
      let msg = "Authentication failed.";
      if (error.code === 'auth/invalid-credential') msg = "Incorrect email or password.";
      if (error.code === 'auth/email-already-in-use') msg = "That email is already registered.";
      if (error.code === 'auth/weak-password') msg = "Password should be at least 6 characters.";
      setAuthError(msg);
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setAuthError("Please enter your email address above to reset your password.");
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccessMessage(`Password reset email sent to ${email}. Check your inbox!`);
      setAuthError('');
    } catch (error) {
      console.error(error);
      setAuthError("Failed to send reset email: " + error.message);
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setEmail('');
      setPassword('');
      setFullName('');
    } catch (error) {
      console.error("Error signing out", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
      </div>
    );
  }

  // LOGIN SCREEN
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShieldCheck className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">{SCHOOL_NAME}</h1>
            <p className="text-gray-500 text-sm mt-1">Attendance Management System</p>
          </div>

          <form onSubmit={handleAuthAction}>
            {!isLogin && (
              <Input
                label="Full Name"
                type="text"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            )}
            <Input
              label="Email Address"
              type="email"
              placeholder="teacher@school.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
              {isLogin && (
                <div className="flex justify-end mt-1">
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
              )}
            </div>

            {authError && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 border border-red-100">
                {authError}
              </div>
            )}

            {successMessage && (
              <div className="bg-green-50 text-green-600 p-3 rounded-lg text-sm mb-4 border border-green-100 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" /> {successMessage}
              </div>
            )}

            <Button type="submit" className="w-full mb-4">
              {loading ? <Loader2 className="animate-spin" /> : (isLogin ? 'Sign In' : 'Create Account')}
            </Button>
          </form>

          <div className="text-center space-y-2">
            <button onClick={() => { setIsLogin(!isLogin); setAuthError(''); setSuccessMessage(''); }} className="text-sm text-blue-600 hover:underline block w-full">
              {isLogin ? "New user? Create account" : "Already have an account? Sign in"}
            </button>
            <p className="text-xs text-gray-400">Admin Login: draj12345raj@gmail.com</p>
          </div>
        </div>
      </div>
    );
  }

  return isAdminMode ? (
    <AdminDashboard
      user={user}
      onLogout={handleLogout}
      appId={appId}
      currentIP={currentIP}
      allowedSchoolIP={allowedSchoolIP}
    />
  ) : (
    <TeacherDashboard
      user={user}
      onLogout={handleLogout}
      appId={appId}
      currentIP={currentIP}
      allowedSchoolIP={allowedSchoolIP}
      fetchIP={fetchIP}
    />
  );
}

// ==========================================
// ADMIN DASHBOARD
// ==========================================

const AdminDashboard = ({ user, onLogout, appId, currentIP, allowedSchoolIP }) => {
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
        {activeTab === 'qr' && <AdminQRGenerator appId={appId} />}
        {activeTab === 'network' && <AdminNetworkConfig appId={appId} currentIP={currentIP} allowedSchoolIP={allowedSchoolIP} />}
        {activeTab === 'daily' && <AdminDailyReport appId={appId} />}
        {activeTab === 'monthly' && <AdminMonthlyReport appId={appId} />}
      </div>
    </div>
  );
};

const TabButton = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 pb-3 border-b-2 transition-colors whitespace-nowrap ${active ? 'border-blue-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
  >
    {icon} {label}
  </button>
);

const AdminNetworkConfig = ({ appId, currentIP, allowedSchoolIP }) => {
  const [saving, setSaving] = useState(false);

  const setIP = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'network_config'), {
        schoolIP: currentIP,
        updatedAt: serverTimestamp()
      });
    } catch (e) {
      console.error(e);
    }
    setSaving(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="mb-6 border-b border-gray-100 pb-4">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Globe className="w-6 h-6 text-blue-600" />
          Network Security Configuration
        </h2>
        <p className="text-gray-500 mt-1 text-sm">Define the authorized network for attendance.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <label className="text-xs font-bold text-blue-600 uppercase tracking-wide">Your Current IP</label>
            <div className="flex items-center gap-2 mt-1">
              <MapPin className="w-5 h-5 text-blue-500" />
              <span className="text-2xl font-mono font-bold text-gray-800">{currentIP || 'Loading...'}</span>
            </div>
          </div>
          <Button onClick={setIP} disabled={saving || !currentIP} className="w-full h-12">
            {saving ? <Loader2 className="animate-spin" /> : <Lock className="w-4 h-4" />}
            Set as Allowed School IP
          </Button>
          <p className="text-xs text-gray-400 text-center">
            Clicking this will whitelist your current network for all teachers.
          </p>
        </div>

        <div className="space-y-4">
          <div className="bg-green-50 p-4 rounded-lg border border-green-100 h-full">
            <label className="text-xs font-bold text-green-600 uppercase tracking-wide">Currently Whitelisted IP</label>
            <div className="flex items-center gap-2 mt-2">
              <ShieldCheck className="w-8 h-8 text-green-500" />
              {allowedSchoolIP ? (
                <span className="text-2xl font-mono font-bold text-gray-800">{allowedSchoolIP}</span>
              ) : (
                <span className="text-xl font-mono text-gray-400 italic">Not Configured</span>
              )}
            </div>
            <div className="mt-4 text-sm text-green-800">
              {allowedSchoolIP === currentIP
                ? "✅ You are connected to the allowed network."
                : "⚠️ Your current IP does not match the whitelist."}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const AdminQRGenerator = ({ appId }) => {
  const [todayCode, setTodayCode] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'artifacts', appId, 'public', 'data', 'daily_codes'),
      orderBy('timestamp', 'desc'),
      limit(5)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const codes = snapshot.docs.map(d => d.data());
      const today = new Date().toLocaleDateString();
      const existing = codes.find(c => c.dateString === today);
      setTodayCode(existing);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [appId]);

  const generateCode = async () => {
    setLoading(true);
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'daily_codes'), {
        code: code,
        timestamp: serverTimestamp(),
        dateString: new Date().toLocaleDateString(),
        active: true
      });
    } catch (e) {
      console.error("Error generating code", e);
    }
    setLoading(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 flex flex-col items-center text-center animate-in fade-in slide-in-from-bottom-4">
      <div className="w-full max-w-lg">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Daily Attendance QR</h2>
        <p className="text-gray-500 mb-8">Project this screen. Teachers must be on School WiFi to scan.</p>

        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        ) : todayCode ? (
          <div className="bg-blue-50 border-4 border-blue-100 rounded-3xl p-10 mb-6 shadow-xl">
            <div className="mb-6 relative flex justify-center">
              <QRCodeSVG
                value={JSON.stringify({ type: 'school_attendance', code: todayCode.code })}
                size={256}
                level="H"
                includeMargin={true}
                className="mx-auto"
              />
            </div>
            <div className="bg-white border border-blue-200 rounded-lg py-3 px-6 inline-block shadow-sm">
              <span className="text-sm text-gray-400 font-bold uppercase tracking-wider block text-xs mb-1">Today's Security Code</span>
              <span className="text-4xl font-mono font-black text-blue-600 tracking-widest">{todayCode.code}</span>
            </div>
            <p className="text-sm text-green-600 font-medium mt-6 flex items-center justify-center gap-2">
              <CheckCircle className="w-5 h-5" /> Active for {new Date().toLocaleDateString()}
            </p>
          </div>
        ) : (
          <div className="py-12 border-2 border-dashed border-gray-200 rounded-2xl mb-6 bg-gray-50/50">
            <p className="text-gray-400 mb-4">No code generated for today.</p>
            <Button onClick={generateCode} size="lg" className="mx-auto shadow-xl shadow-blue-100">
              <RefreshCw className="w-4 h-4" /> Generate New Code
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

const AdminDailyReport = ({ appId }) => {
  const [records, setRecords] = useState([]);
  useEffect(() => {
    const today = new Date().toLocaleDateString();
    const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'attendance'), orderBy('timestamp', 'desc'), limit(100));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const all = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setRecords(all.filter(r => r.dateString === today));
    });
    return () => unsubscribe();
  }, [appId]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-bold text-gray-800 text-lg">Today's Attendance</h2>
        <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">{records.length} Present</span>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 uppercase text-xs">
              <tr>
                <th className="px-6 py-4 font-semibold">Teacher</th>
                <th className="px-6 py-4 font-semibold">Time</th>
                <th className="px-6 py-4 font-semibold">IP Address</th>
                <th className="px-6 py-4 font-semibold text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {records.map(record => (
                <tr key={record.id} className="hover:bg-gray-50/50">
                  <td className="px-6 py-4 font-medium text-gray-900">{record.userName}</td>
                  <td className="px-6 py-4 text-gray-600">{record.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                  <td className="px-6 py-4 font-mono text-gray-400 text-xs">{record.ipAddress}</td>
                  <td className="px-6 py-4 text-right"><span className="text-green-600 bg-green-50 px-2 py-1 rounded-md text-xs font-medium border border-green-100">Verified</span></td>
                </tr>
              ))}
              {records.length === 0 && <tr><td colSpan="4" className="px-6 py-12 text-center text-gray-400">No attendance today.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const AdminMonthlyReport = ({ appId }) => {
  const [stats, setStats] = useState([]);
  const [selectedMonth] = useState(new Date().toLocaleString('default', { month: 'long', year: 'numeric' }));
  useEffect(() => {
    const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'attendance'), orderBy('timestamp', 'desc'), limit(500));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const all = snapshot.docs.map(d => d.data()).filter(r => r.timestamp && r.timestamp.toDate().toLocaleString('default', { month: 'long', year: 'numeric' }) === selectedMonth);
      const userStats = {};
      all.forEach(r => {
        if (!userStats[r.userId]) userStats[r.userId] = { name: r.userName, days: 0 };
        userStats[r.userId].days += 1;
      });
      setStats(Object.values(userStats).sort((a, b) => b.days - a.days));
    });
    return () => unsubscribe();
  }, [appId, selectedMonth]);

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex justify-between">
        <span className="font-semibold text-gray-600">{selectedMonth}</span>
        <span className="text-sm font-bold text-gray-800">{stats.reduce((acc, curr) => acc + curr.days, 0)} Total Records</span>
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

const TeacherDashboard = ({ user, onLogout, appId, currentIP, allowedSchoolIP, fetchIP }) => {
  const [activeTab, setActiveTab] = useState('mark');

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white shadow-sm px-4 py-4 sticky top-0 z-10">
        <div className="max-w-md mx-auto flex justify-between items-center">
          <div>
            <h1 className="font-bold text-gray-800">{SCHOOL_NAME}</h1>
            <p className="text-xs text-gray-500">{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
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
              appId={appId}
            />
          )}
          {activeTab === 'history' && (
            <AttendanceHistory user={user} appId={appId} />
          )}
          {activeTab === 'settings' && (
            <Settings
              currentIP={currentIP}
              fetchIP={fetchIP}
              user={user}
              appId={appId}
            />
          )}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3 flex justify-between items-center z-20 max-w-md mx-auto">
        <NavButton icon={<QrCode />} label="Attend" isActive={activeTab === 'mark'} onClick={() => setActiveTab('mark')} />
        <NavButton icon={<History />} label="History" isActive={activeTab === 'history'} onClick={() => setActiveTab('history')} />
        <NavButton icon={<Wifi />} label="Settings" isActive={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
      </div>
    </div>
  );
};

const NavButton = ({ icon, label, isActive, onClick }) => (
  <button onClick={onClick} className={`flex flex - col items - center gap - 1 transition - colors ${isActive ? 'text-blue-600' : 'text-gray-400'} `}>
    {React.cloneElement(icon, { size: 24 })}
    <span className="text-xs font-medium">{label}</span>
  </button>
);

const NetworkStatusBanner = ({ currentIP, allowedSchoolIP, refreshIP }) => {
  const isConnected = allowedSchoolIP && currentIP === allowedSchoolIP;

  return (
    <div className={`rounded - xl p - 4 flex items - center justify - between shadow - sm border ${isConnected ? 'bg-green-50 border-green-100' : 'bg-amber-50 border-amber-100'} `}>
      <div className="flex items-center gap-3">
        <div className={`w - 10 h - 10 rounded - full flex items - center justify - center ${isConnected ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'} `}>
          {isConnected ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
        </div>
        <div>
          <h3 className={`font - semibold text - sm ${isConnected ? 'text-green-800' : 'text-amber-800'} `}>
            {isConnected ? 'Connected to School WiFi' : 'Wrong Network'}
          </h3>
          <p className="text-xs text-gray-500">
            {isConnected ? 'Ready to mark attendance' : 'Connect to School WiFi to continue'}
          </p>
        </div>
      </div>
      <button onClick={refreshIP} className="text-gray-400 hover:text-blue-600">
        <Loader2 className="w-4 h-4" />
      </button>
    </div>
  );
};

const AttendanceMarker = ({ user, currentIP, allowedSchoolIP, appId }) => {
  const [status, setStatus] = useState('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [todayRecord, setTodayRecord] = useState(null);
  const [dailyCode, setDailyCode] = useState(null);
  const [cameraPermissionError, setCameraPermissionError] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    const qCode = query(collection(db, 'artifacts', appId, 'public', 'data', 'daily_codes'), orderBy('timestamp', 'desc'), limit(1));
    const unsubCode = onSnapshot(qCode, (snap) => {
      if (!snap.empty) {
        const data = snap.docs[0].data();
        if (data.dateString === new Date().toLocaleDateString()) {
          setDailyCode(data);
        } else {
          setDailyCode(null);
        }
      }
    });

    const todayStr = new Date().toLocaleDateString();
    const qAttendance = query(collection(db, 'artifacts', appId, 'public', 'data', 'attendance'), where('userId', '==', user.uid));
    const unsubAtt = onSnapshot(qAttendance, (snap) => {
      const myRecs = snap.docs.map(d => d.data());
      myRecs.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
      const found = myRecs.find(r => r.dateString === todayStr);
      if (found) {
        setTodayRecord(found);
        setStatus('success');
      }
    });

    return () => { unsubCode(); unsubAtt(); };
  }, [user, appId]);

  const handleScan = () => {
    if (!allowedSchoolIP) {
    }

    setStatus('scanning');
    setCameraPermissionError(false);
  };

  useEffect(() => {
    let html5QrCode = null;

    if (status === 'scanning') {
      const startScanner = async () => {
        try {
          html5QrCode = new Html5Qrcode("reader");
          await html5QrCode.start(
            { facingMode: "environment" },
            {
              fps: 10,
              qrbox: { width: 250, height: 250 }
            },
            (decodedText) => {
              // Success callback
              try {
                const data = JSON.parse(decodedText);
                if (data.type === 'school_attendance' && data.code) {
                  handleVerify(data.code);
                } else {
                  handleVerify(decodedText);
                }
              } catch (e) {
                handleVerify(decodedText);
              }
              // Stop scanning after success
              html5QrCode.stop().then(() => {
                html5QrCode.clear();
              }).catch(err => console.error("Failed to stop scanner", err));
            },
            (errorMessage) => {
              // parse error, ignore it.
            }
          );
        } catch (err) {
          console.error("Error starting scanner", err);
          setCameraPermissionError(true);
          setStatus('idle');
        }
      };

      // Small delay to ensure DOM is ready
      setTimeout(startScanner, 100);
    }

    return () => {
      if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().then(() => {
          html5QrCode.clear();
        }).catch(err => console.error("Failed to stop scanner on cleanup", err));
      }
    };
  }, [status]);

  const handleVerify = (scannedCode) => {
    if (scannedCode === dailyCode.code) {
      processAttendance();
    } else {
      setStatus('error');
      setErrorMessage("Invalid QR Code. Please try again.");
    }
  };

  const processAttendance = async () => {
    setStatus('processing');
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'attendance'), {
        timestamp: serverTimestamp(),
        dateString: new Date().toLocaleDateString(),
        userName: user.displayName,
        userId: user.uid,
        ipAddress: currentIP,
        method: 'qr_verified',
        qrCodeUsed: dailyCode.code
      });
    } catch (error) {
      console.error(error);
      setStatus('error');
      setErrorMessage("Database Error: Could not save attendance.");
    }
  };

  const handleReset = async () => {
    if (!confirm("Reset attendance to test scanning again?")) return;
    setResetting(true);
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'attendance', todayRecord.id));
      setTodayRecord(null);
      setStatus('idle');
    } catch (e) {
      console.error(e);
      alert("Failed to reset: " + e.message);
    }
    setResetting(false);
  };

  if (todayRecord) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center animate-in fade-in zoom-in duration-500">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <CheckCircle className="w-12 h-12 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800">Attendance Marked!</h2>
        <div className="mt-6 bg-white border border-gray-100 shadow-sm px-6 py-4 rounded-xl w-full">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-500">Time:</span>
            <span className="font-medium text-gray-800">{todayRecord.timestamp?.toDate().toLocaleTimeString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Code:</span>
            <span className="font-mono bg-gray-100 px-2 rounded text-xs py-0.5">{todayRecord.qrCodeUsed || 'STATIC'}</span>
          </div>
        </div>

        <div className="mt-8">
          <Button variant="ghost" onClick={handleReset} disabled={resetting} className="text-xs text-gray-400 hover:text-red-500">
            {resetting ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
            Test Mode: Reset & Scan Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      {cameraPermissionError && (
        <div className="w-full bg-red-50 border border-red-100 p-4 rounded-xl mb-6 text-center">
          <p className="text-red-600 font-bold mb-1">Camera Access Denied</p>
          <p className="text-xs text-red-500">
            Please allow camera permissions in your browser settings. <br />
            Note: Camera only works on HTTPS or Localhost.
          </p>
        </div>
      )}

      {status === 'idle' && (
        <>
          <div className="w-full bg-blue-50 border border-blue-100 rounded-2xl p-8 mb-6 flex flex-col items-center justify-center aspect-square max-h-80 relative">
            <QrCode className="w-32 h-32 text-blue-300 mb-4 opacity-50" />
            <p className="text-center text-blue-800 font-medium z-10">
              Locate the QR Code on the<br />Admin Screen
            </p>
          </div>
          <Button onClick={handleScan} className="w-full py-4 text-lg shadow-lg shadow-blue-200">
            <Smartphone className="w-5 h-5" />
            Scan QR Code
          </Button>
        </>
      )}

      {status === 'scanning' && (
        <div className="w-full bg-black rounded-2xl overflow-hidden relative">
          <div id="reader" className="w-full h-64 bg-black"></div>
          <Button
            onClick={() => setStatus('idle')}
            variant="secondary"
            className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 opacity-80 hover:opacity-100"
          >
            Cancel Scan
          </Button>
        </div>
      )}

      {status === 'processing' && (
        <div className="py-20 flex flex-col items-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
          <p className="text-gray-600">Verifying Network Security...</p>
        </div>
      )}

      {status === 'error' && (
        <div className="w-full py-10 flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <WifiOff className="w-10 h-10 text-red-500" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Check Failed</h3>
          <p className="text-gray-600 mb-6 px-4">{errorMessage}</p>
          <Button onClick={() => setStatus('idle')} variant="outline">Try Again</Button>
        </div>
      )}
    </div>
  );
};

const AttendanceHistory = ({ user, appId }) => {
  const [groupedRecords, setGroupedRecords] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'attendance'), where('userId', '==', user.uid));

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
  }, [user, appId]);

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
              <div key={record.id} className={`p - 4 flex justify - between items - center ${index !== groupedRecords[month].length - 1 ? 'border-b border-gray-50' : ''} `}>
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

const Settings = ({ currentIP, fetchIP, user, appId }) => {
  const [resetting, setResetting] = useState(false);

  const handleResetAttendance = async () => {
    if (!confirm("Are you sure? This will delete your attendance record for today so you can test scanning again.")) return;
    setResetting(true);
    try {
      const today = new Date().toLocaleDateString();
      const q = query(
        collection(db, 'artifacts', appId, 'public', 'data', 'attendance'),
        where('userId', '==', user.uid),
        where('dateString', '==', today)
      );
      const snapshot = await getDocs(q);
      const deletePromises = snapshot.docs.map(d => deleteDoc(d.ref));
      await Promise.all(deletePromises);
      alert("Attendance reset! Go back to the Attend tab to scan again.");
    } catch (e) {
      console.error(e);
      alert("Failed to reset: " + e.message);
    }
    setResetting(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-gray-800 mb-2">Debug Settings</h2>
        <p className="text-sm text-gray-500 mb-4">
          Use this to spoof your current IP for testing. <br />
          (Note: You cannot change the School IP here anymore; only Admin can do that).
        </p>
      </div>
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 space-y-4">
        <div>
          <label className="text-xs font-bold text-gray-400 uppercase" >Your Detected IP</label>
          <div className="flex items-center gap-2 mt-1">
            <MapPin className="w-4 h-4 text-blue-500" />
            <span className="font-mono text-gray-800">{currentIP || 'Loading...'}</span>
          </div>
        </div>
      </div>
      <div className="grid gap-3">
        <Button onClick={() => { localStorage.setItem('mock_current_ip', "192.168.1.100"); fetchIP(); }}>
          Spoof IP to "192.168.1.100"
        </Button>
        <Button variant="secondary" onClick={() => { localStorage.removeItem('mock_current_ip'); fetchIP(); }}>
          Reset to Real IP
        </Button>
        <div className="h-px bg-gray-200 my-2"></div>
        <Button variant="danger" onClick={handleResetAttendance} disabled={resetting}>
          {resetting ? <Loader2 className="animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Reset Today's Attendance
        </Button>
      </div>
    </div>
  );
};