import React from 'react';
import { Users, Loader2 } from 'lucide-react';

/* ================================================
 * ROLE SELECTOR COMPONENT
 * Displays list of roles for selection
 * ================================================
 */

const RoleSelector = ({ roles, selectedRole, onRoleSelect, loading }) => {
  return (
    <div className='bg-white rounded-[24px] border border-[#E2E8F0] shadow-sm overflow-hidden flex flex-col h-full'>
      {/* Header */}
      <div className='px-6 py-5 flex items-center gap-3'>
        <Users className='w-5 h-5 text-[#64748B]' />
        <h2 className='text-[14px] font-bold text-[#64748B] uppercase tracking-[0.05em]'>
          Roles
        </h2>
      </div>

      {/* Role List */}
      <div className='flex-1 overflow-y-auto'>
        {loading ? (
          <div className='flex items-center justify-center py-12'>
            <Loader2 className='w-6 h-6 text-[#2563EB] animate-spin' />
          </div>
        ) : roles.length === 0 ? (
          <div className='px-4 py-8 text-center'>
            <p className='text-sm text-[#94A3B8]'>No roles available</p>
          </div>
        ) : (
          <div className='flex flex-col'>
            {roles.map((role) => (
              <button
                key={role.id}
                onClick={() => onRoleSelect(role)}
                className={`w-full px-6 py-4 text-left transition-all duration-200 group relative border-l-[4px] ${
                  selectedRole?.id === role.id
                    ? 'bg-[#F1F7FF] border-[#2563EB]'
                    : 'bg-white border-transparent hover:bg-[#F8FAFC]'
                }`}
              >
                <div
                  className={`text-[15px] font-semibold transition-colors ${
                    selectedRole?.id === role.id
                      ? 'text-[#2563EB]'
                      : 'text-[#64748B] group-hover:text-[#1E293B]'
                  }`}
                >
                  {role.display_name}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RoleSelector;
