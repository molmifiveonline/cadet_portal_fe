import React, { useEffect } from 'react';
import { LogOut, Mail, Shield, User, X } from 'lucide-react';
import { toast } from 'sonner';

const getFullName = (user) => {
  const name = user?.name;
  const joinedName = [user?.first_name, user?.last_name]
    .filter(Boolean)
    .join(' ')
    .trim();

  return name || joinedName || 'Admin';
};

const getInitials = (user) => {
  const fullName = getFullName(user);
  const nameParts = fullName.split(' ').filter(Boolean);

  if (nameParts.length >= 2) {
    return `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase();
  }

  return fullName.slice(0, 2).toUpperCase();
};

const InfoRow = ({ icon: Icon, label, value, iconClassName }) => (
  <div className='flex items-center gap-4'>
    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconClassName}`}>
      <Icon className='h-5 w-5' />
    </div>
    <div className='min-w-0'>
      <p className='text-xs font-bold uppercase tracking-wide text-slate-400'>
        {label}
      </p>
      <p className='truncate text-sm font-semibold text-slate-700 sm:text-base'>
        {value || '-'}
      </p>
    </div>
  </div>
);

const ProfileDetailModal = ({ isOpen, onClose, user, onLogout }) => {
  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const fullName = getFullName(user);
  const role = user?.role || 'Admin';
  const email = user?.email || '-';
  const profileImage = user?.user_image;

  const handleLogout = () => {
    onClose();
    const redirectPath = onLogout();
    toast.success('Logged out successfully');
    window.location.assign(redirectPath);
  };

  return (
    <div
      className='fixed inset-0 z-[100] flex items-start justify-end bg-slate-900/45 p-4 pt-20 backdrop-blur-sm animate-in fade-in duration-200 sm:pt-24 md:pr-8'
      onClick={onClose}
      role='dialog'
      aria-modal='true'
      aria-labelledby='profile-modal-title'
    >
      <div
        className='w-full max-w-[400px] overflow-hidden rounded-[20px] border border-white/80 bg-white shadow-2xl animate-in slide-in-from-top-2 zoom-in-95 duration-200'
        onClick={(event) => event.stopPropagation()}
      >
        <div className='relative bg-gradient-to-br from-[#3a5f9e] via-[#4f84c8] to-[#6fa8dc] px-5 py-5 sm:px-6'>
          <button
            type='button'
            onClick={onClose}
            className='absolute right-4 top-4 rounded-full p-1 text-white/80 transition-colors hover:bg-white/15 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/70'
            aria-label='Close profile details'
          >
            <X className='h-5 w-5' />
          </button>

          <div className='flex items-center gap-5 pr-8'>
            <div className='flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/25 text-2xl font-extrabold text-white shadow-lg ring-1 ring-white/15'>
              {profileImage ? (
                <img
                  src={profileImage}
                  alt={fullName}
                  className='h-full w-full object-cover'
                />
              ) : (
                <span>{getInitials(user)}</span>
              )}
            </div>

            <div className='min-w-0'>
              <h2
                id='profile-modal-title'
                className='truncate text-xl font-extrabold text-white'
              >
                {fullName}
              </h2>
              <span className='mt-2 inline-flex rounded-full bg-white/20 px-4 py-1 text-sm font-bold text-white shadow-sm'>
                {role}
              </span>
            </div>
          </div>
        </div>

        <div className='space-y-5 px-4 py-5 sm:px-5'>
          <div className='space-y-5 rounded-2xl border border-slate-100 bg-white px-5 py-5 shadow-[0_8px_28px_rgba(15,23,42,0.08)]'>
            <InfoRow
              icon={User}
              label='Full Name'
              value={fullName}
              iconClassName='bg-blue-50 text-blue-600'
            />
            <InfoRow
              icon={Mail}
              label='Email'
              value={email}
              iconClassName='bg-violet-50 text-violet-600'
            />
            <InfoRow
              icon={Shield}
              label='Role'
              value={role}
              iconClassName='bg-emerald-50 text-emerald-600'
            />
          </div>

          <button
            type='button'
            onClick={handleLogout}
            className='flex w-full items-center justify-center gap-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-extrabold text-red-600 transition-colors hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-200'
          >
            <LogOut className='h-5 w-5' />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileDetailModal;
