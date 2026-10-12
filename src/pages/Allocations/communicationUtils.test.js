import { isPlanIntimated } from "./communicationUtils";

describe("recorded candidate communication", () => {
  it.each(["Phone", "WhatsApp", "Email"])(
    "does not treat a manual %s contact as a system email",
    (last_mode) => {
      expect(isPlanIntimated({ last_mode, email_delivery_status: null })).toBe(false);
    },
  );
  it("preserves previously delivered email history", () => {
    expect(isPlanIntimated({ last_mode: "Email", email_delivery_status: "Sent" })).toBe(true);
  });
  it("does not count a failed email or an uncontacted plan", () => {
    expect(isPlanIntimated({ last_mode: "Email", email_delivery_status: "Failed" })).toBe(false);
    expect(isPlanIntimated({})).toBe(false);
  });
  it("preserves a successful earlier contact despite a later failed email", () => {
    expect(
      isPlanIntimated({
        last_mode: "Email",
        email_delivery_status: "Failed",
        successful_email_count: "1",
      }),
    ).toBe(true);
  });
  it("does not count communication from a plan requiring refresh", () => {
    expect(
      isPlanIntimated({
        last_mode: "Email",
        email_delivery_status: null,
        successful_communication_count: 1,
        requires_refresh: "1",
      }),
    ).toBe(false);
  });
});
