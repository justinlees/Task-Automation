import React, { useState, useEffect } from 'react';
import ChatBox from './components/ChatBox';
import { fetchConversations, fetchNotes } from './services/api';
import { MessageSquare, Plus, Menu, X, Sparkles, StickyNote } from 'lucide-react';

function App() {
  const [conversations, setConversations] = useState([]);
  const [notes, setNotes] = useState([]);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    loadConversations();
    loadNotes();
  }, []);

  const loadConversations = async () => {
    try {
      const data = await fetchConversations();
      setConversations(data);
    } catch (error) {
      console.error("Failed to load conversations:", error);
    }
  };

  const loadNotes = async () => {
    try {
      const data = await fetchNotes();
      setNotes(data);
    } catch (error) {
      console.error("Failed to load notes:", error);
    }
  };

  const handleNewChat = () => {
    setCurrentConversationId(null);
    setIsSidebarOpen(false);
  };

  const handleSelectConversation = (id) => {
    setCurrentConversationId(id);
    setIsSidebarOpen(false);
  };

  return (
    <div className="flex h-screen bg-[#0f172a] text-slate-200 overflow-hidden font-sans selection:bg-indigo-500/30">
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed md:static inset-y-0 left-0 w-72 bg-slate-900 border-r border-slate-800 z-30 transform transition-transform duration-300 ease-in-out flex flex-col ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-indigo-400">
            <Sparkles size={24} />
            <h1 className="font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">Nexus Agent</h1>
          </div>
          <button className="md:hidden text-slate-400 hover:text-white" onClick={() => setIsSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <div className="p-4">
          <button 
            onClick={handleNewChat}
            className="w-full flex items-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-colors shadow-lg shadow-indigo-500/10 font-medium"
          >
            <Plus size={18} />
            New Chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-4 flex flex-col gap-6">
          <div>
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-3">Recent Chats</h2>
            <div className="flex flex-col gap-1">
              {conversations.map(convo => (
                <button
                  key={convo._id}
                  onClick={() => handleSelectConversation(convo._id)}
                  className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all text-left truncate ${currentConversationId === convo._id ? 'bg-slate-800 text-indigo-300 shadow-inner' : 'hover:bg-slate-800/50 text-slate-400 hover:text-slate-200'}`}
                >
                  <MessageSquare size={16} className="flex-shrink-0" />
                  <span className="truncate text-sm">{convo.title}</span>
                </button>
              ))}
              {conversations.length === 0 && (
                <div className="px-3 py-4 text-sm text-slate-600 text-center italic">
                  No recent conversations.
                </div>
              )}
            </div>
          </div>

          <div>
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-3 flex items-center gap-2">
              <StickyNote size={14} /> Saved Notes
            </h2>
            <div className="flex flex-col gap-2 px-3">
              {notes.map(note => (
                <div key={note._id} className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
                  <h3 className="font-medium text-sm text-indigo-300 truncate">{note.title}</h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">{note.content}</p>
                </div>
              ))}
              {notes.length === 0 && (
                <div className="py-4 text-sm text-slate-600 text-center italic">
                  No saved notes yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative h-full max-w-full">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center p-4 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-10">
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 text-slate-400 hover:text-white">
            <Menu size={24} />
          </button>
          <div className="ml-2 font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">
            Nexus Agent
          </div>
        </header>

        {/* Chat Area */}
        <div className="flex-1 p-0 md:p-6 pb-0 md:pb-6 overflow-hidden">
          <ChatBox 
            conversationId={currentConversationId} 
            onNewConversation={(id) => {
              setCurrentConversationId(id);
              loadConversations();
              loadNotes();
            }}
          />
        </div>
      </main>
    </div>
  );
}

export default App;
