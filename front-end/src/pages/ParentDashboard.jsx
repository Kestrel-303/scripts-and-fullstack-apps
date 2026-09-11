import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/api';
import CourseLoad from '../components/CourseLoad';
import Navbar from '../components/Navbar';
import {
  GraduationCap,
  BookOpen,
  Award,
  ShieldCheck,
  Calendar,
  ChevronDown,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Layers,
} from 'lucide-react';

/**
 * ParentDashboard Component:
 * Displays student records for linked children across 4 tabs:
 * 1. Academic Progress (Report Cards table)
 * 2. Activities & Involvement (Clubs & Sports list)
 * 3. Daily Discipline & Behavior (Timeline of published reviews with color-coded badges)
 */
const ParentDashboard = () => {
  const { user, logout } = useAuth();

  // State management
  const [children, setChildren] = useState([]);
  const [selectedChildId, setSelectedChildId] = useState(null);
  const [childDetails, setChildDetails] = useState(null);
  const [activeTab, setActiveTab] = useState('academic'); // 'academic' | 'activities' | 'discipline'
  const [loadingChildren, setLoadingChildren] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);

  /**
   * 1. Initial Load: Fetch list of children linked to current parent
   */
  useEffect(() => {
    const fetchChildren = async () => {
      try {
        const response = await api.get('/api/parent/children');
        setChildren(response.data);
        if (response.data.length > 0) {
          // Automatically select first child
          setSelectedChildId(response.data[0].student_id);
        }
      } catch (err) {
        console.error('Error fetching parent children:', err);
      } finally {
        setLoadingChildren(false);
      }
    };

    fetchChildren();
  }, []);

  /**
   * 2. Child Selection Change: Fetch selected child's report cards & published discipline logs
   */
  useEffect(() => {
    if (!selectedChildId) return;

    const fetchChildDetails = async () => {
      setLoadingDetails(true);
      try {
        const response = await api.get(`/api/parent/child/${selectedChildId}`);
        setChildDetails(response.data);
      } catch (err) {
        console.error(`Error fetching details for child ${selectedChildId}:`, err);
      } finally {
        setLoadingDetails(false);
      }
    };

    fetchChildDetails();
  }, [selectedChildId]);

  // Current selected child summary
  const currentChild = children.find((c) => c.student_id === Number(selectedChildId));

  /**
   * Helper function: Returns badge styling based on discipline incident category
   * Green: Commendation / Positive
   * Yellow: Tardiness / Note
   * Red: Incident / Bullying / Disruption
   */
  const getCategoryBadgeStyle = (category) => {
    const catLower = (category || '').toLowerCase();
    if (catLower.includes('commendation') || catLower.includes('praise') || catLower.includes('positive')) {
      return {
        bg: 'bg-emerald-50 border-emerald-200 text-emerald-700',
        icon: <CheckCircle2 size={16} className="text-emerald-600" />,
        type: 'Commendation',
      };
    } else if (catLower.includes('tardiness') || catLower.includes('note') || catLower.includes('warning')) {
      return {
        bg: 'bg-amber-50 border-amber-200 text-amber-700',
        icon: <Clock size={16} className="text-amber-600" />,
        type: 'Note',
      };
    } else {
      return {
        bg: 'bg-rose-50 border-rose-200 text-rose-700',
        icon: <AlertTriangle size={16} className="text-rose-600" />,
        type: 'Incident',
      };
    }
  };

  /**
   * Helper function: Returns grade badge color
   */
  const getGradeBadgeStyle = (grade) => {
    if (grade.startsWith('A')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (grade.startsWith('B')) return 'bg-sky-50 text-sky-700 border-sky-200';
    if (grade.startsWith('C')) return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-slate-100 text-slate-600 border-slate-200';
  };

  // Mock Extracurricular Activities Data for Tab 2
  const mockActivities = [
    {
      id: 1,
      name: 'Science Olympiad & Chemistry Club',
      category: 'Academic Club',
      role: 'Active Team Member',
      schedule: 'Tuesdays & Thursdays (3:30 PM - 5:00 PM)',
      supervisor: 'Dr. Arthur Vance',
    },
    {
      id: 2,
      name: 'Varsity Athletics & Track',
      category: 'Sports',
      role: 'Team Captain (Sprinter)',
      schedule: 'Mon, Wed, Fri (4:00 PM - 6:00 PM)',
      supervisor: 'Coach Marcus Reed',
    },
    {
      id: 3,
      name: 'Student Debate Society',
      category: 'Leadership & Public Speaking',
      role: 'Junior Delegate',
      schedule: 'Wednesdays (3:30 PM - 4:30 PM)',
      supervisor: 'Eleanor Vance',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-4 sm:p-6 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* TOP BAR & NAVIGATION */}
        <Navbar
          title="Parent Portal"
          subtitle={`Welcome, ${user?.full_name || ''}`}
          user={user}
          onLogout={logout}
        />

        {/* CHILD HEADER & SELECTOR CARD */}
        {loadingChildren ? (
          <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center text-slate-500 shadow-sm">
            Loading child profiles...
          </div>
        ) : children.length === 0 ? (
          <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center text-slate-500 shadow-sm">
            No children currently linked to this parent account.
          </div>
        ) : (
          <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md font-semibold text-2xl">
                <GraduationCap size={32} />
              </div>
              <div>
                <div className="flex items-center space-x-3">
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                    {childDetails?.student?.full_name || currentChild?.full_name}
                  </h2>
                  <span className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold rounded-full">
                    {childDetails?.student?.grade_level || currentChild?.grade_level}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1 flex items-center space-x-2">
                  <span>Student ID: #{selectedChildId}</span>
                  <span>•</span>
                  <span>{childDetails?.student?.email || currentChild?.email}</span>
                </p>
              </div>
            </div>

            {/* Child Dropdown Selector (if parent has multiple children) */}
            {children.length > 1 && (
              <div className="relative">
                <label className="block text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-1">
                  Select Child
                </label>
                <div className="relative">
                  <select
                    value={selectedChildId}
                    onChange={(e) => setSelectedChildId(Number(e.target.value))}
                    className="appearance-none bg-white border border-slate-300 text-slate-900 text-sm rounded-xl pl-4 pr-10 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    {children.map((c) => (
                      <option key={c.student_id} value={c.student_id}>
                        {c.full_name} ({c.grade_level})
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={16} className="absolute right-3 top-3 text-slate-400 pointer-events-none" />
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB NAVIGATION BAR */}
        <div className="flex border-b border-slate-200 space-x-2 sm:space-x-4 overflow-x-auto">
          <button
            onClick={() => setActiveTab('academic')}
            className={`flex items-center space-x-2 px-5 py-3 text-sm font-medium rounded-t-xl transition-all border-b-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'academic'
                ? 'bg-white text-blue-600 border-blue-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 border-transparent hover:bg-white/60'
            }`}
          >
            <BookOpen size={18} />
            <span>Tab 1: Academic Progress</span>
          </button>

          <button
            onClick={() => setActiveTab('activities')}
            className={`flex items-center space-x-2 px-5 py-3 text-sm font-medium rounded-t-xl transition-all border-b-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'activities'
                ? 'bg-white text-blue-600 border-blue-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 border-transparent hover:bg-white/60'
            }`}
          >
            <Award size={18} />
            <span>Tab 2: Activities & Involvement</span>
          </button>

          <button
            onClick={() => setActiveTab('discipline')}
            className={`flex items-center space-x-2 px-5 py-3 text-sm font-medium rounded-t-xl transition-all border-b-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'discipline'
                ? 'bg-white text-blue-600 border-blue-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 border-transparent hover:bg-white/60'
            }`}
          >
            <ShieldCheck size={18} />
            <span>Tab 3: Daily Discipline & Behavior</span>
          </button>

          <button
            onClick={() => setActiveTab('courses')}
            className={`flex items-center space-x-2 px-5 py-3 text-sm font-medium rounded-t-xl transition-all border-b-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'courses'
                ? 'bg-white text-blue-600 border-blue-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 border-transparent hover:bg-white/60'
            }`}
          >
            <Layers size={18} />
            <span>Tab 4: Course Load</span>
          </button>
        </div>

        {/* TAB CONTENT AREA */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 min-h-[350px] shadow-sm">
          {activeTab === 'courses' ? (
            selectedChildId && (
              <CourseLoad apiUrl={`/api/parent/child/${selectedChildId}/courses`} />
            )
          ) : loadingDetails ? (
            <div className="py-12 text-center text-slate-500 flex flex-col items-center justify-center space-y-3">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm">Fetching student records...</p>
            </div>
          ) : (
            <>
              {/* TAB 1: ACADEMIC PROGRESS */}
              {activeTab === 'academic' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">Academic Report Cards</h3>
                      <p className="text-xs text-slate-500">Current term grades and instructor comments</p>
                    </div>
                  </div>

                  {!childDetails?.report_cards || childDetails.report_cards.length === 0 ? (
                    <div className="py-12 text-center text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
                      No academic report card records found for this student.
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                      <table className="w-full text-left text-sm text-slate-700">
                        <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-semibold tracking-wider border-b border-slate-200">
                          <tr>
                            <th className="px-5 py-3.5">Subject</th>
                            <th className="px-5 py-3.5">Term</th>
                            <th className="px-5 py-3.5">Grade</th>
                            <th className="px-5 py-3.5">Teacher Comments</th>
                            <th className="px-5 py-3.5">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {childDetails.report_cards.map((rc) => (
                            <tr key={rc.id} className="hover:bg-slate-50 transition-colors">
                              <td className="px-5 py-4 font-semibold text-slate-900">{rc.subject}</td>
                              <td className="px-5 py-4 text-slate-500 text-xs">{rc.term}</td>
                              <td className="px-5 py-4">
                                <span className={`inline-block px-3 py-1 rounded-lg text-xs font-bold border ${getGradeBadgeStyle(rc.grade)}`}>
                                  {rc.grade}
                                </span>
                              </td>
                              <td className="px-5 py-4 text-slate-600 text-xs max-w-xs leading-relaxed">
                                {rc.teacher_comments || 'No comments added.'}
                              </td>
                              <td className="px-5 py-4">
                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  {rc.status === 'ADMIN_APPROVED' ? 'Approved' : rc.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: ACTIVITIES & INVOLVEMENT */}
              {activeTab === 'activities' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Activities & Extracurricular Involvement</h3>
                    <p className="text-xs text-slate-500">School clubs, sports teams, and leadership roles</p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    {mockActivities.map((act) => (
                      <div
                        key={act.id}
                        className="p-5 bg-white rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-md">
                              {act.category}
                            </span>
                            <span className="text-xs text-slate-500 flex items-center space-x-1">
                              <Calendar size={13} className="text-slate-400" />
                              <span>{act.schedule}</span>
                            </span>
                          </div>

                          <h4 className="text-base font-semibold text-slate-900 mt-1">{act.name}</h4>
                          <p className="text-xs text-blue-700 font-medium mt-1">Role: {act.role}</p>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
                          <span>Faculty Supervisor: {act.supervisor}</span>
                          <span className="text-emerald-600 font-medium text-[11px]">Active</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: DAILY DISCIPLINE & BEHAVIOR TIMELINE */}
              {activeTab === 'discipline' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Daily Discipline & Behavior Timeline</h3>
                    <p className="text-xs text-slate-500">
                      Published daily reviews and behavior logs (Only admin-approved published logs are visible here)
                    </p>
                  </div>

                  {!childDetails?.discipline_reviews || childDetails.discipline_reviews.length === 0 ? (
                    <div className="py-12 text-center text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
                      No published discipline or behavior logs for this student.
                    </div>
                  ) : (
                    <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                      {childDetails.discipline_reviews.map((log) => {
                        const badge = getCategoryBadgeStyle(log.category);
                        return (
                          <div key={log.id} className="relative group">
                            {/* Timeline Node Icon */}
                            <div className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-white border-2 border-blue-600 group-hover:scale-110 transition-transform"></div>

                            {/* Log Item Card */}
                            <div className="p-5 bg-white rounded-xl border border-slate-200 space-y-3 shadow-sm">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center space-x-2">
                                  <span className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-semibold border ${badge.bg}`}>
                                    {badge.icon}
                                    <span>{log.category} ({badge.type})</span>
                                  </span>
                                </div>
                                <span className="text-xs text-slate-500 flex items-center space-x-1">
                                  <Calendar size={13} className="text-slate-400" />
                                  <span>{log.incident_date}</span>
                                </span>
                              </div>

                              <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200">
                                "{log.description}"
                              </p>

                              <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                                <span>Logged by: {log.logged_by_teacher}</span>
                                <span className="text-emerald-600 font-medium text-[11px] flex items-center space-x-1">
                                  <CheckCircle2 size={12} />
                                  <span>Approved & Published</span>
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

      </div>
    </div>
  );
};

export default ParentDashboard;
