const FEATURES = [
  {
    num: '01',
    title: 'Enter Product Name',
    desc: 'Define your niche or existing product. Our engine accepts everything from raw concepts to specific SKUs.',
  },
  {
    num: '02',
    title: 'Real-Time Analysis',
    desc: 'The system scans across Amazon India, social mentions, and pricing trends to build a data tapestry.',
  },
  {
    num: '03',
    title: 'Get AI Insights',
    desc: 'Receive a curated dashboard of actionable intelligence, pricing strategies, and feature prioritizations.',
  },
];

export default function Features({ onAnalyze }) {
  return (
    <>
      <section className="masterclass" id="masterclass">
        <h2 className="section-title">Market<br />Masterclasses</h2>
        <div className="section-divider" />
      </section>

      <section className="features" id="features">
        <div className="features-container">
          {FEATURES.map(f => (
            <div className="feature-card" key={f.num}>
              <span className="feature-number">{f.num}</span>
              <h3 className="feature-title">{f.title}</h3>
              <p className="feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
        <div className="features-cta">
          <button className="btn btn-primary" onClick={onAnalyze}>
            START YOUR FIRST SCAN
          </button>
        </div>
      </section>
    </>
  );
}
