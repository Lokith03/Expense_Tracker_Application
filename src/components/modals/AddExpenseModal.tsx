import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, IndianRupee, FileText, Tag, Hash } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface Category {
  id: number;
  name: string;
  type: 'income' | 'expense';
  color: string;
  subcategories?: string; // JSON string
}

const DEFAULT_CATEGORIES: Category[] = [
  { id: -1, name: 'Food & Dining', type: 'expense', color: '#EF4444', subcategories: JSON.stringify(['Restaurant', 'Fast Food', 'Groceries', 'Cafe', 'Beverages']) },
  { id: -2, name: 'Transportation', type: 'expense', color: '#F59E0B', subcategories: JSON.stringify(['Fuel', 'Public Transport', 'Taxi/Uber', 'Vehicle Maintenance', 'Parking']) },
  { id: -3, name: 'Housing', type: 'expense', color: '#10B981', subcategories: JSON.stringify(['Rent', 'Utilities', 'Internet', 'Maintenance', 'Insurance']) },
  { id: -4, name: 'Healthcare', type: 'expense', color: '#14B8A6', subcategories: JSON.stringify(['Doctor', 'Medicine', 'Dental', 'Hospital', 'Health Insurance']) },
  { id: -5, name: 'Entertainment', type: 'expense', color: '#8B5CF6', subcategories: JSON.stringify(['Movies', 'Games', 'Sports', 'Hobbies', 'Subscriptions']) },
  { id: -6, name: 'Shopping', type: 'expense', color: '#EC4899', subcategories: JSON.stringify(['Clothing', 'Electronics', 'Books', 'Gifts', 'Personal Care']) },
  { id: -7, name: 'Education', type: 'expense', color: '#6366F1', subcategories: JSON.stringify(['Courses', 'Books', 'Training', 'Certification', 'Online Learning']) },
  { id: -8, name: 'Investments', type: 'expense', color: '#F97316', subcategories: JSON.stringify(['Mutual Funds', 'SIP', 'Stocks', 'Fixed Deposits', 'Crypto']) },
  { id: -9, name: 'Travel', type: 'expense', color: '#0EA5E9', subcategories: JSON.stringify(['Flight', 'Hotel', 'Local Transport', 'Food', 'Activities']) },
  { id: -10, name: 'Bills & Utilities', type: 'expense', color: '#3B82F6', subcategories: JSON.stringify(['Electricity', 'Water', 'Gas', 'Phone', 'Internet']) },
  { id: -11, name: 'Personal', type: 'expense', color: '#D946EF', subcategories: JSON.stringify(['Haircut', 'Spa', 'Gym', 'Medical', 'Miscellaneous']) },
  { id: -12, name: 'Family', type: 'expense', color: '#FB7185', subcategories: JSON.stringify(['Kids', 'Parents', 'Spouse', 'Relatives', 'Pets']) },
  { id: -13, name: 'Others', type: 'expense', color: '#6B7280', subcategories: JSON.stringify(['Charity', 'Taxes', 'Loans', 'Miscellaneous']) },
  { id: -14, name: 'Uncategorized', type: 'expense', color: '#9CA3AF', subcategories: JSON.stringify([]) }
];

