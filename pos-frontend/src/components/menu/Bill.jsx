import React, { useState } from "react";
import { useSelector } from "react-redux";
import { getTotalPrice } from "../../redux/slices/cartSlice";
import Invoice from "../invoice/Invoice";
import PlaceOrderButton from "./PlaceOrderButton";

const Bill = () => {
  const cartData = useSelector((state) => state.cart);
  const total = useSelector(getTotalPrice);
  // Don't add additional tax as it's already included in dish prices
  const totalPriceWithTax = total;

  const [showInvoice, setShowInvoice] = useState(false);
  const [orderInfo, setOrderInfo] = useState();

  return (
    <div className="px-2 lg:px-4 py-2">
      <div className="bg-[#1f1f1f] rounded-lg p-3 lg:p-4">
        {/* Bill Summary */}
        <div className="space-y-2 mb-4">
          {cartData.length > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-[#ababab] text-xs">Items in cart:</span>
              <span className="text-[#f5f5f5] text-xs font-semibold">
                {cartData.length} {cartData.length === 1 ? 'item' : 'items'}
              </span>
            </div>
          )}
          <div className="flex justify-between items-center">
            <span className="text-[#f5f5f5] text-sm lg:text-base font-bold">Total:</span>
            <span className="text-[#f5f5f5] text-sm lg:text-base font-bold">
              {totalPriceWithTax.toFixed(2)} Ft
            </span>
          </div>
        </div>

        {/* Place Order Button */}
        {cartData.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-[#ababab] text-sm mb-2">Your cart is empty</p>
            <p className="text-[#666] text-xs">Click the cart icon on menu items to add them</p>
          </div>
        ) : (
          <PlaceOrderButton />
        )}
      </div>

      {/* Invoice Modal */}
      {showInvoice && (
        <Invoice orderInfo={orderInfo} setShowInvoice={setShowInvoice} />
      )}
    </div>
  );
};

export default Bill;