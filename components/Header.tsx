
import React, { useRef } from 'react';
import { LogOut, User, Download, Upload } from 'lucide-react';

interface HeaderProps {
  username: string;
  onLogout: () => void;
  onExport: () => void;
  onImport: (file: File) => void;
}

const Header: React.FC<HeaderProps> = ({ username, onLogout, onExport, onImport }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImport(file);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-50">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-md">
          E
        </div>
        <h1 className="text-xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent hidden sm:block">
          Eisenhower Matrix
        </h1>
      </div>
      
      <div className="flex items-center gap-2 sm:gap-4">
        <div className="flex items-center bg-gray-50 rounded-lg p-1 border border-gray-100">
          <button
            onClick={onExport}
            className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-white rounded-md transition-all flex items-center gap-2 text-xs font-bold uppercase tracking-tighter"
            title="Export Board Data"
          >
            <Download size={16} />
            <span className="hidden lg:inline">Export</span>
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-white rounded-md transition-all flex items-center gap-2 text-xs font-bold uppercase tracking-tighter"
            title="Import Board Data"
          >
            <Upload size={16} />
            <span className="hidden lg:inline">Import</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept=".json"
          />
        </div>

        <div className="h-6 w-px bg-gray-200 mx-1 hidden sm:block"></div>

        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-full border border-gray-200">
          <User size={14} className="text-gray-400" />
          <span className="text-xs font-bold text-gray-700">{username}</span>
        </div>
        
        <button
          onClick={onLogout}
          className="flex items-center gap-2 px-3 py-2 text-xs font-black text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all uppercase tracking-widest"
        >
          <LogOut size={16} />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
};

export default Header;
