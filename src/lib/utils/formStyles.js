export const invalidFieldClass =
  'border-red-500 focus:border-red-500 focus:ring-red-500/10 focus-visible:ring-red-500/20';

export const errorTextClass = 'text-red-500 text-xs mt-1';

export const getInvalidFieldClass = (invalid) =>
  invalid ? invalidFieldClass : '';
