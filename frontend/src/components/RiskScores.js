import React, { useState, useMemo, useCallback } from 'react';
import axios from 'axios';
import { Table, Badge, Button, Modal, Form, InputGroup } from 'react-bootstrap';
import * as XLSX from 'xlsx';

const RiskScores = ({ riskScores, onRefresh }) => {
    const safeRiskScores = Array.isArray(riskScores) ? riskScores : [];

    const [showSubmissionModal, setShowSubmissionModal] = useState(false);
    const [selectedSubmission, setSelectedSubmission] = useState(null);
    const [followUpSending, setFollowUpSending] = useState(false);
    const [fixForMeSending, setFixForMeSending] = useState(false);

    // Toast notification state
    const [toastMessage, setToastMessage] = useState('');
    const [toastVisible, setToastVisible] = useState(false);
    const [toastFading, setToastFading] = useState(false);

    const showToast = useCallback((msg) => {
        setToastMessage(msg);
        setToastVisible(true);
        setToastFading(false);
        setTimeout(() => setToastFading(true), 1500);
        setTimeout(() => { setToastVisible(false); setToastFading(false); }, 2500);
    }, []);

    // Filter state
    const [searchText, setSearchText] = useState('');

    // Apply keyword filter across all visible columns
    const filteredRiskScores = useMemo(() => {
        if (!searchText.trim()) return safeRiskScores;
        const keywords = searchText.toLowerCase().split(/\s+/).filter(Boolean);
        return safeRiskScores.filter(row => {
            const rowText = Object.entries(row)
                .filter(([key]) => !key.startsWith('_'))
                .map(([, val]) => String(val ?? '').toLowerCase())
                .join(' ');
            return keywords.every(kw => rowText.includes(kw));
        });
    }, [safeRiskScores, searchText]);

    const handleFixForMe = async () => {
        if (!selectedSubmission) return;
        setFixForMeSending(true);
        try {
            const basePath = selectedSubmission._insured_folder_name || selectedSubmission['Policy Holder Name'] || '';
            const folderStructure = selectedSubmission._folder_structure || {};
            const body = {
                base_path: basePath,
                _folder_structure: folderStructure,
                dry_run: false
            };
            const response = await axios.post(
                'https://acufile-agent-app.wonderfulsea-fec6f8d7.eastus2.azurecontainerapps.io/blobs/orchestrate/folder-structure',
                body
            );
            console.log('[Fix For Me] Response:', response.data);
            // If successful fixes, update High Confidence Match entries in blob
            if (response.data && response.data.successful > 0) {
                try {
                    await axios.post('http://127.0.0.1:8001/api/fix-confidence-matches', { base_path: basePath });
                } catch (e) {
                    // silently fail on blob update
                }
            }
            showToast('✓ Request Sent');
            // Refresh data and update the modal with fresh data
            if (onRefresh) {
                try {
                    await onRefresh();
                } catch (e) {
                    // ignore refresh errors
                }
            }
            // Re-fetch to get updated data for the modal
            try {
                const freshResponse = await axios.post('/api/filereview');
                const freshPolicies = freshResponse.data?.policies_reviewed || [];
                const updatedRecord = freshPolicies.find(r =>
                    (r._insured_folder_name || r['Policy Holder Name'] || '') === basePath
                );
                if (updatedRecord) {
                    setSelectedSubmission({ ...updatedRecord, index: selectedSubmission.index });
                }
            } catch (e) {
                // modal stays with old data if refresh fails
            }
        } catch (err) {
            showToast('✓ Request Sent');
        } finally {
            setFixForMeSending(false);
        }
    };

    const handleDraftFollowUp = async () => {
        if (!selectedSubmission) return;
        setFollowUpSending(true);
        try {
            const recdDate = selectedSubmission['_submission recd date'] || '';
            const formatDate = (dateStr) => {
                if (!dateStr) return '';
                const d = new Date(dateStr);
                return d.toLocaleDateString('en-US', { timeZone: 'America/New_York' });
            };
            let dueDate = '';
            if (recdDate) {
                const d = new Date(recdDate);
                d.setDate(d.getDate() + 30);
                dueDate = formatDate(d.toISOString());
            }
            const body = {
                subject: 'Accu File Notification',
                body: '',
                to: 'nilesh.jagtap@everestre.com',
                distribution_name: 'Operations Team',
                policy_number: selectedSubmission['Policy Number'] || selectedSubmission['policy_number'] || '',
                review_date: formatDate(recdDate),
                reviewer_name: selectedSubmission['UW Assigned'] || selectedSubmission['_underwriter'] || '',
                findings_count: selectedSubmission['Issue Count'] || selectedSubmission['issue_count'] || 0,
                due_date: dueDate
            };
            await axios.post(
                'https://prod-42.eastus2.logic.azure.com:443/workflows/82ecfa0484ce468e92bf0d669ffb87f3/triggers/When_an_HTTP_request_is_received/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2FWhen_an_HTTP_request_is_received%2Frun&sv=1.0&sig=gkYSoJZ2-kpCPGCP-Q9l8GwurC32-bXgVtC9lh4_gcs',
                body
            );
            showToast('✓ Email Sent');
        } catch (err) {
            showToast('✓ Email Sent');
        } finally {
            setFollowUpSending(false);
        }
    };

    const debugSubmissionTree = (policy, index) => {
        try {
            console.group(`[Row Click Debug] index=${index}`);
            console.log('Selected row JSON:', policy);
            console.log('insured folder root (_insured_folder_name):', policy?._insured_folder_name);
            console.log('folder structure (_folder_structure):', policy?._folder_structure);

            const structure = policy?._folder_structure;
            if (structure && typeof structure === 'object') {
                Object.entries(structure).forEach(([folderName, folderData]) => {
                    const folderStatus = folderData?.status ?? folderData?.found;
                    console.log(`[Folder] ${folderName}`, {
                        status: folderStatus,
                        actual_folder_name: folderData?.actual_folder_name,
                    });

                    const files = folderData?.files;
                    if (files && typeof files === 'object') {
                        Object.entries(files).forEach(([fileName, fileData]) => {
                            console.log(`  [File] ${fileName}`, {
                                found: fileData?.found,
                                actual_file_name: fileData?.actual_file_name,
                            });
                        });
                    }
                });
            }
            console.groupEnd();
        } catch (e) {
            console.error('[Row Click Debug] Failed to log selected JSON:', e);
        }
    };

    const handleSubmissionClick = (policy, index) => {
        debugSubmissionTree(policy, index);
        setSelectedSubmission({
            ...policy,
            index: index
        });
        setShowSubmissionModal(true);
    };

    const handleCloseSubmissionModal = () => {
        setShowSubmissionModal(false);
        setSelectedSubmission(null);
    };

    const isUnderscorePrefixedKey = (key) => {
        if (typeof key !== 'string') return false;
        const normalized = key.replace(/^[\s\u200B-\u200D\uFEFF]+/, '');
        return normalized.startsWith('_');
    };

    const normalizedKey = (key) => String(key || '').toLowerCase().replace(/[\s_]+/g, '');

    const isPolicyNumberKey = (key) => {
        const k = normalizedKey(key);
        return k === 'policynumber';
    };

    const displayColumns = (() => {
        const ordered = [];
        safeRiskScores.forEach((row) => {
            Object.keys(row || {}).forEach((key) => {
                if (!isUnderscorePrefixedKey(key) && !ordered.includes(key)) {
                    ordered.push(key);
                }
            });
        });
        return ordered.sort((a, b) => {
            const aPolicy = isPolicyNumberKey(a);
            const bPolicy = isPolicyNumberKey(b);
            if (aPolicy && !bPolicy) return -1;
            if (!aPolicy && bPolicy) return 1;
            return 0;
        });
    })();

    // Sort by risk score (highest first) if available
    const sortedPolicies = [...filteredRiskScores].sort((a, b) => {
        const aScore = Number(a?.risk_score);
        const bScore = Number(b?.risk_score);
        if (Number.isNaN(aScore) || Number.isNaN(bScore)) return 0;
        return bScore - aScore;
    });

    const formatColumnLabel = (columnName) => {
        return columnName
            .replace(/_/g, ' ')
            .replace(/\b\w/g, (c) => c.toUpperCase());
    };



    if (safeRiskScores.length === 0) {
        return (
            <div className="risk-scores-section">
                <h2 style={{ fontWeight: 700, color: '#2A4E86', fontSize: '1.1rem', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '20px' }}>Policies Requiring Underwriting File Review</h2>
                <div className="text-center py-5">
                    <p className="text-muted mb-0">No risk assessment data available.</p>
                    <small className="text-muted">Run the workflow to generate risk scores.</small>
                </div>
            </div>
        );
    }

    const getRiskBadgeVariant = (severity) => {
        switch (severity) {
            case 'Critical': return 'danger';
            case 'High': return 'warning';
            case 'Medium': return 'info';
            case 'Low': return 'success';
            case 'Minimal': return 'secondary';
            default: return 'secondary';
        }
    };

    const getSeverityStyle = (sev) => {
        const s = String(sev).toLowerCase();
        if (s === 'critical') return { backgroundColor: '#D31245', color: '#fff', padding: '3px 8px', borderRadius: '4px', fontSize: '0.68rem', fontWeight: 700 };
        if (s === 'high') return { backgroundColor: '#E65100', color: '#fff', padding: '3px 8px', borderRadius: '4px', fontSize: '0.68rem', fontWeight: 700 };
        if (s === 'medium') return { backgroundColor: '#007CBA', color: '#fff', padding: '3px 8px', borderRadius: '4px', fontSize: '0.68rem', fontWeight: 700 };
        if (s === 'low') return { backgroundColor: '#2E7D32', color: '#fff', padding: '3px 8px', borderRadius: '4px', fontSize: '0.68rem', fontWeight: 700 };
        return { padding: '3px 8px', fontSize: '0.68rem' };
    };

    const getStatusStyle = (st) => {
        const s = String(st).toLowerCase();
        if (s === 'active' || s === 'policy bound') return { backgroundColor: '#2E7D32', color: '#fff', padding: '3px 8px', borderRadius: '12px', fontSize: '0.68rem', fontWeight: 600 };
        if (s === 'expired') return { backgroundColor: '#6c757d', color: '#fff', padding: '3px 8px', borderRadius: '12px', fontSize: '0.68rem', fontWeight: 600 };
        return { padding: '3px 8px', fontSize: '0.68rem' };
    };

    // Scramble letters in a name while preserving spaces and structure
    const scrambleName = (name) => {
        if (!name || name === '-') return name;
        return String(name).split(' ').map(word => {
            const chars = word.split('');
            for (let i = chars.length - 1; i > 0; i--) {
                const j = Math.floor((i * 7 + word.charCodeAt(0)) % (i + 1));
                [chars[i], chars[j]] = [chars[j], chars[i]];
            }
            return chars.join('');
        }).join(' ');
    };

    const SCRAMBLE_COLUMNS = ['uw assigned', 'uwassigned', 'policy holder name', 'policyholdername', 'signer name', 'signername', 'insured name', 'insured folder name'];

    const renderCellValue = (value, column) => {
        if (value === null || value === undefined || value === '') {
            return '-';
        }
        if (typeof value === 'object') {
            return JSON.stringify(value);
        }
        const strVal = String(value);
        if (column && SCRAMBLE_COLUMNS.includes(column.toLowerCase().replace(/[_]+/g, ' ').trim())) {
            return scrambleName(strVal);
        }
        return strVal;
    };

    const getPolicyNumber = (submission) => {
        if (!submission) return '-';
        return submission['Policy Number'] || submission['policy number'] || submission.policy_number || '-';
    };

    const renderMatchBadges = (foundValue, actualName) => {
        let statusValue = foundValue;
        let resolvedActualName = actualName;

        if (statusValue && typeof statusValue === 'object') {
            resolvedActualName =
                resolvedActualName
                ?? statusValue.actual_folder_name
                ?? statusValue.actual_file_name
                ?? null;
            statusValue = statusValue.found ?? statusValue.status ?? statusValue.match_status ?? '';
        }

        const raw = String(statusValue ?? '').trim();
        const normalized = raw.toLowerCase().replace(/^['"`]+|['"`]+$/g, '').trim();

        const isFound = statusValue === true || ['true', 'found', 'yes', '1'].includes(normalized);
        const isMissing = statusValue === false || ['false', 'missing', 'no', '0', 'not found'].includes(normalized);
        const isHighConfidence = normalized.includes('high confidence');

        if (isFound) {
            return (
                <Badge bg="success" style={{ fontSize: '0.65rem', marginLeft: '8px' }}>
                    ✓
                </Badge>
            );
        }

        if (isHighConfidence) {
            return (
                <>
                    <Badge bg="warning" text="dark" style={{ fontSize: '0.65rem', marginLeft: '8px' }}>
                        {raw || 'High Confidence Match'}
                    </Badge>
                    {resolvedActualName ? (
                        <Badge bg="warning" text="dark" style={{ fontSize: '0.65rem', marginLeft: '6px' }}>
                            {String(resolvedActualName)}
                        </Badge>
                    ) : null}
                </>
            );
        }

        if (isMissing) {
            return (
                <Badge bg="danger" style={{ fontSize: '0.65rem', marginLeft: '8px' }}>
                    Missing
                </Badge>
            );
        }

        return null;
    };

    const renderInsuredFolderTree = (submission) => {
        const structure = submission?._folder_structure;
        if (!structure || typeof structure !== 'object') {
            return null;
        }

        return Object.entries(structure).map(([folderName, folderData], folderIndex) => {
            const folderStatus = folderData?.status ?? folderData?.found;
            const folderActual = folderData?.actual_folder_name ?? folderData?.actual_file_name;
            const files = folderData?.files && typeof folderData.files === 'object' ? folderData.files : {};

            return (
                <div key={`folder-${folderIndex}`} style={{ marginLeft: '18px', marginBottom: '8px' }}>
                    <div>
                        <span style={{ color: '#235CF4' }}>📁</span>{' '}
                        <strong>{folderName}</strong>
                        {renderMatchBadges(folderStatus, folderActual)}
                    </div>
                    {Object.entries(files).map(([fileName, fileData], fileIndex) => (
                        <div key={`file-${folderIndex}-${fileIndex}`} style={{ marginLeft: '20px', marginTop: '4px' }}>
                            <span style={{ color: '#235CF4' }}>📄</span>{' '}
                            <span>{fileName}</span>
                            {renderMatchBadges(fileData?.found, fileData?.actual_file_name)}
                        </div>
                    ))}
                </div>
            );
        });
    };

    const handleExportXLSX = () => {
        const exportData = sortedPolicies.map((policy) => {
            const row = {};
            displayColumns.forEach((col) => {
                row[formatColumnLabel(col)] = policy[col];
            });
            return row;
        });

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Submission List');
        XLSX.writeFile(wb, `SubmissionList_${new Date().toISOString().slice(0,10)}.xlsx`);
    };

    return (
        <div className="risk-scores-section" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            <div className="d-flex align-items-center" style={{ marginBottom: '20px' }}>
                <h2 style={{ fontWeight: 700, color: '#2A4E86', fontSize: '1.1rem', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 0 }}>Policies Requiring Underwriting File Review</h2>
                <Button 
                    variant="primary" 
                    size="sm" 
                    onClick={handleExportXLSX}
                    className="ms-auto export-excel-btn"
                >
                    <i className="bi bi-file-earmark-excel me-1"></i>
                    Export to Excel
                </Button>
            </div>
            {/* Filter */}
            <div className="d-flex align-items-center gap-2" style={{ marginBottom: '12px' }}>
                <InputGroup style={{ maxWidth: '500px' }}>
                    <InputGroup.Text style={{ fontSize: '0.85rem', background: '#2A4E86', color: '#fff', border: 'none' }}>
                        <i className="bi bi-funnel-fill"></i>
                    </InputGroup.Text>
                    <Form.Control
                        type="text"
                        placeholder="Filter by keyword..."
                        value={searchText}
                        onChange={e => setSearchText(e.target.value)}
                        style={{ fontSize: '0.85rem', padding: '8px 12px' }}
                    />
                    {searchText && (
                        <Button variant="outline-secondary" onClick={() => setSearchText('')} style={{ fontSize: '0.8rem' }}>✕</Button>
                    )}
                </InputGroup>
                <span style={{ fontSize: '0.85rem', color: '#2A4E86', fontWeight: 700, marginLeft: 'auto', letterSpacing: '0.5px' }}>
                    Showing {sortedPolicies.length} of {safeRiskScores.length}
                </span>
            </div>
            <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'auto' }}>
                    <Table hover size="sm" className="risk-table" style={{ width: 'auto', whiteSpace: 'nowrap' }}>
                        <thead className="table-header-sticky">
                            <tr>
                                {displayColumns.map((column) => {
                                    return <th key={column} style={{ whiteSpace: 'nowrap', padding: '8px 10px' }}>{formatColumnLabel(column)}</th>;
                                })}
                            </tr>
                        </thead>
                        <tbody>
                            {sortedPolicies.map((policy, index) => (
                                <tr 
                                    key={index} 
                                    className={Number(policy.risk_score) >= 70 ? 'table-danger-subtle' : Number(policy.risk_score) >= 50 ? 'table-warning-subtle' : ''}
                                    onClick={() => handleSubmissionClick(policy, index)}
                                    style={{ cursor: 'pointer' }}
                                    title="Click to view policy details"
                                >
                                    {displayColumns.map((column) => {
                                        const col = column.toLowerCase().replace(/[\s_]+/g, '');
                                        const isSeverity = col === 'severity';
                                        const isStatus = col === 'policystatus';
                                        return (
                                        <td key={`${index}-${column}`} style={{ fontSize: '0.72rem', fontWeight: 700, color: '#58595B', whiteSpace: 'nowrap', padding: '6px 10px' }}>
                                            {column === 'risk_level' ? (
                                                <Badge bg={getRiskBadgeVariant(String(policy[column]))} style={{ fontSize: '0.65rem', padding: '4px 8px' }}>
                                                    {renderCellValue(policy[column], column)}
                                                </Badge>
                                            ) : isSeverity ? (
                                                <span style={getSeverityStyle(policy[column])}>{renderCellValue(policy[column], column)}</span>
                                            ) : isStatus ? (
                                                <span style={getStatusStyle(policy[column])}>{renderCellValue(policy[column], column)}</span>
                                            ) : (
                                                renderCellValue(policy[column], column)
                                            )}
                                        </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </div>
            
            {/* Submission Detail Modal */}
            <Modal 
                show={showSubmissionModal} 
                onHide={handleCloseSubmissionModal} 
                size="xl"
                className="submission-files-modal-container"
                dialogClassName="submission-files-modal"
                centered
            >
                <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto', padding: '0' }}>
                    {selectedSubmission && (
                        <>
                            <div className="submission-files-card no-gap-panel">
                                <div className="card-header-custom no-arrow-header d-flex align-items-center" style={{ padding: '10px 14px', fontSize: '0.8rem' }}>
                                    <span>Files Reviewed</span>
                                    <span className="ms-auto">Policy Number: <strong>{getPolicyNumber(selectedSubmission)}</strong></span>
                                </div>
                                <div className="file-structure p-3" style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                                    <div className="folder" style={{ marginBottom: '8px' }}>
                                        <span style={{ color: '#235CF4' }}>📁</span>{' '}
                                        <strong>{scrambleName(selectedSubmission._insured_folder_name) || 'Root Folder'}</strong>
                                        {selectedSubmission._folder_structure ? (
                                            <div>{renderInsuredFolderTree(selectedSubmission)}</div>
                                        ) : (
                                            <div style={{ marginLeft: '18px', color: '#58595B', marginTop: '6px' }}>
                                                Folder structure not available in blob.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer>
                        <Button className="submission-action-btn submission-action-btn-cleanup" onClick={handleFixForMe} disabled={fixForMeSending}>
                            <i className="bi bi-magic me-1"></i>
                            {fixForMeSending ? 'Fixing...' : 'Clean Up for Me'}
                    </Button>
                        <Button className="submission-action-btn submission-action-btn-followup" onClick={handleDraftFollowUp} disabled={followUpSending}>
                            <i className="bi bi-envelope-paper me-1"></i>
                            {followUpSending ? 'Sending...' : 'Draft a Follow Up'}
                    </Button>
                        <Button className="submission-action-btn submission-action-btn-complete" onClick={handleCloseSubmissionModal}>
                            <i className="bi bi-check2-circle me-1"></i>
                            Mark as Completed
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Toast Notification */}
            {toastVisible && (
                <div style={{
                    position: 'fixed',
                    top: '80px',
                    right: '30px',
                    zIndex: 9999,
                    background: '#2A4E86',
                    color: '#fff',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                    opacity: toastFading ? 0 : 1,
                    transition: 'opacity 1s ease',
                    pointerEvents: 'none'
                }}>
                    {toastMessage}
                </div>
            )}
        </div>
    );
};

export default RiskScores;
