import React from 'react';
import { Users, Loader2, Plus, Edit2, Trash2, Info } from 'lucide-react';
import Permission from '../../components/common/Permission';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../components/ui/tooltip';

const getDeleteReason = (role) =>
  `Used by ${role.assigned_user_count} ${Number(role.assigned_user_count) === 1 ? 'user' : 'users'}. Reassign users before deleting.`;

const RoleSelector = ({
  roles,
  selectedRole,
  onRoleSelect,
  onAddRole,
  onEditRole,
  onDeleteRole,
  loading,
  disabled,
}) => {
  return (
    <div className="bg-white rounded-[24px] border border-[#E2E8F0] shadow-sm overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Users className="w-5 h-5 text-[#64748B]" />
          <h2 className="text-[14px] font-bold text-[#64748B] uppercase tracking-[0.05em]">
            Roles
          </h2>
        </div>
        <Permission module="role-permissions" action="manage">
          <button
            type="button"
            disabled={disabled}
            onClick={onAddRole}
            className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"
            title="Add New Role"
          >
            <Plus size={18} />
          </button>
        </Permission>
      </div>

      {/* Role List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-[#3a5f9e] animate-spin" />
          </div>
        ) : roles.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-sm text-[#94A3B8]">No roles available</p>
          </div>
        ) : (
          <div className="flex flex-col">
            {roles.map((role) => (
              <div
                key={role.id}
                className={`w-full px-6 py-4 text-left transition-all duration-200 group relative border-l-[4px] ${
                  selectedRole?.id === role.id
                    ? 'bg-[#F1F7FF] border-[#3a5f9e]'
                    : 'bg-white border-transparent hover:bg-[#F8FAFC]'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => onRoleSelect(role)}
                    aria-pressed={selectedRole?.id === role.id}
                    className={`min-w-0 text-[15px] font-semibold transition-colors truncate ${
                      selectedRole?.id === role.id
                        ? 'text-[#3a5f9e]'
                        : 'text-[#64748B] group-hover:text-[#1E293B]'
                    }`}
                  >
                    {role.display_name}
                  </button>
                  {!role.is_system_role && (
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        disabled={disabled}
                        aria-label={`Edit ${role.display_name}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditRole(role);
                        }}
                        className="p-1 hover:text-blue-600 text-gray-400 transition-colors"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        type="button"
                        disabled={
                          disabled || Number(role.assigned_user_count) > 0
                        }
                        aria-label={`Delete ${role.display_name}`}
                        aria-describedby={
                          Number(role.assigned_user_count) > 0
                            ? `role-in-use-${role.id}`
                            : undefined
                        }
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteRole(role);
                        }}
                        className="p-1 hover:text-red-600 text-gray-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:text-gray-400"
                      >
                        <Trash2 size={14} />
                      </button>
                      {Number(role.assigned_user_count) > 0 && (
                        <TooltipProvider delayDuration={200}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                aria-label={`Why Delete is disabled for ${role.display_name}`}
                                onClick={(event) => event.stopPropagation()}
                                className="rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                              >
                                <Info size={14} aria-hidden="true" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent
                              side="bottom"
                              align="end"
                              sideOffset={8}
                              className="z-[60] max-w-[280px] text-xs leading-relaxed"
                            >
                              {getDeleteReason(role)}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  )}
                </div>
                {!role.is_system_role &&
                  Number(role.assigned_user_count) > 0 && (
                    <span id={`role-in-use-${role.id}`} className="sr-only">
                      {getDeleteReason(role)}
                    </span>
                  )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RoleSelector;
