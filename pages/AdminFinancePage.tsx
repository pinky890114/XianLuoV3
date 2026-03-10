
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, query, addDoc, deleteDoc, doc, Timestamp, orderBy, where, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Product, BadgeOrder, DollOrder } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import Modal from '../components/Modal';

// --- Types ---

interface Expense {
    id: string;
    date: Timestamp;
    amount: number;
    category: string;
    relatedSeriesId?: string;
    note: string;
}

interface Income {
    id: string;
    date: Timestamp;
    amount: number;
    category: string; // e.g., '市集現金', '現場轉帳', '其他收入'
    relatedSeriesId?: string;
    note: string;
}

const EXPENSE_CATEGORIES = ['廠商製作費', '國際運費', '國內運費', '包材雜支', '退款', '大貨均攤', '其他支出'];
const DEFAULT_INCOME_CATEGORIES = ['市集現金', '現場轉帳', '其他收入'];

// ...

const AdminFinancePage: React.FC = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [incomes, setIncomes] = useState<Income[]>([]); // New state for manual incomes
    const [products, setProducts] = useState<Product[]>([]);
    const [incomeCategories, setIncomeCategories] = useState<string[]>(DEFAULT_INCOME_CATEGORIES);
    const [badgeOrders, setBadgeOrders] = useState<BadgeOrder[]>([]);
    const [dollOrders, setDollOrders] = useState<DollOrder[]>([]);

    // Modal States
    const [isAddExpenseModalOpen, setIsAddExpenseModalOpen] = useState(false);
    const [isAddIncomeModalOpen, setIsAddIncomeModalOpen] = useState(false); // New modal state
    const [isManageCategoriesModalOpen, setIsManageCategoriesModalOpen] = useState(false);
    const [editingCategories, setEditingCategories] = useState<string[]>([]);
    const [newCategoryInput, setNewCategoryInput] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form States (Expense)
    const [newExpenseDate, setNewExpenseDate] = useState(new Date().toISOString().split('T')[0]);
    const [newExpenseAmount, setNewExpenseAmount] = useState<number | ''>('');
    const [newExpenseCategory, setNewExpenseCategory] = useState(EXPENSE_CATEGORIES[0]);
    const [newExpenseSeriesId, setNewExpenseSeriesId] = useState('');
    const [newExpenseNote, setNewExpenseNote] = useState('');

    // Form States (Income) - Reuse some or create new? Let's create new for clarity
    const [newIncomeDate, setNewIncomeDate] = useState(new Date().toISOString().split('T')[0]);
    const [newIncomeAmount, setNewIncomeAmount] = useState<number | ''>('');
    const [newIncomeCategory, setNewIncomeCategory] = useState(DEFAULT_INCOME_CATEGORIES[0]);
    const [newIncomeSeriesId, setNewIncomeSeriesId] = useState('');
    const [newIncomeNote, setNewIncomeNote] = useState('');

    // Info Modal
    const [infoModalState, setInfoModalState] = useState<{ title: string; message: React.ReactNode } | null>(null);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            // 1. Fetch Expenses
            const expenseQuery = query(collection(db, 'expenses'), orderBy('date', 'desc'));
            const expenseSnap = await getDocs(expenseQuery);
            const expenseList = expenseSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense));
            setExpenses(expenseList);

            // 2. Fetch Incomes (Manual)
            const incomeQuery = query(collection(db, 'incomes'), orderBy('date', 'desc'));
            const incomeSnap = await getDocs(incomeQuery);
            const incomeList = incomeSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Income));
            setIncomes(incomeList);

            // 3. Fetch Products
            const productSnap = await getDocs(collection(db, 'products'));
            const productList = productSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
            setProducts(productList);

            // 4. Fetch Orders
            const badgeSnap = await getDocs(collection(db, 'badgeOrders'));
            const badgeList = badgeSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as BadgeOrder));
            setBadgeOrders(badgeList);

            const dollSnap = await getDocs(collection(db, 'dollOrders'));
            const dollList = dollSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as DollOrder));
            setDollOrders(dollList);

            // 5. Fetch Settings (Income Categories)
            const settingsRef = doc(db, 'settings', 'finance');
            const settingsSnap = await getDoc(settingsRef);
            if (settingsSnap.exists() && settingsSnap.data().incomeCategories) {
                setIncomeCategories(settingsSnap.data().incomeCategories);
                // Update default selection if needed
                if (settingsSnap.data().incomeCategories.length > 0) {
                    setNewIncomeCategory(settingsSnap.data().incomeCategories[0]);
                }
            }

        } catch (error) {
            console.error("Error fetching finance data:", error);
            setInfoModalState({ title: '錯誤', message: '無法載入財務資料' });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // --- Calculations ---

    const seriesAnalysis = useMemo(() => {
        return products.map(product => {
            // 1. Revenue (Orders + Manual Income)
            const productOrders = badgeOrders.filter(order => 
                order.productTitle && order.productTitle.includes(product.seriesName)
            );
            const orderRevenue = productOrders.reduce((sum, order) => sum + (order.price || 0), 0);
            
            const productIncomes = incomes.filter(i => i.relatedSeriesId === product.id);
            const manualRevenue = productIncomes.reduce((sum, i) => sum + (i.amount || 0), 0);

            const totalRevenue = orderRevenue + manualRevenue;
            const orderCount = productOrders.length;

            // 2. Expenses
            const productExpenses = expenses.filter(e => e.relatedSeriesId === product.id);
            const expenseTotal = productExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);

            // 3. Profit
            const profit = totalRevenue - expenseTotal;

            return {
                id: product.id,
                name: `[${product.categoryId}] ${product.seriesName}`,
                revenue: totalRevenue,
                expense: expenseTotal,
                profit,
                orderCount,
                manualRevenue // Optional: for debugging or detailed view
            };
        }).sort((a, b) => b.revenue - a.revenue);
    }, [products, badgeOrders, expenses, incomes]);

    const financialSummary = useMemo(() => {
        // 1. Total Revenue
        const badgeRevenue = badgeOrders.reduce((sum, order) => sum + (order.price || 0), 0);
        const dollRevenue = dollOrders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
        const manualRevenue = incomes.reduce((sum, income) => sum + (income.amount || 0), 0);
        
        const totalRevenue = badgeRevenue + dollRevenue + manualRevenue;

        // 2. Total Expenses
        const totalExpenses = expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);

        // 3. Net Profit
        const netProfit = totalRevenue - totalExpenses;

        return {
            totalRevenue,
            totalExpenses,
            netProfit,
            badgeRevenue,
            dollRevenue,
            manualRevenue
        };
    }, [badgeOrders, dollOrders, expenses, incomes]);

    // --- Handlers ---

    const openManageCategories = () => {
        setEditingCategories([...incomeCategories]);
        setNewCategoryInput('');
        setIsManageCategoriesModalOpen(true);
    };

    const addCategoryToEditing = () => {
        const val = newCategoryInput.trim();
        if (val && !editingCategories.includes(val)) {
            setEditingCategories([...editingCategories, val]);
            setNewCategoryInput('');
        }
    };

    const removeCategoryFromEditing = (cat: string) => {
        setEditingCategories(editingCategories.filter(c => c !== cat));
    };

    const saveCategories = async () => {
        setIsSubmitting(true);
        try {
            await setDoc(doc(db, 'settings', 'finance'), { incomeCategories: editingCategories }, { merge: true });
            setIncomeCategories(editingCategories);
            setIsManageCategoriesModalOpen(false);
            setInfoModalState({ title: '成功', message: '營收類別已更新' });
            
            // If current selected category is removed, reset to first available
            if (!editingCategories.includes(newIncomeCategory) && editingCategories.length > 0) {
                setNewIncomeCategory(editingCategories[0]);
            }
        } catch (error) {
            console.error("Error saving categories:", error);
            setInfoModalState({ title: '錯誤', message: '儲存失敗' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAddExpense = async () => {
        // ... (existing logic)
        if (!newExpenseAmount || !newExpenseDate) {
            setInfoModalState({ title: '提示', message: '請輸入日期與金額' });
            return;
        }

        setIsSubmitting(true);
        try {
            const expenseData = {
                date: Timestamp.fromDate(new Date(newExpenseDate)),
                amount: Number(newExpenseAmount),
                category: newExpenseCategory,
                relatedSeriesId: newExpenseSeriesId || null,
                note: newExpenseNote || ''
            };

            await addDoc(collection(db, 'expenses'), expenseData);
            
            setInfoModalState({ title: '成功', message: '支出已記錄' });
            setIsAddExpenseModalOpen(false);
            
            // Reset Form
            setNewExpenseAmount('');
            setNewExpenseNote('');
            setNewExpenseSeriesId('');
            setNewExpenseCategory(EXPENSE_CATEGORIES[0]);
            
            fetchData();
        } catch (error) {
            console.error("Error adding expense:", error);
            setInfoModalState({ title: '錯誤', message: '新增支出失敗' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAddIncome = async () => {
        if (!newIncomeAmount || !newIncomeDate) {
            setInfoModalState({ title: '提示', message: '請輸入日期與金額' });
            return;
        }

        setIsSubmitting(true);
        try {
            const incomeData = {
                date: Timestamp.fromDate(new Date(newIncomeDate)),
                amount: Number(newIncomeAmount),
                category: newIncomeCategory,
                relatedSeriesId: newIncomeSeriesId || null,
                note: newIncomeNote || ''
            };

            await addDoc(collection(db, 'incomes'), incomeData);
            
            setInfoModalState({ title: '成功', message: '營收已記錄' });
            setIsAddIncomeModalOpen(false);
            
            // Reset Form
            setNewIncomeAmount('');
            setNewIncomeNote('');
            setNewIncomeSeriesId('');
            setNewIncomeCategory(incomeCategories[0] || DEFAULT_INCOME_CATEGORIES[0]);
            
            fetchData();
        } catch (error) {
            console.error("Error adding income:", error);
            setInfoModalState({ title: '錯誤', message: '新增營收失敗' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteExpense = async (id: string) => {
        if (!window.confirm('確定要刪除這筆支出紀錄嗎？')) return;
        try {
            await deleteDoc(doc(db, 'expenses', id));
            setExpenses(prev => prev.filter(e => e.id !== id));
        } catch (error) {
            console.error("Error deleting expense:", error);
            setInfoModalState({ title: '錯誤', message: '刪除失敗' });
        }
    };

    const handleDeleteIncome = async (id: string) => {
        if (!window.confirm('確定要刪除這筆營收紀錄嗎？')) return;
        try {
            await deleteDoc(doc(db, 'incomes', id));
            setIncomes(prev => prev.filter(i => i.id !== id));
        } catch (error) {
            console.error("Error deleting income:", error);
            setInfoModalState({ title: '錯誤', message: '刪除失敗' });
        }
    };

    // Helper to find series name
    const getSeriesName = (id?: string) => {
        if (!id) return '-';
        const product = products.find(p => p.id === id);
        return product ? `[${product.categoryId}] ${product.seriesName}` : '未知系列';
    };

    if (isLoading) return <div className="flex justify-center p-20"><LoadingSpinner /></div>;

    return (
        <div className="container mx-auto p-4 md:p-8 min-h-screen">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <Link to="/admin" className="text-siam-blue hover:text-siam-dark transition-colors mb-2 inline-flex items-center space-x-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                        <span>返回管理選單</span>
                    </Link>
                    <h1 className="text-4xl font-bold text-siam-dark">財務報表</h1>
                </div>
                <div className="flex gap-3">
                    <button 
                        onClick={openManageCategories}
                        className="bg-gray-600 text-white px-4 py-3 rounded-lg font-bold shadow-md hover:bg-gray-700 transition-all flex items-center gap-2"
                        title="管理營收類別"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
                    </button>
                    <button 
                        onClick={() => setIsAddIncomeModalOpen(true)}
                        className="bg-green-600 text-white px-6 py-3 rounded-lg font-bold shadow-md hover:bg-green-700 transition-all flex items-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                        手動新增營收
                    </button>
                    <button 
                        onClick={() => setIsAddExpenseModalOpen(true)}
                        className="bg-red-600 text-white px-6 py-3 rounded-lg font-bold shadow-md hover:bg-red-700 transition-all flex items-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                        記一筆支出
                    </button>
                </div>
            </header>

            {/* Dashboard Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
                    <h3 className="text-gray-500 font-bold text-sm uppercase tracking-wider mb-2">總營收 (Revenue)</h3>
                    <p className="text-3xl font-bold text-green-600">${financialSummary.totalRevenue.toLocaleString()}</p>
                    <div className="mt-2 text-xs text-gray-400 flex flex-wrap gap-2">
                        <span>地攤: ${financialSummary.badgeRevenue.toLocaleString()}</span>
                        <span>|</span>
                        <span>小餅: ${financialSummary.dollRevenue.toLocaleString()}</span>
                        <span>|</span>
                        <span>手動: ${financialSummary.manualRevenue.toLocaleString()}</span>
                    </div>
                </div>
                {/* ... (other cards same as before) */}
                <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
                    <h3 className="text-gray-500 font-bold text-sm uppercase tracking-wider mb-2">總支出 (Expenses)</h3>
                    <p className="text-3xl font-bold text-red-600">${financialSummary.totalExpenses.toLocaleString()}</p>
                    <p className="mt-2 text-xs text-gray-400">含製作費、運費等成本</p>
                </div>
                <div className={`bg-white p-6 rounded-xl shadow border ${financialSummary.netProfit >= 0 ? 'border-green-100' : 'border-red-100'}`}>
                    <h3 className="text-gray-500 font-bold text-sm uppercase tracking-wider mb-2">淨利 (Net Profit)</h3>
                    <p className={`text-3xl font-bold ${financialSummary.netProfit >= 0 ? 'text-siam-blue' : 'text-red-500'}`}>
                        ${financialSummary.netProfit.toLocaleString()}
                    </p>
                    <p className="mt-2 text-xs text-gray-400">總營收 - 總支出</p>
                </div>
            </div>

            {/* Series Analysis Table */}
            {/* ... (keep existing series analysis table) */}
            <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden mb-10">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-siam-dark">各系列損益分析 (Series Analysis)</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">系列名稱</th>
                                <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">訂單數</th>
                                <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">總營收</th>
                                <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">總支出</th>
                                <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">淨利</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {seriesAnalysis.length > 0 ? (
                                seriesAnalysis.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {item.name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                                            {item.orderCount}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-bold text-right">
                                            ${item.revenue.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-bold text-right">
                                            ${item.expense.toLocaleString()}
                                        </td>
                                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold text-right ${item.profit >= 0 ? 'text-siam-blue' : 'text-red-500'}`}>
                                            ${item.profit.toLocaleString()}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                                        尚無系列資料
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Manual Incomes List */}
            <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden mb-10">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-siam-dark">手動營收紀錄 (Manual Revenue)</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">日期</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">類別</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">金額</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">關聯系列</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">備註</th>
                                <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">操作</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {incomes.length > 0 ? (
                                incomes.map((income) => (
                                    <tr key={income.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {income.date.toDate().toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                {income.category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">
                                            ${income.amount.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {getSeriesName(income.relatedSeriesId)}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                                            {income.note || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button onClick={() => handleDeleteIncome(income.id)} className="text-red-600 hover:text-red-900">刪除</button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                                        目前沒有手動營收紀錄
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Expenses List */}
            <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-siam-dark">支出紀錄 (Expenses)</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">日期</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">類別</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">金額</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">關聯系列</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">備註</th>
                                <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">操作</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {expenses.length > 0 ? (
                                expenses.map((expense) => (
                                    <tr key={expense.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {expense.date.toDate().toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                                {expense.category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-red-600">
                                            ${expense.amount.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {getSeriesName(expense.relatedSeriesId)}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                                            {expense.note || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button onClick={() => handleDeleteExpense(expense.id)} className="text-red-600 hover:text-red-900">刪除</button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                                        目前沒有支出紀錄
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Expense Modal */}
            <Modal isOpen={isAddExpenseModalOpen} onClose={() => setIsAddExpenseModalOpen(false)} title="新增支出紀錄">
                {/* ... (existing modal content) */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">日期</label>
                        <input 
                            type="date" 
                            value={newExpenseDate} 
                            onChange={(e) => setNewExpenseDate(e.target.value)}
                            className="w-full p-2 border rounded focus:ring-2 focus:ring-siam-blue outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">金額</label>
                        <input 
                            type="number" 
                            value={newExpenseAmount} 
                            onChange={(e) => setNewExpenseAmount(e.target.value ? Number(e.target.value) : '')}
                            placeholder="輸入支出金額"
                            className="w-full p-2 border rounded focus:ring-2 focus:ring-siam-blue outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">支出類別</label>
                        <select 
                            value={newExpenseCategory} 
                            onChange={(e) => setNewExpenseCategory(e.target.value)}
                            className="w-full p-2 border rounded bg-white focus:ring-2 focus:ring-siam-blue outline-none"
                        >
                            {EXPENSE_CATEGORIES.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">關聯系列 (選填)</label>
                        <select 
                            value={newExpenseSeriesId} 
                            onChange={(e) => setNewExpenseSeriesId(e.target.value)}
                            className="w-full p-2 border rounded bg-white focus:ring-2 focus:ring-siam-blue outline-none"
                        >
                            <option value="">-- 無關聯 --</option>
                            {products.map(p => (
                                <option key={p.id} value={p.id}>[{p.categoryId}] {p.seriesName}</option>
                            ))}
                        </select>
                        <p className="text-xs text-gray-500 mt-1">若此支出屬於特定商品系列（如該系列的樣品費），請選擇以利後續分析。</p>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">備註</label>
                        <textarea 
                            value={newExpenseNote} 
                            onChange={(e) => setNewExpenseNote(e.target.value)}
                            placeholder="例如：廠商尾款、國際運費補款..."
                            rows={3}
                            className="w-full p-2 border rounded focus:ring-2 focus:ring-siam-blue outline-none"
                        />
                    </div>
                    
                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <button onClick={() => setIsAddExpenseModalOpen(false)} className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200">取消</button>
                        <button 
                            onClick={handleAddExpense} 
                            disabled={isSubmitting}
                            className="px-6 py-2 bg-red-600 text-white rounded font-bold hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
                        >
                            {isSubmitting ? <LoadingSpinner /> : '確認新增'}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Add Income Modal */}
            <Modal isOpen={isAddIncomeModalOpen} onClose={() => setIsAddIncomeModalOpen(false)} title="新增手動營收">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">日期</label>
                        <input 
                            type="date" 
                            value={newIncomeDate} 
                            onChange={(e) => setNewIncomeDate(e.target.value)}
                            className="w-full p-2 border rounded focus:ring-2 focus:ring-siam-blue outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">金額</label>
                        <input 
                            type="number" 
                            value={newIncomeAmount} 
                            onChange={(e) => setNewIncomeAmount(e.target.value ? Number(e.target.value) : '')}
                            placeholder="輸入營收金額"
                            className="w-full p-2 border rounded focus:ring-2 focus:ring-siam-blue outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">營收類別</label>
                        <select 
                            value={newIncomeCategory} 
                            onChange={(e) => setNewIncomeCategory(e.target.value)}
                            className="w-full p-2 border rounded bg-white focus:ring-2 focus:ring-siam-blue outline-none"
                        >
                            {incomeCategories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">關聯系列 (選填)</label>
                        <select 
                            value={newIncomeSeriesId} 
                            onChange={(e) => setNewIncomeSeriesId(e.target.value)}
                            className="w-full p-2 border rounded bg-white focus:ring-2 focus:ring-siam-blue outline-none"
                        >
                            <option value="">-- 無關聯 --</option>
                            {products.map(p => (
                                <option key={p.id} value={p.id}>[{p.categoryId}] {p.seriesName}</option>
                            ))}
                        </select>
                        <p className="text-xs text-gray-500 mt-1">若此營收屬於特定商品系列（如市集販售某系列），請選擇以利後續分析。</p>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">備註</label>
                        <textarea 
                            value={newIncomeNote} 
                            onChange={(e) => setNewIncomeNote(e.target.value)}
                            placeholder="例如：CWT60 D1 現場販售..."
                            rows={3}
                            className="w-full p-2 border rounded focus:ring-2 focus:ring-siam-blue outline-none"
                        />
                    </div>
                    
                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <button onClick={() => setIsAddIncomeModalOpen(false)} className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200">取消</button>
                        <button 
                            onClick={handleAddIncome} 
                            disabled={isSubmitting}
                            className="px-6 py-2 bg-green-600 text-white rounded font-bold hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                        >
                            {isSubmitting ? <LoadingSpinner /> : '確認新增'}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Manage Categories Modal */}
            <Modal isOpen={isManageCategoriesModalOpen} onClose={() => setIsManageCategoriesModalOpen(false)} title="管理營收類別">
                <div className="space-y-4">
                    <div className="flex gap-2">
                        <input 
                            type="text" 
                            value={newCategoryInput} 
                            onChange={(e) => setNewCategoryInput(e.target.value)}
                            placeholder="輸入新類別名稱"
                            className="flex-1 p-2 border rounded focus:ring-2 focus:ring-siam-blue outline-none"
                            onKeyDown={(e) => e.key === 'Enter' && addCategoryToEditing()}
                        />
                        <button 
                            onClick={addCategoryToEditing}
                            className="bg-siam-blue text-white px-4 py-2 rounded hover:bg-siam-dark"
                        >
                            新增
                        </button>
                    </div>
                    <div className="border rounded-lg overflow-hidden">
                        <ul className="divide-y divide-gray-200 max-h-60 overflow-y-auto">
                            {editingCategories.map(cat => (
                                <li key={cat} className="p-3 flex justify-between items-center hover:bg-gray-50">
                                    <span>{cat}</span>
                                    <button 
                                        onClick={() => removeCategoryFromEditing(cat)}
                                        className="text-red-500 hover:text-red-700 p-1"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                    </button>
                                </li>
                            ))}
                            {editingCategories.length === 0 && (
                                <li className="p-4 text-center text-gray-500 text-sm">暫無類別</li>
                            )}
                        </ul>
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <button onClick={() => setIsManageCategoriesModalOpen(false)} className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200">取消</button>
                        <button 
                            onClick={saveCategories} 
                            disabled={isSubmitting}
                            className="px-6 py-2 bg-siam-blue text-white rounded font-bold hover:bg-siam-dark disabled:opacity-50"
                        >
                            {isSubmitting ? <LoadingSpinner /> : '儲存變更'}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Info Modal */}
            {infoModalState && (
                <Modal isOpen={!!infoModalState} onClose={() => setInfoModalState(null)} title={infoModalState.title}>
                    <div className="space-y-4">
                        <p className="text-gray-700">{infoModalState.message}</p>
                        <div className="flex justify-end">
                            <button onClick={() => setInfoModalState(null)} className="px-4 py-2 bg-siam-blue text-white rounded">確定</button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default AdminFinancePage;
