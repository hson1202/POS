import React from "react";
import { FaCheckDouble, FaLongArrowAltRight, FaClock, FaSpinner } from "react-icons/fa";
import { FaCircle } from "react-icons/fa";
import { getAvatarName, formatDateAndTime, generateShortOrderId } from "../../utils/index";

const OrderList = ({ key, order }) => {
  // Xử lý table number - có thể là string (guest) hoặc object (admin)
  const getTableNumber = () => {
    if (typeof order.table === 'string') {
      return order.table; // Guest order - table là string như "1"
    }
    return order.table?.tableNo || 'N/A'; // Admin order - table là object
  };

  // Xử lý customer name
  const getCustomerName = () => {
    return order.customerDetails?.name || 'Guest';
  };

  // Xử lý avatar
  const getAvatar = () => {
    const name = getCustomerName();
    return getAvatarName(name);
  };

  // Lấy Order ID ngắn gọn và dễ nhớ
  const getShortOrderId = () => {
    return generateShortOrderId(order._id);
  };

  // Get status styling
  const getStatusStyle = (status) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return {
          bg: "bg-[#3a2e1f]",
          text: "text-orange-400",
          icon: <FaClock size={12} />
        };
      case "in progress":
        return {
          bg: "bg-[#4a452e]",
          text: "text-yellow-400",
          icon: <FaSpinner size={12} className="animate-spin" />
        };
      case "ready":
        return {
          bg: "bg-[#2e4a40]",
          text: "text-blue-400",
          icon: <FaCheckDouble size={12} />
        };
      case "completed":
        return {
          bg: "bg-[#1f4a2e]",
          text: "text-green-400",
          icon: <FaCheckDouble size={12} />
        };
      default:
        return {
          bg: "bg-[#4a452e]",
          text: "text-yellow-400",
          icon: <FaCircle size={12} />
        };
    }
  };

  const statusStyle = getStatusStyle(order.orderStatus);

  return (
    <div className="flex items-center gap-4 mb-4 p-4 bg-[#262626] rounded-xl border border-[#3a3a3a] hover:border-[#f6b100] hover:bg-[#2a2a2a] transition-all duration-300 shadow-lg">
      {/* Avatar */}
      <div className="flex-shrink-0">
        <div className="bg-gradient-to-br from-[#f6b100] to-[#e6a100] p-3 text-lg font-bold rounded-xl w-12 h-12 flex items-center justify-center shadow-lg">
          {getAvatar()}
        </div>
      </div>

      {/* Customer Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-[#f5f5f5] text-lg font-bold tracking-wide truncate">
            {getCustomerName()}
          </h1>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${statusStyle.bg} ${statusStyle.text}`}>
            {statusStyle.icon}
            <span>{order.orderStatus}</span>
          </span>
        </div>
        <div className="flex items-center gap-3 text-sm text-[#ababab] mb-1">
          <span className="bg-[#1f1f1f] px-2 py-1 rounded-lg">
            {order.items?.length || 0} Items
          </span>
          <span className="text-[#025cca] font-mono font-semibold">
            #{getShortOrderId()}
          </span>
        </div>
        <p className="text-[#ababab] text-xs">
          {formatDateAndTime(order.orderDate)}
        </p>
      </div>

      {/* Table Info */}
      <div className="flex-shrink-0">
        <div className="text-[#f6b100] font-bold border-2 border-[#f6b100] rounded-xl px-3 py-2 bg-[#1f1f1f] flex items-center gap-2 text-sm shadow-lg">
          <span>Table</span>
          <FaLongArrowAltRight className="text-[#ababab]" size={12} />
          <span className="text-white">{getTableNumber()}</span>
        </div>
      </div>
    </div>
  );
};

export default OrderList;
