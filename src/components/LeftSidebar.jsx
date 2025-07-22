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
  activeSubmenuItem = "all"
}) => {
  
  
  

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
        <a 
          href="/logout" 
          className={`nova-nav-item ${activeNavItem === "logout" ? "active" : ""}`}
        >
          <LogOut size={18} className="nav-icon" />
          Log out
        </a>
      </div>
    </div>
  );
};

export default LeftSidebar;