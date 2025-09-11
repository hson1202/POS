import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getOrderById } from "../https";
import { FaSearch, FaArrowLeft, FaCheckDouble, FaCircle, FaQrcode, FaCopy } from "react-icons/fa";
import { formatDateAndTime, generateShortOrderId } from "../utils";

const OrderTracking = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [searchOrderId, setSearchOrderId] = useState(orderId || "");

  // Fetch order by ID
  const { data: orderData, isLoading, error } = useQuery({
    queryKey: ["order", orderId],
    queryFn: async () => {
      if (!orderId) return null;
      return await getOrderById(orderId);
    },
    enabled: !!orderId,
  });

  const handleSearch = () => {
    if (searchOrderId.trim()) {
      navigate(`/order/${searchOrderId.trim()}`);
    }
  };

  const copyOrderId = () => {
    if (orderId) {
      const shortId = generateShortOrderId(orderId);
      navigator.clipboard.writeText(shortId);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Ready":
        return "text-blue-600 bg-blue-100";
      case "Completed":
        return "text-green-600 bg-green-100";
      case "In Progress":
        return "text-yellow-600 bg-yellow-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Ready":
      case "Completed":
        return <FaCheckDouble />;
      default:
        return <FaCircle />;
    }
  };

  if (!orderId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
          <div className="text-center mb-6">
            <FaQrcode className="text-blue-500 text-4xl mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900">Track Your Order</h1>
            <p className="text-gray-600 mt-2">Enter your Order ID to check order status</p>
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Order ID
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g., ABC1234567"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-center font-mono"
                value={searchOrderId}
                onChange={(e) => setSearchOrderId(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              />
              <button
                onClick={handleSearch}
                className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <FaSearch />
              </button>
            </div>
          </div>

          <div className="text-center text-sm text-gray-600 space-y-2">
            <p>📋 Order ID can be found on your receipt</p>
            <p>📱 You can also scan the QR code on your receipt</p>
            <p>🔍 Example: ABC1234567</p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !orderData?.data?.data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Order Not Found</h1>
          <p className="text-gray-600 mb-6">
            The order with ID "{generateShortOrderId(orderId)}" could not be found. 
            Please check your Order ID and try again.
          </p>
          <button
            onClick={() => navigate("/order")}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Search Another Order
          </button>
        </div>
      </div>
    );
  }

  const order = orderData.data.data;
  const shortOrderId = generateShortOrderId(orderId);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/order")}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FaArrowLeft className="text-gray-600" />
            </button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">Order Tracking</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-gray-600">Order ID:</span>
                <span className="font-mono font-bold text-blue-600 text-lg">#{shortOrderId}</span>
                <button
                  onClick={copyOrderId}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                  title="Copy Order ID"
                >
                  <FaCopy className="text-gray-500" size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Order Details */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Order Info */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Order Information</h2>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Order ID:</span>
                <span className="font-mono font-semibold text-blue-600">#{shortOrderId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Date:</span>
                <span>{formatDateAndTime(order.orderDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Customer:</span>
                <span>{order.customerDetails?.name || "Guest"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Phone:</span>
                <span>{order.customerDetails?.phone || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Table:</span>
                <span>{order.table}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Guests:</span>
                <span>{order.customerDetails?.guests || 1}</span>
              </div>
            </div>
          </div>

          {/* Order Status */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Order Status</h2>
            
            <div className="text-center py-8">
              <div className={`inline-flex items-center gap-3 px-6 py-3 rounded-full text-lg font-semibold ${getStatusColor(order.orderStatus)}`}>
                {getStatusIcon(order.orderStatus)}
                <span>{order.orderStatus}</span>
              </div>
              
              <div className="mt-4 text-sm text-gray-600">
                {order.orderStatus === "In Progress" && (
                  <p>Your order is being prepared in the kitchen</p>
                )}
                {order.orderStatus === "Ready" && (
                  <p>Your order is ready! Please collect it from the counter</p>
                )}
                {order.orderStatus === "Completed" && (
                  <p>Thank you for dining with us!</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="bg-white rounded-lg shadow-sm p-6 mt-8">
          <h2 className="text-xl font-semibold mb-4">Order Items</h2>
          
          <div className="space-y-3">
            {order.items.map((item, index) => (
              <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                <div>
                  <span className="font-medium">{item.name}</span>
                  <span className="text-gray-500 ml-2">x{item.quantity}</span>
                </div>
                <span className="font-semibold">{item.price.toFixed(2)} Ft</span>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex justify-between text-sm">
              <span>Subtotal:</span>
              <span>{order.bills.total.toFixed(2)} Ft</span>
            </div>
            <div className="flex justify-between text-sm">
                          <span>Total:</span>
            <span>{order.bills.totalWithTax.toFixed(2)} Ft</span>
            </div>
            
          </div>
        </div>

        {/* Payment Info */}
        <div className="bg-white rounded-lg shadow-sm p-6 mt-8">
          <h2 className="text-xl font-semibold mb-4">Payment Information</h2>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Payment Method:</span>
              <span>{order.paymentMethod}</span>
            </div>
            {order.paymentData?.razorpay_payment_id && (
              <div className="flex justify-between">
                <span className="text-gray-600">Transaction ID:</span>
                <span className="font-mono text-sm">{order.paymentData.razorpay_payment_id}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderTracking; 