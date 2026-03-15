import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { 
  Plus, 
  Search, 
  Filter, 
  Calendar,
  TrendingDown,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Tag,
  MoreVertical,
  Eye,
  IndianRupee,
  Download,
  FileText,
  FileSpreadsheet,
  File
} from 'lucide-react';
import toast from 'react-hot-toast';
import AddExpenseModal from '../components/modals/AddExpenseModal';
import EditExpenseModal from '../components/modals/EditExpenseModal';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ExpenseRecord {
  id: number;
  amount: number;
  category: string;
  subcategory: string;
  date: string;
  note: string;
  created_at: string;
}

interface PaginationData {
  currentPage: number;
  totalPages: number;
  totalRecords: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface UserProfile {
  name: string;
  email: string;
  // Add other user fields as needed
}

const Expenses: React.FC = () => {
  const [records, setRecords] = useState<ExpenseRecord[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({
    currentPage: 1,
    totalPages: 1,
    totalRecords: 0,
    hasNext: false,
    hasPrev: false
  });
  const [categories, setCategories] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [totalAmount, setTotalAmount] = useState(0);
  const [userProfile, setUserProfile] = useState<UserProfile>({ name: '', email: '' });
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  
  // Edit modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<ExpenseRecord | null>(null);
  
  const [filters, setFilters] = useState({
    search: '',
    year: new Date().getFullYear().toString(),
    month: '',
    category: ''
  });
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchUserProfile();
    fetchCategories();
    fetchExpenseRecords();
  }, [currentPage, filters]);

  useEffect(() => {
    fetchTotalAmount();
  }, [filters]);

