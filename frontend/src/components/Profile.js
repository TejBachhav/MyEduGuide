import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const [currentPhase, setCurrentPhase] = useState(1);
  const [formData, setFormData] = useState({
    // Personal Information
    firstName: '',
    lastName: '',
    age: '',
    gender: '',
    dateOfBirth: '',
    cityVillage: '',
    district: '',
    state: '',
    
    // Academic Information
    currentClass: '',
    school: '',
    board: '',
    previousYearPercentage: '',
    currentPerformanceLevel: '',
    strongSubjects: [],
    
    // Interests and Goals
    careerInterests: '',
    preferredFields: [],
    studyPreferences: '',
    
    // Family Context
    fatherOccupation: '',
    motherOccupation: '',
    familyIncome: '',
    familyEducationBackground: '',
    
    // Additional Information
    extracurricularActivities: '',
    challenges: '',
    supportNeeded: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [solid, setSolid] = useState(() => {
    const saved = localStorage.getItem('profileDisplayMode');
    return saved ? saved === 'solid' : true;
  });
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem('profileDarkMode');
    return saved ? saved === 'true' : false;
  });
  // Field-level validation errors
  const [fieldErrors, setFieldErrors] = useState({});
  const navigate = useNavigate();

  const phases = [
    {
      id: 1,
      title: "Personal Information",
      icon: "👤",
      description: "Let's start with your basic details"
    },
    {
      id: 2,
      title: "Academic Background",
      icon: "📚",
      description: "Tell us about your education"
    },
    {
      id: 3,
      title: "Performance & Strengths",
      icon: "🎯",
      description: "Share your academic performance"
    },
    {
      id: 4,
      title: "Career Interests",
      icon: "🌟",
      description: "What are your career aspirations?"
    },
    {
      id: 5,
      title: "Family Context",
      icon: "👨‍👩‍👧‍👦",
      description: "Help us understand your background"
    },
    {
      id: 6,
      title: "Additional Information",
      icon: "📝",
      description: "Any other details you'd like to share"
    }
  ];

  useEffect(() => {
    const fetchExistingProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await axios.get('http://localhost:8000/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data) {
        // Ensure array fields are initialized properly
        const profileData = {
          ...response.data,
          strongSubjects: response.data.strongSubjects || [],
          preferredFields: response.data.preferredFields || [],
        };
        setFormData(profileData);
        const completedPhases = calculateCompletedPhases(profileData);
        setCurrentPhase(Math.min(completedPhases + 1, 6));
      }
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      } else if (error.response?.status === 404) {
        // Profile doesn't exist, start fresh
        setCurrentPhase(1);
      }
    }
    };

    fetchExistingProfile();
  }, [navigate]);

  // Persist mode preferences
  useEffect(() => { localStorage.setItem('profileDisplayMode', solid ? 'solid' : 'glass'); }, [solid]);
  useEffect(() => { localStorage.setItem('profileDarkMode', dark ? 'true' : 'false'); }, [dark]);

  const calculateCompletedPhases = (data) => {
    let completed = 0;
    if (data.firstName && data.lastName && data.age && data.gender) completed = 1;
    if (completed >= 1 && data.currentClass && data.school && data.board) completed = 2;
    if (completed >= 2 && data.previousYearPercentage && data.currentPerformanceLevel) completed = 3;
    if (completed >= 3 && data.careerInterests) completed = 4;
    if (completed >= 4 && (data.fatherOccupation || data.motherOccupation)) completed = 5;
    if (completed >= 5) completed = 6;
    return completed;
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      const list = formData[name] || [];
      setFormData(prev => ({
        ...prev,
        [name]: checked 
          ? [...list, value]
          : list.filter(item => item !== value)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }

    // Clear field error as user modifies the field
    if (fieldErrors[name]) {
      setFieldErrors(prev => {
        const copy = { ...prev };
        delete copy[name];
        return copy;
      });
    }
  };

  const validatePhase = (phase) => {
    switch (phase) {
      case 1:
        return formData.firstName && formData.lastName && formData.age && formData.gender && formData.state;
      case 2:
        return formData.currentClass && formData.school && formData.board;
      case 3:
        return formData.previousYearPercentage && formData.currentPerformanceLevel;
      case 4:
        return formData.careerInterests;
      case 5:
        return formData.fatherOccupation || formData.motherOccupation;
      case 6:
        return true; // Optional phase
      default:
        return false;
    }
  };

  const handleNext = () => {
    // Build per-phase required fields list
    const requiredMap = {
      1: ['firstName', 'lastName', 'age', 'gender', 'state'],
      2: ['currentClass', 'board', 'school'],
      3: ['previousYearPercentage', 'currentPerformanceLevel'],
      4: ['careerInterests'],
      5: ['fatherOccupation', 'motherOccupation'] // special: at least one
    };

    const needed = requiredMap[currentPhase] || [];
    const newErrors = {};

    if (currentPhase === 5) {
      // Special rule: require at least one of fatherOccupation or motherOccupation
      if (!formData.fatherOccupation && !formData.motherOccupation) {
        newErrors.fatherOccupation = 'Provide at least one occupation';
        newErrors.motherOccupation = 'Provide at least one occupation';
      }
    } else {
      needed.forEach(f => { if (!formData[f]) newErrors[f] = 'This field is required'; });
    }

    if (Object.keys(newErrors).length) {
      setFieldErrors(newErrors);
      setError('Please fix the highlighted fields.');
      // Scroll to first invalid field
      setTimeout(() => {
        const first = document.querySelector('.form-input-glass.error');
        if (first) {
          first.scrollIntoView({ behavior: 'smooth', block: 'center' });
          if (typeof first.focus === 'function') first.focus();
        }
      }, 30);
      return;
    }

    // Phase validated
    setError('');
    setFieldErrors({});
    if (currentPhase < 6) {
      setCurrentPhase(currentPhase + 1);
    } else {
      handleSubmit();
    }
  };

  const handlePrevious = () => {
    if (currentPhase > 1) {
      setCurrentPhase(currentPhase - 1);
      setError('');
    }
  };

  const handleSubmit = async () => {
    if (!validatePhase(1) || !validatePhase(2) || !validatePhase(3) || !validatePhase(4)) {
        setError('Please ensure all required fields in previous phases are filled.');
        return;
    }
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:8000/profile', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSuccess('Profile saved successfully!');
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (error) {
      console.error('Profile submission error:', error);
      setError('Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getProgressPercentage = () => {
    return Math.round(((currentPhase -1) / 5) * 100);
  };

  const renderPhaseContent = () => {
    switch (currentPhase) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <span className="text-2xl text-white">👤</span>
              </div>
              <h2 className="text-2xl font-bold text-white">Personal Information</h2>
              <p className="text-indigo-200 mt-2">Let's start with your basic details</p>
            </div>

            <div className="form-grid two-cols">
              <div>
                <label className="form-label">First Name *</label>
                <input type="text" name="firstName" value={formData.firstName} onChange={handleInputChange} className={`form-input-glass ${fieldErrors.firstName ? 'error' : ''}`} placeholder="Enter your first name" />
                {fieldErrors.firstName && <div className="field-error-text">{fieldErrors.firstName}</div>}
              </div>
              <div>
                <label className="form-label">Last Name *</label>
                <input type="text" name="lastName" value={formData.lastName} onChange={handleInputChange} className={`form-input-glass ${fieldErrors.lastName ? 'error' : ''}`} placeholder="Enter your last name" />
                {fieldErrors.lastName && <div className="field-error-text">{fieldErrors.lastName}</div>}
              </div>
              <div>
                <label className="form-label">Age *</label>
                <input type="number" name="age" value={formData.age} onChange={handleInputChange} className={`form-input-glass ${fieldErrors.age ? 'error' : ''}`} placeholder="Enter your age" min="10" max="25" />
                {fieldErrors.age && <div className="field-error-text">{fieldErrors.age}</div>}
              </div>
              <div>
                <label className="form-label">Gender *</label>
                <div className="select-wrapper">
                  <select name="gender" value={formData.gender} onChange={handleInputChange} className={`form-input-glass ${fieldErrors.gender ? 'error' : ''}`}> 
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer-not-to-say">Prefer not to say</option>
                  </select>
                </div>
                {fieldErrors.gender && <div className="field-error-text">{fieldErrors.gender}</div>}
              </div>
              <div>
                <label className="form-label">Date of Birth</label>
                <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleInputChange} className="form-input-glass" />
              </div>
              <div>
                <label className="form-label">State *</label>
                <input type="text" name="state" value={formData.state} onChange={handleInputChange} className={`form-input-glass ${fieldErrors.state ? 'error' : ''}`} placeholder="Enter your state" />
                {fieldErrors.state && <div className="field-error-text">{fieldErrors.state}</div>}
              </div>
              <div>
                <label className="form-label">District</label>
                <input type="text" name="district" value={formData.district} onChange={handleInputChange} className="form-input-glass" placeholder="Enter your district" />
              </div>
              <div>
                <label className="form-label">City/Village</label>
                <input type="text" name="cityVillage" value={formData.cityVillage} onChange={handleInputChange} className="form-input-glass" placeholder="Enter your city or village" />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <span className="text-2xl text-white">📚</span>
              </div>
              <h2 className="text-2xl font-bold text-white">Academic Background</h2>
              <p className="text-indigo-200 mt-2">Tell us about your education</p>
            </div>
            <div className="form-grid two-cols">
              <div>
                <label className="form-label">Current Class *</label>
                <div className="select-wrapper">
                <select name="currentClass" value={formData.currentClass} onChange={handleInputChange} className={`form-input-glass ${fieldErrors.currentClass ? 'error' : ''}`}> 
                  <option value="">Select your current class</option>
                  <option value="8th">8th Standard</option>
                  <option value="9th">9th Standard</option>
                  <option value="10th">10th Standard</option>
                  <option value="11th">11th Standard</option>
                  <option value="12th">12th Standard</option>
                  <option value="graduated">Graduated</option>
                </select>
                </div>
                {fieldErrors.currentClass && <div className="field-error-text">{fieldErrors.currentClass}</div>}
              </div>
              <div>
                <label className="form-label">Education Board *</label>
                <div className="select-wrapper">
                <select name="board" value={formData.board} onChange={handleInputChange} className={`form-input-glass ${fieldErrors.board ? 'error' : ''}`}> 
                  <option value="">Select your board</option>
                  <option value="CBSE">CBSE</option>
                  <option value="ICSE">ICSE</option>
                  <option value="State Board">State Board</option>
                  <option value="IB">International Baccalaureate (IB)</option>
                  <option value="Other">Other</option>
                </select>
                </div>
                {fieldErrors.board && <div className="field-error-text">{fieldErrors.board}</div>}
              </div>
              <div className="md:col-span-2">
                <label className="form-label">School Name *</label>
                <input type="text" name="school" value={formData.school} onChange={handleInputChange} className={`form-input-glass ${fieldErrors.school ? 'error' : ''}`} placeholder="Enter your school name" />
                {fieldErrors.school && <div className="field-error-text">{fieldErrors.school}</div>}
              </div>
            </div>
            <div className="info-box-glass mt-10">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0"><span className="text-blue-300 text-lg">💡</span></div>
                <div>
                  <h4 className="font-semibold text-white">Why do we need this?</h4>
                  <p className="text-indigo-200 text-sm mt-1">Understanding your academic background helps us provide more relevant career guidance and suggest appropriate courses.</p>
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <span className="text-2xl text-white">🎯</span>
              </div>
              <h2 className="text-2xl font-bold text-white">Performance & Strengths</h2>
              <p className="text-indigo-200 mt-2">Share your academic performance</p>
            </div>
            <div className="form-grid two-cols">
              <div>
                <label className="form-label">Previous Year Percentage *</label>
                <input type="number" name="previousYearPercentage" value={formData.previousYearPercentage} onChange={handleInputChange} className={`form-input-glass ${fieldErrors.previousYearPercentage ? 'error' : ''}`} placeholder="Enter percentage (e.g., 85)" min="0" max="100" />
                {fieldErrors.previousYearPercentage && <div className="field-error-text">{fieldErrors.previousYearPercentage}</div>}
              </div>
              <div>
                <label className="form-label">Current Performance Level *</label>
                <div className="select-wrapper">
                <select name="currentPerformanceLevel" value={formData.currentPerformanceLevel} onChange={handleInputChange} className={`form-input-glass ${fieldErrors.currentPerformanceLevel ? 'error' : ''}`}> 
                  <option value="">Select performance level</option>
                  <option value="excellent">Excellent (90%+)</option>
                  <option value="good">Good (75-89%)</option>
                  <option value="average">Average (60-74%)</option>
                  <option value="below-average">Below Average (45-59%)</option>
                  <option value="needs-improvement">Needs Improvement (&lt;45%)</option>
                </select>
                </div>
                {fieldErrors.currentPerformanceLevel && <div className="field-error-text">{fieldErrors.currentPerformanceLevel}</div>}
              </div>
            </div>
            <div>
              <label className="form-label">Strong Subjects (Select all that apply)</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                {['Mathematics', 'Science', 'English', 'Social Studies', 'Computer Science', 'Physics', 'Chemistry', 'Biology', 'History', 'Geography', 'Economics', 'Political Science', 'Languages', 'Arts', 'Physical Education'].map(subject => (
                  <label key={subject} className="checkbox-label-glass">
                    <input type="checkbox" name="strongSubjects" value={subject} checked={formData.strongSubjects.includes(subject)} onChange={handleInputChange} className="form-checkbox-glass" />
                    <span>{subject}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="info-box-glass">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0"><span className="text-green-300 text-lg">🌟</span></div>
                <div>
                  <h4 className="font-semibold text-white">Your Strengths Matter</h4>
                  <p className="text-indigo-200 text-sm mt-1">Identifying your strong subjects helps us recommend career paths where you can excel.</p>
                </div>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <span className="text-2xl text-white">🌟</span>
              </div>
              <h2 className="text-2xl font-bold text-white">Career Interests</h2>
              <p className="text-indigo-200 mt-2">What are your career aspirations?</p>
            </div>
            <div>
              <label className="form-label">Describe your career interests or goals *</label>
              <textarea name="careerInterests" value={formData.careerInterests} onChange={handleInputChange} className={`form-input-glass h-32 ${fieldErrors.careerInterests ? 'error' : ''}`} placeholder="e.g., 'I want to become a software engineer', 'I'm interested in medical fields'"></textarea>
              {fieldErrors.careerInterests && <div className="field-error-text">{fieldErrors.careerInterests}</div>}
            </div>
            <div>
              <label className="form-label">Preferred Fields of Study (Select up to 3)</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                {['Engineering', 'Medicine', 'Business', 'Arts & Design', 'Computer Science', 'Law', 'Education', 'Journalism', 'Architecture', 'Civil Services', 'Defense', 'Research'].map(field => (
                  <label key={field} className="checkbox-label-glass">
                    <input type="checkbox" name="preferredFields" value={field} checked={formData.preferredFields.includes(field)} onChange={handleInputChange} className="form-checkbox-glass" disabled={formData.preferredFields.length >= 3 && !formData.preferredFields.includes(field)} />
                    <span>{field}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="form-label">Study Preferences</label>
              <div className="select-wrapper"><select name="studyPreferences" value={formData.studyPreferences} onChange={handleInputChange} className="form-input-glass">
                <option value="">Select your preference</option>
                <option value="technical">Technical (hands-on, practical)</option>
                <option value="theoretical">Theoretical (research, academic)</option>
                <option value="creative">Creative (arts, design, media)</option>
                <option value="analytical">Analytical (data, finance, logic)</option>
                <option value="social">Social (helping others, communication)</option>
              </select></div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <span className="text-2xl text-white">👨‍👩‍👧‍👦</span>
              </div>
              <h2 className="text-2xl font-bold text-white">Family Context</h2>
              <p className="text-indigo-200 mt-2">Help us understand your background</p>
            </div>
            <div className="form-grid two-cols">
              <div>
                <label className="form-label">Father's Occupation</label>
                <input type="text" name="fatherOccupation" value={formData.fatherOccupation} onChange={handleInputChange} className={`form-input-glass ${fieldErrors.fatherOccupation ? 'error' : ''}`} placeholder="e.g., Farmer, Teacher, Engineer" />
                {fieldErrors.fatherOccupation && <div className="field-error-text">{fieldErrors.fatherOccupation}</div>}
              </div>
              <div>
                <label className="form-label">Mother's Occupation</label>
                <input type="text" name="motherOccupation" value={formData.motherOccupation} onChange={handleInputChange} className={`form-input-glass ${fieldErrors.motherOccupation ? 'error' : ''}`} placeholder="e.g., Homemaker, Doctor, Business" />
                {fieldErrors.motherOccupation && <div className="field-error-text">{fieldErrors.motherOccupation}</div>}
              </div>
              <div>
                <label className="form-label">Annual Family Income</label>
                <div className="select-wrapper"><select name="familyIncome" value={formData.familyIncome} onChange={handleInputChange} className="form-input-glass">
                  <option value="">Select income range</option>
                  <option value="<1L">Less than ₹1,00,000</option>
                  <option value="1-3L">₹1,00,000 - ₹3,00,000</option>
                  <option value="3-5L">₹3,00,000 - ₹5,00,000</option>
                  <option value="5-10L">₹5,00,000 - ₹10,00,000</option>
                  <option value=">10L">More than ₹10,00,000</option>
                </select></div>
              </div>
              <div>
                <label className="form-label">Family Education Background</label>
                <div className="select-wrapper"><select name="familyEducationBackground" value={formData.familyEducationBackground} onChange={handleInputChange} className="form-input-glass">
                  <option value="">Select highest education level</option>
                  <option value="none">No formal education</option>
                  <option value="school">Up to 12th Standard</option>
                  <option value="graduate">Graduate</option>
                  <option value="post-graduate">Post-Graduate</option>
                  <option value="doctorate">Doctorate</option>
                </select></div>
              </div>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-r from-teal-400 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <span className="text-2xl text-white">📝</span>
              </div>
              <h2 className="text-2xl font-bold text-white">Additional Information</h2>
              <p className="text-indigo-200 mt-2">Any other details you'd like to share</p>
            </div>
            <div>
              <label className="form-label">Extracurricular Activities</label>
              <textarea name="extracurricularActivities" value={formData.extracurricularActivities} onChange={handleInputChange} className="form-input-glass" placeholder="e.g., Sports, music, volunteering"></textarea>
            </div>
            <div>
              <label className="form-label">Challenges or Obstacles</label>
              <textarea name="challenges" value={formData.challenges} onChange={handleInputChange} className="form-input-glass" placeholder="Any challenges you face in your studies?"></textarea>
            </div>
            <div>
              <label className="form-label">What kind of support do you need?</label>
              <textarea name="supportNeeded" value={formData.supportNeeded} onChange={handleInputChange} className="form-input-glass" placeholder="e.g., 'Help with choosing a stream', 'Info on scholarships'"></textarea>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
  <div className={`profile-page ${dark ? 'dark' : ''} min-h-screen text-white p-4 md:p-8 relative`}>
      <div className="absolute top-0 left-0 w-full h-full -z-10 pointer-events-none select-none">
        <div className="orb-1"></div>
        <div className="orb-2"></div>
        <div className="orb-3"></div>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Complete Your Profile</h1>
          <p className="text-indigo-200 text-lg">This helps us personalize your career guidance.</p>
        </div>
        <div className="profile-progress-wrapper">
          <div className="profile-phase-tabs" aria-label="Progress phases">
            {phases.map(phase => {
              const completedAllowed = validatePhase(phase.id) || phase.id < currentPhase; // can navigate back if validated
              const active = currentPhase === phase.id;
              const completed = currentPhase > phase.id;
              const state = active ? 'active' : completed ? 'completed' : '';
              return (
                <div
                  key={phase.id}
                  role="button"
                  tabIndex={completedAllowed ? 0 : -1}
                  onClick={() => completedAllowed && setCurrentPhase(phase.id)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && completedAllowed) setCurrentPhase(phase.id); }}
                  className={`profile-phase-tab ${state} ${completedAllowed ? 'clickable' : 'disabled'}`}
                  aria-current={active ? 'step' : undefined}
                  aria-disabled={!completedAllowed}
                >
                  {phase.title.split(' ')[0]}
                </div>
              );
            })}
          </div>
          <div className="progress-bar-glass" role="progressbar" aria-valuenow={getProgressPercentage()} aria-valuemin="0" aria-valuemax="100">
            <span style={{ width: `${getProgressPercentage()}%` }} />
          </div>
          <div className="profile-mode-toggle">
            <button type="button" onClick={() => setSolid(!solid)} className="auth-button-secondary" aria-pressed={solid}>
              {solid ? 'Glass Mode' : 'Solid Mode'}
            </button>
            <button type="button" onClick={() => setDark(!dark)} className="auth-button-secondary" aria-pressed={dark}>
              {dark ? 'Light Mode' : 'Dark Mode'}
            </button>
          </div>
        </div>

        <div className={`auth-card ${solid ? 'auth-card-solid' : ''}`}>
          <div className="fade-in phase-fields-animate">
            {renderPhaseContent()}
          </div>

          {error && (
            <div className="mt-6 p-4 bg-red-500/20 border border-red-500/50 text-red-200 rounded-lg text-center">
              {error}
            </div>
          )}
          {success && (
            <div className="mt-6 p-4 bg-green-500/20 border border-green-500/50 text-green-200 rounded-lg text-center">
              {success}
            </div>
          )}

          <div className="profile-nav">
            <button onClick={handlePrevious} disabled={currentPhase === 1 || loading} className="btn-glass disabled:opacity-50" aria-label="Previous phase">
              &larr; Previous
            </button>

            <div className="flex-1 text-center text-sm text-indigo-200">
              Phase {currentPhase} of {phases.length}
            </div>

            <button onClick={handleNext} disabled={loading || (currentPhase === 6 && !validatePhase(1))} className="btn-glass-primary next-button" aria-label={currentPhase === 6 ? 'Finish profile' : 'Next phase'}>
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                currentPhase === 6 ? 'Finish & Submit' : 'Next →'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
