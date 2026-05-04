import { Nav } from 'react-bootstrap';
import { NavLink } from 'react-router-dom';

const Sidebar = () => {
    return (
        <div className="sidebar">
            <div className="sidebar-header">
                <h6 className="text-uppercase">Navigation</h6>
            </div>
            <Nav className="flex-column mb-4">
                <Nav.Link as={NavLink} to="/" end className="sidebar-nav-link">
                    DASHBOARD
                </Nav.Link>
                <Nav.Link as={NavLink} to="/explorer" className="sidebar-nav-link">
                    POLICY EXPLORER
                </Nav.Link>
            </Nav>
        </div>
    );
};

export default Sidebar;
