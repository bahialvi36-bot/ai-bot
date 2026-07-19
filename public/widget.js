(function () {
  // 1. Resolve host base URL from the script src attribute
  const scriptTag = document.currentScript;
  const scriptSrc = scriptTag ? scriptTag.src : '';
  let baseUrl = 'http://localhost:3000';
  if (scriptSrc && scriptSrc.startsWith('http')) {
    baseUrl = new URL(scriptSrc).origin;
  }

  // Get configuration from script tags
  const botId = scriptTag ? scriptTag.getAttribute('data-bot-id') : null;
  if (!botId) {
    console.error('AI Chatbot Widget: Missing data-bot-id attribute.');
    return;
  }

  // 2. Load Google Font
  if (!document.getElementById('ai-chatbot-font')) {
    const link = document.createElement('link');
    link.id = 'ai-chatbot-font';
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap';
    document.head.appendChild(link);
  }

  // 3. Inject CSS Styles
  const styles = `
    #ai-chatbot-root {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 999999;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
    }
    
    /* Chat Bubble Toggle Button */
    .ai-chatbot-bubble {
      width: 60px;
      height: 60px;
      border-radius: 30px;
      background: linear-gradient(135deg, #0d9488 0%, #4f46e5 100%);
      box-shadow: 0 8px 32px rgba(79, 70, 229, 0.35);
      cursor: pointer;
      display: flex;
      justify-content: center;
      align-items: center;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .ai-chatbot-bubble:hover {
      transform: scale(1.08) translateY(-2px);
      box-shadow: 0 12px 40px rgba(79, 70, 229, 0.5);
    }
    .ai-chatbot-bubble svg {
      width: 28px;
      height: 28px;
      fill: none;
      stroke: #ffffff;
      stroke-width: 2;
      stroke-linecap: round;
      stroke-linejoin: round;
      transition: transform 0.3s ease;
    }
    .ai-chatbot-bubble.open svg {
      transform: rotate(90deg);
    }

    /* Chat Window Container */
    .ai-chatbot-window {
      width: 380px;
      height: 580px;
      max-height: calc(100vh - 100px);
      border-radius: 20px;
      background: #0f172a;
      border: 1px border-slate-800;
      box-shadow: 0 12px 50px rgba(0, 0, 0, 0.5);
      display: none;
      flex-direction: column;
      overflow: hidden;
      margin-bottom: 16px;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      transform: translateY(20px) scale(0.95);
      opacity: 0;
    }
    .ai-chatbot-window.visible {
      display: flex;
      transform: translateY(0) scale(1);
      opacity: 1;
    }
    
    @media (max-width: 480px) {
      #ai-chatbot-root {
        bottom: 0;
        right: 0;
        width: 100%;
        height: 100%;
      }
      .ai-chatbot-window {
        width: 100%;
        height: 100%;
        max-height: 100%;
        border-radius: 0;
        margin-bottom: 0;
      }
      .ai-chatbot-bubble {
        position: fixed;
        bottom: 16px;
        right: 16px;
      }
      .ai-chatbot-bubble.open {
        display: none;
      }
    }

    /* Header Styling */
    .ai-chatbot-header {
      padding: 18px 20px;
      background: linear-gradient(135deg, #111827 0%, #1f2937 100%);
      border-bottom: 1px solid #374151;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .ai-chatbot-header-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .ai-chatbot-avatar {
      width: 40px;
      height: 40px;
      border-radius: 20px;
      background: linear-gradient(135deg, #0d9488 0%, #06b6d4 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      box-shadow: 0 4px 10px rgba(13, 148, 136, 0.2);
    }
    .ai-chatbot-title {
      font-size: 15px;
      font-weight: 700;
      color: #f3f4f6;
      line-height: 1.2;
    }
    .ai-chatbot-subtitle {
      font-size: 11px;
      color: #9ca3af;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .ai-chatbot-status-dot {
      width: 6px;
      height: 6px;
      background-color: #10b981;
      border-radius: 50%;
      display: inline-block;
    }
    .ai-chatbot-close-btn {
      background: none;
      border: none;
      color: #9ca3af;
      cursor: pointer;
      padding: 4px;
      display: flex;
      align-items: center;
      transition: color 0.2s;
    }
    .ai-chatbot-close-btn:hover {
      color: #f3f4f6;
    }

    /* Messages Area */
    .ai-chatbot-messages {
      flex: 1;
      padding: 20px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 14px;
      background: #0b0f19;
    }
    
    /* Scrollbar */
    .ai-chatbot-messages::-webkit-scrollbar {
      width: 5px;
    }
    .ai-chatbot-messages::-webkit-scrollbar-track {
      background: transparent;
    }
    .ai-chatbot-messages::-webkit-scrollbar-thumb {
      background: #1f2937;
      border-radius: 3px;
    }

    /* Message Bubbles */
    .ai-chatbot-msg-row {
      display: flex;
      width: 100%;
    }
    .ai-chatbot-msg-row.user {
      justify-content: flex-end;
    }
    .ai-chatbot-msg-row.bot {
      justify-content: flex-start;
    }
    .ai-chatbot-msg-bubble {
      max-width: 80%;
      padding: 10px 14px;
      border-radius: 16px;
      font-size: 13.5px;
      line-height: 1.45;
    }
    .ai-chatbot-msg-row.user .ai-chatbot-msg-bubble {
      background: #0d9488;
      color: #ffffff;
      border-bottom-right-radius: 2px;
    }
    .ai-chatbot-msg-row.bot .ai-chatbot-msg-bubble {
      background: #1e293b;
      color: #e2e8f0;
      border-bottom-left-radius: 2px;
      border: 1px solid #334155;
    }

    /* Starters Button Container */
    .ai-chatbot-starters {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-top: 10px;
      width: 100%;
    }
    .ai-chatbot-starter-btn {
      background: #1e293b;
      border: 1px solid #334155;
      color: #38bdf8;
      padding: 8px 12px;
      border-radius: 12px;
      font-size: 12.5px;
      text-align: left;
      cursor: pointer;
      transition: all 0.2s;
      font-weight: 500;
    }
    .ai-chatbot-starter-btn:hover {
      background: #334155;
      color: #7dd3fc;
      transform: translateX(3px);
    }

    /* Typing Indicator */
    .ai-chatbot-typing {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 6px 12px;
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 16px;
      border-bottom-left-radius: 2px;
      align-self: flex-start;
      margin-top: 4px;
    }
    .ai-chatbot-typing-dot {
      width: 6px;
      height: 6px;
      background: #94a3b8;
      border-radius: 50%;
      animation: ai-bounce 1.4s infinite ease-in-out both;
    }
    .ai-chatbot-typing-dot:nth-child(1) { animation-delay: -0.32s; }
    .ai-chatbot-typing-dot:nth-child(2) { animation-delay: -0.16s; }

    @keyframes ai-bounce {
      0%, 80%, 100% { transform: scale(0); }
      40% { transform: scale(1.0); }
    }

    /* Lead Form Widget */
    .ai-chatbot-lead-card {
      background: #1e1b4b;
      border: 1px solid #4338ca;
      border-radius: 16px;
      padding: 16px;
      width: 100%;
      box-sizing: border-box;
      color: #e0e7ff;
      margin-top: 10px;
    }
    .ai-chatbot-lead-title {
      font-size: 13.5px;
      font-weight: 700;
      color: #ffffff;
      margin-bottom: 6px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .ai-chatbot-lead-desc {
      font-size: 11.5px;
      color: #c7d2fe;
      margin-bottom: 12px;
      line-height: 1.35;
    }
    .ai-chatbot-lead-form {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .ai-chatbot-lead-form input {
      background: #0f172a;
      border: 1px solid #4338ca;
      border-radius: 8px;
      padding: 8px 10px;
      color: #ffffff;
      font-size: 12px;
      font-family: inherit;
    }
    .ai-chatbot-lead-form input:focus {
      outline: none;
      border-color: #6366f1;
    }
    .ai-chatbot-lead-submit {
      background: #6366f1;
      color: #ffffff;
      border: none;
      padding: 8px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;
    }
    .ai-chatbot-lead-submit:hover {
      background: #4f46e5;
    }

    /* Input Footer */
    .ai-chatbot-footer {
      padding: 12px 16px;
      background: #0f172a;
      border-top: 1px solid #1e293b;
      display: flex;
      gap: 8px;
      align-items: center;
    }
    .ai-chatbot-input {
      flex: 1;
      background: #1e293b;
      border: 1px solid #334155;
      color: #ffffff;
      border-radius: 12px;
      padding: 10px 14px;
      font-size: 13px;
      font-family: inherit;
    }
    .ai-chatbot-input:focus {
      outline: none;
      border-color: #0d9488;
    }
    .ai-chatbot-send-btn {
      background: #0d9488;
      border: none;
      width: 38px;
      height: 38px;
      border-radius: 10px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s;
    }
    .ai-chatbot-send-btn:hover {
      background: #0f766e;
    }
    .ai-chatbot-send-btn svg {
      width: 18px;
      height: 18px;
      fill: none;
      stroke: #ffffff;
      stroke-width: 2.5;
    }

    /* Branding */
    .ai-chatbot-branding {
      text-align: center;
      font-size: 9px;
      color: #475569;
      margin-top: 4px;
      font-weight: 500;
    }
    .ai-chatbot-branding a {
      color: #64748b;
      text-decoration: none;
      font-weight: 600;
    }
  `;

  const styleEl = document.createElement('style');
  styleEl.innerHTML = styles;
  document.head.appendChild(styleEl);

  // 4. Create DOM structure
  const rootContainer = document.createElement('div');
  rootContainer.id = 'ai-chatbot-root';
  document.body.appendChild(rootContainer);

  rootContainer.innerHTML = `
    <!-- Chat Window -->
    <div id="ai-chatbot-window-container" class="ai-chatbot-window">
      <!-- Header -->
      <div class="ai-chatbot-header">
        <div class="ai-chatbot-header-info">
          <div class="ai-chatbot-avatar">🤖</div>
          <div>
            <div id="ai-chatbot-name" class="ai-chatbot-title">AI Assistant</div>
            <div class="ai-chatbot-subtitle">
              <span class="ai-chatbot-status-dot"></span>
              Online • Replies instantly
            </div>
          </div>
        </div>
        <button id="ai-chatbot-close-trigger" class="ai-chatbot-close-btn" aria-label="Close Chat">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>

      <!-- Messages Area -->
      <div id="ai-chatbot-messages-container" class="ai-chatbot-messages">
        <div class="ai-chatbot-msg-row bot">
          <div class="ai-chatbot-msg-bubble">
            Hello! Welcome to our website. How can I help you today?
          </div>
        </div>
        <div id="ai-chatbot-starters-container" class="ai-chatbot-starters"></div>
      </div>

      <!-- Footer Input -->
      <form id="ai-chatbot-input-form" class="ai-chatbot-footer">
        <input 
          type="text" 
          id="ai-chatbot-text-input" 
          class="ai-chatbot-input" 
          placeholder="Ask a question..."
          autocomplete="off"
        />
        <button type="submit" class="ai-chatbot-send-btn" aria-label="Send Message">
          <svg viewBox="0 0 24 24"><path d="M22 2L11 13M22 2L15 22L11 13M11 13L2 9L22 2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
      </form>
      <div class="ai-chatbot-branding">
        Powered by <a href="#" target="_blank">Chatbot Platform</a>
      </div>
    </div>

    <!-- Toggle Bubble -->
    <div id="ai-chatbot-bubble-trigger" class="ai-chatbot-bubble">
      <svg viewBox="0 0 24 24">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    </div>
  `;

  // 5. Cache DOM elements
  const chatBubble = document.getElementById('ai-chatbot-bubble-trigger');
  const chatWindow = document.getElementById('ai-chatbot-window-container');
  const closeBtn = document.getElementById('ai-chatbot-close-trigger');
  const messagesContainer = document.getElementById('ai-chatbot-messages-container');
  const startersContainer = document.getElementById('ai-chatbot-starters-container');
  const inputForm = document.getElementById('ai-chatbot-input-form');
  const textInput = document.getElementById('ai-chatbot-text-input');
  const botNameEl = document.getElementById('ai-chatbot-name');

  // State
  let botName = 'AI Assistant';
  let conversationStarters = [];
  let conversationId = localStorage.getItem(`ai_chat_conv_${botId}`) || '';
  let visitorId = localStorage.getItem('ai_chat_visitor_id') || '';
  let messageCount = 0;
  let hasTriggeredLeadCapture = false;

  if (!visitorId) {
    visitorId = 'visitor_' + Math.random().toString(36).substring(2, 11);
    localStorage.setItem('ai_chat_visitor_id', visitorId);
  }

  // 6. Fetch Bot Configuration
  async function loadBotConfig() {
    try {
      const response = await fetch(`${baseUrl}/api/bot-config?bot_id=${botId}`);
      if (!response.ok) throw new Error('Failed to load bot configuration.');
      const data = await response.json();
      
      botName = data.name || 'AI Assistant';
      botNameEl.textContent = botName;
      
      // Load starters
      if (data.conversation_starters) {
        if (typeof data.conversation_starters === 'string') {
          conversationStarters = JSON.parse(data.conversation_starters);
        } else {
          conversationStarters = data.conversation_starters;
        }
      }
      renderStarters();
    } catch (err) {
      console.warn('AI Chatbot: Could not fetch bot configurations.', err);
    }
  }

  function renderStarters() {
    startersContainer.innerHTML = '';
    if (conversationStarters && conversationStarters.length > 0) {
      conversationStarters.forEach(starter => {
        const btn = document.createElement('button');
        btn.className = 'ai-chatbot-starter-btn';
        btn.textContent = starter;
        btn.type = 'button';
        btn.addEventListener('click', () => {
          textInput.value = starter;
          handleSendMessage();
        });
        startersContainer.appendChild(btn);
      });
    }
  }

  // 7. Render messages
  function appendMessage(role, text) {
    const row = document.createElement('div');
    row.className = `ai-chatbot-msg-row ${role}`;
    
    const bubble = document.createElement('div');
    bubble.className = 'ai-chatbot-msg-bubble';
    bubble.textContent = text;
    
    row.appendChild(bubble);
    messagesContainer.appendChild(row);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  // Typing Indicator helper
  let typingIndicator = null;
  function showTypingIndicator() {
    if (typingIndicator) return;
    typingIndicator = document.createElement('div');
    typingIndicator.className = 'ai-chatbot-typing';
    typingIndicator.innerHTML = `
      <div class="ai-chatbot-typing-dot"></div>
      <div class="ai-chatbot-typing-dot"></div>
      <div class="ai-chatbot-typing-dot"></div>
    `;
    messagesContainer.appendChild(typingIndicator);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  function removeTypingIndicator() {
    if (typingIndicator) {
      typingIndicator.remove();
      typingIndicator = null;
    }
  }

  // Lead Form Trigger
  function showLeadCaptureForm(messageContext = '') {
    if (hasTriggeredLeadCapture) return;
    hasTriggeredLeadCapture = true;

    const formWrapper = document.createElement('div');
    formWrapper.className = 'ai-chatbot-lead-card';
    formWrapper.innerHTML = `
      <div class="ai-chatbot-lead-title">📧 Let the team follow up</div>
      <div class="ai-chatbot-lead-desc">Leave your contact details and our team will get back to you directly.</div>
      <form class="ai-chatbot-lead-form">
        <input type="text" id="ai-lead-name" placeholder="Your Name" required />
        <input type="email" id="ai-lead-email" placeholder="Your Email Address" required />
        <button type="submit" class="ai-chatbot-lead-submit">Submit Details</button>
      </form>
    `;

    messagesContainer.appendChild(formWrapper);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    const leadForm = formWrapper.querySelector('.ai-chatbot-lead-form');
    leadForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('ai-lead-name').value;
      const email = document.getElementById('ai-lead-email').value;

      const submitBtn = formWrapper.querySelector('.ai-chatbot-lead-submit');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending...';

      try {
        const res = await fetch(`${baseUrl}/api/leads`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bot_id: botId,
            name,
            email,
            message: messageContext || 'Lead captured from chat widget.'
          })
        });
        if (!res.ok) throw new Error('Lead capture failed.');

        formWrapper.innerHTML = `
          <div class="ai-chatbot-lead-title" style="color: #4ade80;">✓ Request Received</div>
          <div class="ai-chatbot-lead-desc">Thanks ${name}! We've saved your details and our team will reach out shortly.</div>
        `;
      } catch (err) {
        console.error('Lead capture error:', err);
        submitBtn.disabled = false;
        submitBtn.textContent = 'Try Again';
      }
    });
  }

  // Send message action
  async function handleSendMessage() {
    const text = textInput.value.trim();
    if (!text) return;

    textInput.value = '';
    // Hide starters after first message
    startersContainer.style.display = 'none';

    // Append user message
    appendMessage('user', text);
    messageCount++;

    // Show loading indicator
    showTypingIndicator();

    try {
      const response = await fetch(`${baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bot_id: botId,
          message: text,
          conversation_id: conversationId || undefined,
          visitor_id: visitorId
        })
      });

      const data = await response.json();
      removeTypingIndicator();

      if (!response.ok) throw new Error(data.error || 'Failed to get chat response.');

      // Cache conversation ID if new
      if (data.conversation_id && data.conversation_id !== conversationId) {
        conversationId = data.conversation_id;
        localStorage.setItem(`ai_chat_conv_${botId}`, conversationId);
      }

      // Append bot message
      appendMessage('bot', data.answer);

      // Trigger lead capture if fallback is active or if user asks for human, or after 3 messages
      if (data.isFallback || messageCount >= 3) {
        setTimeout(() => {
          showLeadCaptureForm(text);
        }, 800);
      }

    } catch (err) {
      console.error(err);
      removeTypingIndicator();
      appendMessage('bot', "I'm sorry, I'm having trouble connecting right now. Please try again later.");
    }
  }

  // 8. Event listeners
  chatBubble.addEventListener('click', () => {
    const isOpen = chatWindow.classList.contains('visible');
    if (isOpen) {
      chatWindow.classList.remove('visible');
      chatBubble.classList.remove('open');
    } else {
      chatWindow.classList.add('visible');
      chatBubble.classList.add('open');
      
      // Load config when chat window first opens
      if (conversationStarters.length === 0) {
        loadBotConfig();
      }
      
      // Refocus input
      setTimeout(() => textInput.focus(), 150);
    }
  });

  closeBtn.addEventListener('click', () => {
    chatWindow.classList.remove('visible');
    chatBubble.classList.remove('open');
  });

  inputForm.addEventListener('submit', (e) => {
    e.preventDefault();
    handleSendMessage();
  });
})();
