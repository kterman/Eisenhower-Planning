
import React, { useState, useEffect, useRef } from 'react';
import { Task, QuadrantType, User } from './types';
import { storage } from './services/storage';
import { QUADRANTS } from './constants';
import Auth from './components/Auth';
import Header from './components/Header';
import PostIt from './components/PostIt';
import { Plus, ShieldCheck } from 'lucide-react';

const App: React.FC = () => {
  // 1. Initialize user from LS immediately
  const [currentUser, setCurrentUser] = useState<string | null>(() => {
    return localStorage.getItem('eisenhower_current_user');
  });

  // 2. Initialize tasks from LS immediately for the current session
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
  
  // Refs to manage the sync lifecycle
  const lastLoadedUser = useRef<string | null>(currentUser);
  const isTransitioning = useRef<boolean>(false);

  // 3. Centralized Effect for Loading and Saving
  useEffect(() => {
    // Phase A: Handle User Switch (Login/Logout)
    if (currentUser !== lastLoadedUser.current) {
      isTransitioning.current = true; // Block saving during the state update
      
      if (currentUser) {
        const data = storage.getUser(currentUser);
        const userTasks = data ? data.tasks : [];
        setTasks(userTasks);
        localStorage.setItem('eisenhower_current_user', currentUser);
      } else {
        setTasks([]);
        localStorage.removeItem('eisenhower_current_user');
      }
      
      lastLoadedUser.current = currentUser;
      setLastSaved(new Date().toLocaleTimeString());
      
      // We don't reset isTransitioning here because we need to wait for the next render
      // where 'tasks' actually reflects the new user's data.
      return;
    } 

    // Phase B: Handle Normal Task Updates
    if (currentUser && !isTransitioning.current) {
      storage.updateTasks(currentUser, tasks);
      setLastSaved(new Date().toLocaleTimeString());
    }
    
    // Reset the transition flag after the render cycle where tasks were loaded
    if (isTransitioning.current) {
      isTransitioning.current = false;
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
      version: "1.0",
      username: currentUser,
      tasks: tasks,
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `eisenhower_${currentUser}_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (file: File) => {
    if (!currentUser) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        if (json.tasks && Array.isArray(json.tasks)) {
          if (confirm('Replace your board with this file?')) {
            setTasks(json.tasks);
          }
        }
      } catch (err) {
        alert('Error parsing the file.');
      }
    };
    reader.readAsText(file);
  };

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskSubject.trim() || !showAddFor || !currentUser) return;

    const newTask: Task = {
      id: crypto.randomUUID(),
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

  if (!currentUser) {
    return <Auth onLogin={handleLogin} />;
  }

  const renderQuadrant = (qType: QuadrantType) => {
    const q = QUADRANTS[qType];
    const qTasks = tasks.filter(t => t.quadrant === qType);

    return (
      <div key={qType} className={`flex flex-col h-full rounded-2xl overflow-hidden border border-gray-200 shadow-sm ${q.bg}`}>
        <div className={`px-5 py-3 flex items-center justify-between text-white ${q.color}`}>
          <div>
            <h3 className="font-black text-base uppercase tracking-widest">{q.title}</h3>
            <p className="text-[10px] opacity-90 font-bold uppercase">{q.label}</p>
          </div>
          <button 
            onClick={() => setShowAddFor(qType)}
            className="p-2 bg-white bg-opacity-20 hover:bg-opacity-40 rounded-xl transition-all"
          >
            <Plus size={20} strokeWidth={3} />
          </button>
        </div>
        
        <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-6 justify-items-center">
            {qTasks.map(task => (
              <PostIt 
                key={task.id} 
                task={task} 
                onDelete={deleteTask} 
                onMove={moveTask} 
              />
            ))}
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
      />
      
      <main className="flex-1 flex flex-col px-6 py-6 overflow-hidden">
        <div className="mb-4 flex flex-col sm:flex-row justify-between items-center gap-4 bg-white px-6 py-3 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
             <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
                <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">User: {currentUser}</span>
             </div>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-emerald-600 font-black uppercase tracking-widest">
            <ShieldCheck size={12} />
            Securely Synced at {lastSaved}
          </div>
        </div>

        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 grid-rows-[repeat(4,minmax(300px,1fr))] md:grid-rows-2 gap-6 h-full">
          {renderQuadrant('DO')}
          {renderQuadrant('DECIDE')}
          {renderQuadrant('DELEGATE')}
          {renderQuadrant('DELETE')}
        </div>
      </main>

      {showAddFor && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden border border-white">
            <div className={`p-8 ${QUADRANTS[showAddFor].color} text-white shadow-inner`}>
              <h3 className="text-2xl font-black uppercase">New {QUADRANTS[showAddFor].title} Note</h3>
            </div>
            <form onSubmit={addTask} className="p-8 bg-white">
              <textarea
                value={newTaskSubject}
                onChange={(e) => setNewTaskSubject(e.target.value)}
                className="w-full px-5 py-4 rounded-2xl border-2 border-slate-100 bg-white text-slate-900 focus:border-indigo-500 outline-none transition-all h-40 mb-6 font-bold text-lg"
                placeholder="Task description..."
                autoFocus
                required
                style={{ colorScheme: 'light' }}
              />
              <div className="flex gap-4">
                <button type="button" onClick={() => setShowAddFor(null)} className="flex-1 px-6 py-4 font-black text-slate-400 bg-slate-50 rounded-2xl uppercase tracking-widest text-xs">Cancel</button>
                <button type="submit" className={`flex-1 px-6 py-4 font-black text-white rounded-2xl uppercase tracking-widest text-xs ${QUADRANTS[showAddFor].color}`}>Post Note</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <footer className="px-6 py-3 text-center text-gray-400 text-[10px] font-black uppercase tracking-[0.3em] bg-white border-t">
        &copy; {new Date().getFullYear()} Eisenhower Board
      </footer>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 20px; }
      `}</style>
    </div>
  );
};

export default App;
