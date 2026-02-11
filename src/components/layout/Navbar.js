import React from 'react';
import { Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLayout } from '../../context/LayoutContext';

const Navbar = () => {
  const { toggleSidebar } = useLayout();
  const { user } = useAuth();

  const getInitials = () => {
    const firstInitial = user?.first_name?.[0] || user?.name?.[0] || 'U';
    const lastInitial = user?.last_name?.[0] || 'S';
    return `${firstInitial}${lastInitial}`.toUpperCase();
  };

  const profileImage = user?.user_image;

  return (
    <div className='flex justify-between items-center py-3 px-4 z-20 mt-4 mr-4 ml-4 rounded-3xl bg-white/30 backdrop-blur-xl border border-white/40 shadow-xl'>
      <div className='flex items-center gap-3'>
        <button
          onClick={toggleSidebar}
          className='p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600 active:bg-gray-200'
        >
          <Menu className='w-6 h-6' />
        </button>

        <div className='flex flex-col'>
          <h1 className='text-lg font-bold text-slate-700 tracking-tight flex items-center gap-2'>
            Hi, {user?.name || user?.first_name || 'Admin'}{' '}
            <span className='animate-wave origin-[70%_70%]'>👋</span>
          </h1>
        </div>
      </div>

      <div className='flex items-center gap-2 sm:gap-4'>
        <div className='flex items-center gap-3'>
          <div className='text-right hidden sm:block'>
            <p className='text-sm font-bold text-slate-700 leading-none mb-1'>
              {user?.name || user?.first_name || 'Admin'}
            </p>
            <p className='text-xs text-blue-600 font-semibold capitalize bg-blue-50 px-2 py-0.5 rounded-full inline-block'>
              {user?.role || 'Admin'}
            </p>
          </div>

          <div className='relative'>
            <div className='w-10 h-10 rounded-full bg-gradient-to-br from-[#3a5f9e] to-[#6fa8dc] flex items-center justify-center text-white font-bold text-sm shadow-lg ring-2 ring-white'>
              {profileImage ? (
                <img
                  src={profileImage}
                  alt='User'
                  className='w-full h-full rounded-full object-cover'
                />
              ) : (
                <span>{getInitials()}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
