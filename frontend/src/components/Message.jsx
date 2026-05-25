import React from 'react';
import ReactMarkdown from 'react-markdown';
import { User, Bot, Wrench, CheckCircle2 } from 'lucide-react';

export default function Message({ message }) {
  const isUser = message.role === 'user';
  
  if (message.role === 'model' && message.toolCalls && message.toolCalls.length > 0) {
    return (
      <div className="flex gap-4 p-4 my-2 text-sm text-slate-400 border border-slate-700/50 rounded-lg bg-slate-800/20">
        <div className="flex-shrink-0 mt-1">
          <Wrench size={18} className="text-blue-400" />
        </div>
        <div className="flex flex-col gap-2">
          {message.toolCalls.map((call, idx) => (
            <div key={idx} className="flex flex-col gap-1">
              <span className="font-semibold text-blue-400">Agent executing: {call.name}</span>
              <pre className="bg-slate-900/50 p-2 rounded text-xs overflow-x-auto whitespace-pre-wrap">
                {JSON.stringify(call.args, null, 2)}
              </pre>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (message.role === 'system' && message.toolResults && message.toolResults.length > 0) {
    return (
      <div className="flex gap-4 p-4 my-2 text-sm text-slate-400 border border-emerald-900/30 rounded-lg bg-emerald-900/10">
        <div className="flex-shrink-0 mt-1">
          <CheckCircle2 size={18} className="text-emerald-500" />
        </div>
        <div className="flex flex-col gap-2">
          {message.toolResults.map((result, idx) => (
            <div key={idx} className="flex flex-col gap-1">
              <span className="font-semibold text-emerald-500">Result from {result.name}:</span>
              <pre className="bg-slate-900/50 p-2 rounded text-xs overflow-x-auto whitespace-pre-wrap">
                {typeof result.result === 'string' ? result.result : JSON.stringify(result.result, null, 2)}
              </pre>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex gap-4 p-4 my-4 rounded-2xl ${isUser ? 'bg-indigo-600/20 ml-8 md:ml-24' : 'bg-slate-800/50 mr-8 md:mr-24'}`}>
      <div className="flex-shrink-0">
        {isUser ? (
          <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <User size={20} className="text-white" />
          </div>
        ) : (
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Bot size={20} className="text-white" />
          </div>
        )}
      </div>
      <div className="flex-grow overflow-hidden">
        <div className={`markdown-content ${isUser ? 'text-slate-200 font-medium' : 'text-slate-350'}`}>
          {message.content ? (
            <ReactMarkdown>{message.content}</ReactMarkdown>
          ) : (
            <span className="italic text-slate-500">Processing...</span>
          )}
        </div>
      </div>
    </div>
  );
}
