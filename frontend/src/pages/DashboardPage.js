import React from 'react';
import { Row, Col } from 'react-bootstrap';
import Summary from '../components/Summary';
import Issues from '../components/Issues';

const DashboardPage = ({ summary, issues }) => {
    return (
        <div className="dashboard-page page-container">
            <div className="dashboard-header mb-4">
                <p className="dashboard-subtitle">Metric Summary & Governance Overview</p>
            </div>
            
            <Row className="mb-4">
                <Col lg={6} className="mb-4">
                    <Summary summary={summary} />
                </Col>
                <Col lg={6} className="mb-4">
                    <Issues issues={issues} />
                </Col>
            </Row>
        </div>
    );
};

export default DashboardPage;
