import React, { useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import { Container, Spinner } from 'react-bootstrap';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import DashboardPage from './pages/DashboardPage';
import RiskAssessmentPage from './pages/RiskAssessmentPage';
import ExplorerPage from './pages/ExplorerPage';
import ConfigurationPage from './pages/ConfigurationPage';
import './App.css';
import './components/Sidebar.css';

function App() {
    const [policyRiskScores, setPolicyRiskScores] = useState([]);
    const [llmInsights, setLlmInsights] = useState(null);
    const [validationResults, setValidationResults] = useState(null);
    const [latestSummaryRecord, setLatestSummaryRecord] = useState({});
    const [previousSummaryRecord, setPreviousSummaryRecord] = useState({});
    const [allSummaryRecords, setAllSummaryRecords] = useState([]);
    const [summaryLoading, setSummaryLoading] = useState(true);
    const [summaryError, setSummaryError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);


    const handleRunWorkflow = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.post('/api/filereview');
            if (response.data) {
                setPolicyRiskScores(response.data.policies_reviewed || []);
                setLlmInsights(response.data.llm_insights || null);
                setValidationResults(response.data.validation_results || null);
            }
        } catch (err) {
            const errorMessage = err.response ? `${err.response.status} ${err.response.statusText}: ${err.response.data.detail}` : err.message;
            setError(`Failed to run workflow: ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    }, []);

    const loadLatestSummary = useCallback(async () => {
        setSummaryLoading(true);
        setSummaryError(null);
        try {
            const response = await axios.get('/api/summary/latest');
            const data = response?.data;

            if (data?.records && Array.isArray(data.records)) {
                const sortedRecords = [...data.records].sort((a, b) =>
                    new Date(b.run_date) - new Date(a.run_date)
                );
                setLatestSummaryRecord(sortedRecords[0] || {});
                setPreviousSummaryRecord(sortedRecords[1] || {});
                setAllSummaryRecords(sortedRecords.reverse());
            } else if (data?.record) {
                setLatestSummaryRecord(data.record);
                setPreviousSummaryRecord({});
                try {
                    const allResponse = await axios.get('/api/summary/total');
                    if (allResponse?.data?.records && Array.isArray(allResponse.data.records)) {
                        const sortedAll = [...allResponse.data.records].sort((a, b) =>
                            new Date(a.run_date) - new Date(b.run_date)
                        );
                        setAllSummaryRecords(sortedAll);
                        const sortedDesc = [...sortedAll].reverse();
                        setPreviousSummaryRecord(sortedDesc[1] || {});
                    }
                } catch (e) {
                    setAllSummaryRecords([]);
                }
            } else {
                setLatestSummaryRecord({});
            }
        } catch (err) {
            const errorMessage = err.response ? `${err.response.status} ${err.response.statusText}` : err.message;
            setSummaryError(`Failed to load latest summary: ${errorMessage}`);
            setLatestSummaryRecord({});
        } finally {
            setSummaryLoading(false);
        }
    }, []);

    useEffect(() => {
        handleRunWorkflow();
        loadLatestSummary();
    }, [handleRunWorkflow, loadLatestSummary]);

    return (
        <Router>
            <div className="App">
                <Header />
                <Container fluid className="p-0 app-content-shell">
                    <main className="main-content full-width app-main-panel">
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
                                element={<DashboardPage latestRecord={latestSummaryRecord} previousRecord={previousSummaryRecord} allRecords={allSummaryRecords} tilesLoading={summaryLoading} tilesError={summaryError} policyRiskScores={policyRiskScores} policiesLoading={loading} />} 
                            />
                            <Route 
                                path="/detailed-tracker" 
                                element={
                                    <RiskAssessmentPage 
                                        policyRiskScores={policyRiskScores} 
                                        validationResults={validationResults}
                                        onRefresh={handleRunWorkflow}
                                        llmInsights={llmInsights}
                                    />
                                } 
                            />
                            <Route 
                                path="/assistant" 
                                element={<ExplorerPage />} 
                            />
                            <Route 
                                path="/admin" 
                                element={<ConfigurationPage />} 
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
