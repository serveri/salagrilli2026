;(function () {
  var scriptEl = document.currentScript
  var puzzleId = (scriptEl && scriptEl.dataset.puzzle) || 'general'
  var apiBase = (scriptEl && scriptEl.dataset.apiBase) || ''
  var label = (scriptEl && scriptEl.dataset.label) || 'Need a hint?'

  var STORAGE_KEY = 'sg-chat-history-' + puzzleId
  var history = loadHistory()

  function loadHistory() {
    try {
      var raw = window.localStorage.getItem(STORAGE_KEY)
      return raw ? JSON.parse(raw) : []
    } catch (err) {
      return []
    }
  }

  function saveHistory() {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
    } catch (err) {
      // storage unavailable/full — chat still works, just won't persist
    }
  }

  function injectStyles() {
    var style = document.createElement('style')
    style.textContent =
      '.sg-chat-bubble{position:fixed;right:20px;bottom:20px;width:56px;height:56px;' +
      'border-radius:9999px;background:#fff;color:#000;border:none;cursor:pointer;' +
      'display:flex;align-items:center;justify-content:center;box-shadow:0 4px 20px rgba(0,0,0,.5);' +
      'z-index:2147483000;transition:transform .15s ease,box-shadow .15s ease;}' +
      '.sg-chat-bubble:hover{transform:scale(1.06);box-shadow:0 6px 24px rgba(0,0,0,.6);}' +
      '.sg-chat-panel{position:fixed;right:16px;bottom:88px;left:16px;margin:0 auto;' +
      'width:auto;max-width:380px;max-height:min(75vh,560px);background:#0b0b0b;color:#f2f2f2;' +
      'border:1px solid rgba(255,255,255,.14);border-radius:18px;display:none;flex-direction:column;' +
      'overflow:hidden;font-family:system-ui,-apple-system,sans-serif;font-size:14px;' +
      'z-index:2147483000;box-shadow:0 16px 48px rgba(0,0,0,.65);}' +
      '.sg-chat-panel.sg-open{display:flex;}' +
      '.sg-chat-header{display:flex;align-items:center;justify-content:space-between;' +
      'padding:14px 16px;border-bottom:1px solid rgba(255,255,255,.1);flex-shrink:0;}' +
      '.sg-chat-title{font-weight:600;font-size:15px;letter-spacing:-.01em;}' +
      '.sg-chat-header-actions{display:flex;align-items:center;gap:4px;}' +
      '.sg-chat-icon-btn{background:none;border:none;color:#aaa;cursor:pointer;' +
      'width:30px;height:30px;border-radius:9999px;display:flex;align-items:center;' +
      'justify-content:center;transition:background .15s ease,color .15s ease;}' +
      '.sg-chat-icon-btn:hover{background:rgba(255,255,255,.1);color:#fff;}' +
      '.sg-chat-disclaimer{font-size:11px;line-height:1.45;color:#8a8a8a;padding:10px 16px;' +
      'background:rgba(255,255,255,.03);flex-shrink:0;}' +
      '.sg-chat-messages{flex:1;overflow-y:auto;padding:16px;display:flex;' +
      'flex-direction:column;gap:10px;}' +
      '.sg-chat-msg{max-width:85%;padding:9px 12px;border-radius:16px;word-wrap:break-word;' +
      'white-space:pre-wrap;line-height:1.45;}' +
      '.sg-chat-msg.sg-user{align-self:flex-end;background:#fff;color:#000;border-bottom-right-radius:4px;}' +
      '.sg-chat-msg.sg-model{align-self:flex-start;background:#1c1c1e;' +
      'border-bottom-left-radius:4px;}' +
      '.sg-chat-msg.sg-error{align-self:flex-start;background:#2a0f0f;border:1px solid #5a1f1f;' +
      'color:#ff9d9d;}' +
      '.sg-chat-msg.sg-markdown{white-space:normal;}' +
      '.sg-chat-msg.sg-markdown p{margin:0 0 6px;}' +
      '.sg-chat-msg.sg-markdown p:last-child{margin-bottom:0;}' +
      '.sg-chat-msg.sg-markdown ul,.sg-chat-msg.sg-markdown ol{margin:2px 0 6px;padding-left:20px;}' +
      '.sg-chat-msg.sg-markdown li{margin-bottom:2px;}' +
      '.sg-chat-msg.sg-markdown li:last-child{margin-bottom:0;}' +
      '.sg-chat-msg.sg-markdown code{background:#000;border:1px solid #333;padding:1px 4px;' +
      'border-radius:4px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:.9em;}' +
      '.sg-chat-typing{align-self:flex-start;color:#888;font-style:italic;padding:0 4px;font-size:13px;}' +
      '.sg-chat-form{display:flex;align-items:center;gap:8px;padding:12px;' +
      'border-top:1px solid rgba(255,255,255,.1);flex-shrink:0;}' +
      '.sg-chat-input{flex:1;background:#1a1a1a;border:1px solid rgba(255,255,255,.12);color:#fff;' +
      'border-radius:9999px;padding:9px 14px;font-size:14px;font-family:inherit;outline:none;' +
      'transition:border-color .15s ease;}' +
      '.sg-chat-input::placeholder{color:#777;}' +
      '.sg-chat-input:focus{border-color:rgba(255,255,255,.5);}' +
      '.sg-chat-send{background:#fff;color:#000;border:none;border-radius:9999px;' +
      'width:36px;height:36px;flex-shrink:0;display:flex;align-items:center;justify-content:center;' +
      'cursor:pointer;transition:transform .15s ease;}' +
      '.sg-chat-send:hover:not(:disabled){transform:scale(1.06);}' +
      '.sg-chat-send:disabled{opacity:.4;cursor:default;}' +
      '@media (min-width:420px){.sg-chat-panel{left:auto;right:20px;width:380px;}}'
    document.head.appendChild(style)
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
  }

  function formatInline(text) {
    text = text.replace(/`([^`]+)`/g, '<code>$1</code>')
    text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    text = text.replace(/\*([^*]+)\*/g, '<em>$1</em>')
    text = text.replace(/(^|[^_])_([^_]+)_(?!_)/g, '$1<em>$2</em>')
    return text
  }

  // Minimal markdown-lite renderer: escapes raw text first (so no model output can inject
  // HTML), then applies a small set of line-based transforms (bold/italic/code/lists/paragraphs).
  function renderMarkdown(raw) {
    var lines = escapeHtml(raw).split('\n')
    var html = ''
    var listType = null

    function closeList() {
      if (listType) {
        html += listType === 'ul' ? '</ul>' : '</ol>'
        listType = null
      }
    }

    lines.forEach(function (line) {
      var bulletMatch = line.match(/^\s*[-*]\s+(.*)/)
      var numberedMatch = line.match(/^\s*\d+\.\s+(.*)/)

      if (bulletMatch) {
        if (listType !== 'ul') {
          closeList()
          html += '<ul>'
          listType = 'ul'
        }
        html += '<li>' + formatInline(bulletMatch[1]) + '</li>'
      } else if (numberedMatch) {
        if (listType !== 'ol') {
          closeList()
          html += '<ol>'
          listType = 'ol'
        }
        html += '<li>' + formatInline(numberedMatch[1]) + '</li>'
      } else {
        closeList()
        if (line.trim() !== '') {
          html += '<p>' + formatInline(line) + '</p>'
        }
      }
    })
    closeList()
    return html
  }

  var elements = {}

  function buildDom() {
    var bubble = document.createElement('button')
    bubble.type = 'button'
    bubble.className = 'sg-chat-bubble'
    bubble.setAttribute('aria-label', label)
    bubble.innerHTML =
      '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
      'stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>' +
      '</svg>'

    var panel = document.createElement('div')
    panel.className = 'sg-chat-panel'

    var header = document.createElement('div')
    header.className = 'sg-chat-header'
    var title = document.createElement('span')
    title.className = 'sg-chat-title'
    title.textContent = label
    var headerActions = document.createElement('div')
    headerActions.className = 'sg-chat-header-actions'
    var newChatBtn = document.createElement('button')
    newChatBtn.type = 'button'
    newChatBtn.className = 'sg-chat-icon-btn'
    newChatBtn.setAttribute('aria-label', 'Start new chat')
    newChatBtn.setAttribute('title', 'Start new chat')
    newChatBtn.innerHTML =
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
      'stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M3 12a9 9 0 1 1 2.6 6.4"/><path d="M3 21v-6h6"/></svg>'
    var closeBtn = document.createElement('button')
    closeBtn.type = 'button'
    closeBtn.className = 'sg-chat-icon-btn'
    closeBtn.setAttribute('aria-label', 'Close chat')
    closeBtn.innerHTML =
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
      'stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M18 6 6 18"/><path d="M6 6l12 12"/></svg>'
    headerActions.appendChild(newChatBtn)
    headerActions.appendChild(closeBtn)
    header.appendChild(title)
    header.appendChild(headerActions)

    var disclaimer = document.createElement('div')
    disclaimer.className = 'sg-chat-disclaimer'
    disclaimer.textContent =
      'This is an AI assistant and can make mistakes or false promises. Serveri ry is not ' +
      'responsible for anything it says.'

    var messages = document.createElement('div')
    messages.className = 'sg-chat-messages'

    var form = document.createElement('form')
    form.className = 'sg-chat-form'
    var input = document.createElement('input')
    input.type = 'text'
    input.className = 'sg-chat-input'
    input.placeholder = 'Ask for a hint...'
    input.autocomplete = 'off'
    var sendBtn = document.createElement('button')
    sendBtn.type = 'submit'
    sendBtn.className = 'sg-chat-send'
    sendBtn.setAttribute('aria-label', 'Send message')
    sendBtn.innerHTML =
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
      'stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4 20-7z"/></svg>'
    form.appendChild(input)
    form.appendChild(sendBtn)

    panel.appendChild(header)
    panel.appendChild(disclaimer)
    panel.appendChild(messages)
    panel.appendChild(form)

    document.body.appendChild(bubble)
    document.body.appendChild(panel)

    elements.bubble = bubble
    elements.panel = panel
    elements.messages = messages
    elements.form = form
    elements.input = input
    elements.sendBtn = sendBtn
    elements.closeBtn = closeBtn
    elements.newChatBtn = newChatBtn

    bubble.addEventListener('click', toggleOpen)
    closeBtn.addEventListener('click', toggleOpen)
    newChatBtn.addEventListener('click', startNewChat)
    form.addEventListener('submit', function (e) {
      e.preventDefault()
      var text = input.value.trim()
      if (!text) return
      input.value = ''
      sendMessage(text)
    })

    history.forEach(function (turn) {
      renderMessage(turn.role, turn.text)
    })
  }

  function startNewChat() {
    history = []
    try {
      window.localStorage.removeItem(STORAGE_KEY)
    } catch (err) {
      // storage unavailable — nothing to clear
    }
    elements.messages.innerHTML = ''
    elements.input.value = ''
    elements.input.focus()
  }

  function toggleOpen() {
    elements.panel.classList.toggle('sg-open')
    if (elements.panel.classList.contains('sg-open')) {
      elements.input.focus()
      elements.messages.scrollTop = elements.messages.scrollHeight
    }
  }

  function createMessageEl(role) {
    var el = document.createElement('div')
    el.className =
      'sg-chat-msg ' + (role === 'user' ? 'sg-user' : role === 'error' ? 'sg-error' : 'sg-model')
    elements.messages.appendChild(el)
    return el
  }

  function renderMessage(role, text) {
    var el = createMessageEl(role)
    if (role === 'model') {
      el.classList.add('sg-markdown')
      el.innerHTML = renderMarkdown(text)
    } else {
      el.textContent = text
    }
    elements.messages.scrollTop = elements.messages.scrollHeight
    return el
  }

  var typingEl = null
  function showTyping() {
    typingEl = document.createElement('div')
    typingEl.className = 'sg-chat-typing'
    typingEl.textContent = 'Thinking...'
    elements.messages.appendChild(typingEl)
    elements.messages.scrollTop = elements.messages.scrollHeight
  }
  function hideTyping() {
    if (typingEl && typingEl.parentNode) typingEl.parentNode.removeChild(typingEl)
    typingEl = null
  }

  function sendMessage(text) {
    renderMessage('user', text)
    history.push({ role: 'user', text: text })
    saveHistory()

    elements.sendBtn.disabled = true
    showTyping()

    var rawText = ''
    var msgEl = null

    fetch(apiBase + '/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ puzzleId: puzzleId, history: history }),
    })
      .then(function (res) {
        if (!res.ok || !res.body) {
          return res
            .json()
            .catch(function () {
              return {}
            })
            .then(function (data) {
              throw new Error((data && data.error) || 'HTTP ' + res.status)
            })
        }

        var reader = res.body.getReader()
        var decoder = new TextDecoder()

        function pump() {
          return reader.read().then(function (result) {
            if (result.done) {
              if (msgEl) {
                msgEl.classList.add('sg-markdown')
                msgEl.innerHTML = renderMarkdown(rawText)
                history.push({ role: 'model', text: rawText })
                saveHistory()
              } else {
                hideTyping()
                renderMessage('error', 'The assistant did not respond. Try again.')
              }
              return
            }

            var chunkText = decoder.decode(result.value, { stream: true })
            if (chunkText) {
              if (!msgEl) {
                hideTyping()
                msgEl = createMessageEl('model')
              }
              rawText += chunkText
              // Plain text while streaming (fast, avoids re-parsing markdown on every
              // chunk) — the final chunk swaps this to fully rendered markdown above.
              msgEl.textContent = rawText
              elements.messages.scrollTop = elements.messages.scrollHeight
            }
            return pump()
          })
        }

        return pump()
      })
      .catch(function () {
        hideTyping()
        if (msgEl && msgEl.parentNode) msgEl.parentNode.removeChild(msgEl)
        renderMessage('error', 'Something went wrong. Try again in a moment.')
      })
      .finally(function () {
        elements.sendBtn.disabled = false
      })
  }

  injectStyles()
  buildDom()
})()
