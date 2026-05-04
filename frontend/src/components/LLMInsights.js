import React, { useState } from 'react';
import { Card, Badge, Accordion, Alert, ListGroup } from 'react-bootstrap';

const LLMInsights = ({ llmInsights }) => {
    const [activeKey, setActiveKey] = useState(null);

    if (!llmInsights || Object.keys(llmInsights).length === 0) {
        return (
            <Card className="llm-insights-card dashboard-panel-fixed-height">
                <Card.Header className="card-header-centered">
                    AI Insights
                </Card.Header>
                <Card.Body className="text-center py-4">
                    <div className="empty-state">
                        <p className="text-muted mb-0">AI insights not available.</p>
                        <small className="text-muted">Run the workflow to generate AI-powered analysis.</small>
                    </div>
                </Card.Body>
            </Card>
        );
    }

    const status = llmInsights.status || {};
    const isLive = status.mode === 'live';
    const execSummary = llmInsights.executive_summary || '';
    const rootCauses = llmInsights.root_causes || [];
    const recommendations = llmInsights.recommendations || [];
    const trendAnalysis = llmInsights.trend_analysis || '';

    return (
        <Card className="llm-insights-card dashboard-panel-fixed-height">
            <Card.Header className="card-header-centered">
                AI Insights
            </Card.Header>
            <Card.Body>
                {llmInsights.error && (
                    <Alert variant="warning" className="mb-3">
                        <strong>⚠️ LLM Error:</strong> {llmInsights.error}
                    </Alert>
                )}

                {execSummary && (
                    <div className="review-summary-section mb-4">
                        <div className="review-summary-body p-4">
                            {execSummary.split('\n\n').map((section, idx) => {
                                const lines = section.split('\n');
                                const isHeading = lines[0] && (lines[0].includes('SUMMARY') || lines[0].includes('Key Findings') || lines[0].includes('Recommendations'));

                                if (isHeading) {
                                    return (
                                        <div key={idx} className="summary-section">
                                            <h6 className="section-heading">{lines[0]}</h6>
                                            {lines.slice(1).map((line, lineIdx) => (
                                                line.trim() && (
                                                    <p key={lineIdx} className="summary-text">
                                                        {line.startsWith('•') || line.startsWith('-') || /^\d+\./.test(line) ? (
                                                            <span className="bullet-item">{line}</span>
                                                        ) : (
                                                            line
                                                        )}
                                                    </p>
                                                )
                                            ))}
                                        </div>
                                    );
                                } else {
                                    return lines.map((line, lineIdx) => (
                                        line.trim() && (
                                            <p key={`${idx}-${lineIdx}`} className="summary-text">
                                                {line}
                                            </p>
                                        )
                                    ));
                                }
                            })}
                        </div>
                    </div>
                )}

                <Accordion activeKey={activeKey} onSelect={(k) => setActiveKey(k)}>
                    {rootCauses.length > 0 && (
                        <Accordion.Item eventKey="0" className="mb-2">
                            <Accordion.Header>
                                <strong>🔍 Root Cause Analysis</strong>
                                <Badge bg="danger" className="ms-2">{rootCauses.length}</Badge>
                            </Accordion.Header>
                            <Accordion.Body>
                                <ListGroup variant="flush">
                                    {rootCauses.map((cause, idx) => (
                                        <ListGroup.Item key={idx} className="border-0 ps-0">
                                            <span className="list-bullet">•</span>
                                            {cause}
                                        </ListGroup.Item>
                                    ))}
                                </ListGroup>
                            </Accordion.Body>
                        </Accordion.Item>
                    )}

                    {recommendations.length > 0 && (
                        <Accordion.Item eventKey="1" className="mb-2">
                            <Accordion.Header>
                                <strong>💡 AI Recommendations</strong>
                                <Badge bg="success" className="ms-2">{recommendations.length}</Badge>
                            </Accordion.Header>
                            <Accordion.Body>
                                <ListGroup variant="flush">
                                    {recommendations.map((rec, idx) => (
                                        <ListGroup.Item key={idx} className="border-0 ps-0">
                                            <span className="list-number">{idx + 1}.</span>
                                            {rec}
                                        </ListGroup.Item>
                                    ))}
                                </ListGroup>
                            </Accordion.Body>
                        </Accordion.Item>
                    )}

                    {trendAnalysis && (
                        <Accordion.Item eventKey="2" className="mb-2">
                            <Accordion.Header>
                                <strong>📊 Trend Analysis</strong>
                            </Accordion.Header>
                            <Accordion.Body>
                                <p className="mb-0">{trendAnalysis}</p>
                            </Accordion.Body>
                        </Accordion.Item>
                    )}
                </Accordion>

                {!isLive && (
                    <Alert variant="info" className="mt-3 mb-0">
                        <small>
                            <strong>ℹ️ Simulated Mode:</strong> Configure OpenAI API key in environment
                            variables to enable live AI analysis.
                        </small>
                    </Alert>
                )}
            </Card.Body>
        </Card>
    );
};

export default LLMInsights;
