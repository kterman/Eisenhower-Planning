
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

  const [tasks, setTasks] = useState<Task[]>(() => {
    const savedUser = localStorage.getItem('eisenhower_current_user');
    if (savedUser) {
      const data = storage.getUser(savedUser);
      return data ? data.tasks : [];
    }
    return [];
  });

  const [newTaskSubject, setNewTaskSubject] = useState('');
  const [showAddFor, setShowAddFor] = useState<QuadrantType | null>(null);
  const [lastSaved, setLastSaved] = useState<string>(new Date().toLocaleTimeString());
  const [dragOverQuadrant, setDragOverQuadrant] = useState<QuadrantType | null>(null);
  
  // Custom Modal States
  const [alertConfig, setAlertConfig] = useState<{ message: string; title?: string } | null>(null);
  const [confirmConfig, setConfirmConfig] = useState<{ 
    message: string; 
    title?: string; 
    onConfirm: () => void;
    confirmLabel?: string;
  } | null>(null);

  const lastLoadedUser = useRef<string | null>(currentUser);
  const isInitialLoad = useRef<boolean>(true);

  // Sync state with storage
  useEffect(() => {
    if (currentUser !== lastLoadedUser.current) {
      const data = currentUser ? storage.getUser(currentUser) : null;
      const userTasks = data ? data.tasks : [];
      
      setTasks(userTasks);
      lastLoadedUser.current = currentUser;
      isInitialLoad.current = true;
      
      if (currentUser) {
        localStorage.setItem('eisenhower_current_user', currentUser);
      } else {
        localStorage.removeItem('eisenhower_current_user');
      }
      setLastSaved(new Date().toLocaleTimeString());
      return;
    }

    if (currentUser) {
      if (isInitialLoad.current) {
        isInitialLoad.current = false;
      } else {
        storage.updateTasks(currentUser, tasks);
        setLastSaved(new Date().toLocaleTimeString());
      }
    }
  }, [tasks, currentUser]);

  const handleLogin = (username: string) => {
    const normalized = username.toLowerCase().trim();
    setCurrentUser(normalized);
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  const handleExport = () => {
    if (!currentUser) return;
    const data = {
      version: "1.4",
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
        if (Array.isArray(json)) {
          rawItems = json;
        } else if (json.tasks && Array.isArray(json.tasks)) {
          rawItems = json.tasks;
        } else if (json.data && Array.isArray(json.data)) {
          rawItems = json.data;
        } else {
          const arrayProp = Object.values(json).find(val => Array.isArray(val));
          if (arrayProp) rawItems = arrayProp as any[];
        }

        if (rawItems.length === 0) {
          setAlertConfig({ title: "Import Failed", message: "Could not find any tasks in this file." });
          return;
        }

        const normalized: Task[] = rawItems.map(item => {
          const subject = item.subject || item.text || item.title || item.content || item.desc || item.note || "Untitled Task";
          let q = (item.quadrant || item.category || item.type || item.group || "DO").toString().toUpperCase();
          if (q === "URGENT") q = "DO";
          if (q === "LATER") q = "DECIDE";
          const finalQuadrant = Object.keys(QUADRANTS).includes(q) ? q : "DO";

          return {
            id: item.id || Math.random().toString(36).substr(2, 9),
            subject: subject.toString(),
            quadrant: finalQuadrant as QuadrantType,
            createdAt: item.createdAt || Date.now()
          };
        });

        setConfirmConfig({
          title: "Import Data",
          message: `Ready to import ${normalized.length} tasks? This will replace your current board for ${currentUser}.`,
          confirmLabel: "Replace Board",
          onConfirm: () => {
            setTasks([...normalized]);
            setLastSaved(new Date().toLocaleTimeString() + " (Imported)");
            setConfirmConfig(null);
          }
        });
        
      } catch (err) {
        setAlertConfig({ title: "Import Error", message: "Failed to parse the file. Please ensure it's a valid JSON file." });
      }
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

    setTasks(prev => [...prev, newTask]);
    setNewTaskSubject('');
    setShowAddFor(null);
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const moveTask = (id: string, newQuadrant: QuadrantType) => {
    setTasks(prev => prev.map(t => 
      t.id === id ? { ...t, quadrant: newQuadrant } : t
    ));
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const onDragEnter = (qType: QuadrantType) => {
    setDragOverQuadrant(qType);
  };

  const onDragLeave = () => {
    setDragOverQuadrant(null);
  };

  const onDrop = (e: React.DragEvent, qType: QuadrantType) => {
    e.preventDefault();
    setDragOverQuadrant(null);
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) {
      moveTask(taskId, qType);
    }
  };

  if (!currentUser) {
    return <Auth onLogin={handleLogin} />;
  }

  const renderQuadrant = (qType: QuadrantType) => {
    const q = QUADRANTS[qType];
    const qTasks = tasks.filter(t => t.quadrant === qType);
    const isHovered = dragOverQuadrant === qType;

    return (
      <div 
        key={qType} 
        onDragOver={onDragOver}
        onDragEnter={() => onDragEnter(qType)}
        onDragLeave={onDragLeave}
        onDrop={(e) => onDrop(e, qType)}
        className={`flex flex-col h-full rounded-2xl overflow-hidden border-2 transition-all duration-200 ${
          isHovered 
            ? 'scale-[1.01] border-indigo-500 shadow-xl ring-4 ring-indigo-500/10' 
            : 'border-transparent shadow-sm'
        } ${q.bg}`}
      >
        <div className={`px-5 py-2.5 flex items-center justify-between text-white ${q.color} ${isHovered ? 'brightness-110' : ''}`}>
          <div>
            <h3 className="font-black text-sm uppercase tracking-widest">{q.title}</h3>
            <p className="text-[9px] opacity-90 font-bold uppercase tracking-tight">{q.label}</p>
          </div>
          <button 
            onClick={() => setShowAddFor(qType)}
            className="p-1.5 bg-white bg-opacity-20 hover:bg-opacity-40 rounded-lg transition-all"
          >
            <Plus size={18} strokeWidth={3} />
          </button>
        </div>
        
        <div className="flex-1 p-4 md:p-6 overflow-y-auto custom-scrollbar bg-white/30 backdrop-blur-sm">
          <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-6 justify-items-center">
            {qTasks.map(task => (
              <PostIt 
                key={task.id} 
                task={task} 
                onDelete={deleteTask} 
                onMove={moveTask} 
              />
            ))}
            {qTasks.length === 0 && !isHovered && (
              <div className="col-span-full py-12 flex flex-col items-center justify-center opacity-20 pointer-events-none">
                 <div className="w-12 h-12 border-2 border-dashed border-current rounded-full mb-2 flex items-center justify-center text-2xl font-bold">+</div>
                 <p className="text-[10px] font-black uppercase tracking-[0.2em]">Add Task</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen flex flex-col bg-[#f8fafc]">
      <Header 
        username={currentUser} 
        onLogout={handleLogout} 
        onExport={handleExport}
        onImport={handleImport}
        lastSaved={lastSaved}
      />
      
      <main className="flex-1 flex flex-col px-4 py-4 md:px-6 md:py-6 overflow-hidden">
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 grid-rows-[repeat(4,minmax(300px,1fr))] md:grid-rows-2 gap-4 md:gap-6 h-full">
          {renderQuadrant('DO')}
          {renderQuadrant('DECIDE')}
          {renderQuadrant('DELEGATE')}
          {renderQuadrant('DELETE')}
        </div>
      </main>

      {/* New Task Overlay */}
      {showAddFor && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden border border-white">
            <div className={`p-8 ${QUADRANTS[showAddFor].color} text-white shadow-inner`}>
              <h3 className="text-2xl font-black uppercase tracking-tight">New {QUADRANTS[showAddFor].title} Note</h3>
            </div>
            <form onSubmit={addTask} className="p-8 bg-white">
              <textarea
                value={newTaskSubject}
                onChange={(e) => setNewTaskSubject(e.target.value)}
                className="w-full px-5 py-4 rounded-2xl border-2 border-slate-100 bg-slate-50 text-slate-900 focus:border-indigo-500 outline-none transition-all h-40 mb-6 font-bold text-lg"
                placeholder="Write your task..."
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

      {/* Custom Confirmation Modal */}
      {confirmConfig && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden border border-white animate-in zoom-in-95 duration-200">
            <div className="p-8 bg-indigo-600 text-white flex items-center gap-4">
              <HelpCircle size={32} />
              <h3 className="text-xl font-black uppercase tracking-tight">{confirmConfig.title || "Confirm Action"}</h3>
            </div>
            <div className="p-8">
              <p className="text-slate-600 font-bold mb-8 leading-relaxed">{confirmConfig.message}</p>
              <div className="flex gap-4">
                <button 
                  onClick={() => setConfirmConfig(null)} 
                  className="flex-1 px-6 py-4 font-black text-slate-400 bg-slate-100 rounded-2xl uppercase tracking-widest text-xs hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmConfig.onConfirm} 
                  className="flex-1 px-6 py-4 font-black text-white bg-indigo-600 rounded-2xl uppercase tracking-widest text-xs shadow-lg shadow-indigo-100"
                >
                  {confirmConfig.confirmLabel || "Confirm"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Alert Modal */}
      {alertConfig && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden border border-white animate-in fade-in duration-200">
            <div className="p-8 bg-rose-500 text-white flex items-center gap-4">
              <AlertCircle size={32} />
              <h3 className="text-xl font-black uppercase tracking-tight">{alertConfig.title || "Attention"}</h3>
            </div>
            <div className="p-8">
              <p className="text-slate-600 font-bold mb-8 leading-relaxed">{alertConfig.message}</p>
              <button 
                onClick={() => setAlertConfig(null)} 
                className="w-full px-6 py-4 font-black text-white bg-slate-800 rounded-2xl uppercase tracking-widest text-xs"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="px-6 py-2.5 text-center text-gray-400 text-[9px] font-black uppercase tracking-[0.3em] bg-white border-t">
        &copy; {new Date().getFullYear()} Eisenhower Board • {currentUser} Workspace
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
