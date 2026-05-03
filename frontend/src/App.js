import React, { useState, useCallback } from 'react';
import axios from 'axios';
import { Container, Row, Col, Spinner } from 'react-bootstrap';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import './App.css';
import './components/Sidebar.css';

function App() {
    const [summary, setSummary] = useState(null);
    const [issues, setIssues] = useState([]);
    const [policyRiskScores, setPolicyRiskScores] = useState([]);
    const [llmInsights, setLlmInsights] = useState(null);
    const [validationResults, setValidationResults] = useState(null);
    const [fileStructure, setFileStructure] = useState([]);
    const [selectedFile, setSelectedFile] = useState(null);
    const [logs, setLogs] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleFileSelect = useCallback((policyNumber, file) => {
        setSelectedFile({ policyNumber, file });
        console.log('Selected file:', policyNumber, file);
        
        // Open the file in a new tab
        const fileName = file.displayName || file.name;
        const filePath = file.name; // This contains the relative path with forward slashes
        const fileUrl = `http://localhost:5000/api/files/${policyNumber}/${filePath}`;
        
        window.open(fileUrl, '_blank');
    }, []);

    const handleRunWorkflow = useCallback(async () => {
        setLoading(true);
        setError(null);
        setLogs('Starting workflow...');
        try {
            const response = await axios.post('/api/run-workflow');
            if (response.data) {
                setSummary(response.data.summary);
                setIssues(response.data.issues);
                setPolicyRiskScores(response.data.policy_risk_scores || []);
                setLlmInsights(response.data.llm_insights || null);
                setValidationResults(response.data.validation_results || null);
                setFileStructure(response.data.file_structure || []);
                setLogs(response.data.logs);
            }
        } catch (err) {
            const errorMessage = err.response ? `${err.response.status} ${err.response.statusText}: ${err.response.data.detail}` : err.message;
            setError(`Failed to run workflow: ${errorMessage}`);
            setLogs(prevLogs => `${prevLogs}\n\nError:\n${errorMessage}`);
        } finally {
            setLoading(false);
        }
    }, []);

    return (
        <div className="App">
            <Header />
            <Container fluid>
                <Row>
                    <Col md={3} className="sidebar-wrapper">
                        <Sidebar 
                            onRunWorkflow={handleRunWorkflow} 
                            fileStructure={fileStructure}
                            onFileSelect={handleFileSelect}
                        />
                    </Col>
                    <Col md={9} className="main-content">
                        {loading && (
                            <div className="text-center">
                                <Spinner animation="border" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                </Spinner>
                                <p>Processing... this may take a moment.</p>
                            </div>
                        )}
                        {error && <div className="alert alert-danger">{error}</div>}
                        <Dashboard 
                            summary={summary} 
                            issues={issues} 
                            logs={logs} 
                            policyRiskScores={policyRiskScores} 
                            llmInsights={llmInsights}
                            validationResults={validationResults}
                        />
                    </Col>
                </Row>
            </Container>
        </div>
    );
}

export default App;
