import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI } from "@google/genai";

// --- Types ---
interface CostItem {
  id: string;
  name: string;
  amount: number;
}

// --- Components ---

const Header = () => (
  <header className="bg-indigo-600 text-white py-6 px-4 shadow-lg sticky top-0 z-50">
    <div className="max-w-5xl mx-auto flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">স্মার্ট খরচের হিসাব</h1>
        <p className="text-indigo-200 text-sm mt-1">Smart Cost Calculator & Budget Advisor</p>
      </div>
      <div className="hidden md:block">
        <span className="bg-indigo-500 bg-opacity-30 px-3 py-1 rounded-full text-xs font-medium border border-indigo-400">
          Powered by Gemini
        </span>
      </div>
    </div>
  </header>
);

const CostRow = ({ 
  item, 
  onChange, 
  onDelete,
  isLast 
}: { 
  item: CostItem; 
  onChange: (id: string, field: 'name' | 'amount', value: string | number) => void; 
  onDelete: (id: string) => void;
  isLast: boolean;
}) => {
  return (
    <div className="group flex items-center gap-3 mb-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex-1">
        <input
          type="text"
          placeholder="খরচের নাম (e.g., Rent, Food)"
          value={item.name}
          onChange={(e) => onChange(item.id, 'name', e.target.value)}
          className="w-full text-sm p-3 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
        />
      </div>
      <div className="w-36 sm:w-40 relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">৳</span>
        <input
          type="number"
          placeholder="0"
          value={item.amount === 0 ? '' : item.amount}
          onChange={(e) => onChange(item.id, 'amount', parseFloat(e.target.value) || 0)}
          className="w-full text-sm p-3 pl-8 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all font-mono font-medium text-right"
        />
      </div>
      <button 
        onClick={() => onDelete(item.id)}
        className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
        title="Remove item"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c0 1-2 2-2 2v2"/></svg>
      </button>
    </div>
  );
};

