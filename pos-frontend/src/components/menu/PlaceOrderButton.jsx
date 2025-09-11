import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { useMutation } from "@tanstack/react-query";
import { enqueueSnackbar } from "notistack";
import { addOrder, addOrderGuest, updateTable } from "../../https/index";
import { removeAllItems } from "../../redux/slices/cartSlice";
import { removeCustomer } from "../../redux/slices/customerSlice";
import { useParams } from "react-router-dom";

const PlaceOrderButton = ({ className = "", disabled = false }) => {
  const dispatch = useDispatch();
  const { id: tableId } = useParams(); // From URL params (customer route)
  
  const customerData = useSelector((state) => state.customer);
  const cartData = useSelector((state) => state.cart);
  
  // Determine if this is admin order or customer order
  const isCustomerOrder = !!tableId; // Customer routes have tableId in URL
  const isAdminOrder = !tableId && customerData.table?.tableId; // Admin has table from Redux
  
  const totalItems = cartData.reduce((total, item) => total + item.quantity, 0);
  const totalPrice = cartData.reduce((total, item) => total + item.price, 0);

  // Compute backend table reference (ObjectId for admin, numeric for customer)
  const backendTableRef = isCustomerOrder
    ? tableId
    : (isAdminOrder ? customerData.table.tableId : null);

  // Compute display-friendly table number (numeric tableNo if available)
  const displayTableNo = isCustomerOrder
    ? tableId
    : (isAdminOrder ? customerData.table.tableNo : null);

  // Auto-print function for table orders
  const autoPrintReceipt = (orderData) => {
    // Create print content
    const printContent = `
      <html>
        <head>
          <title>Order Receipt - Table ${orderData.tableNumber || displayTableNo || tableId}</title>
          <style>
            body { font-family: Arial, sans-serif; width: 80mm; margin: 0 auto; padding: 10px; }
            h2 { text-align: center; margin: 10px 0; }
            .divider { border-bottom: 1px dashed #000; margin: 10px 0; }
            .item { display: flex; justify-content: space-between; margin: 5px 0; }
            .total { font-weight: bold; font-size: 18px; margin-top: 10px; }
            p { margin: 5px 0; }
          </style>
        </head>
        <body>
          <h2>ORDER RECEIPT</h2>
          <p><strong>Table:</strong> ${orderData.tableNumber || displayTableNo || tableId}</p>
          <p><strong>Customer:</strong> ${orderData.customerDetails?.name || 'Guest'}</p>
          <p><strong>Date:</strong> ${new Date().toLocaleString('vi-VN')}</p>
          <div class="divider"></div>
          <h3>Items:</h3>
          ${orderData.items.map(item => `
            <div class="item">
              <span>${item.name} x${item.quantity}</span>
              <span>${new Intl.NumberFormat('hu-HU', { style: 'currency', currency: 'HUF' }).format(item.totalPrice || item.price)}</span>
            </div>
          `).join('')}
          <div class="divider"></div>
          <div class="item total">
            <span>TOTAL:</span>
            <span>${new Intl.NumberFormat('hu-HU', { style: 'currency', currency: 'HUF' }).format(orderData.totalAmount || totalPrice)}</span>
          </div>
          <div class="divider"></div>
          <p style="text-align: center;">Thank you for your order!</p>
          <p style="text-align: center; font-size: 12px;">Order #${orderData._id?.slice(-6) || 'NEW'}</p>
        </body>
      </html>
    `;

    // Open print window
    const printWindow = window.open('', '_blank', 'width=300,height=600');
    printWindow.document.write(printContent);
    printWindow.document.close();
    
    // Auto print after a short delay
    setTimeout(() => {
      printWindow.print();
      // Close window after printing (optional)
      setTimeout(() => {
        printWindow.close();
      }, 2000);
    }, 500);
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
      items: cartData.map(item => ({
        menuItemId: item.id,
        name: item.name,
        itemCode: item.itemCode, // Include SKU for kitchen
        quantity: item.quantity,
        price: item.pricePerQuantity,
        totalPrice: item.price
      })),
      // Include table ID based on order type (backend reference)
      table: backendTableRef,
    };
    
    orderMutation.mutate(orderData);
  };

  const orderMutation = useMutation({
    mutationFn: (reqData) => {
      console.log('🍽️ Placing order:', {
        type: isCustomerOrder ? 'Customer' : (isAdminOrder ? 'Admin' : 'Guest'),
        tableId: reqData.table,
        orderData: reqData
      });
      
      // Use appropriate API based on order type
      if (isCustomerOrder || isAdminOrder) {
        return isCustomerOrder ? addOrderGuest(reqData) : addOrder(reqData);
      } else {
        // Guest order (walk-in, no table)
        return addOrderGuest(reqData);
      }
    },
    onSuccess: (resData) => {
      const { data } = resData.data;

      // Update Table if needed (for both customer and admin orders)
      const finalTableId = backendTableRef;
      if (finalTableId && finalTableId !== "undefined" && finalTableId !== "guest") {
        try {
          updateTable({ tableId: finalTableId, status: "Occupied" });
        } catch (error) {
          console.log("Table update failed:", error);
        }
        
        // Auto-print receipt for table orders
        autoPrintReceipt({
          _id: data._id,
          tableNumber: displayTableNo || tableId,
          customerDetails: customerData,
          items: cartData,
          totalAmount: totalPrice
        });
        
        // Play sound alert
        const audio = new Audio('/audio/notification.mp3');
        audio.play().catch(e => console.log('Audio play failed:', e));
        
        enqueueSnackbar("🖨️ Order sent to kitchen & printing receipt...", { variant: "info" });
      }

      // Clear cart and customer data
      dispatch(removeAllItems());
      dispatch(removeCustomer());

      enqueueSnackbar("Order placed successfully!", { variant: "success" });
    },
    onError: (error) => {
      console.log(error);
      
      // Show specific error message if available
      if (error.response && error.response.data && error.response.data.message) {
        enqueueSnackbar(error.response.data.message, { variant: "error" });
      } else {
        enqueueSnackbar("Failed to place order. Please try again.", { variant: "error" });
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