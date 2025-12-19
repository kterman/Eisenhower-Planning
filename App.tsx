
import React, { useState, useEffect } from 'react';
import { Task, QuadrantType, User } from './types';
import { storage } from './services/storage';
import { QUADRANTS } from './constants';
import Auth from './components/Auth';
import Header from './components/Header';
import PostIt from './components/PostIt';
import { Plus } from 'lucide-react';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<string | null>(() => {
    return localStorage.getItem('eisenhower_current_user');
  });
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskSubject, setNewTaskSubject] = useState('');
  const [showAddFor, setShowAddFor] = useState<QuadrantType | null>(null);

  useEffect(() => {
    if (currentUser) {
      const user = storage.getUser(currentUser);
      if (user) {
        setTasks(user.tasks);
      } else {
        const newUser: User = { username: currentUser, tasks: [] };
        storage.saveUser(newUser);
        setTasks([]);
      }
      localStorage.setItem('eisenhower_current_user', currentUser);
    } else {
      localStorage.removeItem('eisenhower_current_user');
    }
  }, [currentUser]);

  const handleLogin = (username: string) => {
    setCurrentUser(username);
  };

  const handleLogout = () => {
    setCurrentUser(null);
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

    const updatedTasks = [...tasks, newTask];
    setTasks(updatedTasks);
    storage.updateTasks(currentUser, updatedTasks);
    
    setNewTaskSubject('');
    setShowAddFor(null);
  };

  const deleteTask = (id: string) => {
    if (!currentUser) return;
    const updatedTasks = tasks.filter(t => t.id !== id);
    setTasks(updatedTasks);
    storage.updateTasks(currentUser, updatedTasks);
  };

  const moveTask = (id: string, newQuadrant: QuadrantType) => {
    if (!currentUser) return;
    const updatedTasks = tasks.map(t => 
      t.id === id ? { ...t, quadrant: newQuadrant } : t
    );
    setTasks(updatedTasks);
    storage.updateTasks(currentUser, updatedTasks);
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
            <h3 className="font-black text-base leading-tight uppercase tracking-widest">{q.title}</h3>
            <p className="text-[10px] opacity-90 font-bold uppercase tracking-tighter">{q.label}</p>
          </div>
          <button 
            onClick={() => setShowAddFor(qType)}
            className="p-2 bg-white bg-opacity-20 hover:bg-opacity-40 rounded-xl transition-all shadow-sm"
            title={`Add to ${q.title}`}
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
            {qTasks.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center h-full min-h-[200px] text-gray-300">
                <p className="text-sm font-bold uppercase tracking-widest opacity-40">Empty Quadrant</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen flex flex-col bg-[#f8fafc]">
      <Header username={currentUser} onLogout={handleLogout} />
      
      <main className="flex-1 flex flex-col px-6 py-6 overflow-hidden">
        {/* Board Meta Information */}
        <div className="mb-4 flex flex-col sm:flex-row justify-between items-center gap-4 bg-white px-6 py-3 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
             <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
                <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Workspace Board</span>
             </div>
          </div>
          <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">
            Prioritize by clicking the move icon on any note to shift its quadrant.
          </p>
        </div>

        {/* 2x2 Full-Height Matrix Grid */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 grid-rows-[repeat(4,minmax(300px,1fr))] md:grid-rows-2 gap-6 h-full">
          {renderQuadrant('DO')}
          {renderQuadrant('DECIDE')}
          {renderQuadrant('DELEGATE')}
          {renderQuadrant('DELETE')}
        </div>
      </main>

      {/* Add Task Modal */}
      {showAddFor && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg transform animate-in fade-in zoom-in duration-200 overflow-hidden border border-white/20">
            <div className={`p-8 ${QUADRANTS[showAddFor].color} text-white shadow-inner`}>
              <h3 className="text-2xl font-black tracking-tighter uppercase">New {QUADRANTS[showAddFor].title} Note</h3>
              <p className="text-sm font-bold opacity-80 uppercase tracking-widest mt-1">{QUADRANTS[showAddFor].label}</p>
            </div>
            <form onSubmit={addTask} className="p-8 bg-white">
              <label className="block text-xs font-black text-gray-500 uppercase tracking-[0.2em] mb-3">Task Description</label>
              <textarea
                value={newTaskSubject}
                onChange={(e) => setNewTaskSubject(e.target.value)}
                className="w-full px-5 py-4 rounded-2xl border-2 border-gray-200 bg-gray-50 text-gray-900 focus:bg-white focus:border-indigo-500 focus:ring-0 outline-none transition-all resize-none h-40 mb-6 font-medium text-lg leading-relaxed placeholder-gray-400 shadow-inner"
                placeholder="What's the objective?"
                autoFocus
                required
              />
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setShowAddFor(null)}
                  className="flex-1 px-6 py-4 font-black text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-2xl transition-all uppercase tracking-widest text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`flex-1 px-6 py-4 font-black text-white rounded-2xl shadow-xl transition-all hover:scale-[1.03] hover:brightness-110 active:scale-95 uppercase tracking-widest text-xs ${QUADRANTS[showAddFor].color}`}
                >
                  Post Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <footer className="px-6 py-3 text-center text-gray-400 text-[10px] font-black uppercase tracking-[0.3em] border-t border-gray-100 bg-white">
        &copy; {new Date().getFullYear()} Eisenhower Board &bull; Precision Tasking
      </footer>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 20px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}</style>
    </div>
  );
};

export default App;
