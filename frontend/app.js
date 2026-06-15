import { createClient } from "https://esm.sh/@supabase/supabase-js";

// app.js - BuildHub AI Interactive Controller

document.addEventListener('DOMContentLoaded', () => {
    const supabase = createClient(
        "https://dznpypworynliyhyybnp.supabase.co",
        "sb_publishable_8b0GCxtDFtVbSwsPnbjwKA_iiNbmsqt"
    );
    // Current application state
    const state = {
        isLoggedIn: false,
        currentUser: null,
        userId: null,
        authMode: 'login', // login, signup
        activeView: 'login', // login, dashboard, chat, settings
        activeChatSession: null,
        sessions: [], // loaded chat sessions
        settings: {
            temperature: 0.7,
            systemPrompt: 'You are BuildHub AI, a Cyberpunk-Minimalist development and orchestration model. Respond with technical precision, high clarity, and structure.',
            maxTokens: 4096,
            model: 'neon-synthesis-v2.4'
        },
        chatHistory: {} // session-specific message lists
    };

    // Load settings from localStorage if present
    const savedSettings = localStorage.getItem('buildhub_settings');
    if (savedSettings) {
        try {
            state.settings = { ...state.settings, ...JSON.parse(savedSettings) };
        } catch (e) {
            console.error('Error loading configuration settings', e);
        }
    }

    // Elements cache
    const elements = {
        loginSection: document.getElementById('login-section'),
        appLayout: document.getElementById('app-layout'),
        sidebarUserEmail: document.getElementById('sidebar-user-email'),

        
        // Navigation buttons
        btnNavChat: document.getElementById('nav-chat'),
        btnNavLogout: document.getElementById('nav-logout'),

        // Nav indicators/icons
        navChatLi: document.getElementById('nav-chat-li'),

        // View panels
        viewChat: document.getElementById('view-chat'),
        viewSettings: document.getElementById('view-settings'),

        // Login inputs & form
        loginForm: document.getElementById('login-form'),
        emailInput: document.getElementById('email'),
        passwordInput: document.getElementById('password'),
        togglePasswordBtn: document.getElementById('toggle-password'),
        btnSubmitLogin: document.getElementById('btn-submit-login'),
        authTitle: document.getElementById('auth-title'),
        toggleAuthModeBtn: document.getElementById('toggle-auth-mode'),
        btnGoogleLogin: document.getElementById('btn-google-login'),

        // Chat elements
        chatMessagesContainer: document.getElementById('chat-messages-container'),
        chatInput: document.getElementById('chat-input'),
        btnSendChat: document.getElementById('btn-send-chat'),
        btnUploadDocument:document.getElementById('btn-upload-document'),
        documentUpload:document.getElementById('document-upload'),
        chatTitle: document.getElementById('chat-title'),
        sidebarUserEmail: document.getElementById('sidebar-user-email'),
        sidebarChatSessions: document.getElementById('sidebar-chat-sessions'),
        suggestionCards: document.querySelectorAll('.suggestion-card'),
        suggestionContainer: document.getElementById('suggestion-container'),
        chatScrollBottom: document.getElementById('chat-scroll-bottom'),
        btnNewChat: document.getElementById('btn-new-chat'),

        // Settings inputs
        inputTemperature: document.getElementById('settings-temperature'),
        valTemperature: document.getElementById('val-temperature'),
        inputSystemPrompt: document.getElementById('settings-system-prompt'),
        inputMaxTokens: document.getElementById('settings-max-tokens'),
        inputModel: document.getElementById('settings-model'),
        btnSaveSettings: document.getElementById('settings-save-btn'),

        // Dashboard Stats
        statLatency: document.getElementById('stat-latency'),
        statCpu: document.getElementById('stat-cpu'),
        statActiveSessions: document.getElementById('stat-sessions')
    };

    // Restore saved email
const savedEmail = localStorage.getItem("user_email");

if (savedEmail && elements.sidebarUserEmail) {
    elements.sidebarUserEmail.textContent = savedEmail;
}

    // Toggle Password visibility
    if (elements.togglePasswordBtn) {
        elements.togglePasswordBtn.addEventListener('click', () => {
            const isPassword = elements.passwordInput.getAttribute('type') === 'password';
            elements.passwordInput.setAttribute('type', isPassword ? 'text' : 'password');
            elements.togglePasswordBtn.querySelector('span').textContent = isPassword ? 'visibility_off' : 'visibility';
        });
    }

    // Toggle authentication mode between Login and Sign Up
    if (elements.toggleAuthModeBtn) {
        elements.toggleAuthModeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (state.authMode === 'login') {
                state.authMode = 'signup';
                elements.authTitle.textContent = 'Operator Registration';
                elements.btnSubmitLogin.innerHTML = 'Register Operator';
                elements.toggleAuthModeBtn.textContent = 'Already registered? Log In';
            } else {
                state.authMode = 'login';
                elements.authTitle.textContent = 'Welcome !!';
                elements.btnSubmitLogin.innerHTML = 'Log In';
                elements.toggleAuthModeBtn.textContent = 'Request Access / Sign Up';
            }
        });
    }

    // Login Form Submission
    if (elements.loginForm) {
        elements.loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
        
            const email = elements.emailInput.value.trim();
            const password = elements.passwordInput.value.trim();
        
            if (!email || !password) {
                showToast('Please fill all fields.', 'error');
                return;
            }
        
            // Loading State
            elements.btnSubmitLogin.disabled = true;
            elements.btnSubmitLogin.innerHTML = `
                <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-on-primary-fixed inline-block"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
                ${state.authMode === 'login' ? 'Logging in...' : 'Registering Operator...'}
            `;
        
            try {
                let response, data;
                
                if (state.authMode === 'login') {
                    response = await fetch("http://127.0.0.1:8000/login", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ email, password })
                    });
                    
                    data = await response.json();
                    if (!response.ok) {
                        throw new Error(data.detail || "Login failed");
                    }
                } else {
                    response = await fetch("http://127.0.0.1:8000/signup", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ email, password })
                    });
                    
                    data = await response.json();
                    if (!response.ok) {
                        throw new Error(data.detail || "Registration failed");
                    }
                    
                    // Auto Login after successful signup
                    showToast('Operator registered. Authenticating...', 'success');
                    const autoLoginResponse = await fetch("http://127.0.0.1:8000/login", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ email, password })
                    });
                    
                    if (!autoLoginResponse.ok) {
                        throw new Error("Automatic login failed. Please sign in manually.");
                    }
                    data = await autoLoginResponse.json();
                }
        
                // SAVE USER
                localStorage.setItem("user_id", data.user);
                localStorage.setItem("user_email", data.email);
        
                state.isLoggedIn = true;
                state.currentUser = data.email;
                state.userId = data.user;
                elements.sidebarUserEmail.textContent = data.email;
        
                // Animate transition
                elements.loginSection.classList.add('view-hidden');
        
                setTimeout(() => {
                    elements.loginSection.style.display = 'none';
                    elements.appLayout.classList.remove('hidden');
        
                    setTimeout(() => {
                        elements.appLayout.classList.remove('opacity-0', 'scale-[0.98]');
                    }, 50);
        
                    showToast('Core synchronized.', 'success');
                    switchView('chat');
                    startStatsSimulation();
                    
                    // Load chat sessions from backend
                    loadChatsAndSessions(data.user);
                }, 300);
        
            } catch (err) {
                console.error(err);
                showToast(err.message || 'Authentication failed', 'error');
                elements.btnSubmitLogin.disabled = false;
                elements.btnSubmitLogin.innerHTML = state.authMode === 'login' ? 'Log In' : 'Register Operator';
            }
        });
    }

    // Switching views
    function switchView(viewName) {
        state.activeView = viewName;
        
        // Hide all views
        elements.viewChat.classList.add('view-hidden');
    

        // Reset nav highlights
        elements.navChatLi.classList.remove('nav-indicator-active', 'bg-surface-container/60', 'text-primary-fixed');

        // Show targets
         if (viewName === 'chat') {
            elements.viewChat.classList.remove('view-hidden');
            elements.navChatLi.classList.add('nav-indicator-active', 'bg-surface-container/60', 'text-primary-fixed');
            renderChatHistory();
            scrollChatToBottom(true);
        }
    }

    // Sidebar navigation event wiring
    elements.btnNavChat.addEventListener('click', () => switchView('chat'));
    elements.btnNavLogout.addEventListener('click', () => {
        state.isLoggedIn = false;
        state.currentUser = null;
        state.userId = null;
        state.sessions = [];
        state.activeChatSession = null;
        state.chatHistory = {};
        
        localStorage.removeItem("user_id");
        localStorage.removeItem("user_email");
        
        // Reset login form fields
        elements.passwordInput.value = '';
        elements.btnSubmitLogin.disabled = false;
        elements.btnSubmitLogin.innerHTML = 'Log In';

        // Animate logout
        elements.appLayout.classList.add('opacity-0', 'scale-[0.98]');
        setTimeout(() => {
            elements.appLayout.classList.add('hidden');
            elements.loginSection.style.display = 'flex';
            setTimeout(() => {
                elements.loginSection.classList.remove('view-hidden');
            }, 50);
            showToast('Core desynchronized. Access revoked.', 'warning');
        }, 300);
    });

    // Mobile Sidebar controls
    const mobileMenuOpenBtn = document.getElementById('mobile-menu-open');
    const mobileMenuCloseBtn = document.getElementById('mobile-menu-close');
    const sidebarElement = document.querySelector('aside');

    if (mobileMenuOpenBtn && mobileMenuCloseBtn && sidebarElement) {
        mobileMenuOpenBtn.addEventListener('click', () => {
            sidebarElement.classList.remove('-translate-x-full');
        });
        mobileMenuCloseBtn.addEventListener('click', () => {
            sidebarElement.classList.add('-translate-x-full');
        });
        
        // Auto-close menu drawer when selecting options in mobile
        [elements.btnNavChat, elements.btnNavLogout].forEach(btn => {
            btn.addEventListener('click', () => {
                if (window.innerWidth < 1024) {
                    sidebarElement.classList.add('-translate-x-full');
                }
            });
        });
    }

    // Load Chat Sessions from Database
    async function loadChatsAndSessions(userId) {
        try {
            const response = await fetch(`http://127.0.0.1:8000/load-chats/${userId}`);
            if (!response.ok) {
                throw new Error('Failed to load chat history');
            }
            const chats = await response.json();
            state.sessions = chats;
            
            // Initialize history cache for each loaded chat session
            chats.forEach(chat => {
                if (!state.chatHistory[chat.id]) {
                    state.chatHistory[chat.id] = [];
                }
            });
            
            renderChatSessionsList();
            
            // Select the first chat session if any exist
            if (chats.length > 0) {
                selectChatSession(chats[0].id, chats[0].title);
            } else {
                state.activeChatSession = null;
                elements.chatTitle.textContent = 'Orchestration Core';
                elements.chatMessagesContainer.innerHTML = `
                    <div class="flex flex-col items-center justify-center h-full text-center p-8 opacity-60">
                        <span class="material-symbols-outlined text-4xl mb-3 text-primary-fixed">quickreply</span>
                        <h3 class="text-sm font-bold text-primary">No Chat Session Active</h3>
                        <p class="text-xs text-on-surface-variant mt-1 max-w-xs">
                            Create a new chat session from the sidebar or start typing below to begin.
                        </p>
                    </div>
                `;
            }
        } catch (err) {
            console.error(err);
            showToast('Failed to load chat sessions.', 'error');
        }
    }

    // Render list of active chat sessions in the sidebar
    function renderChatSessionsList() {
        elements.sidebarChatSessions.innerHTML = '';
        
        if (state.sessions.length === 0) {
            elements.sidebarChatSessions.innerHTML = `
                <div class="px-4 py-3 text-xs text-on-surface-variant/40 italic">
                    No active sessions.
                </div>
            `;
            return;
        }
        
        state.sessions.forEach(session => {
            const isActive = state.activeChatSession === session.id;
            const li = document.createElement('li');
            li.className = `group relative flex items-center justify-between rounded-r-lg pr-2 hover:bg-surface-container-high/30 transition-all ${isActive ? 'bg-surface-container-high/35 border-l-2 border-primary-fixed' : ''}`;
            
            li.innerHTML = `
                <button data-id="${session.id}" class="session-item flex-grow flex items-center gap-2 px-3 py-2 text-xs font-semibold text-on-surface-variant hover:text-primary transition-colors text-left truncate">
                    <span class="material-symbols-outlined text-sm ${isActive ? 'text-primary-fixed' : ''}">quickreply</span>
                    <span class="chat-session-title truncate">${escapeHtml(session.title || 'FAQ Session')}</span>
                </button>
                <button data-id="${session.id}" class="btn-delete-session opacity-0 group-hover:opacity-100 text-on-surface-variant/60 hover:text-red-400 p-1 rounded transition-all cursor-pointer" title="Delete Session">
                    <span class="material-symbols-outlined text-[16px]">delete</span>
                </button>
            `;
            
            elements.sidebarChatSessions.appendChild(li);
        });
        
        // Wire click events
        const sessionBtns = elements.sidebarChatSessions.querySelectorAll('.session-item');
        sessionBtns.forEach(btn => {
            btn.addEventListener('click', () => {
        
                const sessionId = btn.getAttribute('data-id');
                const session = state.sessions.find(s => s.id === sessionId);
        
                if (session) {
        
                    switchView('chat');
        
                    selectChatSession(session.id, session.title);
                }
            });
        });
        // Wire delete events
        const deleteBtns = elements.sidebarChatSessions.querySelectorAll('.btn-delete-session');
        deleteBtns.forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation(); // prevent selecting the session
                const sessionId = btn.getAttribute('data-id');
                if (confirm('Are you sure you want to delete this chat session?')) {
                    await deleteChatSession(sessionId);
                }
            });
        });
    }

    // Select and load a chat session
    async function selectChatSession(sessionId, sessionTitle) {
        state.activeChatSession = sessionId;
        elements.chatTitle.textContent = sessionTitle || 'FAQ Session';
        
        renderChatSessionsList();
        
        elements.chatMessagesContainer.innerHTML = '';
        showTypingIndicator();
        
        try {
            const response = await fetch(`http://127.0.0.1:8000/load-messages/${sessionId}`);
            if (!response.ok) {
                throw new Error('Failed to load messages');
            }
            
            const messages = await response.json();
            removeTypingIndicator();
            
            state.chatHistory[sessionId] = messages.map(msg => {

                const sender =
                    (msg.role === 'user')
                    ? 'user'
                    : 'ai';
            
                const text = msg.content;
            
                const isFaq =
                    sender === 'ai'
                    &&
                    (
                        text.toLowerCase().includes(
                            "frequently asked questions"
                        )
                        ||
                        text.toLowerCase().includes(
                            "# frequently asked questions"
                        )
                        ||
                        text.includes(
                            "## 1."
                        )
                    );
            
                return {
            
                    sender: sender,
            
                    text: text,
            
                    timestamp: formatTimestamp(
                        msg.created_at
                    ),
            
                    isFaq: isFaq
            
                };
            
            });
            
            if (messages.length === 0) {

                showSuggestions();
            
            }
            
            else {
            
                hideSuggestions();
            
            }
            
            renderChatHistory();
            scrollChatToBottom(true);
            
        } catch (err) {
            console.error(err);
            removeTypingIndicator();
            showToast('Failed to load chat messages.', 'error');
        }
    }

    // Create a new chat session
    async function createNewSession(title = 'New Chat') {
        if (!state.userId) {
            showToast('Operator ID not synchronized.', 'error');
            return;
        }
        
        try {
            const response = await fetch('http://127.0.0.1:8000/create-chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    user_id: state.userId,
                    title: title
                })
            });
            
            if (!response.ok) {
                throw new Error('Failed to create session');
            }
            
            const newSession = await response.json();
            state.sessions.unshift(newSession);
            state.chatHistory[newSession.id] = [];
        
            
            showToast('New session synchronized.', 'success');
            await selectChatSession(newSession.id, newSession.title);
            showSuggestions();
            
        } catch (err) {
            console.error(err);
            showToast('Failed to create new session.', 'error');
        }
    }

    // Delete a chat session
    async function deleteChatSession(sessionId) {
        try {
            const response = await fetch(`http://127.0.0.1:8000/delete-chat/${sessionId}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                throw new Error('Failed to delete session');
            }
            
            state.sessions = state.sessions.filter(s => s.id !== sessionId);
            delete state.chatHistory[sessionId];
            
            showToast('Chat session deleted.', 'warning');
            
            if (state.activeChatSession === sessionId) {
                if (state.sessions.length > 0) {
                    const firstSession = state.sessions[0];
                    selectChatSession(firstSession.id, firstSession.title);
                } else {
                    state.activeChatSession = null;
                    elements.chatTitle.textContent = 'Orchestration Core';
                    elements.chatMessagesContainer.innerHTML = `
                        <div class="flex flex-col items-center justify-center h-full text-center p-8 opacity-60">
                            <span class="material-symbols-outlined text-4xl mb-3 text-primary-fixed">quickreply</span>
                            <h3 class="text-sm font-bold text-primary">No Chat Session Active</h3>
                            <p class="text-xs text-on-surface-variant mt-1 max-w-xs">
                                Create a new chat session from the sidebar or start typing below to begin.
                            </p>
                        </div>
                    `;
                    renderChatSessionsList();
                }
            } else {
                renderChatSessionsList();
            }
        } catch (err) {
            console.error(err);
            showToast('Failed to delete chat session.', 'error');
        }
    }

    // Helper: Save message to backend database
    async function saveMessageToDatabase(sessionId, role, content) {
        try {
            await fetch('http://127.0.0.1:8000/save-message', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    session_id: sessionId,
                    role: role,
                    content: content
                })
            });
        } catch (err) {
            console.error('Failed to save message to database:', err);
        }
    }

    // Render messages in chat stream container
    function renderChatHistory() {
        if (!state.activeChatSession) {
            elements.chatMessagesContainer.innerHTML = `
                <div class="flex flex-col items-center justify-center h-full text-center p-8 opacity-60">
                    <span class="material-symbols-outlined text-4xl mb-3 text-primary-fixed">quickreply</span>
                    <h3 class="text-sm font-bold text-primary">No Chat Session Active</h3>
                    <p class="text-xs text-on-surface-variant mt-1 max-w-xs">
                        Create a new chat session from the sidebar or start typing below to begin.
                    </p>
                </div>
            `;
            return;
        }
        
        const messages = state.chatHistory[state.activeChatSession]
        .forEach(message => {
        
            const messageElement =
                createMessageElement(
                    message.sender,
                    message.text,
                    message.timestamp,
                    message.isFaq
                );
        
            elements.chatMessagesContainer.appendChild(
                messageElement
            );
        
        });
    }

    function createMessageElement(
        sender,
        text,
        timestamp = null,
        isFaq = false
    ) {
        const div = document.createElement('div');
        div.className = `flex ${sender === 'user' ? 'justify-end' : 'justify-start'} mb-6`;
        
        const timeStr = timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        if (sender === 'user') {
            div.innerHTML = `
                <div class= "flex justify-end mb-6">
                    <div class="w-8 h-8 rounded-full flex-shrink-0 bg-gradient-to-tr from-secondary-container to-secondary border border-secondary/20 flex items-center justify-center text-xs font-bold text-on-surface shadow-[0_0_10px_rgba(255,255,255,0.05)]">
                        OP
                    </div>
                    <div class="flex flex-col items-end">
                        <div class="message-bubble-user rounded-xl p-4 text-on-surface text-sm leading-relaxed whitespace-pre-wrap">
                            ${escapeHtml(text)}
                        </div>
                        <span class="text-[10px] text-on-surface-variant/40 mt-1 mr-1 uppercase tracking-wider">${timeStr}</span>
                    </div>
                </div>
            `;
        } else {
            div.innerHTML = `
                <div class="flex items-start gap-3 max-w-[80%]">
                    <div class="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center relative overflow-hidden">
    
    <img
        src="./assets/globe.png"
        alt="AI Globe"
        class="chat-ai-globe"
    />

</div>
                    <div class="flex flex-col items-start">
                        <div class="message-bubble-ai rounded-xl p-4 text-on-surface text-sm leading-relaxed whitespace-pre-wrap">

    ${formatAiMessage(text)}

    ${
        isFaq
        ?
        `
        <button
            class="download-pdf-btn mt-5"
            data-faq="${encodeURIComponent(text)}"
        >
            <span class="material-symbols-outlined text-[18px]">
                download
            </span>

            Download PDF
        </button>
        `
        :
        ""
    }

</div>
                        <span class="text-[10px] text-on-surface-variant/40 mt-1 ml-1 uppercase tracking-wider">${timeStr}</span>
                    </div>
                </div>
            `;
        }
        return div;
    }

    // Scroll chat content box
    function scrollChatToBottom(instant = false) {
        setTimeout(() => {
            elements.chatMessagesContainer.scrollTo({
                top: elements.chatMessagesContainer.scrollHeight,
                behavior: instant ? 'auto' : 'smooth'
            });
        }, 50);
    }

    // Escaping helper
    function escapeHtml(unsafe) {
        if (!unsafe) return '';
        return unsafe
             .replace(/&/g, "&amp;")
             .replace(/</g, "&lt;")
             .replace(/>/g, "&gt;")
             .replace(/"/g, "&quot;")
             .replace(/'/g, "&#039;");
    }

    // Custom formatting for AI responses (code blocks and headers)
    function formatAiMessage(text) {

        let formatted = escapeHtml(text);
    
        // CODE BLOCKS
        formatted = formatted.replace(
            /```(\w*)\n([\s\S]*?)```/g,
            (match, lang, code) => {
                return `
                    <div class="my-4 overflow-hidden rounded-xl border border-outline-variant/20 bg-surface-container-lowest/90">
                        
                        <div class="flex items-center justify-between px-4 py-2 bg-surface-container-high border-b border-outline-variant/10">
                            <span class="text-[10px] uppercase tracking-wider text-primary-fixed font-bold">
                                ${lang || "code"}
                            </span>
                        </div>
    
                        <pre class="p-4 overflow-x-auto text-sm text-primary whitespace-pre-wrap"><code>${escapeHtml(code)}</code></pre>
                    </div>
                `;
            }
        );
    
        // MAIN HEADINGS #
        formatted = formatted.replace(
            /^# (.*$)/gim,
            '<h1 class="text-2xl font-bold text-primary-fixed mb-4 mt-6">$1</h1>'
        );
    
        // SUB HEADINGS ##
        formatted = formatted.replace(
            /^## (.*$)/gim,
            '<h2 class="text-xl font-bold text-primary mb-3 mt-5">$1</h2>'
        );
    
        // SMALL HEADINGS ###
        formatted = formatted.replace(
            /^### (.*$)/gim,
            '<h3 class="text-lg font-semibold text-primary mb-2 mt-4">$1</h3>'
        );
    
        // BOLD TEXT
        formatted = formatted.replace(
            /\*\*(.*?)\*\*/g,
            '<strong class="font-bold text-primary">$1</strong>'
        );
    
        // BULLET POINTS
        formatted = formatted.replace(
            /^\s*[-•]\s+(.*)$/gim,
            '<li class="ml-5 list-disc mb-2">$1</li>'
        );
    
        // PARAGRAPH SPACING
        formatted = formatted.replace(/\n\n/g, '<br><br>');
        formatted = formatted.replace(/\n/g, '<br>');
    
        return formatted;
    }

    // Active typing indicator simulator
    function showTypingIndicator() {
        if (document.getElementById('ai-typing-indicator')) return;
        const div = document.createElement('div');
        div.id = 'ai-typing-indicator';
        div.className = 'flex justify-start mb-6';
        div.innerHTML = `
            <div class="flex items-start gap-3 max-w-[80%]">
                <div class="w-10 h-10 flex-shrink-0 flex items-center justify-center">
    <img
        src="./assets/globe.png"
        alt="AI Globe"
        class="chat-ai-globe"
    />
</div>
                <div class="flex flex-col items-start">
                    <div class="message-bubble-ai rounded-xl px-5 py-4 text-on-surface-variant flex items-center gap-1">
                        <span class="w-2 h-2 rounded-full bg-primary-fixed dot-typing"></span>
                        <span class="w-2 h-2 rounded-full bg-primary-fixed dot-typing"></span>
                        <span class="w-2 h-2 rounded-full bg-primary-fixed dot-typing"></span>
                    </div>
                </div>
            </div>
        `;
        elements.chatMessagesContainer.appendChild(div);
        scrollChatToBottom();
    }

    function removeTypingIndicator() {
        const indicator = document.getElementById('ai-typing-indicator');
        if (indicator) {
            indicator.remove();
        }
    }

    function showSuggestions() {

        if (elements.suggestionContainer) {
    
            elements.suggestionContainer.classList.remove("hidden");
    
        }
    
    }
    
    function hideSuggestions() {
    
        if (elements.suggestionContainer) {
    
            elements.suggestionContainer.classList.add("hidden");
    
        }
    
    }

    function createUploadCard(files){

        const div = document.createElement("div");
    
        div.className = "flex justify-end mb-6";
    
        let rows = "";
    
        for(const file of files){
    
            rows += `
            <div class="upload-file-row">
    
                <div class="upload-file-icon">
                    <span class="material-symbols-outlined">
                        description
                    </span>
                </div>
    
                <div>
    
                    <div class="upload-file-name">
                        ${file.name}
                    </div>
    
                    <div class="upload-file-type">
                        ${file.type || "File"}
                    </div>
    
                </div>
    
            </div>
            `;
        }
    
        div.innerHTML = `
        <div class="flex items-start gap-3 max-w-[80%] flex-row-reverse">

            <div class="
                w-8 h-8
                rounded-full
                flex-shrink-0
                bg-gradient-to-tr
                from-secondary-container
                to-secondary
                border border-secondary/20
                flex items-center justify-center
                text-xs font-bold text-on-surface
                shadow-[0_0_10px_rgba(255,255,255,0.05)]
            ">
                OP
            </div>

            <div class="flex flex-col items-end">

                <div class="message-bubble-user rounded-xl p-4 text-on-surface text-sm">

                    <div class="upload-card">

                        ${rows}

                        <div class="upload-loader">

                            <div class="upload-dot"></div>
                            <div class="upload-dot"></div>
                            <div class="upload-dot"></div>

                        </div>

                    </div>

                </div>

            </div>

        </div>
        `;
    
        elements.chatMessagesContainer.appendChild(div);
    
        scrollChatToBottom();
    
        return div;
    }

    // Trigger user query submitting
    async function handleChatSubmit() {
        const text = elements.chatInput.value.trim();
        if (!text) return;
        hideSuggestions();

    
        elements.chatInput.value = '';
        elements.btnSendChat.classList.remove('text-primary-fixed', 'opacity-100');
    
        // If no session exists, create one first using prompt title
        if (!state.activeChatSession) {
            const promptTitle = text.length > 40
            ? text.substring(0, 40) + '...'
            : text;
            await createNewSession(promptTitle);
            if (!state.activeChatSession) return; // creation failed, abort
        }
        
        const currentSessionId = state.activeChatSession;
        const currentSession = state.sessions.find(
            s => s.id === currentSessionId
        );
        
        if (
            currentSession &&
            (
                currentSession.title === "New Chat" ||
                currentSession.title === "New FAQ Session"
            )
        ) {
        
            currentSession.title =
                text.length > 40
                    ? text.substring(0, 40) + "..."
                    : text;
        
            elements.chatTitle.textContent = currentSession.title;
        
            renderChatSessionsList();
            
            await fetch("http://127.0.0.1:8000/update-chat-title", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    session_id: currentSessionId,
                    title: currentSession.title
                })
            });
        }
        const timestamp = new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });
    
        // Add user message to UI
        const userEl = createMessageElement('user', text, timestamp);
        elements.chatMessagesContainer.appendChild(userEl);
        scrollChatToBottom();
        
        // Save user message to database in background
        saveMessageToDatabase(currentSessionId, 'user', text);
    
        showTypingIndicator();
    
        try {
            const response = await fetch("http://127.0.0.1:8000/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({

                    message: text,
                
                    session_id: currentSessionId
                
                })
            });
            
            if (!response.ok) {
                throw new Error('Response generation failed');
            }
    
            const data = await response.json();
            removeTypingIndicator();
    
            // Add AI message to UI
            const aiEl = createMessageElement(
                'ai',
                data.response,
                timestamp,
                data.is_faq
            );
            elements.chatMessagesContainer.appendChild(aiEl);
            const downloadBtn =
    aiEl.querySelector(".download-pdf-btn");

if (downloadBtn) {

    downloadBtn.addEventListener(
        "click",
        async () => {

            try {

                const response = await fetch(
                    "http://127.0.0.1:8000/download-faq-pdf",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type": "application/json"
                        },

                        body: JSON.stringify({
                            faq_content: decodeURIComponent(
                                downloadBtn.dataset.faq
                            )
                        })
                    }
                );

                const blob =
                    await response.blob();

                const url =
                    window.URL.createObjectURL(blob);

                const a =
                    document.createElement("a");

                a.href = url;

                a.download =
                    "faq_output.pdf";

                a.click();

                window.URL.revokeObjectURL(url);

                showToast(
                    "PDF downloaded successfully.",
                    "success"
                );

            }

            catch (error) {

                console.error(error);

                showToast(
                    "PDF download failed.",
                    "error"
                );

            }

        }
    );

}
            scrollChatToBottom();
    
            showToast('AI response generated.', 'success');
            
            // Save AI message to database in background
            saveMessageToDatabase(currentSessionId, 'assistant', data.response);
            
            // Cache in state
            if (!state.chatHistory[currentSessionId]) {
                state.chatHistory[currentSessionId] = [];
            }
            state.chatHistory[currentSessionId].push(
                { sender: 'user', text: text, timestamp: timestamp },
                { sender: 'ai', text: data.response, timestamp: timestamp }
            );
    
        } catch (err) {
            console.error(err);
            removeTypingIndicator();
            showToast('Backend connection failed.', 'error');
        }
    }

    // Input handlers
    if (elements.btnSendChat && elements.chatInput) {
        elements.btnSendChat.addEventListener('click', handleChatSubmit);
        elements.chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleChatSubmit();
            }
        });

        // Color send button when input exists
        elements.chatInput.addEventListener('input', () => {
            const hasText = elements.chatInput.value.trim().length > 0;
            if (hasText) {
                elements.btnSendChat.classList.add('text-primary-fixed', 'opacity-100');
            } else {
                elements.btnSendChat.classList.remove('text-primary-fixed', 'opacity-100');
            }
        });
    }

    // Suggestion Cards click wiring
    if (elements.suggestionCards) {
        elements.suggestionCards.forEach(card => {
            card.addEventListener('click', () => {
    
                const innerCard = card.querySelector('[data-prompt]');
                const prompt = innerCard?.getAttribute('data-prompt');
    
                if (prompt) {
                    elements.chatInput.value = prompt;
                    elements.btnSendChat.classList.add('text-primary-fixed', 'opacity-100');
                    handleChatSubmit();
                }
            });
        });
    }

    // Stats simulation for Dashboard to feel live
    let statsInterval;
    function startStatsSimulation() {
        if (statsInterval) clearInterval(statsInterval);
        
        statsInterval = setInterval(() => {
            if (!state.isLoggedIn || state.activeView !== 'dashboard') return;

            // Fluctuate CPU
            if (elements.statCpu) {
                const curCpu = parseFloat(elements.statCpu.textContent);
                const shift = (Math.random() - 0.5) * 4; // -2% to +2%
                const targetCpu = Math.min(Math.max(curCpu + shift, 1.2), 12.5);
                elements.statCpu.textContent = targetCpu.toFixed(1) + '%';
            }

            // Fluctuate API Latency
            if (elements.statLatency) {
                const curLatency = parseInt(elements.statLatency.textContent, 10);
                const shift = Math.floor((Math.random() - 0.5) * 12); // -6ms to +6ms
                const targetLatency = Math.min(Math.max(curLatency + shift, 120), 165);
                elements.statLatency.textContent = targetLatency + 'ms';
            }

            // Fluctuate active connections
            if (elements.statActiveSessions) {
                const curSessions = parseInt(elements.statActiveSessions.textContent, 10);
                if (Math.random() > 0.8) {
                    const shift = Math.random() > 0.5 ? 1 : -1;
                    const targetSessions = Math.min(Math.max(curSessions + shift, 8), 16);
                    elements.statActiveSessions.textContent = targetSessions;
                }
            }

        }, 3000);
    }

    // System Alert Toasts Creator
    window.showToast = function(message, type = 'success') {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `glass-card rounded-lg px-4 py-3 text-xs font-semibold flex items-center gap-2 transform translate-y-4 opacity-0 transition-all duration-300 border-l-4`;
        
        let icon = 'check_circle';
        if (type === 'success') {
            toast.classList.add('border-l-primary-fixed');
        } else if (type === 'error') {
            toast.classList.add('border-l-red-500');
            icon = 'error';
        } else if (type === 'warning') {
            toast.classList.add('border-l-yellow-500');
            icon = 'warning';
        }

        toast.innerHTML = `
            <span class="material-symbols-outlined text-[16px] text-primary-fixed">${icon}</span>
            <span class="text-on-surface">${message}</span>
        `;

        container.appendChild(toast);
        
        // Trigger reflow to animate
        toast.offsetHeight;
        toast.classList.remove('translate-y-4', 'opacity-0');

        setTimeout(() => {
            toast.classList.add('translate-y-[-10px]', 'opacity-0');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    };

    // Chat scroll button helper
    if (elements.chatScrollBottom) {
        elements.chatScrollBottom.addEventListener('click', () => scrollChatToBottom());
    }

    // Auto resize textareas
    const textareas = document.querySelectorAll('textarea');
    textareas.forEach(textarea => {
        textarea.addEventListener('input', () => {
            textarea.style.height = 'auto';
            textarea.style.height = textarea.scrollHeight + 'px';
        });
    });

    // Wire New Chat Button
    if (elements.btnNewChat) {
        elements.btnNewChat.addEventListener('click', () => {
            createNewSession();
        });
    }

    if (elements.btnUploadDocument) {

        elements.btnUploadDocument.addEventListener(
    
            "click",
    
            () => {
    
                elements.documentUpload.click();
    
            }
    
        );
    
    }

    if (elements.documentUpload) {

        elements.documentUpload.addEventListener(
    
            "change",
    
            async () => {
    
                let uploadCard;
                try {

                    const files =
                        elements.documentUpload.files;
                
                    if (!files.length) {
                
                        return;

                    }

                    uploadCard =
                        createUploadCard(files);

                        
    
                    const formData =
                        new FormData();
    
                    for (
    
                        let i = 0;
    
                        i < files.length;
    
                        i++
    
                    ) {
    
                        formData.append(
                            "files",
                            files[i]
                        );
    
                    }

                    formData.append(
                        "session_id",
                        state.activeChatSession
                    );
    
                    showToast(
                        "Uploading documents...",
                        "info"
                    );
    
                    const response =
                        await fetch(
    
                            "http://127.0.0.1:8000/upload-documents",
    
                            {
                                method: "POST",
    
                                body: formData
                            }
    
                        );
    
                    const data =
                        await response.json();
    
                    if (!response.ok) {
    
                        throw new Error(
                            data.error ||
                            "Upload failed"
                        );
    
                    }
    
                    showToast(
                        "Documents uploaded successfully.",
                        "success"
                    );

                    uploadCard.querySelector(".upload-loader").innerHTML = `
                    <div class="flex items-center gap-2 text-green-400 text-sm">

                        <span class="material-symbols-outlined">
                            check_circle
                        </span>

                        Uploaded

                    </div>
                    `;
                    
                    const uploadMessage = data.message;
                    
                    const timestamp =
                        new Date().toLocaleTimeString(
                            [],
                            {
                                hour: "2-digit",
                                minute: "2-digit"
                            }
                        );
                    
                    const aiEl =
                        createMessageElement(
                            "ai",
                            uploadMessage,
                            timestamp
                        );
                    
                    elements.chatMessagesContainer.appendChild(
                        aiEl
                    );
                    
                    scrollChatToBottom();
                    
                    if (
                        state.activeChatSession
                    ) {
                    
                        saveMessageToDatabase(
                            state.activeChatSession,
                            "assistant",
                            uploadMessage
                        );
                    
                        if (
                            !state.chatHistory[
                                state.activeChatSession
                            ]
                        ) {
                    
                            state.chatHistory[
                                state.activeChatSession
                            ] = [];
                    
                        }
                    
                        state.chatHistory[
                            state.activeChatSession
                        ].push(
                    
                            {
                                sender: "ai",
                    
                                text: uploadMessage,
                    
                                timestamp: timestamp
                            }
                    
                        );
                    
                    }

    
                }
    
                catch (error) {

                    console.error(error);
                
                    showToast(
                        "Document upload failed.",
                        "error"
                    );
                
                    if (uploadCard) {
                
                        uploadCard.querySelector(
                            ".upload-loader"
                        ).innerHTML = `
                            <div class="upload-success"
                                 style="color:#ff6b6b;">
                                ✗ Upload Failed
                            </div>
                        `;
                
                    }
                
                }
    
            }
    
        );
    
    }

    // Google Login button event listener
    if (elements.btnGoogleLogin) {

        elements.btnGoogleLogin.addEventListener('click', async () => {
    
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: 'http://localhost:5500'
                }
            });
    
            if (error) {
                console.error(error);
                showToast("Google login failed", "error");
            }
        });
    }

    // Helper: format timestamp from ISO string
    function formatTimestamp(dateStr) {
        if (!dateStr) return '';
        try {
            const date = new Date(dateStr);
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch (e) {
            return '';
        }
    }

    // Helper: Decode Supabase JWT payload
    function decodeJwt(token) {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            return JSON.parse(jsonPayload);
        } catch (e) {
            console.error("JWT decoding failed", e);
            return null;
        }
    }

    // Handle Google OAuth redirect
(async () => {

    const { data, error } = await supabase.auth.getSession();

    if (error) {
        console.error(error);
        return;
    }

    const session = data.session;

    if (session && session.user) {

        const user = session.user;

        // SAVE USER
        localStorage.setItem("user_id", user.id);
        localStorage.setItem("user_email", user.email);

        // UPDATE STATE
        state.isLoggedIn = true;
        state.currentUser = user.email;
        state.userId = user.id;

        // UPDATE UI
        elements.sidebarUserEmail.textContent = user.email;

        // HIDE LOGIN
        elements.loginSection.style.display = "none";

        // SHOW APP
        elements.appLayout.classList.remove("hidden");

        setTimeout(() => {
            elements.appLayout.classList.remove(
                "opacity-0",
                "scale-[0.98]"
            );
        }, 50);

        // LOAD APP
        switchView("chat");
        startStatsSimulation();
        loadChatsAndSessions(user.id);

        showToast("Google login successful.", "success");
    }

})();

    // AUTO LOGIN (Runs after initial elements and state setup)
    const savedUser = localStorage.getItem("user_email");
    const savedUserId = localStorage.getItem("user_id");

    if (savedUser && savedUserId) {
        state.isLoggedIn = true;
        state.currentUser = savedUser;
        state.userId = savedUserId;

        elements.loginSection.style.display = 'none';
        elements.appLayout.classList.remove('hidden');

        setTimeout(() => {
            elements.appLayout.classList.remove('opacity-0', 'scale-[0.98]');
        }, 50);

        switchView('chat');
        startStatsSimulation();
        loadChatsAndSessions(savedUserId);
    }
});
