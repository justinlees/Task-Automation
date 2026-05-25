import React, { useState, useRef, useEffect } from 'react';
import Message from './Message';
import { Send, Loader2, Bot } from 'lucide-react';
import { API_URL } from '../services/api';

export default function ChatBox({ conversationId, onNewConversation }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState(conversationId);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    setCurrentConversationId(conversationId);
    if (conversationId) {
      fetch(`${API_URL}/chat/conversations/${conversationId}`)
        .then(res => res.json())
        .then(data => {
          if (data && data.messages) {
            setMessages(data.messages);
          }
        });
    } else {
      setMessages([]);
    }
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isProcessing]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsProcessing(true);

    try {
      const response = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage, conversationId: currentConversationId })
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let done = false;
      let streamedContent = "";

      // Add a placeholder message for the model
      setMessages(prev => [...prev, { role: 'model', content: '' }]);

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const dataStr = line.replace('data: ', '');
              try {
                const data = JSON.parse(dataStr);
                
                if (data.type === 'thinking') {
                  // just visual, not updating message state yet
                } else if (data.type === 'tool_call') {
                  setMessages(prev => {
                    const newMessages = [...prev];
                    const lastMsg = newMessages[newMessages.length - 1];
                    if (lastMsg.role === 'model') {
                      newMessages.pop(); // Remove empty model placeholder
                    }
                    newMessages.push({ role: 'model', toolCalls: [{ name: data.tool, args: data.args }] });
                    return newMessages;
                  });
                } else if (data.type === 'tool_result') {
                  setMessages(prev => [
                    ...prev,
                    { role: 'system', toolResults: [{ name: data.tool, result: data.result }] }
                  ]);
                  // add new placeholder for model response after tool
                  setMessages(prev => [...prev, { role: 'model', content: '' }]);
                } else if (data.type === 'text') {
                  streamedContent += data.content;
                  setMessages(prev => {
                    const newMessages = [...prev];
                    const lastMsg = newMessages[newMessages.length - 1];
                    if (lastMsg.role === 'model' && !lastMsg.toolCalls) {
                      lastMsg.content = streamedContent.replace(/\\n/g, '\n');
                    } else {
                      newMessages.push({ role: 'model', content: streamedContent.replace(/\\n/g, '\n') });
                    }
                    return newMessages;
                  });
                } else if (data.type === 'done') {
                  if (data.conversationId !== currentConversationId) {
                    setCurrentConversationId(data.conversationId);
                    onNewConversation(data.conversationId);
                  }
                } else if (data.type === 'error') {
                   setMessages(prev => [...prev, { role: 'model', content: `**Error:** ${data.message}` }]);
                }
              } catch (err) {
                console.error("Error parsing SSE data:", err, dataStr);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("Fetch error:", error);
      setMessages(prev => [...prev, { role: 'model', content: '**Error connecting to server.**' }]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 rounded-3xl overflow-hidden border border-slate-700/50 shadow-2xl relative">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-32 md:pb-36 scroll-smooth">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500">
            <div className="w-16 h-16 mb-4 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center">
              <Bot size={32} className="text-indigo-400" />
            </div>
            <h2 className="text-xl font-semibold text-slate-300">How can I help you today?</h2>
            <p className="mt-2 text-sm max-w-sm text-center">I can search the web, calculate math expressions, and save notes for you.</p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <Message key={idx} message={msg} />
          ))
        )}
        
        {isProcessing && messages.length > 0 && !messages[messages.length-1].content && !messages[messages.length-1].toolCalls && (
          <div className="flex gap-4 p-4 my-4 ml-8 md:ml-24 items-center text-slate-400">
             <div className="relative w-6 h-6 flex items-center justify-center">
                <div className="thinking-indicator absolute w-full h-full" />
                <Loader2 size={16} className="animate-spin text-blue-400" />
             </div>
             <span className="text-sm font-medium tracking-wider">Agent is thinking...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-slate-900/80 backdrop-blur-md border-t border-slate-800/50">
        <form onSubmit={handleSend} className="relative max-w-4xl mx-auto flex items-end gap-2">
          <div className="relative flex-grow">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(e);
                }
              }}
              placeholder="Type your goal here..."
              className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-2xl pl-4 pr-12 py-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none overflow-hidden min-h-[60px] max-h-[200px]"
              rows={1}
            />
          </div>
          <button
            type="submit"
            disabled={!input.trim() || isProcessing}
            className="absolute right-3 bottom-3 p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20"
          >
            <Send size={20} />
          </button>
        </form>
        <div className="text-center mt-2">
           <span className="text-[10px] text-slate-500">AI Agent can make mistakes. Consider verifying important information.</span>
        </div>
      </div>
    </div>
  );
}
