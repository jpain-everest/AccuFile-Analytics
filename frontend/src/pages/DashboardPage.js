import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Row, Col, Card } from 'react-bootstrap';

// Icon components
const ShieldIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="#D31245">
        <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
    </svg>
);

const DocumentIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="#235CF4">
        <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm-1 2l5 5h-5V4zM6 20V4h6v6h6v10H6z"/>
        <path d="M8 12h8v2H8zm0 4h5v2H8z"/>
    </svg>
);

const ComplianceIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="#235CF4">
        <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-1.5 14.5l-4-4 1.41-1.41L10.5 13.67l5.59-5.59L17.5 9.5l-7 7z"/>
    </svg>
);

const PolicyIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="#007CBA">
        <path d="M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z"/>
    </svg>
);

// Mini trend line chart component
const TrendLine = ({ data, color = "#235CF4", type = "line" }) => {
    if (!data || data.length < 2) return null;
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    const width = 120;
    const height = 48;

    if (type === "bar") {
        const barWidth = width / data.length - 2;
        return (
            <svg width={width} height={height}>
                {data.map((val, i) => {
                    const barHeight = ((val - min) / range) * (height - 4) + 4;
                    const x = i * (width / data.length) + 1;
                    const y = height - barHeight;
                    return (
                        <rect
                            key={i}
                            x={x}
                            y={y}
                            width={barWidth}
                            height={barHeight}
                            fill={color}
                            rx="2"
                            opacity={0.6 + (i / data.length) * 0.4}
                        />
                    );
                })}
            </svg>
        );
    }

    const points = data.map((val, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = height - ((val - min) / range) * (height - 4) - 2;
        return `${x},${y}`;
    }).join(' ');

    return (
        <svg width={width} height={height}>
            <polyline
                fill="none"
                stroke={color}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={points}
            />
        </svg>
    );
};

