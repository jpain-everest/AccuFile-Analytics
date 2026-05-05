import React, { useState } from 'react';
import { Card, Table, Badge, ProgressBar, Button, ButtonGroup, Form, Modal, ListGroup, Accordion } from 'react-bootstrap';
import PolicyRiskDetail from './PolicyRiskDetail';

const RiskScores = ({ riskScores, validationResults }) => {
    const [selectedPolicy, setSelectedPolicy] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedPolicies, setSelectedPolicies] = useState(new Set());
    const [showSubmissionModal, setShowSubmissionModal] = useState(false);
    const [selectedSubmission, setSelectedSubmission] = useState(null);

    const handleSubmissionClick = (policy, index) => {
        setSelectedSubmission({
            ...policy,
            submissionId: `SUB-2026-${String(1234 + index).padStart(6, '0')}`,
            index: index
        });
        setShowSubmissionModal(true);
    };

    const handleCloseSubmissionModal = () => {
        setShowSubmissionModal(false);
        setSelectedSubmission(null);
    };

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
            <Card className="risk-scores-card">
                <Card.Header className="card-header-custom">
                    SUBMISSION LIST
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

    // Non-compliance types to display
    const nonComplianceTypes = [
        'Policy Document Missing',
        'Invoice Missing',
        'Quote Missing',
        'Service Provider Missing'
    ];

    const getNonComplianceType = (policy, index) => {
        // Determine non-compliance type based on policy data or cycle through types
        if (policy.issues_count === 0) {
            return 'None';
        }
        // Use risk level to determine type, or cycle based on index
        if (policy.risk_level === 'Critical') {
            return 'Policy Document Missing';
        } else if (policy.risk_level === 'High') {
            return 'Invoice Missing';
        } else if (policy.risk_level === 'Medium') {
            return 'Quote Missing';
        } else {
            return 'Service Provider Missing';
        }
    };

    return (
        <Card className="risk-scores-card">
            <Card.Header className="card-header-custom">
                SUBMISSION LIST
            </Card.Header>
            <Card.Body>
                <div style={{ maxHeight: '450px', overflowY: 'auto', overflowX: 'auto' }}>
                    <Table hover size="sm" className="risk-table" style={{ minWidth: '1800px' }}>
                        <thead className="table-header-sticky">
                            <tr>
                                <th style={{ width: '12%' }}>Submission ID</th>
                                <th style={{ width: '10%' }}>Policy</th>
                                <th style={{ width: '8%' }} className="text-center">Policy Status</th>
                                <th style={{ width: '10%' }}>UA Assigned</th>
                                <th style={{ width: '12%' }}>Business Segment</th>
                                <th style={{ width: '10%' }}>LOB</th>
                                <th style={{ width: '14%' }}>Policyholder Name</th>
                                <th style={{ width: '8%' }} className="text-center">Level</th>
                                <th style={{ width: '10%' }}>Non-Compliance Type</th>
                                <th style={{ width: '5%' }} className="text-center">Issues</th>
                                <th style={{ width: '8%' }}>Policy Eff Date</th>
                                <th style={{ width: '8%' }}>Policy Exp Date</th>
                                <th style={{ width: '6%' }}>PH State</th>
                                <th style={{ width: '10%' }}>Producer Name</th>
                                <th style={{ width: '10%' }}>Producer Parent</th>
                                <th style={{ width: '10%' }}>Service Provider</th>
                                <th style={{ width: '8%' }} className="text-center">File Prep Status</th>
                                <th style={{ width: '12%' }}>Comments</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedPolicies.map((policy, index) => (
                                <tr 
                                    key={index} 
                                    className={policy.risk_score >= 70 ? 'table-danger-subtle' : policy.risk_score >= 50 ? 'table-warning-subtle' : ''}
                                    onClick={() => handleSubmissionClick(policy, index)}
                                    style={{ cursor: 'pointer' }}
                                    title="Click to view submission details"
                                >
                                    <td style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        <Badge bg="dark" className="font-monospace" style={{ fontSize: '0.72rem' }}>
                                            {`SUB-2026-${String(1234 + index).padStart(6, '0')}`}
                                        </Badge>
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
                                    <td style={{ fontSize: '0.75rem', color: '#58595B' }}>
                                        {['John Smith', 'Mary Johnson', 'Robert Davis', 'Sarah Wilson', 'Michael Brown'][index % 5]}
                                    </td>
                                    <td style={{ fontSize: '0.75rem', color: '#58595B' }}>
                                        {['Commercial', 'Personal Lines', 'Specialty', 'Healthcare', 'Financial'][index % 5]}
                                    </td>
                                    <td style={{ fontSize: '0.75rem', color: '#58595B' }}>
                                        {['Auto', 'Property', 'GL', 'WC', 'Umbrella'][index % 5]}
                                    </td>
                                    <td style={{ fontSize: '0.75rem', color: '#58595B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {['Acme Corp', 'Tech Solutions Inc', 'Global Services LLC', 'Premier Holdings', 'Summit Industries'][index % 5]}
                                    </td>
                                    <td className="text-center">
                                        <Badge bg={getRiskBadgeVariant(policy.risk_level)} style={{ fontSize: '0.65rem', padding: '4px 8px' }}>
                                            {policy.risk_level}
                                        </Badge>
                                    </td>
                                    <td style={{ padding: '8px 12px' }}>
                                        <span style={{ fontSize: '0.8rem', color: '#58595B' }}>
                                            {getNonComplianceType(policy, index)}
                                        </span>
                                    </td>
                                    <td className="text-center">
                                        {policy.issues_count > 0 ? (
                                            <Badge bg="danger" pill style={{ fontSize: '0.7rem' }}>{policy.issues_count}</Badge>
                                        ) : (
                                            <Badge bg="success" pill style={{ fontSize: '0.7rem' }}>✓</Badge>
                                        )}
                                    </td>
                                    <td style={{ fontSize: '0.75rem', color: '#58595B' }}>
                                        {['2026-01-15', '2026-02-01', '2026-03-10', '2026-04-05', '2026-05-20'][index % 5]}
                                    </td>
                                    <td style={{ fontSize: '0.75rem', color: '#58595B' }}>
                                        {['2027-01-15', '2027-02-01', '2027-03-10', '2027-04-05', '2027-05-20'][index % 5]}
                                    </td>
                                    <td style={{ fontSize: '0.75rem', color: '#58595B' }}>
                                        {['NY', 'CA', 'TX', 'FL', 'IL'][index % 5]}
                                    </td>
                                    <td style={{ fontSize: '0.75rem', color: '#58595B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {['ABC Insurance Agency', 'XYZ Brokers', 'Prime Partners', 'Elite Insurance', 'National Brokers'][index % 5]}
                                    </td>
                                    <td style={{ fontSize: '0.75rem', color: '#58595B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {['Marsh McLennan', 'Aon plc', 'Willis Towers', 'Brown & Brown', 'Gallagher'][index % 5]}
                                    </td>
                                    <td style={{ fontSize: '0.75rem', color: '#58595B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {['Peak Performance', 'DocuSign', 'FileNet', 'OnBase', 'Guidewire'][index % 5]}
                                    </td>
                                    <td className="text-center">
                                        <Badge 
                                            bg={['success', 'warning', 'info', 'secondary', 'primary'][index % 5]} 
                                            style={{ fontSize: '0.65rem', padding: '4px 6px' }}
                                        >
                                            {['Complete', 'In Progress', 'Pending', 'Not Started', 'Review'][index % 5]}
                                        </Badge>
                                    </td>
                                    <td style={{ fontSize: '0.75rem', color: '#58595B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {['Ready for DMS', 'Missing invoice', 'Awaiting quote', 'Under review', ''][index % 5]}
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

            {/* Submission Detail Modal */}
            <Modal 
                show={showSubmissionModal} 
                onHide={handleCloseSubmissionModal} 
                size="xl"
                centered
            >
                <Modal.Header closeButton style={{ backgroundColor: '#235CF4', color: 'white' }}>
                    <Modal.Title>
                        <span style={{ fontSize: '1rem' }}>
                            📋 Submission Details - {selectedSubmission?.submissionId}
                        </span>
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                    {selectedSubmission && (
                        <>
                            {/* Submission Summary */}
                            <div className="mb-4 p-3 bg-light rounded">
                                <div className="row">
                                    <div className="col-md-3">
                                        <small className="text-muted">Policy Number</small>
                                        <div><strong>{selectedSubmission.policy_number}</strong></div>
                                    </div>
                                    <div className="col-md-3">
                                        <small className="text-muted">Policyholder</small>
                                        <div><strong>{['Acme Corp', 'Tech Solutions Inc', 'Global Services LLC', 'Premier Holdings', 'Summit Industries'][selectedSubmission.index % 5]}</strong></div>
                                    </div>
                                    <div className="col-md-3">
                                        <small className="text-muted">LOB</small>
                                        <div><strong>{['Auto', 'Property', 'GL', 'WC', 'Umbrella'][selectedSubmission.index % 5]}</strong></div>
                                    </div>
                                    <div className="col-md-3">
                                        <small className="text-muted">Status</small>
                                        <div>
                                            <Badge bg={selectedSubmission.risk_level === 'Critical' ? 'danger' : selectedSubmission.risk_level === 'High' ? 'warning' : 'success'}>
                                                {selectedSubmission.risk_level}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <Accordion defaultActiveKey="0" className="mb-3">
                                {/* Folder/File Structure */}
                                <Accordion.Item eventKey="0">
                                    <Accordion.Header>
                                        <span style={{ fontWeight: 600 }}>📁 Folder/File Structure</span>
                                    </Accordion.Header>
                                    <Accordion.Body>
                                        <div className="file-structure" style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                                            <div className="folder" style={{ marginBottom: '8px' }}>
                                                <span style={{ color: '#235CF4' }}>📁</span> <strong>{selectedSubmission.policy_number}/</strong>
                                                <div style={{ marginLeft: '24px' }}>
                                                    <div style={{ marginBottom: '4px' }}>
                                                        <span style={{ color: '#235CF4' }}>📁</span> <strong>Policy Documents/</strong>
                                                        <div style={{ marginLeft: '24px', color: '#58595B' }}>
                                                            <div>📄 Policy_Declaration.pdf {selectedSubmission.index % 2 === 0 ? <Badge bg="success" style={{ fontSize: '0.65rem' }}>✓</Badge> : <Badge bg="danger" style={{ fontSize: '0.65rem' }}>Missing</Badge>}</div>
                                                            <div>📄 Endorsements.pdf <Badge bg="success" style={{ fontSize: '0.65rem' }}>✓</Badge></div>
                                                            <div>📄 Schedule_of_Forms.pdf <Badge bg="success" style={{ fontSize: '0.65rem' }}>✓</Badge></div>
                                                        </div>
                                                    </div>
                                                    <div style={{ marginBottom: '4px' }}>
                                                        <span style={{ color: '#235CF4' }}>📁</span> <strong>Quotes/</strong>
                                                        <div style={{ marginLeft: '24px', color: '#58595B' }}>
                                                            <div>📄 Quote_v1.pdf {selectedSubmission.index % 3 === 0 ? <Badge bg="danger" style={{ fontSize: '0.65rem' }}>Missing</Badge> : <Badge bg="success" style={{ fontSize: '0.65rem' }}>✓</Badge>}</div>
                                                            <div>📄 Quote_Comparison.xlsx <Badge bg="success" style={{ fontSize: '0.65rem' }}>✓</Badge></div>
                                                        </div>
                                                    </div>
                                                    <div style={{ marginBottom: '4px' }}>
                                                        <span style={{ color: '#235CF4' }}>📁</span> <strong>Invoices/</strong>
                                                        <div style={{ marginLeft: '24px', color: '#58595B' }}>
                                                            <div>📄 Invoice_001.pdf {selectedSubmission.index % 4 === 0 ? <Badge bg="danger" style={{ fontSize: '0.65rem' }}>Missing</Badge> : <Badge bg="success" style={{ fontSize: '0.65rem' }}>✓</Badge>}</div>
                                                            <div>📄 Payment_Receipt.pdf <Badge bg="success" style={{ fontSize: '0.65rem' }}>✓</Badge></div>
                                                        </div>
                                                    </div>
                                                    <div style={{ marginBottom: '4px' }}>
                                                        <span style={{ color: '#235CF4' }}>📁</span> <strong>Applications/</strong>
                                                        <div style={{ marginLeft: '24px', color: '#58595B' }}>
                                                            <div>📄 Application_Signed.pdf <Badge bg="success" style={{ fontSize: '0.65rem' }}>✓</Badge></div>
                                                            <div>📄 Supplemental_App.pdf <Badge bg="success" style={{ fontSize: '0.65rem' }}>✓</Badge></div>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <span style={{ color: '#235CF4' }}>📁</span> <strong>Correspondence/</strong>
                                                        <div style={{ marginLeft: '24px', color: '#58595B' }}>
                                                            <div>📄 Email_Thread.msg <Badge bg="success" style={{ fontSize: '0.65rem' }}>✓</Badge></div>
                                                            <div>📄 Binder_Letter.pdf <Badge bg="success" style={{ fontSize: '0.65rem' }}>✓</Badge></div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </Accordion.Body>
                                </Accordion.Item>

                                {/* Detail Issue List */}
                                <Accordion.Item eventKey="1">
                                    <Accordion.Header>
                                        <span style={{ fontWeight: 600 }}>⚠️ Detail Issue List ({selectedSubmission.issues_count || 0} issues)</span>
                                    </Accordion.Header>
                                    <Accordion.Body>
                                        {selectedSubmission.issues_count > 0 ? (
                                            <ListGroup variant="flush">
                                                {selectedSubmission.index % 2 === 0 && (
                                                    <ListGroup.Item className="d-flex justify-content-between align-items-start">
                                                        <div>
                                                            <div className="fw-bold text-danger">Policy Document Missing</div>
                                                            <small className="text-muted">Policy_Declaration.pdf is required but not found in the folder structure</small>
                                                        </div>
                                                        <Badge bg="danger">Critical</Badge>
                                                    </ListGroup.Item>
                                                )}
                                                {selectedSubmission.index % 3 === 0 && (
                                                    <ListGroup.Item className="d-flex justify-content-between align-items-start">
                                                        <div>
                                                            <div className="fw-bold text-warning">Quote Missing</div>
                                                            <small className="text-muted">Quote_v1.pdf is required for underwriting review</small>
                                                        </div>
                                                        <Badge bg="warning" text="dark">High</Badge>
                                                    </ListGroup.Item>
                                                )}
                                                {selectedSubmission.index % 4 === 0 && (
                                                    <ListGroup.Item className="d-flex justify-content-between align-items-start">
                                                        <div>
                                                            <div className="fw-bold text-warning">Invoice Missing</div>
                                                            <small className="text-muted">Invoice_001.pdf is required for billing reconciliation</small>
                                                        </div>
                                                        <Badge bg="warning" text="dark">High</Badge>
                                                    </ListGroup.Item>
                                                )}
                                                <ListGroup.Item className="d-flex justify-content-between align-items-start">
                                                    <div>
                                                        <div className="fw-bold text-info">Service Provider Validation</div>
                                                        <small className="text-muted">Service provider information needs verification</small>
                                                    </div>
                                                    <Badge bg="info">Medium</Badge>
                                                </ListGroup.Item>
                                            </ListGroup>
                                        ) : (
                                            <div className="text-center py-4">
                                                <div style={{ fontSize: '2rem' }}>✅</div>
                                                <p className="text-success mb-0"><strong>No issues found</strong></p>
                                                <small className="text-muted">All required documents are present and validated</small>
                                            </div>
                                        )}
                                    </Accordion.Body>
                                </Accordion.Item>
                            </Accordion>
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="outline-primary" onClick={handleCloseSubmissionModal}>
                        FIX NOW
                    </Button>
                    <Button variant="warning" onClick={handleCloseSubmissionModal}>
                        SEND for REVIEW
                    </Button>
                    <Button variant="primary" onClick={handleCloseSubmissionModal}>
                        Mark as COMPLETED
                    </Button>
                </Modal.Footer>
            </Modal>
        </Card>
    );
};

export default RiskScores;
