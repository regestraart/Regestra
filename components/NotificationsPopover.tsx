
import React, { useState } from 'react';
import { Heart, MessageCircle, UserPlus, X, Trash2 } from 'lucide-react';
import { Button } from './ui/Button';

let initialNotifications = [
  {
    id: 1,
    type: 'like',
    user: { name: 'Emma Rodriguez', avatar: 'https://i.pravatar.cc/150?img=3' },
    artworkTitle: 'Abstract Waves',
    time: '2m ago',
    unread: true,
  },
  {
    id: 2,
    type: 'comment',
    user: { name: 'James Kim', avatar: 'https://i.pravatar.cc/150?img=4' },
    comment: 'Love the color palette! 🔥',
    time: '1h ago',
    unread: true,
  },
  {
    id: 3,
    type: 'follow',
    user: { name: 'Alex Johnson', avatar: 'https://i.pravatar.cc/300?img=11' },
    time: '3h ago',
    unread: false,
  },
  {
    id: 4,
    type: 'like',
    user: { name: 'Marcus Williams', avatar: 'https://i.pravatar.cc/150?img=2' },
    artworkTitle: 'Neon Nights',
    time: '1d ago',
    unread: false,
  },
];

const NotificationIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'like': return <Heart className="w-4 h-4 text-red-500" />;
    case 'comment': return <MessageCircle className="w-4 h-4 text-blue-500" />;
    case 'follow': return <UserPlus className="w-4 h-4 text-purple-600" />;
    default: return null;
  }
};

const NotificationsPopover = () => {
  const [notifications, setNotifications] = useState(initialNotifications);

  const handleDelete = (id: number) => {
    const updated = notifications.filter(n => n.id !== id);
    setNotifications(updated);
    initialNotifications = updated; // Persist within session
  };

  const handleClearAll = () => {
    setNotifications([]);
    initialNotifications = [];
  };

  return (
    <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden z-50 animate-in fade-in zoom-in duration-200">
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
                <img src={notification.user.avatar} alt={notification.user.name} className="w-10 h-10 rounded-full" />
                <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
                    <NotificationIcon type={notification.type} />
                </div>
              </div>
              <div className="flex-1 text-sm pr-6">
                <p className="text-gray-800">
                  <span className="font-semibold">{notification.user.name}</span>
                  {notification.type === 'like' && ` liked your artwork: "${notification.artworkTitle}"`}
                  {notification.type === 'comment' && ` commented: "${notification.comment}"`}
                  {notification.type === 'follow' && ` started following you.`}
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
