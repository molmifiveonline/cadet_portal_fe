import { getJoiningEmailActionLabel } from "./communicationUtils";

describe("joining intimation email action", () => {
  it.each(["Phone", "WhatsApp"])("uses the first-email label after %s contact only", (last_mode) => {
    expect(getJoiningEmailActionLabel({
      last_mode,
      successful_communication_count: 2,
      successful_email_count: 0,
      confirmation_received: true,
    })).toBe("Send Joining Intimation");
  });

  it("uses the first-email label for a new plan", () => {
    expect(getJoiningEmailActionLabel({})).toBe("Send Joining Intimation");
  });

  it("recognizes an earlier successful email even when the latest contact was by phone", () => {
    expect(getJoiningEmailActionLabel({
      last_mode: "Phone", successful_email_count: "1",
    })).toBe("Send Another Email");
  });

  it("recognizes the latest successful email", () => {
    expect(getJoiningEmailActionLabel({
      last_mode: "Email", email_delivery_status: "Sent",
    })).toBe("Send Another Email");
  });

  it("does not use outdated email history for a plan requiring refresh", () => {
    expect(getJoiningEmailActionLabel({
      successful_email_count: 1, requires_refresh: "1",
    })).toBe("Send Joining Intimation");
  });

  it("keeps the retry label for a failed email, including a failure during this session", () => {
    expect(getJoiningEmailActionLabel({
      last_mode: "Email", email_delivery_status: "Failed", successful_email_count: 1,
    })).toBe("Retry Joining Intimation");
    expect(getJoiningEmailActionLabel({}, true)).toBe("Retry Joining Intimation");
  });
});
