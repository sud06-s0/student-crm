import novalogo from '../NovaLogo.jpg';
import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { 
  BarChart3, 
  Users, 
  TrendingUp, 
  MessageCircle, 
  Settings, 
  LogOut, 
  User,
  Flame,
  Star,
  Snowflake,
  CheckCircle,
  Play,
  ChevronDown
} from 'lucide-react';

const LeftSidebar = ({ 
  activeNavItem = "leads", 
  activeSubmenuItem = "all",
  onLogout,  // Add this prop
  user       // Add this prop to get user info
}) => {
  
  const handleLogout = async (e) => {
    e.preventDefault(); // Prevent default link behavior
    
    if (window.confirm('Are you sure you want to logout?')) {
      try {
        console.log('Logout initiated from sidebar');
        await onLogout(); // Call the logout function from parent
      } catch (error) {
        console.error('Logout failed:', error);
        alert('Logout failed. Please try again.');
      }
    }
  };

  return (
    <div className="nova-sidebar">
      {/* Logo */}
      <div className="nova-logo">
        <a href="/" style={{ textDecoration: 'none' }}>
          <img 
            src={novalogo} 
            alt="NOVA International School" 
            className="logo-image"
            style={{
              width: '100%',
              maxWidth: '180px',
              height: 'auto',
              marginBottom: '20px',
              cursor: 'pointer'
            }}
          />
        </a>
      </div>

      {/* User Info (Optional - shows current logged in user) */}
      {user && (
        <div className="nova-user-info" style={{
          padding: '10px 15px',
          marginBottom: '20px',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          border: '1px solid #e9ecef'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <User size={16} style={{ color: '#6c757d' }} />
            <div>
              <div style={{ fontSize: '14px', fontWeight: '500', color: '#495057' }}>
                {user.full_name || user.email}
              </div>
              <div style={{ fontSize: '12px', color: '#6c757d', textTransform: 'capitalize' }}>
                {user.role}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="nova-nav">
        <a 
          href="/dashboard" 
          className={`nova-nav-item ${activeNavItem === "dashboard" ? "active" : ""}`}
        >
          <BarChart3 size={18} className="nav-icon" />
          Dashboard
        </a>
        
        <a 
          href="/counsellor-performance" 
          className={`nova-nav-item ${activeNavItem === "counsellor" ? "active" : ""}`}
        >
          <TrendingUp size={18} className="nav-icon" />
          Counsellor Performance
        </a>
        
        <a 
          href="https://www.app.aisensy.com/projects/680f28f6e0cc850c02c34bb8/history" 
          target="_blank" 
          rel="noopener noreferrer"
          className={`nova-nav-item ${activeNavItem === "messenger" ? "active" : ""}`}
        >
          <MessageCircle size={18} className="nav-icon" />
          Alsensy Messenger
        </a>
      </nav>

      {/* All Leads Section */}
      <div className="nova-all-leads">
        <div className={`all-leads-header ${activeNavItem === "leads" ? "active" : ""}`}>
          <Users size={18} className="nav-icon" />
          Leads
        </div>
        <div className="all-leads-submenu">
          <a 
            href="/all-leads" 
            className={`submenu-item ${activeSubmenuItem === "all" ? "active" : ""}`}
          >
            <Users size={14} className="submenu-icon" />
            All Leads
          </a>
          <a 
            href="/warm" 
            className={`submenu-item ${activeSubmenuItem === "warm" ? "active" : ""}`}
          >
            <Flame size={14} className="submenu-icon" />
            Warm
          </a>
          <a 
            href="/hot" 
            className={`submenu-item ${activeSubmenuItem === "hot" ? "active" : ""}`}
          >
            <Star size={14} className="submenu-icon" />
            Hot
          </a>
          <a 
            href="/cold" 
            className={`submenu-item ${activeSubmenuItem === "cold" ? "active" : ""}`}
          >
            <Snowflake size={14} className="submenu-icon" />
            Cold
          </a>
          <a 
            href="/enrolled" 
            className={`submenu-item ${activeSubmenuItem === "enrolled" ? "active" : ""}`}
          >
            <CheckCircle size={14} className="submenu-icon" />
            Enrolled
          </a>
        </div>
      </div>

      {/* Settings */}
      <div className="nova-settings">
        <a 
          href="/settings" 
          className={`nova-nav-item ${activeNavItem === "settings" ? "active" : ""}`}
        >
          <Settings size={18} className="nav-icon" />
          Settings
        </a>
        
        {/* Updated Logout - now calls the logout function */}
        <button 
          onClick={handleLogout}
          className={`nova-nav-item ${activeNavItem === "logout" ? "active" : ""}`}
          style={{
            background: 'none',
            border: 'none',
            width: '100%',
            textAlign: 'left',
            cursor: 'pointer',
            color: 'inherit',
            fontSize: 'inherit',
            fontFamily: 'inherit'
          }}
        >
          <LogOut size={18} className="nav-icon" />
          Log out
        </button>
      </div>
    </div>
  );
};

export default LeftSidebar;