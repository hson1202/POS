import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { useMutation } from "@tanstack/react-query";
import { enqueueSnackbar } from "notistack";
import { addOrder, addOrderGuest, updateTable } from "../../https/index";
import { removeAllItems } from "../../redux/slices/cartSlice";
import { removeCustomer } from "../../redux/slices/customerSlice";
import { useParams, useLocation } from "react-router-dom";
import { printCompactBill } from "../../utils/billTemplates";

const PlaceOrderButton = ({ className = "", disabled = false }) => {
  const dispatch = useDispatch();
  const { id: tableIdFromParams } = useParams();
  const location = useLocation();
  
  const customerData = useSelector((state) => state.customer);
  const cartData = useSelector((state) => state.cart);
  const user = useSelector((state) => state.user);
  
  // Get table ID from URL params (for /table/:id route) or from Redux (for /menu route)
  const tableId = tableIdFromParams || customerData?.table?.tableId;
  
  // Check if this is a customer route (table menu) vs admin route
  const isCustomerRoute = location.pathname.startsWith('/table/');
  const isAuthenticated = user.isAuth;
  
  const totalItems = cartData.reduce((total, item) => total + item.quantity, 0);
  const totalPrice = cartData.reduce((total, item) => total + item.price, 0);

  // Auto-print function for table orders using compact template
  const autoPrintReceipt = (orderData) => {
    // Create order object in the format expected by printCompactBill
    const order = {
      _id: orderData._id,
      customerDetails: orderData.customerDetails,
      customerName: orderData.customerDetails?.name || 'Guest',
      customerPhone: orderData.customerDetails?.phone,
      tableNumber: orderData.tableNumber || tableId,
      table: orderData.tableNumber || tableId,
      items: orderData.items?.map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: item.pricePerQuantity,
        total: item.totalPrice || item.price
      })) || [],
      totalAmount: orderData.totalAmount,
      orderStatus: 'Pending',
      createdAt: new Date().toISOString()
    };
    
    // Use compact print template for thermal printer
    printCompactBill(order);
  };

  const handlePlaceOrder = async () => {
    if (cartData.length === 0) {
      enqueueSnackbar("Please add items to cart first!", { variant: "error" });
      return;
    }

    const orderData = {
      customerDetails: {
        name: customerData.customerName || "Guest",
        phone: customerData.customerPhone || "N/A",
        guests: customerData.guests || 1,
      },
      orderStatus: "pending",
      bills: {
        total: totalPrice,
        tax: 0,
        totalWithTax: totalPrice,
      },
      totalAmount: totalPrice, // Add totalAmount for socket notification
      items: cartData.map(item => ({
        menuItemId: item.id,
        name: item.name,
        itemCode: item.itemCode, // Include SKU for kitchen
        quantity: item.quantity,
        price: item.pricePerQuantity,
        totalPrice: item.price
      })),
      // Include table if it's a valid table ID
      ...(tableId && tableId !== "undefined" && tableId !== undefined && { 
        table: tableId,
        tableNumber: customerData?.table?.tableNo || tableId 
      }),
    };
    
    orderMutation.mutate(orderData);
  };

  const orderMutation = useMutation({
    mutationFn: (reqData) => {
      console.log('🍽️ Placing order:', {
        tableId: reqData.table,
        orderData: reqData
      });
      
      // Use addOrderGuest for all orders (simplified)
      return addOrderGuest(reqData);
    },
    onSuccess: async (resData) => {
      const { data, isNewOrder, addedItems } = resData.data;

      // Note: Backend now auto-updates table status to "Occupied" when order is placed
      // But we still try to update here as a fallback, in case backend fails
      if (tableId && tableId !== "undefined" && tableId !== undefined && tableId !== "guest" && tableId !== "null") {
        try {
          await updateTable({ tableId, status: "Occupied", orderId: data._id });
          console.log("Table status updated to Occupied");
        } catch (error) {
          console.log("Table update failed (backend should have handled it):", error);
          // Don't show error to user since backend already updated it
        }
        
        // Only auto-print and play sound for authenticated admin/staff, NOT for customers
        if (!isCustomerRoute && isAuthenticated) {
          // Auto-print receipt for admin/staff orders
          autoPrintReceipt({
            _id: data._id,
            tableNumber: tableId,
            customerDetails: customerData,
            items: cartData,
            totalAmount: totalPrice
          });
          
          // Play sound alert for admin/staff
          const audio = new Audio('/audio/notification.mp3');
          audio.play().catch(e => console.log('Audio play failed:', e));
          
          enqueueSnackbar("🖨️ Order sent to kitchen & printing receipt...", { variant: "info" });
        }
      }

      // Clear cart and customer data
      dispatch(removeAllItems());
      dispatch(removeCustomer());

      // Show different message based on new order or added items
      if (isNewOrder) {
        enqueueSnackbar("✅ Đặt món thành công! Đơn hàng đã được gửi tới bếp.", { 
          variant: "success",
          autoHideDuration: 4000 
        });
      } else {
        enqueueSnackbar(`✅ Đã thêm ${addedItems?.length || 0} món vào đơn hàng!`, { 
          variant: "success",
          autoHideDuration: 4000 
        });
      }
    },
    onError: (error) => {
      console.log(error);
      
      // Show specific error message if available
      if (error.response && error.response.data && error.response.data.message) {
        enqueueSnackbar(error.response.data.message, { variant: "error" });
      } else {
        enqueueSnackbar("Đặt món thất bại. Vui lòng thử lại.", { variant: "error" });
      }
    },
  });

  const isDisabled = disabled || cartData.length === 0 || orderMutation.isPending;

  return (
    <button
      onClick={handlePlaceOrder}
      disabled={isDisabled}
      className={`w-full py-3 px-4 rounded-lg font-semibold text-sm lg:text-base transition-colors ${
        isDisabled
          ? "bg-[#2a2a2a] text-[#666] cursor-not-allowed"
          : "bg-[#f6b100] text-[#1f1f1f] hover:bg-[#e6a100]"
      } ${className}`}
    >
      {orderMutation.isPending ? "Processing..." : "Place Order"}
    </button>
  );
};

export default PlaceOrderButton; 