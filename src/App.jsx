import React, { useEffect } from 'react';
import LoadingSpinner from './components/shared/LoadingSpinner';
import LoginScreen from './components/auth/LoginScreen';
import AdminDashboard from './components/admin/AdminDashboard';
import TeacherDashboard from './components/teacher/TeacherDashboard';
import { useAuth } from './hooks/useAuth';
import { useIPAddress } from './hooks/useIPAddress';
import { useNetworkConfig } from './hooks/useNetworkConfig';

export default function AttendanceApp() {
  const { user, loading, isAdminMode, login, signup, logout, resetPassword } = useAuth();
  const { currentIP, fetchIP } = useIPAddress();
  const { allowedSchoolIP } = useNetworkConfig(user);

  // Fetch IP on mount
  useEffect(() => {
    fetchIP();
  }, [fetchIP]);

  // Show loading spinner while auth state is being determined
  if (loading) {
    return <LoadingSpinner />;
  }

  // Show login screen if user is not authenticated
  if (!user) {
    return (
      <LoginScreen
        onLogin={login}
        onSignup={signup}
        onForgotPassword={resetPassword}
      />
    );
  }

  // Show appropriate dashboard based on user role
  return isAdminMode ? (
    <AdminDashboard
      user={user}
      onLogout={logout}
      currentIP={currentIP}
      allowedSchoolIP={allowedSchoolIP}
    />
  ) : (
    <TeacherDashboard
      user={user}
      onLogout={logout}
      currentIP={currentIP}
      allowedSchoolIP={allowedSchoolIP}
      fetchIP={fetchIP}
    />
  );
}