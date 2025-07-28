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
  activeNavItem = "", 
  activeSubmenuItem = "",
  onLogout,  
  user       
}) => {
  
  // Check if user is admin
  const isAdmin = user?.role === 'admin';
  
  const handleLogout = async (e) => {
    e.preventDefault();
    
    if (window.confirm('Are you sure you want to logout?')) {
      try {
        console.log('Logout initiated from sidebar');
        await onLogout();
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

      {/* User Info */}
      {user && (
        <div className="nova-user-info" style={{
          padding: '10px 15px',
          marginBottom: '20px',
          backgroundColor: isAdmin ? '#fee2e2' : '#dbeafe',
          borderRadius: '8px',
          border: `1px solid ${isAdmin ? '#fecaca' : '#bfdbfe'}`
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <User size={16} style={{ color: isAdmin ? '#dc2626' : '#2563eb' }} />
            <div>
              <div style={{ fontSize: '14px', fontWeight: '500', color: '#495057' }}>
                {user.full_name || user.email}
              </div>
              <div style={{ 
                fontSize: '12px', 
                color: isAdmin ? '#dc2626' : '#2563eb', 
                textTransform: 'capitalize',
                fontWeight: '500'
              }}>
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
        
        {/* ADMIN ONLY: Counsellor Performance */}
        {isAdmin && (
          <a 
            href="/counsellor-performance" 
            className={`nova-nav-item ${activeNavItem === "counsellor" ? "active" : ""}`}
          >
            <TrendingUp size={18} className="nav-icon" />
            Counsellor Performance
          </a>
        )}
        
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

      {/* Settings & Logout */}
      <div className="nova-settings">
        {/* ADMIN ONLY: Settings */}
        {isAdmin && (
          <a 
            href="/settings" 
            className={`nova-nav-item ${activeNavItem === "settings" ? "active" : ""}`}
          >
            <Settings size={18} className="nav-icon" />
            Settings
          </a>
        )}
        
        {/* Logout - available to all users */}
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

      {/* ← NEW: Add CSS for submenu behavior */}
      <style jsx>{`
        
        /* Ensure submenu only shows when parent is active */
        .nova-all-leads .all-leads-submenu {
          opacity: 1;
          max-height: 300px;
          transition: all 0.3s ease;
        }
      `}</style>
    </div>
  );
};

export default LeftSidebar;