  useEffect(() => {
    if (records.length > 0) {
      const timeoutId = setTimeout(() => {
        fetchTotalAmount();
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [records.length]);

  const fetchUserProfile = async () => {
    try {
      const response = await axios.get('/auth/profile'); // Adjust endpoint as needed
      if (response.data.success) {
        setUserProfile(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      // Set default values if API call fails
      setUserProfile({ name: 'User', email: 'user@example.com' });
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get('/expense/categories');
      if (response.data.success) {
        setCategories(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchExpenseRecords = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(filters.search && { search: filters.search }),
        ...(filters.year && { year: filters.year }),
        ...(filters.month && { month: filters.month }),
        ...(filters.category && { category: filters.category })
      });

      const response = await axios.get(`/expense?${params}`);
      if (response.data.success) {
        setRecords(response.data.data.records);
        setPagination(response.data.data.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch expense records:', error);
      toast.error('Failed to load expense records');
    } finally {
      setLoading(false);
    }
  };

  const fetchTotalAmount = async () => {
    try {
      const params = new URLSearchParams({
        getAllRecords: 'true',
        ...(filters.search && { search: filters.search }),
        ...(filters.year && { year: filters.year }),
        ...(filters.month && { month: filters.month }),
        ...(filters.category && { category: filters.category })
      });

      try {
        const totalResponse = await axios.get(`/expense/total?${params}`);
        if (totalResponse.data.success && totalResponse.data.data.total !== undefined) {
          setTotalAmount(Number(totalResponse.data.data.total) || 0);
          return;
        }
      } catch (totalError) {
        console.log('Total endpoint not available, calculating from all records');
      }

      const allRecordsParams = new URLSearchParams({
        limit: '9999',
        page: '1',
        ...(filters.search && { search: filters.search }),
        ...(filters.year && { year: filters.year }),
        ...(filters.month && { month: filters.month }),
        ...(filters.category && { category: filters.category })
      });

      const response = await axios.get(`/expense?${allRecordsParams}`);
      if (response.data.success && response.data.data.records) {
        const total = response.data.data.records.reduce((sum, record) => {
          const amount = Number(record.amount) || 0;
          return sum + amount;
        }, 0);
        setTotalAmount(total);
      } else {
        setTotalAmount(0);
      }
    } catch (error) {
      console.error('Failed to fetch total amount:', error);
      const total = records.reduce((sum, record) => {
        const amount = Number(record.amount) || 0;
        return sum + amount;
      }, 0);
      setTotalAmount(total);
    }
  };

  // Fetch all records for export (respects current filters)
  const fetchAllRecordsForExport = async (): Promise<ExpenseRecord[]> => {
    try {
      const params = new URLSearchParams({
        limit: '9999', // Get all records
        page: '1',
        ...(filters.search && { search: filters.search }),
        ...(filters.year && { year: filters.year }),
        ...(filters.month && { month: filters.month }),
        ...(filters.category && { category: filters.category })
      });

      const response = await axios.get(`/expense?${params}`);
      if (response.data.success && response.data.data.records) {
        return response.data.data.records;
      }
      return [];
    } catch (error) {
      console.error('Failed to fetch all records for export:', error);
      throw error;
    }
  };

  // Generate filter description for export
  const getFilterDescription = () => {
    const filterParts = [];
    if (filters.year) filterParts.push(`Year: ${filters.year}`);
    if (filters.month) {
      const monthName = months.find(m => m.value === filters.month)?.label;
      filterParts.push(`Month: ${monthName}`);
    }
    if (filters.category) filterParts.push(`Category: ${filters.category}`);
    if (filters.search) filterParts.push(`Search: "${filters.search}"`);
    
    return filterParts.length > 0 ? filterParts.join(', ') : 'All Records';
  };

  // Export to CSV
  const exportToCSV = async () => {
    try {
      setExportLoading(true);
      const allRecords = await fetchAllRecordsForExport();
      
      if (allRecords.length === 0) {
        toast.error('No records to export');
        return;
      }

      const csvData = allRecords.map(record => ({
        'Date': formatDate(record.date),
        'Amount (₹)': record.amount,
        'Category': record.category,
        'Subcategory': record.subcategory || '',
        'Note': record.note || '',
        'Created At': formatDate(record.created_at)
      }));

      const ws = XLSX.utils.json_to_sheet(csvData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Expenses');

      const filterInfo = getFilterDescription();
      const fileName = `Expense_Report_${userProfile.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
      
      XLSX.writeFile(wb, fileName);
      toast.success(`CSV exported successfully! (${allRecords.length} records)`);
    } catch (error) {
      console.error('CSV export failed:', error);
      toast.error('Failed to export CSV');
    } finally {
      setExportLoading(false);
      setShowExportMenu(false);
    }
  };

  // Export to Excel
  const exportToExcel = async () => {
    try {
      setExportLoading(true);
      const allRecords = await fetchAllRecordsForExport();
      
      if (allRecords.length === 0) {
        toast.error('No records to export');
        return;
      }

      const wb = XLSX.utils.book_new();

      // Create summary sheet data
      const categoryTotals = allRecords.reduce((acc, record) => {
        const category = record.category || 'Uncategorized';
        acc[category] = (acc[category] || 0) + Number(record.amount);
        return acc;
      }, {} as Record<string, number>);

      const summaryData = [
        ['Expense Report Summary'],
        [''],
        ['Generated By', userProfile.name || 'User'],
        ['Email', userProfile.email || ''],
        ['Export Date', new Date().toLocaleDateString('en-IN')],
        ['Filter Applied', getFilterDescription()],
        ['Total Records', allRecords.length],
        ['Total Amount', `₹${totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`],
        [''],
        ['Category Breakdown'],
        ['Category', 'Amount (₹)'],
      ];

      // Add category breakdown rows
      Object.entries(categoryTotals).forEach(([category, total]) => {
        summaryData.push([category, total]);
      });

      const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
      
      // Set column widths for summary sheet
      summaryWs['!cols'] = [
        { wch: 20 }, // Column A
        { wch: 25 }  // Column B
      ];

      XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');

      // Create detailed records sheet
      const detailsData = allRecords.map(record => ({
        'Date': formatDate(record.date),
        'Amount': Number(record.amount) || 0,
        'Category': record.category || '',
        'Subcategory': record.subcategory || '',
        'Note': record.note || '',
        'Created At': formatDate(record.created_at)
      }));

      const detailsWs = XLSX.utils.json_to_sheet(detailsData);
      
      // Set column widths for details sheet
      detailsWs['!cols'] = [
        { wch: 12 }, // Date
        { wch: 15 }, // Amount
        { wch: 15 }, // Category
        { wch: 15 }, // Subcategory
        { wch: 30 }, // Note
        { wch: 15 }  // Created At
      ];

      XLSX.utils.book_append_sheet(wb, detailsWs, 'Detailed Records');

      const fileName = `Expense_Report_${(userProfile.name || 'User').replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
      
      toast.success(`Excel exported successfully! (${allRecords.length} records)`);
    } catch (error) {
      console.error('Excel export failed:', error);
      toast.error('Failed to export Excel');
    } finally {
      setExportLoading(false);
      setShowExportMenu(false);
    }
  };

  // Export to PDF
  const exportToPDF = async () => {
    try {
      setExportLoading(true);
      const allRecords = await fetchAllRecordsForExport();
      
      if (allRecords.length === 0) {
        toast.error('No records to export');
        return;
      }

      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(20);
      doc.setTextColor(220, 38, 38); // Red color
      doc.text('Expense Report', 20, 25);
      
      // User Info
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text(`Generated By: ${userProfile.name || 'User'}`, 20, 40);
      doc.text(`Email: ${userProfile.email || 'N/A'}`, 20, 50);
      doc.text(`Export Date: ${new Date().toLocaleDateString('en-IN')}`, 20, 60);
      doc.text(`Filter Applied: ${getFilterDescription()}`, 20, 70);
      
      // Summary Box
      doc.setFillColor(248, 250, 252); // Light gray background
      doc.rect(20, 80, 170, 30, 'F');
      doc.setFontSize(14);
      doc.setTextColor(220, 38, 38);
      doc.text(`Total Records: ${allRecords.length}`, 25, 95);
      doc.text(`Total Amount: ₹${totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 25, 105);

      // Category Breakdown
      const categoryTotals = allRecords.reduce((acc, record) => {
        const category = record.category || 'Uncategorized';
        acc[category] = (acc[category] || 0) + Number(record.amount);
        return acc;
      }, {} as Record<string, number>);

      if (Object.keys(categoryTotals).length > 0) {
        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        doc.text('Category Breakdown:', 20, 125);
        
        const categoryData = Object.entries(categoryTotals).map(([category, total]) => [
          category,
          `₹${total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
        ]);

        autoTable(doc, {
          startY: 130,
          head: [['Category', 'Amount']],
          body: categoryData,
          theme: 'grid',
          headStyles: { fillColor: [220, 38, 38], textColor: 255 },
          styles: { fontSize: 10 },
          margin: { left: 20, right: 20 }
        });
      }

      // Detailed Records Table
      const tableData = allRecords.map(record => [
        formatDate(record.date),
        `₹${Number(record.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
        record.category || '',
        record.subcategory || '-',
        (record.note && record.note.length > 30 ? record.note.substring(0, 30) + '...' : record.note) || '-'
      ]);

      doc.addPage();
      doc.setFontSize(16);
      doc.setTextColor(220, 38, 38);
      doc.text('Detailed Records', 20, 25);

      autoTable(doc, {
        startY: 35,
        head: [['Date', 'Amount', 'Category', 'Subcategory', 'Note']],
        body: tableData,
        theme: 'grid',
        headStyles: { 
          fillColor: [220, 38, 38], 
          textColor: 255,
          fontSize: 10,
          fontStyle: 'bold'
        },
        styles: { 
          fontSize: 9,
          cellPadding: 3
        },
        columnStyles: {
          0: { cellWidth: 25 },
          1: { cellWidth: 30, halign: 'right' },
          2: { cellWidth: 30 },
          3: { cellWidth: 30 },
          4: { cellWidth: 45 }
        },
        margin: { left: 20, right: 20 },
        didDrawPage: (data: any) => {
          // Add page numbers
          doc.setFontSize(10);
          doc.setTextColor(128, 128, 128);
          doc.text(
            `Page ${data.pageNumber}`,
            doc.internal.pageSize.width - 30,
            doc.internal.pageSize.height - 10
          );
        }
      });

      const fileName = `Expense_Report_${(userProfile.name || 'User').replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      
      toast.success(`PDF exported successfully! (${allRecords.length} records)`);
    } catch (error) {
      console.error('PDF export failed:', error);
      toast.error('Failed to export PDF');
    } finally {
      setExportLoading(false);
      setShowExportMenu(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this expense record?')) {
      return;
    }

    try {
      const response = await axios.delete(`/expense/${id}`);
      if (response.data.success) {
        toast.success('Expense record deleted successfully');
        setTimeout(() => {
          fetchExpenseRecords();
          fetchTotalAmount();
        }, 100);
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to delete expense record';
      toast.error(message);
    }
  };

  const handleEditExpense = (expense: ExpenseRecord) => {
    setSelectedExpense(expense);
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setSelectedExpense(null);
  };

  const handleEditSuccess = () => {
    setTimeout(() => {
      fetchExpenseRecords();
      fetchTotalAmount();
    }, 100);
  };

  const formatCurrency = (amount: number | string) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(numAmount)) {
      return '₹0.00';
    }
    
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numAmount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSuccess = () => {
    setShowAddModal(false);
    setTimeout(() => {
      fetchExpenseRecords();
      fetchTotalAmount();
    }, 100);
  };

  const months = [
    { value: '', label: 'All Months' },
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' }
  ];

  const years = Array.from({ length: 10 }, (_, i) => {
    const year = new Date().getFullYear() - i;
    return { value: year.toString(), label: year.toString() };
  });

  // Mobile action dropdown component
  const MobileActionDropdown = ({ record }: { record: ExpenseRecord }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <div className="relative">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-lg hover:bg-white/10 transition-colors"
        >
          <MoreVertical className="w-4 h-4" />
        </motion.button>
        
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-10" 
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute right-0 top-full mt-1 w-32 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20">
              <button
                onClick={() => {
                  handleEditExpense(record);
                  setIsOpen(false);
                }}
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-blue-600 dark:text-blue-400"
              >
                <Edit className="w-3 h-3" />
                Edit
              </button>
              <button
                onClick={() => {
                  handleDelete(record.id);
                  setIsOpen(false);
                }}
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-red-600 dark:text-red-400"
              >
                <Trash2 className="w-3 h-3" />
                Delete
              </button>
            </div>
          </>
        )}
      </div>
    );
  };

  // Export menu dropdown
  const ExportDropdown = () => (
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setShowExportMenu(!showExportMenu)}
        disabled={loading || exportLoading}
        className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl shadow-lg transition-all duration-200 text-sm sm:text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {exportLoading ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/30 border-t-white rounded-full"
          />
        ) : (
          <Download className="w-4 h-4 sm:w-5 sm:h-5" />
        )}
        <span className="hidden xs:inline">Export</span>
      </motion.button>
      
      {showExportMenu && !exportLoading && (
        <>
          <div 
            className="fixed inset-0 z-20" 
            onClick={() => setShowExportMenu(false)}
          />
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 z-30 overflow-hidden"
          >
            <div className="p-2">
              <div className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 mb-2">
                Export {getFilterDescription()}
              </div>
              
              <button
                onClick={exportToPDF}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-red-600 dark:text-red-400"
              >
                <FileText className="w-4 h-4" />
                <div>
                  <div className="font-medium">Export as PDF</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Formatted report with summary
                  </div>
                </div>
              </button>
              
              <button
                onClick={exportToExcel}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-green-600 dark:text-green-400"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <div>
                  <div className="font-medium">Export as Excel</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Spreadsheet with multiple sheets
                  </div>
                </div>
              </button>
              
              <button
                onClick={exportToCSV}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-blue-600 dark:text-blue-400"
              >
                <File className="w-4 h-4" />
                <div>
                  <div className="font-medium">Export as CSV</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Simple comma-separated values
                  </div>
                </div>
              </button>
            </div>
          </motion.div>
        </>
      )}
    </div>
  );

  return (
    <div className="min-h-screen p-3 sm:p-4 lg:p-6 xl:p-8">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header with Total Amount */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 dark:text-white leading-tight">
                  Expense Management
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1 text-xs sm:text-sm lg:text-base">
                  Track and categorize all your expenses
                </p>
              </div>
              
              {/* Dynamic Total Amount Display */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="bg-gradient-to-r from-red-500/20 to-pink-600/20 backdrop-blur-sm border border-red-500/30 rounded-xl px-4 py-3 sm:px-6 sm:py-4"
              >
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-2 bg-red-500/20 rounded-lg">
                    <IndianRupee className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                      Total Expense
                    </p>
                    <motion.p
                      key={totalAmount}
                      initial={{ scale: 1.1 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.2 }}
                      className="text-lg sm:text-xl lg:text-2xl font-bold text-red-600 dark:text-red-400"
                    >
                      {formatCurrency(totalAmount)}
                    </motion.p>
                  </div>
                </div>
                
                {/* Filter indication */}
                {(filters.search || filters.month || filters.category) && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-2 pt-2 border-t border-red-500/20"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Filtered total
                        {filters.month && ` • ${months.find(m => m.value === filters.month)?.label}`}
                        {filters.category && ` • ${filters.category}`}
                      </p>
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          fetchTotalAmount();
                          toast.success('Total refreshed');
                        }}
                        className="text-xs text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 ml-2"
                        title="Refresh total"
                      >
                        ↻
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3">
            <ExportDropdown />
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowAddModal(true)}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl shadow-lg transition-all duration-200 text-sm sm:text-base font-medium"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden xs:inline">Add Expense</span>
              <span className="xs:hidden">Add</span>
            </motion.button>
          </div>
        </div>

        {/* Mobile Filter Toggle */}
        <div className="block lg:hidden">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowFilters(!showFilters)}
            className="w-full flex items-center justify-between bg-white/20 dark:bg-gray-800/20 backdrop-blur-xl rounded-xl border border-white/20 dark:border-gray-700/30 px-4 py-3"
          >
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              <span className="text-sm font-medium">Filters</span>
            </div>
            <motion.div
              animate={{ rotate: showFilters ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronRight className="w-4 h-4" />
            </motion.div>
          </motion.button>
        </div>

        {/* Filters */}
        <motion.div
          initial={false}
          animate={{ 
            height: showFilters || window.innerWidth >= 1024 ? 'auto' : 0,
            opacity: showFilters || window.innerWidth >= 1024 ? 1 : 0
          }}
          transition={{ duration: 0.3 }}
          className={`bg-white/20 dark:bg-gray-800/20 backdrop-blur-xl rounded-xl sm:rounded-2xl border border-white/20 dark:border-gray-700/30 overflow-hidden ${showFilters || 'lg:block hidden'}`}
        >
          <div className="p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
              {/* Search */}
              <div className="sm:col-span-2 lg:col-span-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search notes..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-white/20 dark:border-gray-700/30 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 text-sm sm:text-base text-gray-800 dark:text-white placeholder-gray-500"
                />
              </div>

              {/* Category Filter */}
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                <select
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-white/20 dark:border-gray-700/30 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 text-sm sm:text-base text-gray-800 dark:text-white appearance-none"
                >
                  <option value="">All Categories</option>
                  {Object.keys(categories).map(category => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              {/* Year Filter */}
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                <select
                  value={filters.year}
                  onChange={(e) => handleFilterChange('year', e.target.value)}
                  className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-white/20 dark:border-gray-700/30 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 text-sm sm:text-base text-gray-800 dark:text-white appearance-none"
                >
                  {years.map(year => (
                    <option key={year.value} value={year.value}>
                      {year.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Month Filter */}
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                <select
                  value={filters.month}
                  onChange={(e) => handleFilterChange('month', e.target.value)}
                  className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-white/20 dark:border-gray-700/30 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 text-sm sm:text-base text-gray-800 dark:text-white appearance-none"
                >
                  {months.map(month => (
                    <option key={month.value} value={month.value}>
                      {month.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Total Records */}
              <div className="sm:col-span-2 lg:col-span-1 flex items-center justify-center bg-red-500/20 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3">
                <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 mr-2" />
                <span className="text-red-600 dark:text-red-400 font-medium text-sm sm:text-base">
                  {pagination.totalRecords} Records
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Records */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/20 dark:bg-gray-800/20 backdrop-blur-xl rounded-xl sm:rounded-2xl border border-white/20 dark:border-gray-700/30 overflow-hidden"
        >
          {loading ? (
            <div className="flex items-center justify-center h-48 sm:h-64">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-6 h-6 sm:w-8 sm:h-8 border-2 border-red-500/30 border-t-red-500 rounded-full"
              />
            </div>
          ) : records.length > 0 ? (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/10 dark:bg-gray-800/10">
                    <tr>
                      <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs lg:text-sm font-medium text-gray-700 dark:text-gray-300">
                        Date
                      </th>
                      <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs lg:text-sm font-medium text-gray-700 dark:text-gray-300">
                        Amount
                      </th>
                      <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs lg:text-sm font-medium text-gray-700 dark:text-gray-300">
                        Category
                      </th>
                      <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs lg:text-sm font-medium text-gray-700 dark:text-gray-300">
                        Note
                      </th>
                      <th className="px-4 lg:px-6 py-3 lg:py-4 text-right text-xs lg:text-sm font-medium text-gray-700 dark:text-gray-300">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10 dark:divide-gray-700/20">
                    {records.map((record, index) => (
                      <motion.tr
                        key={record.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="hover:bg-white/5 dark:hover:bg-gray-800/5 transition-colors"
                      >
                        <td className="px-4 lg:px-6 py-3 lg:py-4 text-xs lg:text-sm text-gray-800 dark:text-white">
                          {formatDate(record.date)}
                        </td>
                        <td className="px-4 lg:px-6 py-3 lg:py-4">
                          <span className="text-sm lg:text-lg font-semibold text-red-600 dark:text-red-400">
                            {formatCurrency(record.amount)}
                          </span>
                        </td>
                        <td className="px-4 lg:px-6 py-3 lg:py-4">
                          <div>
                            <span className="text-xs lg:text-sm font-medium text-gray-800 dark:text-white">
                              {record.category}
                            </span>
                            {record.subcategory && (
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {record.subcategory}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 lg:px-6 py-3 lg:py-4 text-xs lg:text-sm text-gray-600 dark:text-gray-400">
                          <div className="max-w-32 lg:max-w-48 truncate">
                            {record.note || '-'}
                          </div>
                        </td>
                        <td className="px-4 lg:px-6 py-3 lg:py-4 text-right">
                          <div className="flex items-center justify-end space-x-1 lg:space-x-2">
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleEditExpense(record)}
                              className="p-1.5 lg:p-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-600 dark:text-blue-400 transition-colors"
                              title="Edit expense"
                            >
                              <Edit className="w-3 h-3 lg:w-4 lg:h-4" />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleDelete(record.id)}
                              className="p-1.5 lg:p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-600 dark:text-red-400 transition-colors"
                              title="Delete expense"
                            >
                              <Trash2 className="w-3 h-3 lg:w-4 lg:h-4" />
                            </motion.button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-3 p-4">
                {records.map((record, index) => (
                  <motion.div
                    key={record.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm rounded-lg p-4 border border-white/20 dark:border-gray-700/30"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-lg font-bold text-red-600 dark:text-red-400">
                            {formatCurrency(record.amount)}
                          </span>
                          <MobileActionDropdown record={record} />
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                          {formatDate(record.date)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Tag className="w-3 h-3 text-gray-400" />
                        <span className="text-sm font-medium text-gray-800 dark:text-white">
                          {record.category}
                        </span>
                        {record.subcategory && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            • {record.subcategory}
                          </span>
                        )}
                      </div>
                      
                      {record.note && (
                        <div className="flex items-start gap-2">
                          <Eye className="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0" />
                          <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                            {record.note}
                          </p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="px-4 sm:px-6 py-4 border-t border-white/10 dark:border-gray-700/20">
                  {/* Mobile Pagination */}
                  <div className="flex items-center justify-between sm:hidden">
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handlePageChange(pagination.currentPage - 1)}
                      disabled={!pagination.hasPrev}
                      className="px-3 py-2 rounded-lg bg-white/10 dark:bg-gray-800/10 hover:bg-white/20 dark:hover:bg-gray-800/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                    >
                      Previous
                    </motion.button>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {pagination.currentPage} / {pagination.totalPages}
                    </span>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handlePageChange(pagination.currentPage + 1)}
                      disabled={!pagination.hasNext}
                      className="px-3 py-2 rounded-lg bg-white/10 dark:bg-gray-800/10 hover:bg-white/20 dark:hover:bg-gray-800/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                    >
                      Next
                    </motion.button>
                  </div>

                  {/* Desktop Pagination */}
                  <div className="hidden sm:flex items-center justify-between">
                    <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                      Showing {((pagination.currentPage - 1) * 10) + 1} to {Math.min(pagination.currentPage * 10, pagination.totalRecords)} of {pagination.totalRecords} results
                    </div>
                    <div className="flex items-center space-x-1 sm:space-x-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handlePageChange(pagination.currentPage - 1)}
                        disabled={!pagination.hasPrev}
                        className="p-1.5 sm:p-2 rounded-lg bg-white/10 dark:bg-gray-800/10 hover:bg-white/20 dark:hover:bg-gray-800/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" />
                      </motion.button>
                      
                      {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
                        let page;
                        if (pagination.totalPages <= 5) {
                          page = i + 1;
                        } else if (pagination.currentPage <= 3) {
                          page = i + 1;
                        } else if (pagination.currentPage >= pagination.totalPages - 2) {
                          page = pagination.totalPages - 4 + i;
                        } else {
                          page = pagination.currentPage - 2 + i;
                        }
                        
                        return (
                          <motion.button
                            key={page}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handlePageChange(page)}
                            className={`px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                              page === pagination.currentPage
                                ? 'bg-red-500 text-white'
                                : 'bg-white/10 dark:bg-gray-800/10 hover:bg-white/20 dark:hover:bg-gray-800/20 text-gray-700 dark:text-gray-300'
                            }`}
                          >
                            {page}
                          </motion.button>
                        );
                      })}
                      
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handlePageChange(pagination.currentPage + 1)}
                        disabled={!pagination.hasNext}
                        className="p-1.5 sm:p-2 rounded-lg bg-white/10 dark:bg-gray-800/10 hover:bg-white/20 dark:hover:bg-gray-800/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
                      </motion.button>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8 sm:py-12 px-4">
              <TrendingDown className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-base sm:text-lg font-medium text-gray-800 dark:text-white mb-2">
                No Expense Records Found
              </h3>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4 sm:mb-6">
                Start tracking your expenses by adding your first record.
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowAddModal(true)}
                className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl shadow-lg transition-all duration-200 text-sm sm:text-base"
              >
                Add Your First Expense
              </motion.button>
            </div>
          )}
        </motion.div>

        {/* Add Expense Modal */}
        <AddExpenseModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSuccess={handleSuccess}
        />

        {/* Edit Expense Modal */}
        <EditExpenseModal
          isOpen={showEditModal}
          onClose={handleCloseEditModal}
          onSuccess={handleEditSuccess}
          expenseData={selectedExpense}
        />
      </div>
    </div>
  );
};

export default Expenses;