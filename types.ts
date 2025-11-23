export type Tab = 'dashboard' | 'bookings' | 'new-booking' | 'calendar' | 'expenses' | 'analytics' | 'control-center' | 'accounts';

export type BookingStatus = 'Upcoming' | 'Completed' | 'Cancelled';
export type BookingTier = 'Silver' | 'Gold' | 'Diamond';
export type Shift = 'Day' | 'Night';

export interface Payment {
    id: string;
    date: string; // ISO string "YYYY-MM-DD"
    amount: number;
    method: PaymentMethod;
    type: 'Received' | 'Reverted';
    notes?: string; // Reason for revert, etc.
}

export interface Booking {
    bookingId: string;
    clientName: string;
    status: BookingStatus;
    tier: BookingTier;
    season: string;
    eventDate: string; // Stored as ISO string "YYYY-MM-DD"
    contact: string;
    rate: number;
    payments: Payment[];
    discount?: number;
    expenses: number;
    eventType: string;
    guests: number;
    shift: Shift;
    services: Record<string, boolean | string | number>;
    refundAmount?: number;
}

export type PaymentMethod = 'Cash' | 'Card' | 'UPI' | 'Bank';

export interface ExpenseCategory {
    id: string;
    name: string;
    requiresManpower: boolean;
}

export interface Vendor {
    id: string;
    name: string;
    categoryId: string; // Links vendor to an expense category
}

export interface Expense {
    id: string;
    bookingId?: string; // Optional: Links to a booking if it's not a general expense
    expenseDate: string; // ISO string "YYYY-MM-DD"
    category: string;
    vendor: string;
    amount: number;
    paymentMethod: PaymentMethod;
    type: 'Paid' | 'Reverted';
    notes?: string; // Reason for revert
    manpowerCount?: number;
    ratePerPerson?: number;
}

export interface Transaction {
    date: string;
    description: string;
    bookingId?: string;
    type: 'Income' | 'Expense';
    amount: number;
    paymentMethod?: PaymentMethod;
    vendor?: string;
    category?: string;
}


export interface Toast {
    id: number;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
}

export interface Service {
    id: string;
    name: string;
    type: 'checkbox' | 'dropdown' | 'number';
    options?: string[];
    min?: number;
    max?: number;
}

export type ServiceUIType = keyof ServiceConfig;

export interface ServiceConfig {
    infrastructure: Service[];
    decoration: Service[];
    labour: Service[];
    halwai: Service[];
    extra: Service[];
    'entry-decor': Service[];
}

export interface Package {
    id: string;
    name: string;
    price: number;
    services: Record<string, boolean | string | number>;
}