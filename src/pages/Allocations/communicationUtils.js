export const isPlanIntimated = (plan) =>
  Boolean(plan) &&
  !Number(plan.requires_refresh) &&
  (Number(plan.successful_communication_count || 0) > 0 ||
    ["Phone", "WhatsApp"].includes(plan.last_mode) ||
    (plan.last_mode === "Email" &&
      // A null delivery status is an email contact recorded by an admin.
      ["Sent", null].includes(plan.email_delivery_status)));
