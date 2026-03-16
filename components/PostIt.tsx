
import React, { useMemo, useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Task, QuadrantType } from '../types';
import { Trash2, ArrowRightLeft } from 'lucide-react';

interface PostItProps {
  task: Task;
  onDelete: (id: string) => void;
  onMove: (id: string, newQuadrant: QuadrantType) => void;
  onEdit: (id: string, newSubject: string) => void;
  onReorder: (draggedId: string, targetId: string) => void;
}

const PostIt: React.FC<PostItProps> = ({ task, onDelete, onMove, onEdit, onReorder }) => {
  const [showMove, setShowMove] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingInPortal, setIsEditingInPortal] = useState(false);
  const [editedSubject, setEditedSubject] = useState(task.subject);
  const [hoverRect, setHoverRect] = useState<DOMRect | null>(null);
  const noteRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const portalTextareaRef = useRef<HTMLTextAreaElement>(null);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const quadrants: QuadrantType[] = ['DO', 'DECIDE', 'DELEGATE', 'DELETE'];

  const rotation = useMemo(() => {
    const hash = task.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return (hash % 6) - 3;
  }, [task.id]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(task.subject.length, task.subject.length);
    }
  }, [isEditing, task.subject.length]);

  useEffect(() => {
    if (isEditingInPortal && portalTextareaRef.current) {
      portalTextareaRef.current.focus();
      portalTextareaRef.current.setSelectionRange(editedSubject.length, editedSubject.length);
    }
  }, [isEditingInPortal]);

  const scheduleHide = () => {
    hideTimeoutRef.current = setTimeout(() => {
      setIsHovered(false);
      setIsEditingInPortal(false);
      setHoverRect(null);
    }, 80);
  };

  const cancelHide = () => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  };

  const handleDragStart = (e: React.DragEvent) => {
    if (isEditing) { e.preventDefault(); return; }
    e.dataTransfer.setData('taskId', task.id);
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => setIsDragging(true), 0);
  };

  const handleDragEnd = () => setIsDragging(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragOverLeave = () => setIsDragOver(false);

  const handleDropOnNote = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const draggedId = e.dataTransfer.getData('taskId');
    if (draggedId && draggedId !== task.id) onReorder(draggedId, task.id);
  };

  const handleMouseEnter = () => {
    if (!isEditing) {
      cancelHide();
      if (noteRef.current) {
        setHoverRect(noteRef.current.getBoundingClientRect());
        setIsHovered(true);
      }
    }
  };

  const handleMouseLeave = () => scheduleHide();

  const handleSaveEdit = () => {
    const trimmed = editedSubject.trim();
    if (trimmed && trimmed !== task.subject) onEdit(task.id, trimmed);
    else setEditedSubject(task.subject);
    setIsEditing(false);
  };

  const handleSavePortalEdit = () => {
    const trimmed = editedSubject.trim();
    if (trimmed && trimmed !== task.subject) onEdit(task.id, trimmed);
    else setEditedSubject(task.subject);
    setIsEditingInPortal(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSaveEdit(); }
    else if (e.key === 'Escape') { setEditedSubject(task.subject); setIsEditing(false); }
  };

  const handlePortalKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSavePortalEdit(); }
    else if (e.key === 'Escape') { setEditedSubject(task.subject); setIsEditingInPortal(false); }
  };

  const renderPortal = () => {
    if (!isHovered || !hoverRect) return null;
    const scale = 3;
    const w = hoverRect.width * scale;
    const h = hoverRect.height * scale;
    const cx = hoverRect.left + hoverRect.width / 2;
    const cy = hoverRect.top + hoverRect.height / 2;
    const margin = 8;
    const left = Math.max(margin, Math.min(cx - w / 2, window.innerWidth - w - margin));
    const top = Math.max(margin, Math.min(cy - h / 2, window.innerHeight - h - margin));

    return createPortal(
      <div
        onMouseEnter={cancelHide}
        onMouseLeave={scheduleHide}
        style={{
          position: 'fixed', top, left, width: w, height: h,
          zIndex: 9999,
          backgroundColor: '#fff9c4',
          boxShadow: '4px 4px 24px rgba(0,0,0,0.25)',
          borderBottom: '2px solid #f0e68c',
          borderRight: '2px solid #f0e68c',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '2px',
          cursor: isEditingInPortal ? 'default' : 'text',
        }}
        onClick={() => { if (!isEditingInPortal) setIsEditingInPortal(true); }}
      >
        {isEditingInPortal ? (
          <>
            <textarea
              ref={portalTextareaRef}
              value={editedSubject}
              onChange={(e) => setEditedSubject(e.target.value)}
              onBlur={handleSavePortalEdit}
              onKeyDown={handlePortalKeyDown}
              style={{
                flex: 1, width: '100%', background: 'transparent',
                border: 'none', outline: 'none', resize: 'none',
                fontSize: '18px', fontWeight: 700, color: '#1f2937',
                lineHeight: 1.4, fontFamily: 'Inter, sans-serif',
              }}
            />
            <div style={{
              fontSize: '11px', fontWeight: 900, color: '#6366f1',
              textTransform: 'uppercase', letterSpacing: '0.05em',
              display: 'flex', justifyContent: 'space-between', marginTop: '8px',
            }}>
              <span>Enter: gem</span><span>Esc: annuller</span>
            </div>
          </>
        ) : (
          <p style={{
            flex: 1, fontSize: '18px', fontWeight: 700, color: '#1f2937',
            lineHeight: 1.4, wordBreak: 'break-word', margin: 0,
            fontFamily: 'Inter, sans-serif',
          }}>
            {task.subject}
          </p>
        )}
      </div>,
      document.body
    );
  };

  return (
    <>
      <div
        ref={noteRef}
        draggable={!isEditing}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        onDragLeave={handleDragOverLeave}
        onDrop={handleDropOnNote}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          transform: isEditing
            ? 'rotate(0deg) scale(1.05)'
            : isDragging
            ? 'rotate(0deg) scale(0.9)'
            : `rotate(${rotation}deg)`,
          transition: 'transform 0.2s ease',
        }}
        className={`group relative bg-[#fff9c4] p-2 sm:p-4 md:p-2.5 lg:p-5 w-full max-w-[90px] sm:max-w-[140px] md:max-w-[100px] lg:max-w-[180px] aspect-square post-it-shadow border-b-[1px] md:border-b-2 border-r-[1px] md:border-r-2 border-[#f0e68c] flex flex-col ${
          isDragOver ? 'border-l-4 border-l-indigo-500' : ''
        } ${isEditing ? 'z-[60] shadow-2xl cursor-default' : 'cursor-grab'} ${isDragging ? 'opacity-40' : ''}`}
      >
        {!isEditing && (
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 w-4 sm:w-8 h-1.5 sm:h-3 bg-white/30 backdrop-blur-sm rounded-sm opacity-0 group-hover:opacity-100 transition-opacity"></div>
        )}

        <div className="flex-1 overflow-hidden">
          {isEditing ? (
            <div className="w-full h-full flex flex-col">
              <textarea
                ref={textareaRef}
                value={editedSubject}
                onChange={(e) => setEditedSubject(e.target.value)}
                onBlur={handleSaveEdit}
                onKeyDown={handleKeyDown}
                className="flex-1 w-full bg-transparent border-none outline-none resize-none font-bold text-[8px] sm:text-xs md:text-[9px] lg:text-sm text-gray-800 leading-tight sm:leading-snug font-inter custom-scrollbar"
                placeholder="Task..."
              />
              <div className="mt-0.5 flex justify-between items-center text-[6px] sm:text-[8px] font-black uppercase tracking-tighter text-indigo-600/50 shrink-0">
                <span>Save: Enter</span>
                <span className="hidden sm:inline">Esc: Cancel</span>
              </div>
            </div>
          ) : (
            <p
              onClick={() => setIsEditing(true)}
              className="text-[8px] sm:text-xs md:text-[9px] lg:text-sm font-bold text-gray-800 leading-tight sm:leading-snug break-words font-inter cursor-text select-none"
              title="Click to edit"
            >
              {task.subject}
            </p>
          )}
        </div>

        {!isEditing && (
          <div className="flex justify-between items-center mt-1 sm:mt-2 lg:mt-3 pt-0.5 sm:pt-2 border-t border-yellow-200/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); setShowMove(!showMove); }}
              className="p-0.5 sm:p-1.5 md:p-1 lg:p-2 hover:bg-yellow-200 rounded text-gray-400 hover:text-indigo-600 transition-colors"
              title="Move"
            >
              <ArrowRightLeft size={10} className="sm:w-3.5 sm:h-3.5 md:w-2.5 md:h-2.5 lg:w-4 lg:h-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
              className="p-0.5 sm:p-1.5 md:p-1 lg:p-2 hover:bg-yellow-200 rounded text-gray-400 hover:text-rose-600 transition-colors"
              title="Delete"
            >
              <Trash2 size={10} className="sm:w-3.5 sm:h-3.5 md:w-2.5 md:h-2.5 lg:w-4 lg:h-4" />
            </button>
          </div>
        )}

        {showMove && !isEditing && (
          <div className="absolute inset-0 bg-yellow-50/98 backdrop-blur-sm z-[60] p-1 flex flex-col items-center justify-center gap-0.5 rounded shadow-2xl border border-yellow-300 animate-in fade-in zoom-in-95 duration-150">
            <span className="text-[6px] sm:text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Move:</span>
            <div className="w-full flex flex-col gap-0.5">
              {quadrants.map(q => q !== task.quadrant && (
                <button
                  key={q}
                  onClick={() => { onMove(task.id, q); setShowMove(false); }}
                  className="w-full text-[6px] sm:text-[9px] py-0.5 sm:py-1 px-1 bg-white text-gray-900 hover:bg-indigo-600 hover:text-white rounded border border-yellow-200 font-black transition-all shadow-sm active:scale-95 truncate"
                >
                  {q}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowMove(false)}
              className="mt-0.5 text-[7px] font-black text-gray-400 hover:text-gray-600 uppercase tracking-tighter"
            >
              x
            </button>
          </div>
        )}
      </div>

      {renderPortal()}
    </>
  );
};

export default PostIt;
