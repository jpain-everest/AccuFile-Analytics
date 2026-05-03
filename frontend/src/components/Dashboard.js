import React from 'react';
import { Container, Row, Col, Badge } from 'react-bootstrap';
import Summary from './Summary';
import Issues from './Issues';
import RiskScores from './RiskScores';
import LLMInsights from './LLMInsights';

const Dashboard = ({ summary, issues, logs, policyRiskScores, llmInsights, validationResults }) => {
    return (
        <Container fluid className="dashboard-container">
            <Row className="mb-4">
                <Col md={12}>
                    <div className="dashboard-header">
                        <h1 className="dashboard-title">
                            <span className="title-icon">📊</span>
                            AccuFile Analytics & Governance
                        </h1>
                        <p className="dashboard-subtitle">Underwriting File Review & Compliance Management</p>
                    </div>
                </Col>
            </Row>
            <Row className="mb-4">
                <Col lg={6} className="mb-3">
                    <Summary summary={summary} />
                </Col>
                <Col lg={6} className="mb-3">
                    <Issues issues={issues} />
                </Col>
            </Row>
            <Row className="mb-4">
                <Col md={12}>
                    <RiskScores riskScores={policyRiskScores} validationResults={validationResults} />
                </Col>
            </Row>
            <Row className="mb-4">
                <Col md={12}>
                    <LLMInsights llmInsights={llmInsights} />
                </Col>
            </Row>
            <Row>
                <Col md={12}>
                    <div className="logs-section">
                        <h3 className="section-title">
                            <span className="title-icon">📋</span>
                            Processing Logs
                            {logs && <Badge bg="secondary" className="ms-2">Live</Badge>}
                        </h3>
                        <div className="log-container">
                            <pre className="log-output"><code>{logs || 'No logs available. Click "Run File Review" to start the workflow.'}</code></pre>
                        </div>
                    </div>
                </Col>
            </Row>
        </Container>
    );
};

export default Dashboard;
