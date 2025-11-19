
import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { 
  Search, 
  Plus, 
  Eye, 
  EyeOff, 
  MoreVertical, 
  Trash2, 
  Users, 
  Mail, 
  Smile, 
  Image as ImageIcon, 
  Send, 
  ArrowLeft,
  MessageCircle,
  X
} from "lucide-react";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { useUser } from "../context/UserContext";
import { createUrl } from "../utils";
import { 
  Conversation, 
  Message, 
  User,
  getConversationsForUser, 
  getMessagesForConversation, 
  sendMessage, 
  startConversation, 
  getAllUsers, 
  findUserById, 
  toggleHideConversation, 
  deleteConversationForUser, 
  toggleHideMessage, 
  deleteMessage,
  markConversationAsRead
} from "../data/mock";

type InboxTab = 'connections' | 'general';

export default function Messages() {
  const { currentUser } = useUser();
  
  // --- State ---
  // Navigation & Lists
  const [activeTab, setActiveTab] = useState<InboxTab>('connections');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<User[]>([]); // For New Chat modal

  // Selection
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);

  // Inputs
  const [searchQuery, setSearchQuery] = useState("");
  const [messageText, setMessageText] = useState("");
  const [userSearch, setUserSearch] = useState("");

  // Toggles & Modals
  const [showHidden, setShowHidden] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null); // For dropdowns

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // --- Effects ---

  // Close menus on global click
  useEffect(() => {
    const handleClickOutside = () => setActiveMenuId(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Initial Load & Polling for Conversations
  useEffect(() => {
    if (!currentUser) return;
    loadConversations();
    const interval = setInterval(loadConversations, 3000);
    return () => clearInterval(interval);
  }, [currentUser, showHidden]);

  // Polling for Active Chat Messages
  useEffect(() => {
    if (!currentUser || !selectedChatId) return;

    const fetchMessages = () => {
      const msgs = getMessagesForConversation(selectedChatId, currentUser.id);
      // Simple check to avoid excessive re-renders if length matches
      // In a real app, deep compare or timestamp check is better
      setMessages(prev => {
         if (prev.length !== msgs.length) return msgs;
         return prev; 
      });
    };

    fetchMessages();
    // Mark as read when chat is open
    markConversationAsRead(selectedChatId, currentUser.id);
    
    const interval = setInterval(fetchMessages, 2000);
    return () => clearInterval(interval);
  }, [selectedChatId, currentUser]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, selectedChatId]);


  // --- Helpers ---

  const loadConversations = () => {
    if (currentUser) {
        setConversations(getConversationsForUser(currentUser.id));
    }
  };

  const getOtherParticipant = (conv: Conversation): User | undefined => {
      if (!currentUser) return undefined;
      const otherId = conv.participants.find(id => id !== currentUser.id);
      return findUserById(otherId);
  };

  // --- Handlers ---

  const handleSend = () => {
    if (!messageText.trim() || !selectedChatId || !currentUser) return;
    sendMessage(selectedChatId, currentUser.id, messageText);
    setMessageText("");
    setMessages(getMessagesForConversation(selectedChatId, currentUser.id));
    loadConversations(); // Update sidebar preview
  };

  const handleNewChatOpen = () => {
      setUsers(getAllUsers().filter(u => u.id !== currentUser?.id));
      setShowNewChatModal(true);
  };

  const handleStartChat = (targetUserId: string) => {
      if (!currentUser) return;
      const convId = startConversation(currentUser.id, targetUserId);
      setShowNewChatModal(false);
      loadConversations();
      setSelectedChatId(convId);
      
      // Auto-switch tab
      const isConnected = currentUser.followingIds.includes(targetUserId);
      setActiveTab(isConnected ? 'connections' : 'general');
  };

  // Conversation Management
  const handleToggleHideConv = (e: React.MouseEvent, convId: string) => {
      e.stopPropagation();
      if (!currentUser) return;
      toggleHideConversation(currentUser.id, convId);
      
      // If hiding the active chat, close it
      if (selectedChatId === convId && !showHidden) {
          setSelectedChatId(null);
      }
      loadConversations();
      setActiveMenuId(null);
  };

  const handleDeleteConv = (e: React.MouseEvent, convId: string) => {
      e.stopPropagation();
      if (!currentUser) return;
      if (confirm("Delete this conversation? This will clear your history.")) {
          deleteConversationForUser(currentUser.id, convId);
          if (selectedChatId === convId) setSelectedChatId(null);
          loadConversations();
      }
      setActiveMenuId(null);
  };

  // Message Management
  const handleToggleHideMsg = (msgId: string) => {
      if (!currentUser) return;
      toggleHideMessage(currentUser.id, msgId);
      if (selectedChatId) {
          setMessages(getMessagesForConversation(selectedChatId, currentUser.id));
      }
      setActiveMenuId(null);
  };

  const handleDeleteMsg = (msgId: string) => {
      if (!selectedChatId) return;
      if (confirm("Delete this message?")) {
          deleteMessage(selectedChatId, msgId);
          if (currentUser) {
             setMessages(getMessagesForConversation(selectedChatId, currentUser.id));
          }
      }
      setActiveMenuId(null);
  };

  // --- Derived State (Filtering & Sorting) ---

  const filteredConversations = conversations.reduce((acc, conv) => {
      // 1. Hide hidden conversations unless toggle is on
      if (conv.isHidden && !showHidden) return acc;

      const other = getOtherParticipant(conv);
      if (!other) return acc;

      // 2. Search Filter
      if (searchQuery && !other.name.toLowerCase().includes(searchQuery.toLowerCase())) return acc;

      // 3. Tab Categorization
      const isConnected = currentUser?.followingIds.includes(other.id);
      if (isConnected) {
          acc.connections.push(conv);
      } else {
          acc.general.push(conv);
      }
      return acc;
  }, { connections: [] as Conversation[], general: [] as Conversation[] });

  // 4. Sorting: Newest message first
  // Note: Conversations are already pre-sorted by date in getConversationsForUser, 
  // but we re-sort here to ensure correct order after filtering.
  const sortByDate = (a: Conversation, b: Conversation) => b.lastMessageTimestamp - a.lastMessageTimestamp;
  
  const displayList = (activeTab === 'connections' ? filteredConversations.connections : filteredConversations.general).sort(sortByDate);
  
  const unreadConnections = filteredConversations.connections.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
  const unreadGeneral = filteredConversations.general.reduce((sum, c) => sum + (c.unreadCount || 0), 0);

  // Current Active Chat Data
  const activeConv = conversations.find(c => c.id === selectedChatId);
  const activePartner = activeConv ? getOtherParticipant(activeConv) : null;

  if (!currentUser) return <div className="p-8 text-center">Please log in to view messages.</div>;

  return (
    <div className="h-[calc(100vh-4rem)] bg-gray-50 flex overflow-hidden">
      
      {/* --- SIDEBAR --- */}
      <div className={`w-full md:w-96 bg-white border-r border-gray-200 flex flex-col ${selectedChatId ? 'hidden md:flex' : 'flex'}`}>
        
        {/* Header */}
        <div className="p-4 border-b border-gray-200 space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
                <div className="flex gap-2">
                    <Button 
                        variant="ghost" size="icon" 
                        className={`rounded-full ${showHidden ? 'bg-purple-50 text-purple-600' : 'text-gray-400'}`}
                        onClick={() => setShowHidden(!showHidden)}
                        title={showHidden ? "Hide Archived" : "Show Archived"}
                    >
                        {showHidden ? <EyeOff className="w-5 h-5"/> : <Eye className="w-5 h-5"/>}
                    </Button>
                    <Button variant="ghost" size="icon" className="rounded-full text-purple-600" onClick={handleNewChatOpen}>
                        <Plus className="w-6 h-6" />
                    </Button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex bg-gray-100 p-1 rounded-xl">
                <button 
                    onClick={() => setActiveTab('connections')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'connections' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <Users className="w-4 h-4"/> Connections
                    {unreadConnections > 0 && <span className="bg-purple-600 text-white text-[10px] px-1.5 py-0.5 rounded-full">{unreadConnections}</span>}
                </button>
                <button 
                    onClick={() => setActiveTab('general')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'general' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <Mail className="w-4 h-4"/> General
                    {unreadGeneral > 0 && <span className="bg-gray-600 text-white text-[10px] px-1.5 py-0.5 rounded-full">{unreadGeneral}</span>}
                </button>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input 
                    placeholder="Search conversations..." 
                    className="pl-10 bg-gray-50 border-0 rounded-xl"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto">
            {displayList.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        {activeTab === 'connections' ? <Users className="w-8 h-8 text-gray-400"/> : <Mail className="w-8 h-8 text-gray-400"/>}
                    </div>
                    <p>No conversations found.</p>
                    <Button variant="link" className="text-purple-600 mt-2" onClick={handleNewChatOpen}>Start a chat</Button>
                </div>
            ) : (
                displayList.map(conv => {
                    const other = getOtherParticipant(conv);
                    if (!other) return null;
                    const menuId = `conv-menu-${conv.id}`;
                    const isMenuOpen = activeMenuId === menuId;
                    const isUnread = (conv.unreadCount || 0) > 0;

                    return (
                        <div key={conv.id} className={`relative group border-b border-gray-50 hover:bg-gray-50 transition-colors ${selectedChatId === conv.id ? 'bg-purple-50' : ''} ${conv.isHidden ? 'opacity-60 bg-gray-100' : ''}`}>
                            <button 
                                onClick={() => setSelectedChatId(conv.id)}
                                className="w-full p-4 flex items-center gap-3 text-left"
                            >
                                <div className="relative">
                                    <img src={other.avatar} alt={other.name} className="w-12 h-12 rounded-full object-cover" />
                                    {isUnread && <div className="absolute top-0 right-0 w-3 h-3 bg-purple-600 rounded-full border-2 border-white"></div>}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-center mb-1">
                                        <h3 className={`truncate ${isUnread ? 'font-bold text-gray-900' : 'font-semibold text-gray-700'}`}>
                                            {other.name}
                                        </h3>
                                        {conv.isHidden && <span className="text-[10px] bg-gray-300 px-1 rounded text-gray-700 mr-2">Hidden</span>}
                                    </div>
                                    <p className={`text-sm truncate ${isUnread ? 'font-semibold text-gray-900' : 'text-gray-500'}`}>
                                        {conv.lastMessage || "Start a conversation"}
                                    </p>
                                </div>
                            </button>

                            {/* Dropdown Menu */}
                            <div className="absolute top-4 right-2">
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveMenuId(isMenuOpen ? null : menuId);
                                    }}
                                    className={`p-1.5 rounded-full hover:bg-gray-200 text-gray-400 transition-opacity ${isMenuOpen ? 'opacity-100 bg-gray-200' : 'opacity-0 group-hover:opacity-100'}`}
                                >
                                    <MoreVertical className="w-4 h-4" />
                                </button>
                                {isMenuOpen && (
                                    <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-20 animate-in fade-in zoom-in-95 duration-100">
                                        <button onClick={(e) => handleToggleHideConv(e, conv.id)} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                                            {conv.isHidden ? <Eye className="w-4 h-4"/> : <EyeOff className="w-4 h-4"/>}
                                            {conv.isHidden ? "Unhide" : "Hide"}
                                        </button>
                                        <button onClick={(e) => handleDeleteConv(e, conv.id)} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
                                            <Trash2 className="w-4 h-4"/> Delete
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })
            )}
        </div>
      </div>

      {/* --- CHAT AREA --- */}
      <div className={`flex-1 flex flex-col bg-white ${!selectedChatId ? 'hidden md:flex' : 'flex'}`}>
          {selectedChatId && activePartner ? (
              <>
                {/* Chat Header */}
                <div className="h-16 px-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setSelectedChatId(null)} className="md:hidden p-2 -ml-2 text-gray-600">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <Link to={createUrl('/profile/:userId', { userId: activePartner.id })} className="flex items-center gap-3 hover:opacity-80">
                            <img src={activePartner.avatar} alt={activePartner.name} className="w-10 h-10 rounded-full object-cover" />
                            <div>
                                <h2 className="font-bold text-gray-900 leading-tight">{activePartner.name}</h2>
                                <p className="text-xs text-gray-500">@{activePartner.username}</p>
                            </div>
                        </Link>
                    </div>
                </div>

                {/* Messages List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                    {messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400">
                            <MessageCircle className="w-12 h-12 mb-2 opacity-50" />
                            <p>No messages yet. Say hello!</p>
                        </div>
                    ) : (
                        messages.map(msg => {
                            if (msg.isHidden && !showHidden) return null;
                            
                            const isMe = msg.senderId === currentUser.id;
                            const menuId = `msg-menu-${msg.id}`;
                            const isMenuOpen = activeMenuId === menuId;

                            return (
                                <div key={msg.id} className={`flex group ${isMe ? 'justify-end' : 'justify-start'}`}>
                                    <div className="max-w-[70%] relative">
                                        <div className={`px-4 py-2 rounded-2xl text-sm leading-relaxed relative ${isMe ? 'bg-gradient-to-r from-purple-600 to-blue-500 text-white rounded-br-none' : 'bg-white border border-gray-200 text-gray-900 rounded-bl-none shadow-sm'} ${msg.isHidden ? 'opacity-50 grayscale' : ''}`}>
                                            {msg.text}
                                            <span className={`text-[10px] block mt-1 opacity-70 ${isMe ? 'text-blue-100 text-right' : 'text-gray-400 text-left'}`}>
                                                {msg.timestamp} {msg.isHidden && '(Hidden)'}
                                            </span>
                                        </div>
                                        
                                        {/* Message Actions Ellipsis */}
                                        <div className={`absolute top-0 ${isMe ? '-left-8' : '-right-8'} opacity-0 group-hover:opacity-100 transition-opacity`}>
                                             <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setActiveMenuId(isMenuOpen ? null : menuId);
                                                }}
                                                className="p-1 text-gray-400 hover:text-gray-600"
                                             >
                                                 <MoreVertical className="w-4 h-4" />
                                             </button>
                                             {isMenuOpen && (
                                                 <div className={`absolute top-full ${isMe ? 'right-0' : 'left-0'} mt-1 w-32 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-30`}>
                                                    <button onClick={() => handleToggleHideMsg(msg.id)} className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 flex gap-2">
                                                        {msg.isHidden ? "Unhide" : "Hide"}
                                                    </button>
                                                    <button onClick={() => handleDeleteMsg(msg.id)} className="w-full text-left px-3 py-2 text-xs text-red-600 hover:bg-red-50 flex gap-2">
                                                        Delete
                                                    </button>
                                                 </div>
                                             )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 border-t border-gray-200 bg-white">
                    <div className="flex items-end gap-2">
                        <Button variant="ghost" size="icon" className="rounded-full text-gray-400 hover:text-gray-600 flex-shrink-0">
                            <ImageIcon className="w-5 h-5" />
                        </Button>
                        <div className="flex-1 relative">
                            <Input 
                                value={messageText}
                                onChange={(e) => setMessageText(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="Type a message..."
                                className="rounded-full pr-10"
                            />
                            <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full text-gray-400 hover:text-gray-600 h-8 w-8">
                                <Smile className="w-4 h-4" />
                            </Button>
                        </div>
                        <Button 
                            onClick={handleSend} 
                            disabled={!messageText.trim()}
                            className="rounded-full w-10 h-10 p-0 flex items-center justify-center bg-purple-600 hover:bg-purple-700 text-white flex-shrink-0"
                        >
                            <Send className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
              </>
          ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50">
                  <MessageCircle className="w-16 h-16 mb-4 text-gray-300" />
                  <h2 className="text-xl font-semibold text-gray-600">Your Messages</h2>
                  <p className="text-sm max-w-xs text-center mt-2">Select a conversation from the sidebar or start a new chat to connect with others.</p>
                  <Button className="mt-6" onClick={handleNewChatOpen}>
                      Start New Chat
                  </Button>
              </div>
          )}
      </div>

      {/* --- NEW CHAT MODAL --- */}
      {showNewChatModal && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 animate-fade-in">
              <div className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col shadow-2xl animate-slide-up">
                  <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                      <h2 className="font-bold text-lg">New Message</h2>
                      <button onClick={() => setShowNewChatModal(false)} className="p-1 hover:bg-gray-100 rounded-full">
                          <X className="w-5 h-5 text-gray-500" />
                      </button>
                  </div>
                  <div className="p-4 border-b border-gray-200">
                      <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <Input 
                              placeholder="Search people..." 
                              className="pl-9 rounded-xl"
                              value={userSearch}
                              onChange={(e) => setUserSearch(e.target.value)}
                          />
                      </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-2">
                      {users
                        .filter(u => u.name.toLowerCase().includes(userSearch.toLowerCase()))
                        .map(u => (
                          <button 
                              key={u.id} 
                              onClick={() => handleStartChat(u.id)}
                              className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl transition-colors text-left"
                          >
                              <img src={u.avatar} alt={u.name} className="w-10 h-10 rounded-full object-cover" />
                              <div>
                                  <h3 className="font-semibold text-gray-900">{u.name}</h3>
                                  <p className="text-sm text-gray-500">@{u.username}</p>
                              </div>
                              {currentUser?.followingIds.includes(u.id) && (
                                  <span className="ml-auto text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">Connected</span>
                              )}
                          </button>
                      ))}
                      {users.length === 0 && <p className="text-center py-8 text-gray-500">No users found.</p>}
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}
