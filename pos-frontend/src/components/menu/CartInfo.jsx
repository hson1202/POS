import React, { useRef, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { removeItem, updateQuantity } from "../../redux/slices/cartSlice";
import { RiDeleteBin2Fill } from "react-icons/ri";
import { FaNotesMedical, FaMinus, FaPlus } from "react-icons/fa";

const CartInfo = () => {
  const cartData = useSelector((state) => state.cart);
  const dispatch = useDispatch();
  const scrolLRef = useRef();

  useEffect(() => {
    scrolLRef.current?.scrollTo(0, scrolLRef.current.scrollHeight);
  }, [cartData]);

  const handleRemove = (id) => {
    dispatch(removeItem(id));
  };

  const handleQuantityChange = (id, currentQuantity, change) => {
    const newQuantity = currentQuantity + change;
    dispatch(updateQuantity({ id, quantity: newQuantity }));
  };

  return (
    <div className="px-2 lg:px-4 py-2">
      {cartData.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-[#ababab] text-sm mb-2">Cart is empty</p>
          <p className="text-[#666] text-xs">Click + to add dishes</p>
        </div>
      ) : (
        <div className="overflow-y-auto scrollbar-hide" ref={scrolLRef}>
          <div className="space-y-2">
            {cartData.map((item, index) => (
              <div key={`${item.id}-${index}`} className="bg-[#1f1f1f] rounded-lg px-3 py-2 lg:px-4 lg:py-3">
                <div className="flex items-center justify-between">
                  <h1 className="text-[#ababab] font-semibold tracking-wide text-xs lg:text-sm flex-1 min-w-0">
                    <span className="truncate block">{item.name}</span>
                    {item.itemCode && (
                      <span className="text-[#666] text-xs font-normal block truncate">
                        SKU: {item.itemCode}
                      </span>
                    )}
                  </h1>
                  <div className="flex items-center gap-2 ml-2">
                    <button
                      onClick={() => handleQuantityChange(item.id, item.quantity, -1)}
                      className="text-[#ababab] hover:text-red-400 transition-colors p-1"
                      disabled={item.quantity <= 1}
                    >
                      <FaMinus size={12} />
                    </button>
                    <span className="text-[#ababab] font-semibold text-xs lg:text-sm min-w-[20px] text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => handleQuantityChange(item.id, item.quantity, 1)}
                      className="text-[#ababab] hover:text-green-400 transition-colors p-1"
                    >
                      <FaPlus size={12} />
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleRemove(item.id)}
                      className="text-[#ababab] hover:text-red-400 transition-colors p-1"
                    >
                      <RiDeleteBin2Fill size={14} />
                    </button>
                    <button className="text-[#ababab] hover:text-blue-400 transition-colors p-1">
                      <FaNotesMedical size={14} />
                    </button>
                  </div>
                  <p className="text-[#f5f5f5] text-xs lg:text-sm font-bold">
                    {item.price} Ft
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CartInfo;
