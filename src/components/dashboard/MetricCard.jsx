import React, { useEffect, useState } from 'react';

export default function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  tone = 'indigo',
  onClick,
}) {
  const [display, setDisplay] = useState(value);
  useEffect(() => {
    if (
      value === null ||
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    ) {
      setDisplay(value);
      return;
    }
    const start = performance.now();
    let frame;
    const animate = (time) => {
      const fraction = Math.min((time - start) / 550, 1);
      setDisplay(Math.round(value * (1 - (1 - fraction) ** 3)));
      if (fraction < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [value]);
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag className={`dash-metric dash-tone-${tone}`} onClick={onClick}>
      <div className="dash-metric-top">
        <span>{label}</span>
        <span className="dash-metric-icon">
          <Icon size={19} />
        </span>
      </div>
      <strong aria-label={value === null ? 'Unavailable' : String(value)}>
        <span aria-hidden="true">
          {display === null ? '—' : Number(display).toLocaleString()}
        </span>
      </strong>
      <p>{detail}</p>
    </Tag>
  );
}
