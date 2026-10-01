import React, { useState } from 'react';
import { Shield, AlertCircle, Key } from 'lucide-react';
import RoleSelector from './RoleSelector';
import PermissionMatrix from './PermissionMatrix';
import { toast } from 'sonner';
import api from '../../lib/utils/apiConfig';
import RoleModal from './RoleModal';
import DeleteConfirmationModal from '../../components/common/DeleteConfirmationModal';
import Permission from 'components/common/Permission';
import PageHeader from '../../components/common/PageHeader';
import useRolePermissionEditor from './useRolePermissionEditor';

const RolePermissions = () => {
  const {
    roles,
    selectedRole,
    permissions,
    rolesLoading,
    loading,
    saving,
    error,
    pendingCount,
    fetchRoles,
    handlePermissionToggle,
    handleSaveChanges,
    handleRoleSelect,
    discardChanges,
    retry,
  } = useRolePermissionEditor();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [deletingRole, setDeletingRole] = useState(null);

  /* Handle Role Save (Create/Update) */
  const handleRoleSave = async (roleData) => {
    try {
      if (editingRole) {
        const response = await api.put(
          `/role-permissions/roles/${editingRole.id}`,
          roleData,
        );
        if (response.data.success) {
          toast.success('Role updated successfully');
          fetchRoles();
        }
      } else {
        const response = await api.post('/role-permissions/roles', roleData);
        if (response.data.success) {
          toast.success('Role created successfully');
          fetchRoles();
        }
      }
    } catch (err) {
      console.error('Error saving role:', err);
      toast.error(err.response?.data?.message || 'Failed to save role');
      throw err;
    }
  };

  /* Handle Role Delete */
  const handleConfirmDelete = async () => {
    if (!deletingRole) return;
    try {
      const response = await api.delete(
        `/role-permissions/roles/${deletingRole.id}`,
      );
      if (response.data.success) {
        toast.success('Role deleted successfully');
        setDeletingRole(null);
        fetchRoles();
      }
    } catch (err) {
      console.error('Error deleting role:', err);
      toast.error(err.response?.data?.message || 'Failed to delete role');
      if (err.response?.status === 409) {
        setDeletingRole(null);
        fetchRoles();
      }
    }
  };

  const openAddModal = () => {
    setEditingRole(null);
    setIsModalOpen(true);
  };

  const openEditModal = (role) => {
    setEditingRole(role);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6">
      {/* Header */}
      <PageHeader
        title="Role Permissions"
        subtitle="Manage permissions for different user roles"
        icon={Key}
      >
        <Permission module="role-permissions" action="manage">
          <button
            onClick={handleSaveChanges}
            disabled={
              !selectedRole ||
              saving ||
              loading ||
              Boolean(error) ||
              !pendingCount
            }
            className="px-6 py-2.5 text-[14px] font-semibold text-white bg-[#3a5f9e] rounded-xl hover:bg-[#325186] transition-all shadow-[0_4px_12px_rgba(37,99,235,0.2)] active:scale-95 disabled:opacity-50 flex items-center gap-2"
          >
            {saving && (
              <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            )}
            Save Changes
          </button>
        </Permission>
      </PageHeader>
      {pendingCount > 0 && (
        <div
          className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4"
          role="status"
        >
          <p className="text-sm text-amber-900">
            {pendingCount} unsaved change(s). Save or discard before selecting
            another role.
          </p>
          <button
            type="button"
            disabled={saving}
            onClick={discardChanges}
            className="font-semibold text-[#3a5f9e] disabled:opacity-50"
          >
            Discard Changes
          </button>
        </div>
      )}

      {/* Main Content */}
      <div className="flex flex-col gap-6 items-start lg:flex-row">
        {/* Left Sidebar - Role Selector */}
        <div className="w-full lg:w-[280px] shrink-0">
          <RoleSelector
            roles={roles}
            selectedRole={selectedRole}
            onRoleSelect={handleRoleSelect}
            onAddRole={openAddModal}
            onEditRole={openEditModal}
            onDeleteRole={setDeletingRole}
            loading={rolesLoading}
            disabled={saving || pendingCount > 0}
          />
        </div>

        {/* Right Content - Permission Matrix */}
        <div className="w-full min-w-0 flex-1">
          {error ? (
            <div className="bg-white rounded-[24px] border border-[#E2E8F0] p-12 shadow-sm">
              <div className="text-center max-w-sm mx-auto">
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <AlertCircle className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Error Loading Permissions
                </h3>
                <p className="text-gray-500 mb-8">{error}</p>
                <button
                  type="button"
                  onClick={retry}
                  className="font-semibold text-[#3a5f9e]"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : !selectedRole ? (
            <div className="bg-white rounded-[24px] border border-[#E2E8F0] p-24 shadow-sm h-full flex items-center justify-center">
              <div className="text-center">
                <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Shield className="w-10 h-10 text-blue-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {roles.length === 0
                    ? 'No Roles Available'
                    : 'No Role Selected'}
                </h3>
                <p className="text-gray-500 max-w-xs mx-auto text-sm">
                  {roles.length === 0
                    ? 'All available roles are currently managed by the system.'
                    : 'Select a user role from the left list to configure their module-wise permissions.'}
                </p>
              </div>
            </div>
          ) : (
            <PermissionMatrix
              roleName={selectedRole.display_name}
              permissions={permissions}
              onPermissionToggle={handlePermissionToggle}
              loading={loading}
              disabled={saving}
            />
          )}
        </div>
      </div>

      {/* Modals */}
      <RoleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleRoleSave}
        role={editingRole}
      />

      <DeleteConfirmationModal
        isOpen={!!deletingRole}
        onClose={() => setDeletingRole(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Role"
        message={`Are you sure you want to delete the role "${deletingRole?.display_name}"? Roles assigned to users cannot be deleted.`}
      />
    </div>
  );
};

export default RolePermissions;
