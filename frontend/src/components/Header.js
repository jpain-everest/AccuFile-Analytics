import { Nav } from 'react-bootstrap';
import { NavLink } from 'react-router-dom';

const Header = () => {
    return (
        <aside className="left-nav-panel">
            <NavLink to="/" className="left-nav-brand">
                <span className="accufile-logo-mark" aria-hidden="true">
                    <svg viewBox="0 0 24 24" className="accufile-logo-mark-svg">
                        <circle cx="12" cy="12" r="10" fill="none" stroke="white" strokeWidth="1.5" />
                        <circle cx="12" cy="12" r="6" fill="none" stroke="white" strokeWidth="1.5" />
                        <circle cx="12" cy="12" r="2.5" fill="white" />
                        <line x1="18" y1="6" x2="13" y2="11" stroke="#3B82F6" strokeWidth="1.8" strokeLinecap="round" />
                        <polygon points="19,3 21,5 18,6.5 17.5,6" fill="#3B82F6" />
                    </svg>
                </span>
                <span className="left-nav-brand-text">A&amp;H AccuFile</span>
            </NavLink>

            <Nav className="left-nav-links flex-column">
                <Nav.Link as={NavLink} to="/" end className="left-nav-link">
                    <span className="left-nav-link-icon" aria-hidden="true">
                        <svg viewBox="0 0 16 16" className="left-nav-link-icon-svg">
                            <path d="M2 3.5A1.5 1.5 0 0 1 3.5 2h9A1.5 1.5 0 0 1 14 3.5v9a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 2 12.5v-9ZM3.5 3a.5.5 0 0 0-.5.5V6h10V3.5a.5.5 0 0 0-.5-.5h-9ZM13 7H3v5.5a.5.5 0 0 0 .5.5h9a.5.5 0 0 0 .5-.5V7Z" />
                        </svg>
                    </span>
                    Summary
                </Nav.Link>
                <Nav.Link as={NavLink} to="/detailed-tracker" className="left-nav-link">
                    <span className="left-nav-link-icon" aria-hidden="true">
                        <svg viewBox="0 0 16 16" className="left-nav-link-icon-svg">
                            <path d="M1.5 1a.5.5 0 0 0-.5.5v13a.5.5 0 0 0 .5.5h13a.5.5 0 0 0 .5-.5v-13a.5.5 0 0 0-.5-.5h-13ZM2 14V2h12v12H2Z" />
                            <path d="M3.5 4h9v1.5h-9V4Zm0 3h9v1.5h-9V7Zm0 3h6v1.5h-6V10Z" />
                        </svg>
                    </span>
                    Detailed Tracker
                </Nav.Link>
                <Nav.Link as={NavLink} to="/assistant" className="left-nav-link">
                    <span className="left-nav-link-icon" aria-hidden="true">
                        <svg viewBox="0 0 16 16" className="left-nav-link-icon-svg">
                            <path d="M1.5 14.5h13a.75.75 0 0 0 0-1.5h-.75V2.75a.75.75 0 0 0-1.5 0V13h-2.5V5.75a.75.75 0 0 0-1.5 0V13h-2.5V8.75a.75.75 0 0 0-1.5 0V13h-2V10.75a.75.75 0 0 0-1.5 0V13H1.5a.75.75 0 0 0 0 1.5Z" />
                        </svg>
                    </span>
                    Assistant
                </Nav.Link>
                <Nav.Link as={NavLink} to="/admin" className="left-nav-link">
                    <span className="left-nav-link-icon" aria-hidden="true">
                        <svg viewBox="0 0 16 16" className="left-nav-link-icon-svg">
                            <path d="M9.67 1.28a1 1 0 0 0-1.34 0l-.33.29a1 1 0 0 1-1 .2l-.42-.16a1 1 0 0 0-1.24.56l-.2.4a1 1 0 0 1-.83.55l-.45.04a1 1 0 0 0-.9.98v.47a1 1 0 0 1-.5.87l-.39.23a1 1 0 0 0-.39 1.3l.2.4a1 1 0 0 1 0 .99l-.2.4a1 1 0 0 0 .4 1.3l.38.22a1 1 0 0 1 .5.88v.46a1 1 0 0 0 .9.99l.45.03a1 1 0 0 1 .83.55l.2.4a1 1 0 0 0 1.24.56l.42-.16a1 1 0 0 1 1 .2l.33.29a1 1 0 0 0 1.34 0l.33-.29a1 1 0 0 1 1-.2l.42.16a1 1 0 0 0 1.24-.56l.2-.4a1 1 0 0 1 .83-.55l.45-.03a1 1 0 0 0 .9-.99v-.46a1 1 0 0 1 .5-.88l.39-.22a1 1 0 0 0 .39-1.3l-.2-.4a1 1 0 0 1 0-.99l.2-.4a1 1 0 0 0-.4-1.3l-.38-.23a1 1 0 0 1-.5-.87v-.47a1 1 0 0 0-.9-.98l-.45-.04a1 1 0 0 1-.83-.55l-.2-.4a1 1 0 0 0-1.24-.56l-.42.16a1 1 0 0 1-1-.2l-.33-.29ZM8 10.5A2.5 2.5 0 1 1 8 5.5a2.5 2.5 0 0 1 0 5Z" />
                        </svg>
                    </span>
                    Admin
                </Nav.Link>
            </Nav>

            <div className="left-nav-footer-logo">
                <img src="/everest-logo.svg" alt="Everest" className="left-nav-logo" />
            </div>
        </aside>
    );
};

export default Header;
