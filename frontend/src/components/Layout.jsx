import { useNavigate, useLocation } from 'react-router-dom';
import ThemeSelector from './ThemeSelector';
import { 
  Zap, 
  List, 
  Timer, 
  BarChart3, 
  LogOut,
  Grid3X3
} from 'lucide-react';
import './Layout.css';

function Layout({ user, onLogout, children }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className="layout-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo-container">
            <div className="logo-main">OXY</div>
            <div className="logo-sub">Productivity</div>
          </div>
        </div>

        <nav className="nav-menu">
          <button 
            onClick={() => navigate('/home')}
            className={`nav-item ${isActive('/home') ? 'active' : ''}`}
          >
            <Zap className="nav-icon" size={20} />
            <span>Today</span>
          </button>
          <button 
            onClick={() => navigate('/backlog')}
            className={`nav-item ${isActive('/backlog') ? 'active' : ''}`}
          >
            <List className="nav-icon" size={20} />
            <span>Backlog</span>
          </button>
          <button 
            onClick={() => navigate('/eisenhower')}
            className={`nav-item ${isActive('/eisenhower') ? 'active' : ''}`}
          >
            <Grid3X3 className="nav-icon" size={20} />
            <span>Eisenhower</span>
          </button>
          <button className="nav-item">
            <Timer className="nav-icon" size={20} />
            <span>Pomodoro</span>
          </button>
          <button className="nav-item">
            <BarChart3 className="nav-icon" size={20} />
            <span>Analytics</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <ThemeSelector />
          
          <div className="user-info">
            <div className="user-avatar">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="user-details">
              <div className="user-name">{user?.name || 'User'}</div>
              <div className="user-email">{user?.email}</div>
            </div>
          </div>
          
          <button onClick={handleLogout} className="logout-button">
            <LogOut size={16} />
            <span>Logout</span>
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

