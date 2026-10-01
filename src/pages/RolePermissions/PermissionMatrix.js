import React from 'react';
import PageLoader from '../../components/common/PageLoader';
import PermissionCard, { getPermissionLabel } from './PermissionCard';

// Modules to hide from the Role Permissions UI
const HIDDEN_MODULES = ['screening', 'tests'];

const PermissionMatrix = ({
  roleName,
  permissions,
  onPermissionToggle,
  loading,
  disabled,
}) => {
  /**
   * Get module display name
   */
  const getModuleDisplayName = (module) => {
    const moduleNames = {
      dashboard: 'Dashboard',
      users: 'System Users',
      institutes: 'Institutes',
      cadets: 'Cadet Management',
      recruitment_drives: 'Recruitment Drives',
      allocations: 'Vessel Allocations',
      'allocation-masters': 'Assessment Masters',
      'vessel-master': 'Vessel Master',
      onboarding: 'Onboarding',
      medical: 'Medical & Documents',
      'medical-centers': 'Medical Centers & Report Templates',
      'activity-logs': 'Activity Logs',
      'role-permissions': 'Role Permissions',
      assessments: 'Assessments',
      candidates: 'Candidates',
      certificates: 'Certificates',
      courses: 'Course Management',
      feedback: 'Feedback',
      hotel: 'Hotel',
      location: 'Location',
      reports: 'Reports',
      system: 'System',
      'submit-excel': 'Submit Excel',
      'user-management': 'User Management',
    };
    return moduleNames[module] || module.toUpperCase();
  };

  if (loading) {
    return <PageLoader />;
  }

  // Sort by the labels shown to the user without mutating the editor's state.
  const compareLabels = (left, right) =>
    left.localeCompare(right, 'en', { sensitivity: 'base', numeric: true });
  const filteredPermissions = (permissions || [])
    .filter((module) => !HIDDEN_MODULES.includes(module.module))
    .sort((left, right) =>
      compareLabels(
        getModuleDisplayName(left.module),
        getModuleDisplayName(right.module),
      ),
    )
    .map((module) => ({
      ...module,
      permissions: [...module.permissions].sort((left, right) =>
        compareLabels(
          getPermissionLabel(left, getModuleDisplayName(module.module)),
          getPermissionLabel(right, getModuleDisplayName(module.module)),
        ),
      ),
    }));

  if (!filteredPermissions || filteredPermissions.length === 0) {
    return (
      <div className="bg-white rounded-[24px] border border-[#E2E8F0] p-24 shadow-sm flex items-center justify-center text-center">
        <p className="text-gray-500 font-medium">
          No permissions available for this role
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[24px] border border-[#E2E8F0] shadow-sm overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-8 py-6 border-b border-[#F1F5F9]">
        <h2 className="text-[14px] font-bold text-[#64748B] uppercase tracking-[0.05em]">
          Permissions for <span className="text-[#3a5f9e]">{roleName}</span>
        </h2>
      </div>

      {/* Permission Cards Sections */}
      <div className="p-8 space-y-10">
        {filteredPermissions.map((module) => (
          <div key={module.module} className="space-y-4">
            {/* Module Category Title */}
            <h3 className="text-[12px] font-bold text-[#94A3B8] uppercase tracking-[0.1em]">
              {getModuleDisplayName(module.module)}
            </h3>

            {/* Permissions Grid for this Module */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {module.permissions.map((permission) => (
                <PermissionCard
                  key={permission.id}
                  permission={permission}
                  moduleName={getModuleDisplayName(module.module)}
                  onPermissionToggle={onPermissionToggle}
                  disabled={disabled}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PermissionMatrix;
