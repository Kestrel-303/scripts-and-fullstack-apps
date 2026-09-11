import { LogOut } from 'lucide-react';
import Avatar from './Avatar';

/**
 * Navbar:
 * Shared top bar used across every role dashboard. Shows the portal title,
 * the signed-in user's avatar, and a sign-out button. `rightExtra` lets a
 * dashboard slot in extra controls (e.g. the admin notification bell)
 * before the sign-out button.
 */
const Navbar = ({ title, subtitle, user, onLogout, rightExtra }) => {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-blue-600 rounded-2xl shadow-lg">
      <div className="flex items-center space-x-4">
        <Avatar src={user?.profile_picture_url} name={user?.full_name} size="md" className="ring-2 ring-white/30" />
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">{title}</h1>
          <p className="text-xs text-blue-100">{subtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {rightExtra}

        <button
          onClick={onLogout}
          className="flex items-center space-x-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 active:bg-white/30 text-white text-xs font-semibold rounded-xl border border-white/20 transition-all cursor-pointer"
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};

export default Navbar;
