'use client';
import Script from 'next/script';
import { useEffect } from 'react';

export default function Home() {
  useEffect(() => {
    // If the script is already loaded and defined, initialize
    if (typeof window !== 'undefined' && typeof (window as any).initializeApplication === 'function') {
      (window as any).initializeApplication();
    }
  }, []);

  return (
    <>
      
  <header className="app-header">
    <div className="app-logo">
      <button className="mobile-sidebar-toggle" id="sidebarToggleBtn" aria-label="Toggle history sidebar">☰</button>
      <img className="app-logo-icon" src="https://raw.githubusercontent.com/ferdysetiawan/ferdysetiawan.github.io/refs/heads/main/public/media/images/icon.png" alt="ANTARAPI Logo" />
      <span className="app-logo-text">ANTARAPI</span>
    </div>
    <div className="header-actions">
      <div className="connection-badge" id="connectionBadge" title="Checking connection...">
        <span className="connection-dot" id="connectionDot"></span>
        <span id="connectionLabel">Checking...</span>
      </div>
      <button className="theme-toggle" id="themeToggleBtn" aria-label="Toggle theme">
        <span className="theme-toggle-icon" id="themeIcon">☀</span>
        <span id="themeLabel">Light</span>
      </button>
    </div>
  </header>

  <div className="app-main">
    <div className="sidebar-overlay" id="sidebarOverlay"></div>
    <aside className="sidebar" id="sidebar">
      <div className="sidebar-header">
        <span className="sidebar-title">History</span>
        <button className="sidebar-clear-btn" id="clearHistoryBtn">Clear</button>
      </div>
      <div className="history-list" id="historyList">
        <div className="history-empty" id="historyEmpty">No requests yet</div>
      </div>
    </aside>

    <main className="workspace">
      <div className="url-bar">
        <select className="method-select" id="methodSelect">
          <option value="GET">GET</option>
          <option value="POST">POST</option>
          <option value="PUT">PUT</option>
          <option value="PATCH">PATCH</option>
          <option value="DELETE">DELETE</option>
          <option value="OPTIONS">OPTIONS</option>
          <option value="HEAD">HEAD</option>
        </select>
        <input className="url-input" type="text" id="urlInput" placeholder="Enter request URL" spellCheck="false" />
        <button className="send-btn" id="sendBtn">Send</button>
      </div>

      <div className="error-banner" id="errorBanner">
        <span id="errorBannerText"></span>
        <button className="error-banner-close" id="errorBannerClose">✕</button>
      </div>

      <div className="panels-container">
        <div className="panel panel-request">
          <div className="panel-tabs">
            <button className="panel-tab active" data-target="tab-params">Params <span className="tab-badge" id="paramsBadge">0</span></button>
            <button className="panel-tab" data-target="tab-headers">Headers <span className="tab-badge" id="headersBadge">0</span></button>
            <button className="panel-tab" data-target="tab-auth">Auth</button>
            <button className="panel-tab" data-target="tab-body">Body</button>
          </div>
          <div className="panel-body">
            <div className="tab-content active" id="tab-params">
              <table className="kv-table" id="paramsTable">
                <thead>
                  <tr>
                    <th className="kv-checkbox"></th>
                    <th>Key</th>
                    <th>Value</th>
                    <th>Description</th>
                    <th className="kv-row-delete"></th>
                  </tr>
                </thead>
                <tbody id="paramsTableBody"></tbody>
              </table>
              <button className="kv-add-btn" id="addParamBtn">+ Add Parameter</button>
            </div>

            <div className="tab-content" id="tab-headers">
              <table className="kv-table" id="headersTable">
                <thead>
                  <tr>
                    <th className="kv-checkbox"></th>
                    <th>Key</th>
                    <th>Value</th>
                    <th>Description</th>
                    <th className="kv-row-delete"></th>
                  </tr>
                </thead>
                <tbody id="headersTableBody"></tbody>
              </table>
              <button className="kv-add-btn" id="addHeaderBtn">+ Add Header</button>
            </div>

            <div className="tab-content" id="tab-auth">
              <div className="auth-section">
                <div className="auth-type-selector">
                  <button className="auth-type-btn active" data-auth="none">None</button>
                  <button className="auth-type-btn" data-auth="bearer">Bearer Token</button>
                  <button className="auth-type-btn" data-auth="basic">Basic Auth</button>
                  <button className="auth-type-btn" data-auth="apikey">API Key</button>
                </div>
                <div className="auth-fields" id="authFields"></div>
              </div>
            </div>

            <div className="tab-content" id="tab-body">
              <div className="body-type-selector">
                <button className="body-type-btn active" data-body="none">None</button>
                <button className="body-type-btn" data-body="json">JSON</button>
                <button className="body-type-btn" data-body="text">Text</button>
                <button className="body-type-btn" data-body="xml">XML</button>
                <button className="body-type-btn" data-body="form">Form URL Encoded</button>
              </div>
              <div id="bodyEditorContainer"></div>
            </div>
          </div>
        </div>

        <div className="panel panel-response">
          <div className="panel-tabs">
            <button className="panel-tab active" data-target="tab-response-body">Body</button>
            <button className="panel-tab" data-target="tab-response-headers">Headers <span className="tab-badge" id="responseHeadersBadge">0</span></button>
            <div className="response-meta" id="responseMeta" style={{ display: 'none' }}>
              <span className="response-meta-item" id="responseStatus"></span>
              <span className="response-meta-item status-info" id="responseTime"></span>
              <span className="response-meta-item status-info" id="responseSize"></span>
            </div>
          </div>
          <div className="response-meta-mobile" id="responseMetaMobile" style={{ display: 'none' }}>
            <span className="response-meta-item" id="responseStatusMobile"></span>
            <span className="response-meta-item status-info" id="responseTimeMobile"></span>
            <span className="response-meta-item status-info" id="responseSizeMobile"></span>
          </div>
          <div className="response-toolbar" id="responseToolbar" style={{ display: 'none' }}>
            <button className="response-toolbar-btn active" id="prettyBtn">Pretty</button>
            <button className="response-toolbar-btn" id="rawBtn">Raw</button>
            <button className="response-toolbar-btn" id="copyResponseBtn">Copy</button>
          </div>
          <div className="panel-body" id="responsePanelBody">
            <div className="tab-content active" id="tab-response-body">
              <div className="response-empty" id="responseEmpty">

                <div className="response-empty-title">Enter a URL and click Send</div>
                <div className="response-empty-desc">Response will appear here</div>
              </div>
              <div className="loading-indicator" id="loadingIndicator">
                <div className="spinner"></div>
                <span>Sending request...</span>
              </div>
              <div className="response-body-content" id="responseBodyContent" style={{ display: 'none' }}></div>
            </div>
            <div className="tab-content" id="tab-response-headers">
              <table className="response-headers-table" id="responseHeadersTable">
                <thead>
                  <tr>
                    <th>Header</th>
                    <th>Value</th>
                  </tr>
                </thead>
                <tbody id="responseHeadersBody"></tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>

  <div className="toast" id="toast"></div>

  
      <Script src="/legacy-script.js" strategy="afterInteractive" />
    </>
  );
}
