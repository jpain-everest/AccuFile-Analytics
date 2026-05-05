import React from 'react';
import { Row, Col } from 'react-bootstrap';
import RiskScores from '../components/RiskScores';

const RiskAssessmentPage = ({ policyRiskScores, validationResults }) => {
    return (
        <div className="risk-assessment-page page-container">
            <Row className="mb-2">
                <Col md={12}>
                    <RiskScores riskScores={policyRiskScores} validationResults={validationResults} />
                </Col>
            </Row>
        </div>
    );
};

export default RiskAssessmentPage;
