import { useState, useRef, useCallback, useEffect } from 'react';
import './index.css';
import './App.css';

import Navbar          from './components/Navbar';
import Hero            from './components/Hero';
import Showcase        from './components/Showcase';
import Features        from './components/Features';
import AnalyzeSection  from './components/AnalyzeSection';
import Dashboard       from './components/Dashboard';
import ChatBot         from './components/ChatBot';
import Footer          from './components/Footer';

// API uses relative paths — Vite proxy forwards to Flask on port 8000
const API_BASE = '';


export default function App() {
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [dashboardVisible, setDashboardVisible] = useState(false);
  const [productQuery, setProductQuery] = useState('');

  // Refs for sections
  const heroRef     = useRef(null);
  const analyzeRef  = useRef(null);
  const dashRef     = useRef(null);

  // Scroll helper
  const scrollTo = useCallback((id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  // Load dashboard data from API
  const loadDashboard = useCallback(async () => {
    try {
      const res  = await fetch(`${API_BASE}/dashboard`);
      const data = await res.json();
      setDashboardData(data);
      setDashboardVisible(true);
      setTimeout(() => scrollTo('dashboard'), 350);
    } catch {
      try {
        const [pR, rR, aR] = await Promise.all([
          fetch(`${API_BASE}/products`),
          fetch(`${API_BASE}/recommendation`),
          fetch(`${API_BASE}/ai-recommendation`),
        ]);
        setDashboardData({
          products:       await pR.json(),
          recommendation: await rR.json(),
          ai:             await aR.json(),
        });
        setDashboardVisible(true);
        setTimeout(() => scrollTo('dashboard'), 350);
      } catch (e) {
        console.error('Failed to load dashboard', e);
      }
    }
  }, [scrollTo]);

  // Called when scrape completes
  const handleAnalysisComplete = useCallback((query) => {
    setProductQuery(query);
    loadDashboard();
  }, [loadDashboard]);

  // Demo button
  const handleDemo = useCallback(() => {
    loadDashboard();
    setProductQuery('Demo Product');
  }, [loadDashboard]);

  // Toggle music
  const toggleMusic = useCallback(() => {
    setMusicPlaying(p => !p);
  }, []);

  return (
    <>
      <Navbar
        musicPlaying={musicPlaying}
        onMusicToggle={toggleMusic}
        onScrollTo={scrollTo}
      />

      <Hero
        ref={heroRef}
        musicPlaying={musicPlaying}
        onMusicStateChange={setMusicPlaying}
        onAnalyze={() => scrollTo('analyze')}
        onDemo={handleDemo}
      />

      <Showcase />

      <Features onAnalyze={() => scrollTo('analyze')} />

      <AnalyzeSection
        analysisRef={analyzeRef}
        onAnalysisComplete={handleAnalysisComplete}
      />

      <Dashboard
        dashboardRef={dashRef}
        data={dashboardData}
        visible={dashboardVisible}
      />

      <Footer />

      <ChatBot
        productQuery={productQuery}
        visible={dashboardVisible}
      />
    </>
  );
}
