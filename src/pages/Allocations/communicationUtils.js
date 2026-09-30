export const getJoiningEmailActionLabel = (plan, failedAttempt = false) => {
  if (failedAttempt || plan.email_delivery_status === "Failed") {
    return "Retry Joining Intimation";
  }

  const previouslyEmailed = !Number(plan.requires_refresh) && (
    Number(plan.successful_email_count || 0) > 0 ||
    (plan.last_mode === "Email" && plan.email_delivery_status === "Sent")
  );

  return previouslyEmailed ? "Send Another Email" : "Send Joining Intimation";
};
