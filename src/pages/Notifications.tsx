import { useMemo } from 'react';
import { Bell, Check, CheckCheck, MessageSquare, AlertTriangle, FolderKanban, CheckSquare, Info } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import EmptyState from '../components/ui/EmptyState';
import { formatRelativeTime } from '../utils/helpers';
import type { NotificationType } from '../types';

const notificationIcons: Record<NotificationType, { icon: typeof Bell; bg: string; color: string }> = {
  task_assigned: { icon: CheckSquare, bg: 'bg-blue-100', color: 'text-blue-600' },
  task_updated: { icon: Info, bg: 'bg-indigo-100', color: 'text-indigo-600' },
  deadline_reminder: { icon: AlertTriangle, bg: 'bg-amber-100', color: 'text-amber-600' },
  comment_added: { icon: MessageSquare, bg: 'bg-purple-100', color: 'text-purple-600' },
  project_updated: { icon: FolderKanban, bg: 'bg-teal-100', color: 'text-teal-600' },
  status_changed: { icon: CheckSquare, bg: 'bg-emerald-100', color: 'text-emerald-600' },
};

export default function Notifications() {
  const { currentUser } = useAuth();
  const { notifications, markNotificationRead, markAllNotificationsRead } = useData();

  const userNotifications = useMemo(() => {
    return notifications
      .filter(n => n.userId === currentUser?.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [notifications, currentUser]);

  const unreadCount = userNotifications.filter(n => !n.read).length;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-500 mt-1">{unreadCount} unread notifications</p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => currentUser && markAllNotificationsRead(currentUser.id)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <CheckCheck className="w-4 h-4" /> Mark All Read
          </button>
        )}
      </div>

      {userNotifications.length === 0 ? (
        <EmptyState icon={<Bell className="w-8 h-8" />} title="No notifications" description="You're all caught up! New notifications will appear here." />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm divide-y divide-gray-100">
          {userNotifications.map(notification => {
            const config = notificationIcons[notification.type];
            const Icon = config.icon;
            return (
              <div
                key={notification.id}
                className={`flex items-start gap-4 p-4 transition-colors cursor-pointer hover:bg-gray-50 ${!notification.read ? 'bg-indigo-50/30' : ''}`}
                onClick={() => !notification.read && markNotificationRead(notification.id)}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${config.bg}`}>
                  <Icon className={`w-5 h-5 ${config.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm ${!notification.read ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                      {notification.title}
                    </p>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs text-gray-400">{formatRelativeTime(notification.createdAt)}</span>
                      {!notification.read && <div className="w-2 h-2 rounded-full bg-indigo-500" />}
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">{notification.message}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
