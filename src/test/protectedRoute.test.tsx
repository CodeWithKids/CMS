import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import ProtectedRoute from "@/components/layout/ProtectedRoute";

vi.mock("@/context/AuthContext", () => {
  return {
    useAuth: () => ({
      currentUser: {
        id: "u5",
        name: "Lucy Njeri (Parent)",
        role: "parent",
      },
      isAuthenticated: true,
      login: vi.fn(),
      logout: vi.fn(),
      updateUser: vi.fn(),
    }),
    getRoleDashboard: () => "/parent/dashboard",
  };
});

describe("ProtectedRoute", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows access denied message when role is not allowed", () => {
    render(
      <MemoryRouter>
        <ProtectedRoute allowedRoles={["admin"]}>
          <div>Secret</div>
        </ProtectedRoute>
      </MemoryRouter>,
    );

    expect(
      screen.getByText("You don't have access", { exact: false }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /go to my dashboard/i }),
    ).toBeInTheDocument();
  });

  it("renders children when role is allowed", () => {
    render(
      <MemoryRouter>
        <ProtectedRoute allowedRoles={["parent"]}>
          <div>Secret</div>
        </ProtectedRoute>
      </MemoryRouter>,
    );

    expect(screen.getByText("Secret")).toBeInTheDocument();
  });
}

