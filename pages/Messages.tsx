
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Send, ArrowLeft, Loader2, AlertTriangle, X, MessageCircle as MessageCircleIcon, Sparkles, MoreVertical, EyeOff, Trash2, User } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useUser } from '../context/UserContext';
import { db } from '../services/db';
import { Conversation, Message, DEFAULT_AVATAR_URL } from '../data/mock';
import { supabase } from '../lib/supabase';
import ConfirmationModal from '../components/ConfirmationModal';

export default function Messages() {
  const { currentUser } = useUser();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const startChatWith = searchParams.get('new');

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [chatLoading, setChatLoading] = useState(false);
  const [participantDetails, setParticipantDetails] = useState<Record<string, any>>({});
  const [dbError, setDbError] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'connections' | 'other'>('connections');
  const [conversationToDelete, setConversationToDelete] = useState<string | null>(null);
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; messageId: string; senderId: string } | null>(null);
  const [convMenu, setConvMenu] = useState<string | null>(null); // conv id with open menu
  const [startChatTargetId, setStartChatTargetId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const activeConvRef = useRef<string | null>(null);
  const messagesCountRef = useRef<number>(0);
  const currentUserRef = useRef(currentUser);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { currentUserRef.current = currentUser; }, [currentUser]);

  useEffect(() => {
    activeConvRef.current = activeConversationId;
    messagesCountRef.current = messages.length;
  }, [activeConversationId, messages.length]);

  // Close context menus on outside click
  useEffect(() => {
    const handler = () => { setContextMenu(null); setConvMenu(null); };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  const loadConversations = useCallback(async (isInitial = false) => {
    const cu = currentUserRef.current;
    if (!cu) return;
    if (isInitial) setLoading(true);
    try {
      const data = await db.chat.getConversations(cu.id);
      const details: Record<string, any> = {};
      data.forEach(c => {
        const profiles = (c as any)._participantProfiles;
        if (profiles) {
          profiles.forEach((p: any) => {
            if (p && !details[p.id]) {
              details[p.id] = {
                id: p.id,
                name: p.full_name || p.name,
                avatar: p.avatar || p.avatar_url || DEFAULT_AVATAR_URL,
                username: p.username || p.name?.toLowerCase().replace(/\s/g, '_')
              };
            }
          });
        }
      });
      setParticipantDetails(prev => ({ ...prev, ...details }));
      setConversations(data.sort((a, b) => b.lastMessageTimestamp - a.lastMessageTimestamp));
    } catch (error: any) {
      setDbError(error.message || 'An error occurred while loading messages.');
    } finally {
      if (isInitial) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!currentUserRef.current) return;
    const init = async () => {
      const cu = currentUserRef.current;
      if (!cu) return;
      if (startChatWith && startChatWith !== cu.id) {
        setLoading(true);
        setStartChatTargetId(startChatWith);
        try {
          const targetProfile = await db.users.getFullProfile(startChatWith);
          if (targetProfile) setParticipantDetails(prev => ({ ...prev, [startChatWith]: targetProfile }));
          const existingId = await db.chat.startConversation(cu.id, startChatWith);
          if (existingId) {
            setActiveConversationId(existingId);
            const isConnection = cu.followingIds?.some(id => id === startChatWith || id === `pending:${startChatWith}`);
            setActiveTab(isConnection ? 'connections' : 'other');
            navigate('/messages', { replace: true });
          }
        } catch (e: any) {
          setDbError(e.message || 'Failed to start conversation.');
        } finally {
          await loadConversations();
          setLoading(false);
        }
      } else {
        loadConversations(true);
      }
    };
    init();
  }, [startChatWith, navigate, loadConversations]);

  // Realtime subscription
  useEffect(() => {
    if (!currentUserRef.current) return;
    const channel = supabase
      .channel('public:messages_realtime_page')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, async (payload) => {
        const cu = currentUserRef.current;
        if (!cu) return;
        const newMsgRaw = payload.new as any;
        const convId = newMsgRaw.conversation_id;
        const currentActiveId = activeConvRef.current;

        setConversations(prev => {
          const convIndex = prev.findIndex(c => c.id === convId);
          if (convIndex > -1) {
            const updatedConv = {
              ...prev[convIndex],
              lastMessage: newMsgRaw.content,
              lastMessageTimestamp: new Date(newMsgRaw.created_at).getTime(),
              unreadCount: newMsgRaw.sender_id !== cu.id ? (prev[convIndex].unreadCount || 0) + 1 : prev[convIndex].unreadCount,
              isHidden: false,
            };
            const rest = prev.filter(c => c.id !== convId);
            return [updatedConv, ...rest].sort((a, b) => b.lastMessageTimestamp - a.lastMessageTimestamp);
          }
          loadConversations();
          return prev;
        });

        if (currentActiveId === convId) {
          const newMsgFormatted: Message = {
            id: newMsgRaw.id,
            senderId: newMsgRaw.sender_id,
            text: newMsgRaw.content,
            timestamp: new Date(newMsgRaw.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            timestampRaw: new Date(newMsgRaw.created_at).getTime(),
            isRead: newMsgRaw.is_read,
          };
          setMessages(prev => {
            // Already have this real ID (we replaced the temp ourselves) — skip
            if (prev.some(m => m.id === newMsgRaw.id)) return prev;
            // Remove any remaining temp message with same text from same sender
            const filtered = prev.filter(m => {
              const isTemp = m.id.startsWith('temp-');
              const isFromMe = m.senderId === cu.id;
              const textMatches = m.text === newMsgFormatted.text;
              return !(isTemp && isFromMe && textMatches);
            });
            return [...filtered, newMsgFormatted].sort((a, b) => a.timestampRaw - b.timestampRaw);
          });
          if (newMsgRaw.sender_id !== cu.id) db.chat.markAsRead(convId, cu.id);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [loadConversations]);

  // Mark as read when conversation opens
  useEffect(() => {
    if (activeConversationId && currentUser) {
      db.chat.markAsRead(activeConversationId, currentUser.id);
      setConversations(prev => prev.map(c => c.id === activeConversationId ? { ...c, unreadCount: 0 } : c));
    }
  }, [activeConversationId, currentUser]);

  // Load messages when conversation changes
  useEffect(() => {
    if (!activeConversationId) { setMessages([]); return; }
    setChatLoading(true);
    db.chat.getMessages(activeConversationId).then(msgs => {
      const extraProfiles: Record<string, any> = {};
      msgs.forEach((m: any) => {
        if (m._senderProfile && !participantDetails[m.senderId]) {
          extraProfiles[m.senderId] = {
            id: m._senderProfile.id,
            name: m._senderProfile.full_name,
            avatar: m._senderProfile.avatar_url || DEFAULT_AVATAR_URL,
            username: m._senderProfile.username,
          };
        }
      });
      if (Object.keys(extraProfiles).length > 0) setParticipantDetails(prev => ({ ...prev, ...extraProfiles }));
      setMessages(msgs.sort((a, b) => a.timestampRaw - b.timestampRaw));
      setChatLoading(false);
    }).catch(() => setChatLoading(false));
  }, [activeConversationId]); // removed participantDetails dep to avoid double-loads

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConversationId || !currentUser) return;
    const text = newMessage.trim();
    setNewMessage('');
    setSendError(null);
    const now = Date.now();
    const optimisticMsg: Message = {
      id: `temp-${now}`, senderId: currentUser.id, text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestampRaw: now, isRead: false,
    };
    setMessages(prev => [...prev, optimisticMsg].sort((a, b) => a.timestampRaw - b.timestampRaw));
    setConversations(prev => {
      const updated = prev.map(c => c.id === activeConversationId ? { ...c, lastMessage: text, lastMessageTimestamp: now, isHidden: false } : c);
      return updated.sort((a, b) => b.lastMessageTimestamp - a.lastMessageTimestamp);
    });
    try {
      const realId = await db.chat.sendMessage(activeConversationId, currentUser.id, text);
      if (realId) {
        // Replace the temp message with the real ID — clean, no spinner
        setMessages(prev => prev.map(m =>
          m.id === optimisticMsg.id
            ? { ...m, id: realId }
            : m
        ));
      }
      inputRef.current?.focus();
    } catch (error: any) {
      setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id));
      setNewMessage(text);
      setSendError(error.message || 'Message delivery failed. Please try again.');
    }
  };

  const handleHideConversation = async (convId: string) => {
    setConvMenu(null);
    // Optimistic
    setConversations(prev => prev.filter(c => c.id !== convId));
    if (activeConversationId === convId) setActiveConversationId(null);
    try {
      await db.chat.hideConversation(currentUser!.id, convId);
    } catch { loadConversations(); }
  };

  const handleDeleteConversation = (convId: string) => {
    setConvMenu(null);
    setConversationToDelete(convId);
  };

  const confirmDeleteConversation = async () => {
    if (!conversationToDelete || !currentUser) return;
    setConversations(prev => prev.filter(c => c.id !== conversationToDelete));
    if (activeConversationId === conversationToDelete) setActiveConversationId(null);
    setConversationToDelete(null);
    try {
      await db.chat.deleteConversation(currentUser.id, conversationToDelete);
    } catch { loadConversations(); }
  };

  const handleDeleteMessage = async () => {
    if (!messageToDelete || !currentUser) return;
    setMessages(prev => prev.filter(m => m.id !== messageToDelete));
    setMessageToDelete(null);
    try {
      await db.chat.deleteMessage(messageToDelete, currentUser.id);
    } catch { /* non-fatal */ }
  };

  const handleMessageContextMenu = (e: React.MouseEvent, msg: Message) => {
    if (msg.senderId !== currentUser?.id) return; // only own messages
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, messageId: msg.id, senderId: msg.senderId });
  };

  const handleMessageLongPress = (() => {
    let timer: ReturnType<typeof setTimeout>;
    return {
      onTouchStart: (e: React.TouchEvent, msg: Message) => {
        if (msg.senderId !== currentUser?.id) return;
        const touch = e.touches[0];
        timer = setTimeout(() => {
          setContextMenu({ x: touch.clientX, y: touch.clientY, messageId: msg.id, senderId: msg.senderId });
        }, 500);
      },
      onTouchEnd: () => clearTimeout(timer),
    };
  })();

  const getOtherUser = (conv: Conversation) => {
    const otherId = conv.participants.find(p => p !== currentUser?.id);
    if (!otherId) return { id: '', name: 'Artist', avatar: DEFAULT_AVATAR_URL, username: 'artist' };
    return participantDetails[otherId] || { id: otherId, name: 'Artist', avatar: DEFAULT_AVATAR_URL, username: 'artist' };
  };

  const filteredConversations = conversations.filter(conv => {
    if (conv.isHidden) return false;
    const otherUser = getOtherUser(conv);
    const isConnection = currentUser?.followingIds?.some(id => id === otherUser.id || id === `pending:${otherUser.id}`);
    return activeTab === 'connections' ? isConnection : !isConnection;
  });

  const activeConv = conversations.find(c => c.id === activeConversationId);
  const activeOtherUser = activeConv
    ? getOtherUser(activeConv)
    : startChatTargetId ? participantDetails[startChatTargetId] : null;

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-64px)] bg-white flex overflow-hidden border-x border-gray-200 shadow-xl">

      {/* Inbox Sidebar */}
      <div className={`${activeConversationId ? 'hidden md:flex' : 'flex'} w-full md:w-[380px] flex-col border-r border-gray-200`}>
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-black text-gray-900 mb-6 tracking-tighter">Inbox</h1>
          <div className="flex bg-gray-100 p-1 rounded-2xl">
            <button onClick={() => setActiveTab('connections')} className={`flex-1 text-sm font-bold py-2 rounded-xl transition-all ${activeTab === 'connections' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-500 hover:bg-gray-200'}`}>Connections</button>
            <button onClick={() => setActiveTab('other')} className={`flex-1 text-sm font-bold py-2 rounded-xl transition-all ${activeTab === 'other' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-500 hover:bg-gray-200'}`}>Requests</button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {loading && conversations.length === 0 ? (
            <div className="flex items-center justify-center h-full"><Loader2 className="animate-spin text-purple-600 w-6 h-6" /></div>
          ) : filteredConversations.length > 0 ? (
            filteredConversations.map(conv => {
              const other = getOtherUser(conv);
              return (
                <div
                  key={conv.id}
                  className={`relative flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-all group ${activeConversationId === conv.id ? 'bg-purple-50' : ''}`}
                  onClick={() => setActiveConversationId(conv.id)}
                >
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-200">
                    <img src={other.avatar} onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(other.name)}&background=6b46c1&color=fff`; }} className="w-full h-full object-cover" alt={other.username} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <h3 className="text-sm font-bold text-gray-900 truncate">{other.username}</h3>
                    </div>
                    <p className={`text-xs truncate mt-0.5 ${conv.unreadCount > 0 ? 'font-black text-purple-700' : 'text-gray-500'}`}>
                      {conv.lastMessage || 'Open to start chatting'}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {conv.unreadCount > 0 && (
                      <span className="w-5 h-5 bg-purple-600 text-white text-[10px] rounded-full flex items-center justify-center font-bold shadow-sm">
                        {conv.unreadCount}
                      </span>
                    )}
                    {/* Conversation kebab menu */}
                    <button
                      className="p-1 rounded-full opacity-0 group-hover:opacity-100 hover:bg-gray-200 transition-all"
                      onClick={e => { e.stopPropagation(); setConvMenu(convMenu === conv.id ? null : conv.id); }}
                    >
                      <MoreVertical className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>

                  {/* Conversation dropdown menu */}
                  {convMenu === conv.id && (
                    <div className="absolute right-4 top-12 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden min-w-[140px]" onClick={e => e.stopPropagation()}>
                      <button className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors" onClick={() => handleHideConversation(conv.id)}>
                        <EyeOff className="w-4 h-4 text-gray-400" /> Hide chat
                      </button>
                      <button className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors" onClick={() => handleDeleteConversation(conv.id)}>
                        <Trash2 className="w-4 h-4" /> Delete chat
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-10 opacity-40">
              <MessageCircleIcon className="w-12 h-12 text-gray-300 mb-4" />
              <h3 className="font-bold text-gray-900 text-lg">No messages yet</h3>
              <p className="text-sm text-gray-500 mt-1">Connect with artists to start chatting.</p>
            </div>
          )}
        </div>
      </div>

      {/* Chat Viewport */}
      <div className={`${!activeConversationId ? 'hidden md:flex' : 'flex'} flex-1 flex-col bg-white`}>
        {activeConversationId ? (
          <>
            {/* Chat Header */}
            <div className="px-4 py-3 bg-white border-b border-gray-100 flex items-center gap-3 shadow-sm z-10 sticky top-0">
              <button className="md:hidden p-2 rounded-full hover:bg-gray-100" onClick={() => setActiveConversationId(null)}>
                <ArrowLeft className="w-5 h-5 text-gray-500" />
              </button>
              {activeOtherUser && (
                <Link to={activeOtherUser.id ? `/profile/${activeOtherUser.username || activeOtherUser.id}` : '#'} className="flex items-center gap-3 group flex-1 min-w-0">
                  <img src={activeOtherUser.avatar || DEFAULT_AVATAR_URL} className="w-10 h-10 rounded-full object-cover border border-gray-200 flex-shrink-0" alt="" />
                  <div className="min-w-0">
                    <p className="font-bold text-gray-900 truncate group-hover:text-purple-600 transition-colors">{activeOtherUser.username}</p>
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Active</p>
                  </div>
                </Link>
              )}
            </div>

            {/* Message List */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1 bg-gray-50/40 scrollbar-hide">
              {chatLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
                </div>
              ) : messages.length > 0 ? (
                <>
                  {messages.map((msg, i) => {
                    const isMe = msg.senderId === currentUser?.id;
                    const isOptimistic = msg.id.startsWith('temp-');
                    const prevMsg = messages[i - 1];
                    const showAvatar = !isMe && (!prevMsg || prevMsg.senderId !== msg.senderId);
                    const otherUser = activeConv ? getOtherUser(activeConv) : null;
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isMe ? 'justify-end' : 'justify-start'} items-end gap-2`}
                        onContextMenu={e => handleMessageContextMenu(e, msg)}
                        onTouchStart={e => handleMessageLongPress.onTouchStart(e, msg)}
                        onTouchEnd={handleMessageLongPress.onTouchEnd}
                      >
                        {!isMe && (
                          <div className="w-6 h-6 flex-shrink-0 mb-1">
                            {showAvatar && otherUser && (
                              <img src={otherUser.avatar} className="w-6 h-6 rounded-full object-cover" alt="" />
                            )}
                          </div>
                        )}
                        <div className={`group relative max-w-[75%] md:max-w-[60%]`}>
                          <div className={`px-3.5 py-2 rounded-2xl text-sm leading-relaxed ${
                            isMe
                              ? 'bg-purple-600 text-white rounded-br-md'
                              : 'bg-white text-gray-900 border border-gray-100 rounded-bl-md shadow-sm'
                          } ${isOptimistic ? 'opacity-60' : ''}`}>
                            {msg.text}
                          </div>
                          {isMe && isOptimistic && (
                            <div className="flex justify-end mt-0.5">
                              <Loader2 className="w-2.5 h-2.5 animate-spin text-gray-400" />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} className="h-2" />
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center h-full text-center p-8 opacity-40">
                  <Send className="w-12 h-12 text-gray-300 rotate-12 mb-4" />
                  <p className="text-sm text-gray-500">Start the conversation</p>
                </div>
              )}
            </div>

            {/* Message Input */}
            <div className="px-4 py-3 bg-white border-t border-gray-100">
              {sendError && (
                <div className="mb-2 px-3 py-2 bg-red-50 text-red-700 text-xs rounded-xl flex items-center justify-between border border-red-100">
                  <div className="flex items-center gap-2"><AlertTriangle className="w-3.5 h-3.5" />{sendError}</div>
                  <button onClick={() => setSendError(null)}><X className="w-3.5 h-3.5" /></button>
                </div>
              )}
              <form onSubmit={handleSendMessage} className="flex gap-2 items-center">
                <Input
                  ref={inputRef}
                  value={newMessage}
                  onChange={e => { setNewMessage(e.target.value); setSendError(null); }}
                  placeholder="Message..."
                  className="flex-1 rounded-full h-10 bg-gray-100 border-0 focus:bg-white focus:ring-2 focus:ring-purple-400 transition-all px-4"
                />
                <Button
                  type="submit"
                  size="icon"
                  className="rounded-full w-10 h-10 flex-shrink-0 shadow-md hover:scale-105 active:scale-95 transition-transform"
                  disabled={!newMessage.trim()}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50/30">
            <div className="w-20 h-20 bg-purple-50 rounded-3xl flex items-center justify-center mb-4">
              <User className="w-10 h-10 text-purple-200" />
            </div>
            <h2 className="text-xl font-black text-gray-900 mb-2 tracking-tighter">Your Messages</h2>
            <p className="text-gray-500 max-w-xs text-center text-sm">Select a conversation or connect with an artist to start chatting.</p>
          </div>
        )}
      </div>

      {/* Context menu for messages (right-click / long press) */}
      {contextMenu && (
        <div
          className="fixed bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden min-w-[140px]"
          style={{ top: contextMenu.y, left: Math.min(contextMenu.x, window.innerWidth - 160) }}
          onClick={e => e.stopPropagation()}
        >
          <button
            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
            onClick={() => { setMessageToDelete(contextMenu.messageId); setContextMenu(null); }}
          >
            <Trash2 className="w-4 h-4" /> Delete message
          </button>
        </div>
      )}

      {/* Delete conversation confirmation */}
      {conversationToDelete && (
        <ConfirmationModal
          onClose={() => setConversationToDelete(null)}
          onConfirm={confirmDeleteConversation}
          title="Delete Conversation"
          description="This will permanently remove the conversation from your inbox. The other person's copy is unaffected."
          confirmText="Delete"
        />
      )}

      {/* Delete message confirmation */}
      {messageToDelete && (
        <ConfirmationModal
          onClose={() => setMessageToDelete(null)}
          onConfirm={handleDeleteMessage}
          title="Delete Message"
          description="This will remove this message for you. The other person can still see it."
          confirmText="Delete"
        />
      )}
    </div>
  );
}
