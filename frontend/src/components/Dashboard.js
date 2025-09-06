import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../background.css';
import '../components.css';
import '../darkMode.css';
import '../layout.css';
import '../dashboardLayout.css';
import '../miniCard.css';
import '../enhancedLayout.css';
import '../styles/header.css';

const Dashboard = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAllSubjects, setShowAllSubjects] = useState(false);
  const navigatedToProfileRef = useRef(false);
  const fetchedRef = useRef(false); // guard for React 18 StrictMode double call
  // UI modes (shared with profile page keys for consistency)
  const [solid, setSolid] = useState(() => {
    const saved = localStorage.getItem('profileDisplayMode');
    return saved ? saved === 'solid' : true;
  });
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem('profileDarkMode');
    return saved ? saved === 'true' : false;
  });
  const navigate = useNavigate();
  const [navOpen, setNavOpen] = useState(false);
  const navRef = useRef(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (fetchedRef.current) return; // prevent duplicate fetch in dev strict mode
      fetchedRef.current = true;
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const api = axios.create({ baseURL: 'http://localhost:8000' });
        api.interceptors.request.use(cfg => {
          cfg.headers = cfg.headers || {}; cfg.headers.Authorization = `Bearer ${token}`; return cfg;
        });
        const response = await api.get('/profile/');
        
        setProfile(response.data);
      } catch (error) {
        console.error('Error fetching profile:', error);
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
        } else if (error.response?.status === 404) {
          if (!navigatedToProfileRef.current) {
            navigatedToProfileRef.current = true;
            navigate('/profile');
          }
        } else {
          setError('Failed to load profile data.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  // Persist preferences (reuse keys)
  useEffect(() => { localStorage.setItem('profileDisplayMode', solid ? 'solid' : 'glass'); }, [solid]);
  useEffect(() => { localStorage.setItem('profileDarkMode', dark ? 'true' : 'false'); }, [dark]);

  // Close mobile nav on resize / route changes / outside click
  useEffect(() => {
    const handleResize = () => { if (window.innerWidth > 820 && navOpen) setNavOpen(false); };
    const handleKey = (e) => { if (e.key === 'Escape') setNavOpen(false); };
    const handleClick = (e) => { if (navRef.current && !navRef.current.contains(e.target)) setNavOpen(false); };
    window.addEventListener('resize', handleResize);
    window.addEventListener('keydown', handleKey);
    document.addEventListener('mousedown', handleClick);
    return () => { window.removeEventListener('resize', handleResize); window.removeEventListener('keydown', handleKey); document.removeEventListener('mousedown', handleClick); };
  }, [navOpen]);

  // Shrink header on scroll
  useEffect(() => {
    const el = document.querySelector('.header-nav');
    if (!el) return;
    const onScroll = () => {
      if (window.scrollY > 12) el.classList.add('is-scrolled'); else el.classList.remove('is-scrolled');
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const getCompletionPercentage = () => {
    if (!profile) return 0;
    // Match the wizard's actual required set (dateOfBirth is optional there)
    const requiredFields = [
      'firstName', 'lastName', 'age', 'gender', 'state',
      'currentClass', 'school', 'board',
      'previousYearPercentage', 'currentPerformanceLevel',
      'careerInterests'
    ];
    const completed = requiredFields.filter(f => profile[f] && profile[f] !== '').length;
    return Math.round((completed / requiredFields.length) * 100);
  };

  if (loading) {
    return (
      <div className={`dashboard-page ${dark ? 'dark' : ''} min-h-screen flex items-center justify-center relative`}>
        <div className="orb-1"></div>
        <div className="orb-2"></div>
        <div className="orb-3"></div>
        <div className={`auth-card ${solid ? 'auth-card-solid' : ''}`} style={{maxWidth:'440px'}}>
          <div className="flex items-center space-x-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            <span className="text-base font-medium text-white">Loading your dashboard...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`dashboard-page ${dark ? 'dark' : ''} min-h-screen flex items-center justify-center relative`}>
        <div className="orb-1"></div>
        <div className="orb-2"></div>
        <div className="orb-3"></div>
        <div className={`auth-card ${solid ? 'auth-card-solid' : ''} text-center`} style={{maxWidth:'480px'}}>
          <div className="w-16 h-16 bg-red-500/20 border border-red-400/40 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <h2 className="text-xl font-bold mb-2">Error Loading Dashboard</h2>
          <p className="text-indigo-200 mb-4">{error}</p>
          <button onClick={() => window.location.reload()} className="btn-glass-primary w-full">Try Again</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`dashboard-page ${dark ? 'dark' : ''}`}>      
      <div className="fixed top-0 left-0 w-full h-full -z-0 pointer-events-none select-none">
        <div className="orb-1"></div>
        <div className="orb-2"></div>
        <div className="orb-3"></div>
      </div>
      
      <header className="header-nav" ref={navRef} role="banner">
        <div className="brand">
          <button className="nav-toggle" aria-label={navOpen ? 'Close navigation menu' : 'Open navigation menu'} aria-expanded={navOpen} onClick={() => setNavOpen(o => !o)}>
            <span className="nav-toggle-bar" />
            <span className="nav-toggle-bar" />
            <span className="nav-toggle-bar" />
          </button>
          <div className="brand-mark" aria-hidden="true">M</div>
          <div className="brand-text">
            <h1 className="brand-title">MyEduGuide</h1>
            <p className="brand-sub">Welcome, {profile?.firstName || 'Student'}!</p>
          </div>
        </div>
        <nav className={`nav-buttons-wrapper ${navOpen ? 'open' : ''}`} aria-label="Main navigation">
          <ul className="nav-buttons" role="menubar">
            <li role="none">
              <button
                onClick={() => setSolid(!solid)}
                className="nav-button nav-button-secondary"
                aria-pressed={solid}
              >
                {solid ? 'Glass Mode' : 'Solid Mode'}
              </button>
            </li>
            <li role="none">
              <button
                onClick={() => setDark(!dark)}
                className="nav-button nav-button-secondary"
                aria-pressed={dark}
              >
                {dark ? 'Light Mode' : 'Dark Mode'}
              </button>
            </li>
            <li role="none">
              <button
                onClick={() => navigate('/profile')}
                className="nav-button nav-button-secondary"
              >
                Edit Profile
              </button>
            </li>
            <li role="none">
              <button
                onClick={handleLogout}
                className="nav-button nav-button-primary"
              >
                Logout
              </button>
            </li>
          </ul>
        </nav>
      </header>
      
      <main className="dashboard-container main-content">
        <div className="dashboard-inner">
        <section className={`auth-card ${solid ? 'auth-card-solid' : ''} dash-section`}>
          <div className="flex flex-wrap gap-6 items-start justify-between mb-6">
            <div className="flex-1">
              <h2 className="text-xl font-bold mb-1 text-gradient-primary">Profile Completion</h2>
              <p className="text-indigo-200 text-sm">Complete your profile to get personalized career guidance</p>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-3xl font-bold bg-clip-text text-transparent" style={{backgroundImage:'linear-gradient(90deg,#66a6ff,#764ba2)'}}>{getCompletionPercentage()}%</div>
              <div className="text-xs uppercase tracking-wide opacity-70">Complete</div>
            </div>
          </div>
          
          <div className="progress-bar-glass mb-6" aria-label="Profile completion progress">
            <span style={{width:`${getCompletionPercentage()}%`}} />
          </div>
          
          {getCompletionPercentage() < 100 && (
            <button onClick={() => navigate('/profile')} className="btn-glass-primary mb-6">Complete Profile</button>
          )}
          
          {profile && (
            <div className="metrics-row">
              <div className="metric-tile">
                <span>Required Fields</span>
                <strong>{getCompletionPercentage()}%</strong>
              </div>
              <div className="metric-tile">
                <span>Subjects</span>
                <strong>{profile.strongSubjects?.length || 0}</strong>
              </div>
              <div className="metric-tile">
                <span>Preferred Fields</span>
                <strong>{profile.preferredFields?.length || 0}</strong>
              </div>
              <div className="metric-tile">
                <span>Phases Done</span>
                <strong>{Math.min(6, Math.ceil(getCompletionPercentage()/ (100/6)))}</strong>
              </div>
            </div>
          )}
        </section>
        
        <div className="dashboard-grid">
          <div className={`auth-card mini-card ${solid ? 'auth-card-solid' : ''}`}>
            <h3 className="text-lg font-semibold mb-5 flex items-center gap-2"><span>👤</span> Personal Information</h3>
            <div className="mini-card-content">
              <div className="mini-card-body">
                <div className="info-row">
                  <span className="info-row-label">Name</span>
                  <span className="info-row-value text-truncate">{profile?.firstName} {profile?.lastName || ''}</span>
                </div>
                <div className="info-row">
                  <span className="info-row-label">Age</span>
                  <span className="info-row-value">{profile?.age || '—'}</span>
                </div>
                <div className="info-row">
                  <span className="info-row-label">Gender</span>
                  <span className="info-row-value">{profile?.gender || '—'}</span>
                </div>
                <div className="info-row">
                  <span className="info-row-label">Location</span>
                  <span className="info-row-value text-truncate" title={`${profile?.cityVillage || ''} ${profile?.state || ''}`}>
                    {profile?.state ? `${profile.cityVillage || ''}, ${profile.state}` : '—'}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className={`auth-card mini-card ${solid ? 'auth-card-solid' : ''}`}>
            <h3 className="text-lg font-semibold mb-5 flex items-center gap-2"><span>📚</span> Academic Information</h3>
            <div className="mini-card-content">
              <div className="mini-card-body">
                <div className="info-row">
                  <span className="info-row-label">Class</span>
                  <span className="info-row-value">{profile?.currentClass || '—'}</span>
                </div>
                <div className="info-row">
                  <span className="info-row-label">School</span>
                  <span className="info-row-value text-truncate" title={profile?.school}>{profile?.school || '—'}</span>
                </div>
                <div className="info-row">
                  <span className="info-row-label">Board</span>
                  <span className="info-row-value">{profile?.board || '—'}</span>
                </div>
                <div className="info-row">
                  <span className="info-row-label">Prev %</span>
                  <span className="info-row-value">{profile?.previousYearPercentage ? `${profile.previousYearPercentage}%` : '—'}</span>
                </div>
              </div>
            </div>
          </div>
          <div className={`auth-card mini-card ${solid ? 'auth-card-solid' : ''}`}>
            <h3 className="text-lg font-semibold mb-5 flex items-center gap-2"><span>🎯</span> Performance & Interests</h3>
            <div className="mini-card-content">
              <div className="mini-card-body">
                <div>
                  <span className="info-row-label block mb-2">Performance</span>
                  <span className="inline-block px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-medium">
                    {profile?.currentPerformanceLevel || 'Not assessed'}
                  </span>
                </div>
                {profile?.strongSubjects?.length > 0 && (
                  <div>
                    <span className="info-row-label block mb-2">Strong Subjects</span>
                    <div className="subject-tags-container">
                      {(showAllSubjects ? profile.strongSubjects : profile.strongSubjects.slice(0,6)).map((s,i)=>(
                        <span key={i} className="subject-tag">{s}</span>
                      ))}
                    {profile.strongSubjects.length > 6 && (
                      <button type="button" onClick={() => setShowAllSubjects(!showAllSubjects)} className="px-2 py-1 rounded bg-white/5 border border-white/10 text-[11px] hover:bg-white/10 transition">
                        {showAllSubjects ? 'Show Less' : `+${profile.strongSubjects.length-6}`}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          </div>
        </div>
        {profile?.careerInterests && (
          <section className={`auth-card ${solid ? 'auth-card-solid' : ''} mt-10`}>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><span>🌟</span> Career Interests & Aspirations</h3>
            <p className="opacity-90 leading-relaxed text-sm whitespace-pre-line">{profile.careerInterests}</p>
          </section>
        )}
        {(!profile?.careerInterests || getCompletionPercentage() < 100) && (
          <section className={`auth-card ${solid ? 'auth-card-solid' : ''} mt-10 dash-cta-card`}>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><span>🛠️</span> Complete Your Profile</h3>
            <p className="text-sm opacity-80 mb-4">Finish missing information to unlock personalized recommendations.</p>
            <button onClick={() => navigate('/profile')} className="btn-glass-primary">Update Profile Now</button>
          </section>
        )}
        {(profile?.fatherOccupation || profile?.motherOccupation || profile?.familyEducationBackground) && (
          <section className={`auth-card ${solid ? 'auth-card-solid' : ''} mt-10`}>
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2"><span>👨‍👩‍👧‍👦</span> Family Context</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
              <div className="space-y-3">
                {profile?.fatherOccupation && <div className="flex justify-between gap-4"><span className="opacity-70">Father</span><span className="font-medium">{profile.fatherOccupation}</span></div>}
                {profile?.motherOccupation && <div className="flex justify-between gap-4"><span className="opacity-70">Mother</span><span className="font-medium">{profile.motherOccupation}</span></div>}
                {profile?.familyIncome && <div className="flex justify-between gap-4"><span className="opacity-70">Income</span><span className="font-medium">{profile.familyIncome}</span></div>}
              </div>
              {profile?.familyEducationBackground && <div><span className="opacity-70 block mb-2">Education Background</span><p className="leading-relaxed opacity-90 text-sm">{profile.familyEducationBackground}</p></div>}
            </div>
          </section>
        )}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
          {[
            {icon:'📊', title:'Career Assessment', desc:'Take our comprehensive career assessment to discover suitable career paths'},
            {icon:'🎓', title:'Course Recommendations', desc:'Get personalized course and college recommendations based on your profile'},
            {icon:'💼', title:'Career Guidance', desc:'Connect with career counselors and get expert guidance for your future'}
          ].map((c,i)=>(
            <div key={i} className={`auth-card feature-card text-center ${solid ? 'auth-card-solid' : ''}`}>
              <div className="w-14 h-14 mx-auto mb-4 rounded-full flex items-center justify-center bg-gradient-to-br from-blue-500/30 to-purple-600/30 text-2xl">{c.icon}</div>
              <h4 className="font-semibold mb-2">{c.title}</h4>
              <p className="text-sm opacity-80 mb-4 leading-relaxed">{c.desc}</p>
              <button className="btn-glass-primary w-full opacity-60 cursor-not-allowed">Coming Soon</button>
            </div>
          ))}
        </section>
        <footer className="text-center mt-16 opacity-70 text-xs tracking-wide">
          MyEduGuide – Personalized career guidance platform
        </footer>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
