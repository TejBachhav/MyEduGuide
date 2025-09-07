import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Signup from './components/Signup';
import Login from './components/Login';
import Profile from './components/Profile';
import AptitudeTest from './components/AptitudeTest';
import Dashboard from './components/Dashboard';
import AdminAptitude from './components/AdminAptitude';

function App() {
  useEffect(()=>{
    document.documentElement.classList.add('dark');
    document.body.classList.add('bg-slate-900');
    return ()=>{};
  },[]);
  return (
    <div className="App">
      <Routes>
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/aptitude" element={<AptitudeTest />} />
        <Route path="/admin/aptitude" element={<AdminAptitude />} />
        <Route path="/" element={<Login />} />
      </Routes>
    </div>
  );
}

export default App;

