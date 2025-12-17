import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ThemeSelector from './ThemeSelector';
import { 
  Zap, 
  List, 
  BarChart3, 
  LogOut,
  Grid3X3,
  Calendar,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import './Layout.css';

function Layout({ user, onLogout, children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className={`layout-container ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <div className="logo-container">
            <div className="logo-main">OXY</div>
            {!sidebarCollapsed && <div className="logo-sub">Productivity</div>}
          </div>
          <button 
            className="sidebar-toggle"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            title={sidebarCollapsed ? 'Expand menu' : 'Collapse menu'}
          >
            {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        <nav className="nav-menu">
          <button 
            onClick={() => navigate('/backlog')}
            className={`nav-item ${isActive('/backlog') ? 'active' : ''}`}
            title="To Do List"
          >
            <List className="nav-icon" size={20} />
            {!sidebarCollapsed && <span>To Do List</span>}
          </button>
          <button 
            onClick={() => navigate('/home')}
            className={`nav-item ${isActive('/home') ? 'active' : ''}`}
            title="Daily View"
          >
            <Zap className="nav-icon" size={20} />
            {!sidebarCollapsed && <span>Daily View</span>}
          </button>
          <button 
            onClick={() => navigate('/weekly')}
            className={`nav-item ${isActive('/weekly') ? 'active' : ''}`}
            title="Weekly View"
          >
            <Calendar className="nav-icon" size={20} />
            {!sidebarCollapsed && <span>Weekly View</span>}
          </button>
          <button 
            onClick={() => navigate('/eisenhower')}
            className={`nav-item ${isActive('/eisenhower') ? 'active' : ''}`}
            title="Eisenhower Prioritization"
          >
            <Grid3X3 className="nav-icon" size={20} />
            {!sidebarCollapsed && <span>Eisenhower</span>}
          </button>
          <button className="nav-item" title="Analytics">
            <BarChart3 className="nav-icon" size={20} />
            {!sidebarCollapsed && <span>Analytics</span>}
          </button>
        </nav>

        <div className="sidebar-footer">
          {!sidebarCollapsed && <ThemeSelector />}
          
          <div className="user-info">
            <div className="user-avatar">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            {!sidebarCollapsed && (
              <div className="user-details">
                <div className="user-name">{user?.name || 'User'}</div>
                <div className="user-email">{user?.email}</div>
              </div>
            )}
          </div>
          
          <button onClick={handleLogout} className="logout-button" title="Logout">
            <LogOut size={16} />
            {!sidebarCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content-wrapper">
        {children}
      </main>
    </div>
  );
}

export default Layout;

