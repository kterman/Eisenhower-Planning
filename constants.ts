
import { QuadrantType } from './types';

export const QUADRANTS: Record<QuadrantType, { 
  title: string; 
  label: string; 
  color: string; 
  bg: string;
  urgent: boolean;
  important: boolean;
}> = {
  DO: { 
    title: 'Do', 
    label: 'Urgent & Important', 
    color: 'bg-rose-500', 
    bg: 'bg-rose-50',
    urgent: true,
    important: true 
  },
  DECIDE: { 
    title: 'Decide', 
    label: 'Not Urgent & Important', 
    color: 'bg-amber-500', 
    bg: 'bg-amber-50',
    urgent: false,
    important: true 
  },
  DELEGATE: { 
    title: 'Delegate', 
    label: 'Urgent & Not Important', 
    color: 'bg-indigo-500', 
    bg: 'bg-indigo-50',
    urgent: true,
    important: false 
  },
  DELETE: { 
    title: 'Delete', 
    label: 'Not Urgent & Not Important', 
    color: 'bg-emerald-500', 
    bg: 'bg-emerald-50',
    urgent: false,
    important: false 
  },
};
