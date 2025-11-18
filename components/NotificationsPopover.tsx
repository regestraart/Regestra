import React from 'react';
import { Heart, MessageCircle, UserPlus } from 'lucide-react';

const notifications = [
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

const NotificationIcon = ({ type }) => {
  switch (type) {
    case 'like': return <Heart className="w-4 h-4 text-red-500" />;
    case 'comment': return <MessageCircle className="w-4 h-4 text-blue-500" />;
    case 'follow': return <UserPlus className="w-4 h-4 text-purple-600" />;
    default: return null;
  }
};

const NotificationsPopover = () => {
  return (
    <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden z-50">
      <div className="p-4 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900">Notifications</h3>
      </div>
      <div className="max-h-96 overflow-y-auto">
        {notifications.length > 0 ? (
          notifications.map(notification => (
            <div key={notification.id} className={`p-4 flex items-start gap-3 hover:bg-gray-50 ${notification.unread ? 'bg-purple-50' : ''}`}>
              <div className="relative">
                <img src={notification.user.avatar} alt={notification.user.name} className="w-10 h-10 rounded-full" />
                <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5">
                    <NotificationIcon type={notification.type} />
                </div>
              </div>
              <div className="flex-1 text-sm">
                <p className="text-gray-800">
                  <span className="font-semibold">{notification.user.name}</span>
                  {notification.type === 'like' && ` liked your artwork: "${notification.artworkTitle}"`}
                  {notification.type === 'comment' && ` commented: "${notification.comment}"`}
                  {notification.type === 'follow' && ` started following you.`}
                </p>
                <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
              </div>
              {notification.unread && <div className="w-2 h-2 bg-purple-600 rounded-full self-center flex-shrink-0"></div>}
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