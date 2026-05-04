import React from 'react';
import { Row, Col, Card } from 'react-bootstrap';
import FileTree from '../components/FileTree';

const ExplorerPage = ({ 
    fileStructure,
    onFileSelect
}) => {
    return (
        <div className="explorer-page page-container">
            <div className="dashboard-header mb-2">
                <p className="dashboard-subtitle">Deep-Dive Risk Assessment & AI Intelligence</p>
            </div>

            <Row className="mb-2">
                <Col lg={12} className="mb-2">
                    <Card className="explorer-panel-card">
                        <Card.Body className="p-0">
                            <FileTree fileStructure={fileStructure} onFileSelect={onFileSelect} />
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

        </div>
    );
};

export default ExplorerPage;
