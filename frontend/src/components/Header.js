import { Navbar, Container, Nav } from 'react-bootstrap';
import { NavLink } from 'react-router-dom';

const Header = () => {
    return (
        <Navbar expand="lg" className="custom-navbar py-0">
            <Container fluid>
                <Navbar.Brand as={NavLink} to="/" className="brand-logo me-4">
                    <span className="brand-text">A&H ACCUFILE</span>
                </Navbar.Brand>
                
                <Nav className="me-auto header-nav">
                    <Nav.Link as={NavLink} to="/" end className="header-nav-link">
                        DASHBOARD
                    </Nav.Link>
                    <Nav.Link as={NavLink} to="/risk-assessment" className="header-nav-link">
                        RISK ASSESSMENT
                    </Nav.Link>
                    <Nav.Link as={NavLink} to="/explorer" className="header-nav-link">
                        POLICY EXPLORER
                    </Nav.Link>
                </Nav>

                <div className="ms-auto d-none d-lg-block">
                    <span className="text-white-50 text-uppercase" style={{ fontSize: '0.65rem', letterSpacing: '2px', fontWeight: 700 }}>
                        EVEREST GLOBAL SERVICES
                    </span>
                </div>
            </Container>
        </Navbar>
    );
};

export default Header;
