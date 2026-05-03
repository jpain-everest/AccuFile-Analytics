import React from 'react';
import { Nav, Button } from 'react-bootstrap';
import FileTree from './FileTree';

const Sidebar = ({ onRunWorkflow, fileStructure, onFileSelect }) => {
    return (
        <div className="sidebar">
            <div className="sidebar-header mb-2">
                <h6 className="text-muted text-uppercase">Actions</h6>
            </div>
            <Nav className="flex-column">
                <Button 
                    variant="primary" 
                    onClick={onRunWorkflow}
                    className="mb-2 d-flex align-items-center justify-content-start"
                    size="sm"
                >
                    <span className="me-2">▶</span>
                    Run File Review
                </Button>
            </Nav>
            <hr className="my-2" />
            <div className="sidebar-section flex-grow-1 d-flex flex-column">
                <div className="sidebar-header mb-2">
                    <h6 className="text-dark text-uppercase fw-bold" style={{ fontSize: '0.85rem', letterSpacing: '0.5px' }}>📁 Current Folder Structure</h6>
                </div>
                <FileTree fileStructure={fileStructure} onFileSelect={onFileSelect} />
            </div>
        </div>
    );
};

export default Sidebar;
