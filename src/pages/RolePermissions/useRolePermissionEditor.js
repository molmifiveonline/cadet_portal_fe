import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import api from '../../lib/utils/apiConfig';
import { useAuth } from '../../context/AuthContext';
import { usePermissionContext } from '../../context/PermissionContext';

export default function useRolePermissionEditor() {
  const { user } = useAuth();
  const { refreshPermissions } = usePermissionContext();
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [rolesError, setRolesError] = useState(null);
  const [editor, setEditor] = useState({
    roleId: null,
    permissions: [],
    saved: [],
    loading: false,
    error: null,
  });
  const [saving, setSaving] = useState(false);
  const [reload, setReload] = useState(0);
  const selectedRoleId = selectedRole?.id;

  const fetchRoles = useCallback(async () => {
    setRolesLoading(true);
    setRolesError(null);
    try {
      const { data } = await api.get('/role-permissions/roles');
      if (!data.success) throw new Error(data.message);
      const available = data.data.filter(
        (role) =>
          !['superadmin', 'cadet', 'institute'].includes(
            role.name.toLowerCase(),
          ),
      );
      setRoles(available);
      setSelectedRole(
        (current) => available.find((role) => role.id === current?.id) || null,
      );
    } catch (error) {
      setRolesError('Failed to load roles. Please try again.');
    } finally {
      setRolesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);
  useEffect(() => {
    let active = true;
    setEditor({
      roleId: selectedRoleId,
      permissions: [],
      saved: [],
      loading: Boolean(selectedRoleId),
      error: null,
    });
    if (selectedRoleId) {
      api
        .get(`/role-permissions/roles/${selectedRoleId}/permissions`)
        .then(({ data }) => {
          if (!data.success) throw new Error(data.message);
          if (active)
            setEditor({
              roleId: selectedRoleId,
              permissions: data.data,
              saved: data.data,
              loading: false,
              error: null,
            });
        })
        .catch(() => {
          if (active)
            setEditor({
              roleId: selectedRoleId,
              permissions: [],
              saved: [],
              loading: false,
              error: 'Failed to load permissions. Please try again.',
            });
        });
    }
    return () => {
      active = false;
    };
  }, [selectedRoleId, reload]);

  const savedValues = new Map(
    editor.saved.flatMap((group) =>
      group.permissions.map((permission) => [
        permission.id,
        permission.granted,
      ]),
    ),
  );
  const updates = editor.permissions.flatMap((group) =>
    group.permissions
      .filter(
        (permission) => permission.granted !== savedValues.get(permission.id),
      )
      .map((permission) => ({
        permissionId: permission.id,
        granted: permission.granted,
      })),
  );
  const loading =
    rolesLoading || editor.loading || editor.roleId !== selectedRoleId;
  const error = rolesError || editor.error;

  const handlePermissionToggle = (permissionId) => {
    if (!selectedRoleId || loading || saving || error) return;
    setEditor((current) => ({
      ...current,
      permissions: current.permissions.map((group) => ({
        ...group,
        permissions: group.permissions.map((permission) =>
          permission.id === permissionId
            ? { ...permission, granted: !permission.granted }
            : permission,
        ),
      })),
    }));
  };

  const handleSaveChanges = async () => {
    if (!selectedRoleId || loading || saving || error || !updates.length)
      return;
    setSaving(true);
    try {
      const { data } = await api.put(
        `/role-permissions/roles/${selectedRoleId}/permissions`,
        { permissions: updates },
      );
      if (!data.success) throw new Error(data.message);
      setEditor((current) => ({ ...current, saved: current.permissions }));
      if (selectedRole.name.toLowerCase() === user?.role?.toLowerCase())
        await refreshPermissions();
      toast.success('Permissions saved successfully');
    } catch (error) {
      toast.error(
        error.response?.data?.message || 'Failed to save permissions',
      );
    } finally {
      setSaving(false);
    }
  };

  return {
    roles,
    selectedRole,
    rolesLoading,
    loading,
    saving,
    error,
    permissions: editor.permissions,
    pendingCount: updates.length,
    fetchRoles,
    handlePermissionToggle,
    handleSaveChanges,
    handleRoleSelect: (role) => {
      if (!saving && !updates.length) setSelectedRole(role);
    },
    discardChanges: () => {
      if (!saving)
        setEditor((current) => ({ ...current, permissions: current.saved }));
    },
    retry: () => (rolesError ? fetchRoles() : setReload((value) => value + 1)),
  };
}
