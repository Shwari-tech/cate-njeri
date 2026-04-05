// =========================================
// SHWARI FINANCE PORTAL - TYPE DEFINITIONS
// =========================================

// User & Authentication Types
export interface User {
  id: string;
  name: string;
  email: string;
  accountNo: string;
  bankBranch: string;
  bankCode: string;
  netPay: number;
  team: string;
  sheetLink: string;
  syncTime: string;
  serverNode: string;
}

export interface LoginCredentials {
  identifier: string;
  pin: string;
  type: 'mobile' | 'email';
  rememberMe?: boolean;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

// Transaction Types
export interface Transaction {
  id: string;
  date: string;
  description: string;
  type: 'earning' | 'deduction' | 'trip' | 'payment';
  amount: number;
  balance: number;
  earnings?: number;
  deductions?: number;
  trips?: number;
  raw?: any[];
}

export interface TransactionDetail {
  earning: number | string;
  deduction: number | string;
  balance: number | string;
  date: string;
}

// Ledger & KPI Types
export interface LedgerData {
  fullHistory: Transaction[];
  recentList: Transaction[];
  isDriver: boolean;
  kpi: KPIData;
}

export interface KPIData {
  col1: number;
  col2: number;
  col3: number;
  col4: number;
  col5: number;
}

// Calendar Types
export interface CalendarCycle {
  id: number;
  type: 'high' | 'low' | 'inactive';
  month: string;
  year: number;
  startDate: Date;
  endDate: Date;
  days: CalendarDay[];
}

export interface CalendarDay {
  date: number;
  isActive: boolean;
  isNegative: boolean;
  hasData: boolean;
}

// Budget Types
export interface BudgetState {
  target: number;
  actual: number;
  remaining: number;
  percentage: number;
  month: number;
  year: number;
}

// Notification Types
export interface Notification {
  id: string;
  type: 'earning' | 'deduction' | 'info' | 'success' | 'warning';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

// Theme Types
export type Theme = 'light' | 'dark';

export interface ThemeState {
  theme: Theme;
  systemPreference: Theme | null;
}

// UI State Types
export interface UIState {
  isLoading: boolean;
  activeTab: TabId;
  modals: ModalState;
  notifications: Notification[];
  privacyMode: boolean;
}

export type TabId = 'home' | 'work' | 'hr';

export interface ModalState {
  transactionDetail: boolean;
  history: boolean;
  notifications: boolean;
  statement: boolean;
  comingSoon: boolean;
  handbook: boolean;
  support: boolean;
  recovery: boolean;
}

// Countdown Types
export interface CountdownState {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  progress: number;
  nextPayDate: string;
}

// Rank & Stats Types
export interface RankData {
  earnings: number;
  leadership: number;
  deduction: number;
}

export interface StatsData {
  label1: string;
  value1: number;
  label2: string;
  value2: number;
  label3: string;
  value3: number;
}

// Finance Card Types
export interface FinanceStatus {
  loanLimit: number;
  loanStatus: 'available' | 'locked' | 'pending';
  advanceLimit: number;
  advanceStatus: 'available' | 'locked' | 'pending';
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface LoginResponse {
  success: boolean;
  user?: User;
  message?: string;
}

// Cache Types
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

export interface AppCache {
  user: CacheEntry<User> | null;
  ledger: CacheEntry<LedgerData> | null;
  transactions: CacheEntry<Transaction[]> | null;
}

// Gesture Types
export interface SwipeState {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  isSwiping: boolean;
  direction: 'left' | 'right' | 'up' | 'down' | null;
}

// Animation Types
export interface AnimationConfig {
  duration: number;
  delay: number;
  easing: string;
  stagger?: number;
}

// Statement Types
export interface StatementData {
  user: User;
  period: string;
  generatedDate: string;
  transactions: Transaction[];
  totals: {
    earnings: number;
    deductions: number;
    netPay: number;
  };
}

// Support Types
export interface SupportTicket {
  id: string;
  subject: string;
  message: string;
  status: 'open' | 'in-progress' | 'resolved';
  createdAt: string;
}

// Recovery Types
export interface RecoveryRequest {
  identifier: string;
}

export interface RecoveryResponse {
  success: boolean;
  message: string;
  email?: string;
}

// App Configuration
export interface AppConfig {
  version: string;
  apiEndpoint: string;
  cacheTTL: number;
  maxRetries: number;
  features: {
    darkMode: boolean;
    notifications: boolean;
    offlineMode: boolean;
    biometricAuth: boolean;
  };
}
