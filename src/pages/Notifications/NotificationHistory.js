import React, { useCallback, useEffect, useState } from 'react';
import { Bell, Check, Clock, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/utils/apiConfig';
import { cn } from '../../lib/utils/utils';

const NotificationHistory = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const navigate = useNavigate();

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/notifications?limit=100');
      if (response.data.success) {
        setNotifications(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching notification history:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleString([], {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const markAsRead = async (notification) => {
    if (notification.is_read) return;

    try {
      const response = await api.put(`/notifications/${notification.id}/read`);
      if (response.data.success) {
        setNotifications((prev) =>
          prev.map((item) =>
            item.id === notification.id ? { ...item, is_read: true } : item,
          ),
        );
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleNotificationClick = async (notification) => {
    await markAsRead(notification);
    if (notification.url) {
      navigate(notification.url);
    }
  };

  const markAllRead = async () => {
    try {
      setMarkingAll(true);
      const response = await api.put('/notifications/mark-all-read');
      if (response.data.success) {
        setNotifications((prev) => prev.map((item) => ({ ...item, is_read: true })));
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    } finally {
      setMarkingAll(false);
    }
  };

  const hasUnread = notifications.some((notification) => !notification.is_read);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-blue-600">Notifications</p>
          <h1 className="text-2xl font-bold text-slate-900">Notification History</h1>
        </div>
        {hasUnread && (
          <button
            type="button"
            onClick={markAllRead}
            disabled={markingAll}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Check className="h-4 w-4" />
            {markingAll ? 'Updating...' : 'Mark all read'}
          </button>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-slate-400">
            <Clock className="mb-3 h-8 w-8 animate-spin opacity-30" />
            <p className="text-sm font-medium">Loading notification history...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center text-slate-400">
            <Bell className="mb-3 h-12 w-12 opacity-20" />
            <p className="text-sm font-semibold text-slate-500">No notifications yet</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {notifications.map((notification) => (
              <button
                key={notification.id}
                type="button"
                onClick={() => handleNotificationClick(notification)}
                className={cn(
                  'group flex w-full gap-4 px-4 py-4 text-left transition-colors hover:bg-slate-50 sm:px-5',
                  !notification.is_read && 'bg-blue-50/40',
                )}
              >
                <span
                  className={cn(
                    'mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full',
                    notification.is_read ? 'bg-slate-200' : 'bg-blue-500',
                  )}
                />
                <span className="min-w-0 flex-1">
                  <span className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                    <span
                      className={cn(
                        'text-sm font-bold',
                        notification.is_read ? 'text-slate-600' : 'text-slate-900',
                      )}
                    >
                      {notification.title}
                    </span>
                    <span className="shrink-0 text-xs font-medium text-slate-400">
                      {formatTime(notification.created_at)}
                    </span>
                  </span>
                  <span className="mt-1 block text-sm leading-relaxed text-slate-500">
                    {notification.message}
                  </span>
                  {notification.url && (
                    <span className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-blue-600">
                      View details <ExternalLink className="h-3 w-3" />
                    </span>
                  )}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationHistory;
