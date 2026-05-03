import React from 'react';
import { Modal, Badge, ProgressBar, ListGroup, Card, Row, Col, Alert } from 'react-bootstrap';

const PolicyRiskDetail = ({ policy, show, onHide, validationData }) => {
    if (!policy) return null;

    const getRiskBadgeVariant = (level) => {
        switch (level) {
            case 'Critical': return 'danger';
            case 'High': return 'warning';
            case 'Medium': return 'info';
            case 'Low': return 'success';
            case 'Minimal': return 'secondary';
            default: return 'secondary';
        }
    };

    const getRiskProgressVariant = (score) => {
        if (score >= 70) return 'danger';
        if (score >= 50) return 'warning';
        if (score >= 30) return 'info';
        return 'success';
    };

    const getRiskDescription = (level, score) => {
        if (score >= 70) return 'Immediate action required. Critical compliance gaps detected.';
        if (score >= 50) return 'High priority review needed. Significant issues identified.';
        if (score >= 30) return 'Moderate concerns. Schedule review and remediation.';
        if (score >= 10) return 'Minor issues detected. Low priority for review.';
        return 'Excellent compliance. No significant issues found.';
    };

    const llmAnalysis = validationData?.llm_analysis;
    const hasLLMInsights = llmAnalysis && llmAnalysis.success;

    return (
        <Modal show={show} onHide={onHide} size="lg" centered>
            <Modal.Header closeButton className="policy-detail-header">
                <Modal.Title>
                    <div className="d-flex align-items-center gap-3">
                        <span className="detail-icon">📋</span>
                        <div>
                            <div className="policy-number-title">{policy.policy_number}</div>
                            <small className="text-white-50">Risk Assessment Details</small>
                        </div>
                    </div>
                </Modal.Title>
            </Modal.Header>
            <Modal.Body className="p-4">
                {/* Risk Score Overview */}
                <Card className="mb-4 border-0 shadow-sm">
                    <Card.Body>
                        <Row className="align-items-center mb-3">
                            <Col md={6}>
                                <h5 className="mb-2">Risk Score</h5>
                                <div className="d-flex align-items-center gap-3">
                                    <div className="risk-score-display">
                                        {policy.risk_score}
                                    </div>
                                    <div>
                                        <Badge bg={getRiskBadgeVariant(policy.risk_level)} className="mb-2" style={{ fontSize: '1rem' }}>
                                            {policy.risk_level} Risk
                                        </Badge>
                                        <div className="text-muted small">
                                            {getRiskDescription(policy.risk_level, policy.risk_score)}
                                        </div>
                                    </div>
                                </div>
                            </Col>
                            <Col md={6}>
                                <h6 className="mb-2">Risk Level</h6>
                                <ProgressBar 
                                    now={policy.risk_score} 
                                    variant={getRiskProgressVariant(policy.risk_score)}
                                    className="risk-progress-detail mb-2"
                                    label={`${policy.risk_score}/100`}
                                />
                                <div className="d-flex justify-content-between text-muted small">
                                    <span>Minimal</span>
                                    <span>Critical</span>
                                </div>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>

                {/* Missing Documents */}
                {policy.missing_documents && policy.missing_documents.length > 0 && (
                    <Card className="mb-4 border-danger">
                        <Card.Header className="bg-danger text-white">
                            <strong>⚠️ Missing Required Documents ({policy.missing_documents.length})</strong>
                        </Card.Header>
                        <ListGroup variant="flush">
                            {policy.missing_documents.map((doc, idx) => (
                                <ListGroup.Item key={idx} className="d-flex align-items-center">
                                    <Badge bg="danger" className="me-2">!</Badge>
                                    <span>{doc}</span>
                                </ListGroup.Item>
                            ))}
                        </ListGroup>
                    </Card>
                )}

                {/* Issues Found */}
                {policy.issues_count > 0 && validationData?.issues && (
                    <Card className="mb-4 border-warning">
                        <Card.Header className="bg-warning text-dark">
                            <strong>🔍 Issues Identified ({policy.issues_count})</strong>
                        </Card.Header>
                        <ListGroup variant="flush">
                            {validationData.issues.map((issue, idx) => (
                                <ListGroup.Item key={idx}>
                                    <div className="d-flex align-items-start">
                                        <Badge bg="warning" text="dark" className="me-2">#{idx + 1}</Badge>
                                        <div className="flex-grow-1">
                                            <div className="fw-bold text-dark">{issue}</div>
                                        </div>
                                    </div>
                                </ListGroup.Item>
                            ))}
                        </ListGroup>
                    </Card>
                )}

                {/* LLM AI Insights */}
                {hasLLMInsights && (
                    <Card className="mb-4 border-0" style={{ background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}>
                        <Card.Header className="bg-transparent border-0">
                            <strong>🤖 AI-Powered Insights</strong>
                            <Badge bg={llmAnalysis.mode === 'live' ? 'success' : 'info'} className="ms-2">
                                {llmAnalysis.mode === 'live' ? 'Live AI' : 'Simulated'}
                            </Badge>
                        </Card.Header>
                        <Card.Body>
                            {llmAnalysis.insights && (
                                <div className="mb-3">
                                    <h6 className="text-primary">Analysis:</h6>
                                    <p className="mb-0">{llmAnalysis.insights}</p>
                                </div>
                            )}
                            {llmAnalysis.risk_factors && llmAnalysis.risk_factors.length > 0 && (
                                <div className="mb-3">
                                    <h6 className="text-danger">Risk Factors:</h6>
                                    <ul className="mb-0">
                                        {llmAnalysis.risk_factors.map((factor, idx) => (
                                            <li key={idx}>{factor}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            {llmAnalysis.recommendations && llmAnalysis.recommendations.length > 0 && (
                                <div>
                                    <h6 className="text-success">Recommendations:</h6>
                                    <ul className="mb-0">
                                        {llmAnalysis.recommendations.map((rec, idx) => (
                                            <li key={idx}>{rec}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </Card.Body>
                    </Card>
                )}

                {/* Compliance Status */}
                {policy.is_compliant !== undefined && (
                    <Alert variant={policy.is_compliant ? 'success' : 'danger'} className="mb-0">
                        <div className="d-flex align-items-center">
                            <span className="fs-4 me-2">{policy.is_compliant ? '✓' : '✗'}</span>
                            <div>
                                <strong>
                                    {policy.is_compliant ? 'Compliant' : 'Non-Compliant'}
                                </strong>
                                <div className="small">
                                    {policy.is_compliant 
                                        ? 'This policy meets all required compliance standards.'
                                        : 'This policy requires attention to meet compliance standards.'}
                                </div>
                            </div>
                        </div>
                    </Alert>
                )}

                {/* No Issues */}
                {policy.issues_count === 0 && (!policy.missing_documents || policy.missing_documents.length === 0) && (
                    <Alert variant="success" className="mb-0">
                        <div className="d-flex align-items-center">
                            <span className="fs-4 me-2">✓</span>
                            <div>
                                <strong>Excellent Condition</strong>
                                <div className="small">
                                    No issues or missing documents detected. This policy is in excellent compliance.
                                </div>
                            </div>
                        </div>
                    </Alert>
                )}
            </Modal.Body>
        </Modal>
    );
};

export default PolicyRiskDetail;
