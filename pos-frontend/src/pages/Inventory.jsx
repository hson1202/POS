import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { FaPlus, FaEdit, FaTrash, FaBox, FaExclamationTriangle, FaLock } from 'react-icons/fa';
import { enqueueSnackbar } from 'notistack';
import { axiosWrapper } from '../https/axiosWrapper';
import BottomNav from '../components/shared/BottomNav';

const Inventory = () => {
  const { role } = useSelector(state => state.user);
  const navigate = useNavigate();
  const isAdmin = role === 'admin';
  
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState(null);
  const [showStockModal, setShowStockModal] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    category: 'Meat',
    unit: 'g',
    currentStock: 0,
    minStock: 0,
    pricePerUnit: 0,
    supplier: '',
    description: ''
  });

  const [customCategory, setCustomCategory] = useState('');
  const [customUnit, setCustomUnit] = useState('');

  const [stockData, setStockData] = useState({
    quantity: 0,
    unitPrice: 0,
    reason: 'PURCHASE',
    notes: ''
  });

  const categories = ['Meat', 'Vegetables', 'Spices', 'Grains', 'Seafood', 'Dairy & Eggs', 'Others'];
  const units = ['g', 'kg', 'ml', 'l', 'piece', 'bunch', 'pack', 'box', 'Others'];
  const stockReasons = [
    { value: 'PURCHASE', label: 'Purchase' },
    { value: 'ADJUSTMENT', label: 'Adjustment' },
    { value: 'WASTE', label: 'Waste/Loss' },
    { value: 'TRANSFER', label: 'Transfer' }
  ];

  useEffect(() => {
    fetchIngredients();
  }, []);

  const fetchIngredients = async () => {
    try {
      setLoading(true);
      const response = await axiosWrapper.get('/api/ingredients');
      setIngredients(response.data.data);
    } catch (error) {
      enqueueSnackbar('Lỗi khi tải dữ liệu nguyên liệu', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Prepare form data with custom values if selected
      const submitData = {
        ...formData,
        category: formData.category === 'Others' ? customCategory : formData.category,
        unit: formData.unit === 'Others' ? customUnit : formData.unit
      };

      // Validate custom inputs
      if (formData.category === 'Others' && !customCategory.trim()) {
        enqueueSnackbar('Vui lòng nhập danh mục tùy chỉnh', { variant: 'error' });
        return;
      }
      if (formData.unit === 'Others' && !customUnit.trim()) {
        enqueueSnackbar('Vui lòng nhập đơn vị tùy chỉnh', { variant: 'error' });
        return;
      }

      if (editingIngredient) {
        await axiosWrapper.put(`/api/ingredients/${editingIngredient._id}`, submitData);
        enqueueSnackbar('Cập nhật nguyên liệu thành công', { variant: 'success' });
      } else {
        await axiosWrapper.post('/api/ingredients', submitData);
        enqueueSnackbar('Thêm nguyên liệu thành công', { variant: 'success' });
      }
      setShowModal(false);
      resetForm();
      fetchIngredients();
    } catch (error) {
      enqueueSnackbar('Có lỗi xảy ra', { variant: 'error' });
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc muốn xóa nguyên liệu này?')) {
      try {
        await axiosWrapper.delete(`/api/ingredients/${id}`);
        enqueueSnackbar('Xóa nguyên liệu thành công', { variant: 'success' });
        fetchIngredients();
      } catch (error) {
        enqueueSnackbar('An error occurred', { variant: 'error' });
      }
    }
  };

  const handleEdit = (ingredient) => {
    setEditingIngredient(ingredient);
    setFormData({
      name: ingredient.name,
      category: ingredient.category,
      unit: ingredient.unit,
      currentStock: ingredient.currentStock,
      minStock: ingredient.minStock,
      pricePerUnit: ingredient.pricePerUnit,
      supplier: ingredient.supplier,
      description: ingredient.description
    });
    setShowModal(true);
  };

  const handleAddStock = async (e) => {
    e.preventDefault();
    try {
      await axiosWrapper.post('/api/ingredients/stock/add', {
        ingredientId: selectedIngredient._id,
        ...stockData
      });
      enqueueSnackbar('Cập nhật tồn kho thành công', { variant: 'success' });
      setShowStockModal(false);
      resetStockForm();
      fetchIngredients();
    } catch (error) {
      enqueueSnackbar('Có lỗi xảy ra', { variant: 'error' });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: 'Meat',
      unit: 'g',
      currentStock: 0,
      minStock: 0,
      pricePerUnit: 0,
      supplier: '',
      description: ''
    });
    setCustomCategory('');
    setCustomUnit('');
    setEditingIngredient(null);
  };

  const resetStockForm = () => {
    setStockData({
      quantity: 0,
      unitPrice: 0,
      reason: 'PURCHASE',
      notes: ''
    });
    setSelectedIngredient(null);
  };

  const openStockModal = (ingredient) => {
    setSelectedIngredient(ingredient);
    setStockData({
      quantity: 0,
      unitPrice: ingredient.pricePerUnit,
      reason: 'PURCHASE',
      notes: ''
    });
    setShowStockModal(true);
  };

  const isLowStock = (ingredient) => ingredient.currentStock <= ingredient.minStock;

  // Kiểm tra quyền admin
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] text-white p-6 pb-24">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col items-center justify-center h-[60vh] text-center">
            <div className="bg-red-900/20 border border-red-500 rounded-full p-8 mb-6">
              <FaLock className="text-6xl text-red-400" />
            </div>
            <h1 className="text-3xl font-bold text-red-400 mb-4">Truy cập bị từ chối</h1>
            <p className="text-[#ababab] text-lg mb-6 max-w-md">
              Trang này chỉ dành cho Admin. Bạn không có quyền truy cập vào tính năng quản lý kho.
            </p>
            <button
              onClick={() => navigate('/more')}
              className="bg-[#F6B100] text-[#1a1a1a] px-6 py-3 rounded-lg font-semibold hover:bg-yellow-600 transition-colors"
            >
              Quay lại trang More
            </button>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#F6B100]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white p-6 pb-24">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#F6B100]">Quản lý kho</h1>
            <p className="text-[#ababab] mt-2">Quản lý nguyên liệu và tồn kho</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-[#F6B100] text-[#1a1a1a] px-6 py-3 rounded-lg font-semibold hover:bg-yellow-600 transition-colors flex items-center gap-2"
          >
            <FaPlus /> Thêm nguyên liệu
          </button>
        </div>

        {/* Low Stock Alert */}
        {ingredients.some(isLowStock) && (
          <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 text-red-400">
              <FaExclamationTriangle />
              <span className="font-semibold">Cảnh báo: Một số nguyên liệu sắp hết hàng</span>
            </div>
          </div>
        )}

        {/* Ingredients Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ingredients.map((ingredient) => (
            <div
              key={ingredient._id}
              className={`bg-[#262626] rounded-lg p-6 border ${
                isLowStock(ingredient) ? 'border-red-500' : 'border-[#3a3a3a]'
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-white">{ingredient.name}</h3>
                  <p className="text-[#ababab] text-sm">{ingredient.category}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(ingredient)}
                    className="text-blue-400 hover:text-blue-300"
                  >
                    <FaEdit />
                  </button>
                  <button
                    onClick={() => handleDelete(ingredient._id)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span className="text-[#ababab]">Tồn kho:</span>
                  <span className={`font-semibold ${isLowStock(ingredient) ? 'text-red-400' : 'text-green-400'}`}>
                    {ingredient.currentStock} {ingredient.unit}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#ababab]">Tồn tối thiểu:</span>
                  <span className="text-white">{ingredient.minStock} {ingredient.unit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#ababab]">Giá/đơn vị:</span>
                  <span className="text-white">{ingredient.pricePerUnit.toLocaleString()} Ft</span>
                </div>
                {ingredient.supplier && (
                  <div className="flex justify-between">
                    <span className="text-[#ababab]">Nhà cung cấp:</span>
                    <span className="text-white">{ingredient.supplier}</span>
                  </div>
                )}
              </div>

              <button
                onClick={() => openStockModal(ingredient)}
                className="w-full bg-[#F6B100] text-[#1a1a1a] py-2 rounded-lg font-semibold hover:bg-yellow-600 transition-colors"
              >
                Cập nhật tồn kho
              </button>
            </div>
          ))}
        </div>

        {/* Add/Edit Ingredient Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-[#262626] rounded-lg p-6 w-full max-w-md">
              <h2 className="text-2xl font-bold mb-4">
                {editingIngredient ? 'Sửa nguyên liệu' : 'Thêm nguyên liệu'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-[#ababab] mb-2">Tên nguyên liệu</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-[#1f1f1f] border border-[#3a3a3a] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#F6B100]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[#ababab] mb-2">Danh mục</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full bg-[#1f1f1f] border border-[#3a3a3a] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#F6B100]"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                {formData.category === 'Others' && (
                  <div>
                    <label className="block text-[#ababab] mb-2">Danh mục tùy chỉnh</label>
                    <input
                      type="text"
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      placeholder="Nhập danh mục tùy chỉnh"
                      className="w-full bg-[#1f1f1f] border border-[#3a3a3a] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#F6B100]"
                      required
                    />
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[#ababab] mb-2">Đơn vị</label>
                    <select
                      value={formData.unit}
                      onChange={(e) => setFormData({...formData, unit: e.target.value})}
                      className="w-full bg-[#1f1f1f] border border-[#3a3a3a] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#F6B100]"
                    >
                      {units.map(unit => (
                        <option key={unit} value={unit}>{unit}</option>
                      ))}
                    </select>
                    {formData.unit === 'Others' && (
                      <input
                        type="text"
                        value={customUnit}
                        onChange={(e) => setCustomUnit(e.target.value)}
                        placeholder="Nhập đơn vị tùy chỉnh"
                        className="w-full bg-[#1f1f1f] border border-[#3a3a3a] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#F6B100] mt-2"
                        required
                      />
                    )}
                  </div>
                  <div>
                    <label className="block text-[#ababab] mb-2">Giá/đơn vị</label>
                    <input
                      type="number"
                      value={formData.pricePerUnit}
                      onChange={(e) => setFormData({...formData, pricePerUnit: parseFloat(e.target.value)})}
                      className="w-full bg-[#1f1f1f] border border-[#3a3a3a] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#F6B100]"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[#ababab] mb-2">Tồn kho hiện tại</label>
                    <input
                      type="number"
                      value={formData.currentStock}
                      onChange={(e) => setFormData({...formData, currentStock: parseFloat(e.target.value)})}
                      className="w-full bg-[#1f1f1f] border border-[#3a3a3a] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#F6B100]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[#ababab] mb-2">Tồn tối thiểu</label>
                    <input
                      type="number"
                      value={formData.minStock}
                      onChange={(e) => setFormData({...formData, minStock: parseFloat(e.target.value)})}
                      className="w-full bg-[#1f1f1f] border border-[#3a3a3a] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#F6B100]"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[#ababab] mb-2">Nhà cung cấp</label>
                  <input
                    type="text"
                    value={formData.supplier}
                    onChange={(e) => setFormData({...formData, supplier: e.target.value})}
                    className="w-full bg-[#1f1f1f] border border-[#3a3a3a] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#F6B100]"
                  />
                </div>
                <div>
                  <label className="block text-[#ababab] mb-2">Mô tả</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full bg-[#1f1f1f] border border-[#3a3a3a] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#F6B100]"
                    rows="3"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 bg-[#F6B100] text-[#1a1a1a] py-2 rounded-lg font-semibold hover:bg-yellow-600 transition-colors"
                  >
                    {editingIngredient ? 'Cập nhật' : 'Thêm'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="flex-1 bg-[#3a3a3a] text-white py-2 rounded-lg font-semibold hover:bg-[#4a4a4a] transition-colors"
                  >
                    Hủy
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Stock Update Modal */}
        {showStockModal && selectedIngredient && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-[#262626] rounded-lg p-6 w-full max-w-md">
              <h2 className="text-2xl font-bold mb-4">Cập nhật tồn kho</h2>
              <p className="text-[#ababab] mb-4">
                {selectedIngredient.name} - Hiện tại: {selectedIngredient.currentStock} {selectedIngredient.unit}
              </p>
              <form onSubmit={handleAddStock} className="space-y-4">
                <div>
                  <label className="block text-[#ababab] mb-2">Số lượng</label>
                  <input
                    type="number"
                    value={stockData.quantity}
                    onChange={(e) => setStockData({...stockData, quantity: parseFloat(e.target.value)})}
                    className="w-full bg-[#1f1f1f] border border-[#3a3a3a] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#F6B100]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[#ababab] mb-2">Giá/đơn vị (Ft)</label>
                  <input
                    type="number"
                    value={stockData.unitPrice}
                    onChange={(e) => setStockData({...stockData, unitPrice: parseFloat(e.target.value)})}
                    className="w-full bg-[#1f1f1f] border border-[#3a3a3a] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#F6B100]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[#ababab] mb-2">Lý do</label>
                  <select
                    value={stockData.reason}
                    onChange={(e) => setStockData({...stockData, reason: e.target.value})}
                    className="w-full bg-[#1f1f1f] border border-[#3a3a3a] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#F6B100]"
                  >
                    {stockReasons.map(reason => (
                      <option key={reason.value} value={reason.value}>{reason.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[#ababab] mb-2">Ghi chú</label>
                  <textarea
                    value={stockData.notes}
                    onChange={(e) => setStockData({...stockData, notes: e.target.value})}
                    className="w-full bg-[#1f1f1f] border border-[#3a3a3a] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#F6B100]"
                    rows="3"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 bg-[#F6B100] text-[#1a1a1a] py-2 rounded-lg font-semibold hover:bg-yellow-600 transition-colors"
                  >
                    Cập nhật
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowStockModal(false);
                      resetStockForm();
                    }}
                    className="flex-1 bg-[#3a3a3a] text-white py-2 rounded-lg font-semibold hover:bg-[#4a4a4a] transition-colors"
                  >
                    Hủy
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
};

export default Inventory; 