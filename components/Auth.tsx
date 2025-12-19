
import React, { useState } from 'react';

interface AuthProps {
  onLogin: (username: string) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = username.trim().toLowerCase();
    if (normalized.length < 2) {
      setError('Username must be at least 2 characters');
      return;
    }
    onLogin(normalized);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-6">
      <div className="max-w-md w-full">
        <div className="text-center mb-10">
          <div className="inline-block p-4 bg-indigo-600 rounded-2xl shadow-xl mb-4 transform hover:rotate-6 transition-transform">
             <div className="w-12 h-12 flex items-center justify-center text-white font-bold text-3xl">E</div>
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 mb-2 font-inter tracking-tighter">Welcome Back</h1>
          <p className="text-slate-500 font-medium">Sign in to organize your tasks efficiently</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-[2rem] shadow-2xl p-10 border border-white">
          <div className="mb-8">
            <label htmlFor="username" className="block text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-3">
              Username
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setError('');
              }}
              className="w-full px-6 py-5 rounded-2xl border-2 border-slate-100 bg-white text-slate-900 focus:border-indigo-500 transition-all outline-none font-black text-lg shadow-sm placeholder-slate-300"
              placeholder="e.g. Klaus"
              autoFocus
              style={{ colorScheme: 'light' }}
            />
            {error && <p className="mt-3 text-sm text-rose-500 font-bold px-1">{error}</p>}
          </div>

          <button
            type="submit"
            className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-xl shadow-indigo-100 transition-all transform hover:scale-[1.02] active:scale-95 uppercase tracking-widest text-xs"
          >
            Start Organizing
          </button>
          
          <div className="mt-10 pt-8 border-t border-slate-50 text-center text-[10px] text-slate-400 font-black uppercase tracking-[0.3em]">
            Persistent Browser Storage Active
          </div>
        </form>
      </div>
    </div>
  );
};

export default Auth;
