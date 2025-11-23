import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Tab, Booking, Toast as ToastType, Package, ServiceConfig, Expense, Transaction, Payment, ExpenseCategory, Vendor } from './types';
import { TABS, SAMPLE_BOOKINGS, DEFAULT_PACKAGES, DEFAULT_SERVICES_CONFIG, SAMPLE_EXPENSES, DEFAULT_EXPENSE_CATEGORIES, DEFAULT_VENDORS } from './constants';
import Header from './components/Header';
import TabNavigation from './components/TabNavigation';
import Dashboard from './tabs/Dashboard';
import Bookings from './tabs/Bookings';
import NewBooking from './tabs/NewBooking';
import Calendar from './tabs/Calendar';
import Expenses from './tabs/Expenses';
import Analytics from './tabs/Analytics';
import ControlCenter from './tabs/ControlCenter';
import Accounts from './tabs/Accounts';
import ToastContainer from './components/ToastContainer';
import BookingDetailModal from './components/BookingDetailModal';
import LoginScreen from './components/LoginScreen';

// Helper to load state from localStorage or fallback to default
function loadFromStorage<T>(key: string, defaultValue: T): T {
    try {
        const storedItem = localStorage.getItem(`heritage_${key}`);
        if (storedItem) {
            return JSON.parse(storedItem);
        }
    } catch (error) {
        console.error(`Error loading ${key} from storage`, error);
    }
    return defaultValue;
}

