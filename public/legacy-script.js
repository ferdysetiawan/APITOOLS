const STATE = {
      currentAuthType: 'none',
      currentBodyType: 'none',
      responseRawText: '',
      responseIsJson: false,
      responsePrettyMode: true,
      history: [],
      isLoading: false,
      proxyAvailable: false,
      proxyBaseUrl: ''
    };

    let ELEMENTS = {};

    function initElements() {
      ELEMENTS = {
      methodSelect: document.getElementById('methodSelect'),
      urlInput: document.getElementById('urlInput'),
      sendBtn: document.getElementById('sendBtn'),
      paramsTableBody: document.getElementById('paramsTableBody'),
      headersTableBody: document.getElementById('headersTableBody'),
      authFields: document.getElementById('authFields'),
      bodyEditorContainer: document.getElementById('bodyEditorContainer'),
      responseBodyContent: document.getElementById('responseBodyContent'),
      responseEmpty: document.getElementById('responseEmpty'),
      loadingIndicator: document.getElementById('loadingIndicator'),
      responseMeta: document.getElementById('responseMeta'),
      responseMetaMobile: document.getElementById('responseMetaMobile'),
      responseStatus: document.getElementById('responseStatus'),
      responseStatusMobile: document.getElementById('responseStatusMobile'),
      responseTime: document.getElementById('responseTime'),
      responseTimeMobile: document.getElementById('responseTimeMobile'),
      responseSize: document.getElementById('responseSize'),
      responseSizeMobile: document.getElementById('responseSizeMobile'),
      responseHeadersBody: document.getElementById('responseHeadersBody'),
      responseHeadersBadge: document.getElementById('responseHeadersBadge'),
      responseToolbar: document.getElementById('responseToolbar'),
      paramsBadge: document.getElementById('paramsBadge'),
      headersBadge: document.getElementById('headersBadge'),
      historyList: document.getElementById('historyList'),
      historyEmpty: document.getElementById('historyEmpty'),
      errorBanner: document.getElementById('errorBanner'),
      errorBannerText: document.getElementById('errorBannerText'),
      sidebar: document.getElementById('sidebar'),
      sidebarOverlay: document.getElementById('sidebarOverlay'),
      toast: document.getElementById('toast')
    };
    }

    function initializeApplication() {
      initElements();
      setupMethodSelectColor();
      setupTabNavigation();
      setupAuthTypeSelector();
      setupBodyTypeSelector();
      setupThemeToggle();
      setupSidebar();
      setupKeyboardShortcuts();
      addKvRow(ELEMENTS.paramsTableBody);
      addKvRow(ELEMENTS.headersTableBody);
      loadHistoryFromStorage();
      renderHistoryList();
      detectProxyServer();

      ELEMENTS.sendBtn.addEventListener('click', executeRequest);
      document.getElementById('addParamBtn').addEventListener('click', function() { addKvRow(ELEMENTS.paramsTableBody); });
      document.getElementById('addHeaderBtn').addEventListener('click', function() { addKvRow(ELEMENTS.headersTableBody); });
      document.getElementById('errorBannerClose').addEventListener('click', hideErrorBanner);
      document.getElementById('prettyBtn').addEventListener('click', function() { switchResponseView(true); });
      document.getElementById('rawBtn').addEventListener('click', function() { switchResponseView(false); });
      document.getElementById('copyResponseBtn').addEventListener('click', copyResponseToClipboard);
      document.getElementById('clearHistoryBtn').addEventListener('click', clearHistory);
    }

    function detectProxyServer() {
      var badge = document.getElementById('connectionBadge');
      var label = document.getElementById('connectionLabel');
      var origin = window.location.origin;

      if (window.location.protocol === 'file:') {
        setConnectionDirect();
        return;
      }

      fetch(origin + '/health', { method: 'GET' })
        .then(function(res) { return res.json(); })
        .then(function(data) {
          if (data && data.proxy === true) {
            STATE.proxyAvailable = true;
            STATE.proxyBaseUrl = origin;
            setConnectionProxy();
          } else {
            setConnectionDirect();
          }
        })
        .catch(function() {
          setConnectionDirect();
        });
    }

    function setConnectionProxy() {
      var badge = document.getElementById('connectionBadge');
      var label = document.getElementById('connectionLabel');
      badge.className = 'connection-badge proxy';
      badge.title = 'Requests are sent through the proxy server — no CORS restrictions, full response headers';
      label.textContent = 'Proxy';
    }

    function setConnectionDirect() {
      var badge = document.getElementById('connectionBadge');
      var label = document.getElementById('connectionLabel');
      STATE.proxyAvailable = false;
      badge.className = 'connection-badge direct';
      badge.title = 'Requests are sent directly from the browser — may be blocked by CORS';
      label.textContent = 'Direct';
    }

    function setupMethodSelectColor() {
      var select = ELEMENTS.methodSelect;
      function updateColor() {
        var method = select.value.toLowerCase();
        select.style.color = 'var(--color-method-' + method + ')';
      }
      select.addEventListener('change', updateColor);
      updateColor();
    }

    function setupTabNavigation() {
      document.querySelectorAll('.panel-tabs').forEach(function(tabBar) {
        tabBar.querySelectorAll('.panel-tab[data-target]').forEach(function(tab) {
          tab.addEventListener('click', function() {
            var panel = tabBar.closest('.panel');
            var panelBody = panel.querySelector('.panel-body');
            tabBar.querySelectorAll('.panel-tab[data-target]').forEach(function(t) { t.classList.remove('active'); });
            tab.classList.add('active');
            panelBody.querySelectorAll('.tab-content').forEach(function(c) { c.classList.remove('active'); });
            document.getElementById(tab.dataset.target).classList.add('active');
          });
        });
      });
    }

    function setupAuthTypeSelector() {
      document.querySelectorAll('.auth-type-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
          document.querySelectorAll('.auth-type-btn').forEach(function(b) { b.classList.remove('active'); });
          btn.classList.add('active');
          STATE.currentAuthType = btn.dataset.auth;
          renderAuthFields();
        });
      });
    }

    function renderAuthFields() {
      var container = ELEMENTS.authFields;
      container.innerHTML = '';
      if (STATE.currentAuthType === 'bearer') {
        container.innerHTML =
          '<div class="auth-field-group">' +
            '<div class="auth-field-label">Token</div>' +
            '<input class="auth-field-input" type="text" id="authBearerToken" placeholder="Enter bearer token" spellcheck="false">' +
          '</div>';
      } else if (STATE.currentAuthType === 'basic') {
        container.innerHTML =
          '<div class="auth-field-row">' +
            '<div class="auth-field-group">' +
              '<div class="auth-field-label">Username</div>' +
              '<input class="auth-field-input" type="text" id="authBasicUser" placeholder="Username" spellcheck="false">' +
            '</div>' +
            '<div class="auth-field-group">' +
              '<div class="auth-field-label">Password</div>' +
              '<input class="auth-field-input" type="password" id="authBasicPass" placeholder="Password">' +
            '</div>' +
          '</div>';
      } else if (STATE.currentAuthType === 'apikey') {
        container.innerHTML =
          '<div class="auth-field-row">' +
            '<div class="auth-field-group">' +
              '<div class="auth-field-label">Key</div>' +
              '<input class="auth-field-input" type="text" id="authApiKeyName" placeholder="X-API-Key" spellcheck="false">' +
            '</div>' +
            '<div class="auth-field-group">' +
              '<div class="auth-field-label">Value</div>' +
              '<input class="auth-field-input" type="text" id="authApiKeyValue" placeholder="Enter API key" spellcheck="false">' +
            '</div>' +
          '</div>' +
          '<div class="auth-field-group">' +
            '<div class="auth-field-label">Add to</div>' +
            '<div class="auth-type-selector">' +
              '<button class="auth-type-btn active" data-apikey-location="header">Header</button>' +
              '<button class="auth-type-btn" data-apikey-location="query">Query Params</button>' +
            '</div>' +
          '</div>';
        container.querySelectorAll('[data-apikey-location]').forEach(function(btn) {
          btn.addEventListener('click', function() {
            container.querySelectorAll('[data-apikey-location]').forEach(function(b) { b.classList.remove('active'); });
            btn.classList.add('active');
          });
        });
      }
    }

    function setupBodyTypeSelector() {
      document.querySelectorAll('.body-type-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
          document.querySelectorAll('.body-type-btn').forEach(function(b) { b.classList.remove('active'); });
          btn.classList.add('active');
          STATE.currentBodyType = btn.dataset.body;
          renderBodyEditor();
        });
      });
    }

    function renderBodyEditor() {
      var container = ELEMENTS.bodyEditorContainer;
      container.innerHTML = '';
      if (STATE.currentBodyType === 'none') return;

      var placeholderMap = {
        json: '{\n  "key": "value"\n}',
        text: 'Enter plain text body',
        xml: '<?xml version="1.0"?>\n<root>\n  <element>value</element>\n</root>',
        form: 'key1=value1&key2=value2'
      };

      container.innerHTML = '<textarea class="body-editor" id="bodyEditor" placeholder="' +
        placeholderMap[STATE.currentBodyType] + '" spellcheck="false"></textarea>';
    }

    function addKvRow(tbody) {
      var tr = document.createElement('tr');
      tr.innerHTML =
        '<td class="kv-checkbox"><input type="checkbox" checked></td>' +
        '<td><input type="text" placeholder="Key" spellcheck="false"></td>' +
        '<td><input type="text" placeholder="Value" spellcheck="false"></td>' +
        '<td><input type="text" placeholder="Description" spellcheck="false"></td>' +
        '<td class="kv-row-delete"><button class="kv-delete-btn">✕</button></td>';

      tr.querySelector('.kv-delete-btn').addEventListener('click', function() {
        if (tbody.children.length > 1) {
          tr.remove();
          updateKvBadge(tbody);
        }
      });

      tr.querySelectorAll('input[type="text"]').forEach(function(input) {
        input.addEventListener('input', function() { updateKvBadge(tbody); });
      });

      tbody.appendChild(tr);
      updateKvBadge(tbody);
    }

    function updateKvBadge(tbody) {
      var count = 0;
      tbody.querySelectorAll('tr').forEach(function(row) {
        var keyInput = row.querySelectorAll('input[type="text"]')[0];
        var checkbox = row.querySelector('input[type="checkbox"]');
        if (keyInput && keyInput.value.trim() && checkbox && checkbox.checked) count++;
      });

      if (tbody.id === 'paramsTableBody') {
        ELEMENTS.paramsBadge.textContent = count;
      } else if (tbody.id === 'headersTableBody') {
        ELEMENTS.headersBadge.textContent = count;
      }
    }

    function collectKvPairs(tbody) {
      var pairs = [];
      tbody.querySelectorAll('tr').forEach(function(row) {
        var checkbox = row.querySelector('input[type="checkbox"]');
        var inputs = row.querySelectorAll('input[type="text"]');
        if (checkbox && checkbox.checked && inputs[0] && inputs[0].value.trim()) {
          pairs.push({ key: inputs[0].value.trim(), value: inputs[1] ? inputs[1].value : '' });
        }
      });
      return pairs;
    }

    function buildRequestUrl() {
      var rawUrl = ELEMENTS.urlInput.value.trim();
      if (!rawUrl) return '';

      var params = collectKvPairs(ELEMENTS.paramsTableBody);
      if (params.length === 0) return rawUrl;

      var separator = rawUrl.indexOf('?') !== -1 ? '&' : '?';
      var queryString = params.map(function(p) {
        return encodeURIComponent(p.key) + '=' + encodeURIComponent(p.value);
      }).join('&');

      return rawUrl + separator + queryString;
    }

    function buildRequestHeaders() {
      var headers = {};
      var headerPairs = collectKvPairs(ELEMENTS.headersTableBody);
      headerPairs.forEach(function(pair) {
        headers[pair.key] = pair.value;
      });

      if (STATE.currentAuthType === 'bearer') {
        var tokenEl = document.getElementById('authBearerToken');
        if (tokenEl && tokenEl.value.trim()) {
          headers['Authorization'] = 'Bearer ' + tokenEl.value.trim();
        }
      } else if (STATE.currentAuthType === 'basic') {
        var userEl = document.getElementById('authBasicUser');
        var passEl = document.getElementById('authBasicPass');
        if (userEl && passEl) {
          headers['Authorization'] = 'Basic ' + btoa(userEl.value + ':' + passEl.value);
        }
      } else if (STATE.currentAuthType === 'apikey') {
        var locationBtn = document.querySelector('[data-apikey-location].active');
        var location = locationBtn ? locationBtn.dataset.apikeyLocation : 'header';
        if (location === 'header') {
          var keyNameEl = document.getElementById('authApiKeyName');
          var keyValueEl = document.getElementById('authApiKeyValue');
          if (keyNameEl && keyValueEl && keyNameEl.value.trim()) {
            headers[keyNameEl.value.trim()] = keyValueEl.value;
          }
        }
      }

      if (STATE.currentBodyType === 'json' && !headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
      } else if (STATE.currentBodyType === 'xml' && !headers['Content-Type']) {
        headers['Content-Type'] = 'application/xml';
      } else if (STATE.currentBodyType === 'form' && !headers['Content-Type']) {
        headers['Content-Type'] = 'application/x-www-form-urlencoded';
      } else if (STATE.currentBodyType === 'text' && !headers['Content-Type']) {
        headers['Content-Type'] = 'text/plain';
      }

      return headers;
    }

    function buildRequestBody() {
      var method = ELEMENTS.methodSelect.value;
      if (method === 'GET' || method === 'HEAD') return null;
      if (STATE.currentBodyType === 'none') return null;

      var editorEl = document.getElementById('bodyEditor');
      if (!editorEl) return null;
      return editorEl.value || null;
    }

    function buildFinalUrl() {
      var url = buildRequestUrl();
      if (STATE.currentAuthType === 'apikey') {
        var locationBtn = document.querySelector('[data-apikey-location].active');
        var location = locationBtn ? locationBtn.dataset.apikeyLocation : 'header';
        if (location === 'query') {
          var keyNameEl = document.getElementById('authApiKeyName');
          var keyValueEl = document.getElementById('authApiKeyValue');
          if (keyNameEl && keyValueEl && keyNameEl.value.trim()) {
            var sep = url.indexOf('?') !== -1 ? '&' : '?';
            url += sep + encodeURIComponent(keyNameEl.value.trim()) + '=' + encodeURIComponent(keyValueEl.value);
          }
        }
      }
      return url;
    }

    function validateRequestUrl(url) {
      if (!url) return 'URL is required';
      try {
        new URL(url);
        return null;
      } catch (e) {
        return 'Invalid URL format. Please include the protocol (e.g., https://)';
      }
    }

    function executeRequest() {
      if (STATE.isLoading) return;

      var url = buildFinalUrl();
      var validationError = validateRequestUrl(url);
      if (validationError) {
        showErrorBanner(validationError);
        return;
      }

      hideErrorBanner();
      setLoadingState(true);

      var method = ELEMENTS.methodSelect.value;
      var headers = buildRequestHeaders();
      var body = buildRequestBody();

      if (STATE.proxyAvailable) {
        executeViaProxy(method, url, headers, body);
      } else {
        executeViaDirect(method, url, headers, body);
      }
    }

    function executeViaProxy(method, url, headers, body) {
      var proxyPayload = {
        method: method,
        url: url,
        headers: headers
      };
      if (body !== null) {
        proxyPayload.body = body;
      }

      fetch(STATE.proxyBaseUrl + '/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(proxyPayload)
      })
        .then(function(response) {
          return response.json();
        })
        .then(function(data) {
          setLoadingState(false);
          if (data.error) {
            renderErrorResponse({ message: data.error + (data.code ? ' (' + data.code + ')' : '') }, data.time || 0);
            addHistoryEntry(method, url, 0);
            return;
          }
          var result = {
            status: data.status,
            statusText: data.statusText,
            headers: data.headers,
            body: data.body,
            time: data.time,
            size: data.size
          };
          renderResponse(result);
          addHistoryEntry(method, url, result.status);
        })
        .catch(function(error) {
          setLoadingState(false);
          renderErrorResponse(error, 0);
          addHistoryEntry(method, url, 0);
        });
    }

    function executeViaDirect(method, url, headers, body) {
      var startTime = performance.now();
      var fetchOptions = { method: method, headers: headers };
      if (body !== null) {
        fetchOptions.body = body;
      }

      fetch(url, fetchOptions)
        .then(function(response) {
          var endTime = performance.now();
          var duration = Math.round(endTime - startTime);
          var status = response.status;
          var statusText = response.statusText;
          var responseHeaders = {};
          response.headers.forEach(function(value, key) {
            responseHeaders[key] = value;
          });

          return response.text().then(function(text) {
            return {
              status: status,
              statusText: statusText,
              headers: responseHeaders,
              body: text,
              time: duration,
              size: new Blob([text]).size
            };
          });
        })
        .then(function(result) {
          setLoadingState(false);
          renderResponse(result);
          addHistoryEntry(method, url, result.status);
        })
        .catch(function(error) {
          var endTime = performance.now();
          var duration = Math.round(endTime - startTime);
          setLoadingState(false);
          renderErrorResponse(error, duration);
          addHistoryEntry(method, url, 0);
        });
    }

    function setLoadingState(loading) {
      STATE.isLoading = loading;
      ELEMENTS.sendBtn.disabled = loading;
      ELEMENTS.sendBtn.textContent = loading ? 'Sending...' : 'Send';
      ELEMENTS.loadingIndicator.classList.toggle('visible', loading);
      if (loading) {
        ELEMENTS.responseEmpty.style.display = 'none';
        ELEMENTS.responseBodyContent.style.display = 'none';
      }
    }

    function renderResponse(result) {
      renderResponseMeta(result.status, result.statusText, result.time, result.size);
      renderResponseHeaders(result.headers);

      STATE.responseRawText = result.body;
      STATE.responseIsJson = isJsonString(result.body);
      STATE.responsePrettyMode = true;

      ELEMENTS.responseToolbar.style.display = 'flex';
      document.getElementById('prettyBtn').classList.add('active');
      document.getElementById('rawBtn').classList.remove('active');

      renderResponseBody();
    }

    function renderErrorResponse(error, duration) {
      ELEMENTS.responseMeta.style.display = 'flex';
      ELEMENTS.responseMetaMobile.style.display = '';
      ELEMENTS.responseStatus.textContent = 'Error';
      ELEMENTS.responseStatus.className = 'response-meta-item status-danger';
      ELEMENTS.responseStatusMobile.textContent = 'Error';
      ELEMENTS.responseStatusMobile.className = 'response-meta-item status-danger';
      ELEMENTS.responseTime.textContent = duration + ' ms';
      ELEMENTS.responseTimeMobile.textContent = duration + ' ms';
      ELEMENTS.responseSize.textContent = '';
      ELEMENTS.responseSizeMobile.textContent = '';

      STATE.responseRawText = 'Error: ' + error.message + '\n\nThis could be caused by:\n- CORS policy blocking the request\n- Network connectivity issues\n- Invalid URL or server not responding\n- SSL/TLS certificate errors';
      STATE.responseIsJson = false;
      STATE.responsePrettyMode = false;

      ELEMENTS.responseToolbar.style.display = 'flex';
      renderResponseBody();
    }

    function renderResponseMeta(status, statusText, time, size) {
      var statusClass = getStatusClass(status);
      var statusLabel = status + ' ' + statusText;
      var sizeLabel = formatBytes(size);

      ELEMENTS.responseMeta.style.display = 'flex';
      ELEMENTS.responseMetaMobile.style.display = '';
      ELEMENTS.responseStatus.textContent = statusLabel;
      ELEMENTS.responseStatus.className = 'response-meta-item ' + statusClass;
      ELEMENTS.responseStatusMobile.textContent = statusLabel;
      ELEMENTS.responseStatusMobile.className = 'response-meta-item ' + statusClass;
      ELEMENTS.responseTime.textContent = time + ' ms';
      ELEMENTS.responseTimeMobile.textContent = time + ' ms';
      ELEMENTS.responseSize.textContent = sizeLabel;
      ELEMENTS.responseSizeMobile.textContent = sizeLabel;
    }

    function getStatusClass(status) {
      if (status >= 200 && status < 300) return 'status-success';
      if (status >= 300 && status < 400) return 'status-info';
      if (status >= 400 && status < 500) return 'status-warning';
      return 'status-danger';
    }

    function formatBytes(bytes) {
      if (bytes < 1024) return bytes + ' B';
      if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
      return (bytes / 1048576).toFixed(1) + ' MB';
    }

    function renderResponseHeaders(headers) {
      var tbody = ELEMENTS.responseHeadersBody;
      tbody.innerHTML = '';
      var count = 0;
      Object.keys(headers).forEach(function(key) {
        var tr = document.createElement('tr');
        var tdKey = document.createElement('td');
        tdKey.textContent = key;
        var tdVal = document.createElement('td');
        tdVal.textContent = headers[key];
        tr.appendChild(tdKey);
        tr.appendChild(tdVal);
        tbody.appendChild(tr);
        count++;
      });
      ELEMENTS.responseHeadersBadge.textContent = count;
    }

    function renderResponseBody() {
      ELEMENTS.responseEmpty.style.display = 'none';
      ELEMENTS.loadingIndicator.classList.remove('visible');
      ELEMENTS.responseBodyContent.style.display = 'block';

      if (STATE.responsePrettyMode && STATE.responseIsJson) {
        ELEMENTS.responseBodyContent.innerHTML = syntaxHighlightJson(STATE.responseRawText);
      } else {
        ELEMENTS.responseBodyContent.textContent = STATE.responseRawText;
      }
    }

    function switchResponseView(pretty) {
      STATE.responsePrettyMode = pretty;
      document.getElementById('prettyBtn').classList.toggle('active', pretty);
      document.getElementById('rawBtn').classList.toggle('active', !pretty);
      renderResponseBody();
    }

    function isJsonString(str) {
      if (!str || typeof str !== 'string') return false;
      var trimmed = str.trim();
      if ((trimmed[0] !== '{' && trimmed[0] !== '[')) return false;
      try {
        JSON.parse(trimmed);
        return true;
      } catch (e) {
        return false;
      }
    }

    function syntaxHighlightJson(jsonStr) {
      try {
        var parsed = JSON.parse(jsonStr);
        var formatted = JSON.stringify(parsed, null, 2);
        return formatted.replace(/("(\\u[\da-fA-F]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function(match) {
          var cls = 'json-number';
          if (/^"/.test(match)) {
            if (/:$/.test(match)) {
              cls = 'json-key';
            } else {
              cls = 'json-string';
            }
          } else if (/true|false/.test(match)) {
            cls = 'json-boolean';
          } else if (/null/.test(match)) {
            cls = 'json-null';
          }
          return '<span class="' + cls + '">' + escapeHtml(match) + '</span>';
        });
      } catch (e) {
        return escapeHtml(jsonStr);
      }
    }

    function escapeHtml(str) {
      var div = document.createElement('div');
      div.appendChild(document.createTextNode(str));
      return div.innerHTML;
    }

    function copyResponseToClipboard() {
      if (!STATE.responseRawText) return;
      navigator.clipboard.writeText(STATE.responseRawText).then(function() {
        showToast('Response copied to clipboard');
      }).catch(function() {
        showToast('Failed to copy');
      });
    }

    function addHistoryEntry(method, url, status) {
      var entry = { method: method, url: url, status: status, timestamp: Date.now() };
      STATE.history.unshift(entry);
      if (STATE.history.length > 50) STATE.history.pop();
      saveHistoryToStorage();
      renderHistoryList();
    }

    function renderHistoryList() {
      ELEMENTS.historyList.innerHTML = '';
      if (STATE.history.length === 0) {
        ELEMENTS.historyList.innerHTML = '<div class="history-empty">No requests yet</div>';
        return;
      }
      STATE.history.forEach(function(entry) {
        var item = document.createElement('button');
        item.className = 'history-item';
        var methodColor = 'var(--color-method-' + entry.method.toLowerCase() + ')';
        var statusClass = entry.status === 0 ? 'status-danger' : getStatusClass(entry.status);
        var displayUrl = entry.url;
        try {
          var urlObj = new URL(entry.url);
          displayUrl = urlObj.pathname + urlObj.search;
        } catch (e) {}

        item.innerHTML =
          '<span class="history-method" style="background-color:' + methodColor + '">' + entry.method + '</span>' +
          '<span class="history-url">' + escapeHtml(displayUrl) + '</span>' +
          '<span class="history-status ' + statusClass + '">' + (entry.status === 0 ? 'ERR' : entry.status) + '</span>';

        item.addEventListener('click', function() {
          loadHistoryEntry(entry);
        });

        ELEMENTS.historyList.appendChild(item);
      });
    }

    function loadHistoryEntry(entry) {
      ELEMENTS.methodSelect.value = entry.method;
      setupMethodSelectColor();
      try {
        var urlObj = new URL(entry.url);
        ELEMENTS.urlInput.value = urlObj.origin + urlObj.pathname;
      } catch (e) {
        ELEMENTS.urlInput.value = entry.url;
      }
      closeSidebar();
    }

    function clearHistory() {
      STATE.history = [];
      saveHistoryToStorage();
      renderHistoryList();
    }

    function saveHistoryToStorage() {
      try {
        localStorage.setItem('apitools_history', JSON.stringify(STATE.history));
      } catch (e) {}
    }

    function loadHistoryFromStorage() {
      try {
        var saved = localStorage.getItem('apitools_history');
        if (saved) {
          STATE.history = JSON.parse(saved);
        }
      } catch (e) {
        STATE.history = [];
      }
    }

    function setupThemeToggle() {
      var themeBtn = document.getElementById('themeToggleBtn');
      var saved = localStorage.getItem('apitools_theme');
      if (saved) {
        document.documentElement.setAttribute('data-theme', saved);
      }
      updateThemeToggleLabel();
      themeBtn.addEventListener('click', toggleTheme);
    }

    function toggleTheme() {
      var current = document.documentElement.getAttribute('data-theme');
      var next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('apitools_theme', next);
      updateThemeToggleLabel();
    }

    function updateThemeToggleLabel() {
      var theme = document.documentElement.getAttribute('data-theme');
      document.getElementById('themeIcon').textContent = theme === 'dark' ? '☀' : '☾';
      document.getElementById('themeLabel').textContent = theme === 'dark' ? 'Light' : 'Dark';
    }

    function setupSidebar() {
      var toggleBtn = document.getElementById('sidebarToggleBtn');
      if (!toggleBtn) return;

      // Clone to remove any previously attached listeners
      var newToggleBtn = toggleBtn.cloneNode(true);
      toggleBtn.parentNode.replaceChild(newToggleBtn, toggleBtn);
      newToggleBtn.addEventListener('click', function() {
        ELEMENTS.sidebar.classList.toggle('open');
        ELEMENTS.sidebarOverlay.classList.toggle('open');
      });

      var newOverlay = ELEMENTS.sidebarOverlay.cloneNode(true);
      ELEMENTS.sidebarOverlay.parentNode.replaceChild(newOverlay, ELEMENTS.sidebarOverlay);
      ELEMENTS.sidebarOverlay = newOverlay;
      ELEMENTS.sidebarOverlay.addEventListener('click', closeSidebar);
    }

    function closeSidebar() {
      ELEMENTS.sidebar.classList.remove('open');
      ELEMENTS.sidebarOverlay.classList.remove('open');
    }

    function setupKeyboardShortcuts() {
      document.addEventListener('keydown', function(e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
          e.preventDefault();
          executeRequest();
        }
      });

      ELEMENTS.urlInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          executeRequest();
        }
      });
    }

    function showErrorBanner(message) {
      ELEMENTS.errorBannerText.textContent = message;
      ELEMENTS.errorBanner.classList.add('visible');
    }

    function hideErrorBanner() {
      ELEMENTS.errorBanner.classList.remove('visible');
    }

    function showToast(message) {
      ELEMENTS.toast.textContent = message;
      ELEMENTS.toast.classList.add('visible');
      setTimeout(function() {
        ELEMENTS.toast.classList.remove('visible');
      }, 2000);
    }

// Expose globally so React useEffect can call it if needed
window.initializeApplication = initializeApplication;

// Run once when script is loaded
initializeApplication();