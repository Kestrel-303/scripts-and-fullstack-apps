import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/api';
import Navbar from '../components/Navbar';
import Avatar from '../components/Avatar';
import {
  Users,
  ClipboardList,
  FileText,
  Mail,
  AlertCircle,
  CheckCircle2,
  Send,
  UserCircle,
} from 'lucide-react';

const DISCIPLINE_CATEGORIES = [
  'Commendation',
  'Tardiness',
  'Classroom Disruption',
  'Incident',
  'Bullying',
];

/**
 * TeacherDashboard Component:
 * 1. Class Roster tab - lists students with their parent's contact info.
 * 2. Log Discipline Note tab - form to draft a daily discipline/behavior note for a student.
 * 3. Report Card tab - form to submit/update a term grade for a student.
 */
const TeacherDashboard = () => {
  const { user, logout } = useAuth();

  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [rosterError, setRosterError] = useState('');
  const [activeTab, setActiveTab] = useState('roster'); // 'roster' | 'discipline' | 'report-card'

  const fetchStudents = async () => {
    setLoadingStudents(true);
    setRosterError('');
    try {
      const res = await api.get('/api/teacher/my-students');
      setStudents(res.data);
    } catch (err) {
      console.error('Error fetching students:', err);
      setRosterError(
        err.response?.data?.detail || 'Failed to load class roster. Please try again later.'
      );
    } finally {
      setLoadingStudents(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-4 sm:p-6 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* TOP BAR */}
        <Navbar
          title="Teacher Portal"
          subtitle={`Welcome, ${user?.full_name || ''}`}
          user={user}
          onLogout={logout}
        />

        {/* TAB NAVIGATION BAR */}
        <div className="flex border-b border-slate-200 space-x-2 sm:space-x-4 overflow-x-auto">
          <button
            onClick={() => setActiveTab('roster')}
            className={`flex items-center space-x-2 px-5 py-3 text-sm font-medium rounded-t-xl transition-all border-b-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'roster'
                ? 'bg-white text-blue-600 border-blue-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 border-transparent hover:bg-white/60'
            }`}
          >
            <Users size={18} />
            <span>Class Roster</span>
          </button>

          <button
            onClick={() => setActiveTab('discipline')}
            className={`flex items-center space-x-2 px-5 py-3 text-sm font-medium rounded-t-xl transition-all border-b-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'discipline'
                ? 'bg-white text-blue-600 border-blue-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 border-transparent hover:bg-white/60'
            }`}
          >
            <ClipboardList size={18} />
            <span>Log Discipline Note</span>
          </button>

          <button
            onClick={() => setActiveTab('report-card')}
            className={`flex items-center space-x-2 px-5 py-3 text-sm font-medium rounded-t-xl transition-all border-b-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'report-card'
                ? 'bg-white text-blue-600 border-blue-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 border-transparent hover:bg-white/60'
            }`}
          >
            <FileText size={18} />
            <span>Report Card</span>
          </button>

          <button
            onClick={() => setActiveTab('my-profile')}
            className={`flex items-center space-x-2 px-5 py-3 text-sm font-medium rounded-t-xl transition-all border-b-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'my-profile'
                ? 'bg-white text-blue-600 border-blue-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 border-transparent hover:bg-white/60'
            }`}
          >
            <UserCircle size={18} />
            <span>My Profile</span>
          </button>
        </div>

        {/* TAB CONTENT AREA */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 min-h-[350px] shadow-sm">

          {/* TAB 1: CLASS ROSTER */}
          {activeTab === 'roster' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Class Roster</h3>
                <p className="text-xs text-slate-500">Students and their parent/guardian contact info</p>
              </div>

              {loadingStudents ? (
                <div className="py-12 text-center text-slate-500 flex flex-col items-center space-y-3">
                  <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-sm">Loading roster...</p>
                </div>
              ) : rosterError ? (
                <div className="py-8 px-5 text-center text-rose-600 bg-rose-50 rounded-xl border border-rose-200 flex flex-col items-center gap-2">
                  <AlertCircle size={22} />
                  <p className="text-sm">{rosterError}</p>
                </div>
              ) : students.length === 0 ? (
                <div className="py-12 text-center text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
                  No students found.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left text-sm text-slate-700">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-semibold tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="px-5 py-3.5">Student</th>
                        <th className="px-5 py-3.5">Grade</th>
                        <th className="px-5 py-3.5">Parent / Guardian</th>
                        <th className="px-5 py-3.5">Parent Contact</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {students.map((st) => (
                        <tr key={st.student_id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-5 py-4 font-semibold text-slate-900">
                            <div className="flex items-center gap-2.5">
                              <Avatar src={st.profile_picture_url} name={st.full_name} size="xs" />
                              <span>{st.full_name}</span>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-200 text-xs">
                              {st.grade_level}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-slate-700">{st.parent_name}</td>
                          <td className="px-5 py-4 text-slate-500 text-xs">
                            {st.parent_email ? (
                              <span className="flex items-center gap-1.5">
                                <Mail size={13} className="text-slate-400" />
                                {st.parent_email}
                              </span>
                            ) : (
                              <span className="text-slate-400">No contact on file</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: LOG DISCIPLINE NOTE */}
          {activeTab === 'discipline' && (
            <DisciplineForm students={students} />
          )}

          {/* TAB 3: REPORT CARD */}
          {activeTab === 'report-card' && (
            <ReportCardForm students={students} />
          )}

          {/* TAB 4: MY PROFILE */}
          {activeTab === 'my-profile' && <MyProfileForm user={user} />}
        </div>
      </div>
    </div>
  );
};

/**
 * DisciplineForm:
 * Lets a teacher draft a daily discipline/behavior note for a student.
 * Submits as DRAFT status via POST /api/teacher/discipline.
 */
const DisciplineForm = ({ students }) => {
  const [studentId, setStudentId] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [incidentDate, setIncidentDate] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const errors = {};
    if (!studentId) errors.studentId = 'Please select a student.';
    if (!category) errors.category = 'Please select a category.';
    if (!description.trim()) {
      errors.description = 'Description is required.';
    } else if (description.trim().length < 10) {
      errors.description = 'Description must be at least 10 characters.';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    setSuccessMessage('');

    if (!validate()) return;

    setSubmitting(true);
    try {
      await api.post('/api/teacher/discipline', {
        student_id: Number(studentId),
        category,
        description: description.trim(),
        incident_date: incidentDate || undefined,
        status: 'DRAFT',
      });

      setSuccessMessage('Discipline note saved as draft. Submit it for admin review when ready.');
      setStudentId('');
      setCategory('');
      setDescription('');
      setIncidentDate('');
      setFieldErrors({});
    } catch (err) {
      console.error('Error submitting discipline note:', err);
      setSubmitError(
        err.response?.data?.detail || 'Failed to save discipline note. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h3 className="text-lg font-bold text-slate-900">Log Discipline / Behavior Note</h3>
        <p className="text-xs text-slate-500">
          Saved as a draft. It will need to be submitted and approved by the principal before parents can see it.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Student</label>
          <select
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            className={`w-full bg-white border rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              fieldErrors.studentId ? 'border-rose-400' : 'border-slate-300'
            }`}
          >
            <option value="">Select a student...</option>
            {students.map((st) => (
              <option key={st.student_id} value={st.student_id}>
                {st.full_name} ({st.grade_level})
              </option>
            ))}
          </select>
          {fieldErrors.studentId && <p className="text-xs text-rose-600 mt-1">{fieldErrors.studentId}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={`w-full bg-white border rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              fieldErrors.category ? 'border-rose-400' : 'border-slate-300'
            }`}
          >
            <option value="">Select a category...</option>
            {DISCIPLINE_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          {fieldErrors.category && <p className="text-xs text-rose-600 mt-1">{fieldErrors.category}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Incident Date</label>
          <input
            type="date"
            value={incidentDate}
            onChange={(e) => setIncidentDate(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-[11px] text-slate-400 mt-1">Leave blank to use today's date.</p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Description / Notes</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className={`w-full bg-white border rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              fieldErrors.description ? 'border-rose-400' : 'border-slate-300'
            }`}
            placeholder="Describe what happened..."
          />
          {fieldErrors.description && <p className="text-xs text-rose-600 mt-1">{fieldErrors.description}</p>}
        </div>

        {submitError && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-xs text-rose-700">
            <AlertCircle size={14} className="flex-shrink-0" />
            <span>{submitError}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-xs text-emerald-700">
            <CheckCircle2 size={14} className="flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
        >
          {submitting ? <span>Saving...</span> : (
            <>
              <Send size={14} />
              <span>Save Discipline Note</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};

/**
 * ReportCardForm:
 * Lets a teacher submit or update a term grade for a student/subject via POST /api/teacher/report-card.
 */
const ReportCardForm = ({ students }) => {
  const [studentId, setStudentId] = useState('');
  const [term, setTerm] = useState('');
  const [subject, setSubject] = useState('');
  const [grade, setGrade] = useState('');
  const [comments, setComments] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const errors = {};
    if (!studentId) errors.studentId = 'Please select a student.';
    if (!term.trim()) errors.term = 'Term is required (e.g. "Fall 2026").';
    if (!subject.trim()) errors.subject = 'Subject is required.';
    if (!grade.trim()) {
      errors.grade = 'Grade is required.';
    } else if (grade.trim().length > 3) {
      errors.grade = 'Grade should be short (e.g. "A", "B+", "92").';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    setSuccessMessage('');

    if (!validate()) return;

    setSubmitting(true);
    try {
      await api.post('/api/teacher/report-card', {
        student_id: Number(studentId),
        term: term.trim(),
        subject: subject.trim(),
        grade: grade.trim(),
        teacher_comments: comments.trim() || undefined,
      });

      setSuccessMessage('Report card submitted successfully.');
      setTerm('');
      setSubject('');
      setGrade('');
      setComments('');
      setFieldErrors({});
    } catch (err) {
      console.error('Error submitting report card:', err);
      setSubmitError(
        err.response?.data?.detail || 'Failed to submit report card. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h3 className="text-lg font-bold text-slate-900">Submit / Update Report Card Grade</h3>
        <p className="text-xs text-slate-500">
          Submitting a grade for a student/term/subject that already exists will update it.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Student</label>
          <select
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            className={`w-full bg-white border rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              fieldErrors.studentId ? 'border-rose-400' : 'border-slate-300'
            }`}
          >
            <option value="">Select a student...</option>
            {students.map((st) => (
              <option key={st.student_id} value={st.student_id}>
                {st.full_name} ({st.grade_level})
              </option>
            ))}
          </select>
          {fieldErrors.studentId && <p className="text-xs text-rose-600 mt-1">{fieldErrors.studentId}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Term</label>
            <input
              type="text"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Fall 2026"
              className={`w-full bg-white border rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                fieldErrors.term ? 'border-rose-400' : 'border-slate-300'
              }`}
            />
            {fieldErrors.term && <p className="text-xs text-rose-600 mt-1">{fieldErrors.term}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Mathematics"
              className={`w-full bg-white border rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                fieldErrors.subject ? 'border-rose-400' : 'border-slate-300'
              }`}
            />
            {fieldErrors.subject && <p className="text-xs text-rose-600 mt-1">{fieldErrors.subject}</p>}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Grade</label>
          <input
            type="text"
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            placeholder="A-"
            className={`w-full bg-white border rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              fieldErrors.grade ? 'border-rose-400' : 'border-slate-300'
            }`}
          />
          {fieldErrors.grade && <p className="text-xs text-rose-600 mt-1">{fieldErrors.grade}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Teacher Comments (optional)</label>
          <textarea
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            rows={3}
            className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Optional comments for the parent..."
          />
        </div>

        {submitError && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-xs text-rose-700">
            <AlertCircle size={14} className="flex-shrink-0" />
            <span>{submitError}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-xs text-emerald-700">
            <CheckCircle2 size={14} className="flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
        >
          {submitting ? <span>Submitting...</span> : (
            <>
              <Send size={14} />
              <span>Submit Report Card</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};

/**
 * MyProfileForm:
 * Lets a teacher set the public contact profile (phone, optional email, bio) that
 * parents and students see when they click into the teacher's name on the Course Load page.
 */
const MyProfileForm = ({ user }) => {
  const [phone, setPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setLoadError('');
      try {
        const res = await api.get('/api/teacher/my-profile');
        setPhone(res.data.phone || '');
        setContactEmail(res.data.contact_email || '');
        setBio(res.data.bio || '');
      } catch (err) {
        console.error('Error fetching teacher profile:', err);
        setLoadError(err.response?.data?.detail || 'Failed to load your profile.');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const validate = () => {
    const errors = {};
    if (!phone.trim()) {
      errors.phone = 'Phone number is required.';
    }
    if (contactEmail.trim()) {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(contactEmail.trim())) {
        errors.contactEmail = 'Please enter a valid email address, or leave it blank.';
      }
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    setSuccessMessage('');

    if (!validate()) return;

    setSubmitting(true);
    try {
      await api.put('/api/teacher/my-profile', {
        phone: phone.trim(),
        contact_email: contactEmail.trim() || null,
        bio: bio.trim() || null,
      });
      setSuccessMessage('Your profile has been updated. Parents and students will see these details on the Course Load page.');
    } catch (err) {
      console.error('Error updating teacher profile:', err);
      setSubmitError(err.response?.data?.detail || 'Failed to update your profile. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-12 text-center text-slate-500 flex flex-col items-center space-y-3">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm">Loading your profile...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-xl">
      <div className="flex items-center gap-4">
        <Avatar src={user?.profile_picture_url} name={user?.full_name} size="lg" />
        <div>
          <h3 className="text-lg font-bold text-slate-900">My Public Profile</h3>
          <p className="text-xs text-slate-500">
            Shown to parents and students when they view a course you teach and click your name.
          </p>
        </div>
      </div>

      {loadError && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-xs text-rose-700">
          <AlertCircle size={14} className="flex-shrink-0" />
          <span>{loadError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Phone Number</label>
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="555-0142"
            className={`w-full bg-white border rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              fieldErrors.phone ? 'border-rose-400' : 'border-slate-300'
            }`}
          />
          {fieldErrors.phone && <p className="text-xs text-rose-600 mt-1">{fieldErrors.phone}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Contact Email (optional)</label>
          <input
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            placeholder="you@school.edu"
            className={`w-full bg-white border rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              fieldErrors.contactEmail ? 'border-rose-400' : 'border-slate-300'
            }`}
          />
          {fieldErrors.contactEmail && <p className="text-xs text-rose-600 mt-1">{fieldErrors.contactEmail}</p>}
          <p className="text-[11px] text-slate-400 mt-1">Leave blank to hide email and show only your phone number.</p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">About / Description</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="A short bio parents and students will see on your course cards..."
          />
        </div>

        {submitError && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-xs text-rose-700">
            <AlertCircle size={14} className="flex-shrink-0" />
            <span>{submitError}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-xs text-emerald-700">
            <CheckCircle2 size={14} className="flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
        >
          {submitting ? <span>Saving...</span> : (
            <>
              <Send size={14} />
              <span>Save Profile</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default TeacherDashboard;
