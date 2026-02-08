import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI } from "@google/genai";

// --- Types ---
type Category = 'Housing' | 'Food' | 'Utilities' | 'Transport' | 'Health' | 'Shopping' | 'Entertainment' | 'Education' | 'Other';

interface CostItem {
  id: string;
  name: string;
  amount: number;
  category: Category;
}

const CATEGORIES: { id: Category; label: string; icon: string; color: string; bg: string }[] = [
  { id: 'Housing', label: 'Housing', icon: '🏠', color: '#4f46e5', bg: 'bg-indigo-100' }, 
  { id: 'Food', label: 'Food', icon: '🍔', color: '#ea580c', bg: 'bg-orange-100' }, 
  { id: 'Utilities', label: 'Utilities', icon: '⚡', color: '#eab308', bg: 'bg-yellow-100' }, 
  { id: 'Transport', label: 'Transport', icon: '🚗', color: '#0ea5e9', bg: 'bg-sky-100' }, 
  { id: 'Health', label: 'Health', icon: '💊', color: '#ef4444', bg: 'bg-red-100' }, 
  { id: 'Shopping', label: 'Shopping', icon: '🛍️', color: '#ec4899', bg: 'bg-pink-100' }, 
  { id: 'Entertainment', label: 'Fun', icon: '🎉', color: '#8b5cf6', bg: 'bg-violet-100' }, 
  { id: 'Education', label: 'Education', icon: '🎓', color: '#10b981', bg: 'bg-emerald-100' }, 
  { id: 'Other', label: 'Other', icon: '💸', color: '#64748b', bg: 'bg-slate-100' }, 
];

// --- Icons ---
const Icons = {
  Trash: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c0 1-2 2-2 2v2"/></svg>,
  Plus: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>,
  Sparkles: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M9 5H1"/></svg>,
  Refresh: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21h5v-5"/></svg>,
  TrendingUp: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>,
  ChevronDown: () => <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
};

// --- Helper Components ---

const Header = () => (
  <header className="glass-panel sticky top-4 z-50 mx-4 sm:mx-auto max-w-6xl rounded-2xl shadow-sm mb-8">
    <div className="px-6 h-16 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 p-2 rounded-lg shadow-md shadow-indigo-200">
          <svg className="text-white w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900 leading-none tracking-tight">SmartCost</h1>
          <p className="text-[11px] font-bold text-indigo-500 uppercase tracking-widest mt-0.5">AI Financial Advisor</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="hidden sm:inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold bg-white border border-slate-200 text-indigo-700 shadow-sm">
           <span className="text-indigo-500"><Icons.Sparkles /></span> Powered by Gemini
        </span>
      </div>
    </div>
  </header>
);

const Markdown = ({ content }: { content: string }) => {
  const parseContent = () => {
    const lines = content.split('\n');
    let output = [];
    let listBuffer = [];

    const flushList = (key: number) => {
      if (listBuffer.length > 0) {
        output.push(
          <ul key={`list-${key}`} className="list-disc pl-5 mb-4 space-y-2 text-slate-700">
            {listBuffer.map((item, i) => <li key={i} className="pl-1">{item}</li>)}
          </ul>
        );
        listBuffer = [];
      }
    };

    const processInline = (text: string) => {
      const parts = text.split(/(\*\*.*?\*\*)/g);
      return parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i} className="font-bold text-slate-900 bg-indigo-50/80 px-1 rounded">{part.slice(2, -2)}</strong>;
        }
        return part;
      });
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Headers
      if (line.startsWith('### ')) {
        flushList(i);
        output.push(<h3 key={i} className="text-md font-bold text-indigo-900 mt-5 mb-2 flex items-center gap-2">{processInline(line.replace('### ', ''))}</h3>);
      } else if (line.startsWith('## ')) {
        flushList(i);
        output.push(<h2 key={i} className="text-lg font-bold text-slate-900 mt-6 mb-3 border-b border-indigo-100 pb-1">{processInline(line.replace('## ', ''))}</h2>);
      } 
      // Lists
      else if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        listBuffer.push(processInline(line.replace(/^[-*] /, '')));
      }
      // Empty lines
      else if (line.trim() === '') {
        flushList(i);
      }
      // Paragraphs
      else {
        flushList(i);
        output.push(<p key={i} className="mb-3 text-slate-600 leading-relaxed text-sm">{processInline(line)}</p>);
      }
    }
    flushList(lines.length);
    return output;
  };

  return <div className="markdown-body">{parseContent()}</div>;
};

