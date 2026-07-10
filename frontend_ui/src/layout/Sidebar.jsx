import React from 'react';
import { Nav } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, List, Settings, ChevronsLeft, ChevronsRight } from 'lucide-react';
import '../assets/css/Sidebar.css';

const Sidebar = ({ isCollapsed, currentPath }) => {
  const navigate = useNavigate();
  const menuItems = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} /> },
    { name: 'Category', path: '/category', icon: <List size={20} /> },
    { name: 'Add Templates', path: '/addtemplates', icon: <Settings size={20} /> },
  ];

  const handleNavigate = (path) => {
    navigate(path);
  };

  return (
    <div className={`sidebar ${isCollapsed ? 'collapsed' : 'expanded'}`}>
      <div className="sidebar-header">
        <h3 className="fw-bold" style={{ color: '#6c757d' }}>
          {isCollapsed ? 'G' : 'GOAL'}
        </h3>
      </div>

      <Nav className="flex-column">
        {menuItems.map((item) => (
          <Nav.Item key={item.name}>
            <Nav.Link
              onClick={() => handleNavigate(item.path)}
              className={`sidebar-link ${currentPath === item.path ? 'active' : ''}`}
              title={isCollapsed ? item.name : ''}
            >
              <div className="sidebar-icon">{item.icon}</div>
              {!isCollapsed && <span className="sidebar-text">{item.name}</span>}
            </Nav.Link>
          </Nav.Item>
        ))}
      </Nav>
    </div>
  );
};

export default Sidebar;