import { useState, useRef, useEffect } from 'react';
import { marked } from 'marked';

// API uses relative paths — Vite proxy forwards to Flask on port 8000
const API_BASE = '';

// Configure marked for clean output
marked.setOptions({ breaks: true, gfm: true });

const CHIPS = [
  { label: '📋 Full Business Plan',      msg: 'Give me a full business plan to start selling this product in my region' },
  { label: '📱 Social Media Strategy',   msg: 'What is the best social media strategy for my target region and audience?' },
  { label: '🎬 Video & Mockup Prompts',  msg: 'Give me Instagram Reel scripts and video prompts for this product. Include Midjourney mockup prompts.' },
  { label: '🏭 Sourcing & Manufacturing',msg: 'Where and how do I manufacture or source this product in India? What is the cost breakdown?' },
  { label: '📅 30-Day Content Calendar', msg: 'Give me a 30-day content calendar for Instagram and YouTube Shorts for my region' },
  { label: '💰 Pricing & Margins',       msg: 'How should I price this product and structure my profit margins?' },
];

const REGIONS = [
  { value: 'Pan India',                                  label: '🇮🇳 Pan India' },
  { value: 'Telugu States (Andhra Pradesh & Telangana)', label: '🌶 Telugu States (AP & Telangana)' },
  { value: 'Tamil Nadu',                                 label: '🏛 Tamil Nadu' },
  { value: 'Maharashtra',                                label: '🌆 Maharashtra' },
  { value: 'North India (Delhi, UP, Punjab)',             label: '🏔 North India' },
  { value: 'Karnataka',                                  label: '🌿 Karnataka' },
  { value: 'Kerala',                                     label: '🌴 Kerala' },
  { value: 'West Bengal',                                label: '🎭 West Bengal' },
];

const AUDIENCES = [
  { value: 'General consumers (age 20-45)',      label: 'General Consumers' },
  { value: 'Young adults & students (age 18-25)',label: 'Young Adults & Students' },
  { value: 'Homemakers & families',              label: 'Homemakers & Families' },
  { value: 'Working professionals (age 25-40)', label: 'Working Professionals' },
  { value: 'Small business owners',             label: 'Small Business Owners' },
  { value: 'Fitness enthusiasts',               label: 'Fitness Enthusiasts' },
  { value: 'Rural & semi-urban buyers',         label: 'Rural & Semi-Urban Buyers' },
];

