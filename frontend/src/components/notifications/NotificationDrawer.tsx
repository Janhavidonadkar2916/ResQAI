import { useState, useEffect } from 'react';
import { Bell, CheckCheck, ShieldAlert, AlertTriangle, Info, X } from 'lucide-react';
import { notificationApi, NotificationItem } from '../../api/notificationApi';

interface NotificationDrawerProps {
  onSelectEvent?: (eventId: string) => void;
}

export function NotificationDrawer({ onSelectEvent }: NotificationDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadNotifications = async () => {
    try {
      const list = await notificationApi.list(false);
      setNotifications(list);
      setUnreadCount(list.filter((n) => !n.is_read).length);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkRead = async (id: string, eventId?: string) => {
    try {
      await notificationApi.markRead(id);
      loadNotifications();
      if (eventId && onSelectEvent) {
        onSelectEvent(eventId);
        setIsOpen(false);
      }
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  const handleAcknowledgeAll = async () => {
    try {
      await notificationApi.acknowledgeAll();
      loadNotifications();
    } catch (err) {
      console.error('Failed to acknowledge all:', err);
    }
  };

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all"
        title="Notifications"
      >
        <Bell className="w-4 h-4 text-slate-300" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-[10px] font-extrabold text-white flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 md:w-96 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
            <div className="flex items-center space-x-2">
              <Bell className="w-4 h-4 text-teal-400" />
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">In-App Alert Queue</h4>
              {unreadCount > 0 && (
                <span className="text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 px-1.5 py-0.2 rounded-full">
                  {unreadCount} New
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleAcknowledgeAll}
                  className="text-[11px] text-teal-400 hover:text-teal-300 font-semibold flex items-center space-x-1"
                  title="Mark all as read"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Ack All</span>
                </button>
              )}
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">
                No active notifications
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleMarkRead(n.id, n.emergency_event_id)}
                  className={`p-3.5 text-xs transition-all cursor-pointer flex items-start space-x-3 ${
                    n.is_read
                      ? 'bg-slate-900 text-slate-400 hover:bg-slate-850'
                      : 'bg-slate-950/90 text-slate-200 border-l-2 border-l-teal-500 hover:bg-slate-900'
                  }`}
                >
                  {n.priority === 'CRITICAL' ? (
                    <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  ) : n.priority === 'HIGH' ? (
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  ) : (
                    <Info className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-[11px]">{n.title}</span>
                      <span className="text-[10px] text-slate-500">
                        {new Date(n.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-snug">{n.message}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
