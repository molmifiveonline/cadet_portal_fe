import React, { forwardRef } from 'react';
import { cn } from '../../lib/utils/utils';

const Checkbox = forwardRef(({ className, ...props }, ref) => {
  return (
    <input
      type='checkbox'
      ref={ref}
      className={cn(
        'h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary',
        className,
      )}
      {...props}
    />
  );
});

Checkbox.displayName = 'Checkbox';

export { Checkbox };
