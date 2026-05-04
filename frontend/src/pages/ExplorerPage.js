import React from 'react';
import { Row, Col, Card } from 'react-bootstrap';
import RiskScores from '../components/RiskScores';
import LLMInsights from '../components/LLMInsights';
import FileTree from '../components/FileTree';

const ExplorerPage = ({ 
    policyRiskScores, 
    validationResults, 
    llmInsights, 
    logs,
    fileStructure,
    onFileSelect
}) => {
    return (
        <div className="explorer-page page-container">
            <div className="dashboard-header mb-4">
                <p className="dashboard-subtitle">Deep-Dive Risk Assessment & AI Intelligence</p>
            </div>

            <Row className="mb-4">
                <Col lg={4} className="mb-4">
                    <Card className="explorer-panel-card">
                        <Card.Body className="p-0">
                            <FileTree fileStructure={fileStructure} onFileSelect={onFileSelect} />
                        </Card.Body>
                    </Card>
                </Col>
                <Col lg={8}>
                    <RiskScores riskScores={policyRiskScores} validationResults={validationResults} />
                    
                    <div className="mt-4">
                        <LLMInsights llmInsights={llmInsights} />
                    </div>
                </Col>
            </Row>

            <Row>
                <Col md={12}>
                    <div className="logs-section">
                        <h3 className="card-header-custom mb-3">
                            SYSTEM PROCESSING LOGS
                        </h3>
                        <div className="log-container">
                            <pre className="log-output"><code>{logs || 'No logs available for the current session.'}</code></pre>
                        </div>
                    </div>
                </Col>
            </Row>
        </div>
    );
};

export default ExplorerPage;
