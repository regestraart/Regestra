
import React, { useState, useEffect } from "react";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Search, Send, MoreVertical, Image as ImageIcon, Smile, MessageCircle, Plus, X } from "lucide-react";
import { useUser } from "../context/UserContext";
import { 
  getConversationsForUser, 
  getMessagesForConversation, 
  sendMessage, 
  startConversation, 
  getAllUsers, 
  findUserById,
  Conversation,
  Message,
  User
} from "../data/mock";

export default function Messages() {
  const { currentUser } = useUser();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  
  // New Chat Modal State
  const [showNewChat, setShowNewChat] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [userSearch, setUserSearch] = useState("");

  useEffect(() => {
    if (currentUser) {
      loadConversations();
    }
  }, [currentUser]);

  useEffect(() => {
    if (selectedChatId) {
      const msgs = getMessagesForConversation(selectedChatId);
      setMessages([...msgs]); // Create copy to trigger re-render
      
      // Poll for new messages
      const interval = setInterval(() => {
          const updatedMsgs = getMessagesForConversation(selectedChatId);
          if (updatedMsgs.length !== messages.length) {
             setMessages([...updatedMsgs]);
          }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [selectedChatId, messages.length]);

  const loadConversations = () => {
    if (currentUser) {
        const convs = getConversationsForUser(currentUser.id);
        setConversations(convs);
    }
  };

  // Refresh conversations list periodically to show new incoming chats
  useEffect(() => {
      const interval = setInterval(loadConversations, 2000);
      return () => clearInterval(interval);
  }, [currentUser]);


  const handleSend = () => {
    if (messageText.trim() && selectedChatId && currentUser) {
      sendMessage(selectedChatId, currentUser.id, messageText);
      setMessageText("");
      // Immediate update
      setMessages(getMessagesForConversation(selectedChatId));
      loadConversations();
    }
  };

  const handleNewChatClick = () => {
    setUsers(getAllUsers().filter(u => u.id !== currentUser?.id));
    setShowNewChat(true);
  };

  const startChatWithUser = (targetUserId: string) => {
    if (currentUser) {
        const convId = startConversation(currentUser.id, targetUserId);
        setShowNewChat(false);
        loadConversations();
        setSelectedChatId(convId);
    }
  };

  const getOtherParticipant = (conv: Conversation) => {
      if (!currentUser) return null;
      const otherId = conv.participants.find(id => id !== currentUser.id);
      return findUserById(otherId);
  };
  
  const filteredConversations = conversations.filter(c => {
      const other = getOtherParticipant(c);
      return other?.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(userSearch.toLowerCase()) || 
    u.username.toLowerCase().includes(userSearch.toLowerCase())
  );

  const currentConversation = conversations.find(c => c.id === selectedChatId);
  const currentChatPartner = currentConversation ? getOtherParticipant(currentConversation) : null;

  if (!currentUser) return <div>Please log in to view messages.</div>;

  return (
    <div className="h-[calc(100vh-4rem)] bg-gray-50 flex relative">
      {/* Sidebar */}
      <div className={`w-full md:w-96 bg-white border-r border-gray-200 flex flex-col ${selectedChatId ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
            <Button size="icon" variant="ghost" className="rounded-full" onClick={handleNewChatClick}>
                <Plus className="w-6 h-6 text-purple-600" />
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input 
                placeholder="Search conversations..." 
                className="pl-10 bg-gray-50 border-0 rounded-xl" 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                  <p>No conversations yet.</p>
                  <Button variant="link" className="text-purple-600" onClick={handleNewChatClick}>Start a chat</Button>
              </div>
          ) : (
            filteredConversations.map((conv) => {
                const other = getOtherParticipant(conv);
                if (!other) return null;
                return (
                    <button 
                        key={conv.id} 
                        onClick={() => setSelectedChatId(conv.id)} 
                        className={`w-full p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors ${selectedChatId === conv.id ? 'bg-purple-50' : ''}`}
                    >
                    <div className="relative">
                        <img src={other.avatar} alt={other.name} className="w-14 h-14 rounded-full object-cover" />
                        {/* Online status mock */}
                        <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                    </div>
                    <div className="flex-1 text-left min-w-0">
                        <div className="flex items-center justify-between mb-1">
                        <p className="font-semibold text-gray-900 truncate">{other.name}</p>
                        <span className="text-xs text-gray-500 whitespace-nowrap">{conv.lastMessageTimestamp}</span>
                        </div>
                        <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-600 truncate">{conv.lastMessage || "Start a conversation"}</p>
                        {conv.unreadCount > 0 && <span className="ml-2 px-2 py-0.5 bg-purple-600 text-white text-xs rounded-full whitespace-nowrap">{conv.unreadCount}</span>}
                        </div>
                    </div>
                    </button>
                );
            })
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`flex-1 flex flex-col bg-white ${!selectedChatId ? 'hidden md:flex' : 'flex'}`}>
        {selectedChatId && currentChatPartner ? (
          <>
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSelectedChatId(null)}>
                    <X className="w-5 h-5" />
                </Button>
                <div className="relative">
                  <img src={currentChatPartner.avatar} alt={currentChatPartner.name} className="w-12 h-12 rounded-full object-cover" />
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{currentChatPartner.name}</p>
                  <p className="text-sm text-gray-500">@{currentChatPartner.username}</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="rounded-full" aria-label="More options"><MoreVertical className="w-5 h-5 text-gray-500" /></Button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
              {messages.length === 0 ? (
                  <div className="text-center text-gray-500 mt-10">
                      <p>No messages yet. Say hello!</p>
                  </div>
              ) : (
                messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.senderId === currentUser.id ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] px-4 py-2 rounded-2xl ${msg.senderId === currentUser.id ? 'bg-gradient-to-r from-purple-600 to-blue-500 text-white' : 'bg-white text-gray-900 border border-gray-200'}`}>
                        <p className="text-sm">{msg.text}</p>
                        <p className={`text-xs mt-1 ${msg.senderId === currentUser.id ? 'text-purple-200' : 'text-gray-500'}`}>{msg.timestamp}</p>
                    </div>
                    </div>
                ))
              )}
            </div>

            <div className="p-4 border-t border-gray-200 bg-white">
              <div className="flex items-end gap-3">
                <Button variant="ghost" size="icon" className="flex-shrink-0 rounded-full" aria-label="Attach image"><ImageIcon className="w-5 h-5 text-gray-500" /></Button>
                <div className="flex-1 relative">
                  <Input 
                    value={messageText} 
                    onChange={(e) => setMessageText(e.target.value)} 
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()} 
                    placeholder="Type a message..." 
                    className="pr-12 rounded-full border-gray-200 focus:border-purple-500 focus:ring-purple-500" 
                  />
                  <Button variant="ghost" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full" aria-label="Add emoji"><Smile className="w-5 h-5 text-gray-500" /></Button>
                </div>
                <Button onClick={handleSend} disabled={!messageText.trim()} className="flex-shrink-0 bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 text-white rounded-full w-12 h-12 p-0 disabled:opacity-50" aria-label="Send message">
                  <Send className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">Select a conversation</p>
              <p className="text-sm">Choose from your existing conversations or start a new one</p>
            </div>
          </div>
        )}
      </div>
      
      {/* New Chat Modal */}
      {showNewChat && (
          <div className="absolute inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl w-full max-w-md h-[80vh] flex flex-col shadow-2xl animate-in fade-in zoom-in duration-200">
                  <div className="p-4 border-b flex items-center justify-between">
                      <h2 className="text-lg font-bold">New Message</h2>
                      <Button variant="ghost" size="icon" onClick={() => setShowNewChat(false)}><X className="w-5 h-5" /></Button>
                  </div>
                  <div className="p-4 border-b">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input 
                            placeholder="Search users..." 
                            className="pl-10 rounded-xl" 
                            value={userSearch}
                            onChange={e => setUserSearch(e.target.value)}
                        />
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-2">
                      {filteredUsers.map(u => (
                          <button 
                            key={u.id} 
                            onClick={() => startChatWithUser(u.id)}
                            className="w-full flex items-center gap-3 p-3 hover:bg-gray-100 rounded-xl transition-colors text-left"
                          >
                              <img src={u.avatar} alt={u.name} className="w-10 h-10 rounded-full object-cover" />
                              <div>
                                  <p className="font-semibold text-gray-900">{u.name}</p>
                                  <p className="text-sm text-gray-500">@{u.username}</p>
                              </div>
                          </button>
                      ))}
                      {filteredUsers.length === 0 && (
                          <p className="text-center text-gray-500 mt-4">No users found</p>
                      )}
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}
