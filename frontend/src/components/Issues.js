import React from 'react';
import { Card, Table, Badge } from 'react-bootstrap';

const Issues = ({ issues }) => {
    if (!issues || issues.length === 0) {
        return (
            <Card className="issues-card">
                <Card.Header className="card-header-centered">
                    Critical Issues
                </Card.Header>
                <Card.Body className="text-center py-5">
                    <div className="empty-state">
                        <div className="success-icon mb-2">✓</div>
                        <p className="text-success mb-0"><strong>No issues found!</strong></p>
                        <small className="text-muted">All files passed validation or workflow not yet run.</small>
                    </div>
                </Card.Body>
            </Card>
        );
    }

    return (
        <Card className="issues-card">
            <Card.Header className="card-header-centered">
                Critical Issues
            </Card.Header>
            <Card.Body>
                <div className="table-responsive" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    <Table hover size="sm" className="issues-table">
                        <thead className="table-header-sticky">
                            <tr>
                                <th style={{ width: '15%' }}>Policy ID</th>
                                <th style={{ width: '30%' }}>File Name</th>
                                <th style={{ width: '55%' }}>Issue</th>
                            </tr>
                        </thead>
                        <tbody>
                            {issues.map((issue, index) => (
                                <tr key={index}>
                                    <td>
                                        <Badge bg="secondary" className="font-monospace">
                                            {issue.policy_id}
                                        </Badge>
                                    </td>
                                    <td className="text-truncate" title={issue.file_name}>
                                        <span className="file-name">{issue.file_name}</span>
                                    </td>
                                    <td>
                                        <span className="issue-text">{issue.issue}</span>
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
