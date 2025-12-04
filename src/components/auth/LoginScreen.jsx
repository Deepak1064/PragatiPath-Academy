import React, { useState } from 'react';
import { Loader2, ShieldCheck, CheckCircle } from 'lucide-react';
import Button from '../shared/Button';
import Input from '../shared/Input';
import { SCHOOL_NAME, ADMIN_EMAIL } from '../../utils/constants';

const LoginScreen = ({ onLogin, onSignup, onForgotPassword }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [authError, setAuthError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const handleAuthAction = async (e) => {
        e.preventDefault();
        setAuthError('');
        setSuccessMessage('');
        setLoading(true);

        try {
            if (isLogin) {
                await onLogin(email, password);
            } else {
                await onSignup(email, password, fullName);
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
            await onForgotPassword(email);
            setSuccessMessage(`Password reset email sent to ${email}. Check your inbox!`);
            setAuthError('');
        } catch (error) {
            console.error(error);
            setAuthError("Failed to send reset email: " + error.message);
        }
        setLoading(false);
    };

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
                    <button
                        onClick={() => {
                            setIsLogin(!isLogin);
                            setAuthError('');
                            setSuccessMessage('');
                        }}
                        className="text-sm text-blue-600 hover:underline block w-full"
                    >
                        {isLogin ? "New user? Create account" : "Already have an account? Sign in"}
                    </button>
                    <p className="text-xs text-gray-400">Admin Login: {ADMIN_EMAIL}</p>
                </div>
            </div>
        </div>
    );
};

export default LoginScreen;
