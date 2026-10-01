import React from 'react';
import { Check, X } from 'lucide-react';

export const getPermissionLabel = (permission, moduleName = '') =>
  permission.display_name ||
  `${permission.action.charAt(0).toUpperCase() + permission.action.slice(1)} ${moduleName}`.trim();

const PermissionCard = ({
  permission,
  moduleName,
  onPermissionToggle,
  disabled,
}) => {
  return (
    <button
      type="button"
      aria-pressed={permission.granted}
      disabled={disabled}
      aria-label={getPermissionLabel(permission, moduleName)}
      onClick={() => onPermissionToggle(permission.id, permission.granted)}
      className={`flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 text-left group ${
        permission.granted
          ? 'bg-[#F0FDF4] border-[#DCFCE7] shadow-sm'
          : 'bg-white border-[#E2E8F0] hover:border-[#CBD5E1] hover:bg-[#F8FAFC]'
      }`}
    >
      {/* Status Icon */}
      <div
        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border transition-colors ${
          permission.granted
            ? 'bg-[#22C55E] border-[#22C55E]'
            : 'bg-white border-[#CBD5E1] group-hover:border-[#94A3B8]'
        }`}
      >
        {permission.granted ? (
          <Check className="w-5 h-5 text-white" strokeWidth={3} />
        ) : (
          <X className="w-5 h-5 text-[#94A3B8]" strokeWidth={2.5} />
        )}
      </div>

      {/* Info */}
      <div className="min-w-0">
        <h4
          className={`text-[15px] font-bold transition-colors ${
            permission.granted ? 'text-[#166534]' : 'text-[#334155]'
          }`}
        >
          {getPermissionLabel(permission, moduleName)}
        </h4>
      </div>
    </button>
  );
};

export default PermissionCard;
