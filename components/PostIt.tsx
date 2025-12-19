
import React from 'react';
import { Task, QuadrantType } from '../types';
import { Trash2, ArrowRightLeft } from 'lucide-react';

interface PostItProps {
  task: Task;
  onDelete: (id: string) => void;
  onMove: (id: string, newQuadrant: QuadrantType) => void;
}

const PostIt: React.FC<PostItProps> = ({ task, onDelete, onMove }) => {
  const [showMove, setShowMove] = React.useState(false);
  const [isDragging, setIsDragging] = React.useState(false);

  const quadrants: QuadrantType[] = ['DO', 'DECIDE', 'DELEGATE', 'DELETE'];

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('taskId', task.id);
    e.dataTransfer.effectAllowed = 'move';
    // Small delay to let the browser create the ghost image before we change opacity
    setTimeout(() => setIsDragging(true), 0);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  return (
    <div 
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={`group relative bg-[#fff9c4] p-5 w-[160px] h-[160px] transform rotate-1 transition-all post-it-shadow border-b-2 border-r-2 border-[#f0e68c] flex flex-col cursor-grab active:cursor-grabbing ${
        isDragging ? 'opacity-40 scale-95' : 'hover:rotate-0 hover:scale-110'
      }`}
    >
      <div className="flex-1 overflow-hidden pointer-events-none">
        <p className="text-sm font-bold text-gray-800 leading-snug break-words">
          {task.subject}
        </p>
      </div>
      
      <div className="flex justify-between items-center mt-3 pt-2 border-t border-yellow-200/50 opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
          onClick={() => setShowMove(!showMove)}
          className="p-1.5 hover:bg-yellow-200 rounded-lg text-gray-500 hover:text-indigo-600 transition-colors"
          title="Move Quadrant"
        >
          <ArrowRightLeft size={16} />
        </button>
        <button 
          onClick={() => onDelete(task.id)}
          className="p-1.5 hover:bg-yellow-200 rounded-lg text-gray-500 hover:text-rose-600 transition-colors"
          title="Delete Task"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {showMove && (
        <div className="absolute inset-0 bg-yellow-50 bg-opacity-98 z-20 p-2 flex flex-col items-center justify-center gap-1.5 rounded shadow-2xl border border-yellow-300">
          <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Move To:</span>
          <div className="w-full flex flex-col gap-1">
            {quadrants.map(q => q !== task.quadrant && (
              <button
                key={q}
                onClick={() => {
                  onMove(task.id, q);
                  setShowMove(false);
                }}
                className="w-full text-[10px] py-1.5 px-2 bg-white text-gray-900 hover:bg-indigo-600 hover:text-white rounded border border-yellow-200 font-black transition-all shadow-sm active:scale-95"
              >
                {q}
              </button>
            ))}
          </div>
          <button 
            onClick={() => setShowMove(false)}
            className="mt-2 text-[10px] font-black text-gray-400 hover:text-gray-600 uppercase tracking-tighter"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
};

export default PostIt;
