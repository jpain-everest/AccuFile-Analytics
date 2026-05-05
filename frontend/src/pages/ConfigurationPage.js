import React, { useState } from 'react';
import { Row, Col, Card, Form, Button, Badge, Table, Modal } from 'react-bootstrap';

const ConfigurationPage = () => {
    const [showEditModal, setShowEditModal] = useState(false);
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [showGroupModal, setShowGroupModal] = useState(false);
    const [showVariableModal, setShowVariableModal] = useState(false);
    const [showNewTemplateModal, setShowNewTemplateModal] = useState(false);
    const [showNewTemplatePreview, setShowNewTemplatePreview] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState(null);
    const [editingGroup, setEditingGroup] = useState(null);
    const [editingVariable, setEditingVariable] = useState(null);
    const [newTemplate, setNewTemplate] = useState(null);

    // Template Variables
    const [templateVariables, setTemplateVariables] = useState([
        { id: 1, name: 'policy_number', description: 'Policy number', sampleValue: 'POL-2026-00145' },
        { id: 2, name: 'insured_name', description: 'Insured party name', sampleValue: 'ABC Corporation' },
        { id: 3, name: 'review_date', description: 'Date of review', sampleValue: 'May 5, 2026' },
        { id: 4, name: 'findings_count', description: 'Number of findings', sampleValue: '5' },
        { id: 5, name: 'due_date', description: 'Correction due date', sampleValue: 'May 12, 2026' },
        { id: 6, name: 'reviewer_name', description: 'Reviewer name', sampleValue: 'John Smith' }
    ]);

    // Distribution Groups with email addresses
    const [distributionGroups, setDistributionGroups] = useState([
        { id: 1, name: 'Policy Owner', email: 'policy.owner@everest.com' },
        { id: 2, name: 'Underwriting Team', email: 'underwriting.team@everest.com' },
        { id: 3, name: 'Underwriting Manager', email: 'uw.manager@everest.com' },
        { id: 4, name: 'Compliance Officers', email: 'compliance@everest.com' },
        { id: 5, name: 'Business Operations', email: 'business.ops@everest.com' },
        { id: 6, name: 'Risk Management', email: 'risk.mgmt@everest.com' }
    ]);

    // Default email body template
    const defaultEmailBody = `Dear {{insured_name}},

This notification is regarding the underwriting file review for Policy {{policy_number}}.

REVIEW DETAILS:
• Review Date: {{review_date}}
• Reviewer: {{reviewer_name}}
• Total Findings: {{findings_count}}

Please review and address the identified findings by {{due_date}}.

If you have any questions, please contact the Compliance team.

Best regards,
AccuFile Analytics
Everest Insurance`;

    // Simplified Email Templates - max 10 templates for different compliance types
    const [templates, setTemplates] = useState([
        {
            id: 1,
            name: 'Critical Compliance Alert',
            complianceType: 'Critical',
            issueType: 'Policy Document Missing',
            recipients: 'Compliance Officers, Underwriting Manager',
            subject: '[CRITICAL] File Review Findings - {{policy_number}}',
            body: `Dear {{insured_name}},

URGENT: Critical compliance issues have been identified during the underwriting file review for Policy {{policy_number}}.

REVIEW DETAILS:
• Review Date: {{review_date}}
• Reviewer: {{reviewer_name}}
• Total Findings: {{findings_count}}

IMMEDIATE ACTION REQUIRED: Please address these critical findings by {{due_date}} to avoid policy processing delays.

Contact the Compliance team immediately if you have questions.

Best regards,
AccuFile Analytics
Everest Insurance`,
            active: true
        },
        {
            id: 2,
            name: 'High Priority Review',
            complianceType: 'High',
            issueType: 'Invoice Missing',
            recipients: 'Underwriting Team',
            subject: '[HIGH] Action Required - {{policy_number}}',
            body: defaultEmailBody,
            active: true
        },
        {
            id: 3,
            name: 'Standard Review Notice',
            complianceType: 'Medium',
            issueType: 'Quote Missing',
            recipients: 'Business Operations',
            subject: 'File Review Summary - {{policy_number}}',
            body: defaultEmailBody,
            active: true
        },
        {
            id: 4,
            name: 'Low Risk Summary',
            complianceType: 'Low',
            issueType: 'Service Provider Missing',
            recipients: 'Policy Owner',
            subject: 'Review Complete - {{policy_number}}',
            body: defaultEmailBody,
            active: true
        },
        {
            id: 5,
            name: 'Correction Reminder',
            complianceType: 'Reminder',
            issueType: 'Policy Document Missing',
            recipients: 'Policy Owner, Underwriting Team',
            subject: '[REMINDER] Pending Corrections - {{policy_number}}',
            body: `Dear {{insured_name}},

This is a reminder regarding pending corrections for Policy {{policy_number}}.

Original review was conducted on {{review_date}} and identified {{findings_count}} findings that require your attention.

DEADLINE: Please submit corrections by {{due_date}}.

If you have already submitted corrections, please disregard this message.

Best regards,
AccuFile Analytics
Everest Insurance`,
            active: true
        }
    ]);

    // Available recipient groups (derived from distributionGroups)
    const recipientOptions = distributionGroups.map(g => g.name);

    const complianceTypes = ['Critical', 'High', 'Medium', 'Low', 'Reminder'];

    const complianceIssueTypes = [
        'Policy Document Missing',
        'Invoice Missing',
        'Quote Missing',
        'Service Provider Missing'
    ];

    const getComplianceBadge = (type) => {
        const colors = {
            Critical: '#dc3545',
            High: '#fd7e14',
            Medium: '#0dcaf0',
            Low: '#198754',
            Reminder: '#6c757d'
        };
        return <Badge style={{ backgroundColor: colors[type] || '#6c757d' }}>{type}</Badge>;
    };

    const handleEdit = (template) => {
        setEditingTemplate({...template});
        setShowEditModal(true);
    };

    const handleSave = () => {
        setTemplates(templates.map(t => 
            t.id === editingTemplate.id ? editingTemplate : t
        ));
        setShowEditModal(false);
    };

    const toggleActive = (id) => {
        setTemplates(templates.map(t => 
            t.id === id ? { ...t, active: !t.active } : t
        ));
    };

    const handleEditGroup = (group) => {
        setEditingGroup({...group});
        setShowGroupModal(true);
    };

    const handleSaveGroup = () => {
        setDistributionGroups(distributionGroups.map(g => 
            g.id === editingGroup.id ? editingGroup : g
        ));
        setShowGroupModal(false);
    };

    const handleAddGroup = () => {
        const newId = Math.max(...distributionGroups.map(g => g.id)) + 1;
        setEditingGroup({ id: newId, name: '', email: '' });
        setShowGroupModal(true);
    };

    const handleSaveNewGroup = () => {
        if (editingGroup.name && editingGroup.email) {
            if (distributionGroups.find(g => g.id === editingGroup.id)) {
                setDistributionGroups(distributionGroups.map(g => 
                    g.id === editingGroup.id ? editingGroup : g
                ));
            } else {
                setDistributionGroups([...distributionGroups, editingGroup]);
            }
            setShowGroupModal(false);
        }
    };

    const handleEditVariable = (variable) => {
        setEditingVariable({...variable});
        setShowVariableModal(true);
    };

    const handleAddVariable = () => {
        const newId = Math.max(...templateVariables.map(v => v.id)) + 1;
        setEditingVariable({ id: newId, name: '', description: '', sampleValue: '' });
        setShowVariableModal(true);
    };

    const handleSaveVariable = () => {
        if (editingVariable.name) {
            if (templateVariables.find(v => v.id === editingVariable.id)) {
                setTemplateVariables(templateVariables.map(v => 
                    v.id === editingVariable.id ? editingVariable : v
                ));
            } else {
                setTemplateVariables([...templateVariables, editingVariable]);
            }
            setShowVariableModal(false);
        }
    };

    const handleDeleteVariable = (id) => {
        setTemplateVariables(templateVariables.filter(v => v.id !== id));
    };

    const handleAddTemplate = () => {
        const newId = Math.max(...templates.map(t => t.id)) + 1;
        setNewTemplate({
            id: newId,
            name: '',
            complianceType: 'Medium',
            issueType: '',
            recipients: '',
            subject: '',
            body: `Dear {{insured_name}},

This notification is regarding the underwriting file review for Policy {{policy_number}}.

REVIEW DETAILS:
• Review Date: {{review_date}}
• Reviewer: {{reviewer_name}}
• Total Findings: {{findings_count}}

Please review and address the identified findings by {{due_date}}.

Best regards,
AccuFile Analytics
Everest Insurance`,
            active: true
        });
        setShowNewTemplateModal(true);
    };

    const handleSaveNewTemplate = () => {
        if (newTemplate.name && newTemplate.subject) {
            setTemplates([...templates, newTemplate]);
            setShowNewTemplateModal(false);
            setNewTemplate(null);
        }
    };

    const handleDeleteTemplate = (id) => {
        if (templates.length > 1) {
            setTemplates(templates.filter(t => t.id !== id));
        }
    };

    return (
        <div className="configuration-page page-container">
            <div className="dashboard-header mb-3">
                <p className="dashboard-subtitle">Email Notification Templates</p>
            </div>

            {/* Email Templates Card */}
            <Card className="config-card">
                <Card.Header className="d-flex justify-content-between align-items-center" style={{ background: '#235CF4', color: 'white' }}>
                    <span>📧 EMAIL TEMPLATES FOR COMPLIANCE NOTIFICATIONS</span>
                    <div className="d-flex align-items-center gap-3">
                        <small style={{ opacity: 0.8 }}>{templates.filter(t => t.active).length} of {templates.length} Active</small>
                        <Button size="sm" variant="light" onClick={handleAddTemplate} disabled={templates.length >= 10}>+ New Template</Button>
                    </div>
                </Card.Header>
                <Card.Body className="p-0">
                    <Table hover className="mb-0" style={{ fontSize: '0.9rem' }}>
                        <thead style={{ background: '#f8f9fa' }}>
                            <tr>
                                <th style={{ width: '16%', padding: '12px 16px' }}>Template Name</th>
                                <th style={{ width: '10%', padding: '12px 16px' }}>Priority</th>
                                <th style={{ width: '14%', padding: '12px 16px' }}>Non-Compliance Type</th>
                                <th style={{ width: '18%', padding: '12px 16px' }}>Recipients</th>
                                <th style={{ width: '22%', padding: '12px 16px' }}>Subject Line</th>
                                <th style={{ width: '8%', padding: '12px 16px', textAlign: 'center' }}>Active</th>
                                <th style={{ width: '12%', padding: '12px 16px', textAlign: 'center' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {templates.map(template => (
                                <tr key={template.id} style={{ opacity: template.active ? 1 : 0.5 }}>
                                    <td style={{ padding: '12px 16px', fontWeight: '500' }}>{template.name}</td>
                                    <td style={{ padding: '12px 16px' }}>{getComplianceBadge(template.complianceType)}</td>
                                    <td style={{ padding: '12px 16px' }}>
                                        <small>{template.issueType}</small>
                                    </td>
                                    <td style={{ padding: '12px 16px' }}>
                                        <small className="text-muted">{template.recipients}</small>
                                    </td>
                                    <td style={{ padding: '12px 16px' }}>
                                        <code style={{ fontSize: '0.8rem', background: '#f8f9fa', padding: '2px 6px', borderRadius: '4px' }}>
                                            {template.subject}
                                        </code>
                                    </td>
                                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                        <Form.Check
                                            type="switch"
                                            checked={template.active}
                                            onChange={() => toggleActive(template.id)}
                                        />
                                    </td>
                                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                        <Button 
                                            size="sm" 
                                            variant="outline-primary"
                                            onClick={() => handleEdit(template)}
                                            style={{ padding: '4px 10px' }}
                                            className="me-1"
                                        >
                                            ✏️
                                        </Button>
                                        <Button 
                                            size="sm" 
                                            variant="outline-danger"
                                            onClick={() => handleDeleteTemplate(template.id)}
                                            style={{ padding: '4px 10px' }}
                                            disabled={templates.length <= 1}
                                        >
                                            🗑️
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </Card.Body>
            </Card>

            {/* Quick Reference */}
            <Row className="mt-3">
                <Col md={6}>
                    <Card className="config-card">
                        <Card.Header className="d-flex justify-content-between align-items-center" style={{ background: '#f8f9fa', fontWeight: '600', fontSize: '0.9rem' }}>
                            <span>📋 Available Variables</span>
                            <Button size="sm" variant="outline-primary" onClick={handleAddVariable} style={{ padding: '2px 8px', fontSize: '0.75rem' }}>+ Add</Button>
                        </Card.Header>
                        <Card.Body style={{ padding: '0' }}>
                            <Table size="sm" className="mb-0" style={{ fontSize: '0.85rem' }}>
                                <thead style={{ background: '#f8f9fa' }}>
                                    <tr>
                                        <th style={{ padding: '8px 12px' }}>Variable</th>
                                        <th style={{ padding: '8px 12px' }}>Description</th>
                                        <th style={{ padding: '8px 12px', width: '70px', textAlign: 'center' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {templateVariables.map(v => (
                                        <tr key={v.id}>
                                            <td style={{ padding: '8px 12px' }}>
                                                <code style={{ background: '#e9ecef', padding: '2px 6px', borderRadius: '4px', fontSize: '0.8rem' }}>{`{{${v.name}}}`}</code>
                                            </td>
                                            <td style={{ padding: '8px 12px' }}>
                                                <small className="text-muted">{v.description}</small>
                                            </td>
                                            <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                                                <Button 
                                                    size="sm" 
                                                    variant="link"
                                                    onClick={() => handleEditVariable(v)}
                                                    style={{ padding: '0 4px', fontSize: '0.8rem' }}
                                                >
                                                    ✏️
                                                </Button>
                                                <Button 
                                                    size="sm" 
                                                    variant="link"
                                                    onClick={() => handleDeleteVariable(v.id)}
                                                    style={{ padding: '0 4px', fontSize: '0.8rem', color: '#dc3545' }}
                                                >
                                                    🗑️
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={6}>
                    <Card className="config-card">
                        <Card.Header className="d-flex justify-content-between align-items-center" style={{ background: '#f8f9fa', fontWeight: '600', fontSize: '0.9rem' }}>
                            <span>👥 Distribution Groups</span>
                            <Button size="sm" variant="outline-primary" onClick={handleAddGroup} style={{ padding: '2px 8px', fontSize: '0.75rem' }}>+ Add</Button>
                        </Card.Header>
                        <Card.Body style={{ padding: '0' }}>
                            <Table size="sm" className="mb-0" style={{ fontSize: '0.85rem' }}>
                                <thead style={{ background: '#f8f9fa' }}>
                                    <tr>
                                        <th style={{ padding: '8px 12px' }}>Group Name</th>
                                        <th style={{ padding: '8px 12px' }}>Email Address</th>
                                        <th style={{ padding: '8px 12px', width: '50px', textAlign: 'center' }}>Edit</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {distributionGroups.map(group => (
                                        <tr key={group.id}>
                                            <td style={{ padding: '8px 12px' }}>{group.name}</td>
                                            <td style={{ padding: '8px 12px' }}>
                                                <code style={{ fontSize: '0.8rem' }}>{group.email}</code>
                                            </td>
                                            <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                                                <Button 
                                                    size="sm" 
                                                    variant="link"
                                                    onClick={() => handleEditGroup(group)}
                                                    style={{ padding: '0', fontSize: '0.8rem' }}
                                                >
                                                    ✏️
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Edit Template Modal */}
            <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg">
                <Modal.Header closeButton style={{ background: '#235CF4', color: 'white' }}>
                    <Modal.Title style={{ fontSize: '1rem' }}>Edit Template: {editingTemplate?.name}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {editingTemplate && (
                        <>
                            <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label><strong>Template Name</strong></Form.Label>
                                        <Form.Control 
                                            type="text" 
                                            value={editingTemplate.name}
                                            onChange={(e) => setEditingTemplate({...editingTemplate, name: e.target.value})}
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label><strong>Compliance Priority</strong></Form.Label>
                                        <Form.Select 
                                            value={editingTemplate.complianceType}
                                            onChange={(e) => setEditingTemplate({...editingTemplate, complianceType: e.target.value})}
                                        >
                                            {complianceTypes.map(type => (
                                                <option key={type} value={type}>{type}</option>
                                            ))}
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                            </Row>
                            <Form.Group className="mb-3">
                                <Form.Label><strong>Non-Compliance Type</strong></Form.Label>
                                <Form.Select 
                                    value={editingTemplate.issueType || ''}
                                    onChange={(e) => setEditingTemplate({...editingTemplate, issueType: e.target.value})}
                                >
                                    {complianceIssueTypes.map(type => (
                                        <option key={type} value={type}>{type}</option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label><strong>Recipients</strong></Form.Label>
                                <Form.Control 
                                    type="text" 
                                    value={editingTemplate.recipients}
                                    onChange={(e) => setEditingTemplate({...editingTemplate, recipients: e.target.value})}
                                />
                                <Form.Text className="text-muted">Separate multiple recipients with commas</Form.Text>
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label><strong>Subject Line</strong></Form.Label>
                                <Form.Control 
                                    type="text" 
                                    value={editingTemplate.subject}
                                    onChange={(e) => setEditingTemplate({...editingTemplate, subject: e.target.value})}
                                />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label><strong>Email Body</strong></Form.Label>
                                <Form.Control 
                                    as="textarea" 
                                    rows={10}
                                    value={editingTemplate.body || ''}
                                    onChange={(e) => setEditingTemplate({...editingTemplate, body: e.target.value})}
                                    style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}
                                />
                                <Form.Text className="text-muted">
                                    Use variables: {'{{policy_number}}'}, {'{{insured_name}}'}, {'{{review_date}}'}, {'{{findings_count}}'}, {'{{due_date}}'}, {'{{reviewer_name}}'}
                                </Form.Text>
                            </Form.Group>
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="outline-info" size="sm" onClick={() => setShowPreviewModal(true)}>
                        👁️ Preview
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => setShowEditModal(false)}>Cancel</Button>
                    <Button variant="primary" size="sm" style={{ background: '#235CF4', border: 'none' }} onClick={handleSave}>
                        Save Changes
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Preview Modal */}
            <Modal show={showPreviewModal} onHide={() => setShowPreviewModal(false)} size="lg">
                <Modal.Header closeButton style={{ background: '#235CF4', color: 'white' }}>
                    <Modal.Title style={{ fontSize: '1rem' }}>📬 Email Preview</Modal.Title>
                </Modal.Header>
                <Modal.Body style={{ padding: 0 }}>
                    {editingTemplate && (
                        <div>
                            <div style={{ background: '#f8f9fa', padding: '15px 20px', borderBottom: '1px solid #dee2e6' }}>
                                <div className="mb-1">
                                    <small className="text-muted" style={{ width: '60px', display: 'inline-block' }}>From:</small> 
                                    AccuFile Analytics &lt;accufile-noreply@everest.com&gt;
                                </div>
                                <div className="mb-1">
                                    <small className="text-muted" style={{ width: '60px', display: 'inline-block' }}>To:</small> 
                                    {editingTemplate.recipients}
                                </div>
                                <div>
                                    <small className="text-muted" style={{ width: '60px', display: 'inline-block' }}>Subject:</small> 
                                    <strong>{templateVariables.reduce((text, v) => 
                                        text.replace(new RegExp(`\\{\\{${v.name}\\}\\}`, 'g'), v.sampleValue),
                                        editingTemplate.subject
                                    )}</strong>
                                </div>
                            </div>
                            <div style={{ padding: '20px', background: '#fff', minHeight: '300px', whiteSpace: 'pre-wrap', fontFamily: 'Arial, sans-serif', fontSize: '0.9rem', lineHeight: '1.6' }}>
                                {templateVariables.reduce((text, v) => 
                                    text.replace(new RegExp(`\\{\\{${v.name}\\}\\}`, 'g'), v.sampleValue),
                                    editingTemplate.body || ''
                                )}
                            </div>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" size="sm" onClick={() => setShowPreviewModal(false)}>Close</Button>
                </Modal.Footer>
            </Modal>

            {/* Edit Distribution Group Modal */}
            <Modal show={showGroupModal} onHide={() => setShowGroupModal(false)}>
                <Modal.Header closeButton style={{ background: '#235CF4', color: 'white' }}>
                    <Modal.Title style={{ fontSize: '1rem' }}>
                        {editingGroup?.name ? 'Edit Distribution Group' : 'Add Distribution Group'}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {editingGroup && (
                        <>
                            <Form.Group className="mb-3">
                                <Form.Label><strong>Group Name</strong></Form.Label>
                                <Form.Control 
                                    type="text" 
                                    value={editingGroup.name}
                                    onChange={(e) => setEditingGroup({...editingGroup, name: e.target.value})}
                                    placeholder="e.g., Quality Assurance Team"
                                />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label><strong>Email Address</strong></Form.Label>
                                <Form.Control 
                                    type="email" 
                                    value={editingGroup.email}
                                    onChange={(e) => setEditingGroup({...editingGroup, email: e.target.value})}
                                    placeholder="e.g., qa.team@everest.com"
                                />
                                <Form.Text className="text-muted">Enter the email address or distribution list for this group</Form.Text>
                            </Form.Group>
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" size="sm" onClick={() => setShowGroupModal(false)}>Cancel</Button>
                    <Button 
                        variant="primary" 
                        size="sm" 
                        style={{ background: '#235CF4', border: 'none' }} 
                        onClick={handleSaveNewGroup}
                        disabled={!editingGroup?.name || !editingGroup?.email}
                    >
                        Save
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Edit Variable Modal */}
            <Modal show={showVariableModal} onHide={() => setShowVariableModal(false)}>
                <Modal.Header closeButton style={{ background: '#235CF4', color: 'white' }}>
                    <Modal.Title style={{ fontSize: '1rem' }}>
                        {editingVariable?.name ? 'Edit Variable' : 'Add Variable'}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {editingVariable && (
                        <>
                            <Form.Group className="mb-3">
                                <Form.Label><strong>Variable Name</strong></Form.Label>
                                <Form.Control 
                                    type="text" 
                                    value={editingVariable.name}
                                    onChange={(e) => setEditingVariable({...editingVariable, name: e.target.value.toLowerCase().replace(/\s+/g, '_')})}
                                    placeholder="e.g., policy_type"
                                />
                                <Form.Text className="text-muted">Use lowercase with underscores (no spaces)</Form.Text>
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label><strong>Description</strong></Form.Label>
                                <Form.Control 
                                    type="text" 
                                    value={editingVariable.description}
                                    onChange={(e) => setEditingVariable({...editingVariable, description: e.target.value})}
                                    placeholder="e.g., Type of insurance policy"
                                />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label><strong>Sample Value</strong></Form.Label>
                                <Form.Control 
                                    type="text" 
                                    value={editingVariable.sampleValue}
                                    onChange={(e) => setEditingVariable({...editingVariable, sampleValue: e.target.value})}
                                    placeholder="e.g., Commercial Auto"
                                />
                                <Form.Text className="text-muted">Used in email preview</Form.Text>
                            </Form.Group>
                            {editingVariable.name && (
                                <div style={{ background: '#f8f9fa', padding: '10px', borderRadius: '6px' }}>
                                    <small className="text-muted">Preview: </small>
                                    <code style={{ background: '#e9ecef', padding: '2px 6px', borderRadius: '4px' }}>{`{{${editingVariable.name}}}`}</code>
                                </div>
                            )}
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" size="sm" onClick={() => setShowVariableModal(false)}>Cancel</Button>
                    <Button 
                        variant="primary" 
                        size="sm" 
                        style={{ background: '#235CF4', border: 'none' }} 
                        onClick={handleSaveVariable}
                        disabled={!editingVariable?.name}
                    >
                        Save
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* New Template Modal */}
            <Modal show={showNewTemplateModal} onHide={() => setShowNewTemplateModal(false)} size="lg">
                <Modal.Header closeButton style={{ background: '#235CF4', color: 'white' }}>
                    <Modal.Title style={{ fontSize: '1rem' }}>📧 Create New Email Template</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {newTemplate && (
                        <>
                            <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label><strong>Template Name</strong></Form.Label>
                                        <Form.Control 
                                            type="text" 
                                            value={newTemplate.name}
                                            onChange={(e) => setNewTemplate({...newTemplate, name: e.target.value})}
                                            placeholder="e.g., Escalation Notice"
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label><strong>Compliance Priority</strong></Form.Label>
                                        <Form.Select 
                                            value={newTemplate.complianceType}
                                            onChange={(e) => setNewTemplate({...newTemplate, complianceType: e.target.value})}
                                        >
                                            {complianceTypes.map(type => (
                                                <option key={type} value={type}>{type}</option>
                                            ))}
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                            </Row>
                            <Form.Group className="mb-3">
                                <Form.Label><strong>Non-Compliance Type</strong></Form.Label>
                                <Form.Select 
                                    value={newTemplate.issueType || ''}
                                    onChange={(e) => setNewTemplate({...newTemplate, issueType: e.target.value})}
                                >
                                    <option value="">Select non-compliance type...</option>
                                    {complianceIssueTypes.map(type => (
                                        <option key={type} value={type}>{type}</option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label><strong>Recipients</strong></Form.Label>
                                <Form.Control 
                                    type="text" 
                                    value={newTemplate.recipients}
                                    onChange={(e) => setNewTemplate({...newTemplate, recipients: e.target.value})}
                                    placeholder="e.g., Compliance Officers, Risk Management"
                                />
                                <Form.Text className="text-muted">Separate multiple recipients with commas</Form.Text>
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label><strong>Subject Line</strong></Form.Label>
                                <Form.Control 
                                    type="text" 
                                    value={newTemplate.subject}
                                    onChange={(e) => setNewTemplate({...newTemplate, subject: e.target.value})}
                                    placeholder="e.g., [ESCALATION] Review Required - {{policy_number}}"
                                />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label><strong>Email Body</strong></Form.Label>
                                <Form.Control 
                                    as="textarea" 
                                    rows={8}
                                    value={newTemplate.body || ''}
                                    onChange={(e) => setNewTemplate({...newTemplate, body: e.target.value})}
                                    style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}
                                />
                                <Form.Text className="text-muted">
                                    Available variables: {templateVariables.map(v => `{{${v.name}}}`).join(', ')}
                                </Form.Text>
                            </Form.Group>
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button 
                        variant="outline-info" 
                        size="sm" 
                        onClick={() => setShowNewTemplatePreview(true)}
                        disabled={!newTemplate?.subject}
                    >
                        👁️ Preview
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => setShowNewTemplateModal(false)}>Cancel</Button>
                    <Button 
                        variant="primary" 
                        size="sm" 
                        style={{ background: '#235CF4', border: 'none' }} 
                        onClick={handleSaveNewTemplate}
                        disabled={!newTemplate?.name || !newTemplate?.subject}
                    >
                        Create Template
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* New Template Preview Modal */}
            <Modal show={showNewTemplatePreview} onHide={() => setShowNewTemplatePreview(false)} size="lg">
                <Modal.Header closeButton style={{ background: '#235CF4', color: 'white' }}>
                    <Modal.Title style={{ fontSize: '1rem' }}>📬 New Template Preview</Modal.Title>
                </Modal.Header>
                <Modal.Body style={{ padding: 0 }}>
                    {newTemplate && (
                        <div>
                            <div style={{ background: '#f8f9fa', padding: '15px 20px', borderBottom: '1px solid #dee2e6' }}>
                                <div className="mb-1">
                                    <small className="text-muted" style={{ width: '60px', display: 'inline-block' }}>From:</small> 
                                    AccuFile Analytics &lt;accufile-noreply@everest.com&gt;
                                </div>
                                <div className="mb-1">
                                    <small className="text-muted" style={{ width: '60px', display: 'inline-block' }}>To:</small> 
                                    {newTemplate.recipients || '[Recipients]'}
                                </div>
                                <div>
                                    <small className="text-muted" style={{ width: '60px', display: 'inline-block' }}>Subject:</small> 
                                    <strong>{templateVariables.reduce((text, v) => 
                                        text.replace(new RegExp(`\\{\\{${v.name}\\}\\}`, 'g'), v.sampleValue),
                                        newTemplate.subject || ''
                                    )}</strong>
                                </div>
                            </div>
                            <div style={{ padding: '20px', background: '#fff', minHeight: '300px', whiteSpace: 'pre-wrap', fontFamily: 'Arial, sans-serif', fontSize: '0.9rem', lineHeight: '1.6' }}>
                                {templateVariables.reduce((text, v) => 
                                    text.replace(new RegExp(`\\{\\{${v.name}\\}\\}`, 'g'), v.sampleValue),
                                    newTemplate.body || ''
                                )}
                            </div>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" size="sm" onClick={() => setShowNewTemplatePreview(false)}>Close</Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default ConfigurationPage;
