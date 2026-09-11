import { User } from 'lucide-react';

const SIZE_CLASSES = {
  xs: 'w-7 h-7 text-[10px]',
  sm: 'w-9 h-9 text-xs',
  md: 'w-11 h-11 text-sm',
  lg: 'w-14 h-14 text-lg',
  xl: 'w-20 h-20 text-2xl',
};

// Small fixed palette so initials avatars still feel varied without any backend data.
const PALETTE = [
  'bg-blue-600',
  'bg-indigo-600',
  'bg-sky-600',
  'bg-cyan-600',
  'bg-violet-600',
];

const getInitials = (name) => {
  if (!name) return '';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
};

const getPaletteColor = (name) => {
  if (!name) return PALETTE[0];
  const hash = name.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return PALETTE[hash % PALETTE.length];
};

/**
 * Avatar:
 * Renders a profile picture when `src` is provided, otherwise falls back to
 * a colored circle with the user's initials (or a generic icon if no name).
 */
const Avatar = ({ src, name, size = 'md', className = '' }) => {
  const sizeClass = SIZE_CLASSES[size] || SIZE_CLASSES.md;

  if (src) {
    return (
      <img
        src={src}
        alt={name || 'Profile picture'}
        className={`${sizeClass} rounded-full object-cover border border-slate-200 flex-shrink-0 ${className}`}
      />
    );
  }

  const initials = getInitials(name);

  return (
    <div
      className={`${sizeClass} ${getPaletteColor(name)} rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0 ${className}`}
      aria-label={name || 'User avatar'}
    >
      {initials ? initials : <User size={16} />}
    </div>
  );
};

export default Avatar;
