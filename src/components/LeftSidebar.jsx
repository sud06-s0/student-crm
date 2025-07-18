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
  stages = [], 
  getStageCount = () => 0,
  stagesTitle = "Stages",
  stagesIcon = Play
}) => {
  
  const StagesIcon = stagesIcon;

  const [stagesExpanded, setStagesExpanded] = useState(true); 

  return (
    <div className="nova-sidebar">
      {/* Logo */}
<div className="nova-logo">
  <img 
    src={novalogo} 
    alt="NOVA International School" 
    className="logo-image"
    style={{
      width: '100%',
      maxWidth: '180px',
      height: 'auto',
      marginBottom: '20px'
    }}
  />
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
          href="/messenger" 
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
          All Leads
        </div>
        <div className="all-leads-submenu">
          <a 
            href="/all-leads" 
            className={`submenu-item ${activeSubmenuItem === "all" ? "active" : ""}`}
          >
            <Users size={14} className="submenu-icon" />
            All
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

      {/* Stages Section */}
      {stages.length > 0 && (
        <div className="nova-stages">
          <div 
  className="stages-header" 
  style={{ backgroundColor: '#676767', color: 'white', cursor: 'pointer' }}
  onClick={() => setStagesExpanded(!stagesExpanded)}>
    
  <StagesIcon size={12} className="stages-icon" />
  {stagesTitle}
  <ChevronRight 
    size={14} 
    className="dropdown-arrow" 
    style={{ 
      transform: stagesExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
      transition: 'transform 0.2s ease'
    }}
  />
</div>
          {stagesExpanded && (
  <div className="stage-list">
    {stages.map(stage => (
      <div key={stage.value} className="stage-item">
        <span 
          className="stage-dot" 
          style={{ backgroundColor: stage.color }}
        ></span>
        <span className="stage-name">{stage.label}</span>
        <span className="stage-count">
          {getStageCount(stage.value).toString().padStart(2, '0')}
        </span>
      </div>
    ))}
  </div>
)}
        </div>
      )}

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