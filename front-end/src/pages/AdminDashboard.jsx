import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/api';
import Navbar from '../components/Navbar';
import Avatar from '../components/Avatar';
import {
  CheckCircle2,
  Calendar,
  Clock,
  Send,
  Bell,
  UserCog,
  Check,
  X,
} from 'lucide-react';

/**
 * AdminDashboard Component (Principal Approval Queue):
 * Renders the pending discipline queue containing teacher-logged incident reports,
 * and a notification queue of student profile edit requests awaiting approval.
 * Allows the Principal (ADMIN_PRINCIPAL) to review and approve/publish/apply both in real-time.
 */
const AdminDashboard = () => {
  const { user, logout } = useAuth();

  // Discipline queue state
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState(null);

  // Student profile change request (notification) state
  const [bioRequests, setBioRequests] = useState([]);
  const [loadingBioRequests, setLoadingBioRequests] = useState(true);
  const [bioActionId, setBioActionId] = useState(null);

  const [toastMessage, setToastMessage] = useState(null);

  /**
   * 1. Fetch pending discipline reviews from backend
   */
  const fetchQueue = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/admin/discipline-queue');
      setQueue(response.data);
    } catch (err) {
      console.error('Error fetching admin queue:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 2. Fetch pending student profile edit requests (notifications) from backend
   */
  const fetchBioRequests = async () => {
    setLoadingBioRequests(true);
    try {
      const response = await api.get('/api/admin/bio-change-requests');
      setBioRequests(response.data);
    } catch (err) {
      console.error('Error fetching bio change requests:', err);
    } finally {
      setLoadingBioRequests(false);
    }
  };

  useEffect(() => {
    fetchQueue();
    fetchBioRequests();
  }, []);

  const notificationCount = queue.length + bioRequests.length;

  /**
   * 3. Approve & Publish handler:
   * Invokes PATCH /api/admin/discipline/{id}/approve
   * Updates state in real-time by removing the approved item from the queue list.
   */
  const handleApproveAndPublish = async (id, studentName) => {
    setApprovingId(id);
    try {
      await api.patch(`/api/admin/discipline/${id}/approve`);

      // Real-time state update: filter out approved review
      setQueue((prevQueue) => prevQueue.filter((item) => item.id !== id));

      // Show temporary success toast feedback
      setToastMessage(`Discipline review for ${studentName} successfully approved and published to Parent Portal!`);
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err) {
      console.error(`Approval failed for log #${id}:`, err);
      alert('Failed to approve discipline log. Please try again.');
    } finally {
      setApprovingId(null);
    }
  };

  /**
   * 4. Approve/Reject handler for student profile edit requests.
   */
  const handleBioRequestAction = async (studentId, studentName, action) => {
    setBioActionId(studentId);
    try {
      await api.patch(`/api/admin/bio-change/${studentId}/${action}`);

      setBioRequests((prev) => prev.filter((r) => r.student_id !== studentId));

      setToastMessage(
        action === 'approve'
          ? `Profile update for ${studentName} approved and applied.`
          : `Profile update request for ${studentName} rejected.`
      );
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err) {
      console.error(`Bio change ${action} failed for student #${studentId}:`, err);
      alert(`Failed to ${action} the profile change request. Please try again.`);
    } finally {
      setBioActionId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-4 sm:p-6 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* TOP BAR */}
        <Navbar
          title="Principal Administrative Portal"
          subtitle={`Signed in as ${user?.full_name || ''} (Principal)`}
          user={user}
          onLogout={logout}
          rightExtra={
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white">
                <Bell size={18} />
              </div>
              {notificationCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-blue-600">
                  {notificationCount}
                </span>
              )}
            </div>
          }
        />

        {/* REAL-TIME SUCCESS TOAST FEEDBACK */}
        {toastMessage && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium flex items-center space-x-3 shadow-sm animate-fade-in">
            <CheckCircle2 size={20} className="text-emerald-600 flex-shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* STUDENT PROFILE CHANGE REQUESTS (NOTIFICATIONS) CARD */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                <UserCog className="text-blue-600" size={20} />
                <span>Student Profile Change Requests</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Students requesting edits to their name or email on file
              </p>
            </div>

            <span className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold rounded-full">
              {bioRequests.length} Pending
            </span>
          </div>

          {loadingBioRequests ? (
            <div className="py-10 text-center text-slate-500 flex flex-col items-center space-y-3">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm">Loading profile change requests...</p>
            </div>
          ) : bioRequests.length === 0 ? (
            <div className="py-10 text-center text-slate-500 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <CheckCircle2 size={30} className="mx-auto text-emerald-500 opacity-70" />
              <p className="text-xs text-slate-500">No pending student profile change requests.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {bioRequests.map((req) => (
                <div
                  key={req.student_id}
                  className="p-5 bg-white rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-5"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={req.current_full_name} size="sm" />
                      <h3 className="text-base font-bold text-slate-900">{req.current_full_name}</h3>
                    </div>
                    <p className="text-xs text-slate-500">
                      Grade: <span className="text-slate-700">{req.grade_level}</span>
                    </p>

                    <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 text-xs text-slate-700 leading-relaxed space-y-1">
                      <div>
                        <span className="text-slate-400">Name: </span>
                        <span className="line-through text-slate-400">{req.current_full_name}</span>
                        {' → '}
                        <span className="text-blue-700 font-semibold">
                          {req.requested_changes?.full_name || '(unchanged)'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400">Email: </span>
                        <span className="line-through text-slate-400">{req.current_email}</span>
                        {' → '}
                        <span className="text-blue-700 font-semibold">
                          {req.requested_changes?.email || '(unchanged)'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex md:flex-col items-center justify-end gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                    <button
                      onClick={() => handleBioRequestAction(req.student_id, req.current_full_name, 'approve')}
                      disabled={bioActionId === req.student_id}
                      className="w-full md:w-auto px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Check size={14} />
                      <span>Approve</span>
                    </button>
                    <button
                      onClick={() => handleBioRequestAction(req.student_id, req.current_full_name, 'reject')}
                      disabled={bioActionId === req.student_id}
                      className="w-full md:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-all flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <X size={14} />
                      <span>Reject</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* PRINCIPAL APPROVAL QUEUE CARD */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                <Clock className="text-amber-500" size={20} />
                <span>Pending Discipline Review Queue</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Review incident drafts submitted by teachers before publishing to parents
              </p>
            </div>

            <span className="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold rounded-full">
              {queue.length} Pending
            </span>
          </div>

          {/* QUEUE CONTENT */}
          {loading ? (
            <div className="py-12 text-center text-slate-500 flex flex-col items-center space-y-3">
              <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm">Loading pending queue items...</p>
            </div>
          ) : queue.length === 0 ? (
            <div className="py-16 text-center text-slate-500 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <CheckCircle2 size={36} className="mx-auto text-emerald-500 opacity-70" />
              <h3 className="text-base font-semibold text-slate-700">Approval Queue is Clear</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                All teacher-submitted discipline logs have been reviewed and published.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {queue.map((item) => (
                <div
                  key={item.id}
                  className="p-5 bg-white rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-5"
                >
                  {/* Left Column: Log Information */}
                  <div className="space-y-3 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold rounded-md">
                        {item.category}
                      </span>
                      <span className="text-xs text-slate-500 flex items-center space-x-1">
                        <Calendar size={13} className="text-slate-400" />
                        <span>Incident Date: {item.incident_date}</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <Avatar name={item.student_name} size="sm" />
                      <div>
                        <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                          <span>{item.student_name}</span>
                          <span className="text-xs text-blue-700 font-normal px-2 py-0.5 bg-blue-50 border border-blue-200 rounded">
                            {item.grade_level}
                          </span>
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Logged by <span className="text-slate-700 font-medium">{item.teacher_name}</span>
                        </p>
                      </div>
                    </div>

                    {/* Teacher Notes / Description */}
                    <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 text-xs text-slate-700 leading-relaxed">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1">
                        Teacher Notes:
                      </span>
                      "{item.description}"
                    </div>
                  </div>

                  {/* Right Column: Approve & Publish Action */}
                  <div className="flex md:flex-col items-center justify-end gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                    <button
                      onClick={() => handleApproveAndPublish(item.id, item.student_name)}
                      disabled={approvingId === item.id}
                      className="w-full md:w-auto px-5 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                    >
                      {approvingId === item.id ? (
                        <span>Publishing...</span>
                      ) : (
                        <>
                          <Send size={15} />
                          <span>Approve & Publish to Parent</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;
