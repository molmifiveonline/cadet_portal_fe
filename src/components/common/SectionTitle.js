import React from 'react';

const SectionTitle = ({ title, icon: Icon }) => (
  <div className='flex items-center justify-between mb-6 pb-2 border-b-2 border-indigo-50 relative mt-10 first:mt-0'>
    <div className='flex items-center gap-3'>
      <div className='p-2 bg-indigo-50 rounded-lg group-hover:bg-indigo-100 transition-colors'>
        <Icon size={20} className='text-indigo-600' />
      </div>
      <h3 className='text-xl font-extrabold text-gray-900 tracking-tight'>
        {title}
      </h3>
    </div>
    <div className='absolute bottom-[-2px] left-0 w-24 h-[2px] bg-indigo-600 transition-all duration-300'></div>
  </div>
);

export default SectionTitle;
