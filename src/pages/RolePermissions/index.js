import React, { useState, useEffect } from 'react';
import { Shield, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import RoleSelector from './RoleSelector';
import PermissionMatrix from './PermissionMatrix';
import { toast } from 'sonner';
import api from '../../lib/utils/apiConfig';

const RolePermissions = () => {
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  /* Fetch all roles on component mount */
  useEffect(() => {
    fetchRoles();
  }, []);

  /* Fetch permissions when role is selected */
  useEffect(() => {
    if (selectedRole) {
      fetchRolePermissions(selectedRole.id);
    }
  }, [selectedRole]);

  /* Fetch all roles from API */
  const fetchRoles = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get('/role-permissions/roles');
      const data = response.data;

      if (data.success) {
        // Filter out SuperAdmin from the list to prevent editing
        const filteredRoles = data.data.filter(
          (role) => role.name !== 'SuperAdmin',
        );
        setRoles(filteredRoles);
        // Auto-select first role
        if (filteredRoles.length > 0 && !selectedRole) {
          setSelectedRole(filteredRoles[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching roles:', err);
      setError('Failed to load roles. Please try again.');
      toast.error('Failed to load roles');
    } finally {
      setLoading(false);
    }
  };

  /* Fetch permissions for selected role */
  const fetchRolePermissions = async (roleId) => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get(
        `/role-permissions/roles/${roleId}/permissions`,
      );
      const data = response.data;

      if (data.success) {
        setPermissions(data.data);
      }
    } catch (err) {
      console.error('Error fetching permissions:', err);
      setError('Failed to load permissions. Please try again.');
      toast.error('Failed to load permissions');
    } finally {
      setLoading(false);
    }
  };

  /* Handle permission toggle - Local state update only */
  const handlePermissionToggle = (permissionId, currentValue) => {
    if (!selectedRole) return;

    // Update local state only - bulk save will persist to API
    setPermissions((prevPermissions) =>
      prevPermissions.map((module) => ({
        ...module,
        permissions: module.permissions.map((perm) =>
          perm.id === permissionId ? { ...perm, granted: !currentValue } : perm,
        ),
      })),
    );
  };

  /* Handle save all changes */
  const handleSaveChanges = async () => {
    if (!selectedRole) return;

    try {
      setSaving(true);

      // Prepare permissions array
      const permissionUpdates = [];
      permissions.forEach((module) => {
        module.permissions.forEach((perm) => {
          permissionUpdates.push({
            permissionId: perm.id,
            granted: perm.granted || false,
          });
        });
      });

      const response = await api.put(
        `/role-permissions/roles/${selectedRole.id}/permissions`,
        {
          permissions: permissionUpdates,
        },
      );

      const data = response.data;

      if (data.success) {
        toast.success('All permissions saved successfully!');
      }
    } catch (err) {
      console.error('Error saving permissions:', err);
      toast.error('Failed to save permissions');
    } finally {
      setSaving(false);
    }
  };

  /* Handle role selection */
  const handleRoleSelect = (role) => {
    setSelectedRole(role);
  };

  /* Handle refresh */
  const handleRefresh = () => {
    if (selectedRole) {
      fetchRolePermissions(selectedRole.id);
    } else {
      fetchRoles();
    }
  };

  return (
    <div className='min-h-screen bg-[#F8FAFC] p-6'>
      {/* Header */}
      <div className='mb-8'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            <div className='p-2 bg-white rounded-xl shadow-sm border border-gray-100'>
              <Shield className='w-6 h-6 text-[#1E3A8A]' />
            </div>
            <div>
              <h1 className='text-[28px] font-bold text-[#0F172A] flex items-center gap-2'>
                Role Permissions
              </h1>
              <p className='text-[15px] text-gray-500 font-medium'>
                Manage permissions for different user roles
              </p>
            </div>
          </div>
          <div className='flex items-center gap-4'>
            <button
              onClick={handleRefresh}
              disabled={loading}
              className='px-5 py-2.5 text-[14px] font-semibold text-[#475569] bg-white border border-[#E2E8F0] rounded-xl hover:bg-gray-50 transition-all shadow-sm active:scale-95 disabled:opacity-50 flex items-center gap-2'
            >
              <RefreshCw className='w-4 h-4' />
              Refresh
            </button>
            <button
              onClick={handleSaveChanges}
              disabled={!selectedRole || saving || loading}
              className='px-6 py-2.5 text-[14px] font-semibold text-white bg-[#3a5f9e] rounded-xl hover:bg-[#325186] transition-all shadow-[0_4px_12px_rgba(37,99,235,0.2)] active:scale-95 disabled:opacity-50 flex items-center gap-2'
            >
              {saving && <Loader2 className='w-4 h-4 animate-spin' />}
              Save Changes
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className='flex gap-6 items-start'>
        {/* Left Sidebar - Role Selector */}
        <div className='w-[280px] shrink-0'>
          <RoleSelector
            roles={roles}
            selectedRole={selectedRole}
            onRoleSelect={handleRoleSelect}
            loading={loading}
          />
        </div>

        {/* Right Content - Permission Matrix */}
        <div className='flex-1'>
          {error ? (
            <div className='bg-white rounded-[24px] border border-[#E2E8F0] p-12 shadow-sm'>
              <div className='text-center max-w-sm mx-auto'>
                <div className='w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6'>
                  <AlertCircle className='w-8 h-8 text-red-500' />
                </div>
                <h3 className='text-xl font-bold text-gray-900 mb-2'>
                  Error Loading Permissions
                </h3>
                <p className='text-gray-500 mb-8'>{error}</p>
                <button
                  onClick={handleRefresh}
                  className='w-full py-3 text-sm font-bold text-white bg-red-500 rounded-xl hover:bg-red-600 transition-colors shadow-lg shadow-red-200'
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : !selectedRole ? (
            <div className='bg-white rounded-[24px] border border-[#E2E8F0] p-24 shadow-sm h-full flex items-center justify-center'>
              <div className='text-center'>
                <div className='w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6'>
                  <Shield className='w-10 h-10 text-blue-400' />
                </div>
                <h3 className='text-xl font-bold text-gray-900 mb-2'>
                  {roles.length === 0
                    ? 'No Roles Available'
                    : 'No Role Selected'}
                </h3>
                <p className='text-gray-500 max-w-xs mx-auto text-sm'>
                  {roles.length === 0
                    ? 'All available roles are currently managed by the system.'
                    : 'Select a user role from the left list to configure their module-wise permissions.'}
                </p>
              </div>
            </div>
          ) : (
            <PermissionMatrix
              roleId={selectedRole.id}
              roleName={selectedRole.display_name}
              permissions={permissions}
              onPermissionToggle={handlePermissionToggle}
              loading={loading}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default RolePermissions;
