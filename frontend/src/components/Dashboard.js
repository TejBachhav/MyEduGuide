import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
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

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await axios.get('http://localhost:8000/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setProfile(response.data);
      } catch (error) {
        console.error('Error fetching profile:', error);
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
        } else if (error.response?.status === 404) {
          navigate('/profile');
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

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const getCompletionPercentage = () => {
    if (!profile) return 0;
    
    const requiredFields = [
      'firstName', 'lastName', 'age', 'gender', 'dateOfBirth',
      'currentClass', 'school', 'board',
      'previousYearPercentage', 'currentPerformanceLevel',
      'careerInterests'
    ];
    
    const completedFields = requiredFields.filter(field => 
      profile[field] && profile[field] !== ''
    ).length;
    
    return Math.round((completedFields / requiredFields.length) * 100);
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
    <div className={`dashboard-page ${dark ? 'dark' : ''} relative min-h-screen w-full overflow-x-hidden`}>      
      <div className="absolute top-0 left-0 w-full h-full -z-10 pointer-events-none select-none">
        <div className="orb-1"></div>
        <div className="orb-2"></div>
        <div className="orb-3"></div>
      </div>
      <header className="dash-header sticky top-0 z-30 px-4 pt-4">
        <div className={`auth-card dash-header-inner ${solid ? 'auth-card-solid' : ''}`} style={{padding:'1rem 1.25rem', display:'flex', alignItems:'center', justifyContent:'space-between'}}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-md"><span className="text-white font-bold text-lg">M</span></div>
            <div>
              <h1 className="text-lg font-bold">MyEduGuide</h1>
              <p className="text-[11px] opacity-80">Welcome, {profile?.firstName || 'Student'}!</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <button onClick={() => setSolid(!solid)} className="auth-button-secondary" style={{padding:'.55rem .8rem', fontSize:'.65rem'}}>{solid ? 'Glass Mode' : 'Solid Mode'}</button>
            <button onClick={() => setDark(!dark)} className="auth-button-secondary" style={{padding:'.55rem .8rem', fontSize:'.65rem'}}>{dark ? 'Light' : 'Dark'}</button>
            <button onClick={() => navigate('/profile')} className="btn-glass">Edit Profile</button>
            <button onClick={handleLogout} className="btn-glass-primary">Logout</button>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 md:px-8 pt-10 pb-16">
        <section className={`auth-card ${solid ? 'auth-card-solid' : ''} mb-10`}>
          <div className="flex flex-wrap gap-6 items-start justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold mb-1">Profile Completion</h2>
              <p className="text-indigo-200 text-sm">Complete your profile to get personalized career guidance</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold bg-clip-text text-transparent" style={{backgroundImage:'linear-gradient(90deg,#66a6ff,#764ba2)'}}>{getCompletionPercentage()}%</div>
              <div className="text-xs uppercase tracking-wide opacity-70">Complete</div>
            </div>
          </div>
          <div className="progress-bar-glass mb-6" aria-label="Profile completion progress">
            <span style={{width:`${getCompletionPercentage()}%`}} />
          </div>
          {getCompletionPercentage() < 100 && (
            <button onClick={() => navigate('/profile')} className="btn-glass-primary">Complete Profile</button>
          )}
        </section>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className={`auth-card mini-card ${solid ? 'auth-card-solid' : ''}`}>
            <h3 className="text-lg font-semibold mb-5 flex items-center gap-2"><span>👤</span> Personal Information</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between gap-4"><span className="opacity-70">Name</span><span className="font-medium text-right">{profile?.firstName} {profile?.lastName || ''}</span></div>
              <div className="flex justify-between gap-4"><span className="opacity-70">Age</span><span className="font-medium">{profile?.age || '—'}</span></div>
              <div className="flex justify-between gap-4"><span className="opacity-70">Gender</span><span className="font-medium">{profile?.gender || '—'}</span></div>
              <div className="flex justify-between gap-4"><span className="opacity-70">Location</span><span className="font-medium text-right truncate max-w-[140px]" title={`${profile?.cityVillage || ''} ${profile?.state || ''}`}>{profile?.state ? `${profile.cityVillage || ''}, ${profile.state}` : '—'}</span></div>
            </div>
          </div>
          <div className={`auth-card mini-card ${solid ? 'auth-card-solid' : ''}`}>
            <h3 className="text-lg font-semibold mb-5 flex items-center gap-2"><span>📚</span> Academic Information</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between gap-4"><span className="opacity-70">Class</span><span className="font-medium">{profile?.currentClass || '—'}</span></div>
              <div className="flex justify-between gap-4"><span className="opacity-70">School</span><span className="font-medium truncate max-w-[140px]" title={profile?.school}>{profile?.school || '—'}</span></div>
              <div className="flex justify-between gap-4"><span className="opacity-70">Board</span><span className="font-medium">{profile?.board || '—'}</span></div>
              <div className="flex justify-between gap-4"><span className="opacity-70">Prev %</span><span className="font-medium">{profile?.previousYearPercentage ? `${profile.previousYearPercentage}%` : '—'}</span></div>
            </div>
          </div>
          <div className={`auth-card mini-card ${solid ? 'auth-card-solid' : ''}`}>
            <h3 className="text-lg font-semibold mb-5 flex items-center gap-2"><span>🎯</span> Performance & Interests</h3>
            <div className="space-y-4 text-sm">
              <div><span className="opacity-70 block mb-1">Performance Level</span><span className="inline-block px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-medium">{profile?.currentPerformanceLevel || 'Not assessed'}</span></div>
              {profile?.strongSubjects?.length > 0 && (
                <div>
                  <span className="opacity-70 block mb-2">Strong Subjects</span>
                  <div className="flex flex-wrap gap-2">
                    {profile.strongSubjects.slice(0,4).map((s,i)=>(<span key={i} className="px-2 py-1 rounded bg-white/10 border border-white/15 text-[11px]">{s}</span>))}
                    {profile.strongSubjects.length > 4 && <span className="px-2 py-1 rounded bg-white/5 border border-white/10 text-[11px]">+{profile.strongSubjects.length-4}</span>}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        {profile?.careerInterests && (
          <section className={`auth-card ${solid ? 'auth-card-solid' : ''} mt-10`}>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><span>🌟</span> Career Interests & Aspirations</h3>
            <p className="opacity-90 leading-relaxed text-sm whitespace-pre-line">{profile.careerInterests}</p>
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
      </main>
    </div>
  );
};

export default Dashboard;
