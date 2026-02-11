import React from 'react';
import { LayoutProvider, useLayout } from '../../context/LayoutContext';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { cn } from '../../lib/utils/utils';

const MainLayoutInner = ({ children }) => {
  const { isOpen } = useLayout();

  return (
    <div className='relative flex h-[100dvh] w-full overflow-hidden bg-slate-50/50'>
      {/* Mesh Gradient Background */}
      <div
        className='absolute inset-0 -z-10'
        style={{
          backgroundColor: '#f8fafc',
          backgroundImage: `
                radial-gradient(at 0% 0%, hsla(253, 16%, 7%, 0.1) 0, transparent 50%), 
                radial-gradient(at 50% 10%, hsla(225, 39%, 30%, 0.1) 0, transparent 50%), 
                radial-gradient(at 100% 0%, hsla(339, 49%, 30%, 0.1) 0, transparent 50%), 
                radial-gradient(at 0% 50%, hsla(210, 78%, 85%, 0.5) 0, transparent 50%), 
                radial-gradient(at 100% 100%, hsla(280, 85%, 90%, 0.5) 0, transparent 50%),
                radial-gradient(at 0% 100%, hsla(220, 85%, 90%, 0.5) 0, transparent 50%)
            `,
        }}
      />

      <Sidebar />

      <main
        className={cn(
          'flex-1 flex flex-col transition-all duration-300 min-w-0 h-full overflow-y-auto relative',
          isOpen ? 'md:pl-64' : 'md:pl-16',
          'pl-0',
        )}
      >
        <div className='sticky top-0 z-30'>
          <Navbar />
        </div>

        <div className='flex-1 p-4 md:p-8'>{children}</div>
      </main>
    </div>
  );
};

const MainLayout = ({ children }) => {
  return (
    <LayoutProvider>
      <MainLayoutInner>{children}</MainLayoutInner>
    </LayoutProvider>
  );
};

export default MainLayout;
