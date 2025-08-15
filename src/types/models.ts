// Core TypeScript domain models per PRD

export interface Room {
  id: string;
  number: string;
  rent_price: number;
  status: "occupied" | "vacant";
  tenant_name?: string | null;
  due_day: number; // 1-28
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  room_id: string;
  billing_month: string; // ISO date (first day of month)
  due_date: string; // ISO date
  amount_due: number;
  amount_paid: number | null;
  payment_date: string | null;
  method: string | null;
  created_at: string;
  updated_at: string;
}

export interface Expense {
  id: string;
  date: string; // ISO date
  category: string;
  amount: number;
  notes?: string | null;
  created_at: string;
}

export interface Penalty {
  id: string;
  room_id: string;
  type: "overnight_guest" | "late_payment" | "custom";
  custom_description?: string | null;
  amount: number;
  incident_date: string; // ISO date
  paid: boolean;
  paid_date: string | null;
  notes?: string | null;
  created_at: string;
}

// Derived summary types
export interface MonthlySummaryRow {
  month: string; // YYYY-MM
  rent_invoiced: number;
  rent_collected: number;
  penalties_incurred: number;
  penalties_collected: number;
  expenses_total: number;
  net_realized: number; // (rent_collected + penalties_collected) - expenses_total
  net_gross: number; // (rent_collected + penalties_incurred) - expenses_total
}
