import React, { useState, useEffect } from "react";
import { GrRadialSelected } from "react-icons/gr";
import { FaShoppingCart } from "react-icons/fa";
import { useDispatch } from "react-redux";
import { addItems } from "../../redux/slices/cartSlice";
import { axiosWrapper } from "../../https/axiosWrapper";
import { enqueueSnackbar } from "notistack";


const MenuContainer = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const dispatch = useDispatch();

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const fetchMenuItems = async () => {
    try {
      setLoading(true);
      const response = await axiosWrapper.get('/api/menu-items');
      const items = response.data.data;
      setMenuItems(items);
      
      // Create categories list from menu items
      const uniqueCategories = [...new Set(items.map(item => item.category))];
      setCategories(uniqueCategories);
      
      if (uniqueCategories.length > 0) {
        setSelectedCategory(uniqueCategories[0]);
      }
    } catch (error) {
      enqueueSnackbar('Error loading menu', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const getFilteredItems = () => {
    return menuItems.filter(item => item.category === selectedCategory && item.isAvailable);
  };

  const handleQuickAdd = (item) => {
    const {name, price, priceWithTax, itemCode} = item;
    const finalPrice = priceWithTax || price;
    const newObj = { 
      id: item._id, 
      name, 
      itemCode: itemCode || item._id, // Use itemCode (SKU) or fallback to ID
      pricePerQuantity: finalPrice, 
      quantity: 1, 
      price: finalPrice 
    };

    dispatch(addItems(newObj));
  }


  if (loading) {
    return (
      <div className="w-full flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F6B100]"></div>
      </div>
    );
  }

  return (
    <div className="w-full px-4">
      {/* Menu Categories */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-4 w-full mb-4">
        {categories.map((category) => {
          const categoryItems = menuItems.filter(item => item.category === category && item.isAvailable);
          return (
            <div
              key={category}
              className="flex flex-col items-start justify-between p-3 lg:p-4 rounded-lg h-20 lg:h-24 cursor-pointer bg-[#262626] hover:bg-[#2a2a2a]"
              onClick={() => {
                setSelectedCategory(category);
              }}
            >
              <div className="flex items-center justify-between w-full">
                <h1 className="text-[#f5f5f5] text-sm lg:text-lg font-semibold">
                  {category}
                </h1>
                {selectedCategory === category && (
                  <GrRadialSelected className="text-white" size={16} />
                )}
              </div>
              <p className="text-[#ababab] text-xs lg:text-sm font-semibold">
                {categoryItems.length} Items
              </p>
            </div>
          );
        })}
      </div>

      <hr className="border-[#2a2a2a] border-t-2 mb-4" />

      {/* Menu Items */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 w-full">
        {getFilteredItems().map((item) => {
          return (
            <div
              key={item._id}
              className="bg-[#1a1a1a] rounded-lg overflow-hidden hover:bg-[#2a2a2a] transition-colors"
            >
              {/* Image - Small square compact */}
              {item.image && (
                <div className="relative w-full aspect-square">
                  <img 
                    src={item.image} 
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                  {/* Quick Add Button - Overlay */}
           
                </div>
              )}

              {/* Content */}
              <div className="p-3">
                {/* Title & Code */}
                <div className="mb-2">
                  <h3 className="text-[#f5f5f5] text-sm font-semibold line-clamp-2 leading-tight">
                    {item.name}
                  </h3>
                  {item.itemCode && (
                    <p className="text-[#ababab] text-xs mt-1">{item.itemCode}</p>
                  )}
                </div>

                {/* Price */}
                <div className="mb-3">
                  <div className="flex items-center gap-2">
                    <p className="text-[#F6B100] text-sm font-bold">
                      {item.priceWithTax || item.price} Ft
                    </p>
                    {item.discount && typeof item.discount === 'number' && item.discount > 0 && (
                      <span className="bg-red-500 text-white px-2 py-1 rounded text-xs font-semibold">
                        -{item.discount}%
                      </span>
                    )}
                  </div>
                </div>

                {/* Quick Add Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleQuickAdd(item);
                  }}
                  className="w-full bg-[#F6B100] text-[#1a1a1a] py-2 rounded-lg font-semibold text-sm hover:bg-[#e6a100] transition-colors"
                >
                  Add to Cart
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MenuContainer;
