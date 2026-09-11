import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/api';
import CourseLoad from '../components/CourseLoad';
import Navbar from '../components/Navbar';
import {
  BookOpen,
  User,
  FileText,
  Video,
  Download,
  Pencil,
  X,
  Clock3,
  AlertCircle,
  CheckCircle2,
  Layers,
} from 'lucide-react';

/**
 * StudentDashboard Component:
 * 1. Academic Resources tab - static list of downloadable study material & video guides.
 * 2. My Profile tab - shows the student's own details with an "Edit Details" modal.
 *    Edits are submitted to the backend and stored as a pending change awaiting admin approval.
 */
const StudentDashboard = () => {
  const { user, logout } = useAuth();

  const [profile, setProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('resources'); // 'resources' | 'profile'
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);

  // Static academic resource list (no backend endpoint exists for this yet)
  const academicResources = [
    {
      id: 1,
      title: 'Algebra II - Complete Study Guide',
      type: 'PDF',
      subject: 'Mathematics',
      description: 'Chapter summaries, worked examples, and practice problems.',
    },
    {
      id: 2,
      title: 'World History: Revolutions Reading Pack',
      type: 'Book',
      subject: 'History',
      description: 'Assigned readings covering the 18th-19th century revolutions unit.',
    },
    {
      id: 3,
      title: 'Cell Biology Explained',
      type: 'Video',
      subject: 'Biology',
      description: '25-minute walkthrough of cell structure and function.',
    },
    {
      id: 4,
      title: 'Essay Writing & Citation Basics',
      type: 'PDF',
      subject: 'English',
      description: 'Guide to structuring essays and citing sources correctly.',
    },
    {
      id: 5,
      title: 'Intro to Chemical Reactions',
      type: 'Video',
      subject: 'Chemistry',
      description: 'Visual guide to balancing equations and reaction types.',
    },
  ];

  const getResourceIcon = (type) => {
    if (type === 'Video') return <Video size={18} className="text-rose-500" />;
    if (type === 'Book') return <BookOpen size={18} className="text-amber-500" />;
    return <FileText size={18} className="text-sky-500" />;
  };

  const fetchProfile = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const response = await api.get('/api/student/me');
      setProfile(response.data);
    } catch (err) {
      console.error('Error fetching student profile:', err);
      setLoadError(
        err.response?.data?.detail || 'Failed to load your profile. Please try again later.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-4 sm:p-6 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* TOP BAR */}
        <Navbar
          title={profile?.student?.full_name || user?.full_name || 'Student Portal'}
          subtitle={
            profile?.student?.grade_level
              ? `Student Portal • ${profile.student.grade_level}`
              : 'Student Portal'
          }
          user={user}
          onLogout={logout}
        />

        {/* TAB NAVIGATION BAR */}
        <div className="flex border-b border-slate-200 space-x-2 sm:space-x-4">
          <button
            onClick={() => setActiveTab('resources')}
            className={`flex items-center space-x-2 px-5 py-3 text-sm font-medium rounded-t-xl transition-all border-b-2 cursor-pointer ${
              activeTab === 'resources'
                ? 'bg-white text-blue-600 border-blue-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 border-transparent hover:bg-white/60'
            }`}
          >
            <BookOpen size={18} />
            <span>Academic Resources</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center space-x-2 px-5 py-3 text-sm font-medium rounded-t-xl transition-all border-b-2 cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-white text-blue-600 border-blue-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 border-transparent hover:bg-white/60'
            }`}
          >
            <User size={18} />
            <span>My Profile</span>
          </button>

          <button
            onClick={() => setActiveTab('courses')}
            className={`flex items-center space-x-2 px-5 py-3 text-sm font-medium rounded-t-xl transition-all border-b-2 cursor-pointer ${
              activeTab === 'courses'
                ? 'bg-white text-blue-600 border-blue-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 border-transparent hover:bg-white/60'
            }`}
          >
            <Layers size={18} />
            <span>Course Load</span>
          </button>
        </div>

        {/* TAB CONTENT AREA */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 min-h-[350px] shadow-sm">

          {/* TAB 3: COURSE LOAD */}
          {activeTab === 'courses' && <CourseLoad apiUrl="/api/student/courses" />}

          {/* TAB 1: ACADEMIC RESOURCES */}
          {activeTab === 'resources' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Academic Resources</h3>
                <p className="text-xs text-slate-500">Downloadable study guides, reading material, and video lessons</p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {academicResources.map((res) => (
                  <div
                    key={res.id}
                    className="p-5 bg-white rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 bg-slate-100 text-slate-600 border border-slate-200 rounded-md">
                          {getResourceIcon(res.type)}
                          {res.type}
                        </span>
                        <span className="text-[11px] text-blue-700">{res.subject}</span>
                      </div>
                      <h4 className="text-base font-semibold text-slate-900 mt-1">{res.title}</h4>
                      <p className="text-xs text-slate-500 mt-1">{res.description}</p>
                    </div>

                    <button
                      type="button"
                      className="mt-4 flex items-center justify-center gap-2 text-xs font-semibold px-4 py-2.5 bg-blue-50 hover:bg-blue-100 active:bg-blue-200 text-blue-700 border border-blue-200 rounded-lg transition-all cursor-pointer"
                    >
                      <Download size={14} />
                      <span>{res.type === 'Video' ? 'Watch Video' : 'Download'}</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: MY PROFILE */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">My Profile</h3>
                  <p className="text-xs text-slate-500">Your personal details on file with the school</p>
                </div>
                {profile?.student && (
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    <Pencil size={14} />
                    <span>Edit Details</span>
                  </button>
                )}
              </div>

              {loading ? (
                <div className="py-12 text-center text-slate-500 flex flex-col items-center space-y-3">
                  <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-sm">Loading your profile...</p>
                </div>
              ) : loadError ? (
                <div className="py-8 px-5 text-center text-rose-600 bg-rose-50 rounded-xl border border-rose-200 flex flex-col items-center gap-2">
                  <AlertCircle size={22} />
                  <p className="text-sm">{loadError}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Full Name</p>
                      <p className="text-sm text-slate-900 mt-1">{profile.student.full_name}</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Email</p>
                      <p className="text-sm text-slate-900 mt-1">{profile.student.email}</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Grade Level</p>
                      <p className="text-sm text-slate-900 mt-1">{profile.student.grade_level}</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Student ID</p>
                      <p className="text-sm text-slate-900 mt-1">#{profile.student.student_id}</p>
                    </div>
                  </div>

                  {profile.student.pending_bio_changes && (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
                      <Clock3 size={18} className="text-amber-600 mt-0.5 flex-shrink-0" />
                      <div className="text-xs text-amber-800">
                        <p className="font-semibold mb-1">Pending Admin Approval</p>
                        <p>Name: {profile.student.pending_bio_changes.full_name}</p>
                        <p>Email: {profile.student.pending_bio_changes.email}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {isModalOpen && profile?.student && (
        <EditDetailsModal
          initialFullName={profile.student.full_name}
          initialEmail={profile.student.email}
          onClose={() => setIsModalOpen(false)}
          onSaved={(updatedProfile) => {
            setProfile(updatedProfile);
            setIsModalOpen(false);
          }}
        />
      )}
    </div>
  );
};

/**
 * EditDetailsModal:
 * Simple form for a student to request an edit to their full name / email.
 * On submit, calls PATCH /api/student/bio-change, then re-fetches the profile so the
 * pending change banner reflects the latest state.
 */
const EditDetailsModal = ({ initialFullName, initialEmail, onClose, onSaved }) => {
  const [fullName, setFullName] = useState(initialFullName || '');
  const [email, setEmail] = useState(initialEmail || '');
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const errors = {};
    if (!fullName.trim()) {
      errors.fullName = 'Full name is required.';
    } else if (fullName.trim().length < 2) {
      errors.fullName = 'Full name must be at least 2 characters.';
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      errors.email = 'Email is required.';
    } else if (!emailPattern.test(email.trim())) {
      errors.email = 'Please enter a valid email address.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');

    if (!validate()) return;

    setSubmitting(true);
    try {
      await api.patch('/api/student/bio-change', {
        full_name: fullName.trim(),
        email: email.trim(),
      });

      // Re-fetch the full profile so the pending-changes banner reflects the update
      const response = await api.get('/api/student/me');
      onSaved(response.data);
    } catch (err) {
      console.error('Error submitting bio change request:', err);
      setSubmitError(
        err.response?.data?.detail || 'Failed to submit your changes. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">Edit Details</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <p className="text-xs text-slate-500">
          Changes are submitted for admin review and won't appear on your profile until approved.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className={`w-full bg-white border rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                fieldErrors.fullName ? 'border-rose-400' : 'border-slate-300'
              }`}
              placeholder="Full name"
            />
            {fieldErrors.fullName && (
              <p className="text-xs text-rose-600 mt-1">{fieldErrors.fullName}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full bg-white border rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                fieldErrors.email ? 'border-rose-400' : 'border-slate-300'
              }`}
              placeholder="you@example.com"
            />
            {fieldErrors.email && (
              <p className="text-xs text-rose-600 mt-1">{fieldErrors.email}</p>
            )}
          </div>

          {submitError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-xs text-rose-700">
              <AlertCircle size={14} className="flex-shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <span>Submitting...</span>
              ) : (
                <>
                  <CheckCircle2 size={14} />
                  <span>Submit for Approval</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StudentDashboard;
