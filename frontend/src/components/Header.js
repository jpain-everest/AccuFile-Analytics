import React from 'react';
import { Navbar, Container, Badge } from 'react-bootstrap';

const Header = () => {
    return (
        <Navbar bg="dark" variant="dark" expand="lg" className="custom-navbar shadow-sm">
            <Container fluid>
                <Navbar.Brand href="#home" className="brand-logo">
                    <span className="brand-icon">📁</span>
                    <span className="brand-text">
                        <strong>A&H AccuFile</strong>
                        <Badge bg="primary" className="ms-2" style={{ fontSize: '0.65rem', verticalAlign: 'middle' }}>Pro</Badge>
                    </span>
                </Navbar.Brand>
                <div className="ms-auto">
                    <span className="text-white fw-semibold" style={{ fontSize: '1rem', letterSpacing: '0.5px' }}>Accident & Health Underwriting</span>
                </div>
            </Container>
        </Navbar>
    );
};

export default Header;
