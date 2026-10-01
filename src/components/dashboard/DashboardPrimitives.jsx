import React, { useEffect, useId, useRef } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

export function Section({
  title,
  description,
  icon: Icon,
  action,
  children,
  className = '',
}) {
  return (
    <section className={`dash-panel ${className}`}>
      <div className="dash-panel-heading">
        <div>
          <h2>
            {Icon && <Icon size={18} aria-hidden="true" />}
            {title}
          </h2>
          {description && <p>{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function EmptyState({
  children = 'No candidates match these filters.',
}) {
  return <p className="dash-empty">{children}</p>;
}

export function Pagination({ data, onPage, disabled = false, label }) {
  if (!data?.total) return null;
  const { page = 1, pageSize = 5, total } = data;
  const last = Math.ceil(total / pageSize);
  return (
    <nav className="dash-pagination" aria-label={`${label} pages`}>
      <span>
        {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of{' '}
        {total}
      </span>
      <div>
        <button
          className="dash-icon-button"
          aria-label={`Previous ${label} page`}
          disabled={disabled || page <= 1}
          onClick={() => onPage(page - 1)}
        >
          <ChevronLeft size={16} />
        </button>
        <span>
          {page} / {last}
        </span>
        <button
          className="dash-icon-button"
          aria-label={`Next ${label} page`}
          disabled={disabled || page >= last}
          onClick={() => onPage(page + 1)}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </nav>
  );
}

export function DashboardModal({ title, onClose, children, busy = false }) {
  const ref = useRef(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    dialog.showModal();
    return () => dialog.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className="dash-modal dashboard"
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onClose();
      }}
    >
      <header>
        <h2 id={titleId}>{title}</h2>
        <button
          className="dash-icon-button"
          aria-label="Close dialog"
          onClick={onClose}
          disabled={busy}
        >
          <X size={20} />
        </button>
      </header>
      <div className="dash-modal-body">{children}</div>
    </dialog>
  );
}

export const safeExternalUrl = (value) => {
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
};
