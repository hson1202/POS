import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { FaPlus, FaEdit, FaTrash, FaUtensils, FaCalculator, FaLock, FaUpload } from 'react-icons/fa';
import { enqueueSnackbar } from 'notistack';
import { axiosWrapper } from '../https/axiosWrapper';
import BottomNav from '../components/shared/BottomNav';
import ImageUpload from '../components/shared/ImageUpload';

const MenuManagement = () => {
  const { role } = useSelector(state => state.user);
  const navigate = useNavigate();
  const isAdmin = role === 'admin';
  
  const [menuItems, setMenuItems] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingMenuItem, setEditingMenuItem] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Form states
  const [formData, setFormData] = useState({
    itemCode: '',
    name: '',
    category: 'Noodles',
    description: '',
    price: 0,
    taxRate: 0,
    discount: 0,
    image: '',
    preparationTime: 15,
    isAvailable: true,
    isVegetarian: false,
    isSpicy: false,
    allergens: [],
    nutritionalInfo: {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0
    },
    recipe: []
  });

  const [newRecipeItem, setNewRecipeItem] = useState({
    ingredient: '',
    quantity: 0
  });

  const [customCategory, setCustomCategory] = useState('');

  const categories = ['Noodles', 'Pho', 'Rice', 'Vermicelli', 'Porridge', 'Sandwich', 'Salad', 'Soup', 'Appetizer', 'Dessert', 'Beverage', 'Fast Food', 'Others'];
  const allergens = ['Gluten', 'Shrimp', 'Crab', 'Fish', 'Peanuts', 'Cashews', 'Milk', 'Eggs', 'Soybeans', 'Wheat'];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [menuResponse, ingredientsResponse] = await Promise.all([
        axiosWrapper.get('/api/menu-items?includeUnavailable=true'), // Get all items for admin management
        axiosWrapper.get('/api/ingredients')
      ]);
      setMenuItems(menuResponse.data.data);
      setIngredients(ingredientsResponse.data.data);
    } catch (error) {
      enqueueSnackbar('Lỗi khi tải dữ liệu', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Prepare form data with custom category if selected
      const submitData = {
        ...formData,
        category: formData.category === 'Others' ? customCategory : formData.category
      };

      // Validate custom category
      if (formData.category === 'Others' && !customCategory.trim()) {
        enqueueSnackbar('Vui lòng nhập danh mục tùy chỉnh', { variant: 'error' });
        return;
      }

      // Validate numbers
      if (!submitData.price || submitData.price < 0) {
        enqueueSnackbar('Giá món ăn không hợp lệ', { variant: 'error' });
        return;
      }
      if (submitData.taxRate < 0 || submitData.taxRate > 100) {
        enqueueSnackbar('Thuế phải từ 0-100%', { variant: 'error' });
        return;
      }
      if (submitData.discount < 0 || submitData.discount > 100) {
        enqueueSnackbar('Giảm giá phải từ 0-100%', { variant: 'error' });
        return;
      }
      if (submitData.preparationTime <= 0) {
        enqueueSnackbar('Thời gian chế biến phải lớn hơn 0', { variant: 'error' });
        return;
      }

      // Clean recipe items - remove empty/invalid items
      // Recipe là KHÔNG BẮT BUỘC, có thể để trống
      if (submitData.recipe && submitData.recipe.length > 0) {
        // Filter out invalid items (empty ingredient or zero/negative quantity)
        submitData.recipe = submitData.recipe.filter(
          item => item.ingredient && item.ingredient.trim() !== '' && item.quantity > 0
        );
      }

      if (editingMenuItem) {
        await axiosWrapper.put(`/api/menu-items/${editingMenuItem._id}`, submitData);
        enqueueSnackbar('Cập nhật món ăn thành công', { variant: 'success' });
      } else {
        await axiosWrapper.post('/api/menu-items', submitData);
        enqueueSnackbar('Thêm món ăn thành công', { variant: 'success' });
      }
      setShowModal(false);
      resetForm();
      fetchData();
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Có lỗi xảy ra';
      enqueueSnackbar(errorMsg, { variant: 'error' });
      console.error('Error submitting menu item:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc muốn xóa món ăn này?')) {
      try {
        await axiosWrapper.delete(`/api/menu-items/${id}`);
        enqueueSnackbar('Xóa món ăn thành công', { variant: 'success' });
        fetchData();
      } catch (error) {
          const errorMsg = error.response?.data?.message || 'Có lỗi xảy ra';
        enqueueSnackbar(errorMsg, { variant: 'error' });
      }
    }
  };

  const handleEdit = (menuItem) => {
    setEditingMenuItem(menuItem);
    
    // Check if category is custom (not in predefined list)
    const isCustomCategory = !categories.includes(menuItem.category);
    
    setFormData({
      itemCode: menuItem.itemCode || '',
      name: menuItem.name,
      category: isCustomCategory ? 'Others' : menuItem.category,
      description: menuItem.description,
      price: menuItem.price,
      taxRate: menuItem.taxRate,
      discount: menuItem.discount || 0,
      image: menuItem.image,
      preparationTime: menuItem.preparationTime,
      isAvailable: menuItem.isAvailable,
      isVegetarian: menuItem.isVegetarian,
      isSpicy: menuItem.isSpicy,
      allergens: menuItem.allergens || [],
      nutritionalInfo: menuItem.nutritionalInfo || {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0
      },
      recipe: menuItem.recipe ? menuItem.recipe.map(item => ({
        ingredient: item.ingredient._id || item.ingredient, // Extract ID from populated object
        quantity: item.quantity
      })) : []
    });
    
    // Set custom category if needed
    if (isCustomCategory) {
      setCustomCategory(menuItem.category);
    } else {
      setCustomCategory('');
    }
    
    setShowModal(true);
  };

  const addRecipeItem = () => {
    // Chỉ thực hiện khi đã chọn nguyên liệu và nhập số lượng
    if (!newRecipeItem.ingredient || !newRecipeItem.quantity || newRecipeItem.quantity <= 0) {
      return; // Không làm gì cả, không hiện warning
    }
    
    // Check duplicate ingredient
    const isDuplicate = formData.recipe.find(item => item.ingredient === newRecipeItem.ingredient);
    if (isDuplicate) {
      enqueueSnackbar('Nguyên liệu này đã có trong công thức', { variant: 'warning' });
      return;
    }
    
    setFormData({
      ...formData,
      recipe: [...formData.recipe, {
        ingredient: newRecipeItem.ingredient,
        quantity: newRecipeItem.quantity
      }]
    });
    setNewRecipeItem({ ingredient: '', quantity: 0 });
  };

  const removeRecipeItem = (index) => {
    setFormData({
      ...formData,
      recipe: formData.recipe.filter((_, i) => i !== index)
    });
  };

  const toggleAllergen = (allergen) => {
    setFormData({
      ...formData,
      allergens: formData.allergens.includes(allergen)
        ? formData.allergens.filter(a => a !== allergen)
        : [...formData.allergens, allergen]
    });
  };

  const resetForm = () => {
    setFormData({
      itemCode: '',
      name: '',
      category: 'Noodles',
      description: '',
      price: 0,
      taxRate: 0,
      discount: 0,
      image: '',
      preparationTime: 15,
      isAvailable: true,
      isVegetarian: false,
      isSpicy: false,
      allergens: [],
      nutritionalInfo: {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0
      },
      recipe: []
    });
    setCustomCategory('');
    setEditingMenuItem(null);
  };

  const filteredMenuItems = selectedCategory === 'all' 
    ? menuItems 
    : menuItems.filter(item => item.category === selectedCategory);

  const calculatePriceWithTax = (price, taxRate) => {
    return price * (1 + taxRate / 100);
  };

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
              Trang này chỉ dành cho Admin. Bạn không có quyền truy cập vào tính năng quản lý menu.
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
            <h1 className="text-3xl font-bold text-[#F6B100]">Quản lý menu</h1>
            <p className="text-[#ababab] mt-2">Quản lý món ăn và công thức</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/dish-deployment')}
              className="bg-[#4a90e2] text-white px-4 py-2 rounded-lg font-semibold hover:bg-[#357abd] transition-colors flex items-center gap-2"
            >
              <FaUpload />
              Triển khai Menu
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="bg-[#F6B100] text-[#1a1a1a] px-6 py-3 rounded-lg font-semibold hover:bg-yellow-600 transition-colors flex items-center gap-2"
            >
              <FaPlus /> Thêm món ăn
            </button>
          </div>
        </div>

        {/* Category Filter */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                selectedCategory === 'all' 
                  ? 'bg-[#F6B100] text-[#1a1a1a]' 
                  : 'bg-[#262626] text-[#ababab] hover:bg-[#3a3a3a]'
              }`}
            >
              Tất cả
            </button>
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  selectedCategory === category 
                    ? 'bg-[#F6B100] text-[#1a1a1a]' 
                    : 'bg-[#262626] text-[#ababab] hover:bg-[#3a3a3a]'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Menu Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMenuItems.map((menuItem) => (
            <div
              key={menuItem._id}
              className={`bg-[#262626] rounded-lg p-6 border ${
                !menuItem.isAvailable ? 'border-red-500 opacity-60' : 'border-[#3a3a3a]'
              }`}
            >
              {/* Image */}
              {menuItem.image && (
                <div className="mb-4">
                  <img 
                    src={menuItem.image} 
                    alt={menuItem.name}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                </div>
              )}

              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-white">{menuItem.name}</h3>
                  <p className="text-[#ababab] text-sm">{menuItem.itemCode} • {menuItem.category}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(menuItem)}
                    className="text-blue-400 hover:text-blue-300"
                  >
                    <FaEdit />
                  </button>
                  <button
                    onClick={() => handleDelete(menuItem._id)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span className="text-[#ababab]">Giá:</span>
                  <span className="text-green-400 font-semibold">
                    {menuItem.priceWithTax ? menuItem.priceWithTax.toLocaleString() : calculatePriceWithTax(menuItem.price, menuItem.taxRate).toLocaleString()} Ft
                  </span>
                </div>
                {menuItem.discount && menuItem.discount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-[#ababab]">Giảm giá:</span>
                    <span className="text-red-400 font-semibold">
                      -{menuItem.discount}%
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-[#ababab]">Thời gian chế biến:</span>
                  <span className="text-white">{menuItem.preparationTime} phút</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#ababab]">Trạng thái:</span>
                  <span className={`font-semibold ${menuItem.isAvailable ? 'text-green-400' : 'text-red-400'}`}>
                    {menuItem.isAvailable ? 'Có sẵn' : 'Hết hàng'}
                  </span>
                </div>
              </div>

              {menuItem.recipe && menuItem.recipe.length > 0 && (
                <div className="mb-4">
                  <p className="text-[#ababab] text-sm mb-2">Công thức:</p>
                  <div className="space-y-1">
                    {menuItem.recipe.map((item, index) => (
                      <div key={index} className="text-xs text-white">
                        • {item.quantity} {item.unit} {item.ingredientName}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                {menuItem.isVegetarian && (
                  <span className="bg-green-600 text-white px-2 py-1 rounded text-xs">Chay</span>
                )}
                {menuItem.isSpicy && (
                  <span className="bg-red-600 text-white px-2 py-1 rounded text-xs">Cay</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Add/Edit Menu Item Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
            <div className="bg-[#262626] rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold mb-4">
                {editingMenuItem ? 'Sửa món ăn' : 'Thêm món ăn'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[#ababab] mb-2">Mã món ăn</label>
                    <input
                      type="text"
                      value={formData.itemCode}
                      onChange={(e) => setFormData({...formData, itemCode: e.target.value})}
                      className="w-full bg-[#1f1f1f] border border-[#3a3a3a] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#F6B100]"
                      placeholder="VD: PHO001"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[#ababab] mb-2">Tên món ăn</label>
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
                    {formData.category === 'Others' && (
                      <input
                        type="text"
                        value={customCategory}
                        onChange={(e) => setCustomCategory(e.target.value)}
                        placeholder="Nhập danh mục tùy chỉnh"
                        className="w-full bg-[#1f1f1f] border border-[#3a3a3a] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#F6B100] mt-2"
                        required
                      />
                    )}
                  </div>
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

                {/* Image Upload */}
                <ImageUpload 
                  onImageChange={(imageData) => setFormData({...formData, image: imageData})}
                  currentImage={formData.image}
                />

                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <label className="block text-[#ababab] mb-2">Giá (Ft)</label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value) || 0})}
                      className="w-full bg-[#1f1f1f] border border-[#3a3a3a] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#F6B100]"
                      placeholder="Nhập giá"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[#ababab] mb-2">Thuế (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={formData.taxRate}
                      onChange={(e) => setFormData({...formData, taxRate: parseFloat(e.target.value) || 0})}
                      className="w-full bg-[#1f1f1f] border border-[#3a3a3a] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#F6B100]"
                      placeholder="0"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[#ababab] mb-2">Giảm giá (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={formData.discount}
                      onChange={(e) => setFormData({...formData, discount: parseFloat(e.target.value) || 0})}
                      className="w-full bg-[#1f1f1f] border border-[#3a3a3a] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#F6B100]"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-[#ababab] mb-2">Thời gian chế biến (phút)</label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={formData.preparationTime}
                      onChange={(e) => setFormData({...formData, preparationTime: parseInt(e.target.value) || 15})}
                      className="w-full bg-[#1f1f1f] border border-[#3a3a3a] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#F6B100]"
                      placeholder="15"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.isAvailable}
                      onChange={(e) => setFormData({...formData, isAvailable: e.target.checked})}
                      className="mr-2"
                    />
                    <span className="text-[#ababab]">Có sẵn</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.isVegetarian}
                      onChange={(e) => setFormData({...formData, isVegetarian: e.target.checked})}
                      className="mr-2"
                    />
                    <span className="text-[#ababab]">Món chay</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.isSpicy}
                      onChange={(e) => setFormData({...formData, isSpicy: e.target.checked})}
                      className="mr-2"
                    />
                    <span className="text-[#ababab]">Món cay</span>
                  </label>
                </div>

                {/* Recipe Section */}
                <div>
                  <label className="block text-[#ababab] mb-2">
                    Công thức <span className="text-xs text-[#666]">(Không bắt buộc)</span>
                  </label>
                  <p className="text-xs text-[#ababab] mb-3">
                    💡 Thêm nguyên liệu để theo dõi tồn kho tự động. Bỏ qua nếu không cần quản lý nguyên liệu.
                  </p>
                  <div className="bg-[#1f1f1f] border border-[#3a3a3a] rounded-lg p-4">
                    <div className="grid grid-cols-[2fr_1fr_auto] gap-3 mb-4">
                      <div>
                        <label className="block text-xs text-[#888] mb-1">Chọn nguyên liệu</label>
                        <select
                          value={newRecipeItem.ingredient}
                          onChange={(e) => setNewRecipeItem({...newRecipeItem, ingredient: e.target.value})}
                          className="w-full bg-[#262626] border border-[#3a3a3a] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#F6B100]"
                        >
                          <option value="">-- Chọn nguyên liệu --</option>
                          {ingredients.map(ingredient => (
                            <option key={ingredient._id} value={ingredient._id}>
                              {ingredient.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-[#888] mb-1">
                          Số lượng {newRecipeItem.ingredient && ingredients.find(i => i._id === newRecipeItem.ingredient) && (
                            <span className="text-[#F6B100]">
                              ({ingredients.find(i => i._id === newRecipeItem.ingredient)?.unit})
                            </span>
                          )}
                        </label>
                        <input
                          type="number"
                          min="0.01"
                          step="0.01"
                          placeholder={newRecipeItem.ingredient ? 
                            `VD: 100` : 
                            'Chọn NL trước'}
                          value={newRecipeItem.quantity || ''}
                          onChange={(e) => setNewRecipeItem({...newRecipeItem, quantity: parseFloat(e.target.value) || 0})}
                          className="w-full bg-[#262626] border border-[#3a3a3a] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#F6B100]"
                          disabled={!newRecipeItem.ingredient}
                        />
                      </div>
                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={addRecipeItem}
                          disabled={!newRecipeItem.ingredient || !newRecipeItem.quantity || newRecipeItem.quantity <= 0}
                          className="bg-[#F6B100] text-[#1a1a1a] px-6 py-2 rounded-lg font-semibold hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <FaPlus className="inline mr-1" /> Thêm
                        </button>
                      </div>
                    </div>
                    
                    {formData.recipe.length > 0 ? (
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs text-[#888]">Đã thêm {formData.recipe.length} nguyên liệu</span>
                        </div>
                        <div className="space-y-2">
                          {formData.recipe.map((item, index) => {
                            const ingredient = ingredients.find(ing => ing._id === item.ingredient);
                            return (
                              <div key={index} className="flex justify-between items-center bg-[#262626] p-3 rounded-lg border border-[#3a3a3a]">
                                <div>
                                  <span className="text-white font-medium">{ingredient?.name || 'Unknown'}</span>
                                  <span className="text-[#F6B100] ml-2">
                                    {item.quantity} {ingredient?.unit || ''}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeRecipeItem(index)}
                                  className="text-red-400 hover:text-red-300 p-2"
                                  title="Xóa nguyên liệu"
                                >
                                  <FaTrash />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4 text-[#666] text-sm">
                        Chưa có nguyên liệu nào. Chọn nguyên liệu và nhập số lượng ở trên để thêm.
                      </div>
                    )}
                  </div>
                </div>

                {/* Allergens Section */}
                <div>
                  <label className="block text-[#ababab] mb-2">
                    Chất gây dị ứng <span className="text-xs text-[#666]">(Không bắt buộc)</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {allergens.map(allergen => (
                      <label key={allergen} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.allergens.includes(allergen)}
                          onChange={() => toggleAllergen(allergen)}
                          className="mr-2"
                        />
                        <span className="text-[#ababab] text-sm">{allergen}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Nutritional Info */}
                <div>
                  <label className="block text-[#ababab] mb-2">
                    Thông tin dinh dưỡng <span className="text-xs text-[#666]">(Không bắt buộc)</span>
                  </label>
                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <label className="block text-[#ababab] text-sm mb-1">Calories</label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={formData.nutritionalInfo.calories}
                        onChange={(e) => setFormData({
                          ...formData, 
                          nutritionalInfo: {...formData.nutritionalInfo, calories: parseInt(e.target.value) || 0}
                        })}
                        className="w-full bg-[#1f1f1f] border border-[#3a3a3a] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#F6B100]"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-[#ababab] text-sm mb-1">Protein (g)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={formData.nutritionalInfo.protein}
                        onChange={(e) => setFormData({
                          ...formData, 
                          nutritionalInfo: {...formData.nutritionalInfo, protein: parseInt(e.target.value) || 0}
                        })}
                        className="w-full bg-[#1f1f1f] border border-[#3a3a3a] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#F6B100]"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-[#ababab] text-sm mb-1">Carbs (g)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={formData.nutritionalInfo.carbs}
                        onChange={(e) => setFormData({
                          ...formData, 
                          nutritionalInfo: {...formData.nutritionalInfo, carbs: parseInt(e.target.value) || 0}
                        })}
                        className="w-full bg-[#1f1f1f] border border-[#3a3a3a] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#F6B100]"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-[#ababab] text-sm mb-1">Fat (g)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={formData.nutritionalInfo.fat}
                        onChange={(e) => setFormData({
                          ...formData, 
                          nutritionalInfo: {...formData.nutritionalInfo, fat: parseInt(e.target.value) || 0}
                        })}
                        className="w-full bg-[#1f1f1f] border border-[#3a3a3a] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#F6B100]"
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 bg-[#F6B100] text-[#1a1a1a] py-2 rounded-lg font-semibold hover:bg-yellow-600 transition-colors"
                  >
                    {editingMenuItem ? 'Cập nhật' : 'Thêm'}
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
      </div>
      <BottomNav />
    </div>
  );
};

export default MenuManagement; 