import React, { useState } from "react";
import { FaCheckDouble, FaLongArrowAltRight, FaClock, FaSpinner } from "react-icons/fa";
import { FaCircle, FaTimes } from "react-icons/fa";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateOrderStatus } from "../../https";
import { enqueueSnackbar } from "notistack";
import { formatDateAndTime, getAvatarName } from "../../utils/index";

const OrderCard = ({ key, order }) => {
  const [showDetails, setShowDetails] = useState(false);
  const queryClient = useQueryClient();
  
  console.log(order);
  
  // Lấy thông tin customer từ order mới
  const customerName = order.customerName || order.customerDetails?.name || "Guest";
  const customerPhone = order.customerPhone || order.customerDetails?.phone || "N/A";
  const orderType = order.orderType || "Admin";
  const tableInfo = order.table?.tableNo || order.table || "N/A";
  
  // Mutation để update order status
  const updateStatusMutation = useMutation({
    mutationFn: ({ orderId, orderStatus }) => updateOrderStatus({ orderId, orderStatus }),
    onSuccess: () => {
      enqueueSnackbar("Order status updated successfully!", { variant: "success" });
      queryClient.invalidateQueries(["orders"]);
      setShowDetails(false);
    },
    onError: (error) => {
      console.log("Update Error:", error);
      enqueueSnackbar("Failed to update order status!", { variant: "error" });
    },
  });

  // Get status styling
  const getStatusStyle = (status) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return {
          bg: "bg-[#3a2e1f]",
          text: "text-orange-400",
          icon: <FaClock size={12} />,
          description: "Order pending"
        };
      case "in progress":
        return {
          bg: "bg-[#4a452e]",
          text: "text-yellow-400",
          icon: <FaSpinner size={12} className="animate-spin" />,
          description: "Preparing your order"
        };
      case "ready":
        return {
          bg: "bg-[#2e4a40]",
          text: "text-blue-400",
          icon: <FaCheckDouble size={12} />,
          description: "Ready to serve"
        };
      case "completed":
        return {
          bg: "bg-[#1f4a2e]",
          text: "text-green-400",
          icon: <FaCheckDouble size={12} />,
          description: "Order completed"
        };
      default:
        return {
          bg: "bg-[#4a452e]",
          text: "text-yellow-400",
          icon: <FaCircle size={12} />,
          description: "Preparing your order"
        };
    }
  };

  const statusStyle = getStatusStyle(order.orderStatus);

  const handleStatusUpdate = (newStatus) => {
    updateStatusMutation.mutate({
      orderId: order._id,
      orderStatus: newStatus
    });
  };
  
  return (
    <>
      <div 
        key={key} 
        className="bg-[#262626] p-4 rounded-xl cursor-pointer border border-transparent hover:bg-[#2a2a2a] hover:border-[#f6b100] transition-all duration-200 shadow-md"
        onClick={() => setShowDetails(true)}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-[#f6b100] to-[#e6a100] p-2 text-lg font-bold rounded-lg w-10 h-10 flex items-center justify-center shadow-md">
              {getAvatarName(customerName)}
            </div>
            <div>
              <h3 className="text-[#f5f5f5] font-semibold text-sm">
                {customerName}
              </h3>
              <p className="text-[#025cca] font-mono text-xs">
                #{order._id.substring(0, 8)}
              </p>
            </div>
          </div>
          <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${statusStyle.bg} ${statusStyle.text}`}>
            {statusStyle.icon}
            <span>{order.orderStatus}</span>
          </span>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="bg-[#1f1f1f] px-2 py-1 rounded-lg">
            <p className="text-[#ababab] text-xs">Table</p>
            <p className="text-[#f5f5f5] font-medium text-sm">{tableInfo}</p>
          </div>
          <div className="bg-[#1f1f1f] px-2 py-1 rounded-lg">
            <p className="text-[#ababab] text-xs">Items</p>
            <p className="text-[#f5f5f5] font-medium text-sm">{order.items.length}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[#ababab]">{formatDateAndTime(order.orderDate)}</span>
            {orderType === "Guest" && (
              <span className="bg-blue-600 text-white px-1 py-0.5 rounded text-xs">Guest</span>
            )}
          </div>
          <span className="text-[#f6b100] font-semibold">
            {order.bills.totalWithTax.toFixed(2)} Ft
          </span>
        </div>
      </div>

      {/* Modal chi tiết order */}
      {showDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#1a1a1a] rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-[#f5f5f5] text-xl font-bold">Order Details</h2>
              <button 
                onClick={() => setShowDetails(false)}
                className="text-[#ababab] hover:text-white"
              >
                <FaTimes size={20} />
              </button>
            </div>
            
            {/* Customer Info */}
            <div className="bg-[#262626] p-4 rounded-lg mb-4">
              <h3 className="text-[#f5f5f5] font-semibold mb-2">Customer Information</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-[#ababab]">Name:</p>
                  <p className="text-[#f5f5f5]">{customerName}</p>
                </div>
                <div>
                  <p className="text-[#ababab]">Phone:</p>
                  <p className="text-[#f5f5f5]">{customerPhone}</p>
                </div>
                <div>
                  <p className="text-[#ababab]">Table:</p>
                  <p className="text-[#f5f5f5]">{tableInfo}</p>
                </div>
                <div>
                  <p className="text-[#ababab]">Order Type:</p>
                  <p className="text-[#f5f5f5]">{orderType}</p>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="bg-[#262626] p-4 rounded-lg mb-4">
              <h3 className="text-[#f5f5f5] font-semibold mb-3">Order Items</h3>
              <div className="space-y-3">
                {order.items.map((item, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-[#1f1f1f] rounded-lg">
                    <div>
                      <p className="text-[#f5f5f5] font-medium">{item.name}</p>
                      {item.itemCode && (
                        <p className="text-[#666] text-xs">SKU: {item.itemCode}</p>
                      )}
                      <p className="text-[#ababab] text-sm">Quantity: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[#f5f5f5] font-semibold">{item.pricePerQuantity} Ft</p>
                      <p className="text-[#ababab] text-sm">Total: {item.price} Ft</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bill Summary */}
            <div className="bg-[#262626] p-4 rounded-lg mb-4">
              <h3 className="text-[#f5f5f5] font-semibold mb-3">Bill Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between font-semibold">
                  <span className="text-[#f5f5f5]">Total:</span>
                  <span className="text-[#f5f5f5]">{order.bills.totalWithTax.toFixed(2)} Ft</span>
                </div>
              </div>
            </div>

            {/* Status Update */}
            <div className="bg-[#262626] p-4 rounded-lg mb-4">
              <h3 className="text-[#f5f5f5] font-semibold mb-3">Update Status</h3>
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => handleStatusUpdate("Pending")}
                  disabled={order.orderStatus === "Pending" || updateStatusMutation.isPending}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 ${
                    order.orderStatus === "Pending" 
                      ? "bg-[#3a2e1f] text-orange-400 cursor-not-allowed border border-orange-400" 
                      : "bg-[#1f1f1f] text-[#f5f5f5] hover:bg-[#3a2e1f] hover:text-orange-300"
                  }`}
                >
                  <FaClock className="inline mr-2" />
                  Pending
                </button>
                <button 
                  onClick={() => handleStatusUpdate("In Progress")}
                  disabled={order.orderStatus === "In Progress" || updateStatusMutation.isPending}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 ${
                    order.orderStatus === "In Progress" 
                      ? "bg-[#4a452e] text-yellow-400 cursor-not-allowed border border-yellow-400" 
                      : "bg-[#1f1f1f] text-[#f5f5f5] hover:bg-[#4a452e] hover:text-yellow-300"
                  }`}
                >
                  <FaSpinner className="inline mr-2 animate-spin" />
                  In Progress
                </button>
                <button 
                  onClick={() => handleStatusUpdate("Ready")}
                  disabled={order.orderStatus === "Ready" || updateStatusMutation.isPending}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 ${
                    order.orderStatus === "Ready" 
                      ? "bg-[#2e4a40] text-blue-400 cursor-not-allowed border border-blue-400" 
                      : "bg-[#1f1f1f] text-[#f5f5f5] hover:bg-[#2e4a40] hover:text-blue-300"
                  }`}
                >
                  <FaCheckDouble className="inline mr-2" />
                  Ready
                </button>
                <button 
                  onClick={() => handleStatusUpdate("Completed")}
                  disabled={order.orderStatus === "Completed" || updateStatusMutation.isPending}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 ${
                    order.orderStatus === "Completed" 
                      ? "bg-[#1f4a2e] text-green-400 cursor-not-allowed border border-green-400" 
                      : "bg-[#1f1f1f] text-[#f5f5f5] hover:bg-[#1f4a2e] hover:text-green-300"
                  }`}
                >
                  <FaCheckDouble className="inline mr-2" />
                  Completed
                </button>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button 
                onClick={() => setShowDetails(false)}
                className="bg-[#f6b100] text-[#1f1f1f] px-4 py-2 rounded-lg font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default OrderCard;
