export interface UserOut {
  id: string;
  email: string;
  name: string;
  currency: string;
  is_active: boolean;
  created_at: string;
}

export interface Token {
  access_token: string;
  token_type: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface UserCreate {
  email: string;
  name: string;
  password: string;
  currency?: string;
}

export type AccountType = "cash" | "debit" | "credit" | "savings";

export interface AccountOut {
  id: string;
  user_id: string;
  name: string;
  type: AccountType;
  balance: number;
  currency: string;
  is_active: boolean;
  created_at: string;
}

export interface AccountCreate {
  name: string;
  type: AccountType;
  balance?: number;
  currency?: string;
}

export interface AccountUpdate {
  name?: string;
  type?: AccountType;
  balance?: number;
  currency?: string;
  is_active?: boolean;
}

export type TransactionType = "income" | "expense" | "transfer";

export interface TransactionOut {
  id: string;
  account_id: string;
  category_id: string | null;
  amount: number;
  type: TransactionType;
  description: string | null;
  date: string;
  created_at: string;
}

export interface TransactionCreate {
  account_id: string;
  category_id?: string | null;
  amount: number;
  type: TransactionType;
  description?: string | null;
  date: string;
}

export interface TransactionUpdate {
  category_id?: string | null;
  amount?: number;
  type?: TransactionType;
  description?: string | null;
  date?: string;
}

export interface TransactionFilters {
  date_from?: string;
  date_to?: string;
  category_id?: string;
  type?: TransactionType;
}

export interface CategoryOut {
  id: string;
  user_id: string;
  name: string;
  icon: string | null;
  color: string | null;
  is_income: boolean;
  is_default: boolean;
}

export interface CategoryCreate {
  name: string;
  icon?: string | null;
  color?: string | null;
  is_income?: boolean;
}

export type DebtStatus = "active" | "paid" | "negotiating";

export interface DebtOut {
  id: string;
  user_id: string;
  creditor: string;
  total_amount: number;
  remaining_amount: number;
  monthly_payment: number;
  interest_rate: number;
  due_date: string | null;
  status: DebtStatus;
  created_at: string;
}

export interface DebtCreate {
  creditor: string;
  total_amount: number;
  remaining_amount: number;
  monthly_payment: number;
  interest_rate?: number;
  due_date?: string | null;
  status?: DebtStatus;
}

export interface DebtUpdate {
  creditor?: string;
  remaining_amount?: number;
  monthly_payment?: number;
  interest_rate?: number;
  due_date?: string | null;
  status?: DebtStatus;
}

export interface DebtSummary {
  total_debt: number;
  total_paid: number;
  global_progress_pct: number;
  active_debts: number;
}

export type BudgetPeriod = "monthly" | "weekly";

export interface BudgetOut {
  id: string;
  user_id: string;
  category_id: string;
  limit_amount: number;
  spent_amount: number;
  period: BudgetPeriod;
  start_date: string;
  created_at: string;
}

export interface BudgetCreate {
  category_id: string;
  limit_amount: number;
  period?: BudgetPeriod;
  start_date: string;
}

export interface BudgetUpdate {
  limit_amount?: number;
  period?: BudgetPeriod;
  start_date?: string;
}

export interface BudgetStatus {
  id: string;
  category_id: string;
  category_name: string;
  limit_amount: number;
  spent_amount: number;
  remaining: number;
  used_pct: number;
}
