import { useState } from 'react';

// API uses relative paths — Vite proxy forwards to Flask on port 8000
const API_BASE = '';


export default function AnalyzeSection({ onAnalysisComplete, analysisRef }) {
  const [query, setQuery]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [status, setStatus]     = useState({ msg: '', type: '' });

  const triggerScrape = async () => {
    if (!query.trim()) { setStatus({ msg: 'Please enter a product name.', type: 'error' }); return; }
    setLoading(true);
    setStatus({ msg: '🔍 Scraping market data... this may take 30–60 seconds.', type: 'loading' });

    try {
      const res  = await fetch(`${API_BASE}/scrape`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus({ msg: '✅ ' + data.message, type: 'success' });
        onAnalysisComplete(query.trim());
      } else {
        setStatus({ msg: '❌ ' + (data.error || 'Scrape failed'), type: 'error' });
      }
    } catch {
      setStatus({ msg: '❌ Cannot reach backend. Is Flask running on port 3000?', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="analyze-section" id="analyze" ref={analysisRef}>
      <div className="analyze-container">
        <h2 className="section-title">Begin Analysis</h2>
        <div className="section-divider" />
        <p className="analyze-subtitle">Enter a product name and let our AI do the heavy lifting.</p>

        <div className="search-box">
          <input
            type="text"
            className="search-input"
            placeholder="e.g. wireless mouse, water bottle, phone case..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && triggerScrape()}
          />
          <button
            className="btn btn-primary search-btn"
            onClick={triggerScrape}
            disabled={loading}
          >
            {loading ? <span className="btn-loader" /> : <span>Analyze</span>}
          </button>
        </div>

        {status.msg && (
          <div className={`status-msg ${status.type}`}>{status.msg}</div>
        )}
      </div>
    </section>
  );
}
