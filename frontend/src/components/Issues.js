import React from 'react';
import { Card, Table, Badge, Button } from 'react-bootstrap';
import * as XLSX from 'xlsx';

const Issues = ({ issues }) => {
    // Synthetic data for File Audit Tracker
    const syntheticAuditData = [
        { submissionNumber: 'SUB-2026-001234', policyNumber: 'POL-78901', submissionType: 'New Business', submissionStatus: 'Pending Review', createdUser: 'jsmith', recdDate: '2026-04-15', createdDate: '2026-04-14', quotedDate: '2026-04-16', boundDate: '', policyEffDate: '2026-05-01', lob: 'Commercial Auto', complianceStatus: 'Non-Compliant', reviewComments: 'Policy Document Missing' },
        { submissionNumber: 'SUB-2026-001235', policyNumber: 'POL-78902', submissionType: 'Renewal', submissionStatus: 'Quoted', createdUser: 'mjohnson', recdDate: '2026-04-10', createdDate: '2026-04-09', quotedDate: '2026-04-12', boundDate: '', policyEffDate: '2026-06-01', lob: 'General Liability', complianceStatus: 'Compliant', reviewComments: '' },
        { submissionNumber: 'SUB-2026-001236', policyNumber: 'POL-78903', submissionType: 'Endorsement', submissionStatus: 'Bound', createdUser: 'kwilliams', recdDate: '2026-04-08', createdDate: '2026-04-07', quotedDate: '2026-04-09', boundDate: '2026-04-11', policyEffDate: '2026-04-15', lob: 'Workers Comp', complianceStatus: 'Non-Compliant', reviewComments: 'Invoice Missing' },
        { submissionNumber: 'SUB-2026-001237', policyNumber: 'POL-78904', submissionType: 'New Business', submissionStatus: 'In Progress', createdUser: 'abrown', recdDate: '2026-04-20', createdDate: '2026-04-19', quotedDate: '', boundDate: '', policyEffDate: '2026-05-15', lob: 'Property', complianceStatus: 'Pending', reviewComments: 'Awaiting quote approval' },
        { submissionNumber: 'SUB-2026-001238', policyNumber: 'POL-78905', submissionType: 'Renewal', submissionStatus: 'Bound', createdUser: 'ldavis', recdDate: '2026-04-05', createdDate: '2026-04-04', quotedDate: '2026-04-06', boundDate: '2026-04-08', policyEffDate: '2026-04-20', lob: 'Commercial Auto', complianceStatus: 'Non-Compliant', reviewComments: 'Quote Missing' },
        { submissionNumber: 'SUB-2026-001239', policyNumber: 'POL-78906', submissionType: 'New Business', submissionStatus: 'Pending Review', createdUser: 'tgarcia', recdDate: '2026-04-22', createdDate: '2026-04-21', quotedDate: '', boundDate: '', policyEffDate: '2026-06-01', lob: 'Umbrella', complianceStatus: 'Non-Compliant', reviewComments: 'Service Provider Missing' },
        { submissionNumber: 'SUB-2026-001240', policyNumber: 'POL-78907', submissionType: 'Endorsement', submissionStatus: 'Quoted', createdUser: 'jsmith', recdDate: '2026-04-18', createdDate: '2026-04-17', quotedDate: '2026-04-20', boundDate: '', policyEffDate: '2026-05-01', lob: 'General Liability', complianceStatus: 'Compliant', reviewComments: '' },
        { submissionNumber: 'SUB-2026-001241', policyNumber: 'POL-78908', submissionType: 'New Business', submissionStatus: 'Bound', createdUser: 'mjohnson', recdDate: '2026-04-01', createdDate: '2026-03-31', quotedDate: '2026-04-03', boundDate: '2026-04-05', policyEffDate: '2026-04-15', lob: 'Property', complianceStatus: 'Compliant', reviewComments: '' },
        { submissionNumber: 'SUB-2026-001242', policyNumber: 'POL-78909', submissionType: 'Renewal', submissionStatus: 'In Progress', createdUser: 'kwilliams', recdDate: '2026-04-25', createdDate: '2026-04-24', quotedDate: '', boundDate: '', policyEffDate: '2026-06-15', lob: 'Workers Comp', complianceStatus: 'Pending', reviewComments: 'Under review' },
        { submissionNumber: 'SUB-2026-001243', policyNumber: 'POL-78910', submissionType: 'New Business', submissionStatus: 'Pending Review', createdUser: 'abrown', recdDate: '2026-04-28', createdDate: '2026-04-27', quotedDate: '', boundDate: '', policyEffDate: '2026-06-01', lob: 'Commercial Auto', complianceStatus: 'Non-Compliant', reviewComments: 'Policy Document Missing' },
    ];

    const downloadAsExcel = () => {
        // Prepare data for XLSX
        const data = syntheticAuditData.map(item => ({
            'Submission Number': item.submissionNumber,
            'Policy Number': item.policyNumber,
            'Submission Type': item.submissionType,
            'Submission Status': item.submissionStatus,
            'Submission Created User': item.createdUser,
            'Submission Recd Date': item.recdDate,
            'Submission Created Date': item.createdDate,
            'Quoted Date': item.quotedDate,
            'Bound Date': item.boundDate,
            'Policy Eff Date': item.policyEffDate,
            'LOB': item.lob,
            'File Compliance Status': item.complianceStatus,
            'Review Comments': item.reviewComments
        }));

        // Create workbook and worksheet
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'File Audit Tracker');

        // Auto-size columns
        const colWidths = [
            { wch: 18 },  // Submission Number
            { wch: 14 },  // Policy Number
            { wch: 15 },  // Submission Type
            { wch: 16 },  // Submission Status
            { wch: 20 },  // Created User
            { wch: 16 },  // Recd Date
            { wch: 18 },  // Created Date
            { wch: 12 },  // Quoted Date
            { wch: 12 },  // Bound Date
            { wch: 14 },  // Policy Eff Date
            { wch: 18 },  // LOB
            { wch: 20 },  // Compliance Status
            { wch: 30 }   // Review Comments
        ];
        worksheet['!cols'] = colWidths;

        // Generate and download XLSX file
        const timestamp = new Date().toISOString().slice(0, 10);
        XLSX.writeFile(workbook, `file_audit_tracker_${timestamp}.xlsx`);
    };

    const getStatusBadgeVariant = (status) => {
        switch (status) {
            case 'Bound': return 'success';
            case 'Quoted': return 'info';
            case 'Pending Review': return 'warning';
            case 'In Progress': return 'primary';
            default: return 'secondary';
        }
    };

    const getComplianceBadgeVariant = (status) => {
        switch (status) {
            case 'Compliant': return 'success';
            case 'Non-Compliant': return 'danger';
            case 'Pending': return 'warning';
            default: return 'secondary';
        }
    };

    return (
        <Card className="issues-card">
            <Card.Header className="card-header-centered d-flex justify-content-between align-items-center">
                <span>File Audit Tracker</span>
                <Button 
                    variant="outline-primary" 
                    size="sm" 
                    onClick={downloadAsExcel}
                    className="download-btn"
                >
                    <span className="me-1">⬇</span> Export XLSX
                </Button>
            </Card.Header>
            <Card.Body>
                <div className="table-responsive" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    <Table hover size="sm" className="issues-table" style={{ fontSize: '0.75rem' }}>
                        <thead className="table-header-sticky">
                            <tr>
                                <th style={{ whiteSpace: 'nowrap' }}>Submission Number</th>
                                <th style={{ whiteSpace: 'nowrap' }}>Policy Number</th>
                                <th style={{ whiteSpace: 'nowrap' }}>Submission Type</th>
                                <th style={{ whiteSpace: 'nowrap' }}>Submission Status</th>
                                <th style={{ whiteSpace: 'nowrap' }}>Submission Created User</th>
                                <th style={{ whiteSpace: 'nowrap' }}>Submission Recd Date</th>
                                <th style={{ whiteSpace: 'nowrap' }}>Submission Created Date</th>
                                <th style={{ whiteSpace: 'nowrap' }}>Quoted Date</th>
                                <th style={{ whiteSpace: 'nowrap' }}>Bound Date</th>
                                <th style={{ whiteSpace: 'nowrap' }}>Policy Eff Date</th>
                                <th>LOB</th>
                                <th style={{ whiteSpace: 'nowrap' }}>File Compliance Status</th>
                                <th style={{ whiteSpace: 'nowrap' }}>Review Comments</th>
                            </tr>
                        </thead>
                        <tbody>
                            {syntheticAuditData.map((item, index) => (
                                <tr key={index}>
                                    <td>
                                        <Badge bg="secondary" className="font-monospace" style={{ fontSize: '0.7rem' }}>
                                            {item.submissionNumber}
                                        </Badge>
                                    </td>
                                    <td>
                                        <Badge bg="dark" className="font-monospace" style={{ fontSize: '0.7rem' }}>
                                            {item.policyNumber}
                                        </Badge>
                                    </td>
                                    <td>{item.submissionType}</td>
                                    <td>
                                        <Badge bg={getStatusBadgeVariant(item.submissionStatus)} style={{ fontSize: '0.65rem' }}>
                                            {item.submissionStatus}
                                        </Badge>
                                    </td>
                                    <td>{item.createdUser}</td>
                                    <td>{item.recdDate}</td>
                                    <td>{item.createdDate}</td>
                                    <td>{item.quotedDate || '-'}</td>
                                    <td>{item.boundDate || '-'}</td>
                                    <td>{item.policyEffDate}</td>
                                    <td>{item.lob}</td>
                                    <td>
                                        <Badge bg={getComplianceBadgeVariant(item.complianceStatus)} style={{ fontSize: '0.65rem' }}>
                                            {item.complianceStatus}
                                        </Badge>
                                    </td>
                                    <td style={{ color: item.reviewComments ? '#dc3545' : '#6c757d' }}>
                                        {item.reviewComments || '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </div>
            </Card.Body>
        </Card>
    );
};

export default Issues;
