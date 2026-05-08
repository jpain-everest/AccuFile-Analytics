import React from 'react';
import RiskScores from '../components/RiskScores';

const RiskAssessmentPage = ({ policyRiskScores, validationResults, onRefresh }) => {
    return (
        <div className="risk-assessment-page page-container" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            <div style={{ flex: 1, minHeight: 0 }}>
                <RiskScores riskScores={policyRiskScores} validationResults={validationResults} onRefresh={onRefresh} />
            </div>
        </div>
    );
};

export default RiskAssessmentPage;
