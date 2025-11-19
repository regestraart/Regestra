
import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, UserPlus, X, Trash2 } from 'lucide-react';
import { Button } from './ui/Button';
import { useUser } from '../context/UserContext';
import { 
  getNotificationsForUser, 
  deleteNotification, 
  clearAllNotifications, 
  markNotificationsAsRead,
  Notification
} from '../data/mock';

const NotificationIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'like': return <Heart className="w-4 h-4 text-red-500" />;
    case 'comment': return <MessageCircle className="w-4 h-4 text-blue-500" />;
    case 'follow': return <UserPlus className="w-4 h-4 text-purple-600" />;
    default: return null;
  }
};

const NotificationsPopover = ({ onClose }: { onClose: () => void }) => {
  const { currentUser } = useUser();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (currentUser) {
      // Load notifications
      const items = getNotificationsForUser(currentUser.id);
      setNotifications(items);
      
      // Mark as read when opening the popover
      markNotificationsAsRead(currentUser.id);
    }
  }, [currentUser]);

  const handleDelete = (id: string) => {
    deleteNotification(id);
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleClearAll = () => {
    if (currentUser) {
      clearAllNotifications(currentUser.id);
      setNotifications([]);
    }
  };

  if (!currentUser) return null;

  return (
    <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden z-50 animate-zoom-in">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Notifications</h3>
        {notifications.length > 0 && (
            <button 
                onClick={handleClearAll} 
                className="text-xs text-purple-600 hover:text-purple-700 font-medium hover:underline"
            >
                Clear All
            </button>
        )}
      </div>
      <div className="max-h-96 overflow-y-auto">
        {notifications.length > 0 ? (
          notifications.map(notification => (
            <div key={notification.id} className={`p-4 flex items-start gap-3 hover:bg-gray-50 group relative ${notification.unread ? 'bg-purple-50' : ''}`}>
              <div className="relative">
                <img src={notification.actorAvatar} alt={notification.actorName} className="w-10 h-10 rounded-full object-cover" />
                <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
                    <NotificationIcon type={notification.type} />
                </div>
              </div>
              <div className="flex-1 text-sm pr-6">
                <p className="text-gray-800">
                  <span className="font-semibold">{notification.actorName}</span>
                  {notification.type === 'like' && (
                    <span> liked {notification.contentPreview ? `"${notification.contentPreview.substring(0, 30)}${notification.contentPreview.length > 30 ? '...' : ''}"` : 'your post'}</span>
                  )}
                  {notification.type === 'comment' && (
                    <span> commented: "{notification.contentPreview}"</span>
                  )}
                  {notification.type === 'follow' && ` connected with you.`}
                </p>
                <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
              </div>
              {notification.unread && <div className="w-2 h-2 bg-purple-600 rounded-full self-center flex-shrink-0"></div>}
              
              <button 
                onClick={(e) => { e.stopPropagation(); handleDelete(notification.id); }}
                className="absolute top-2 right-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full hover:bg-gray-100"
                aria-label="Delete notification"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))
        ) : (
          <div className="p-8 text-center text-gray-500">
            <p className="font-medium">No new notifications</p>
            <p className="text-sm">You're all caught up!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPopover;
