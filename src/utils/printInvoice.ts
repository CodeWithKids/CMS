/**
 * Open a print window for invoice or receipt so the user can print or Save as PDF.
 * No PDF library required; browser print dialog offers "Save as PDF".
 */

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, { dateStyle: "medium" });
  } catch {
    return iso;
  }
}

export interface InvoiceForPrint {
  invoiceNumber: string;
  term: string;
  totalAmount: number;
  status: string;
  dueDate: string;
  paidAmount?: number;
  paidDate?: string;
  description?: string | null;
  source?: string;
}

export interface ReceiptForPrint {
  receiptNumber: string;
  invoiceNumber: string;
  paidDate: string;
  amountPaid: number;
  description?: string | null;
  payerLabel?: string | null;
}

const ISSUER_NAME = "Code With Kids";

function openPrintWindow(html: string, title: string): void {
  const w = window.open("", "_blank", "noopener,noreferrer");
  if (!w) {
    window.print();
    return;
  }
  w.document.write(html);
  w.document.close();
  w.document.title = title;
  w.focus();
  requestAnimationFrame(() => {
    w.print();
    w.onafterprint = () => w.close();
  });
}

/** Build HTML for an invoice and open print dialog (user can Save as PDF). */
export function printInvoice(
  invoice: InvoiceForPrint,
  options: { subtitle?: string; issuerName?: string } = {}
): void {
  const issuer = options.issuerName ?? ISSUER_NAME;
  const subtitle = options.subtitle ?? "";
  const statusLabel = invoice.status.replace(/_/g, " ");
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Invoice ${invoice.invoiceNumber}</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 640px; margin: 24px auto; padding: 0 16px; color: #111; }
    h1 { font-size: 1.5rem; margin-bottom: 4px; }
    .subtitle { color: #555; font-size: 0.9rem; margin-bottom: 24px; }
    .meta { display: grid; grid-template-columns: 120px 1fr; gap: 8px 16px; margin-bottom: 24px; font-size: 0.9rem; }
    .meta dt { color: #555; }
    .meta dd { margin: 0; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    th, td { text-align: left; padding: 10px 8px; border-bottom: 1px solid #ddd; }
    th { font-weight: 600; color: #555; font-size: 0.85rem; }
    .amount { font-size: 1.25rem; font-weight: 600; margin-top: 8px; }
    .footer { margin-top: 32px; font-size: 0.8rem; color: #666; }
  </style>
</head>
<body>
  <h1>Invoice ${invoice.invoiceNumber}</h1>
  ${subtitle ? `<p class="subtitle">${subtitle}</p>` : ""}
  <dl class="meta">
    <dt>Issued by</dt>
    <dd>${issuer}</dd>
    <dt>Term</dt>
    <dd>${invoice.term}</dd>
    <dt>Status</dt>
    <dd>${statusLabel}</dd>
    <dt>Due date</dt>
    <dd>${formatDate(invoice.dueDate)}</dd>
    ${invoice.paidDate ? `<dt>Paid on</dt><dd>${formatDate(invoice.paidDate)}</dd>` : ""}
  </dl>
  <table>
    <thead>
      <tr><th>Description</th><th style="text-align:right">Amount (Ksh)</th></tr>
    </thead>
    <tbody>
      <tr>
        <td>${invoice.description ?? `${invoice.term} – ${(invoice.source ?? "").replace(/_/g, " ")}`}</td>
        <td style="text-align:right">${invoice.totalAmount.toLocaleString()}</td>
      </tr>
    </tbody>
  </table>
  <div class="amount">Total: Ksh ${invoice.totalAmount.toLocaleString()}</div>
  ${invoice.paidAmount != null && invoice.paidAmount > 0 ? `<p style="margin-top:8px;color:#166534;">Paid: Ksh ${invoice.paidAmount.toLocaleString()}</p>` : ""}
  <p class="footer">Thank you for your business. Keep this invoice for your records.</p>
</body>
</html>`;
  openPrintWindow(html, `Invoice ${invoice.invoiceNumber}`);
}

/** Build HTML for a receipt and open print dialog (user can Save as PDF). */
export function printReceipt(
  receipt: ReceiptForPrint,
  options: { issuerName?: string } = {}
): void {
  const issuer = options.issuerName ?? ISSUER_NAME;
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Receipt ${receipt.receiptNumber}</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 480px; margin: 24px auto; padding: 0 16px; color: #111; }
    h1 { font-size: 1.25rem; margin-bottom: 4px; }
    .receipt-no { color: #555; font-size: 0.9rem; margin-bottom: 24px; }
    .meta { display: grid; grid-template-columns: 100px 1fr; gap: 6px 12px; margin-bottom: 24px; font-size: 0.9rem; }
    .meta dt { color: #555; }
    .meta dd { margin: 0; }
    .amount { font-size: 1.5rem; font-weight: 600; margin: 16px 0; padding-top: 16px; border-top: 1px solid #ddd; }
    .footer { margin-top: 24px; font-size: 0.8rem; color: #666; }
  </style>
</head>
<body>
  <h1>Payment receipt</h1>
  <p class="receipt-no">${receipt.receiptNumber}</p>
  <dl class="meta">
    <dt>Issued by</dt>
    <dd>${issuer}</dd>
    <dt>Date paid</dt>
    <dd>${formatDate(receipt.paidDate)}</dd>
    <dt>Invoice</dt>
    <dd>${receipt.invoiceNumber}</dd>
    ${receipt.payerLabel ? `<dt>Paid by</dt><dd>${receipt.payerLabel}</dd>` : ""}
  </dl>
  ${receipt.description ? `<p><strong>Description</strong><br>${receipt.description}</p>` : ""}
  <div class="amount">Amount paid: Ksh ${receipt.amountPaid.toLocaleString()}</div>
  <p class="footer">Thank you for your payment. Keep this receipt for your records.</p>
</body>
</html>`;
  openPrintWindow(html, `Receipt ${receipt.receiptNumber}`);
}