const App: React.FC = () => {
    // Auth State
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
        return localStorage.getItem('heritage_auth') === 'true';
    });

    // Persistent Active Tab
    const [activeTab, setActiveTab] = useState<Tab>(() => loadFromStorage('activeTab', 'dashboard'));
    
    // Initialize State from LocalStorage
    const [bookings, setBookings] = useState<Booking[]>(() => loadFromStorage('bookings', SAMPLE_BOOKINGS));
    const [packages, setPackages] = useState<Package[]>(() => loadFromStorage('packages', DEFAULT_PACKAGES));
    const [servicesConfig, setServicesConfig] = useState<ServiceConfig>(() => loadFromStorage('servicesConfig', DEFAULT_SERVICES_CONFIG));
    const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>(() => loadFromStorage('expenseCategories', DEFAULT_EXPENSE_CATEGORIES));
    const [vendors, setVendors] = useState<Vendor[]>(() => loadFromStorage('vendors', DEFAULT_VENDORS));
    const [allExpenses, setAllExpenses] = useState<Expense[]>(() => loadFromStorage('allExpenses', SAMPLE_EXPENSES));
    
    const [toasts, setToasts] = useState<ToastType[]>([]);
    const [currentSeason, setCurrentSeason] = useState('2025-26');
    const [bookingToEdit, setBookingToEdit] = useState<Booking | null>(null);
    const [viewingBooking, setViewingBooking] = useState<Booking | null>(null);
    const [bookingToPreselect, setBookingToPreselect] = useState<string | null>(null);
    const [bookingToPreselectInAccounts, setBookingToPreselectInAccounts] = useState<string | null>(null);
    const [preselectedDateForBooking, setPreselectedDateForBooking] = useState<string | null>(null);
    const [bookingFilterToPreselect, setBookingFilterToPreselect] = useState<Record<string, string> | null>(null);

    // --- PERSISTENCE EFFECTS ---
    useEffect(() => { localStorage.setItem('heritage_bookings', JSON.stringify(bookings)); }, [bookings]);
    useEffect(() => { localStorage.setItem('heritage_packages', JSON.stringify(packages)); }, [packages]);
    useEffect(() => { localStorage.setItem('heritage_servicesConfig', JSON.stringify(servicesConfig)); }, [servicesConfig]);
    useEffect(() => { localStorage.setItem('heritage_expenseCategories', JSON.stringify(expenseCategories)); }, [expenseCategories]);
    useEffect(() => { localStorage.setItem('heritage_vendors', JSON.stringify(vendors)); }, [vendors]);
    useEffect(() => { localStorage.setItem('heritage_allExpenses', JSON.stringify(allExpenses)); }, [allExpenses]);
    useEffect(() => { localStorage.setItem('heritage_auth', String(isAuthenticated)); }, [isAuthenticated]);
    useEffect(() => { localStorage.setItem('heritage_activeTab', JSON.stringify(activeTab)); }, [activeTab]);


    // Effect to auto-update booking expenses totals when allExpenses changes
    useEffect(() => {
        const expenseMap = allExpenses
            .filter(e => e.bookingId)
            .reduce((acc, exp) => {
                const amount = exp.type === 'Paid' ? exp.amount : -exp.amount;
                acc[exp.bookingId!] = (acc[exp.bookingId!] || 0) + amount;
                return acc;
            }, {} as Record<string, number>);

        // Only update if changes are detected to avoid unnecessary renders/writes
        setBookings(prevBookings => {
            let hasChanges = false;
            const newBookings = prevBookings.map(b => {
                const newExpenseTotal = expenseMap[b.bookingId] || 0;
                if (b.expenses !== newExpenseTotal) {
                    hasChanges = true;
                    return { ...b, expenses: newExpenseTotal };
                }
                return b;
            });
            return hasChanges ? newBookings : prevBookings;
        });
    }, [allExpenses]);

    const allTransactions = useMemo((): Transaction[] => {
        const paymentTransactions: Transaction[] = bookings.flatMap(b =>
            b.payments.map(p => {
                let description = p.type === 'Received' 
                    ? `Payment from ${b.clientName}` 
                    : `Payment Reverted to ${b.clientName}`;
                
                // Enhanced Description for Industrial Audit Trail
                if (p.notes) {
                    description += ` - ${p.notes}`;
                }

                return {
                    date: p.date,
                    description,
                    bookingId: b.bookingId,
                    type: p.type === 'Received' ? 'Income' : 'Expense',
                    amount: p.amount,
                    paymentMethod: p.method,
                };
            })
        );
        
        const expenseTransactions: Transaction[] = allExpenses.map(e => {
            let description = `${e.category}: ${e.vendor}`;
            if (e.type === 'Reverted' && e.notes) {
                description += ` (Revert Reason: ${e.notes})`;
            }
            return {
                date: e.expenseDate,
                description,
                bookingId: e.bookingId,
                type: e.type === 'Paid' ? 'Expense' : 'Income',
                amount: e.amount,
                paymentMethod: e.paymentMethod,
                vendor: e.vendor,
                category: e.category,
            }
        });
    
        return [...paymentTransactions, ...expenseTransactions]
            .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [bookings, allExpenses]);

    const availableSeasons = useMemo(() => {
        const seasons = new Set(bookings.map(b => b.season));
        seasons.add('2024-25');
        seasons.add('2025-26');
        seasons.add('2026-27');
        return ['All', ...Array.from(seasons).sort()];
    }, [bookings]);


    const addToast = useCallback((message: string, type: ToastType['type']) => {
        const id = Date.now();
        setToasts(prevToasts => [...prevToasts, { id, message, type }]);
    }, []);
    
    const removeToast = useCallback((id: number) => {
        setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
    }, []);

    const handleLogin = () => {
        setIsAuthenticated(true);
        addToast('Welcome back, Admin!', 'success');
    };

    const handleLogout = () => {
        setIsAuthenticated(false);
        setActiveTab('dashboard');
        addToast('Logged out successfully.', 'info');
    };

    const handleAddBooking = (newBooking: Booking) => {
        setBookings(prev => [newBooking, ...prev]);
    };

    const handleUpdateBooking = (updatedBooking: Booking) => {
        setBookings(prev => prev.map(b => b.bookingId === updatedBooking.bookingId ? updatedBooking : b));
        setBookingToEdit(null); // Clear editing state after update
    };

    const handleEditBooking = (booking: Booking) => {
        setBookingToEdit(booking);
        setActiveTab('new-booking');
    };
    
    const handleClearEdit = () => {
        setBookingToEdit(null);
    }
    
    const handleViewBooking = (booking: Booking, focusPayment: boolean = false) => {
        setViewingBooking(booking);
    };
    
    const handleAddPayment = (bookingId: string, payment: Payment) => {
        setBookings(prev => prev.map(b => {
            if (b.bookingId === bookingId) {
                const updatedBooking = { ...b, payments: [...b.payments, payment] };
                if (viewingBooking?.bookingId === bookingId) {
                    setViewingBooking(updatedBooking);
                }
                return updatedBooking;
            }
            return b;
        }));
        addToast(`Payment of ₹${payment.amount.toLocaleString('en-IN')} added successfully!`, 'success');
    };

    const handleRevertPayment = (bookingId: string, payment: Payment) => {
        setBookings(prev => prev.map(b => {
            if (b.bookingId === bookingId) {
                const updatedBooking = { ...b, payments: [...b.payments, payment] };
                if (viewingBooking?.bookingId === bookingId) {
                    setViewingBooking(updatedBooking);
                }
                return updatedBooking;
            }
            return b;
        }));
        addToast(`Payment of ₹${payment.amount.toLocaleString('en-IN')} reverted successfully.`, 'warning');
    };
    
    const handleAddExpense = (expense: Expense, newVendorCategoryId?: string) => {
        setAllExpenses(prev => [...prev, expense]);
        // Check if vendor is new
        if (!vendors.some(v => v.name.toLowerCase() === expense.vendor.toLowerCase())) {
            const newVendor: Vendor = {
                id: `v-${Date.now()}`,
                name: expense.vendor,
                categoryId: newVendorCategoryId || expenseCategories.find(c => c.name === 'Other')?.id || 'other',
            };
            setVendors(prev => [...prev, newVendor]);
            addToast(`New vendor "${expense.vendor}" added to category.`, 'info');
        }
        addToast('Expense added successfully!', 'success');
    };
    
    const handleRevertExpense = (revertedExpense: Expense) => {
        setAllExpenses(prev => [...prev, revertedExpense]);
        addToast(`Expense of ₹${revertedExpense.amount.toLocaleString('en-IN')} reverted successfully.`, 'warning');
    };

    const handleGoToExpenses = (bookingId: string) => {
        setBookingToPreselect(bookingId);
        setActiveTab('expenses');
    };

    const handleGoToAccounts = (bookingId: string) => {
        setBookingToPreselectInAccounts(bookingId);
        setActiveTab('accounts');
    };

    const handleGoToNewBookingWithDate = (date: string) => {
        setBookingToEdit(null); // Ensure we are not in edit mode
        setPreselectedDateForBooking(date);
        setActiveTab('new-booking');
    };
    
    const handleGoToBookingsWithFilter = (filter: Record<string, string>) => {
        setBookingFilterToPreselect(filter);
        setActiveTab('bookings');
    };

    // Conflict Detection for Industry-Ready standard
    const isDateOccupied = useCallback((date: string, shift: string, excludeBookingId?: string) => {
        return bookings.some(b => 
            b.eventDate === date && 
            b.shift === shift && 
            b.status !== 'Cancelled' &&
            b.bookingId !== excludeBookingId
        );
    }, [bookings]);

    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard':
                return <Dashboard 
                    bookings={bookings} 
                    allExpenses={allExpenses} 
                    currentSeason={currentSeason} 
                    setActiveTab={setActiveTab} 
                    onViewBooking={handleViewBooking} 
                    onGoToBookingsWithFilter={handleGoToBookingsWithFilter}
                />;
            case 'bookings':
                return <Bookings 
                    bookings={bookings} 
                    addToast={addToast} 
                    setBookings={setBookings} 
                    setAllExpenses={setAllExpenses}
                    onEditBooking={handleEditBooking}
                    onViewBooking={handleViewBooking}
                    servicesConfig={servicesConfig}
                    onGoToExpenses={handleGoToExpenses}
                    onGoToAccounts={handleGoToAccounts}
                    bookingFilterToPreselect={bookingFilterToPreselect}
                    onClearBookingFilter={() => setBookingFilterToPreselect(null)}
                />;
            case 'new-booking':
                return <NewBooking 
                    packages={packages} 
                    servicesConfig={servicesConfig} 
                    setServicesConfig={setServicesConfig}
                    addToast={addToast} 
                    setActiveTab={setActiveTab}
                    onAddBooking={handleAddBooking}
                    onUpdateBooking={handleUpdateBooking}
                    bookingToEdit={bookingToEdit}
                    onClearEdit={handleClearEdit}
                    key={bookingToEdit?.bookingId || 'new'} // Keep 'new' static if not editing to avoid remounts
                    bookings={bookings}
                    currentSeason={currentSeason}
                    preselectedDate={preselectedDateForBooking}
                    onClearPreselectedDate={() => setPreselectedDateForBooking(null)}
                    isDateOccupied={isDateOccupied}
                />;
            case 'calendar':
                return <Calendar 
                    bookings={bookings} 
                    setActiveTab={setActiveTab} 
                    currentSeason={currentSeason}
                    availableSeasons={availableSeasons}
                    addToast={addToast}
                    onViewBooking={handleViewBooking}
                    onGoToNewBookingWithDate={handleGoToNewBookingWithDate}
                />;
            case 'expenses':
                return <Expenses 
                    bookings={bookings} 
                    allExpenses={allExpenses}
                    addToast={addToast} 
                    bookingToPreselect={bookingToPreselect}
                    onClearPreselect={() => setBookingToPreselect(null)}
                    onAddExpense={handleAddExpense}
                    onRevertExpense={handleRevertExpense}
                    expenseCategories={expenseCategories}
                    vendors={vendors}
                    onViewBooking={handleViewBooking}
                />;
            case 'analytics':
                return <Analytics 
                    bookings={bookings} 
                    allExpenses={allExpenses} 
                    addToast={addToast} 
                    setActiveTab={setActiveTab}
                    onGoToBookingsWithFilter={handleGoToBookingsWithFilter}
                />;
            case 'control-center':
                return <ControlCenter 
                    packages={packages} 
                    setPackages={setPackages} 
                    servicesConfig={servicesConfig} 
                    setServicesConfig={setServicesConfig}
                    expenseCategories={expenseCategories}
                    setExpenseCategories={setExpenseCategories}
                    vendors={vendors}
                    setVendors={setVendors}
                    addToast={addToast}
                />;
            case 'accounts':
                return <Accounts 
                    transactions={allTransactions} 
                    expenseCategories={expenseCategories}
                    vendors={vendors}
                    currentSeason={currentSeason}
                    availableSeasons={availableSeasons}
                    bookings={bookings}
                    onViewBooking={handleViewBooking}
                    bookingToPreselect={bookingToPreselectInAccounts}
                    onClearPreselect={() => setBookingToPreselectInAccounts(null)}
                />;
            default:
                return <div>Select a tab</div>;
        }
    };

    if (!isAuthenticated) {
        return (
            <>
                <LoginScreen onLogin={handleLogin} />
                <ToastContainer toasts={toasts} removeToast={removeToast} />
            </>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-2 md:p-5">
            <div className="flex justify-end mb-2">
                <button onClick={handleLogout} className="text-sm text-[#8b4513] hover:underline flex items-center gap-1 font-bold">
                    🔒 Logout
                </button>
            </div>
            <Header bookings={bookings} currentSeason={currentSeason} setCurrentSeason={setCurrentSeason} />
            <TabNavigation tabs={TABS} activeTab={activeTab} setActiveTab={setActiveTab} />
            <main className="bg-white p-4 sm:p-8 rounded-2xl border-2 border-[#cd853f] shadow-lg min-h-[400px]">
                {renderContent()}
            </main>
            <ToastContainer toasts={toasts} removeToast={removeToast} />
            {viewingBooking && (
                <BookingDetailModal
                    booking={viewingBooking}
                    isOpen={!!viewingBooking}
                    onClose={() => setViewingBooking(null)}
                    servicesConfig={servicesConfig}
                    onAddPayment={handleAddPayment}
                    onRevertPayment={handleRevertPayment}
                    onGoToExpenses={handleGoToExpenses}
                />
            )}
        </div>
    );
};

export default App;