const CostRow = ({ 
  item, 
  onChange, 
  onDelete,
}: { 
  item: CostItem; 
  onChange: (id: string, field: keyof CostItem, value: any) => void; 
  onDelete: (id: string) => void;
}) => {
  const cat = CATEGORIES.find(c => c.id === item.category) || CATEGORIES[CATEGORIES.length - 1];

  return (
    <div className="group relative bg-white border border-slate-200 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_16px_rgba(0,0,0,0.04)] hover:border-indigo-300 transition-all duration-300 mb-3 animate-fade-in overflow-hidden">
      <div className="flex flex-col sm:grid sm:grid-cols-[160px_1fr_140px_auto] items-center p-2 gap-2 sm:gap-4">
        
        {/* Category Select */}
        <div className="relative w-full sm:w-auto h-12 sm:h-auto">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-xl z-10">
            {cat.icon}
          </div>
          <select
            value={item.category}
            onChange={(e) => onChange(item.id, 'category', e.target.value)}
            className="w-full h-full sm:h-12 pl-11 pr-8 text-sm font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border-none rounded-lg focus:ring-2 focus:ring-indigo-500/50 cursor-pointer appearance-none transition-colors"
          >
            {CATEGORIES.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.label}</option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-400">
            <Icons.ChevronDown />
          </div>
        </div>

        {/* Name Input */}
        <input
          type="text"
          placeholder="What is this expense for?"
          value={item.name}
          onChange={(e) => onChange(item.id, 'name', e.target.value)}
          className="w-full h-12 text-sm font-medium p-3 bg-transparent border-b sm:border-b-0 sm:border-l border-slate-100 focus:bg-slate-50 rounded-lg sm:rounded-none focus:ring-0 outline-none text-slate-700 placeholder:text-slate-400 transition-colors"
        />

        {/* Amount Input */}
        <div className="relative w-full sm:w-auto h-12">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">৳</span>
          <input
            type="number"
            placeholder="0"
            value={item.amount === 0 ? '' : item.amount}
            onChange={(e) => onChange(item.id, 'amount', parseFloat(e.target.value) || 0)}
            className="w-full h-full text-right pr-4 pl-8 text-sm font-bold text-slate-800 bg-slate-50 rounded-lg border border-transparent focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
          />
        </div>

        {/* Delete Button */}
        <button 
          onClick={() => onDelete(item.id)}
          className="w-full sm:w-10 h-10 flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
          title="Remove item"
        >
          <Icons.Trash />
        </button>
      </div>
    </div>
  );
};

