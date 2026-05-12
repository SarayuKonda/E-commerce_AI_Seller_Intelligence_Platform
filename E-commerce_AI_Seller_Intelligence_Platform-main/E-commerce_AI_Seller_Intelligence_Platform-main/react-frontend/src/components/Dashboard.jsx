const COLOR_MAP = {
  black: '#1A1A1A', red: '#C0392B', white: '#F0F0F0',
  blue: '#2980B9', green: '#27AE60', pink: '#E91E8F',
  silver: '#BDC3C7', unknown: '#CCC',
};

function ProductCard({ p }) {
  const sales  = p.estimated_sales > 0
    ? `${p.estimated_sales.toLocaleString()} est.`
    : p.bought_last_month || '';
  const hex    = COLOR_MAP[p.color] || COLOR_MAP.unknown;
  const hasUrl = p.product_url && p.product_url !== 'N/A';

  return (
    <div
      className="product-card"
      onClick={() => hasUrl && window.open(p.product_url, '_blank')}
      title={hasUrl ? 'View on Amazon' : ''}
    >
      <img
        className="product-img"
        src={p.image}
        alt={p.title}
        loading="lazy"
        onError={e => { e.target.src = 'https://via.placeholder.com/280x180?text=No+Image'; }}
      />
      <div className="product-info">
        <p className="product-title">{p.title}</p>
        <div className="product-meta">
          <span className="product-price">₹{p.price}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className="product-sales">{sales}</span>
            <span className="product-color-dot" style={{ background: hex }} title={p.color} />
          </span>
        </div>
        {hasUrl && <span className="product-amazon-tag">🔗 View on Amazon ↗</span>}
      </div>
    </div>
  );
}

export default function Dashboard({ data, visible, dashboardRef }) {
  if (!visible || !data) return null;

  const { products = [], recommendation = {}, ai = {} } = data;

  return (
    <section className="dashboard" id="dashboard" ref={dashboardRef}>
      <div className="dashboard-container">
        <h2 className="section-title">Market Intelligence</h2>
        <div className="section-divider" />

        {/* KPI Row */}
        <div className="kpi-row">
          <div className="kpi-card">
            <span className="kpi-value">{products.length || '—'}</span>
            <span className="kpi-label">Products Scanned</span>
          </div>
          <div className="kpi-card">
            <span className="kpi-value">
              {(recommendation.best_color_to_sell || ai.color || '—').toUpperCase()}
            </span>
            <span className="kpi-label">Best Color to Sell</span>
          </div>
          <div className="kpi-card">
            <span className="kpi-value">
              ₹{recommendation.recommended_price || '—'}
            </span>
            <span className="kpi-label">Recommended Price</span>
          </div>
        </div>

        {/* AI Insights */}
        <div className="insights-panel" id="insights">
          <h3 className="panel-title">🤖 AI Recommendation</h3>
          <div className="insight-content">
            <p>{ai.reason || 'No AI insights available yet.'}</p>
          </div>
          <div className="insight-badges">
            {ai.color      && <span className="badge">🎨 {ai.color}</span>}
            {ai.price_range && <span className="badge">💰 ₹{ai.price_range}</span>}
          </div>
        </div>

        {/* Products Grid */}
        <h3 className="panel-title">📦 Top Products</h3>
        <div className="products-grid">
          {products.slice(0, 9).map((p, i) => (
            <ProductCard key={i} p={p} />
          ))}
        </div>
      </div>
    </section>
  );
}
