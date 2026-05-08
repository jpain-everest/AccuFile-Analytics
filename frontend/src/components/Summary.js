import React from 'react';
import { Card } from 'react-bootstrap';

const Summary = ({ summary }) => {
    if (!summary || Object.keys(summary).length === 0) {
        return (
            <Card className="summary-card dashboard-panel-fixed-height">
                <Card.Header className="card-header-centered">
                    Summary
                </Card.Header>
                <Card.Body className="text-center py-5">
                    <div className="empty-state">
                        <p className="text-muted mb-0">No summary data available.</p>
                        <small className="text-muted">Run the workflow to generate a report.</small>
                    </div>
                </Card.Body>
            </Card>
        );
    }

    const totalPolicies = summary.total_policies || 0;
    const matchedFiles = summary.matched_files || 0;
    const missingFiles = summary.missing_files || 0;
    const matchRate = summary.match_rate_percent || 0;
    const failureRate = summary.failure_rate_percent || 0;
    const avgRiskScore = summary.average_risk_score || 0;

    return (
        <Card className="summary-card dashboard-panel-fixed-height">
            <Card.Header className="card-header-centered">
                Summary
            </Card.Header>
            <Card.Body>
                <div className="metric-grid">
                    <div className="metric-item">
                        <div className="metric-value text-primary">{totalPolicies}</div>
                        <div className="metric-label">Total Policies</div>
                    </div>
                    <div className="metric-item">
                        <div className="metric-value text-success">{matchedFiles}</div>
                        <div className="metric-label">Matched Files</div>
                    </div>
                    <div className="metric-item">
                        <div className="metric-value text-danger">{missingFiles}</div>
                        <div className="metric-label">Missing Files</div>
                    </div>
                    <div className="metric-item">
                        <div className="metric-value text-info">{summary.files_validated || 0}</div>
                        <div className="metric-label">Files Validated</div>
                    </div>
                    <div className="metric-item">
                        <div className="metric-value text-danger">{summary.validation_failures || 0}</div>
                        <div className="metric-label">Validation Failures</div>
                    </div>
                    <div className="metric-item">
                        <div className="metric-value" style={{ color: matchRate >= 90 ? '#2E7D32' : matchRate >= 70 ? '#E65100' : '#D31245' }}>
                            {matchRate.toFixed(1)}%
                        </div>
                        <div className="metric-label">Match Rate</div>
                    </div>
                    <div className="metric-item">
                        <div className="metric-value" style={{ color: failureRate <= 10 ? '#2E7D32' : failureRate <= 30 ? '#E65100' : '#D31245' }}>
                            {(100 - failureRate).toFixed(1)}%
                        </div>
                        <div className="metric-label">Compliance Rate</div>
                    </div>
                    <div className="metric-item">
                        <div className="metric-value" style={{ color: avgRiskScore >= 70 ? '#D31245' : avgRiskScore >= 50 ? '#E65100' : avgRiskScore >= 30 ? '#007CBA' : '#2E7D32' }}>
                            {avgRiskScore.toFixed(0)}
                        </div>
                        <div className="metric-label">Avg Risk Score</div>
                    </div>
                </div>
            </Card.Body>
        </Card>
    );
};

export default Summary;