const MetricTile = ({ icon, title, value, subtitle, trendData, trendType, titleColor, alertIcon }) => (
    <Card className="metric-tile h-100" style={{ minHeight: '140px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderRadius: '12px' }}>
        <Card.Body className="d-flex flex-column p-3">
            <div className="d-flex align-items-center mb-2">
                <div style={{ 
                    width: '36px', 
                    height: '36px', 
                    borderRadius: '50%', 
                    backgroundColor: titleColor ? `${titleColor}18` : '#f0f4ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: '10px'
                }}>
                    {icon}
                </div>
                <span style={{ color: titleColor || '#235CF4', fontWeight: 600, fontSize: '0.85rem' }}>{title}</span>
            </div>
            <div className="d-flex align-items-end justify-content-between mt-auto">
                <div>
                    <div className="d-flex align-items-center">
                        <span style={{ fontSize: '2.2rem', fontWeight: 300, color: '#1a1a2e', lineHeight: 1 }}>{value}</span>
                        {alertIcon && <span style={{ marginLeft: '8px', color: '#D31245' }}>{alertIcon}</span>}
                    </div>
                    {subtitle && <div style={{ fontSize: '0.8rem', color: '#6c757d', marginTop: '4px' }}>{subtitle}</div>}
                </div>
                {trendData && (
                    <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                        <TrendLine data={trendData} color={titleColor} type={trendType} />
                    </div>
                )}
            </div>
        </Card.Body>
    </Card>
);

const formatTileValue = (value) => {
    if (value === null || value === undefined || value === '') return '-';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
};

const DashboardPage = ({ latestRecord: propLatestRecord, allRecords: propAllRecords, tilesLoading, tilesError, policyRiskScores = [], policiesLoading = false }) => {
    const latestRecord = propLatestRecord || {};
    const allRecords = propAllRecords || [];
    const recentPolicies = policyRiskScores.slice(0, 10);

    const [quickInsights, setQuickInsights] = useState([]);
    const [insightsLoading, setInsightsLoading] = useState(true);

    // Load Quick Insights from /api/summary/total
    useEffect(() => {
        const loadInsights = async () => {
            try {
                setInsightsLoading(true);
                const response = await axios.get('/api/summary/total');
                const records = response?.data?.records || [];
                
                if (records.length > 0) {
                    const latest = records.reduce((a, b) => 
                        new Date(a.run_date) > new Date(b.run_date) ? a : b
                    );
                    
                    const unsignedDocs = latest['Number of Unsigned Documents'] || 0;
                    const accuracyRate = latest['File accuracy rate'] || '0%';
                    const faultyRenewable = latest['Number of policys faulty renewable statement'] || 0;
                    const filesReview = latest['Underwriting files requiring review'] || 0;

                    const premiumMissing = latest['Policy Premium Missing'] || 0;

                    setQuickInsights([
                        { icon: '✅', title: `Policy Document Accuracy ${accuracyRate}`, color: '#2E7D32', bgColor: '#E8F5E9' },
                        { icon: '📄', title: `${unsignedDocs} Unsigned Documents`, color: '#235CF4', bgColor: '#E8F0FE' },
                        { icon: '💰', title: `${premiumMissing} Policy Premium Missing`, color: '#B71C1C', bgColor: '#FFEBEE' },
                        { icon: '📈', title: `${faultyRenewable} Inaccurate Renewal Term`, color: '#7B3FE4', bgColor: '#F3E8FE' },
                        { icon: '📋', title: `${filesReview} Files Need Review`, color: '#E65100', bgColor: '#FFF3E0' }
                    ]);
                }
            } catch (e) {
                setQuickInsights([]);
            } finally {
                setInsightsLoading(false);
            }
        };
        loadInsights();
    }, []);

    // Calculate compliance improvement (vs previous run)
    const calculateComplianceChange = () => {  // eslint-disable-line no-unused-vars
        const currentRate = parseFloat(String(latestRecord['File accuracy rate'] || '0').replace('%', ''));
        
        // Sort records by date and get the second-to-last one
        if (allRecords.length >= 2) {
            const sorted = [...allRecords].sort((a, b) => new Date(a.run_date) - new Date(b.run_date));
            const previousRec = sorted[sorted.length - 2];
            const previousRate = parseFloat(String(previousRec['File accuracy rate'] || '0').replace('%', ''));
            const change = currentRate - previousRate;
            if (change > 0) return `+${change.toFixed(0)}%`;
            if (change < 0) return `${change.toFixed(0)}%`;
        }
        return `${currentRate}%`;
    };

    // Trend data for compliance (File accuracy rate over time)
    const complianceTrendData = allRecords.map(r => 
        parseFloat(String(r['File accuracy rate'] || '0').replace('%', ''))
    );

    // Alert icon for High Risk
    const AlertBadge = () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="#D31245">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
        </svg>
    );

    // Define the 4 tiles
    const tiles = [
        {
            key: 'high_risk_alerts',
            icon: <ShieldIcon />,
            title: 'High Risk Alerts',
            value: formatTileValue(latestRecord['High Risk Alerts']),
            subtitle: 'Policies exceed threshold',
            titleColor: '#D31245',
            alertIcon: latestRecord['High Risk Alerts'] > 0 ? <AlertBadge /> : null
        },
        {
            key: 'document_gaps',
            icon: <DocumentIcon />,
            title: 'Document Gaps',
            value: formatTileValue(latestRecord['Number of Unsigned Documents'] || latestRecord['Underwriting files requiring review']),
            subtitle: 'Missing required documents',
            titleColor: '#235CF4'
        },
        {
            key: 'compliance_improved',
            icon: <ComplianceIcon />,
            title: 'Compliance Improved',
            value: formatTileValue(latestRecord['File accuracy rate']),
            subtitle: 'Current file accuracy rate',
            trendData: complianceTrendData.length > 1 ? complianceTrendData : null,
            titleColor: '#235CF4'
        },
        {
            key: 'trend_detected',
            icon: <PolicyIcon />,
            title: 'Trend Detected',
            value: '',
            subtitle: 'Severity trend since past 3 days',
            trendData: (() => {
                // Get latest record per day, last 3 days
                const byDay = {};
                [...allRecords].sort((a, b) => new Date(a.run_date) - new Date(b.run_date)).forEach(r => {
                    const day = new Date(r.run_date).toISOString().slice(0, 10);
                    byDay[day] = r['High Risk Alerts'] || 0;
                });
                const days = Object.values(byDay);
                return days.slice(-3);
            })(),
            trendType: 'bar',
            titleColor: '#007CBA'
        }
    ];

    return (
        <div className="dashboard-page dashboard-page-landing" style={{ height: '100vh', overflowY: 'auto' }}>
            <div style={{ padding: '24px 24px 0' }}>
                <h2 style={{ 
                    color: '#1D457F', 
                    fontWeight: 700, 
                    fontSize: '1.1rem', 
                    textTransform: 'uppercase', 
                    letterSpacing: '1.5px',
                    marginBottom: '20px'
                }}>
                    Overview
                </h2>
            </div>
            
            <section className="dashboard-tiles-section">
                <div style={{ padding: '0 24px 24px' }}>
                    {/* Metric Tiles */}
                    <div style={{
                        border: '1px solid #C9D6E8',
                        backgroundColor: '#F3F8FF',
                        padding: '20px',
                        borderRadius: '8px',
                        boxShadow: '0 2px 8px rgba(10, 35, 66, 0.06)'
                    }}>
                        {tilesLoading ? (
                            <div className="text-center py-4">Loading latest summary...</div>
                        ) : tilesError ? (
                            <div className="text-center py-4 text-danger">{tilesError}</div>
                        ) : (
                            <Row className="g-4">
                                {tiles.map((tile) => (
                                    <Col key={tile.key} xs={12} sm={6} lg={3}>
                                        <MetricTile
                                            icon={tile.icon}
                                            title={tile.title}
                                            value={tile.value}
                                            subtitle={tile.subtitle}
                                            trendData={tile.trendData}
                                            trendType={tile.trendType}
                                            titleColor={tile.titleColor}
                                            alertIcon={tile.alertIcon}
                                        />
                                    </Col>
                                ))}
                            </Row>
                        )}
                    </div>

                    {/* Main Content: 70% Policies + 30% Quick Insights */}
                    <Row className="g-3 mt-1">
                        {/* Recent Policies Table - 70% */}
                        <Col style={{ flex: '0 0 70%', maxWidth: '70%' }}>
                            <div style={{
                                border: '1px solid #C9D6E8',
                                backgroundColor: '#FFFFFF',
                                borderRadius: '8px',
                                boxShadow: '0 2px 8px rgba(10, 35, 66, 0.06)',
                                overflow: 'hidden',
                                height: '100%'
                            }}>
                                <div style={{
                                    padding: '16px 20px',
                                    borderBottom: '1px solid #E8EEF5',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <h5 style={{ margin: 0, fontWeight: 700, fontSize: '1rem', color: '#1D457F' }}>
                                        Recent Policies
                                    </h5>
                                    <a href="/detailed-tracker" style={{ fontSize: '0.8rem', color: '#235CF4', fontWeight: 600, textDecoration: 'none' }}>
                                        View detailed tracker →
                                    </a>
                                </div>
                                {policiesLoading ? (
                                    <div className="d-flex align-items-center justify-content-center py-4">
                                        <div className="spinner-border spinner-border-sm text-primary me-2" role="status">
                                            <span className="visually-hidden">Loading...</span>
                                        </div>
                                        <span style={{ color: '#6c757d', fontSize: '0.9rem' }}>Loading policies...</span>
                                    </div>
                                ) : recentPolicies.length === 0 ? (
                                    <div className="text-center py-4 text-muted">No policy data available</div>
                                ) : (
                                    <div style={{ overflowX: 'auto' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                                            <thead>
                                                <tr style={{ backgroundColor: '#F8FAFF', borderBottom: '2px solid #E8EEF5' }}>
                                                    <th style={{ padding: '10px 12px', fontWeight: 700, color: '#1D457F', textTransform: 'uppercase', fontSize: '0.68rem', letterSpacing: '0.5px' }}>Policy Number</th>
                                                    <th style={{ padding: '10px 12px', fontWeight: 700, color: '#1D457F', textTransform: 'uppercase', fontSize: '0.68rem', letterSpacing: '0.5px' }}>Status</th>
                                                    <th style={{ padding: '10px 12px', fontWeight: 700, color: '#1D457F', textTransform: 'uppercase', fontSize: '0.68rem', letterSpacing: '0.5px' }}>UW Assigned</th>
                                                    <th style={{ padding: '10px 12px', fontWeight: 700, color: '#1D457F', textTransform: 'uppercase', fontSize: '0.68rem', letterSpacing: '0.5px' }}>Policyholder</th>
                                                    <th style={{ padding: '10px 12px', fontWeight: 700, color: '#1D457F', textTransform: 'uppercase', fontSize: '0.68rem', letterSpacing: '0.5px' }}>Severity</th>
                                                    <th style={{ padding: '10px 12px', fontWeight: 700, color: '#1D457F', textTransform: 'uppercase', fontSize: '0.68rem', letterSpacing: '0.5px' }}>Eff Date</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {recentPolicies.map((policy, index) => {
                                                    const policyNum = policy['Policy Number'] || policy['policy_number'] || '-';
                                                    const status = policy['Policy Status'] || policy['policy_status'] || '-';
                                                    const scramble = (name) => {
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
                                                    const uw = scramble(policy['UW Assigned'] || policy['uw_assigned'] || policy['Underwriter'] || '-');
                                                    const holder = scramble(policy['Policy Holder Name'] || policy['Policyholder Name'] || policy['policyholder_name'] || policy['Insured Name'] || '-');
                                                    const severity = policy['Severity'] || policy['severity'] || policy['Risk Level'] || '-';
                                                    const effDate = policy['Eff Date'] || policy['Effective Date'] || policy['effective_date'] || '-';

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

                                                    return (
                                                        <tr key={index} style={{ borderBottom: '1px solid #F0F4F8' }}>
                                                            <td style={{ padding: '10px 12px', fontWeight: 600, color: '#1a1a2e' }}>{policyNum}</td>
                                                            <td style={{ padding: '10px 12px' }}><span style={getStatusStyle(status)}>{status}</span></td>
                                                            <td style={{ padding: '10px 12px', color: '#4a5568' }}>{uw}</td>
                                                            <td style={{ padding: '10px 12px', color: '#4a5568' }}>{holder}</td>
                                                            <td style={{ padding: '10px 12px' }}><span style={getSeverityStyle(severity)}>{severity}</span></td>
                                                            <td style={{ padding: '10px 12px', color: '#4a5568' }}>{effDate}</td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </Col>

                        {/* Quick Insights - 30% */}
                        <Col style={{ flex: '0 0 30%', maxWidth: '30%' }}>
                            <Card style={{ 
                                border: '1px solid #C9D6E8',
                                borderRadius: '8px',
                                boxShadow: '0 2px 8px rgba(10, 35, 66, 0.06)',
                                height: '100%',
                                minHeight: '500px'
                            }}>
                                <Card.Body className="p-0" style={{ display: 'flex', flexDirection: 'column' }}>
                                    <div style={{ padding: '14px 18px', borderBottom: '1px solid #E8EEF5' }}>
                                        <h5 style={{ margin: 0, fontWeight: 700, fontSize: '0.95rem', color: '#1D457F' }}>
                                            Policy Document Insights
                                        </h5>
                                    </div>
                                    <div style={{ flex: 1, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                        {insightsLoading ? (
                                            <div className="d-flex align-items-center justify-content-center py-4">
                                                <div className="spinner-border spinner-border-sm text-primary me-2" role="status">
                                                    <span className="visually-hidden">Loading...</span>
                                                </div>
                                                <span style={{ color: '#6c757d', fontSize: '0.85rem' }}>Analyzing data...</span>
                                            </div>
                                        ) : (
                                            quickInsights.map((insight, index) => (
                                                <div 
                                                    key={index}
                                                    style={{
                                                        display: 'flex', alignItems: 'center',
                                                        padding: '14px 16px',
                                                        backgroundColor: insight.bgColor,
                                                        borderRadius: '10px',
                                                        transition: 'transform 0.2s'
                                                    }}
                                                >
                                                    <span style={{ marginRight: '12px', fontSize: '1.2rem' }}>{insight.icon}</span>
                                                    <span style={{ fontWeight: 700, fontSize: '0.88rem', color: insight.color }}>
                                                        {insight.title}
                                                    </span>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </div>
            </section>

        </div>
    );
};

export default DashboardPage;
