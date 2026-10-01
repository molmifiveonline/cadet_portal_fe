import * as React from 'react';
import { cn } from '../../lib/utils/utils';
import { invalidFieldClass } from '../../lib/utils/formStyles';

const Input = React.forwardRef(({ className, type, invalid, ...props }, ref) => {
  return (
    <input
      type={type}
      aria-invalid={invalid || undefined}
      className={cn(
        'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        className,
        invalid && invalidFieldClass,
      )}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = 'Input';

export { Input };
