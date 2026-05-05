import React, { useState } from 'react';
import { Row, Col, Card, Form, Button, Badge } from 'react-bootstrap';

const ExplorerPage = () => {
    const [chatInput, setChatInput] = useState('');
    const [chatMessages, setChatMessages] = useState([
        {
            type: 'assistant',
            content: 'Hello! I\'m your AI Analytics Assistant. I can help you analyze underwriting data, identify trends, and answer questions about your policy portfolio. Try asking me something like:\n\n• "What are the top risk factors across policies?"\n• "Show me compliance trends for the last quarter"\n• "Which policies have the highest missing document rate?"',
            timestamp: new Date()
        }
    ]);
    const [isTyping, setIsTyping] = useState(false);

    const quickQueries = [
        "Top 5 high-risk policies",
        "Missing documents summary",
        "Compliance rate by policy type",
        "Risk trend analysis"
    ];

    const handleSendMessage = () => {
        if (!chatInput.trim()) return;

        // Add user message
        const userMessage = {
            type: 'user',
            content: chatInput,
            timestamp: new Date()
        };
        setChatMessages(prev => [...prev, userMessage]);
        setChatInput('');
        setIsTyping(true);

        // Simulate AI response
        setTimeout(() => {
            const aiResponse = {
                type: 'assistant',
                content: `Based on your query "${chatInput}", here's what I found:\n\n📊 **Analysis Results:**\n• Analyzed 15 policies in your portfolio\n• Identified 3 policies with elevated risk scores\n• Found 2 compliance gaps requiring attention\n\n💡 **Recommendation:** Focus on policies AH-2024-001 and AH-2024-003 which have pending document reviews.\n\nWould you like me to provide more details on any specific policy?`,
                timestamp: new Date()
            };
            setChatMessages(prev => [...prev, aiResponse]);
            setIsTyping(false);
        }, 1500);
    };

    const handleQuickQuery = (query) => {
        setChatInput(query);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <div className="explorer-page page-container">
            <div className="dashboard-header mb-2">
                <p className="dashboard-subtitle">AI-Powered Analytics & Insights</p>
            </div>

            {/* Recent Insights Tiles */}
            <Row className="mb-3 g-3">
                <Col xs={6} sm={3}>
                    <Card className="analytics-tile h-100" style={{ borderLeft: '4px solid #dc3545' }}>
                        <Card.Body className="text-center py-3">
                            <div className="analytics-icon">🔴</div>
                            <div className="analytics-value">3</div>
                            <div className="analytics-label">High Risk Alerts</div>
                            <small className="text-muted">Policies exceed threshold</small>
                        </Card.Body>
                    </Card>
                </Col>
                <Col xs={6} sm={3}>
                    <Card className="analytics-tile h-100" style={{ borderLeft: '4px solid #fd7e14' }}>
                        <Card.Body className="text-center py-3">
                            <div className="analytics-icon">📋</div>
                            <div className="analytics-value">5</div>
                            <div className="analytics-label">Document Gaps</div>
                            <small className="text-muted">Missing required docs</small>
                        </Card.Body>
                    </Card>
                </Col>
                <Col xs={6} sm={3}>
                    <Card className="analytics-tile h-100" style={{ borderLeft: '4px solid #198754' }}>
                        <Card.Body className="text-center py-3">
                            <div className="analytics-icon">✅</div>
                            <div className="analytics-value">+12%</div>
                            <div className="analytics-label">Compliance Improved</div>
                            <small className="text-muted">Increase this week</small>
                        </Card.Body>
                    </Card>
                </Col>
                <Col xs={6} sm={3}>
                    <Card className="analytics-tile h-100" style={{ borderLeft: '4px solid #235CF4' }}>
                        <Card.Body className="text-center py-3">
                            <div className="analytics-icon">📊</div>
                            <div className="analytics-value">↓</div>
                            <div className="analytics-label">Trend Detected</div>
                            <small className="text-muted">Risk scores declining</small>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <Row className="g-3">
                {/* AI Chat Interface */}
                <Col lg={8}>
                    <Card className="chat-card h-100">
                        <Card.Header className="chat-header">
                            <span className="chat-title">🤖 AI Analytics Assistant</span>
                            <Badge bg="success" className="ms-2">Online</Badge>
                        </Card.Header>
                        <Card.Body className="chat-body">
                            <div className="chat-messages">
                                {chatMessages.map((msg, index) => (
                                    <div key={index} className={`chat-message ${msg.type}`}>
                                        <div className="message-avatar">
                                            {msg.type === 'assistant' ? '🤖' : '👤'}
                                        </div>
                                        <div className="message-content">
                                            <div className="message-text" style={{ whiteSpace: 'pre-wrap' }}>
                                                {msg.content}
                                            </div>
                                            <div className="message-time">
                                                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {isTyping && (
                                    <div className="chat-message assistant">
                                        <div className="message-avatar">🤖</div>
                                        <div className="message-content">
                                            <div className="typing-indicator">
                                                <span></span><span></span><span></span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </Card.Body>
                        <Card.Footer className="chat-footer">
                            <div style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '12px',
                                background: '#f8f9fa',
                                borderRadius: '24px',
                                padding: '4px 4px 4px 16px',
                                border: '1px solid #e0e0e0'
                            }}>
                                <Form.Control
                                    as="textarea"
                                    rows={1}
                                    placeholder="Ask me anything about your underwriting data..."
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    style={{
                                        flex: 1,
                                        border: 'none',
                                        background: 'transparent',
                                        resize: 'none',
                                        padding: '10px 0',
                                        fontSize: '0.95rem',
                                        outline: 'none',
                                        boxShadow: 'none'
                                    }}
                                />
                                <button 
                                    onClick={handleSendMessage}
                                    type="button"
                                    style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '50%',
                                        border: 'none',
                                        background: '#235CF4',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0,
                                        transition: 'all 0.3s ease'
                                    }}
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                </button>
                            </div>
                        </Card.Footer>
                    </Card>
                </Col>

                {/* Quick Insights Panel */}
                <Col lg={4}>
                    <Card className="insights-card mb-3">
                        <Card.Header className="insights-header">
                            ⚡ Quick Queries
                        </Card.Header>
                        <Card.Body className="p-2">
                            <div className="quick-queries">
                                {quickQueries.map((query, index) => (
                                    <Button
                                        key={index}
                                        variant="outline-primary"
                                        size="sm"
                                        className="quick-query-btn mb-2 me-2"
                                        onClick={() => handleQuickQuery(query)}
                                    >
                                        {query}
                                    </Button>
                                ))}
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default ExplorerPage;
