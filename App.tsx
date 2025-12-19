
import React, { useState, useEffect, useRef } from 'react';
import { Task, QuadrantType, User } from './types';
import { storage } from './services/storage';
import { QUADRANTS } from './constants';
import Auth from './components/Auth';
import Header from './components/Header';
import PostIt from './components/PostIt';
import { Plus, AlertCircle, HelpCircle } from 'lucide-react';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<string | null>(() => {
    return localStorage.getItem('eisenhower_current_user');
  });

  const [tasks, setTasks] = useState<Task[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [newTaskSubject, setNewTaskSubject] = useState('');
  const [showAddFor, setShowAddFor] = useState<QuadrantType | null>(null);
  const [lastSaved, setLastSaved] = useState<string>(new Date().toLocaleTimeString());
  const [dragOverQuadrant, setDragOverQuadrant] = useState<QuadrantType | null>(null);
  
  const [alertConfig, setAlertConfig] = useState<{ message: string; title?: string } | null>(null);
  const [confirmConfig, setConfirmConfig] = useState<{ 
    message: string; 
    title?: string; 
    onConfirm: () => void;
    confirmLabel?: string;
  } | null>(null);

  const lastLoadedUser = useRef<string | null>(null);

  useEffect(() => {
    if (currentUser) {
      const data = storage.getUser(currentUser);
      const loadedTasks = data ? data.tasks : [];
      setTasks(loadedTasks);
      localStorage.setItem('eisenhower_current_user', currentUser);
      lastLoadedUser.current = currentUser;
      setIsReady(true);
      setLastSaved(new Date().toLocaleTimeString());
    } else {
      setTasks([]);
      setIsReady(false);
      localStorage.removeItem('eisenhower_current_user');
    }
  }, [currentUser]);

  // Explicit persistence helper
  const persistAndSetTasks = (newTasks: Task[]) => {
    if (currentUser) {
      storage.updateTasks(currentUser, newTasks);
      setTasks(newTasks);
      setLastSaved(new Date().toLocaleTimeString());
    }
  };

  const handleLogin = (username: string) => {
    const normalized = username.toLowerCase().trim();
    setIsReady(false);
    setCurrentUser(normalized);
  };

  const handleLogout = () => {
    setIsReady(false);
    setCurrentUser(null);
  };

  const handleExport = () => {
    if (!currentUser) return;
    const data = {
      version: "1.9",
      username: currentUser,
      tasks: tasks,
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `eisenhower_${currentUser}_board.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (file: File) => {
    if (!currentUser) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const json = JSON.parse(content);
        
        let rawItems: any[] = [];
        if (Array.isArray(json)) rawItems = json;
        else if (json.tasks && Array.isArray(json.tasks)) rawItems = json.tasks;
        else rawItems = Object.values(json).find(val => Array.isArray(val)) as any[] || [];

        if (rawItems.length === 0) {
          setAlertConfig({ title: "Import Failed", message: "No valid tasks found in this file." });
          return;
        }

        const normalized: Task[] = rawItems.map(item => ({
          id: item.id || Math.random().toString(36).substr(2, 9),
          subject: (item.subject || item.text || item.title || "Untitled").toString(),
          quadrant: (Object.keys(QUADRANTS).includes(item.quadrant?.toUpperCase()) ? item.quadrant.toUpperCase() : "DO") as QuadrantType,
          createdAt: item.createdAt || Date.now()
        }));

        setConfirmConfig({
          title: "Import Data",
          message: `Ready to import ${normalized.length} tasks? This will overwrite your current board.`,
          confirmLabel: "Overwrite & Import",
          onConfirm: () => {
            // Explicitly persist before clearing state
            persistAndSetTasks(normalized);
            setConfirmConfig(null);
          }
        });
      } catch (err) {
        setAlertConfig({ title: "Import Error", message: "Invalid file format. Please use a valid board export JSON." });
      }
    };

    reader.onerror = () => {
      setAlertConfig({ title: "System Error", message: "Failed to read the file from your computer." });
    };

    reader.readAsText(file);
  };

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskSubject.trim() || !showAddFor || !currentUser) return;
    const newTask: Task = {
      id: Math.random().toString(36).substr(2, 9),
      subject: newTaskSubject.trim(),
      quadrant: showAddFor,
      createdAt: Date.now()
    };
    persistAndSetTasks([...tasks, newTask]);
    setNewTaskSubject('');
    setShowAddFor(null);
  };

  const deleteTask = (id: string) => {
    persistAndSetTasks(tasks.filter(t => t.id !== id));
  };

  const moveTask = (id: string, newQuadrant: QuadrantType) => {
    persistAndSetTasks(tasks.map(t => t.id === id ? { ...t, quadrant: newQuadrant } : t));
  };

  if (!currentUser) return <Auth onLogin={handleLogin} />;

  const renderQuadrant = (qType: QuadrantType) => {
    const q = QUADRANTS[qType];
    const qTasks = tasks.filter(t => t.quadrant === qType);
    const isHovered = dragOverQuadrant === qType;

    return (
      <div 
        key={qType} 
        onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
        onDragEnter={() => setDragOverQuadrant(qType)}
        onDragLeave={() => setDragOverQuadrant(null)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOverQuadrant(null);
          const taskId = e.dataTransfer.getData('taskId');
          if (taskId) moveTask(taskId, qType);
        }}
        className={`flex flex-col h-full rounded-2xl overflow-hidden border-2 transition-all duration-300 ${
          isHovered ? 'scale-[1.01] border-indigo-500 shadow-xl ring-4 ring-indigo-500/10' : 'border-transparent shadow-sm'
        } ${q.bg}`}
      >
        <div className={`px-5 py-4 flex items-center justify-between text-white ${q.color} ${isHovered ? 'brightness-110' : ''}`}>
          <div className="flex items-center gap-3 overflow-hidden">
            <h3 className="font-black text-2xl uppercase tracking-tighter leading-none shrink-0 drop-shadow-sm">{q.title}</h3>
            <div className="h-6 w-0.5 bg-white/30 shrink-0"></div>
            <span className="text-sm md:text-base font-black uppercase tracking-widest leading-none whitespace-nowrap overflow-hidden text-ellipsis drop-shadow-sm">
              {q.label}
            </span>
          </div>
          <button 
            onClick={() => setShowAddFor(qType)}
            className="p-2 bg-white/20 hover:bg-white/40 rounded-xl transition-all shrink-0 shadow-lg active:scale-90"
          >
            <Plus size={24} strokeWidth={3} />
          </button>
        </div>
        
        <div className="flex-1 p-4 md:p-6 overflow-y-auto custom-scrollbar bg-white/30 backdrop-blur-sm">
          <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-8 justify-items-center">
            {qTasks.map(task => (
              <PostIt key={task.id} task={task} onDelete={deleteTask} onMove={moveTask} />
            ))}
            {qTasks.length === 0 && !isHovered && (
              <div className="col-span-full py-16 flex flex-col items-center justify-center opacity-20 pointer-events-none text-current">
                 <div className="w-16 h-16 border-4 border-dashed border-current rounded-3xl mb-4 flex items-center justify-center text-4xl font-bold">+</div>
                 <p className="text-xs font-black uppercase tracking-[0.3em]">Add Note</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen flex flex-col bg-[#f8fafc]">
      <Header username={currentUser} onLogout={handleLogout} onExport={handleExport} onImport={handleImport} lastSaved={lastSaved} />
      
      <main className="flex-1 flex flex-col px-4 py-4 md:px-6 md:py-6 overflow-hidden">
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 grid-rows-[repeat(4,minmax(320px,1fr))] md:grid-rows-2 gap-4 md:gap-6 h-full">
          {renderQuadrant('DO')}
          {renderQuadrant('DECIDE')}
          {renderQuadrant('DELEGATE')}
          {renderQuadrant('DELETE')}
        </div>
      </main>

      {showAddFor && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden border border-white animate-in zoom-in-95 duration-200">
            <div className={`p-8 ${QUADRANTS[showAddFor].color} text-white shadow-inner`}>
              <h3 className="text-2xl font-black uppercase tracking-tight">New {QUADRANTS[showAddFor].title} Note</h3>
              <p className="text-xs font-bold opacity-80 mt-1 uppercase tracking-widest">{QUADRANTS[showAddFor].label}</p>
            </div>
            <form onSubmit={addTask} className="p-8 bg-white">
              <textarea
                value={newTaskSubject}
                onChange={(e) => setNewTaskSubject(e.target.value)}
                className="w-full px-5 py-4 rounded-2xl border-2 border-slate-100 bg-slate-50 text-slate-900 focus:border-indigo-500 outline-none transition-all h-40 mb-6 font-bold text-lg"
                placeholder="What needs to be done?"
                autoFocus
                required
              />
              <div className="flex gap-4">
                <button type="button" onClick={() => setShowAddFor(null)} className="flex-1 px-6 py-4 font-black text-slate-400 bg-slate-50 rounded-2xl uppercase tracking-widest text-xs hover:bg-slate-100 transition-colors">Cancel</button>
                <button type="submit" className={`flex-1 px-6 py-4 font-black text-white rounded-2xl uppercase tracking-widest text-xs shadow-lg ${QUADRANTS[showAddFor].color}`}>Post Note</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmConfig && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 bg-indigo-600 text-white flex items-center gap-4">
              <HelpCircle size={32} />
              <h3 className="text-xl font-black uppercase tracking-tight">{confirmConfig.title}</h3>
            </div>
            <div className="p-8">
              <p className="text-slate-600 font-bold mb-8 leading-relaxed">{confirmConfig.message}</p>
              <div className="flex gap-4">
                <button onClick={() => setConfirmConfig(null)} className="flex-1 px-6 py-4 font-black text-slate-400 bg-slate-100 rounded-2xl uppercase tracking-widest text-xs">Cancel</button>
                <button onClick={confirmConfig.onConfirm} className="flex-1 px-6 py-4 font-black text-white bg-indigo-600 rounded-2xl uppercase tracking-widest text-xs">Confirm</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {alertConfig && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in duration-200">
            <div className="p-8 bg-rose-500 text-white flex items-center gap-4">
              <AlertCircle size={32} />
              <h3 className="text-xl font-black uppercase tracking-tight">{alertConfig.title}</h3>
            </div>
            <div className="p-8">
              <p className="text-slate-600 font-bold mb-8 leading-relaxed">{alertConfig.message}</p>
              <button onClick={() => setAlertConfig(null)} className="w-full px-6 py-4 font-black text-white bg-slate-800 rounded-2xl uppercase tracking-widest text-xs">Dismiss</button>
            </div>
          </div>
        </div>
      )}

      <footer className="px-6 py-2.5 text-center text-gray-400 text-[9px] font-black uppercase tracking-[0.3em] bg-white border-t">
        &copy; {new Date().getFullYear()} Eisenhower Board • Workspace: {currentUser}
      </footer>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 20px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        @keyframes zoomIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .animate-in { animation: zoomIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>
    </div>
  );
};

export default App;
