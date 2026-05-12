import { useRef, useEffect, forwardRef, useImperativeHandle, useCallback } from 'react';

const HERO_VIDEO = 'https://videos.pexels.com/video-files/4480977/4480977-hd_1920_1080_25fps.mp4';
const MUSIC_SRC = '/music.m4a';

const MAX_VOLUME = 0.75;  // peak volume (0–1)
const FADE_MS = 3000;  // fade duration in milliseconds
const STEPS = 60;    // number of interval ticks for the fade

const Hero = forwardRef(function Hero({ onAnalyze, onDemo, musicPlaying, onMusicStateChange }, ref) {
  const sectionRef = useRef(null);
  const audioRef = useRef(null);
  const fadeTimer = useRef(null);
  // Refs so IntersectionObserver closure always sees fresh values
  const heroVisible = useRef(true);   // hero starts at the top = visible
  const musicEnabled = useRef(musicPlaying);

  // Keep musicEnabled ref in sync with the prop
  useEffect(() => {
    musicEnabled.current = musicPlaying;
  }, [musicPlaying]);

  // ─── helpers ─────────────────────────────────────────────
  const clearFade = useCallback(() => {
    if (fadeTimer.current) {
      clearInterval(fadeTimer.current);
      fadeTimer.current = null;
    }
  }, []);

  const fadeIn = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    clearFade();
    audio.volume = 0;
    audio
      .play()
      .then(() => {
        onMusicStateChange(true);
        const increment = MAX_VOLUME / STEPS;
        fadeTimer.current = setInterval(() => {
          const next = Math.min(audio.volume + increment, MAX_VOLUME);
          audio.volume = next;
          if (next >= MAX_VOLUME) clearFade();
        }, FADE_MS / STEPS);
      })
      .catch(() => {
        // Browser blocked autoplay — silently fail; Navbar button still works
      });
  }, [clearFade, onMusicStateChange]);

  const fadeOut = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || audio.paused) return;
    clearFade();
    const startVol = audio.volume;
    const decrement = startVol / STEPS;
    fadeTimer.current = setInterval(() => {
      const next = Math.max(audio.volume - decrement, 0);
      audio.volume = next;
      if (next <= 0) {
        clearFade();
        audio.pause();
      }
    }, FADE_MS / STEPS);
  }, [clearFade]);

  // ─── IntersectionObserver: watch the hero section ────────
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        heroVisible.current = entry.isIntersecting;

        if (entry.isIntersecting && musicEnabled.current) {
          // Scrolled back into hero — fade music in
          fadeIn();
        } else if (!entry.isIntersecting) {
          // Scrolled away from hero — fade music out
          fadeOut();
        }
      },
      { threshold: 0.25 }   // trigger when ≥25% of hero is visible
    );

    observer.observe(section);
    return () => { observer.disconnect(); clearFade(); };
  }, [fadeIn, fadeOut, clearFade]);

  // ─── Navbar music toggle ──────────────────────────────────
  useEffect(() => {
    if (musicPlaying && heroVisible.current) {
      fadeIn();
    } else if (!musicPlaying) {
      fadeOut();
    }
  }, [musicPlaying, fadeIn, fadeOut]);

  // Cleanup on unmount
  useEffect(() => () => clearFade(), [clearFade]);

  useImperativeHandle(ref, () => ({
    getAudio: () => audioRef.current,
  }));

  // ─── JSX ─────────────────────────────────────────────────
  return (
    <section className="hero" id="hero" ref={sectionRef}>

      {/* Background video */}
      <video
        className="hero-video"
        src={HERO_VIDEO}
        autoPlay
        muted
        loop
        playsInline
        poster="https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200&q=80"
      />

      {/* Gradient overlay */}
      <div className="hero-overlay" />

      {/* Audio — hidden, controlled by fade helpers */}
      <audio
        ref={audioRef}
        src={MUSIC_SRC}
        loop
        preload="auto"
        style={{ display: 'none' }}
      />

      {/* Hero content */}
      <div className="hero-container">
        <p className="hero-eyebrow">INTELLIGENCE AT SCALE</p>
        <h1 className="hero-title">
          AI Seller<br />Intelligence
        </h1>
        <p className="hero-description">
          Build products that actually sell using real market data and AI.
          Our atelier of data provides the warmth your business needs to grow.
        </p>
        <div className="hero-actions">
          <button className="btn-primary-hero" onClick={onAnalyze}>
            Analyze Now
          </button>
          <button className="btn-secondary-hero" onClick={onDemo}>
            View Demo
          </button>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="hero-scroll">
        <div className="scroll-dot" />
        <span>SCROLL</span>
      </div>
    </section>
  );
});

export default Hero;
