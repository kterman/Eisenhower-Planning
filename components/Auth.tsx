
import React, { useState } from 'react';

interface AuthProps {
  onLogin: (username: string) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim().length < 2) {
      setError('Username must be at least 2 characters');
      return;
    }
    onLogin(username.trim());
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6">
      <div className="max-w-md w-full">
        <div className="text-center mb-10">
          <div className="inline-block p-4 bg-indigo-600 rounded-2xl shadow-xl mb-4 transform hover:rotate-6 transition-transform">
             <div className="w-12 h-12 flex items-center justify-center text-white font-bold text-3xl">E</div>
          </div>
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Welcome Back</h1>
          <p className="text-gray-500">Sign in to organize your tasks efficiently</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
          <div className="mb-6">
            <label htmlFor="username" className="block text-sm font-bold text-gray-700 mb-2">
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
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
              placeholder="Enter your name..."
              autoFocus
            />
            {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
          </div>

          <button
            type="submit"
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 transition-all transform hover:-translate-y-0.5"
          >
            Start Organizing
          </button>
          
          <div className="mt-8 pt-8 border-t border-gray-100 text-center text-xs text-gray-400">
            Securely stored in your browser local storage.
          </div>
        </form>
      </div>
    </div>
  );
};

export default Auth;
