import React, { useEffect, useState, useCallback, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_BASE = 'http://localhost:8000';

export default function AptitudeTest(){
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [started, setStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const navigate = useNavigate();
  const testIdRef = useRef(null);

  const token = localStorage.getItem('token');
  const api = axios.create({ baseURL: API_BASE });
  api.interceptors.request.use(cfg => { cfg.headers = cfg.headers||{}; cfg.headers.Authorization = `Bearer ${token}`; return cfg; });

  // Load draft if exists
  useEffect(()=>{
    const draftRaw = localStorage.getItem('aptitude_draft');
    if(draftRaw){
      try {
        const draft = JSON.parse(draftRaw);
        if(draft && draft.answers){ setAnswers(draft.answers || {}); }
      } catch(_e){}
    }
  },[]);

  const persistDraft = useCallback(()=>{
    if(!started || result) return;
    localStorage.setItem('aptitude_draft', JSON.stringify({ answers, testId: testIdRef.current, ts: Date.now(), timeLeft }));
  },[answers, started, result, timeLeft]);

  const fetchQuestions = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/aptitude/start');
      setQuestions(res.data.questions);
      setTimeLeft(res.data.durationMinutes * 60);
      testIdRef.current = res.data.testId;
      setStarted(true);
    } catch (e){
      setError(e.response?.data?.detail || 'Failed to start test');
    } finally { setLoading(false); }
  }, [api]);

  useEffect(()=>{ fetchQuestions(); }, [fetchQuestions]);

  const handleSubmit = useCallback(async () => {
    try {
      const res = await api.post('/aptitude/submit', { answers });
      setResult(res.data);
      localStorage.removeItem('aptitude_draft');
    } catch(e){
      setError(e.response?.data?.detail || 'Submission failed');
    }
  }, [api, answers]);

  useEffect(()=>{
    if(!started || result) return;
    if(timeLeft <= 0){ handleSubmit(); return; }
    const t = setTimeout(()=> setTimeLeft(tl => tl-1), 1000);
    return ()=> clearTimeout(t);
  }, [timeLeft, started, result, handleSubmit]);

  // persist draft when answers/time change
  useEffect(()=>{ persistDraft(); }, [persistDraft]);

  // warn on unload if in progress
  useEffect(()=>{
    const handler = (e) => {
      if(started && !result){ e.preventDefault(); e.returnValue = ''; }
    };
    window.addEventListener('beforeunload', handler);
    return ()=> window.removeEventListener('beforeunload', handler);
  },[started, result]);

  const handleAnswer = (qid, opt) => { setAnswers(a => ({...a, [qid]: opt})); };

  const formatTime = s => `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`;

  const goNext = () => setCurrentIndex(i => Math.min(i+1, questions.length-1));
  const goPrev = () => setCurrentIndex(i => Math.max(i-1, 0));

  if(loading) return <div className='auth-card'>Loading aptitude test...</div>;
  if(error) return <div className='auth-card text-red-400'>{error}</div>;
  if(result) return (
    <div className='auth-card'>
      <h2 className='text-xl font-bold mb-4'>Your Aptitude Result</h2>
      <p className='mb-2'>Total Score: <strong>{result.totalScore}</strong> / {result.totalQuestions}</p>
      <div className='mb-4 grid grid-cols-2 md:grid-cols-4 gap-3'>
        {Object.entries(result.breakdown).map(([k,v])=> (
          <div key={k} className='p-3 rounded bg-white/5 border border-white/10 text-center'>
            <div className='text-xs opacity-70 mb-1'>{k.toUpperCase()}</div>
            <div className='text-lg font-semibold'>{v}</div>
          </div>
        ))}
      </div>
      <button className='btn-glass-primary mb-4' onClick={()=> navigate('/dashboard')}>Back to Dashboard</button>
    </div>
  );

  const q = questions[currentIndex];
  const progressPct = questions.length ? Math.round(((currentIndex+1) / questions.length) * 100) : 0;

  return (
    <div className='auth-card dark-only-mode'>
      <div className='flex justify-between items-center mb-4'>
        <h2 className='text-lg font-semibold'>Aptitude Test</h2>
        <div className='text-sm font-mono'>{formatTime(timeLeft)}</div>
      </div>
      <div className='mb-4 h-2 w-full rounded bg-white/10 overflow-hidden'>
        <div style={{width: progressPct+'%'}} className='h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-300'></div>
      </div>
      <div className='text-xs opacity-70 mb-4 tracking-wide'>Question {currentIndex+1} / {questions.length}</div>
      {q && (
        <div className='p-4 rounded-lg bg-white/5 border border-white/10 mb-6'>
          <div className='font-medium mb-3'>{currentIndex+1}. {q.question}</div>
          {q.type === 'descriptive' ? (
            <textarea
              className='w-full min-h-32 p-3 rounded bg-white/5 border border-white/10 text-sm'
              placeholder='Type your response here...'
              value={answers[q._id]||''}
              onChange={e=>handleAnswer(q._id, e.target.value)}
            />
          ) : (
            <div className='grid gap-2'>
              {q.options && q.options.map(opt => (
                <button key={opt} type='button' onClick={()=>handleAnswer(q._id,opt)} className={`text-left px-3 py-2 rounded-md border text-sm transition ${answers[q._id]===opt ? 'bg-gradient-to-r from-blue-500/40 to-purple-600/40 border-white/40' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}>{opt}</button>
              ))}
            </div>
          )}
        </div>
      )}
      <div className='flex justify-between items-center gap-3'>
        <div className='flex gap-2'>
          <button disabled={currentIndex===0} onClick={goPrev} className='btn-glass-secondary disabled:opacity-40'>Prev</button>
          <button disabled={currentIndex===questions.length-1} onClick={goNext} className='btn-glass-secondary disabled:opacity-40'>Next</button>
        </div>
        {currentIndex === questions.length-1 ? (
          <button onClick={handleSubmit} className='btn-glass-primary'>Submit Test</button>
        ) : (
          <button onClick={goNext} className='btn-glass-primary'>Save & Continue</button>
        )}
      </div>
      <div className='mt-6 grid grid-cols-6 md:grid-cols-12 gap-1'>
        {questions.map((qq,i)=>(
          <button key={qq._id} onClick={()=> setCurrentIndex(i)} className={`h-6 text-[10px] rounded border ${i===currentIndex ? 'bg-blue-500/50 border-white/40' : answers[qq._id] ? 'bg-green-500/40 border-white/30' : 'bg-white/5 border-white/10 hover:bg-white/10'} transition`}>{i+1}</button>
        ))}
      </div>
    </div>
  );
}
