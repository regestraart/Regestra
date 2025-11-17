import React, { useState } from "react";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Search, Send, MoreVertical, Image as ImageIcon, Smile, MessageCircle } from "lucide-react";

export default function Messages() {
  const [selectedChat, setSelectedChat] = useState(1);
  const [message, setMessage] = useState("");

  const conversations = [
    { id: 1, name: "Marcus Williams", username: "@marcusart", avatar: "https://i.pravatar.cc/150?img=2", lastMessage: "That looks amazing! 🔥", timestamp: "2m ago", unread: 2, online: true },
    { id: 2, name: "Emma Rodriguez", username: "@emmacreates", avatar: "https://i.pravatar.cc/150?img=3", lastMessage: "Thanks for the feedback!", timestamp: "1h ago", unread: 0, online: true },
    { id: 3, name: "James Kim", username: "@jamesvisual", avatar: "https://i.pravatar.cc/150?img=4", lastMessage: "Let me know when you're free", timestamp: "3h ago", unread: 0, online: false },
    { id: 4, name: "Lisa Thompson", username: "@lisadesigns", avatar: "https://i.pravatar.cc/150?img=5", lastMessage: "Perfect! I'll send it over", timestamp: "1d ago", unread: 0, online: false }
  ];

  const messages = [
    { id: 1, senderId: 2, text: "Hey! I saw your latest artwork", timestamp: "10:30 AM" },
    { id: 2, senderId: 2, text: "The colors are incredible! 🎨", timestamp: "10:30 AM" },
    { id: 3, senderId: 1, text: "Thank you so much! I really appreciate it", timestamp: "10:32 AM" },
    { id: 4, senderId: 1, text: "I've been experimenting with this style for a while now", timestamp: "10:32 AM" },
    { id: 5, senderId: 2, text: "It really shows! The composition is perfect", timestamp: "10:35 AM" },
    { id: 6, senderId: 2, text: "That looks amazing! 🔥", timestamp: "10:36 AM" }
  ];

  const currentChat = conversations.find(c => c.id === selectedChat);

  const handleSend = () => {
    if (message.trim()) {
      setMessage("");
    }
  };

  return (
    <div className="h-[calc(100vh-4rem)] bg-gray-50 flex">
      <div className="w-full md:w-96 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Messages</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input placeholder="Search conversations..." className="pl-10 bg-gray-50 border-0 rounded-xl" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversations.map((conv) => (
            <button key={conv.id} onClick={() => setSelectedChat(conv.id)} className={`w-full p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors ${selectedChat === conv.id ? 'bg-purple-50' : ''}`}>
              <div className="relative">
                <img src={conv.avatar} alt={conv.name} className="w-14 h-14 rounded-full" />
                {conv.online && <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>}
              </div>
              <div className="flex-1 text-left min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-semibold text-gray-900 truncate">{conv.name}</p>
                  <span className="text-xs text-gray-500 whitespace-nowrap">{conv.timestamp}</span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600 truncate">{conv.lastMessage}</p>
                  {conv.unread > 0 && <span className="ml-2 px-2 py-0.5 bg-purple-600 text-white text-xs rounded-full whitespace-nowrap">{conv.unread}</span>}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-white hidden md:flex">
        {currentChat ? (
          <>
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img src={currentChat.avatar} alt={currentChat.name} className="w-12 h-12 rounded-full" />
                  {currentChat.online && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{currentChat.name}</p>
                  <p className="text-sm text-gray-500">{currentChat.online ? 'Active now' : 'Offline'}</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="rounded-full"><MoreVertical className="w-5 h-5 text-gray-500" /></Button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.senderId === 1 ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-md px-4 py-2 rounded-2xl ${msg.senderId === 1 ? 'bg-gradient-to-r from-purple-600 to-blue-500 text-white' : 'bg-white text-gray-900 border border-gray-200'}`}>
                    <p className="text-sm">{msg.text}</p>
                    <p className={`text-xs mt-1 ${msg.senderId === 1 ? 'text-purple-200' : 'text-gray-500'}`}>{msg.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-gray-200 bg-white">
              <div className="flex items-end gap-3">
                <Button variant="ghost" size="icon" className="flex-shrink-0 rounded-full"><ImageIcon className="w-5 h-5 text-gray-500" /></Button>
                <div className="flex-1 relative">
                  <Input value={message} onChange={(e) => setMessage(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSend()} placeholder="Type a message..." className="pr-12 rounded-full border-gray-200 focus:border-purple-500 focus:ring-purple-500" />
                  <Button variant="ghost" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full"><Smile className="w-5 h-5 text-gray-500" /></Button>
                </div>
                <Button onClick={handleSend} disabled={!message.trim()} className="flex-shrink-0 bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 text-white rounded-full w-12 h-12 p-0 disabled:opacity-50">
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
    </div>
  );
}