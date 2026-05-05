import { useState, useEffect, useCallback } from 'react';
import api from '../lib/utils/apiConfig';
import { useAuth } from '../context/AuthContext';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const [notifResponse, pendingResponse] = await Promise.all([
        api.get('/notifications'),
        user.role === 'Institute' ? api.get('/recruitment-drives/pending-count') : Promise.resolve({ data: { success: true, count: 0 } })
      ]);

      if (notifResponse.data.success) {
        let notifs = notifResponse.data.data;
        let uCount = notifResponse.data.unreadCount;

        if (pendingResponse.data.success && pendingResponse.data.count > 0) {
          const pendingCount = pendingResponse.data.count;
          uCount += pendingCount;
          
          // Inject a virtual notification for pending drives
          notifs = [
            {
              id: 'pending-drives-virtual',
              title: 'Pending Recruitment Drives',
              message: `You have ${pendingCount} recruitment drive(s) awaiting your action.`,
              url: '/drives',
              is_read: false,
              created_at: new Date().toISOString(),
              type: 'info',
              is_virtual: true
            },
            ...notifs
          ];
        }

        setNotifications(notifs);
        setUnreadCount(uCount);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const markAsRead = async (id) => {
    try {
      const response = await api.put(`/notifications/${id}/read`);
      if (response.data.success) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllRead = async () => {
    try {
      const response = await api.put('/notifications/mark-all-read');
      if (response.data.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll every 1 minute
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllRead,
    refresh: fetchNotifications,
  };
};
