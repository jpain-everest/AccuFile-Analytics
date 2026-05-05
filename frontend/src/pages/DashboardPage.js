import React from 'react';
import { Row, Col, Card } from 'react-bootstrap';

const MetricTile = ({ value, label, colorStyle }) => (
    <Card className="metric-tile h-100" style={{ minHeight: '180px' }}>
        <Card.Body className="d-flex flex-column align-items-center justify-content-center py-4">
            <div className="metric-tile-value" style={{ ...colorStyle, fontSize: '3rem' }}>{value}</div>
            <div className="metric-tile-label" style={{ fontSize: '1rem', marginTop: '12px' }}>{label}</div>
        </Card.Body>
    </Card>
);

const DashboardPage = ({ summary, issues }) => {
    const totalPolicies = summary?.total_policies || 0;
    const matchedFiles = summary?.matched_files || 0;
    const missingFiles = summary?.missing_files || 0;
    const filesValidated = summary?.files_validated || 0;
    const validationFailures = summary?.validation_failures || 0;
    const matchRate = summary?.match_rate_percent || 0;

    const getMatchRateColor = (rate) => {
        if (rate >= 90) return '#2E7D32';
        if (rate >= 70) return '#E65100';
        return '#D31245';
    };

    return (
        <div className="dashboard-page page-container">
            <div className="dashboard-header mb-4">
                <p className="dashboard-subtitle">Underwriting File Review Summary</p>
            </div>
            
            {/* Horizontal Metric Tiles */}
            <Row className="mb-4 g-4 justify-content-center">
                <Col xs={12} sm={6} lg={4} xl>
                    <MetricTile 
                        value={totalPolicies} 
                        label="Total Policies" 
                        colorStyle={{ color: '#235CF4' }}
                    />
                </Col>
                <Col xs={12} sm={6} lg={4} xl>
                    <MetricTile 
                        value={16} 
                        label="Total Submissions" 
                        colorStyle={{ color: '#2E7D32' }}
                    />
                </Col>
                <Col xs={12} sm={6} lg={4} xl>
                    <MetricTile 
                        value={10} 
                        label="Submission File(s) Found" 
                        colorStyle={{ color: '#D31245' }}
                    />
                </Col>
                <Col xs={12} sm={6} lg={4} xl>
                    <MetricTile 
                        value={6} 
                        label="Submission File(s) Not Found" 
                        colorStyle={{ color: '#007CBA' }}
                    />
                </Col>
                <Col xs={12} sm={6} lg={4} xl>
                    <MetricTile 
                        value="62.5%" 
                        label="Match Rate" 
                        colorStyle={{ color: getMatchRateColor(62.5) }}
                    />
                </Col>
            </Row>
        </div>
    );
};

export default DashboardPage;