const AddExpenseModal: React.FC<AddExpenseModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    amount: '',
    category: '',
    subcategory: '',
    date: new Date().toISOString().split('T')[0],
    note: ''
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [availableSubcategories, setAvailableSubcategories] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen]);

  useEffect(() => {
    // Update available subcategories when category changes
    const selectedCat = categories.find(c => c.name === formData.category);
    if (selectedCat && selectedCat.subcategories) {
      try {
        setAvailableSubcategories(JSON.parse(selectedCat.subcategories));
      } catch (e) {
        setAvailableSubcategories([]);
      }
    } else {
      setAvailableSubcategories([]);
    }
  }, [formData.category, categories]);

  const fetchCategories = async () => {
    try {
      const response = await axios.get('/pcategories');
      if (response.data.success && response.data.categories.length > 0) {
        const expenseCategories = response.data.categories.filter((c: Category) => c.type === 'expense');

        // Merge with defaults: if DB category exists but has no subcategories, use default ones
        const mergedCategories = expenseCategories.map((c: Category) => {
          const defaultMatch = DEFAULT_CATEGORIES.find(d => d.name === c.name);
          if (defaultMatch && (!c.subcategories || c.subcategories === '[]' || c.subcategories === 'null')) {
            return { ...c, subcategories: defaultMatch.subcategories };
          }
          return c;
        });

        const userCategoryNames = new Set(mergedCategories.map((c: Category) => c.name));
        const relevantDefaults = DEFAULT_CATEGORIES.filter(d => !userCategoryNames.has(d.name));

        setCategories([...mergedCategories, ...relevantDefaults]);
      } else {
        setCategories(DEFAULT_CATEGORIES);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      setCategories(DEFAULT_CATEGORIES);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (!formData.category) {
      toast.error('Please select a category');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('/expense', {
        amount: parseFloat(formData.amount),
        category: formData.category,
        subcategory: formData.subcategory || null,
        date: formData.date,
        note: formData.note || null
      });

      if (response.data.success) {
        toast.success('Expense added successfully! 💸');
        setFormData({
          amount: '',
          category: '',
          subcategory: '',
          date: new Date().toISOString().split('T')[0],
          note: ''
        });
        onSuccess();
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to add expense';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      ...(name === 'category' ? { subcategory: '' } : {})
    }));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-white/20 dark:bg-gray-800/20 backdrop-blur-md rounded-2xl border border-white/20 dark:border-gray-700/30 p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                Add Expense 💸
              </h2>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="p-2 rounded-full hover:bg-white/10 dark:hover:bg-gray-800/10 transition-colors"
              >
                <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </motion.button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Amount (INR)
                </label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleChange}
                    step="0.01"
                    min="0"
                    required
                    className="w-full pl-10 pr-4 py-3 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-white/20 dark:border-gray-700/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 text-gray-800 dark:text-white placeholder-gray-500"
                    placeholder="Enter amount"
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category
                </label>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-4 py-3 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-white/20 dark:border-gray-700/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 text-gray-800 dark:text-white appearance-none"
                  >
                    <option value="">Select a category</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.name}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Subcategory - Conditional Render */}
              <AnimatePresence>
                {availableSubcategories.length > 0 && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Subcategory <span className="text-xs text-blue-500">(Select one)</span>
                      </label>
                      <div className="relative">
                        <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
                        <select
                          name="subcategory"
                          value={formData.subcategory}
                          onChange={handleChange}
                          className="w-full pl-10 pr-4 py-3 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-white/20 dark:border-gray-700/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 text-gray-800 dark:text-white appearance-none"
                        >
                          <option value="">Select subcategory</option>
                          {availableSubcategories.map((sub, idx) => (
                            <option key={idx} value={sub}>{sub}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>


              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-4 py-3 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-white/20 dark:border-gray-700/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 text-gray-800 dark:text-white"
                  />
                </div>
              </div>

              {/* Note */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Note (Optional)
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <textarea
                    name="note"
                    value={formData.note}
                    onChange={handleChange}
                    rows={3}
                    className="w-full pl-10 pr-4 py-3 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-white/20 dark:border-gray-700/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 text-gray-800 dark:text-white placeholder-gray-500 resize-none"
                    placeholder="Add a note about this expense..."
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex space-x-3 pt-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 px-4 bg-gray-500/20 hover:bg-gray-500/30 text-gray-600 dark:text-gray-400 font-medium rounded-xl transition-colors"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white font-medium rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {loading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                      />
                      <span>Adding...</span>
                    </div>
                  ) : (
                    'Add Expense'
                  )}
                </motion.button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AddExpenseModal;