
import React, { useRef } from 'react';
import { LogOut, User, Download, Upload, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  username: string;
  onLogout: () => void;
  onExport: () => void;
  onImport: (file: File) => void;
  lastSaved: string;
}

const Header: React.FC<HeaderProps> = ({ username, onLogout, onExport, onImport, lastSaved }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImport(file);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 px-3 sm:px-6 py-2 sm:py-3 flex justify-between items-center sticky top-0 z-50 shadow-sm">
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-base sm:text-xl shadow-md shrink-0">
            E
          </div>
          <div className="flex flex-col">
            <h1 className="text-sm sm:text-lg lg:text-xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent leading-none">
              Eisenhower Matrix
            </h1>
            <div className="flex items-center gap-2 mt-0.5 sm:mt-1">
               <span className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest truncate max-w-[100px] sm:max-w-none">User: {username}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-1.5 sm:gap-4">
        <div className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 bg-emerald-50 rounded-full border border-emerald-100 text-emerald-600 shrink-0">
          <ShieldCheck size={12} strokeWidth={3} />
          <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest whitespace-nowrap">Synced: {lastSaved}</span>
        </div>

        <div className="h-6 w-px bg-gray-200 mx-1 hidden md:block"></div>

        <div className="flex items-center bg-gray-50 rounded-lg p-0.5 sm:p-1 border border-gray-100">
          <button
            onClick={onExport}
            className="p-1.5 sm:p-2 text-gray-500 hover:text-indigo-600 hover:bg-white rounded-md transition-all flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-bold uppercase tracking-tighter"
            title="Export Board Data"
          >
            <Download size={14} className="sm:w-4 sm:h-4" />
            <span className="hidden lg:inline">Export</span>
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-1.5 sm:p-2 text-gray-500 hover:text-indigo-600 hover:bg-white rounded-md transition-all flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-bold uppercase tracking-tighter"
            title="Import Board Data"
          >
            <Upload size={14} className="sm:w-4 sm:h-4" />
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

        <button
          onClick={onLogout}
          className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-2 text-[10px] sm:text-xs font-black text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all uppercase tracking-widest"
        >
          <LogOut size={14} className="sm:w-4 sm:h-4" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
};

export default Header;
