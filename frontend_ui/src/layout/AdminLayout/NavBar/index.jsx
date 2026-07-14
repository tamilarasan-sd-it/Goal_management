import React, { useState } from 'react';
import { Navbar, Nav, Dropdown } from 'react-bootstrap';
import {
  FileText,
  ChevronDown,
  LogOut,
  FolderPlus,
  FilePlus,
  ClipboardList,
  CalendarClock,
  Target,
  FileSearch,
  FileStack,
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../../StoreRedux/actions/AuthActions';
import logo from "../../../assets/images/pdmr_logo2.png";
import '../../../assets/css/NavBar.css';

const NavBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const userDetails = useSelector((state) => state.auth);
  const userProfile = userDetails?.user || {};
  const [activePath, setActivePath] = useState(location.pathname);

  const handleLogout = () => {
    localStorage.clear();
    dispatch(logout());
    navigate('/login');
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const handleNavigate = (path) => {
    navigate(path);
    setActivePath(path);
  };

  const NavLinkItem = ({ href, icon: Icon, children }) => (
    <Nav.Link
      as="button"
      type="button"
      className={`nav-link-modern ${activePath === href ? 'active' : ''}`}
      onClick={() => handleNavigate(href)}
    >
      <Icon size={18} className="nav-icon" />
      <span className="nav-text">{children}</span>
    </Nav.Link>
  );

  return (
    <Navbar className="navbar-modern" expand="lg" sticky="top">
      <div className="navbar-container">
        <div
          className="navbar-brand-section"
          onClick={() => handleNavigate('/')}
          style={{ cursor: 'pointer' }}
        >
          <Navbar.Brand className="navbar-brand-modern">
            <div className="brand-logo">
              <img src={logo} alt="PDMR" />
            </div>
            <div className="brand-text">
              <span className="brand-title">Goal Management System</span>
              <span className="brand-subtitle">Perfect Digital Media Resources Pvt. Ltd.</span>
            </div>
          </Navbar.Brand>
        </div>

        <Navbar.Toggle aria-controls="navbar-nav-modern" className="navbar-toggler-modern" />

        <Navbar.Collapse id="navbar-nav-modern" className="navbar-collapse-modern">
          <div className="navbar-center-shell">
            <Nav className="navbar-nav-modern">
              {userProfile.id === '12345' && (
                <Dropdown as={Nav.Item} className="nav-dropdown-modern">
                  <Dropdown.Toggle as="button" className="nav-link-modern nav-dropdown-toggle">
                    <FileStack size={18} className="nav-icon" />
                    <span className="nav-text">Template Management</span>
                    <ChevronDown size={14} className="dropdown-arrow" />
                  </Dropdown.Toggle>
                  <Dropdown.Menu className="dropdown-menu-modern">
                    <Dropdown.Item onClick={() => handleNavigate('/add-category')} className="dropdown-item-modern">
                      <FolderPlus size={16} className="me-2" />
                      Create Category
                    </Dropdown.Item>
                    <Dropdown.Item onClick={() => handleNavigate('/add-fields')} className="dropdown-item-modern">
                      <FilePlus size={16} className="me-2" />
                      Create Fields
                    </Dropdown.Item>
                    <Dropdown.Item onClick={() => handleNavigate('/add-template')} className="dropdown-item-modern">
                      <FileText size={16} className="me-2" />
                      Create Template
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              )}

              {userProfile.id === '12345' && (
                <Dropdown as={Nav.Item} className="nav-dropdown-modern">
                  <Dropdown.Toggle as="button" className="nav-link-modern nav-dropdown-toggle">
                    <ClipboardList size={18} className="nav-icon" />
                    <span className="nav-text">Goal Settings</span>
                    <ChevronDown size={14} className="dropdown-arrow" />
                  </Dropdown.Toggle>
                  <Dropdown.Menu className="dropdown-menu-modern">
                    <Dropdown.Item onClick={() => handleNavigate('/goal-settings')} className="dropdown-item-modern">
                      <ClipboardList size={16} className="me-2" />
                      View Goal Settings
                    </Dropdown.Item>
                    <Dropdown.Item onClick={() => handleNavigate('/schedule-calls')} className="dropdown-item-modern">
                      <CalendarClock size={16} className="me-2" />
                      Schedule calls
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              )}

              <Dropdown as={Nav.Item} className="nav-dropdown-modern">
                <Dropdown.Toggle as="button" className="nav-link-modern nav-dropdown-toggle">
                  <Target size={18} className="nav-icon" />
                  <span className="nav-text">Goal Management</span>
                  <ChevronDown size={14} className="dropdown-arrow" />
                </Dropdown.Toggle>
                <Dropdown.Menu className="dropdown-menu-modern">
                  {userProfile.id !== '1400' && (
                    <Dropdown.Item onClick={() => handleNavigate('/template-list')} className="dropdown-item-modern">
                      <FileText size={16} className="me-2" />
                      Template List
                    </Dropdown.Item>
                  )}
                  {userProfile.id !== '12345' && (
                    <Dropdown.Item onClick={() => handleNavigate('/goal-reviews')} className="dropdown-item-modern">
                      <FileSearch size={16} className="me-2" />
                      Review Templates
                    </Dropdown.Item>
                  )}
                </Dropdown.Menu>
              </Dropdown>

              {userProfile.id !== '1400' && (
                <Dropdown as={Nav.Item} className="nav-dropdown-modern">
                  <Dropdown.Toggle as="button" className="nav-link-modern nav-dropdown-toggle">
                    <FileText size={18} className="nav-icon" />
                    <span className="nav-text">Monthly Reports</span>
                    <ChevronDown size={14} className="dropdown-arrow" />
                  </Dropdown.Toggle>
                  <Dropdown.Menu className="dropdown-menu-modern">
                    <Dropdown.Item onClick={() => handleNavigate('/view-goals')} className="dropdown-item-modern">
                      <FileText size={16} className="me-2" />
                      List Of All Goals
                    </Dropdown.Item>
                    {userProfile.id !== '12345' && (
                      <Dropdown.Item onClick={() => handleNavigate('/monthly-updates')} className="dropdown-item-modern">
                        <FileText size={16} className="me-2" />
                        Monthly Updates
                      </Dropdown.Item>
                    )}
                    {(userProfile.id === '12345' || userProfile.id === '1400') && (
                      <Dropdown.Item onClick={() => handleNavigate('/monthly-updates/report')} className="dropdown-item-modern">
                        <FileText size={16} className="me-2" />
                        Monthly Updates Reports
                      </Dropdown.Item>
                    )}
                  </Dropdown.Menu>
                </Dropdown>
              )}
            </Nav>
          </div>

          <div className="navbar-right-section">
            <Dropdown align="end" className="user-menu-modern">
              <Dropdown.Toggle as="button" className="user-toggle-modern">
                <div className="user-details-nav">
                  <div className="user-name-nav">{userProfile.emp_name || 'User'}</div>
                </div>
                <div className="user-avatar-initials">
                  {getInitials(userProfile.emp_name)}
                </div>
                <ChevronDown size={14} className="user-chevron" />
              </Dropdown.Toggle>

              <Dropdown.Menu className="dropdown-menu-user">
                <div className="user-card-head">
                  <div className="user-avatar-large">
                    {getInitials(userProfile.emp_name)}
                  </div>
                  <div className="user-card-info">
                    <div className="user-card-name">{userProfile.emp_name || 'User'}</div>
                    <div className="user-card-role">{userProfile.userRoleName || 'User'}</div>
                  </div>
                </div>

                <Dropdown.Divider className="dropdown-divider-modern" />

                <Dropdown.Item onClick={handleLogout} className="dropdown-item-logout">
                  <LogOut size={16} className="me-2" />
                  Sign Out
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </div>
        </Navbar.Collapse>
      </div>
    </Navbar>
  );
};

export default NavBar;