import React, { useId } from 'react';
import { Anchor, RefreshCw } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

function DashboardFilter({ label, value, onChange, allLabel, options }) {
  const id = useId();
  return (
    <div className="dash-filter-field">
      <label id={`${id}-label`} htmlFor={id}>
        {label}
      </label>
      <Select value={value || 'all'} onValueChange={onChange}>
        <SelectTrigger
          id={id}
          aria-labelledby={`${id}-label`}
          className="dash-filter-trigger"
        >
          <SelectValue placeholder={allLabel} />
        </SelectTrigger>
        <SelectContent
          className="dash-filter-content"
          align="start"
          sideOffset={4}
        >
          <SelectItem className="dash-filter-option" value="all">
            {allLabel}
          </SelectItem>
          {options.map((option) => (
            <SelectItem
              className="dash-filter-option"
              key={option.value}
              value={option.value}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export default function DashboardHeader({
  user,
  filters,
  options,
  onFilter,
  onReset,
  refresh,
  refreshing,
  autoRefresh,
  setAutoRefresh,
  updatedAt,
}) {
  const personal = user?.role === 'Cadet';
  const institute = user?.role === 'Institute';
  return (
    <header className="dash-header">
      <div className="dash-heading-row">
        <div>
          <div className="dash-eyebrow">
            <Anchor size={15} /> MOLMI /{' '}
            {personal
              ? 'Your application'
              : institute
                ? 'Institute overview'
                : 'Recruitment'}
          </div>
          <h1>
            {personal
              ? 'Your application status'
              : institute
                ? 'Your cadet applications'
                : 'Recruitment dashboard'}
          </h1>
          <p>
            Welcome,{' '}
            {user?.institute_name ||
              user?.first_name ||
              user?.name ||
              user?.role}
            .{' '}
            {personal
              ? 'Follow your application and complete your next steps.'
              : 'View candidate progress and pending tasks.'}
          </p>
        </div>
        <div className="dash-header-actions">
          <button
            className="dash-button"
            onClick={refresh}
            disabled={refreshing}
          >
            <RefreshCw
              size={15}
              className={refreshing ? 'motion-safe:animate-spin' : ''}
            />
            {refreshing ? 'Refreshing' : 'Refresh'}
          </button>
        </div>
      </div>
      {!personal && (
        <div className="dash-filters">
          <DashboardFilter
            label="Recruitment drive"
            value={filters.driveId}
            onChange={(value) => onFilter('driveId', value)}
            allLabel="All drives"
            options={(options.drives || []).map((drive) => ({
              value: String(drive.id),
              label: drive.drive_name,
            }))}
          />
          <DashboardFilter
            label="Stream"
            value={filters.stream}
            onChange={(value) => onFilter('stream', value)}
            allLabel="All streams"
            options={['Deck', 'Engine', 'Other'].map((stream) => ({
              value: stream,
              label: stream,
            }))}
          />
          <DashboardFilter
            label="Batch"
            value={filters.batchYear}
            onChange={(value) => onFilter('batchYear', value)}
            allLabel="All batches"
            options={(options.batchYears || []).map((year) => ({
              value: String(year),
              label: year,
            }))}
          />
          <label>
            Applied from
            <input
              type="date"
              value={filters.from || ''}
              max={filters.to || undefined}
              onChange={(event) => onFilter('from', event.target.value)}
            />
          </label>
          <label>
            Applied to
            <input
              type="date"
              value={filters.to || ''}
              min={filters.from || undefined}
              onChange={(event) => onFilter('to', event.target.value)}
            />
          </label>
          {Object.keys(filters).length > 0 && (
            <button className="dash-text-button" onClick={onReset}>
              Reset
            </button>
          )}
        </div>
      )}
      <div className="dash-live-row">
        <label>
          <input
            type="checkbox"
            checked={autoRefresh}
            onChange={(event) => setAutoRefresh(event.target.checked)}
          />
          <span
            className={autoRefresh ? 'dash-live-dot active' : 'dash-live-dot'}
          />
          Auto-refresh · 60 sec
        </label>
        <span>
          {updatedAt
            ? `Updated ${new Date(updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
            : 'Waiting for the latest data'}
        </span>
      </div>
    </header>
  );
}
