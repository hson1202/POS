import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { FaUpload, FaCheck, FaTimes, FaArrowLeft, FaUtensils } from 'react-icons/fa';
import { enqueueSnackbar } from 'notistack';
import { deployMenuItems, replaceMenuItems } from '../https';
import { axiosWrapper } from '../https/axiosWrapper';
import BottomNav from '../components/shared/BottomNav';

const DishDeployment = () => {
  const { role } = useSelector(state => state.user);
  const navigate = useNavigate();
  const isAdmin = role === 'admin';
  
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deploying, setDeploying] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [deploymentMode, setDeploymentMode] = useState('add'); // 'add' or 'replace'

  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
      return;
    }
    fetchMenuItems();
  }, [isAdmin, navigate]);

  const fetchMenuItems = async () => {
    try {
      setLoading(true);
      const response = await axiosWrapper.get('/api/menu-items');
      setMenuItems(response.data.data);
    } catch (error) {
      enqueueSnackbar('Lỗi khi tải danh sách món ăn', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const toggleItemSelection = (itemId) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const selectAll = () => {
    setSelectedItems(menuItems.map(item => item._id));
  };

  const deselectAll = () => {
    setSelectedItems([]);
  };

  const handleDeploy = async () => {
    if (selectedItems.length === 0) {
      enqueueSnackbar('Vui lòng chọn ít nhất một món ăn', { variant: 'warning' });
      return;
    }

    try {
      setDeploying(true);
      
      const selectedMenuItems = menuItems.filter(item => selectedItems.includes(item._id));
      
      // Kiểm tra món đã có sẵn
      const alreadyAvailable = selectedMenuItems.filter(item => item.isAvailable);
      const newItems = selectedMenuItems.filter(item => !item.isAvailable);
      
      if (deploymentMode === 'replace') {
        // Thay thế toàn bộ menu hiện tại
        await replaceMenuItems({
          menuItems: selectedMenuItems
        });
        enqueueSnackbar('Đã thay thế toàn bộ menu thành công', { variant: 'success' });
      } else {
        // Thêm vào menu hiện tại
        if (alreadyAvailable.length > 0) {
          enqueueSnackbar(`${alreadyAvailable.length} món đã có sẵn, ${newItems.length} món mới được thêm`, { variant: 'info' });
        } else {
          enqueueSnackbar('Đã thêm món ăn vào menu thành công', { variant: 'success' });
        }
        await deployMenuItems({
          menuItems: selectedMenuItems
        });
      }
      
      setSelectedItems([]);
      fetchMenuItems();
    } catch (error) {
      enqueueSnackbar('Có lỗi xảy ra khi triển khai menu', { variant: 'error' });
    } finally {
      setDeploying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F6B100] mx-auto"></div>
          <p className="mt-4 text-[#ababab]">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a] pb-20">
      {/* Header */}
      <div className="bg-[#262626] p-4 shadow-lg">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/menu-management')}
            className="text-[#ababab] hover:text-white"
          >
            <FaArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">Triển khai Menu</h1>
            <p className="text-[#ababab]">Đẩy món ăn lên bán</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Deployment Mode Selection */}
        <div className="bg-[#262626] rounded-lg p-4">
          <h2 className="text-lg font-semibold text-white mb-4">Chế độ triển khai</h2>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="add"
                checked={deploymentMode === 'add'}
                onChange={(e) => setDeploymentMode(e.target.value)}
                className="mr-2"
              />
              <span className="text-[#ababab]">Thêm vào menu hiện tại</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="replace"
                checked={deploymentMode === 'replace'}
                onChange={(e) => setDeploymentMode(e.target.value)}
                className="mr-2"
              />
              <span className="text-[#ababab]">Thay thế toàn bộ menu</span>
            </label>
          </div>
        </div>

        {/* Selection Controls */}
        <div className="bg-[#262626] rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-lg font-semibold text-white">
                Chọn món ăn ({selectedItems.length}/{menuItems.length})
              </h2>
              <p className="text-[#ababab] text-sm">
                {menuItems.filter(item => item.isAvailable).length} món đã có sẵn
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={selectAll}
                className="px-3 py-1 bg-[#F6B100] text-[#1a1a1a] rounded text-sm font-semibold hover:bg-[#e6a100]"
              >
                Chọn tất cả
              </button>
              <button
                onClick={deselectAll}
                className="px-3 py-1 bg-[#3a3a3a] text-white rounded text-sm font-semibold hover:bg-[#4a4a4a]"
              >
                Bỏ chọn tất cả
              </button>
            </div>
          </div>

           {/* Menu Items Grid */}
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
             {menuItems.map((item) => (
               <div
                 key={item._id}
                 className={`bg-[#1f1f1f] rounded-lg p-4 border-2 cursor-pointer transition-all ${
                   selectedItems.includes(item._id)
                     ? 'border-[#F6B100] bg-[#F6B100] bg-opacity-10'
                     : 'border-[#3a3a3a] hover:border-[#F6B100]'
                 }`}
                 onClick={() => toggleItemSelection(item._id)}
               >
                 {/* Image */}
                 {item.image && (
                   <div className="mb-3">
                     <img 
                       src={item.image} 
                       alt={item.name}
                       className="w-full h-24 object-cover rounded-lg"
                     />
                   </div>
                 )}

                 <div className="flex items-start justify-between">
                   <div className="flex-1">
                     <h3 className="font-semibold text-white mb-1">{item.name}</h3>
                     <p className="text-[#ababab] text-sm mb-2">{item.itemCode} • {item.category}</p>
                                           <div>
                        <div className="flex items-center gap-2">
                          <p className="text-[#F6B100] font-semibold">
                            {item.priceWithTax ? item.priceWithTax.toLocaleString() : item.price.toLocaleString()} Ft
                          </p>
                          {item.discount && item.discount > 0 && (
                            <span className="bg-red-500 text-white px-2 py-1 rounded text-xs font-semibold">
                              -{item.discount}%
                            </span>
                          )}
                        </div>
                      </div>
                   </div>
                   <div className="ml-2 flex flex-col items-end gap-1">
                     {selectedItems.includes(item._id) ? (
                       <FaCheck className="text-[#F6B100]" size={20} />
                     ) : (
                       <FaUtensils className="text-[#ababab]" size={20} />
                     )}
                     {item.isAvailable && (
                       <span className="bg-green-600 text-white px-2 py-1 rounded text-xs">
                         Đã có sẵn
                       </span>
                     )}
                   </div>
                 </div>

                <div className="flex gap-1 mt-2">
                  {item.isVegetarian && (
                    <span className="bg-green-600 text-white px-2 py-1 rounded text-xs">Chay</span>
                  )}
                  {item.isSpicy && (
                    <span className="bg-red-600 text-white px-2 py-1 rounded text-xs">Cay</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Deploy Button */}
        <div className="bg-[#262626] rounded-lg p-4">
          <button
            onClick={handleDeploy}
            disabled={selectedItems.length === 0 || deploying}
            className={`w-full py-3 px-6 rounded-lg font-semibold text-lg transition-colors ${
              selectedItems.length === 0 || deploying
                ? 'bg-[#3a3a3a] text-[#666] cursor-not-allowed'
                : 'bg-[#F6B100] text-[#1a1a1a] hover:bg-[#e6a100]'
            }`}
          >
            {deploying ? (
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#1a1a1a]"></div>
                Đang triển khai...
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <FaUpload />
                {deploymentMode === 'replace' ? 'Thay thế Menu' : 'Thêm vào Menu'}
              </div>
            )}
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default DishDeployment; 