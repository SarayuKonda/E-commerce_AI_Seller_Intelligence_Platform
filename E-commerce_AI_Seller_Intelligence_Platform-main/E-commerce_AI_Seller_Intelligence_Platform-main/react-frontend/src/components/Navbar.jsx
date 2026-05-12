import { useState, useEffect } from 'react';

export default function Navbar({ musicPlaying, onMusicToggle, onScrollTo }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="nav-container">
        <a href="#" className="nav-brand">
          <span className="brand-icon">☀</span>
          <span>SOLAR INTEL</span>
        </a>

        <ul className={`nav-links ${menuOpen ? 'open' : ''}`}>
          <li><button className="nav-link active" onClick={() => onScrollTo('features')}>Product</button></li>
          <li><button className="nav-link" onClick={() => onScrollTo('dashboard')}>Market Data</button></li>
          <li><button className="nav-link" onClick={() => onScrollTo('insights')}>Insights</button></li>
        </ul>

        <div className="nav-right">
          {/* Music toggle */}
          <button
            className={`music-btn ${musicPlaying ? 'playing' : ''}`}
            onClick={onMusicToggle}
            title={musicPlaying ? 'Pause music' : 'Play music'}
          >
            <div className={`music-bars ${musicPlaying ? '' : 'paused'}`}>
              <span /><span /><span /><span />
            </div>
            {musicPlaying ? 'Music On' : 'Music Off'}
          </button>

          <button className="btn-nav btn" onClick={() => onScrollTo('analyze')}>Get Started</button>

          <button
            className="nav-hamburger"
            onClick={() => setMenuOpen(o => !o)}
            aria-label="Toggle menu"
          >
            <span /><span /><span />
          </button>
        </div>
      </div>
    </nav>
  );
}
