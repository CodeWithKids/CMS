import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PaymentDialog } from "@/features/invoices/components/PaymentDialog";

describe("PaymentDialog", () => {
  const defaultProps = {
    open: true,
    onOpenChange: () => {},
    invoiceId: "inv1",
    maxAmount: 1000,
    currency: "KES",
    onRecord: () => {},
    recordedBy: "u3",
  };

  it("disables submit and shows error when amount is empty", () => {
    render(<PaymentDialog {...defaultProps} />);

    const button = screen.getByRole("button", { name: /record payment/i });
    expect(button).toBeDisabled();
    expect(
      screen.getByText("Amount is required.", { exact: false }),
    ).toBeInTheDocument();
  });

  it("shows error when amount is greater than max", () => {
    render(<PaymentDialog {...defaultProps} />);

    const amountInput = screen.getByLabelText(/amount/i);
    fireEvent.change(amountInput, { target: { value: "2000" } });

    expect(
      screen.getByText("Amount cannot be more than the outstanding balance."),
    ).toBeInTheDocument();
  });
});

