import React, { useState } from 'react';
import { Card, Table, Badge, ProgressBar, Button, ButtonGroup, Form } from 'react-bootstrap';
import PolicyRiskDetail from './PolicyRiskDetail';

const RiskScores = ({ riskScores, validationResults }) => {
    const [selectedPolicy, setSelectedPolicy] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedPolicies, setSelectedPolicies] = useState(new Set());

    const handlePolicyClick = (policy) => {
        setSelectedPolicy(policy);
        setShowDetailModal(true);
    };

    const handleCloseModal = () => {
        setShowDetailModal(false);
        setSelectedPolicy(null);
    };

    const handleCheckboxChange = (policyNumber, event) => {
        event.stopPropagation();
        const newSelected = new Set(selectedPolicies);
        if (newSelected.has(policyNumber)) {
            newSelected.delete(policyNumber);
        } else {
            newSelected.add(policyNumber);
        }
        setSelectedPolicies(newSelected);
    };

    const handleSelectAll = (event) => {
        if (event.target.checked) {
            setSelectedPolicies(new Set(riskScores.map(p => p.policy_number)));
        } else {
            setSelectedPolicies(new Set());
        }
    };

    const handleDMSReady = () => {
        if (selectedPolicies.size === 0) {
            alert('Please select at least one policy');
            return;
        }
        const policies = Array.from(selectedPolicies).join(', ');
        alert(`Marking ${selectedPolicies.size} policy(ies) as DMS Ready: ${policies}`);
        setSelectedPolicies(new Set());
    };

    const handleFixNow = () => {
        if (selectedPolicies.size === 0) {
            alert('Please select at least one policy');
            return;
        }
        const policies = Array.from(selectedPolicies).join(', ');
        alert(`Initiating Fix Now for ${selectedPolicies.size} policy(ies): ${policies}`);
        setSelectedPolicies(new Set());
    };

    const handleManualReview = () => {
        if (selectedPolicies.size === 0) {
            alert('Please select at least one policy');
            return;
        }
        const policies = Array.from(selectedPolicies).join(', ');
        alert(`Flagged ${selectedPolicies.size} policy(ies) for Manual Review: ${policies}`);
        setSelectedPolicies(new Set());
    };
    if (!riskScores || riskScores.length === 0) {
        return (
            <Card className="risk-scores-card shadow-sm">
                <Card.Header className="card-header-custom">
                    <span className="header-icon">🎯</span>
                    <strong>Risk Assessment</strong>
                </Card.Header>
                <Card.Body className="text-center py-5">
                    <div className="empty-state">
                        <p className="text-muted mb-0">No risk assessment data available.</p>
                        <small className="text-muted">Run the workflow to generate risk scores.</small>
                    </div>
                </Card.Body>
            </Card>
        );
    }

    // Calculate average risk score
    const avgRiskScore = riskScores.reduce((sum, p) => sum + p.risk_score, 0) / riskScores.length;

    // Sort by risk score (highest first)
    const sortedPolicies = [...riskScores].sort((a, b) => b.risk_score - a.risk_score);

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

    return (
        <Card className="risk-scores-card shadow-sm">
            <Card.Header className="card-header-custom">
                <span className="header-icon">🎯</span>
                <strong>Policy Risk Assessment</strong>
                <Badge bg="primary" className="ms-2">{riskScores.length} Policies</Badge>
            </Card.Header>
            <Card.Body>
                <div className="mb-3 p-3 bg-light rounded">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                        <span className="metric-label">Average Risk Score</span>
                        <Badge bg={getRiskProgressVariant(avgRiskScore)} style={{ fontSize: '1rem', padding: '8px 12px' }}>
                            {avgRiskScore.toFixed(1)} / 100
                        </Badge>
                    </div>
                    <ProgressBar 
                        now={avgRiskScore} 
                        variant={getRiskProgressVariant(avgRiskScore)}
                        className="custom-progress"
                        style={{ height: '12px' }}
                    />
                </div>

                <div className="mb-3 p-2 bg-white border rounded d-flex justify-content-between align-items-center">
                    <span className="text-muted">
                        {selectedPolicies.size > 0 ? (
                            <><strong>{selectedPolicies.size}</strong> {selectedPolicies.size === 1 ? 'policy' : 'policies'} selected</>
                        ) : (
                            <span>Select policies to perform actions</span>
                        )}
                    </span>
                    <div className="d-flex gap-2">
                        <Button variant="success" size="sm" onClick={handleDMSReady}>
                            <span className="me-1">✓</span> DMS Ready
                        </Button>
                        <Button variant="warning" size="sm" onClick={handleFixNow}>
                            <span className="me-1">🔧</span> Fix Now
                        </Button>
                        <Button variant="info" size="sm" onClick={handleManualReview}>
                            <span className="me-1">👁</span> Manual Review
                        </Button>
                    </div>
                </div>

                <div style={{ maxHeight: '450px', overflowY: 'auto', overflowX: 'hidden' }}>
                    <Table hover size="sm" className="risk-table" style={{ tableLayout: 'fixed', width: '100%' }}>
                        <thead className="table-header-sticky">
                            <tr>
                                <th style={{ width: '5%' }} className="text-center">
                                    <Form.Check 
                                        type="checkbox"
                                        checked={selectedPolicies.size === riskScores.length}
                                        onChange={handleSelectAll}
                                        title="Select all"
                                    />
                                </th>
                                <th style={{ width: '18%' }}>Policy</th>
                                <th style={{ width: '12%' }} className="text-center">Status</th>
                                <th style={{ width: '11%' }} className="text-center">Score</th>
                                <th style={{ width: '13%' }} className="text-center">Level</th>
                                <th style={{ width: '32%' }}>Risk Assessment</th>
                                <th style={{ width: '9%' }} className="text-center">Issues</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedPolicies.map((policy, index) => (
                                <tr 
                                    key={index} 
                                    className={`clickable-row ${policy.risk_score >= 70 ? 'table-danger-subtle' : policy.risk_score >= 50 ? 'table-warning-subtle' : ''}`}
                                    onClick={() => handlePolicyClick(policy)}
                                    style={{ cursor: 'pointer' }}
                                    title="Click to view detailed risk assessment"
                                >
                                    <td className="text-center" onClick={(e) => e.stopPropagation()}>
                                        <Form.Check 
                                            type="checkbox"
                                            checked={selectedPolicies.has(policy.policy_number)}
                                            onChange={(e) => handleCheckboxChange(policy.policy_number, e)}
                                        />
                                    </td>
                                    <td style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        <Badge bg="secondary" className="font-monospace" style={{ fontSize: '0.72rem' }}>
                                            {policy.policy_number}
                                        </Badge>
                                    </td>
                                    <td className="text-center">
                                        <Badge 
                                            bg="success" 
                                            style={{ fontSize: '0.7rem', padding: '4px 8px' }}
                                        >
                                            Active
                                        </Badge>
                                    </td>
                                    <td className="text-center">
                                        <strong className={`risk-score-value risk-${policy.risk_level.toLowerCase()}`} style={{ fontSize: '0.95rem' }}>
                                            {policy.risk_score}
                                        </strong>
                                    </td>
                                    <td className="text-center">
                                        <Badge bg={getRiskBadgeVariant(policy.risk_level)} style={{ fontSize: '0.65rem', padding: '4px 8px' }}>
                                            {policy.risk_level}
                                        </Badge>
                                    </td>
                                    <td style={{ padding: '8px 12px' }}>
                                        <ProgressBar 
                                            now={policy.risk_score} 
                                            variant={getRiskProgressVariant(policy.risk_score)}
                                            className="risk-progress-sm"
                                        />
                                    </td>
                                    <td className="text-center">
                                        {policy.issues_count > 0 ? (
                                            <Badge bg="danger" pill style={{ fontSize: '0.7rem' }}>{policy.issues_count}</Badge>
                                        ) : (
                                            <Badge bg="success" pill style={{ fontSize: '0.7rem' }}>✓</Badge>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </div>
            </Card.Body>
            
            <PolicyRiskDetail 
                policy={selectedPolicy}
                show={showDetailModal}
                onHide={handleCloseModal}
                validationData={validationResults?.[selectedPolicy?.policy_number]}
            />
        </Card>
    );
};

export default RiskScores;
