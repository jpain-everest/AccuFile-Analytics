import React from 'react';
import { Row, Col } from 'react-bootstrap';
import Summary from '../components/Summary';
import Issues from '../components/Issues';
import LLMInsights from '../components/LLMInsights';

const DashboardPage = ({ summary, issues, llmInsights }) => {
    return (
        <div className="dashboard-page page-container">
            <div className="dashboard-header mb-2">
                <p className="dashboard-subtitle">Metric Summary & Governance Overview</p>
            </div>
            
            <Row className="mb-2">
                <Col lg={6} className="mb-2">
                    <Summary summary={summary} />
                </Col>
                <Col lg={6} className="mb-2">
                    <LLMInsights llmInsights={llmInsights} />
                </Col>
                <Col lg={12} className="mb-2">
                    <Issues issues={issues} />
                </Col>
            </Row>
        </div>
    );
};

export default DashboardPage;
