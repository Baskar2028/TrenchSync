import { NavLink } from 'react-router-dom';
import './Sidebar.css';

const navItems = [
  { path: '/', icon: '🏠', label: 'Overview' },
  { path: '/planning', icon: '📝', label: 'Work Planning' },
  { path: '/map', icon: '🗺️', label: 'GIS Map' },
  { path: '/conflicts', icon: '⚠️', label: 'Conflicts' },
  { path: '/coordination', icon: '🤝', label: 'Coordination' },
  { path: '/road-memory', icon: '📜', label: 'Road Memory' },
  { path: '/impact', icon: '📊', label: 'Impact' },
  { path: '/settings', icon: '⚙️', label: 'Settings' }
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <h2>TRENCHSYNC</h2>
        <p className="tagline">Coordinate Before You Dig.</p>
      </div>
      <nav className="sidebar-nav">
        {navItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-footer">
        Demo dataset — synthetic data for prototype demonstration
      </div>
    </aside>
  );
}