const ExpenseChart = ({ items }: { items: CostItem[] }) => {
  const sortedItems = [...items].sort((a, b) => b.amount - a.amount);
  const topItems = sortedItems.slice(0, 4);
  const otherAmount = sortedItems.slice(4).reduce((sum, item) => sum + item.amount, 0);
  
  const total = items.reduce((sum, item) => sum + item.amount, 0);
  
  if (total === 0) return (
    <div className="h-40 flex items-center justify-center text-slate-400 text-sm italic border border-dashed border-slate-200 rounded-xl bg-slate-50">
      কোনো খরচ নেই (No expenses added)
    </div>
  );

  // Prepare data for rendering
  const chartData = [...topItems];
  if (otherAmount > 0) {
    chartData.push({ id: 'others', name: 'Others', amount: otherAmount });
  }

  // Colors for segments
  const colors = ['#4f46e5', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

  let currentDeg = 0;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-48 h-48 mb-6">
        <div 
          className="w-full h-full rounded-full shadow-inner"
          style={{
            background: `conic-gradient(${chartData.map((item, i) => {
              const deg = (item.amount / total) * 360;
              const segment = `${colors[i % colors.length]} ${currentDeg}deg ${currentDeg + deg}deg`;
              currentDeg += deg;
              return segment;
            }).join(', ')})`
          }}
        ></div>
        <div className="absolute inset-4 bg-white rounded-full flex items-center justify-center flex-col shadow-sm overflow-hidden">
          <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Total</span>
          <span className="text-lg sm:text-xl font-bold text-slate-800 text-center px-1 break-all">
            ৳{total.toLocaleString()}
          </span>
        </div>
      </div>

      <div className="w-full space-y-2">
        {chartData.map((item, i) => (
          <div key={item.id} className="flex items-center justify-between text-sm group">
            <div className="flex items-center">
              <span 
                className="w-3 h-3 rounded-full mr-2 shadow-sm" 
                style={{ backgroundColor: colors[i % colors.length] }}
              ></span>
              <span className="text-slate-600 font-medium truncate max-w-[120px]">
                {item.name || 'Unnamed Item'}
              </span>
            </div>
            <div className="flex items-center">
              <span className="text-slate-400 text-xs mr-2">
                {Math.round((item.amount / total) * 100)}%
              </span>
              <span className="font-bold text-slate-700">
                ৳{item.amount.toLocaleString()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- Main App ---

const App = () => {
  // Initial state with realistic BDT items
  const [items, setItems] = useState<CostItem[]>([
    { id: '1', name: 'House Rent', amount: 15000 },
    { id: '2', name: 'Groceries', amount: 8000 },
    { id: '3', name: 'Utilities', amount: 3500 },
  ]);

  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const calculateTotal = useMemo(() => {
    return items.reduce((acc, item) => acc + item.amount, 0);
  }, [items]);

  const handleAddItem = () => {
    const newItem: CostItem = {
      id: Date.now().toString(),
      name: '',
      amount: 0
    };
    setItems([...items, newItem]);
  };

  const handleUpdateItem = (id: string, field: 'name' | 'amount', value: string | number) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const handleDeleteItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const handleAnalyze = async () => {
    if (items.length === 0 || calculateTotal === 0) return;

    setIsAnalyzing(true);
    setAiAnalysis(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      
      // Construct a string representation of the list
      const itemsList = items
        .filter(i => i.amount > 0)
        .map(i => `- ${i.name || 'Unknown'}: ৳${i.amount}`)
        .join('\n');

      const prompt = `
        Act as a smart personal finance assistant for a Bangladeshi user. Speak in "Mixed Bangla" (Bengali mixed with common English financial terms).
        Currency is Bangladeshi Taka (BDT).
        
        Analyze this monthly expense list:
        ${itemsList}
        
        Total Cost: ৳${calculateTotal}

        1. Categorize the spending (Needs vs Wants roughly).
        2. Is the distribution healthy?
        3. Suggest 1 or 2 specific ways to save money based on these items.
        
        Provide the response in concise Mixed Bangla using bullet points. Keep it encouraging but practical.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });

      setAiAnalysis(response.text || "Could not generate analysis.");
    } catch (error) {
      console.error("AI Error:", error);
      setAiAnalysis("দুঃখিত, এই মুহূর্তে অ্যানালাইসিস করা যাচ্ছে না। দয়া করে API key চেক করুন অথবা কিছুক্ষণ পর আবার চেষ্টা করুন।");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const containerRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when adding new item if needed
  useEffect(() => {
    // Optional: Auto-scroll logic could go here
  }, [items.length]);

  return (
    <div className="min-h-screen bg-slate-50 pb-20 font-sans">
      <Header />
      
      <main className="max-w-5xl mx-auto px-4 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Input List */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex-1">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-slate-800 flex items-center">
                <span className="w-1.5 h-6 bg-indigo-500 rounded-full mr-3"></span>
                খরচের তালিকা (Expense List)
              </h2>
              <span className="text-xs font-semibold bg-slate-100 text-slate-500 px-2 py-1 rounded">
                {items.length} Items
              </span>
            </div>
            
            <div className="space-y-1" ref={containerRef}>
              {items.map((item, index) => (
                <CostRow 
                  key={item.id} 
                  item={item} 
                  onChange={handleUpdateItem} 
                  onDelete={handleDeleteItem}
                  isLast={index === items.length - 1}
                />
              ))}
            </div>

            <button 
              onClick={handleAddItem}
              className="mt-4 w-full py-3 border-2 border-dashed border-indigo-200 text-indigo-600 rounded-xl hover:bg-indigo-50 hover:border-indigo-300 transition-all font-semibold flex items-center justify-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
              নতুন খরচ যোগ করুন (Add Item)
            </button>
          </div>
        </div>

        {/* Right Column: Results & AI */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Total Card */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl shadow-xl overflow-hidden relative text-white">
            <div className="absolute top-0 right-0 p-32 bg-indigo-500 rounded-full mix-blend-overlay filter blur-3xl opacity-20"></div>
            <div className="absolute bottom-0 left-0 p-32 bg-purple-500 rounded-full mix-blend-overlay filter blur-3xl opacity-20"></div>
            
            <div className="p-8 relative z-10 text-center">
              <p className="text-indigo-200 text-sm font-semibold uppercase tracking-widest mb-2">সর্বমোট খরচ (Grand Total)</p>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-2 tracking-tight break-words">
                ৳{calculateTotal.toLocaleString()}
              </h2>
              <p className="text-slate-400 text-sm mt-4 border-t border-slate-700/50 pt-4 inline-block px-4">
                Total Items: {items.length}
              </p>
            </div>
          </div>

          {/* Visualization */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
             <h3 className="text-sm font-bold text-slate-700 mb-6 border-b border-slate-100 pb-3">
               খরচের ব্রেকডাউন (Breakdown)
             </h3>
             <ExpenseChart items={items} />
          </div>

          {/* AI Advisor */}
          <div className="bg-white rounded-2xl shadow-lg border border-indigo-100 p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
            
            <div className="relative z-10">
              <h3 className="text-lg font-bold mb-2 flex items-center text-slate-800">
                <span className="bg-gradient-to-r from-indigo-600 to-purple-600 text-transparent bg-clip-text">
                  AI বাজেট অ্যাডভাইজার
                </span>
                <span className="ml-2 px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] rounded-full border border-indigo-100 uppercase font-bold tracking-wide">Beta</span>
              </h3>
              <p className="text-slate-500 text-sm mb-4">
                আপনার খরচের লিস্টটি AI দিয়ে চেক করিয়ে নিন এবং সেভিংস এর টিপস পান।
              </p>
              
              {!aiAnalysis && !isAnalyzing && (
                <button 
                  onClick={handleAnalyze}
                  disabled={calculateTotal === 0}
                  className={`w-full font-bold py-3 px-4 rounded-xl shadow-md transition-all transform duration-100 flex items-center justify-center gap-2
                    ${calculateTotal > 0 
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-indigo-200 hover:-translate-y-0.5' 
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
                  খরচ অ্যানালাইসিস করুন
                </button>
              )}

              {isAnalyzing && (
                <div className="flex flex-col items-center justify-center py-6 bg-slate-50 rounded-xl border border-slate-100">
                   <div className="flex space-x-2 mb-3">
                      <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                      <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                   </div>
                  <span className="text-xs font-semibold text-indigo-500 uppercase tracking-wide">Calculating...</span>
                </div>
              )}

              {aiAnalysis && (
                <div className="bg-indigo-50 rounded-xl p-5 mt-2 border border-indigo-100">
                  <div className="prose prose-sm max-w-none text-slate-700">
                     <div className="text-sm leading-relaxed whitespace-pre-line font-medium">
                       {aiAnalysis}
                     </div>
                  </div>
                  <button 
                    onClick={() => setAiAnalysis(null)}
                    className="mt-4 text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center"
                  >
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                    Reset Analysis
                  </button>
                </div>
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);