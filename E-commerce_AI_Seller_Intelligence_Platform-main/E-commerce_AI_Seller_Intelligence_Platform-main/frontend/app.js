/* ═══════════ Solar Intel — Frontend Logic ═══════════ */

const API_BASE = window.location.origin.includes('127.0.0.1') || window.location.origin.includes('localhost')
    ? window.location.origin
    : 'http://127.0.0.1:5000';

// ── Nav scroll effect ──
window.addEventListener('scroll', () => {
    document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 40);
});

// ── Hamburger toggle ──
document.getElementById('nav-hamburger').addEventListener('click', () => {
    document.getElementById('nav-links').classList.toggle('open');
});

// ── Scroll helper ──
function scrollToSection(id) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ── Intersection Observer for reveal animations ──
const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.15 });

document.querySelectorAll('.feature-card, .kpi-card, .showcase-stat, .insights-panel, .product-card')
    .forEach(el => { el.classList.add('reveal'); observer.observe(el); });

// ── Status message helper ──
function showStatus(msg, type) {
    const el = document.getElementById('status-msg');
    el.textContent = msg;
    el.className = `status-msg ${type}`;
}

// ── Color map for product dots ──
const COLOR_MAP = {
    black: '#1A1A1A', red: '#C0392B', white: '#F0F0F0',
    blue: '#2980B9', green: '#27AE60', pink: '#E91E8F',
    silver: '#BDC3C7', unknown: '#CCC'
};

// ═══════════ HANDLE "Analyze Now" ═══════════
function handleAnalyze() {
    scrollToSection('analyze');
    document.getElementById('search-input').focus();
}

// ═══════════ TRIGGER SCRAPE ═══════════
async function triggerScrape() {
    const query = document.getElementById('search-input').value.trim();
    if (!query) { showStatus('Please enter a product name.', 'error'); return; }

    const btn = document.getElementById('btn-search');
    const loader = document.getElementById('search-loader');
    btn.querySelector('.btn-text').textContent = 'Scanning...';
    loader.classList.remove('hidden');
    btn.disabled = true;
    showStatus('🔍 Scraping market data... this may take 30-60 seconds.', 'loading');

    try {
        const res = await fetch(`${API_BASE}/scrape`, { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: query })
        });
        const data = await res.json();
        if (res.ok) {
            showStatus('✅ ' + data.message, 'success');
            await loadDashboard();
        } else {
            showStatus('❌ ' + (data.error || 'Scrape failed'), 'error');
        }
    } catch (err) {
        showStatus('❌ Cannot reach backend. Is Flask running on port 5000?', 'error');
    } finally {
        btn.querySelector('.btn-text').textContent = 'Analyze';
        loader.classList.add('hidden');
        btn.disabled = false;
    }
}

// ═══════════ LOAD DEMO DATA ═══════════
async function loadDemoData() {
    showStatus('Loading demo data...', 'loading');
    await loadDashboard();
}

// ═══════════ LOAD DASHBOARD ═══════════
async function loadDashboard() {
    try {
        const res = await fetch(`${API_BASE}/dashboard`);
        const data = await res.json();
        renderDashboard(data);
    } catch {
        // Try individual endpoints as fallback
        try {
            const [prodRes, recRes, aiRes] = await Promise.all([
                fetch(`${API_BASE}/products`),
                fetch(`${API_BASE}/recommendation`),
                fetch(`${API_BASE}/ai-recommendation`)
            ]);
            const data = {
                products: await prodRes.json(),
                recommendation: await recRes.json(),
                ai: await aiRes.json()
            };
            renderDashboard(data);
        } catch {
            showStatus('❌ Cannot load data. Ensure Flask backend is running.', 'error');
        }
    }
}

// ═══════════ RENDER DASHBOARD ═══════════
function renderDashboard(data) {
    const { products, recommendation, ai } = data;
    const dash = document.getElementById('dashboard');
    dash.classList.remove('hidden');

    // KPIs
    const prodArr = Array.isArray(products) ? products : [];
    document.getElementById('kpi-products-val').textContent = prodArr.length || '—';
    document.getElementById('kpi-color-val').textContent =
        (recommendation.best_color_to_sell || ai.color || '—').toUpperCase();
    document.getElementById('kpi-price-val').textContent =
        '₹' + (recommendation.recommended_price || '—');

    // AI Insight
    document.getElementById('ai-reason').textContent = ai.reason || 'No AI insights available yet.';
    const badges = document.getElementById('insight-badges');
    badges.innerHTML = '';
    if (ai.color) badges.innerHTML += `<span class="badge">🎨 ${ai.color}</span>`;
    if (ai.price_range) badges.innerHTML += `<span class="badge">💰 ₹${ai.price_range}</span>`;

    // Products grid
    const grid = document.getElementById('products-grid');
    grid.innerHTML = '';
    prodArr.slice(0, 9).forEach(p => {
        const sales = p.estimated_sales > 0 ? `${p.estimated_sales.toLocaleString()} est.` : p.bought_last_month || '';
        const colorHex = COLOR_MAP[p.color] || COLOR_MAP.unknown;
        const hasUrl = p.product_url && p.product_url !== 'N/A';
        const cardClick = hasUrl ? `onclick="window.open('${p.product_url}','_blank')"` : '';
        grid.innerHTML += `
            <div class="product-card reveal visible" ${cardClick} title="${hasUrl ? 'View on Amazon' : ''}">
                <img class="product-img" src="${p.image}" alt="${p.title}" loading="lazy"
                     onerror="this.src='https://via.placeholder.com/280x180?text=No+Image'">
                <div class="product-info">
                    <p class="product-title">${p.title}</p>
                    <div class="product-meta">
                        <span class="product-price">₹${p.price}</span>
                        <span>
                            <span class="product-sales">${sales}</span>
                            <span class="product-color-dot" style="background:${colorHex}" title="${p.color}"></span>
                        </span>
                    </div>
                    ${hasUrl ? '<span class="product-amazon-tag">🔗 View on Amazon ↗</span>' : ''}
                </div>
            </div>`;
    });

    showStatus('', '');
    document.getElementById('status-msg').classList.add('hidden');
    setTimeout(() => scrollToSection('dashboard'), 300);
    // Show AI Strategist FAB with product context
    const productQuery = document.getElementById('search-input').value.trim() || 'your product';
    showChatFab(productQuery);
}

