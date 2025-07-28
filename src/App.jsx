import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LeadStateProvider,{ useLeadState } from './components/LeadStateProvider';
import LeadsTable from './components/LeadsTable';
import WarmLeads from './components/WarmLeads';
import HotLeads from './components/HotLeads';
import ColdLeads from './components/ColdLeads';
import EnrolledLeads from './components/EnrolledLeads';
import Dashboard from './components/Dashboard'; 
import CounsellorPerformance from './components/CounsellorPerformance';
import Login from './components/Login';
import SettingsPage from './components/SettingsPage';
import SettingsDataProvider from './contexts/SettingsDataProvider';

import { authService } from './services/authService';

function App() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in on app start
    const checkUser = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
          console.log('User already logged in:', currentUser);
        }
      } catch (error) {
        console.error('Error checking user:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkUser();

    // Listen for auth state changes
    const { data: { subscription } } = authService.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event);
      
      if (event === 'SIGNED_IN' && session) {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const handleLogin = (userData) => {
    console.log('handleLogin called with userData:', userData);
    setUser(userData);
  };

  const handleLogout = async () => {
    console.log('handleLogout called, logging out user');
    try {
      await authService.logout();
      setUser(null);
      console.log('Logout complete, user state cleared');
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout fails, clear the user state
      setUser(null);
    }
  };

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px'
      }}>
        <div>Loading...</div>
      </div>
    );
  }

  console.log('App rendering, user:', user);

  return (
    <Router>
      {/* 🔍 DEBUG COMPONENT - Shows user info when logged in */}
      {/*<AccessDebug user={user} />*/}
      
      {!user ? (
        <Login onLogin={handleLogin} />
      ) : (
        <SettingsDataProvider>
          <LeadStateProvider>
            {/* Pass user data to components that need it */}
            <Routes>
              <Route 
                path="/dashboard" 
                element={<Dashboard onLogout={handleLogout} user={user} />} 
              />
              <Route path="/" element={<Navigate to="/all-leads" replace />} />
              <Route 
                path="/all-leads" 
                element={<LeadsTable onLogout={handleLogout} user={user} />} 
              />
              <Route 
                path="/warm" 
                element={<WarmLeads onLogout={handleLogout} user={user} />} 
              />
              <Route 
                path="/hot" 
                element={<HotLeads onLogout={handleLogout} user={user} />} 
              />
              <Route 
                path="/cold" 
                element={<ColdLeads onLogout={handleLogout} user={user} />} 
              />
              <Route 
                path="/enrolled" 
                element={<EnrolledLeads onLogout={handleLogout} user={user} />} 
              />

             
              {/* Only show counsellor performance to admins */}
              {user.role === 'admin' && (
                <Route 
                  path="/counsellor-performance" 
                  element={<CounsellorPerformance onLogout={handleLogout} user={user} />} 
                />
              )}
              {/* Redirect unauthorized users */}
              {user.role !== 'admin' && (
                <Route 
                  path="/counsellor-performance" 
                  element={<Navigate to="/all-leads" replace />} 
                />
              )}
              
              {/* Only show settings to admins */}
              {user.role === 'admin' && (
                <Route 
                  path="/settings" 
                  element={<SettingsPage onLogout={handleLogout} user={user} />} 
                />
              )}
              {/* Redirect unauthorized users */}
              {user.role !== 'admin' && (
                <Route 
                  path="/settings" 
                  element={<Navigate to="/all-leads" replace />} 
                />
              )}
                       
            </Routes>
          </LeadStateProvider>
        </SettingsDataProvider> 
      )}
    </Router>
  );
}

export default App;