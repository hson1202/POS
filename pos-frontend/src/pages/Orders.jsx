import React, { useState, useEffect } from "react";
import BottomNav from "../components/shared/BottomNav";
import OrderCard from "../components/orders/OrderCard";
import BackButton from "../components/shared/BackButton";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getOrders, fixOrdersStatus } from "../https/index";
import { enqueueSnackbar } from "notistack"

const Orders = () => {

  const [status, setStatus] = useState("all");

    useEffect(() => {
      document.title = "POS | Orders"
    }, [])

  const { data: resData, isError, isLoading, error } = useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const response = await getOrders();
      console.log("API Response:", response);
      return response;
    },
    placeholderData: keepPreviousData,
    refetchInterval: 5000 // Auto refresh every 5 seconds
  })

  if(isError) {
    console.error("Orders API Error:", error);
    enqueueSnackbar("Something went wrong!", {variant: "error"})
  }

  // Filter and sort orders
  const filteredOrders = React.useMemo(() => {
    if (!resData?.data.data) return [];
    
    let orders = resData.data.data.filter(order => {
      // Handle case where orderStatus might not exist
      const orderStatus = order.orderStatus || "Pending";
      
      console.log(`Filtering order: ${order._id}, status: "${orderStatus}", filter: "${status}"`);
      
      if (status === "all") return true;
      if (status === "pending") {
        // Show orders that are pending (including those without status)
        // Handle both "Pending" and "pending" (case insensitive)
        const isPending = !order.orderStatus || 
                         order.orderStatus === "Pending" || 
                         order.orderStatus === "pending";
        console.log(`Order ${order._id} pending check: ${isPending} (original status: "${order.orderStatus}")`);
        return isPending;
      }
      if (status === "progress") return orderStatus === "In Progress";
      if (status === "ready") return orderStatus === "Ready";
      if (status === "completed") return orderStatus === "Completed";
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

      const priorityA = statusPriority[(a.orderStatus || "Pending")?.toLowerCase()] || 5;
      const priorityB = statusPriority[(b.orderStatus || "Pending")?.toLowerCase()] || 5;

      return priorityA - priorityB;
    });

    return orders;
  }, [resData?.data.data, status]);

  // Debug log
  console.log("=== ORDERS DEBUG ===");
  console.log("All orders:", resData?.data.data);
  console.log("Current filter:", status);
  console.log("Filtered orders:", filteredOrders);
  console.log("Orders with Pending status:", resData?.data.data?.filter(order => order.orderStatus === "Pending" || order.orderStatus === "pending"));
  console.log("All order statuses:", resData?.data.data?.map(order => order.orderStatus));
  console.log("Orders without status:", resData?.data.data?.filter(order => !order.orderStatus));
  console.log("Orders with fallback status:", resData?.data.data?.filter(order => (order.orderStatus || "Pending") === "Pending" || (order.orderStatus || "Pending") === "pending"));
  
  // Add detailed debug for pending filter
  if (status === "pending") {
    console.log("=== PENDING FILTER DEBUG ===");
    const pendingOrders = resData?.data.data?.filter(order => {
      const isPending = !order.orderStatus || 
                       order.orderStatus === "Pending" || 
                       order.orderStatus === "pending";
      console.log(`Order ${order._id}: status="${order.orderStatus}", isPending=${isPending}`);
      return isPending;
    });
    console.log("Final pending orders:", pendingOrders);
    console.log("=== END PENDING DEBUG ===");
  }
  console.log("=== END DEBUG ===");

  return (
    <section className="bg-[#1f1f1f] min-h-screen flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#1f1f1f] border-b border-[#333] px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BackButton />
            <h1 className="text-[#f5f5f5] text-xl font-bold">
              Orders
            </h1>
                         <span className="bg-[#f6b100] text-[#1f1f1f] px-2 py-1 rounded-full text-xs font-bold">
               {filteredOrders.length}
             </span>
                           {status === "pending" && (
                <>
                  <button 
                    onClick={async () => {
                      try {
                        console.log("Fixing orders status...");
                        const response = await fixOrdersStatus();
                        console.log("Fix response:", response);
                        enqueueSnackbar(`Fixed ${response.data.data.ordersUpdated} orders!`, { variant: "success" });
                        window.location.reload();
                      } catch (error) {
                        console.error("Error fixing orders:", error);
                        enqueueSnackbar("Error fixing orders!", { variant: "error" });
                      }
                    }}
                    className="bg-red-500 text-white px-2 py-1 rounded text-xs ml-2 hover:bg-red-600"
                  >
                    🔧 Fix Orders
                  </button>
                  <button 
                    onClick={() => {
                      console.log("Force refresh pending orders");
                      window.location.reload();
                    }}
                    className="bg-orange-500 text-white px-2 py-1 rounded text-xs ml-2 hover:bg-orange-600"
                  >
                    🔄 Refresh
                  </button>
                </>
              )}
          </div>
        </div>
        
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 mt-4 overflow-x-auto scrollbar-hide">
          <button 
            onClick={() => setStatus("all")} 
            className={`flex-shrink-0 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              status === "all" 
                ? "bg-[#f6b100] text-[#1f1f1f] shadow-md" 
                : "text-[#ababab] hover:bg-[#333] hover:text-white"
            }`}
          >
            All
          </button>
          <button 
            onClick={() => setStatus("pending")} 
            className={`flex-shrink-0 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              status === "pending" 
                ? "bg-[#3a2e1f] text-orange-400 shadow-md border border-orange-400" 
                : "text-orange-400 hover:bg-[#3a2e1f] hover:text-orange-300"
            }`}
          >
            Pending
          </button>
          <button 
            onClick={() => setStatus("progress")} 
            className={`flex-shrink-0 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              status === "progress" 
                ? "bg-[#4a452e] text-yellow-400 shadow-md border border-yellow-400" 
                : "text-yellow-400 hover:bg-[#4a452e] hover:text-yellow-300"
            }`}
          >
            In Progress
          </button>
          <button 
            onClick={() => setStatus("ready")} 
            className={`flex-shrink-0 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              status === "ready" 
                ? "bg-[#2e4a40] text-blue-400 shadow-md border border-blue-400" 
                : "text-blue-400 hover:bg-[#2e4a40] hover:text-blue-300"
            }`}
          >
            Ready
          </button>
          <button 
            onClick={() => setStatus("completed")} 
            className={`flex-shrink-0 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              status === "completed" 
                ? "bg-[#1f4a2e] text-green-400 shadow-md border border-green-400" 
                : "text-green-400 hover:bg-[#1f4a2e] hover:text-green-300"
            }`}
          >
            Completed
          </button>
        </div>
      </div>

             {/* Orders Grid */}
       <div className="flex-1 px-4 py-4">
         {isLoading ? (
           <div className="flex flex-col items-center justify-center h-64 text-center">
             <div className="text-[#f6b100] text-6xl mb-4 animate-spin">⏳</div>
             <p className="text-[#ababab] text-lg font-medium mb-2">Loading orders...</p>
             <p className="text-[#666] text-sm">Please wait</p>
           </div>
         ) : isError ? (
           <div className="flex flex-col items-center justify-center h-64 text-center">
             <div className="text-red-500 text-6xl mb-4">❌</div>
             <p className="text-[#ababab] text-lg font-medium mb-2">Error loading orders</p>
             <p className="text-[#666] text-sm">Please try again later</p>
             <button 
               onClick={() => window.location.reload()} 
               className="mt-4 bg-[#f6b100] text-[#1f1f1f] px-4 py-2 rounded-lg font-semibold"
             >
               Retry
             </button>
           </div>
         ) : filteredOrders.length > 0 ? (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
             {filteredOrders.map((order) => (
               <OrderCard key={order._id} order={order} />
             ))}
           </div>
         ) : (
           <div className="flex flex-col items-center justify-center h-64 text-center">
             <div className="text-[#ababab] text-6xl mb-4">📋</div>
             <p className="text-[#ababab] text-lg font-medium mb-2">No orders found</p>
             <p className="text-[#666] text-sm">
               {status === "all" 
                 ? "No orders available yet" 
                 : `No ${status} orders available`
               }
             </p>
                           <div className="mt-4 text-xs text-[#666]">
                <p>Total orders in database: {resData?.data.data?.length || 0}</p>
                <p>Orders with status: {resData?.data.data?.filter(o => o.orderStatus).length || 0}</p>
                <p>Orders without status: {resData?.data.data?.filter(o => !o.orderStatus).length || 0}</p>
                {status === "pending" && (
                  <div className="mt-2 p-2 bg-orange-900 rounded text-orange-200">
                    <p>🔍 Pending Debug Info:</p>
                                         <p>Orders with "Pending" status: {resData?.data.data?.filter(o => o.orderStatus === "Pending" || o.orderStatus === "pending").length || 0}</p>
                    <p>Orders without status: {resData?.data.data?.filter(o => !o.orderStatus).length || 0}</p>
                                         <p>Expected pending total: {resData?.data.data?.filter(o => !o.orderStatus || o.orderStatus === "Pending" || o.orderStatus === "pending").length || 0}</p>
                  </div>
                )}
              </div>
           </div>
         )}
       </div>

      <BottomNav />
    </section>
  );
};

export default Orders;
