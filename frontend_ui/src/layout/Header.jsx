import React from 'react';
import { Menu, LogOut, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Navbar, Container, Button } from 'react-bootstrap';
import { logout } from '../StoreRedux/actions/AuthActions';
import { useDispatch } from 'react-redux';

const Header = ({ handleDrawerToggle }) => {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const handleLogout = () => {
        dispatch(logout());
    };

    return (
        <Navbar bg="light" expand="lg" className="shadow-sm header-nav">
            <Container fluid className="px-4">
                {/* Menu Toggle */}
                <Button variant="link" onClick={handleDrawerToggle} className="p-0 me-3 text-dark">
                    <Menu size={24} />
                </Button>


                {/* Logout Button */}
                <Button onClick={handleLogout} variant="outline-danger" className="d-flex align-items-center gap-2">
                    <LogOut size={18} />
                    <span className="d-none d-sm-inline">Logout</span>
                </Button>
            </Container>
        </Navbar>
    );
};

export default Header;