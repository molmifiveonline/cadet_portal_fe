import { isPlanIntimated } from "./communicationUtils";

describe("recorded candidate communication", () => {
  it.each(["Phone", "WhatsApp", "Email"])(
    "counts an admin-recorded %s contact without delivery",
    (last_mode) => {
      expect(isPlanIntimated({ last_mode, email_delivery_status: null })).toBe(
        true,
      );
    },
  );
  it("preserves previously delivered email history", () => {
    expect(
      isPlanIntimated({ last_mode: "Email", email_delivery_status: "Sent" }),
    ).toBe(true);
  });
  it("does not count a failed email or an uncontacted plan", () => {
    expect(
      isPlanIntimated({ last_mode: "Email", email_delivery_status: "Failed" }),
    ).toBe(false);
    expect(isPlanIntimated({})).toBe(false);
  });
  it("preserves a successful earlier contact despite a later failed email", () => {
    expect(
      isPlanIntimated({
        last_mode: "Email",
        email_delivery_status: "Failed",
        successful_communication_count: "1",
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
