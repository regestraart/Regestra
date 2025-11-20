import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Search, Plus, Eye, EyeOff, MoreVertical, Trash2, Users, Mail, Smile, Image as ImageIcon, Send, ArrowLeft, MessageCircle, X } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { useUser } from "../context/UserContext";
import { createUrl } from "../utils";
import { 
  Conversation, Message, User,
  getConversationsForUser, getMessagesForConversation, sendMessage, startConversation, getAllUsers, findUserById,
  toggleHideConversation, deleteConversationForUser, toggleHideMessage, deleteMessage, markConversationAsRead
} from "../data/mock";

type InboxTab = 'connections' | 'general';

export default function Messages() {
  const { currentUser } = useUser();
  const [activeTab, setActiveTab] = useState<InboxTab>('connections');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [activePartners, setActivePartners] = useState<Record<string, User>>({});
  const [showHidden, setShowHidden] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = () => setActiveMenuId(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Scroll to bottom when messages update
  useEffect(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const loadData = async () => {
        if (currentUser) {
            const convs = await getConversationsForUser(currentUser.id);
            // Sort by timestamp descending
            const sortedConvs = convs.sort((a, b) => b.lastMessageTimestamp - a.lastMessageTimestamp);
            setConversations(sortedConvs);
            
            // Resolve partners asynchronously
            const partners: Record<string, User> = {};
            for (const c of convs) {
                const pid = c.participants.find(id => id !== currentUser.id);
                if (pid) {
                    const u = await findUserById(pid);
                    if (u) partners[c.id] = u;
                }
            }
            setActivePartners(partners);
        }
    };
    loadData();
    const interval = setInterval(loadData, 3000);
    return () => clearInterval(interval);
  }, [currentUser, showHidden]);

  useEffect(() => {
      const loadMsgs = async () => {
          if (selectedChatId && currentUser) {
              const msgs = await getMessagesForConversation(selectedChatId, currentUser.id);
              setMessages(msgs);
              markConversationAsRead(selectedChatId, currentUser.id);
          }
      };
      loadMsgs();
  }, [selectedChatId, currentUser, conversations]); 

  const handleSend = async () => {
      if (selectedChatId && currentUser && messageText.trim()) {
          await sendMessage(selectedChatId, currentUser.id, messageText);
          setMessageText("");
          const msgs = await getMessagesForConversation(selectedChatId, currentUser.id);
          setMessages(msgs);
      }
  };

  const handleNewChat = async () => {
      const all = await getAllUsers();
      setUsers(all.filter(u => u.id !== currentUser?.id));
      setShowNewChatModal(true);
  };

  const filteredConversations = conversations.filter(c => {
      if (!showHidden && c.isHidden) return false;
      
      // Filter by tab
      const partner = activePartners[c.id];
      if (!partner) return false;
      const isConnected = currentUser?.followingIds?.includes(partner.id);
      
      return activeTab === 'connections' ? isConnected : !isConnected;
  });

  const handleToggleHide = (convId: string) => {
      if (currentUser) {
          toggleHideConversation(currentUser.id, convId);
          if (selectedChatId === convId && !showHidden) setSelectedChatId(null);
      }
      setActiveMenuId(null);
  };

  const handleDeleteConversation = (convId: string) => {
      if (currentUser && confirm("Delete this conversation?")) {
          deleteConversationForUser(currentUser.id, convId);
          if (selectedChatId === convId) setSelectedChatId(null);
      }
      setActiveMenuId(null);
  };

  return (
      <div className="h-[calc(100vh-4rem)] bg-gray-50 flex overflow-hidden">
          {/* Sidebar */}
          <div className={`w-full md:w-96 bg-white border-r border-gray-200 flex flex-col ${selectedChatId ? 'hidden md:flex' : 'flex'}`}>
              <div className="p-4 border-b border-gray-200 bg-white z-10">
                  <div className="flex justify-between items-center mb-4">
                    <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
                    <div className="flex gap-1">
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className={`rounded-full ${showHidden ? 'text-purple-600 bg-purple-50' : 'text-gray-400'}`}
                            onClick={() => setShowHidden(prev => !prev)}
                            title={showHidden ? "Hide hidden chats" : "Show hidden chats"}
                        >
                            {showHidden ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </Button>
                        <Button size="icon" variant="ghost" onClick={handleNewChat} className="rounded-full text-purple-600 bg-purple-50 hover:bg-purple-100"><Plus className="w-5 h-5"/></Button>
                    </div>
                  </div>
                  <div className="flex bg-gray-100 p-1 rounded-xl">
                      <button 
                        onClick={() => setActiveTab('connections')}
                        className={`flex-1 py-2 px-4 text-sm font-medium rounded-lg transition-all ${activeTab === 'connections' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                      >
                          Connections
                      </button>
                      <button 
                        onClick={() => setActiveTab('general')}
                        className={`flex-1 py-2 px-4 text-sm font-medium rounded-lg transition-all ${activeTab === 'general' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                      >
                          General
                      </button>
                  </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                  {filteredConversations.length > 0 ? filteredConversations.map(c => {
                      const partner = activePartners[c.id];
                      if (!partner) return null;
                      const isUnread = c.unreadCount > 0;
                      
                      return (
                          <div key={c.id} className={`p-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer group relative ${selectedChatId === c.id ? 'bg-purple-50/50' : ''}`} onClick={() => setSelectedChatId(c.id)}>
                              <div className="flex items-center gap-3 pr-8">
                                  <div className="relative">
                                    <img src={partner.avatar} className="w-12 h-12 rounded-full object-cover border border-gray-200"/>
                                    {isUnread && <div className="absolute -top-1 -right-1 w-3 h-3 bg-purple-600 rounded-full border-2 border-white"></div>}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                      <div className="flex justify-between items-baseline">
                                        <h3 className={`font-semibold truncate ${isUnread ? 'text-gray-900' : 'text-gray-700'}`}>{partner.name}</h3>
                                        <span className="text-xs text-gray-400 flex-shrink-0 ml-2">{new Date(c.lastMessageTimestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                      </div>
                                      <p className={`text-sm truncate ${isUnread ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                                          {c.lastMessage || <span className="italic text-gray-400">Draft...</span>}
                                      </p>
                                      {c.isHidden && <span className="inline-block px-2 py-0.5 rounded text-[10px] bg-gray-200 text-gray-600 mt-1">Hidden</span>}
                                  </div>
                              </div>
                              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                <button 
                                    onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === c.id ? null : c.id); }}
                                    className="p-2 text-gray-400 hover:bg-gray-200 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <MoreVertical className="w-4 h-4" />
                                </button>
                                {activeMenuId === c.id && (
                                    <div className="absolute right-0 top-8 w-40 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-20 animate-zoom-in">
                                        <button onClick={(e) => { e.stopPropagation(); handleToggleHide(c.id); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                                            {c.isHidden ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                            {c.isHidden ? "Unhide Chat" : "Hide Chat"}
                                        </button>
                                        <button onClick={(e) => { e.stopPropagation(); handleDeleteConversation(c.id); }} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
                                            <Trash2 className="w-4 h-4" /> Delete Chat
                                        </button>
                                    </div>
                                )}
                              </div>
                          </div>
                      );
                  }) : (
                      <div className="flex flex-col items-center justify-center h-full text-gray-400 p-6 text-center">
                          <MessageCircle className="w-12 h-12 mb-4 opacity-20" />
                          <p>No messages yet.</p>
                          <p className="text-sm">Start a chat to connect!</p>
                      </div>
                  )}
              </div>
          </div>
          
          {/* Chat Area */}
          <div className={`flex-1 flex flex-col bg-white ${!selectedChatId ? 'hidden md:flex' : 'flex'}`}>
              {selectedChatId ? (
                  <>
                    <div className="p-4 border-b flex items-center justify-between shadow-sm z-10 bg-white">
                        <div className="flex items-center gap-3">
                            <Button variant="ghost" size="icon" className="md:hidden -ml-2" onClick={() => setSelectedChatId(null)}><ArrowLeft className="w-5 h-5"/></Button>
                            {activePartners[selectedChatId] && (
                                <Link to={createUrl('/profile/:userId', { userId: activePartners[selectedChatId].id })} className="flex items-center gap-3 hover:opacity-80">
                                    <img src={activePartners[selectedChatId].avatar} className="w-10 h-10 rounded-full object-cover"/>
                                    <div>
                                        <span className="font-bold text-gray-900 block">{activePartners[selectedChatId].name}</span>
                                        <span className="text-xs text-green-600 flex items-center gap-1"><span className="w-1.5 h-1.5 bg-green-600 rounded-full"></span> Online</span>
                                    </div>
                                </Link>
                            )}
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-gray-50">
                        {messages.map((m, idx) => {
                            const isMe = m.senderId === currentUser?.id;
                            const showAvatar = !isMe && (idx === 0 || messages[idx - 1].senderId !== m.senderId);
                            
                            return (
                                <div key={m.id} className={`flex group ${isMe ? 'justify-end' : 'justify-start'}`}>
                                    {!isMe && showAvatar && activePartners[selectedChatId] && (
                                        <img src={activePartners[selectedChatId].avatar} className="w-8 h-8 rounded-full object-cover mr-2 self-end mb-1" />
                                    )}
                                    {!isMe && !showAvatar && <div className="w-10 mr-2" />} {/* Spacer */}
                                    
                                    <div className="relative max-w-[75%]">
                                        <div className={`p-3.5 rounded-2xl text-[15px] leading-relaxed shadow-sm ${
                                            isMe 
                                            ? 'bg-purple-600 text-white rounded-br-none' 
                                            : 'bg-white border border-gray-100 text-gray-800 rounded-bl-none'
                                        }`}>
                                            {m.text}
                                        </div>
                                        <span className={`text-[10px] mt-1 block opacity-60 ${isMe ? 'text-right' : 'text-left'}`}>
                                            {new Date(m.timestampRaw).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </span>
                                        
                                        {/* Message Actions */}
                                        <div className={`absolute top-1/2 -translate-y-1/2 ${isMe ? '-left-8' : '-right-8'} opacity-0 group-hover:opacity-100 transition-opacity`}>
                                             <div className="relative">
                                                 <button onClick={() => setActiveMenuId(activeMenuId === m.id ? null : m.id)} className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full">
                                                     <MoreVertical className="w-4 h-4" />
                                                 </button>
                                                 {activeMenuId === m.id && (
                                                    <div className={`absolute top-0 ${isMe ? 'right-full mr-2' : 'left-full ml-2'} w-32 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-20 animate-zoom-in`}>
                                                        <button onClick={async () => { 
                                                            if(currentUser) {
                                                                toggleHideMessage(currentUser.id, m.id);
                                                                // Refresh messages
                                                                const msgs = await getMessagesForConversation(selectedChatId, currentUser.id);
                                                                setMessages(msgs);
                                                            }
                                                            setActiveMenuId(null); 
                                                        }} className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50">Hide Message</button>
                                                        <button onClick={async () => { 
                                                            await deleteMessage(selectedChatId, m.id);
                                                            // Refresh messages
                                                            const msgs = await getMessagesForConversation(selectedChatId, currentUser.id);
                                                            setMessages(msgs);
                                                            setActiveMenuId(null);
                                                        }} className="w-full text-left px-3 py-2 text-xs text-red-600 hover:bg-red-50">Delete</button>
                                                    </div>
                                                 )}
                                             </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>
                    <div className="p-4 border-t bg-white">
                        <div className="flex items-center gap-2 bg-gray-50 rounded-full p-1 border border-gray-200 focus-within:border-purple-400 focus-within:ring-2 focus-within:ring-purple-100 transition-all">
                            <Button size="icon" variant="ghost" className="rounded-full text-gray-400 hover:text-purple-600"><ImageIcon className="w-5 h-5"/></Button>
                            <Input 
                                value={messageText} 
                                onChange={e => setMessageText(e.target.value)} 
                                placeholder="Type a message..." 
                                onKeyPress={e => e.key === 'Enter' && handleSend()} 
                                className="border-0 bg-transparent focus:ring-0 shadow-none h-10"
                            />
                            <Button size="icon" onClick={handleSend} disabled={!messageText.trim()} className={`rounded-full w-10 h-10 transition-all ${messageText.trim() ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-gray-200 text-gray-400'}`}>
                                <Send className="w-4 h-4 ml-0.5"/>
                            </Button>
                        </div>
                    </div>
                  </>
              ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8 bg-gray-50">
                      <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                        <MessageCircle className="w-12 h-12 text-purple-200" />
                      </div>
                      <h2 className="text-xl font-bold text-gray-900 mb-2">Select a conversation</h2>
                      <p className="text-gray-500 max-w-xs text-center">Choose a chat from the sidebar or start a new conversation to connect with other artists.</p>
                  </div>
              )}
          </div>

          {showNewChatModal && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
                  <div className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col shadow-2xl animate-slide-up">
                      <div className="p-4 border-b flex justify-between items-center">
                          <h3 className="font-bold text-lg">New Chat</h3>
                          <button onClick={() => setShowNewChatModal(false)} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-5 h-5"/></button>
                      </div>
                      <div className="p-4 border-b">
                          <div className="relative">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
                              <Input placeholder="Search users..." className="pl-9 bg-gray-50 border-gray-200 rounded-xl"/>
                          </div>
                      </div>
                      <div className="overflow-y-auto p-2">
                          {users.map(u => (
                              <button key={u.id} onClick={async () => {
                                  const cid = await startConversation(currentUser!.id, u.id);
                                  setSelectedChatId(cid);
                                  setShowNewChatModal(false);
                              }} className="w-full flex items-center gap-4 p-3 hover:bg-gray-50 rounded-xl text-left transition-colors group">
                                  <img src={u.avatar} className="w-12 h-12 rounded-full object-cover border border-gray-100"/>
                                  <div className="flex-1">
                                      <span className="font-semibold text-gray-900 block">{u.name}</span>
                                      <span className="text-sm text-gray-500">@{u.username}</span>
                                  </div>
                                  <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                      <MessageCircle className="w-4 h-4" />
                                  </div>
                              </button>
                          ))}
                      </div>
                  </div>
              </div>
          )}
      </div>
  );
}