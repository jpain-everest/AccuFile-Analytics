import React from 'react';
import { Row, Col } from 'react-bootstrap';
import RiskScores from '../components/RiskScores';

const RiskAssessmentPage = ({ policyRiskScores, validationResults }) => {
    return (
        <div className="risk-assessment-page page-container">
            <div className="dashboard-header mb-2">
                <p className="dashboard-subtitle">Policy Risk Assessment & Compliance Intelligence</p>
            </div>
            
            <Row className="mb-2">
                <Col md={12}>
                    <RiskScores riskScores={policyRiskScores} validationResults={validationResults} />
                </Col>
            </Row>
        </div>
    );
};

export default RiskAssessmentPage;
