import React, { useId } from 'react';
import { Info, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';

const DeleteButtonWithReason = ({
  disabled,
  reason,
  label,
  onClick,
  showLabel = false,
}) => {
  const reasonId = useId();
  const explanation =
    reason || 'This record has linked records and cannot be deleted.';
  return (
    <div className="inline-flex shrink-0 items-center gap-1">
      <Button
        type="button"
        variant={showLabel ? 'outline' : 'ghost'}
        size={showLabel ? 'sm' : 'icon'}
        disabled={disabled}
        aria-label={label}
        title={label}
        aria-describedby={disabled ? reasonId : undefined}
        onClick={onClick}
        className={
          showLabel
            ? 'border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800'
            : 'p-2 rounded-lg text-red-600 hover:bg-red-100 transition-colors'
        }
      >
        <Trash2
          size={showLabel ? 14 : 16}
          className={showLabel ? 'mr-1.5' : undefined}
          aria-hidden="true"
        />
        {showLabel && label}
      </Button>
      {disabled && (
        <>
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label={`Why ${label.toLowerCase()} is disabled`}
                  className="rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  <Info size={16} aria-hidden="true" />
                </button>
              </TooltipTrigger>
              <TooltipContent
                side="bottom"
                align="end"
                sideOffset={8}
                className="z-[60] max-w-[280px] text-xs leading-relaxed"
              >
                {explanation}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <span id={reasonId} className="sr-only">
            {explanation}
          </span>
        </>
      )}
    </div>
  );
};

export default DeleteButtonWithReason;
