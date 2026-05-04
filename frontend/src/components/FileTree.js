import React, { useState } from 'react';
import { Form, Badge, Accordion, ListGroup, InputGroup } from 'react-bootstrap';

const FileTree = ({ fileStructure, onFileSelect }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedPolicies, setExpandedPolicies] = useState(new Set());
    const [expandedFolders, setExpandedFolders] = useState(new Set());

    if (!fileStructure || fileStructure.length === 0) {
        return (
            <div className="file-tree-empty">
                <p className="text-muted small mb-0">No files loaded</p>
                <small className="text-muted">Run workflow to view files</small>
            </div>
        );
    }

    const togglePolicy = (policyNumber) => {
        const newExpanded = new Set(expandedPolicies);
        if (newExpanded.has(policyNumber)) {
            newExpanded.delete(policyNumber);
        } else {
            newExpanded.add(policyNumber);
        }
        setExpandedPolicies(newExpanded);
    };

    const toggleFolder = (folderId) => {
        const newExpanded = new Set(expandedFolders);
        if (newExpanded.has(folderId)) {
            newExpanded.delete(folderId);
        } else {
            newExpanded.add(folderId);
        }
        setExpandedFolders(newExpanded);
    };

    const buildFolderTree = (files) => {
        const tree = {};
        
        console.log('Building folder tree from files:', files);
        
        files.forEach(file => {
            // The backend sends file.name with full relative path like "Documents/file.pdf"
            const filePath = file.name;
            const parts = filePath.split('/');
            
            console.log(`Processing file: ${filePath}, parts:`, parts);
            
            if (parts.length === 1) {
                // Root level file
                if (!tree['__root__']) tree['__root__'] = [];
                tree['__root__'].push(file);
            } else {
                // File in subfolder
                const folder = parts.slice(0, -1).join('/');
                if (!tree[folder]) tree[folder] = [];
                tree[folder].push({
                    ...file,
                    displayName: parts[parts.length - 1] // Just the file name for display
                });
            }
        });
        
        console.log('Folder tree built:', tree);
        console.log('Folders found:', Object.keys(tree).filter(k => k !== '__root__'));
        return tree;
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'compliant': return '→';
            case 'issues': return '!';
            case 'missing': return '×';
            case 'critical': return '!!';
            default: return '→';
        }
    };

    const getFileIcon = (fileName) => {
        return '→';
    };

    const formatFileSize = (bytes) => {
        if (!bytes) return '';
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const getStatusBadge = (status, count) => {
        const variants = {
            compliant: 'success',
            issues: 'warning',
            missing: 'danger',
            critical: 'danger'
        };
        return <Badge bg={variants[status] || 'secondary'} className="ms-1" style={{ fontSize: '0.65rem' }}>{count}</Badge>;
    };

    const filteredStructure = fileStructure.filter(policy => 
        policy.policy_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (policy.files && policy.files.some(file => 
            file.name.toLowerCase().includes(searchTerm.toLowerCase())
        ))
    );

    return (
        <div className="file-tree-container">
            <InputGroup size="sm" className="mb-3">
                <InputGroup.Text className="search-icon">🔍</InputGroup.Text>
                <Form.Control
                    type="text"
                    placeholder="Search by policy..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                />
            </InputGroup>

            <div className="tree-scroll">
                {filteredStructure.map((policy) => (
                    <div key={policy.policy_number} className="policy-tree-item mb-2">
                        <div 
                            className={`policy-header ${expandedPolicies.has(policy.policy_number) ? 'expanded' : ''}`}
                            onClick={() => togglePolicy(policy.policy_number)}
                        >
                            <span className="expand-icon">
                                {expandedPolicies.has(policy.policy_number) ? '−' : '+'}
                            </span>
                            <span className="policy-name">{policy.policy_number}</span>
                            {policy.status && getStatusBadge(policy.status, policy.file_count || 0)}
                        </div>
                        
                        {expandedPolicies.has(policy.policy_number) && policy.files && (
                            <div className="files-list">
                                {(() => {
                                    const folderTree = buildFolderTree(policy.files);
                                    const folders = Object.keys(folderTree).filter(k => k !== '__root__').sort();
                                    const rootFiles = folderTree['__root__'] || [];
                                    
                                    return (
                                        <>
                                            {/* Render subfolders */}
                                            {folders.map((folderPath, idx) => {
                                                const folderId = `${policy.policy_number}-${folderPath}`;
                                                const folderName = folderPath.split('/').pop();
                                                const isExpanded = expandedFolders.has(folderId);
                                                
                                                return (
                                                    <div key={idx}>
                                                        <div 
                                                            className="subfolder-header"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                toggleFolder(folderId);
                                                            }}
                                                        >
                                                            <span className="expand-icon-small">
                                                                {isExpanded ? '▼' : '▶'}
                                                            </span>
                                                            <span className="folder-icon-small">📁</span>
                                                            <span className="folder-name-small">{folderName}</span>
                                                            <Badge bg="secondary" className="ms-1" style={{ fontSize: '0.6rem' }}>
                                                                {folderTree[folderPath].length}
                                                            </Badge>
                                                        </div>
                                                        
                                                        {isExpanded && (
                                                            <div className="subfolder-files">
                                                                {folderTree[folderPath].map((file, fileIdx) => (
                                                                    <div 
                                                                        key={fileIdx} 
                                                                        className={`file-item ${file.status}`}
                                                                        onClick={() => onFileSelect && onFileSelect(policy.policy_number, file)}
                                                                        title={`${file.displayName || file.name}\n${file.path || ''}\n${file.size ? formatFileSize(file.size) : ''}`}
                                                                    >
                                                                        <span className="file-status-icon">
                                                                            {file.status === 'issues' || file.status === 'missing' 
                                                                                ? getStatusIcon(file.status) 
                                                                                : getFileIcon(file.displayName || file.name)}
                                                                        </span>
                                                                        <span className="file-name">{file.displayName || file.name}</span>
                                                                        {file.size && <span className="file-size text-muted">{formatFileSize(file.size)}</span>}
                                                                        {file.issues_count > 0 && (
                                                                            <Badge bg="danger" pill className="file-badge">{file.issues_count}</Badge>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                            
                                            {/* Render root-level files */}
                                            {rootFiles.map((file, idx) => (
                                                <div 
                                                    key={`root-${idx}`} 
                                                    className={`file-item ${file.status}`}
                                                    onClick={() => onFileSelect && onFileSelect(policy.policy_number, file)}
                                                    title={`${file.name}\n${file.path || ''}\n${file.size ? formatFileSize(file.size) : ''}`}
                                                >
                                                    <span className="file-status-icon">
                                                        {file.status === 'issues' || file.status === 'missing' 
                                                            ? getStatusIcon(file.status) 
                                                            : getFileIcon(file.name)}
                                                    </span>
                                                    <span className="file-name">{file.name}</span>
                                                    {file.size && <span className="file-size text-muted">{formatFileSize(file.size)}</span>}
                                                    {file.issues_count > 0 && (
                                                        <Badge bg="danger" pill className="file-badge">{file.issues_count}</Badge>
                                                    )}
                                                </div>
                                            ))}
                                        </>
                                    );
                                })()}
                                {policy.missing_files && policy.missing_files.length > 0 && (
                                    <div className="missing-files-section">
                                        <div className="missing-header">Missing Documents:</div>
                                        {policy.missing_files.map((file, idx) => (
                                            <div key={idx} className="file-item missing">
                                                <span className="file-status-icon">✗</span>
                                                <span className="file-name text-muted">{file}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {filteredStructure.length === 0 && searchTerm && (
                <div className="text-center py-3">
                    <small className="text-muted">No results found for "{searchTerm}"</small>
                </div>
            )}
        </div>
    );
};

export default FileTree;
