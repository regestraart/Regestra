import React, { useState, useEffect, useCallback } from 'react';
import { Heart, MessageCircle, UserPlus, X, Check, Mail } from 'lucide-react';
import { Button } from './ui/Button';
import { useUser } from '../context/UserContext';
import { db } from '../services/db';
import { Notification } from '../data/mock';
import { useNavigate } from 'react-router-dom';

const NotificationIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'like': return <Heart className="w-4 h-4 text-red-500" />;
    case 'comment': return <MessageCircle className="w-4 h-4 text-blue-500" />;
    case 'follow': return <UserPlus className="w-4 h-4 text-purple-600" />;
    case 'connect_request': return <UserPlus className="w-4 h-4 text-purple-600" />;
    case 'message': return <Mail className="w-4 h-4 text-green-500" />;
    default: return null;
  }
};

interface NotificationsPopoverProps {
  onClose: () => void;
  onNotificationsRead: () => void;
}

const NotificationsPopover = ({ onClose, onNotificationsRead }: NotificationsPopoverProps) => {
  const { currentUser, refreshCurrentUser } = useUser();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadNotifications = useCallback(async () => {
    if (!currentUser) return;
    try {
        setLoading(true);
        // Parallelise fetch + markAsRead — no need to wait for markAsRead before showing data
        const [items] = await Promise.all([
            db.notifications.get(currentUser.id),
            db.notifications.markAsRead(currentUser.id),
        ]);
        setNotifications(items);
        onNotificationsRead();
    } catch (e) {
        console.error("Failed to load notifications", e);
    } finally {
        setLoading(false);
    }
  }, [currentUser, onNotificationsRead]);
  
  useEffect(() => {
    if (currentUser) {
      loadNotifications();
    }
  }, [currentUser, loadNotifications]);

  const handleDelete = async (id: string) => {
    // Optimistic — remove immediately
    setNotifications(prev => prev.filter(n => n.id !== id));
    onNotificationsRead();
    try {
        await db.notifications.delete(id);
    } catch (e: any) {
        console.error("Failed to delete notification", e);
        loadNotifications();
    }
  };

  const handleClearAll = async () => {
    if (!currentUser) return;
    // Optimistic — clear immediately
    setNotifications([]);
    onNotificationsRead();
    try {
        await db.notifications.clearAll(currentUser.id);
    } catch (e: any) {
        console.error("Failed to clear notifications", e);
        loadNotifications();
    }
  };

  const handleAccept = async (notification: any) => {
      if (!currentUser) return;
      // Optimistic — remove from list immediately
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
      onNotificationsRead();
      try {
          await Promise.all([
              db.users.acceptRequest(notification.actorId, currentUser.id),
              db.notifications.delete(notification.id),
          ]);
          refreshCurrentUser();
      } catch (e: any) {
          console.error("Failed to accept request", e);
          alert(e.message || "Failed to accept connection request. Please check your database permissions.");
          loadNotifications();
      }
  };

  const handleDecline = async (notification: any) => {
      if (!currentUser) return;
      // Optimistic — remove from list immediately
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
      onNotificationsRead();
      try {
          await Promise.all([
              db.users.declineRequest(notification.actorId, currentUser.id),
              db.notifications.delete(notification.id),
          ]);
          refreshCurrentUser();
      } catch (e: any) {
          console.error("Failed to decline request", e);
          alert(e.message || "Failed to decline connection request.");
          loadNotifications();
      }
  };
  
  const handleNotificationClick = (notification: any) => {
      onClose();
      if (notification.type === 'message') {
          navigate(`/messages?new=${notification.actorId}`);
      } else if (notification.actorUsername) {
          navigate(`/profile/${notification.actorUsername}`);
      } 
      else {
          // Fallback for older notifications without username
          navigate(`/profile/${notification.actorId}`);
      }
  };

  if (!currentUser) return null;

  return (
    <div className="fixed top-16 left-4 right-4 md:absolute md:top-full md:left-auto md:right-0 mt-2 md:w-80 bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden z-50 animate-zoom-in">
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
        {loading ? (
            <div className="p-4 text-center text-gray-400 text-sm">Loading...</div>
        ) : notifications.length > 0 ? (
          notifications.map(notification => (
            <div 
                key={notification.id} 
                className={`p-4 flex items-start gap-3 hover:bg-gray-50 group relative border-b border-gray-50 last:border-0 cursor-pointer ${notification.unread ? 'bg-purple-50' : ''}`}
                onClick={() => handleNotificationClick(notification)}
            >
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
                    <span> liked {notification.contentPreview ? `"${notification.contentPreview.substring(0, 30)}..."` : 'your post'}</span>
                  )}
                  {notification.type === 'comment' && (
                    <span> commented: "{notification.contentPreview}"</span>
                  )}
                  {notification.type === 'follow' && ` connected with you.`}
                  {notification.type === 'connect_request' && (
                      <span> sent you a connection request.</span>
                  )}
                  {notification.type === 'message' && (
                      <span> sent you a message: "{notification.contentPreview}"</span>
                  )}
                </p>
                
                {notification.type === 'connect_request' && (
                    <div className="flex gap-2 mt-2" onClick={e => e.stopPropagation()}>
                        <Button size="sm" className="h-7 text-xs rounded-full bg-green-600 hover:bg-green-700 text-white" onClick={() => handleAccept(notification)}>
                            <Check className="w-3 h-3 mr-1" /> Accept
                        </Button>
                        <Button size="sm" variant="outline" className="h-7 text-xs rounded-full border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300" onClick={() => handleDecline(notification)}>
                            <X className="w-3 h-3 mr-1" /> Decline
                        </Button>
                    </div>
                )}

                <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
              </div>
              
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
