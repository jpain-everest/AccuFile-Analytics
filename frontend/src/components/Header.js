import { Navbar, Container, Nav, NavDropdown } from 'react-bootstrap';
import { NavLink } from 'react-router-dom';

const Header = () => {
    const handleChangePassword = () => {
        alert('Change Password functionality coming soon');
    };

    const handleLogout = () => {
        alert('Logout functionality coming soon');
    };

    return (
        <Navbar expand="lg" className="custom-navbar py-0">
            <Container fluid>
                <Navbar.Brand as={NavLink} to="/" className="brand-logo me-4">
                    <span className="brand-text">A&H ACCUFILE ASSIST</span>
                </Navbar.Brand>
                
                <Nav className="me-auto header-nav">
                    <Nav.Link as={NavLink} to="/risk-assessment" className="header-nav-link">
                        SUBMISSION COMPLETENESS TRACKER
                    </Nav.Link>
                    <Nav.Link as={NavLink} to="/explorer" className="header-nav-link">
                        ANALYTICS
                    </Nav.Link>
                    <Nav.Link as={NavLink} to="/configuration" className="header-nav-link">
                        ADMIN
                    </Nav.Link>
                </Nav>

                <Nav className="ms-auto">
                    <NavDropdown 
                        title={
                            <span className="profile-dropdown-toggle">
                                <span className="profile-icon">👤</span>
                                <span className="profile-name">John Smith</span>
                            </span>
                        }
                        id="profile-dropdown"
                        align="end"
                        className="profile-dropdown"
                    >
                        <NavDropdown.Item onClick={handleChangePassword}>
                            🔐 Change Password
                        </NavDropdown.Item>
                        <NavDropdown.Divider />
                        <NavDropdown.Item onClick={handleLogout}>
                            🚪 Logout
                        </NavDropdown.Item>
                    </NavDropdown>
                </Nav>
            </Container>
        </Navbar>
    );
};

export default Header;
