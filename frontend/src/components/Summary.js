import React from 'react';
import { Card, Table, Badge, ProgressBar } from 'react-bootstrap';

const Summary = ({ summary }) => {
    if (!summary || Object.keys(summary).length === 0) {
        return (
            <Card className="summary-card shadow-sm">
                <Card.Header className="card-header-custom">
                    <span className="header-icon">📈</span>
                    <strong>Summary Report</strong>
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
        <Card className="summary-card shadow-sm">
            <Card.Header className="card-header-custom">
                <span className="header-icon">📈</span>
                <strong>Summary Report</strong>
                <Badge bg="success" className="ms-2">Updated</Badge>
            </Card.Header>
            <Card.Body>
                <div className="metric-grid mb-3">
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
                </div>
                
                <div className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                        <span className="metric-label">Match Rate</span>
                        <Badge bg={matchRate >= 90 ? 'success' : matchRate >= 70 ? 'warning' : 'danger'}>
                            {matchRate.toFixed(1)}%
                        </Badge>
                    </div>
                    <ProgressBar 
                        now={matchRate} 
                        variant={matchRate >= 90 ? 'success' : matchRate >= 70 ? 'warning' : 'danger'}
                        className="custom-progress"
                    />
                </div>
                
                <div className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                        <span className="metric-label">Compliance Rate</span>
                        <Badge bg={failureRate <= 10 ? 'success' : failureRate <= 30 ? 'warning' : 'danger'}>
                            {(100 - failureRate).toFixed(1)}%
                        </Badge>
                    </div>
                    <ProgressBar 
                        now={100 - failureRate} 
                        variant={failureRate <= 10 ? 'success' : failureRate <= 30 ? 'warning' : 'danger'}
                        className="custom-progress"
                    />
                </div>
                
                <div className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                        <span className="metric-label">Average Risk Score</span>
                        <Badge bg={avgRiskScore >= 70 ? 'danger' : avgRiskScore >= 50 ? 'warning' : avgRiskScore >= 30 ? 'info' : 'success'}>
                            {avgRiskScore.toFixed(1)} / 100
                        </Badge>
                    </div>
                    <ProgressBar 
                        now={avgRiskScore} 
                        variant={avgRiskScore >= 70 ? 'danger' : avgRiskScore >= 50 ? 'warning' : avgRiskScore >= 30 ? 'info' : 'success'}
                        className="custom-progress"
                    />
                </div>

                <Table size="sm" className="metrics-table mt-3">
                    <tbody>
                        <tr>
                            <td>Files Validated</td>
                            <td className="text-end"><strong>{summary.files_validated || 0}</strong></td>
                        </tr>
                        <tr>
                            <td>Validation Failures</td>
                            <td className="text-end"><strong className="text-danger">{summary.validation_failures || 0}</strong></td>
                        </tr>
                    </tbody>
                </Table>
            </Card.Body>
        </Card>
    );
};

export default Summary;
