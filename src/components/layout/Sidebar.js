import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogOut, ChevronDown, ChevronRight, Dot } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../../lib/utils/utils';
import { MenuItems } from '../../lib/utils/menu';
import { useAuth } from '../../context/AuthContext';
import { useLayout } from '../../context/LayoutContext';

const Sidebar = () => {
  const { isOpen, setIsOpen } = useLayout();
  const location = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [expandedMenus, setExpandedMenus] = useState({});

  const toggleMenu = (title) => {
    setExpandedMenus((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  // Filter menu items based on user role
  const visibleItems = MenuItems.filter((item) => {
    if (!item.allowedRoles) {
      return true;
    }
    if (!user?.role) return false;

    const userRole = user.role.toLowerCase();
    return item.allowedRoles.some((role) => role.toLowerCase() === userRole);
  });

  const handleLogout = () => {
    logout();
    navigate('/');
    toast.success('Logged out successfully');
    if (window.innerWidth < 768) {
      setIsOpen(false);
    }
  };

  const isLinkActive = (url) => {
    if (url === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    return location.pathname === url || location.pathname.startsWith(`${url}/`);
  };

  return (
    <>
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 h-screen transition-all duration-300 z-50 flex flex-col bg-white border-r border-slate-200 shadow-sm',
          isOpen ? 'w-64' : 'w-16',
        )}
      >
        {/* Logo Header */}
        <Link
          to='/dashboard'
          className='flex items-center justify-center py-6 hover:opacity-80 transition-opacity cursor-pointer border-b border-slate-100'
        >
          {isOpen ? (
            <img src='/mol-logo.png' alt='Logo' />
          ) : (
            <img src='/mol-logo.png' alt='Logo' />
          )}
        </Link>

        {/* Menu Items */}
        <nav className='flex-1 overflow-y-auto py-6 px-3 space-y-1'>
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const hasSubItems = item.subItems && item.subItems.length > 0;
            const isExpanded = expandedMenus[item.title];
            const isParentActive =
              hasSubItems && item.subItems.some((sub) => isLinkActive(sub.url));
            const isActive = !hasSubItems && isLinkActive(item.url);

            const handleNavClick = () => {
              if (window.innerWidth < 768 && !hasSubItems) {
                setIsOpen(false);
              }
            };

            return (
              <div key={item.title}>
                {hasSubItems ? (
                  <div
                    onClick={() => {
                      if (!isOpen) setIsOpen(true);
                      toggleMenu(item.title);
                    }}
                    className={cn(
                      'flex items-center py-3 rounded-lg transition-all duration-200 group relative cursor-pointer select-none',
                      isOpen ? 'px-4 gap-3 justify-between' : 'justify-center',
                      isActive || isParentActive
                        ? 'text-[#3a5f9e] bg-slate-50'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-[#3a5f9e]',
                    )}
                  >
                    <div
                      className={cn(
                        'flex items-center gap-3',
                        !isOpen && 'justify-center',
                      )}
                    >
                      <Icon
                        className='transition-all duration-200 shrink-0'
                        size={22}
                      />
                      {isOpen && (
                        <span className='text-sm font-medium transition-all duration-200 whitespace-nowrap'>
                          {item.title}
                        </span>
                      )}
                    </div>
                    {isOpen && (
                      <div className='text-slate-400'>
                        {isExpanded ? (
                          <ChevronDown size={16} />
                        ) : (
                          <ChevronRight size={16} />
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    to={item.url}
                    onClick={handleNavClick}
                    className={cn(
                      'flex items-center py-3 rounded-lg transition-all duration-200 group relative',
                      isOpen ? 'px-4 gap-3 justify-start' : 'justify-center',
                      isActive
                        ? 'bg-[#3a5f9e] text-white shadow-md shadow-blue-900/10'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-[#3a5f9e]',
                    )}
                  >
                    <Icon
                      className={cn(
                        'transition-all duration-200 shrink-0',
                        isActive
                          ? 'text-white'
                          : 'text-slate-500 group-hover:text-[#3a5f9e]',
                      )}
                      size={22}
                    />
                    {isOpen && (
                      <span
                        className={cn(
                          'text-sm transition-all duration-200 whitespace-nowrap',
                          isActive ? 'font-semibold' : 'font-medium',
                        )}
                      >
                        {item.title}
                      </span>
                    )}
                  </Link>
                )}
              </div>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className='p-4 border-t border-slate-100 mt-auto'>
          <button
            onClick={handleLogout}
            className={cn(
              'flex items-center py-2.5 rounded-lg transition-all duration-200 w-full group',
              isOpen ? 'px-4 gap-3 justify-start' : 'justify-center',
              'text-slate-500 hover:bg-red-50 hover:text-red-600',
            )}
          >
            <LogOut
              className='text-slate-500 group-hover:text-red-500 transition-colors shrink-0'
              size={20}
            />
            {isOpen && (
              <span className='font-medium text-sm transition-colors whitespace-nowrap'>
                Log Out
              </span>
            )}
          </button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className='fixed inset-0 bg-black/50 z-40 md:hidden'
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};

export default Sidebar;
