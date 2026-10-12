export const isPlanIntimated = (plan) =>
  Boolean(plan) &&
  !Number(plan.requires_refresh) &&
  (Boolean(plan.current_email_sent) ||
    Number(plan.successful_email_count || 0) > 0 ||
    (plan.last_mode === "Email" && plan.email_delivery_status === "Sent"));
