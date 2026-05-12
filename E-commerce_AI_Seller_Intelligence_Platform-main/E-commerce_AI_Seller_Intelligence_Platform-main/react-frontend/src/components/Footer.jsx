export default function Footer() {
  return (
    <footer className="footer" id="footer">
      <div className="footer-container">
        <div className="footer-top">
          <div className="footer-brand">
            <span className="brand-icon">☀</span>
            <span>Solar Atelier Intelligence</span>
          </div>
          <div className="footer-credits">
            <p>Developed by <strong>Anna Vamsi Krishna Raja</strong></p>
            <div>
              <span className="tech-label">TECHNOLOGY STACK</span>
              <p className="tech-tags">React • Flask • OpenRouter AI • Selenium</p>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p className="footer-copy">© 2024 SOLAR ATELIER INTELLIGENCE. DEFINED BY LIGHT.</p>
          <ul className="footer-links">
            <li><a href="#">THE PRODUCT</a></li>
            <li><a href="#">EDITORIAL</a></li>
            <li><a href="#">ATELIER</a></li>
            <li><a href="#">TERMS</a></li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