// ─── Markdown bubble component ────────────────────────────
function AiBubble({ content }) {
  const html = marked.parse(content || '');
  return (
    <div
      className="chat-bubble ai"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export default function ChatBot({ productQuery, visible }) {
  const [open, setOpen]           = useState(false);
  const [messages, setMessages]   = useState([]);
  const [history, setHistory]     = useState([]);
  const [input, setInput]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [chipsOpen, setChipsOpen] = useState(true);  // X button controls this now
  const [region, setRegion]       = useState('Pan India');
  const [audience, setAudience]   = useState('General consumers (age 20-45)');
  const msgsRef  = useRef(null);
  const inputRef = useRef(null);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    if (msgsRef.current) msgsRef.current.scrollTop = msgsRef.current.scrollHeight;
  }, [messages, loading]);

  const toggleChat = () => {
    setOpen(o => {
      if (!o) setTimeout(() => inputRef.current?.focus(), 420);
      return !o;
    });
  };

  const addMessage = (content, role) =>
    setMessages(prev => [...prev, { content, role, id: Date.now() + Math.random() }]);

  // Typewriter effect — streams text char by char
  const typewrite = (text) => {
    const id = Date.now();
    setMessages(prev => [...prev, { content: '', role: 'ai', id, streaming: true }]);
    let i = 0;
    const iv = setInterval(() => {
      i++;
      setMessages(prev =>
        prev.map(m => m.id === id ? { ...m, content: text.slice(0, i) } : m)
      );
      if (i >= text.length) {
        clearInterval(iv);
        setMessages(prev => prev.map(m => m.id === id ? { ...m, streaming: false } : m));
      }
    }, 8);
  };

  const send = async (overrideMsg) => {
    const msg = (overrideMsg || input).trim();
    if (!msg || loading) return;
    setInput('');
    setLoading(true);
    addMessage(msg, 'user');
    const newHistory = [...history, { role: 'user', content: msg }];

    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msg,
          history: newHistory.slice(-8),
          region,
          audience,
          product_query: productQuery || 'your product',
        }),
      });
      const data = await res.json();
      const reply = data.reply || 'Sorry, something went wrong.';
      typewrite(reply);
      setHistory([...newHistory, { role: 'assistant', content: reply }]);
    } catch {
      addMessage('❌ Cannot reach backend. Is Flask running?', 'ai');
    } finally {
      setLoading(false);
    }
  };

  if (!visible) return null;

  return (
    <>
      {/* FAB */}
      <button className="chat-fab" onClick={toggleChat}>
        <span className="chat-fab-icon">🤖</span>
        <span className="chat-fab-label">Ask AI Strategist</span>
      </button>

      {/* Overlay */}
      {open && <div className="chat-overlay" onClick={toggleChat} />}

      {/* Panel */}
      <div className={`chat-panel ${open ? 'open' : ''}`}>

        {/* Header */}
        <div className="chat-panel-header">
          <div className="chat-header-info">
            <span className="chat-header-icon">☀</span>
            <div>
              <h3 className="chat-header-title">AI Strategist</h3>
              <p className="chat-header-sub">
                {productQuery ? `Analyzing: ${productQuery.slice(0, 30)}` : 'Ready to help you sell'}
              </p>
            </div>
          </div>
          <button className="chat-close-btn" onClick={toggleChat}>✕</button>
        </div>

        {/* Context selectors */}
        <div className="chat-context-bar">
          <div className="chat-context-field">
            <label className="chat-context-label">Target Region</label>
            <select className="chat-context-select" value={region} onChange={e => setRegion(e.target.value)}>
              {REGIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          <div className="chat-context-field">
            <label className="chat-context-label">Target Audience</label>
            <select className="chat-context-select" value={audience} onChange={e => setAudience(e.target.value)}>
              {AUDIENCES.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
            </select>
          </div>
        </div>

        {/* Messages */}
        <div className="chat-messages" ref={msgsRef}>
          <div className="chat-welcome">
            <p className="chat-welcome-text">
              I&apos;m your AI Business Strategist, trained on your real market data.
              Ask me anything about selling this product.
            </p>
          </div>

          {messages.map(m =>
            m.role === 'ai'
              ? <AiBubble key={m.id} content={m.content} />
              : <div key={m.id} className="chat-bubble user">{m.content}</div>
          )}

          {loading && (
            <div className="chat-typing">
              <span /><span /><span />
            </div>
          )}
        </div>

        {/* Starter chips — stays visible until user clicks X */}
        <div className={`chat-chips-wrapper ${chipsOpen ? 'chips-open' : 'chips-closed'}`}>
          <div className="chat-chips-header">
            <span className="chips-label">Quick Strategy Options</span>
            <button
              className="chips-toggle-btn"
              onClick={() => setChipsOpen(o => !o)}
              title={chipsOpen ? 'Collapse' : 'Expand'}
            >
              {chipsOpen ? '✕' : '＋'}
            </button>
          </div>
          {chipsOpen && (
            <div className="chat-chips">
              {CHIPS.map(c => (
                <button key={c.label} className="chip" onClick={() => send(c.msg)}>
                  {c.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Input area */}
        <div className="chat-input-area">
          <textarea
            ref={inputRef}
            className="chat-input"
            placeholder="Ask about strategy, social media, sourcing, pricing..."
            rows={1}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            onInput={e => {
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
            }}
          />
          <button className="chat-send-btn" onClick={() => send()} disabled={loading}>➤</button>
        </div>
      </div>
    </>
  );
}
