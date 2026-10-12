import React from "react";
import "@testing-library/jest-dom";
import { fireEvent, render, screen, within } from "@testing-library/react";
import Allocations from "./index";
import api from "../../lib/utils/apiConfig";
import { usePermission } from "../../hooks/usePermission";

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({ useNavigate: () => mockNavigate }), {
  virtual: true,
});
jest.mock("../../hooks/usePermission", () => ({ usePermission: jest.fn() }));
jest.mock("../../lib/utils/apiConfig", () => ({
  get: jest.fn(),
  delete: jest.fn(),
}));
jest.mock("sonner", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

let cycles;
beforeEach(() => {
  jest.clearAllMocks();
  usePermission.mockReturnValue({ hasPermission: true });
  cycles = [
    {
      id: "drive-1",
      allocation_number: "CTV-2026-001",
      allocation_year: 2026,
      department: "Deck",
      rank_list_status: "Draft",
      candidate_count: 2,
      allocated_count: 1,
    },
  ];
  api.get.mockImplementation(async () => ({ data: { data: cycles } }));
});

it("keeps disabled history visible and excludes its cadets from active totals", async () => {
  Object.assign(cycles[0], {
    deleted_at: "2026-10-01T04:30:00.000Z",
    deleted_by_name: "Test Admin",
    delete_reason: "Replacement drive",
  });
  render(<Allocations />);
  const history = await screen.findByRole("button", { name: "View History" });
  const card = history.closest("article");
  expect(card).toHaveClass("grayscale");
  expect(within(card).getByText("CTV-2026-001")).toBeInTheDocument();
  expect(within(card).getByText("2 cadets")).toBeInTheDocument();
  expect(within(card).getByText("Reason: Replacement drive")).toBeInTheDocument();
  expect(within(card).getByText(/10:00:00.*IST/)).toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: /Disable|Restore/, exact: true }),
  ).not.toBeInTheDocument();
  expect(screen.getByText("Total Cadets").parentElement).toHaveTextContent("0");
  fireEvent.click(history);
  expect(mockNavigate).toHaveBeenCalledWith("/allocations/drive-1");
});

it.each([true, false])(
  "keeps disable actions off allocation cards with edit permission %s",
  async (hasPermission) => {
    usePermission.mockReturnValue({ hasPermission });
    render(<Allocations />);
    const open = await screen.findByRole("button", { name: "Open Allocation" });
    expect(screen.queryByRole("button", { name: /Disable/ })).not.toBeInTheDocument();
    fireEvent.click(open);
    expect(mockNavigate).toHaveBeenCalledWith("/allocations/drive-1");
    expect(api.delete).not.toHaveBeenCalled();
  },
);
