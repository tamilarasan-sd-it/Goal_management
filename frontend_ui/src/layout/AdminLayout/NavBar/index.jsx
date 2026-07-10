import React, { useState } from 'react';
import { Navbar, Nav, Button, Dropdown, NavDropdown } from 'react-bootstrap';
import { Search, Bell, User, LogOut, LayoutDashboard, FolderKanban, FolderPlus, FilePlus, FileText, ChevronDown, Menu, FilePenLine, Target, ClipboardList, FileStack, Settings, FileSearch, CalendarClock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import '../../../assets/css/NavBar.css'; // Import the new CSS file
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../../StoreRedux/actions/AuthActions';

import logo from "../../../assets/images/pdmr_logo2.png";

const NavBar = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const userDetails = useSelector((state) => state.auth);
  const userProfile = userDetails?.user || {};
  const [activePath, setActivePath] = useState(window.location.pathname);

  const handleLogout = () => {
    localStorage.clear();
    dispatch(logout());
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('');
  };

  const NavLinkItem = ({ href, icon: Icon, children, isDropdown = false }) => (
    <Nav.Link
      href={href}
      className={`nav-link-modern ${activePath === href && !isDropdown ? 'active' : ''}`}
      onClick={(e) => { if (href) { e.preventDefault(); navigate(href); setActivePath(href); } }}
      as={!href ? 'div' : 'a'} // Use div if no href to avoid navigation
    >
      <Icon size={18} className="nav-icon" />
      <span className="nav-text">{children}</span>
    </Nav.Link>
  );

  return (
    <React.Fragment>
      <Navbar className="navbar-modern">
        <div className="navbar-container">
          {/* Left section - Brand */}
          <div className="navbar-brand-section" style={{cursor:'pointer'}}>
            <Navbar.Brand className="navbar-brand-modern">
             <div className="brand-logo">
    <img
        src={logo}
        alt="PDMR"
        style={{
            width: 48,
            height: 48,
            objectFit: "contain",
        }}
    />
</div>
              <div className="brand-text">
    <span className="brand-title">
        Goal Management System
    </span>

    <span className="brand-subtitle">
        Perfect Digital Media Resources Pvt. Ltd.
    </span>
</div>
            </Navbar.Brand>
          </div>

          {/* Center section - Navigation Links */}
          <div className="navbar-center-section">
            <Nav className="navbar-nav-modern">
              {/* <NavLinkItem href="/" icon={LayoutDashboard}>
                Dashboard
              </NavLinkItem> */}

              {userProfile.id === '12345' && (
                <Dropdown className="nav-dropdown-modern" as={Nav.Item}>
                  <Dropdown.Toggle as="a" className="nav-link-modern nav-dropdown-toggle" style={{cursor: 'pointer'}}>
                    <FolderKanban size={18} className="nav-icon" />
                    <span className="nav-text">Template Management</span>
                    <ChevronDown size={14} className="dropdown-arrow" />
                  </Dropdown.Toggle>
                  <Dropdown.Menu className="dropdown-menu-modern">
                    <Dropdown.Item href="/add-category" className="dropdown-item-modern">
                      <FolderPlus size={16} className="me-2" />
                      Create Category
                    </Dropdown.Item>
                    <Dropdown.Item href="/add-fields" className="dropdown-item-modern">
                      <FilePlus size={16} className="me-2" />
                      Create Fields
                    </Dropdown.Item>
                    <Dropdown.Item href="/add-template" className="dropdown-item-modern">
                      <FileText size={16} className="me-2" />
                      Create Template
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              )}

              {/* Goal Settings Dropdown */}
              {userProfile.id === '12345' && (
                <Dropdown className="nav-dropdown-modern" as={Nav.Item}>
                  <Dropdown.Toggle as="a" className="nav-link-modern nav-dropdown-toggle" style={{cursor: 'pointer'}}>
                    <FileStack size={18} className="nav-icon" />
                    <span className="nav-text">Goal Settings</span>
                    <ChevronDown size={14} className="dropdown-arrow" />
                  </Dropdown.Toggle>
                  <Dropdown.Menu className="dropdown-menu-modern">
                    {/* <Dropdown.Item href="/create-goal-settings" className="dropdown-item-modern">
                      <FilePenLine size={16} className="me-2" />
                      Create Assignment
                    </Dropdown.Item> */}
                    <Dropdown.Item href="/goal-settings" className="dropdown-item-modern">
                      <ClipboardList size={16} className="me-2" />
                      View Goal Settings
                    </Dropdown.Item>
                    <Dropdown.Item href="/schedule-calls" className="dropdown-item-modern">
                      <CalendarClock size={16} className="me-2" />
                      Schedule calls
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              )}


              {/* Goal Management Dropdown */}
              <Dropdown className="nav-dropdown-modern" as={Nav.Item}>
                <Dropdown.Toggle as="a" className="nav-link-modern nav-dropdown-toggle" style={{cursor: 'pointer'}}>
                  <Target size={18} className="nav-icon" />
                  <span className="nav-text">Goal Management</span>
                  <ChevronDown size={14} className="dropdown-arrow" />
                </Dropdown.Toggle>
                <Dropdown.Menu className="dropdown-menu-modern">
                  {userProfile.id != '1400' && 
                  <Dropdown.Item href="/template-list" className="dropdown-item-modern">
                    <FileText size={16} className="me-2" />
                    Template List
                  </Dropdown.Item>

}
                  {userProfile.id != '12345' && (
                    <Dropdown.Item href="/goal-reviews" className="dropdown-item-modern">
                      <FileSearch size={16} className="me-2" />
                      Review Templates
                    </Dropdown.Item>
                  )}
                </Dropdown.Menu>
              </Dropdown>

              {/* Monthly Updates  Dropdown */}
              {userProfile.id != '1400' && (<Dropdown className="nav-dropdown-modern" as={Nav.Item}>
                <Dropdown.Toggle as="a" className="nav-link-modern nav-dropdown-toggle" style={{cursor: 'pointer'}}>
                  <Target size={18} className="nav-icon" />
                  <span className="nav-text">Monthly Reports</span>
                  <ChevronDown size={14} className="dropdown-arrow" />
                </Dropdown.Toggle>

                <Dropdown.Menu className="dropdown-menu-modern">

                  <Dropdown.Item href="/view-goals" className="dropdown-item-modern">
                    <FileText size={16} className="me-2" />
                    List Of All Goals
                  </Dropdown.Item>

                  {userProfile.id != '12345' && (
                    <Dropdown.Item href="/monthly-updates" className="dropdown-item-modern">
                      <FileText size={16} className="me-2" />
                      Monthly Updates
                    </Dropdown.Item>
                  )}

                  {(userProfile.id == '12345' || userProfile.id == '1400') && (
                    <Dropdown.Item href="/monthly-updates/report" className="dropdown-item-modern">
                      <FileText size={16} className="me-2" />
                      Monthly Updates Reports
                    </Dropdown.Item>
                  )}

                </Dropdown.Menu>
              </Dropdown>
              )}


            </Nav>
          </div>

          {/* Right section - User */}
          <div className="navbar-right-section ms-auto">
            {/* User Profile Dropdown */}
            <Dropdown align="end" className="user-menu-modern">
              <Dropdown.Toggle
                as="a"
                className="user-toggle-modern"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '6px 12px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  background: 'rgba(255, 255, 255, 0.05)',
                  transition: 'all 0.2s ease',
                  textDecoration: 'none',
                  cursore: 'pointer'
                }}
              >
                <div className="user-details-nav">
                  <div className="user-name-nav">{userProfile.emp_name || 'User'}</div>
                </div>
                <div
                  className="user-avatar-initials"
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '600',
                    fontSize: '14px',
                    color: 'white',
                    border: '2px solid rgba(255, 255, 255, 0.2)'
                  }}
                >
                  {getInitials(userProfile.emp_name)}
                </div>
                <ChevronDown
                  size={14}
                  style={{
                    opacity: '0.7',
                    color: '#fff'
                  }}
                />
              </Dropdown.Toggle>

              <Dropdown.Menu
                className="dropdown-menu-user"
                style={{
                  minWidth: '280px',
                  padding: '0',
                  borderRadius: '12px',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
                  border: '1px solid rgba(0, 0, 0, 0.08)',
                  marginTop: '8px'
                }}
              >
                <div
                  style={{
                    padding: '20px',
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'center',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    borderRadius: '12px 12px 0 0'
                  }}
                >
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      background: 'rgba(255, 255, 255, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '700',
                      fontSize: '18px',
                      color: 'white',
                      border: '2px solid rgba(255, 255, 255, 0.3)'
                    }}
                  >
                    {getInitials(userProfile.emp_name)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: '16px',
                        fontWeight: '600',
                        color: 'white',
                        marginBottom: '2px'
                      }}
                    >
                      {userProfile.emp_name || 'User'}
                    </div>
                    <div
                      style={{
                        fontSize: '13px',
                        color: 'rgba(255, 255, 255, 0.8)'
                      }}
                    >
                      {userProfile.userRoleName || 'User'}
                    </div>
                  </div>
                </div>

                <Dropdown.Divider style={{ margin: '0' }} />

                <Dropdown.Item
                  onClick={handleLogout}
                  className="dropdown-item-logout"
                  style={{
                    padding: '12px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    color: '#dc3545',
                    fontWeight: '500',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <LogOut size={16} className="me-2" />
                  Sign Out
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </div>
        </div>
      </Navbar>
    </React.Fragment>
  );
};

export default NavBar;