import React, { useState, useEffect } from 'react';
import { getEngineeringAdvice } from '../services/geminiService';
import { MessageSquare, Loader2, Send } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface AdvicePanelProps {
  defaultPrompt: string;
}

export const AdvicePanel: React.FC<AdvicePanelProps> = ({ defaultPrompt }) => {
  const [prompt, setPrompt] = useState(defaultPrompt);
  const [response, setResponse] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(true);

  const fetchAdvice = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    const res = await getEngineeringAdvice(prompt);
    setResponse(res);
    setLoading(false);
  };

  useEffect(() => {
    // Initial fetch for the specific scenario provided in the prompt
    if (defaultPrompt && !response) {
      fetchAdvice();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={`fixed right-4 bottom-4 transition-all duration-300 flex flex-col ${isOpen ? 'w-96 h-[600px]' : 'w-auto h-auto'}`}>
       {!isOpen && (
         <button 
          onClick={() => setIsOpen(true)}
          className="bg-blue-600 hover:bg-blue-500 text-white p-4 rounded-full shadow-lg flex items-center gap-2"
        >
          <MessageSquare size={24} />
          <span className="font-bold">AI Engineer</span>
         </button>
       )}

       {isOpen && (
         <div className="bg-gray-850 border border-gray-700 rounded-xl shadow-2xl flex flex-col h-full overflow-hidden">
            {/* Header */}
            <div className="bg-gray-900 p-4 border-b border-gray-700 flex justify-between items-center">
              <div className="flex items-center gap-2">
                 <div className="bg-blue-500/20 p-2 rounded-lg">
                    <MessageSquare size={20} className="text-blue-400" />
                 </div>
                 <h3 className="font-bold text-gray-200">Engineering Assistant</h3>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-900/50">
               {response ? (
                 <div className="prose prose-invert prose-sm max-w-none">
                    <ReactMarkdown>{response}</ReactMarkdown>
                 </div>
               ) : (
                 <div className="text-gray-500 text-center mt-10">
                    Initializing Engineering Context...
                 </div>
               )}
               {loading && (
                 <div className="flex justify-center p-4">
                    <Loader2 className="animate-spin text-blue-500" size={32} />
                 </div>
               )}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-gray-900 border-t border-gray-700">
               <div className="flex gap-2">
                 <input 
                    type="text" 
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Ask about calibration or math..."
                    className="flex-1 bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                    onKeyDown={(e) => e.key === 'Enter' && fetchAdvice()}
                 />
                 <button 
                  onClick={fetchAdvice}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white p-2 rounded"
                 >
                    <Send size={18} />
                 </button>
               </div>
            </div>
         </div>
       )}
    </div>
  );
};
