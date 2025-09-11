import React, { useState, useMemo } from "react";
import { FaSearch } from "react-icons/fa";
import { Link } from "react-router-dom";
import OrderList from "./OrderList";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { enqueueSnackbar } from "notistack";
import { getOrders } from "../../https/index";

const RecentOrders = () => {
  const [searchTerm, setSearchTerm] = useState("");
  
  const { data: resData, isError } = useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      return await getOrders();
    },
    placeholderData: keepPreviousData,
    refetchInterval: 5000, // Auto refresh every 5 seconds
  });

  // Filter and sort orders
  const filteredOrders = useMemo(() => {
    if (!resData?.data.data) return [];
    
    let orders = resData.data.data.filter(order => {
      const searchLower = searchTerm.toLowerCase();
      
      // Search by customer name
      const customerName = order.customerDetails?.name || order.customerName || "Guest";
      if (customerName.toLowerCase().includes(searchLower)) return true;
      
      // Search by order ID (full or short)
      const fullOrderId = order._id.toLowerCase();
      const shortOrderId = order._id.substring(0, 8).toLowerCase();
      if (fullOrderId.includes(searchLower) || shortOrderId.includes(searchLower)) return true;
      
      // Search by table number
      const tableNumber = typeof order.table === 'string' ? order.table : order.table?.tableNo;
      if (tableNumber && tableNumber.toString().includes(searchLower)) return true;
      
      // Search by phone number
      const phone = order.customerDetails?.phone || order.customerPhone;
      if (phone && phone.includes(searchLower)) return true;
      
      // Search by order status
      if (order.orderStatus.toLowerCase().includes(searchLower)) return true;
      
      return false;
    });

    // Sort orders: newest first, then by status priority
    orders.sort((a, b) => {
      // First sort by creation date (newest first)
      const dateA = new Date(a.orderDate || a.createdAt);
      const dateB = new Date(b.orderDate || b.createdAt);
      if (dateB - dateA !== 0) {
        return dateB - dateA;
      }

      // Then sort by status priority
      const statusPriority = {
        'pending': 1,
        'in progress': 2,
        'ready': 3,
        'completed': 4
      };

      const priorityA = statusPriority[a.orderStatus?.toLowerCase()] || 5;
      const priorityB = statusPriority[b.orderStatus?.toLowerCase()] || 5;

      return priorityA - priorityB;
    });

    return orders;
  }, [resData?.data.data, searchTerm]);

  if (isError) {
    enqueueSnackbar("Something went wrong!", { variant: "error" });
  }

  return (
    <div className="px-8 mt-6">
      <div className="bg-[#1a1a1a] w-full h-[450px] rounded-lg">
        <div className="flex justify-between items-center px-6 py-4">
          <div className="flex items-center gap-3">
            <h1 className="text-[#f5f5f5] text-lg font-semibold tracking-wide">
              Recent Orders
            </h1>
          </div>
          <Link to="/orders" className="text-[#025cca] text-sm font-semibold hover:underline">
            View all
          </Link>
        </div>

        <div className="flex items-center gap-4 bg-[#1f1f1f] rounded-[15px] px-6 py-4 mx-6">
          <FaSearch className="text-[#f5f5f5]" />
          <input
            type="text"
            placeholder="Search by name, order ID, table, phone, status..."
            className="bg-[#1f1f1f] outline-none text-[#f5f5f5] flex-1"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm("")}
              className="text-[#ababab] hover:text-white text-sm"
            >
              Clear
            </button>
          )}
        </div>

        {/* Search results info */}
        {searchTerm && (
          <div className="px-6 py-2">
            <p className="text-[#ababab] text-sm">
              Found {filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''} for "{searchTerm}"
            </p>
          </div>
        )}

        {/* Order list */}
        <div className="mt-4 px-6 overflow-y-scroll h-[300px] scrollbar-hide">
          {filteredOrders.length > 0 ? (
            filteredOrders.map((order) => {
              return <OrderList key={order._id} order={order} />;
            })
          ) : searchTerm ? (
            <div className="text-center py-8">
              <p className="text-[#ababab] text-sm">No orders found for "{searchTerm}"</p>
              <button 
                onClick={() => setSearchTerm("")}
                className="text-[#025cca] text-sm mt-2 hover:underline"
              >
                Clear search
              </button>
            </div>
          ) : (
            <p className="text-[#ababab] text-sm text-center py-8">No orders available</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecentOrders;
