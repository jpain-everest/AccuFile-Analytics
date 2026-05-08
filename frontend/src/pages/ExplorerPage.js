import React, { useState } from 'react';

const ExplorerPage = () => {
    const [iframeLoaded, setIframeLoaded] = useState(false);
    const sonarUrl = 'https://accufile-chatbot.azurewebsites.net/';

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 60px)', padding: '0' }}>
            <div style={{ flex: 1, position: 'relative' }}>
                {!iframeLoaded && (
                    <div style={{
                        position: 'absolute', inset: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: '#F8FAFF', color: '#2F4A6D', zIndex: 2, fontWeight: 600, fontSize: '1rem'
                    }}>
                        Loading AI Assistant...
                    </div>
                )}
                <iframe
                    title="AI Assistant"
                    src={sonarUrl}
                    style={{ width: '100%', height: '100%', border: 'none' }}
                    onLoad={() => setIframeLoaded(true)}
                    referrerPolicy="strict-origin-when-cross-origin"
                />
            </div>
        </div>
    );
};

export default ExplorerPage;
