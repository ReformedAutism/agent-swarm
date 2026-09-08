import { Landing } from "@/pages/Landing";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const login = vi.fn();
const navigate = vi.fn();
let mockIsAuthenticated = false;

vi.mock("@caffeineai/core-infrastructure", () => ({
  useInternetIdentity: () => ({
    login,
    isInitializing: false,
    isLoggingIn: false,
    isAuthenticated: mockIsAuthenticated,
  }),
}));

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => navigate,
}));

describe("Landing page", () => {
  beforeEach(() => {
    mockIsAuthenticated = false;
    login.mockClear();
    navigate.mockClear();
  });

  it("introduces the platform philosophy with hero and supporting sections", () => {
    render(<Landing />);

    // Hero introduces the two survival goals.
    expect(
      screen.getByRole("heading", { name: /achieve knowledge and control/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/two survival goals: grow knowledge/i),
    ).toBeInTheDocument();

    // Supporting survival-goal sections.
    expect(screen.getByText("Survival Goal 01")).toBeInTheDocument();
    expect(screen.getByText("Survival Goal 02")).toBeInTheDocument();
    expect(screen.getByText("Knowledge")).toBeInTheDocument();
    expect(screen.getByText("Control")).toBeInTheDocument();

    // Principles section.
    expect(
      screen.getByRole("heading", { name: /built on three principles/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("Autonomous by design")).toBeInTheDocument();
    expect(screen.getByText("Evolution compounds")).toBeInTheDocument();
    expect(screen.getByText("Control is measurable")).toBeInTheDocument();
  });

  it("calls login from the hero CTA", async () => {
    const user = userEvent.setup();
    render(<Landing />);

    await user.click(screen.getByTestId("landing.enter_dashboard_button"));
    expect(login).toHaveBeenCalled();
  });

  it("calls login from the header enter button", async () => {
    const user = userEvent.setup();
    render(<Landing />);

    await user.click(screen.getByRole("button", { name: /enter dashboard/i }));
    expect(login).toHaveBeenCalled();
  });

  it("navigates to the dashboard once Internet Identity authentication completes", () => {
    mockIsAuthenticated = true;
    render(<Landing />);

    expect(navigate).toHaveBeenCalledWith({ to: "/dashboard" });
  });

  it("does not navigate while the user is not authenticated", () => {
    render(<Landing />);

    expect(navigate).not.toHaveBeenCalled();
  });
});
