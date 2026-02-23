import React from 'react';

const SectionTitle = ({ title, icon: Icon }) => (
  <h3 className='text-lg font-semibold text-gray-800 flex items-center gap-2 mb-4 border-b pb-2 mt-6 first:mt-0'>
    <Icon className='w-5 h-5 text-blue-600' />
    {title}
  </h3>
);

export default SectionTitle;
