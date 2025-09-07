import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:8000';

export default function AdminAptitude(){
  const token = localStorage.getItem('token');
  // stable axios instance (avoid recreating & stacking interceptors)
  const api = useMemo(()=>{
    const inst = axios.create({ baseURL: API_BASE });
    inst.interceptors.request.use(cfg => { cfg.headers = cfg.headers||{}; cfg.headers.Authorization = `Bearer ${token}`; return cfg; });
    return inst;
  },[token]);

  const [questions,setQuestions] = useState([]);
  const [error,setError] = useState('');
  const [loading,setLoading] = useState(true);
  const [creating,setCreating] = useState(false);
  const [form,setForm] = useState({question:'',options:['','','',''],answer:'',category:''});
  const [seedStatus,setSeedStatus] = useState(null);
  const firstLoadRef = useRef(false);

  const fetchQuestions = useCallback(async(refresh=false)=>{
    if(firstLoadRef.current && !refresh) return; // only auto-run once
    try{ setLoading(true); const res = await api.get('/aptitude/questions'); setQuestions(res.data); setError(''); }
    catch(e){ setError(e.response?.data?.detail||e.message||'Failed to load questions'); }
    finally{ setLoading(false); firstLoadRef.current = true; }
  },[api]);

  useEffect(()=>{ fetchQuestions(); },[fetchQuestions]);

  const updateOption = (idx,val)=> setForm(f=>({...f,options:f.options.map((o,i)=> i===idx?val:o)}));

  const submitNew = async()=>{
    if(!form.question || !form.answer || !form.category) return;
    try {
      setCreating(true);
      const clean = { ...form, options: form.options.filter(o=>o.trim()!==''), answer: form.answer };
      await api.post('/aptitude/questions', clean);
      setForm({question:'',options:['','','',''],answer:'',category:''});
      firstLoadRef.current = false; // allow fetch again
      fetchQuestions(true);
    } catch(e){ setError(e.response?.data?.detail||'Create failed'); }
    finally { setCreating(false); }
  };

  const runSeed = async()=>{
    try { const res = await api.post('/aptitude/questions/seed'); setSeedStatus(res.data); firstLoadRef.current = false; fetchQuestions(true); }
    catch(e){ setError(e.response?.data?.detail||'Seed failed'); }
  };

  if(loading && !firstLoadRef.current) return <div className='auth-card'>Loading...</div>;
  if(error) return <div className='auth-card text-red-400'>
    <div className='mb-3'>Error: {error}</div>
    <button onClick={()=>{ firstLoadRef.current=false; fetchQuestions(true); }} className='btn-glass-primary'>Retry</button>
  </div>;

  return (
    <div className='aptitude-admin-page min-h-screen py-10 px-6'>
      <div className='max-w-5xl mx-auto'>
    <div className='auth-card aptitude-admin-card max-w-4xl w-full mx-auto'>
      <h2 className='text-xl font-bold mb-6'>Aptitude Question Admin</h2>
      <div className='mb-4 flex gap-3'>
        <button onClick={()=>{ firstLoadRef.current=false; fetchQuestions(true); }} className='btn-glass-secondary'>Refresh List</button>
      </div>
      <div className='mb-8'>
        <h3 className='font-semibold mb-3'>Add Question</h3>
        <div className='grid gap-3'>
          <div className='grid grid-cols-2 gap-4'>
            <select value={form.type||'mcq'} onChange={e=>setForm(f=>({...f,type:e.target.value}))} className='px-3 py-2 rounded bg-white/10 border border-white/20 text-sm'>
              <option value='mcq'>MCQ</option>
              <option value='descriptive'>Descriptive</option>
            </select>
            <input value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))} placeholder='Category (quant, logical, verbal, tech)' className='px-3 py-2 rounded bg-white/10 border border-white/20 text-sm' />
          </div>
          <input value={form.question} onChange={e=>setForm(f=>({...f,question:e.target.value}))} placeholder='Question text' className='px-3 py-2 rounded bg-white/5 border border-white/10 text-sm' />
          {form.type !== 'descriptive' && (
            <>
              <div className='grid grid-cols-2 gap-2'>
                {form.options.map((o,i)=>(
                  <input key={i} value={o} onChange={e=>updateOption(i,e.target.value)} placeholder={`Option ${i+1}`} className='px-2 py-2 rounded bg-white/5 border border-white/10 text-xs' />
                ))}
              </div>
              <input value={form.answer} onChange={e=>setForm(f=>({...f,answer:e.target.value}))} placeholder='Correct answer (must match one option)' className='px-3 py-2 rounded bg-white/5 border border-white/10 text-sm' />
            </>
          )}
          {form.type === 'descriptive' && (
            <textarea value={form.answer||''} onChange={e=>setForm(f=>({...f,answer:e.target.value}))} placeholder='(Optional) Reference / model answer for descriptive question' className='w-full min-h-28 px-3 py-2 rounded bg-white/5 border border-white/10 text-sm' />
          )}
          <div className='flex gap-3'>
            <button disabled={creating} onClick={submitNew} className='btn-glass-primary'>{creating?'Saving...':'Add Question'}</button>
            <button type='button' onClick={runSeed} className='btn-glass-secondary'>Seed Sample Set</button>
          </div>
          {seedStatus && <div className='text-xs opacity-70'>Inserted {seedStatus.inserted}, Skipped {seedStatus.skipped}</div>}
        </div>
      </div>
      <div>
        <h3 className='font-semibold mb-4'>Existing Questions ({questions.length})</h3>
        <div className='max-h-72 overflow-y-auto space-y-3 pr-2'>
          {questions.map(q=>(
      <div key={q._id} className='p-3 rounded question-item'>
              <div className='flex items-center justify-between mb-1'>
                <div className='text-sm font-medium pr-4'>{q.question}</div>
        <span className='text-[10px] px-2 py-0.5 rounded badge-type uppercase tracking-wide'>{q.type||'mcq'}</span>
              </div>
              <div className='text-[11px] opacity-70 mb-1 uppercase tracking-wide'>{q.category}</div>
              {q.type !== 'descriptive' && q.options && (
                <ul className='text-xs list-disc pl-4 space-y-1'>
                  {q.options.map(o=> <li key={o} className={o===q.answer?'text-green-400':''}>{o}</li>)}
                </ul>
              )}
              {q.type === 'descriptive' && q.answer && (
                <div className='mt-2 text-xs italic opacity-70'>Model: {q.answer}</div>
              )}
            </div>
          ))}
          {questions.length===0 && <div className='text-xs opacity-70'>No questions yet.</div>}
        </div>
      </div>
    </div>
      </div>
    </div>
  );
}
