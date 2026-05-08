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
                            ACCUFILE ANALYTICS
                        </h1>
                        <p className="dashboard-subtitle">Underwriting Intelligence & Governance Framework</p>
                    </div>
                </Col>
            </Row>
            <Row className="mb-4">
                <Col lg={6} className="mb-4">
                    <Summary summary={summary} />
                </Col>
                <Col lg={6} className="mb-4">
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
                        <h3 className="card-header-custom mb-3">
                            SYSTEM PROCESSING LOGS
                        </h3>
                        <div className="log-container">
                            <pre className="log-output"><code>{logs || 'Ready for review. Click "RUN FILE REVIEW" to begin processing.'}</code></pre>
                        </div>
                    </div>
                </Col>
            </Row>
        </Container>
    );
};

export default Dashboard;
