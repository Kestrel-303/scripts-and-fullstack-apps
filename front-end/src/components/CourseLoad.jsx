import { useEffect, useState } from 'react';
import api from '../api/api';
import { Phone, Mail, X, AlertCircle, Layers } from 'lucide-react';
import Avatar from './Avatar';
import TeacherPopover from './TeacherPopover';

/**
 * CourseLoad Component:
 * Shows a student's enrolled courses and the teacher who leads each one.
 * Hovering a teacher's name/avatar shows a contact popover card; clicking
 * opens a full profile modal (bio, phone, optional email) in the middle
 * of the screen.
 *
 * Shared between ParentDashboard (viewing a child's courses) and StudentDashboard
 * (viewing their own courses) - only the `apiUrl` differs between the two.
 */
const CourseLoad = ({ apiUrl }) => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [modalCourse, setModalCourse] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const fetchCourses = async () => {
      setLoading(true);
      setLoadError('');
      try {
        const res = await api.get(apiUrl);
        if (!cancelled) setCourses(res.data);
      } catch (err) {
        console.error('Error fetching course load:', err);
        if (!cancelled) {
          setLoadError(err.response?.data?.detail || 'Failed to load course list.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    if (apiUrl) fetchCourses();

    return () => {
      cancelled = true;
    };
  }, [apiUrl]);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-slate-900">Course Load</h3>
        <p className="text-xs text-slate-500">Enrolled courses and the teachers who lead them</p>
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-500 flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm">Loading course load...</p>
        </div>
      ) : loadError ? (
        <div className="py-8 px-5 text-center text-rose-600 bg-rose-50 rounded-xl border border-rose-200 flex flex-col items-center gap-2">
          <AlertCircle size={22} />
          <p className="text-sm">{loadError}</p>
        </div>
      ) : courses.length === 0 ? (
        <div className="py-12 text-center text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
          No courses found for this grade level yet.
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {courses.map((course) => (
            <div
              key={course.id}
              className="p-5 bg-white rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all"
            >
              <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-md">
                {course.subject}
              </span>
              <h4 className="text-base font-semibold text-slate-900 mt-2">{course.name}</h4>

              {course.teacher ? (
                <TeacherPopover teacher={course.teacher}>
                  <button
                    type="button"
                    onClick={() => setModalCourse(course)}
                    className="mt-3 flex items-center gap-2 cursor-pointer group"
                  >
                    <Avatar src={course.teacher.profile_picture_url} name={course.teacher.full_name} size="xs" />
                    <span className="text-xs font-medium text-blue-600 group-hover:text-blue-800 underline decoration-dotted decoration-blue-300 underline-offset-2">
                      {course.teacher.full_name}
                    </span>
                  </button>
                </TeacherPopover>
              ) : (
                <p className="text-xs text-slate-400 mt-3">No teacher assigned yet.</p>
              )}
            </div>
          ))}
        </div>
      )}

      {modalCourse && <TeacherProfileModal course={modalCourse} onClose={() => setModalCourse(null)} />}
    </div>
  );
};

/**
 * TeacherProfileModal:
 * Full teacher profile popup shown when a course's teacher name is clicked.
 */
const TeacherProfileModal = ({ course, onClose }) => {
  const teacher = course.teacher;

  return (
    <div
      className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar src={teacher.profile_picture_url} name={teacher.full_name} size="lg" />
            <div>
              <h3 className="text-lg font-bold text-slate-900">{teacher.full_name}</h3>
              <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
                <Layers size={13} className="text-blue-600" />
                <span>
                  {course.name} ({course.subject})
                </span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-lg border border-slate-200">
          {teacher.bio || 'No description provided yet.'}
        </p>

        <div className="space-y-2.5">
          {teacher.phone ? (
            <div className="flex items-center gap-2.5 text-sm text-slate-700">
              <Phone size={15} className="text-blue-600 flex-shrink-0" />
              <span>{teacher.phone}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2.5 text-xs text-slate-400">
              <AlertCircle size={14} className="flex-shrink-0" />
              <span>No phone number on file.</span>
            </div>
          )}

          {(teacher.contact_email || teacher.email) && (
            <div className="flex items-center gap-2.5 text-sm text-slate-700">
              <Mail size={15} className="text-blue-600 flex-shrink-0" />
              <span>{teacher.contact_email || teacher.email}</span>
            </div>
          )}
        </div>

        {(teacher.contact_email || teacher.email) && (
          <a
            href={`mailto:${teacher.contact_email || teacher.email}`}
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
          >
            <Mail size={14} />
            <span>Email {teacher.full_name.split(' ')[0]}</span>
          </a>
        )}
      </div>
    </div>
  );
};

export default CourseLoad;