// ═══════════ ENTER KEY SUPPORT ═══════════
document.getElementById('search-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') triggerScrape();
});

// ═══════════ CHATBOT STATE ═══════════
let chatOpen = false;
let chatHistory = []; // [{role, content}]
let currentProduct = '';

// ── Show FAB after dashboard loads ──
function showChatFab(productQuery) {
    currentProduct = productQuery;
    const fab = document.getElementById('chat-fab');
    fab.classList.remove('hidden');
    document.getElementById('chat-product-label').textContent =
        `Analyzing: ${productQuery.slice(0, 30)}${productQuery.length > 30 ? '...' : ''}`;
}

// ── Toggle panel open/close ──
function toggleChat() {
    chatOpen = !chatOpen;
    document.getElementById('chat-panel').classList.toggle('open', chatOpen);
    document.getElementById('chat-overlay').classList.toggle('hidden', !chatOpen);
    if (chatOpen) setTimeout(() => document.getElementById('chat-input').focus(), 400);
}

// ── Send a starter chip ──
function sendChip(text) {
    document.getElementById('chat-input').value = text;
    sendChat();
    // Hide chips after first use
    document.getElementById('chat-chips').style.display = 'none';
}

// ── Add a bubble to the chat ──
function addBubble(text, role) {
    const msgs = document.getElementById('chat-messages');
    const div = document.createElement('div');
    div.className = `chat-bubble ${role}`;
    div.textContent = text;
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
    return div;
}

// ── Show typing indicator ──
function showTyping() {
    const msgs = document.getElementById('chat-messages');
    const el = document.createElement('div');
    el.className = 'chat-typing'; el.id = 'chat-typing-el';
    el.innerHTML = '<span></span><span></span><span></span>';
    msgs.appendChild(el);
    msgs.scrollTop = msgs.scrollHeight;
}
function hideTyping() {
    const el = document.getElementById('chat-typing-el');
    if (el) el.remove();
}

// ── Typewriter effect ──
function typewriterBubble(text) {
    const msgs = document.getElementById('chat-messages');
    const div = document.createElement('div');
    div.className = 'chat-bubble ai';
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
    let i = 0;
    const interval = setInterval(() => {
        div.textContent += text[i] || '';
        i++;
        msgs.scrollTop = msgs.scrollHeight;
        if (i >= text.length) clearInterval(interval);
    }, 12);
}

// ── Main send function ──
async function sendChat() {
    const input = document.getElementById('chat-input');
    const msg = input.value.trim();
    if (!msg) return;

    const sendBtn = document.getElementById('chat-send');
    input.value = '';
    input.style.height = 'auto';
    sendBtn.disabled = true;

    // Add user bubble & save to history
    addBubble(msg, 'user');
    chatHistory.push({ role: 'user', content: msg });

    const region = document.getElementById('chat-region').value;
    const audience = document.getElementById('chat-audience').value;

    showTyping();

    try {
        const res = await fetch(`${API_BASE}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: msg,
                history: chatHistory.slice(-8), // last 8 turns for context
                region,
                audience,
                product_query: currentProduct
            })
        });
        const data = await res.json();
        hideTyping();
        const reply = data.reply || 'Sorry, something went wrong.';
        typewriterBubble(reply);
        chatHistory.push({ role: 'assistant', content: reply });
    } catch {
        hideTyping();
        addBubble('❌ Cannot reach backend. Is Flask running?', 'ai');
    } finally {
        sendBtn.disabled = false;
        input.focus();
    }
}

// ── Enter key in chat input (Shift+Enter = newline) ──
document.getElementById('chat-input').addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChat(); }
});

// ── Auto-resize textarea ──
document.getElementById('chat-input').addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 120) + 'px';
});
