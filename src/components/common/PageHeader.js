import React from 'react';

const PageHeader = ({ 
  title, 
  subtitle, 
  icon: Icon, 
  backButton,
  children, // This allows keeping existing action buttons as is
  className = "" 
}) => {
  return (
    <div className={`relative mb-8 ${className}`}>
      {/* Background Glass Effect */}
      <div className="absolute inset-0 bg-white/40 backdrop-blur-md rounded-2xl border border-white/20 shadow-sm -m-2 -z-10" />
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-2">
        <div className="flex items-center gap-4">
          {backButton && (
            <div className="mr-0">
              {backButton}
            </div>
          )}
          {Icon && (
            <div className="p-3 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-xl shadow-inner border border-white/40 group transition-all duration-300 hover:scale-105">
              <Icon className="w-6 h-6 text-blue-600 group-hover:text-blue-700 transition-colors" />
            </div>
          )}
          <div>
            <h1 className="text-2xl font-extrabold font-display tracking-tight bg-gradient-to-r from-[#1E40AF] via-[#2563EB] to-[#3B82F6] bg-clip-text text-transparent leading-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="text-[14px] text-slate-500 font-medium mt-0.5 opacity-90">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        
        {/* Actions Container - Keep original buttons here */}
        <div className="flex flex-wrap items-center gap-2 md:justify-end">
          {children}
        </div>
      </div>
      
      {/* Subtle Bottom Accent */}
      <div className="absolute bottom-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-indigo-500/10 to-transparent" />
    </div>
  );
};

export default PageHeader;
