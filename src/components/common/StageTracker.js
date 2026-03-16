import React from 'react';
import { Check } from 'lucide-react';

const stages = [
  { id: 'imported', label: 'Imported' },
  { id: 'assessment', label: 'Assessment' },
  { id: 'interview', label: 'Interview' },
  { id: 'medical', label: 'Medical' },
  { id: 'ctv', label: 'CTV Assigned' },
  { id: 'onboarded', label: 'Onboarded' },
];

const StageTracker = ({ currentStage }) => {
  // Map internal status to high-level stages if needed
  const getActiveIndex = (status) => {
    const s = status?.toLowerCase() || '';
    if (s.includes('onboarded') || s === 'joined') return 5;
    if (s.includes('ctv')) return 4;
    if (s.includes('medical')) return 3;
    if (s.includes('interview')) return 2;
    if (s.includes('assessment') || s.includes('test')) return 1;
    return 0; // default to imported
  };

  const activeIndex = getActiveIndex(currentStage);

  return (
    <div className='w-full py-6 px-4'>
      <div className='relative flex items-center justify-between'>
        {/* Connection Line */}
        <div className='absolute left-0 top-1/2 h-0.5 w-full -translate-y-1/2 bg-gray-200' />
        <div 
          className='absolute left-0 top-1/2 h-1 -translate-y-1/2 bg-indigo-600 transition-all duration-500' 
          style={{ width: `${(activeIndex / (stages.length - 1)) * 100}%` }}
        />

        {/* Stage Nodes */}
        {stages.map((stage, index) => {
          const isCompleted = index < activeIndex;
          const isActive = index === activeIndex;

          return (
            <div key={stage.id} className='relative z-10 flex flex-col items-center'>
              <div 
                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                  isCompleted 
                    ? 'bg-indigo-600 border-indigo-600' 
                    : isActive 
                      ? 'bg-white border-indigo-600 shadow-[0_0_0_4px_rgba(79,70,229,0.1)]' 
                      : 'bg-white border-gray-300'
                }`}
              >
                {isCompleted ? (
                  <Check className='h-5 w-5 text-white' />
                ) : (
                  <span className={`text-sm font-bold ${isActive ? 'text-indigo-600' : 'text-gray-400'}`}>
                    {index + 1}
                  </span>
                )}
              </div>
              <span 
                className={`absolute top-12 whitespace-nowrap text-xs font-semibold uppercase tracking-wider ${
                  isActive ? 'text-indigo-600' : 'text-gray-500'
                }`}
              >
                {stage.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StageTracker;
