import type { Invoice, Expense } from "@/types";

/**
 * Finance account — single source of truth for income and expenses.
 *
 * All income (invoices) and expense data used in finance reports, dashboards,
 * and admin views MUST be read from this module to ensure transparency and
 * accuracy. In production, replace the in-memory data with API calls to your
 * finance/accounting backend.
 */

const financeAccountInvoices: Invoice[] = [
  { id: "inv-school-1", organizationId: "org2", learnerId: null, invoiceNumber: "INV-2026-SC-001", term: "Term 1 2026", totalAmount: 5000, status: "sent", dueDate: "2026-03-31", source: "school_club", sessionType: "SCHOOL_STEM_CLUB", payerType: "SCHOOL", description: "School club term fee – 2 learners", learnerCount: 2 },
  { id: "inv-school-2", organizationId: "org3", learnerId: null, invoiceNumber: "INV-2026-SC-002", term: "Term 1 2026", totalAmount: 2500, status: "paid", dueDate: "2026-02-28", source: "school_club", sessionType: "SCHOOL_STEM_CLUB", payerType: "SCHOOL", description: "School club term fee – 1 learner", learnerCount: 1, paidAmount: 2500, paidDate: "2026-01-20" },
  { id: "inv5", organizationId: "org2", learnerId: null, invoiceNumber: "INV-2026-005", term: "Term 1 2026", totalAmount: 2500, status: "sent", dueDate: "2026-01-15", source: "organization", sessionType: "ORGANISATION_SESSION", payerType: "ORGANISATION", description: "Organisation session fee" },
  { id: "inv3", learnerId: "l2", invoiceNumber: "INV-2026-003", term: "Term 1 2026", totalAmount: 3000, status: "partially_paid", dueDate: "2026-02-28", source: "makerspace", sessionType: "MAKERSPACE", payerType: "PARENT", paidAmount: 1500 },
  { id: "inv4", learnerId: "l3", invoiceNumber: "INV-2026-004", term: "Term 1 2026", totalAmount: 2500, status: "draft", dueDate: "2026-03-31", source: "home_session", sessionType: "HOME_SESSION", payerType: "PARENT" },
  { id: "inv7", learnerId: "l1", invoiceNumber: "INV-2026-007", term: "Term 1 2026", totalAmount: 800, status: "paid", dueDate: "2026-03-01", source: "camp", sessionType: "OTHER", payerType: "PARENT", paidAmount: 800, paidDate: "2026-01-28" },
  { id: "inv8", learnerId: "l2", invoiceNumber: "INV-2026-008", term: "Term 1 2026", totalAmount: 1200, status: "paid", dueDate: "2026-02-15", source: "miradi", sessionType: "MIRADI_SESSION", payerType: "ORGANISATION", paidAmount: 1200, paidDate: "2026-01-10" },
  { id: "inv9", learnerId: "l5", invoiceNumber: "INV-2026-009", term: "Term 1 2026", totalAmount: 500, status: "paid", dueDate: "2026-01-20", source: "donation", sessionType: "OTHER", payerType: "PARENT", paidAmount: 500, paidDate: "2026-01-18" },
  { id: "inv11", learnerId: "l3", invoiceNumber: "INV-2026-011", term: "Term 1 2026", totalAmount: 2600, status: "paid", dueDate: "2026-02-28", source: "makerspace", sessionType: "MAKERSPACE", payerType: "PARENT", paidAmount: 2600, paidDate: "2026-02-10" },
];

const financeAccountExpenses: Expense[] = [
  { id: "ex1", category: "rent", description: "Monthly rent — Ngong Road space", amount: 12000, date: "2026-01-01", paidTo: "Property Co", reference: "RENT-01" },
  { id: "ex2", category: "internet", description: "ISP — fibre", amount: 1500, date: "2026-01-05", paidTo: "Telkom", reference: "INV-8821" },
  { id: "ex3", category: "electricity", description: "Electricity — Jan", amount: 1800, date: "2026-01-10", paidTo: "City Power" },
  { id: "ex3b", category: "water", description: "Water — Jan", amount: 500, date: "2026-01-10", paidTo: "City Water" },
  { id: "ex4", category: "equipment", description: "Robotics kits, micro:bits, cables", amount: 5500, date: "2026-01-15", paidTo: "Tech Supplies Ltd", reference: "PO-445" },
  { id: "ex5", category: "rent", description: "Monthly rent — Ngong Road", amount: 12000, date: "2026-02-01", paidTo: "Property Co", reference: "RENT-02" },
  { id: "ex6", category: "repairs", description: "Laptop screen repair", amount: 1800, date: "2026-01-20", paidTo: "Repair Shop" },
  { id: "ex7", category: "transport", description: "Educator transport to school club", amount: 450, date: "2026-01-12", paidTo: "Mr. James" },
  { id: "ex8", category: "marketing", description: "Flyers and posters", amount: 800, date: "2026-01-25", paidTo: "Print Co" },
  { id: "ex9", category: "office_supplies", description: "Stationery, paper, folders", amount: 620, date: "2026-01-08", paidTo: "Office Depot" },
  { id: "ex10", category: "rent", description: "Monthly rent — Feb 2026", amount: 12000, date: "2026-02-01", paidTo: "Property Co", reference: "RENT-02" },
  { id: "ex11", category: "equipment", description: "Laptop for programme", amount: 45000, date: "2026-01-15", paidTo: "Tech Store", reference: "PO-2026-01" },
  { id: "ex12", category: "salaries", description: "Team salaries — Jan 2026", amount: 85000, date: "2026-01-28", paidTo: "Payroll", reference: "SAL-01" },
  { id: "ex13", category: "salaries", description: "Team salaries — Feb 2026", amount: 85000, date: "2026-02-28", paidTo: "Payroll", reference: "SAL-02" },
  { id: "ex14", category: "internet", description: "ISP — fibre", amount: 1500, date: "2026-02-05", paidTo: "Telkom", reference: "INV-8822" },
  { id: "ex15", category: "water", description: "Water — Feb", amount: 500, date: "2026-02-12", paidTo: "City Water" },
  { id: "ex16", category: "electricity", description: "Electricity — Feb", amount: 1900, date: "2026-02-12", paidTo: "City Power" },
  { id: "ex17", category: "office_supplies", description: "Printer paper, toner", amount: 340, date: "2026-02-10", paidTo: "Office Depot" },
  { id: "ex18", category: "toiletries", description: "Soap, tissue, cleaning", amount: 280, date: "2026-01-15", paidTo: "Janitorial Supplies" },
  { id: "ex19", category: "consumables", description: "Coffee, tea, cocoa, sugar", amount: 450, date: "2026-01-20", paidTo: "Groceries Ltd" },
  { id: "ex20", category: "consumables", description: "Coffee, tea, sugar", amount: 380, date: "2026-02-18", paidTo: "Groceries Ltd" },
];

/** Income data from the finance account. Use this for all income reports and dashboards. */
export function getFinanceAccountInvoices(): Invoice[] {
  return financeAccountInvoices;
}

/** Expense data from the finance account. Use this for all expense reports and dashboards. */
export function getFinanceAccountExpenses(): Expense[] {
  return financeAccountExpenses;
}
