export default function Showcase() {
  return (
    <section className="showcase" id="showcase">
      <div className="showcase-container">
        <div className="showcase-image">
          <img
            src="https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&q=80"
            alt="Modern workspace"
          />
        </div>
        <div className="showcase-stat">
          <span className="stat-number">98%</span>
          <span className="stat-label">Prediction accuracy for seasonal demand trends.</span>
        </div>
      </div>
    </section>
  );
}