const ExpenseChart = ({ items }: { items: CostItem[] }) => {
  const total = items.reduce((sum, item) => sum + item.amount, 0);
  
  if (total === 0) return (
    <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
      <div className="p-4 bg-white rounded-full shadow-sm mb-3 text-2xl grayscale opacity-50">📊</div>
      <span>Add expenses to see analytics</span>
    </div>
  );

  const grouped = items.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + item.amount;
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.entries(grouped)
    .map(([catId, amount]) => ({
      ...CATEGORIES.find(c => c.id === catId)!,
      amount,
      percentage: (amount / total) * 100
    }))
    .sort((a, b) => b.amount - a.amount);

  let currentDeg = 0;

  return (
    <div className="flex flex-col items-center animate-fade-in">
      {/* Donut Chart */}
      <div className="relative w-64 h-64 mb-8">
        <div className="absolute inset-0 rounded-full bg-slate-100 blur-sm transform scale-105"></div>
        <div 
          className="relative w-full h-full rounded-full transition-all duration-700 shadow-xl"
          style={{
            background: `conic-gradient(${chartData.map((item) => {
              const deg = (item.amount / total) * 360;
              const segment = `${item.color} ${currentDeg}deg ${currentDeg + deg}deg`;
              currentDeg += deg;
              return segment;
            }).join(', ')})`
          }}
        >
          <div className="absolute inset-1 rounded-full bg-white/30 backdrop-blur-[1px]"></div>
        </div>
        
        {/* Inner Circle Info */}
        <div className="absolute inset-8 bg-white rounded-full shadow-[inset_0_2px_8px_rgba(0,0,0,0.06)] flex flex-col items-center justify-center z-10">
           <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Spent</span>
           <span className="text-3xl font-black text-slate-800 tracking-tighter">
             {(total / 1000).toFixed(1)}k
           </span>
           <span className="text-xs text-slate-400 mt-1 font-medium">BDT</span>
        </div>
      </div>

      {/* Legend */}
      <div className="w-full space-y-2">
        {chartData.map((item) => (
          <div key={item.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors group cursor-default">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg ${item.bg} flex items-center justify-center text-lg shadow-sm group-hover:scale-110 transition-transform`}>
                {item.icon}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-slate-700">{item.label}</span>
                <div className="flex items-center gap-2">
                   <div className="h-1 w-12 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${item.percentage}%`, backgroundColor: item.color }}></div>
                   </div>
                   <span className="text-[10px] text-slate-400 font-semibold">{item.percentage.toFixed(0)}%</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-slate-800">৳{item.amount.toLocaleString()}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- Main App ---

const App = () => {
  const [items, setItems] = useState<CostItem[]>([
    { id: '1', name: 'Apartment Rent', amount: 18000, category: 'Housing' },
    { id: '2', name: 'Monthly Grocery', amount: 8500, category: 'Food' },
    { id: '3', name: 'Internet & Electricity', amount: 3200, category: 'Utilities' },
  ]);
  
  const [income, setIncome] = useState<number>(45000);
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showIncomeSettings, setShowIncomeSettings] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const calculateTotal = useMemo(() => items.reduce((acc, item) => acc + item.amount, 0), [items]);
  const savings = income - calculateTotal;

  // Auto-scroll chat
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [aiAnalysis]);

  const handleAddItem = () => {
    const newItem: CostItem = {
      id: Date.now().toString(),
      name: '',
      amount: 0,
      category: 'Other'
    };
    setItems([...items, newItem]);
  };

  const handleUpdateItem = (id: string, field: keyof CostItem, value: any) => {
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
    setAiAnalysis('');

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      
      const itemsList = items
        .filter(i => i.amount > 0)
        .map(i => `- ${i.category}: ৳${i.amount} (${i.name || 'Misc'})`)
        .join('\n');

      const prompt = `
        As an expert financial advisor specializing in the Bangladeshi economy, analyze this monthly budget:
        
        **Financial Snapshot:**
        - Monthly Income: ৳${income}
        - Total Expenses: ৳${calculateTotal}
        - Net Savings: ৳${savings} (${((savings/income)*100).toFixed(1)}%)
        
        **Expenses:**
        ${itemsList}

        Provide a structured advice report with:
        1. **Verdict**: A 1-sentence assessment of their financial health.
        2. **Spending Analysis**: Identify the biggest drains on their wallet.
        3. **Bangla Wisdom**: 3 concrete, culturally relevant tips to save money (use mixed Bangla/English for natural feel).
        4. **Action Plan**: One immediate action they should take today.

        Use professional but encouraging tone. Use Markdown headers and lists.
      `;

      const response = await ai.models.generateContentStream({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });

      for await (const chunk of response) {
        setAiAnalysis(prev => prev + chunk.text);
      }

    } catch (error) {
      console.error("AI Error:", error);
      setAiAnalysis("⚠️ **Connection Error**: Unable to reach the financial brain. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="pb-24">
      <Header />
      
      <main className="max-w-6xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Data Entry */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Income Card */}
          <div className="glass-panel rounded-2xl p-6 flex flex-col sm:flex-row justify-between items-center gap-4 relative overflow-hidden group">
             <div className="absolute inset-0 bg-gradient-to-r from-emerald-50 to-teal-50 opacity-50"></div>
             
             <div className="relative z-10 flex items-center gap-4 w-full">
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 shadow-sm">
                  <Icons.TrendingUp />
                </div>
                <div className="flex-1">
                   <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wide">Monthly Income</h2>
                   
                   {showIncomeSettings ? (
                      <div className="flex items-center gap-2 mt-1 animate-fade-in">
                        <span className="text-2xl font-bold text-slate-400">৳</span>
                        <input 
                          autoFocus
                          type="number" 
                          value={income}
                          onBlur={() => setShowIncomeSettings(false)}
                          onChange={(e) => setIncome(parseFloat(e.target.value) || 0)}
                          className="w-full bg-transparent text-2xl font-bold text-slate-900 border-b-2 border-emerald-500 focus:outline-none"
                        />
                      </div>
                   ) : (
                      <div 
                        onClick={() => setShowIncomeSettings(true)}
                        className="text-3xl font-black text-slate-900 cursor-pointer hover:text-emerald-700 transition-colors mt-1"
                      >
                        ৳{income.toLocaleString()}
                        <span className="ml-2 text-xs font-medium text-slate-400 align-middle">Click to edit</span>
                      </div>
                   )}
                </div>
             </div>
          </div>

          {/* Expenses Card */}
          <div className="glass-panel rounded-2xl p-6 min-h-[500px] flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                Expenses
                <span className="text-xs font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded-md border border-slate-200">
                  {items.length}
                </span>
              </h2>
            </div>
            
            <div className="space-y-3 flex-1">
              {items.map((item) => (
                <CostRow 
                  key={item.id} 
                  item={item} 
                  onChange={handleUpdateItem} 
                  onDelete={handleDeleteItem}
                />
              ))}
            </div>

            <button 
              onClick={handleAddItem}
              className="mt-8 w-full py-4 border-2 border-dashed border-indigo-200 text-indigo-600 rounded-xl hover:bg-indigo-50 hover:border-indigo-400 transition-all font-bold flex items-center justify-center gap-2 group"
            >
              <div className="bg-indigo-100 p-1.5 rounded-full group-hover:bg-indigo-200 transition-colors group-hover:scale-110">
                <Icons.Plus />
              </div>
              <span>Add Expense Item</span>
            </button>
          </div>
        </div>

        {/* Right Column: Analytics & AI */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Analytics Summary */}
          <div className={`rounded-3xl shadow-2xl p-8 text-white relative overflow-hidden transition-all duration-500 ${savings >= 0 ? 'bg-slate-900' : 'bg-rose-900'}`}>
             {/* Dynamic Background */}
             <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 blur-[80px] rounded-full pointer-events-none"></div>
             <div className={`absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t ${savings >= 0 ? 'from-indigo-600/20' : 'from-rose-600/20'} to-transparent pointer-events-none`}></div>

             <div className="relative z-10">
               <div className="flex justify-between items-end mb-8">
                 <div>
                   <p className="text-slate-400 font-semibold mb-1">Net Balance</p>
                   <h2 className="text-4xl font-black tracking-tight">
                     {savings < 0 ? '-' : '+'}৳{Math.abs(savings).toLocaleString()}
                   </h2>
                 </div>
                 <div className={`px-3 py-1 rounded-full text-xs font-bold border ${savings >= 0 ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-rose-500/10 border-rose-500/30 text-rose-300'}`}>
                    {savings >= 0 ? 'On Track' : 'Over Budget'}
                 </div>
               </div>

               {/* Custom Progress Bar */}
               <div className="relative pt-6">
                 <div className="flex justify-between text-xs font-medium text-slate-400 mb-2">
                   <span>Expenses</span>
                   <span>Income Limit</span>
                 </div>
                 <div className="w-full bg-slate-800 rounded-full h-4 overflow-hidden border border-slate-700 shadow-inner relative">
                    {/* Marker for Income Limit */}
                    <div className="absolute right-0 top-0 bottom-0 w-0.5 bg-slate-600 z-20"></div>
                    
                    {/* Expense Fill */}
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ease-out relative ${savings < 0 ? 'bg-gradient-to-r from-orange-500 to-rose-500' : 'bg-gradient-to-r from-indigo-500 to-blue-500'}`}
                      style={{ width: `${Math.min((calculateTotal / (income || 1)) * 100, 100)}%` }}
                    >
                      {/* Shimmer Effect */}
                      <div className="absolute inset-0 w-full h-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%]"></div>
                    </div>
                 </div>
                 <div className="text-right mt-2 text-xs text-slate-400 font-mono">
                   {((calculateTotal / (income || 1)) * 100).toFixed(1)}% Used
                 </div>
               </div>
             </div>
          </div>

          {/* Chart Card */}
          <div className="glass-panel rounded-2xl p-6">
             <h3 className="text-sm font-bold text-slate-800 mb-6 flex items-center gap-2 uppercase tracking-wider">
               <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
               Breakdown
             </h3>
             <ExpenseChart items={items} />
          </div>

          {/* AI Chat Card */}
          <div className="glass-panel rounded-2xl p-1 relative overflow-hidden shadow-lg border-t-4 border-t-indigo-500 flex flex-col max-h-[600px]">
            <div className="bg-indigo-50/50 p-4 border-b border-indigo-100 flex items-center justify-between">
               <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
                    <Icons.Sparkles />
                 </div>
                 <div>
                   <h3 className="font-bold text-slate-800 text-sm">Gemini Analysis</h3>
                   <p className="text-[10px] text-slate-500 font-medium">Smart Financial Tips</p>
                 </div>
               </div>
               {aiAnalysis && !isAnalyzing && (
                 <button onClick={handleAnalyze} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-full transition-all">
                    <Icons.Refresh />
                 </button>
               )}
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar bg-white/50 min-h-[200px]">
              {!aiAnalysis && !isAnalyzing && (
                <div className="flex flex-col items-center justify-center h-full text-center py-8">
                  <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-4 text-3xl">
                    🤖
                  </div>
                  <h4 className="font-bold text-slate-800 mb-2">Ready to Analyze</h4>
                  <p className="text-sm text-slate-500 mb-6 max-w-[240px]">
                    I can audit your expenses and find smart ways to save more money.
                  </p>
                  <button 
                    onClick={handleAnalyze}
                    disabled={calculateTotal === 0}
                    className={`px-6 py-3 rounded-xl font-bold text-sm shadow-lg shadow-indigo-200/50 transition-all flex items-center gap-2
                      ${calculateTotal > 0 ? 'bg-indigo-600 text-white hover:bg-indigo-700 hover:-translate-y-1' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                  >
                    <Icons.Sparkles /> Generate Report
                  </button>
                </div>
              )}

              {isAnalyzing && (
                <div className="space-y-4 py-8">
                   <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 shrink-0"></div>
                      <div className="space-y-2 w-full">
                        <div className="h-4 bg-indigo-50 rounded w-3/4 animate-pulse"></div>
                        <div className="h-4 bg-indigo-50 rounded w-1/2 animate-pulse"></div>
                      </div>
                   </div>
                   <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 shrink-0"></div>
                      <div className="space-y-2 w-full">
                        <div className="h-4 bg-indigo-50 rounded w-full animate-pulse"></div>
                        <div className="h-4 bg-indigo-50 rounded w-5/6 animate-pulse"></div>
                      </div>
                   </div>
                   <div className="text-center text-xs font-semibold text-indigo-400 animate-pulse mt-4">
                     Analyzing financial patterns...
                   </div>
                </div>
              )}

              {aiAnalysis && (
                <div className="animate-fade-in">
                  <Markdown content={aiAnalysis} />
                  <div ref={chatBottomRef}></div>
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