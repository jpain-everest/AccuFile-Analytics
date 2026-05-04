import React, { useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import { Container, Spinner } from 'react-bootstrap';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import DashboardPage from './pages/DashboardPage';
import ExplorerPage from './pages/ExplorerPage';
import './App.css';
import './components/Sidebar.css';

function App() {
    const [summary, setSummary] = useState(null);
    const [issues, setIssues] = useState([]);
    const [policyRiskScores, setPolicyRiskScores] = useState([]);
    const [llmInsights, setLlmInsights] = useState(null);
    const [validationResults, setValidationResults] = useState(null);
    const [fileStructure, setFileStructure] = useState([]);
    const [logs, setLogs] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleFileSelect = useCallback((policyNumber, file) => {
        const fileUrl = `http://localhost:8001/api/files/${policyNumber}/${file.name}`;
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

    useEffect(() => {
        handleRunWorkflow();
    }, [handleRunWorkflow]);

    return (
        <Router>
            <div className="App">
                <Header />
                <Container fluid className="p-0">
                    <main className="main-content full-width">
                        {loading && (
                            <div className="text-center py-5">
                                <Spinner animation="border" variant="primary" />
                                <p className="mt-3 text-uppercase fw-bold" style={{ letterSpacing: '1px' }}>
                                    Analyzing Files...
                                </p>
                            </div>
                        )}
                        {error && <Container><div className="alert alert-danger my-4">{error}</div></Container>}
                        
                        <Routes>
                            <Route 
                                path="/" 
                                element={<DashboardPage summary={summary} issues={issues} />} 
                            />
                            <Route 
                                path="/explorer" 
                                element={
                                    <ExplorerPage 
                                        policyRiskScores={policyRiskScores} 
                                        validationResults={validationResults}
                                        llmInsights={llmInsights}
                                        logs={logs}
                                        fileStructure={fileStructure}
                                        onFileSelect={handleFileSelect}
                                    />
                                } 
                            />
                            <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                    </main>
                </Container>
            </div>
        </Router>
    );
}

export default App;
