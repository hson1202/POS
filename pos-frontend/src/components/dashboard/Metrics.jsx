import React from "react";
import { useQuery } from "@tanstack/react-query";
import { axiosWrapper } from "../../https/axiosWrapper";
import { FaSpinner } from "react-icons/fa";

const Metrics = () => {
  // Fetch dashboard stats from API
  const { data: statsData, isLoading, error } = useQuery({
    queryKey: ["dashboard-metrics"],
    queryFn: async () => {
      const response = await axiosWrapper.get('/api/order/stats');
      return response.data;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const stats = statsData?.data || {};

  // Transform API data to match the UI structure
  const metricsData = [
    { 
      title: "Revenue", 
      value: new Intl.NumberFormat('hu-HU', {
        style: 'currency',
        currency: 'HUF'
      }).format(stats.totalRevenue || 0), 
      percentage: "12%", 
      color: "#025cca", 
      isIncrease: true 
    },
    { 
      title: "Total Orders", 
      value: stats.totalOrders || "0", 
      percentage: "16%", 
      color: "#02ca3a", 
      isIncrease: true 
    },
    { 
      title: "Total Customer", 
      value: stats.totalUsers || "0", 
      percentage: "10%", 
      color: "#f6b100", 
      isIncrease: true 
    },
    { 
      title: "Completed Orders", 
      value: stats.completedOrders || "0", 
      percentage: "10%", 
      color: "#be3e3f", 
      isIncrease: false 
    },
  ];

  const itemsData = [
    { 
      title: "Total Tables", 
      value: stats.totalTables || "0", 
      percentage: "12%", 
      color: "#5b45b0", 
      isIncrease: false 
    },
    { 
      title: "Available Tables", 
      value: stats.availableTables || "0", 
      percentage: "12%", 
      color: "#285430", 
      isIncrease: true 
    },
    { 
      title: "Pending Orders", 
      value: stats.pendingOrders || "0", 
      percentage: "12%", 
      color: "#735f32", 
      isIncrease: true 
    },
    { 
      title: "Occupied Tables", 
      value: stats.occupiedTables || "0", 
      color: "#7f167f"
    }
  ];

  if (isLoading) {
    return (
      <div className="container mx-auto py-2 px-6 md:px-4">
        <div className="flex items-center justify-center h-64">
          <FaSpinner className="animate-spin text-4xl text-[#F6B100]" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-2 px-6 md:px-4">
        <div className="text-center text-[#ababab]">
          Unable to load metrics data
        </div>
      </div>
    );
  }
  return (
    <div className="container mx-auto py-2 px-6 md:px-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="font-semibold text-[#f5f5f5] text-xl">
            Overall Performance
          </h2>
          <p className="text-sm text-[#ababab]">
            Lorem, ipsum dolor sit amet consectetur adipisicing elit.
            Distinctio, obcaecati?
          </p>
        </div>
        <button className="flex items-center gap-1 px-4 py-2 rounded-md text-[#f5f5f5] bg-[#1a1a1a]">
          Last 1 Month
          <svg
            className="w-3 h-3"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="4"
          >
            <path d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      <div className="mt-6 grid grid-cols-4 gap-4">
        {metricsData.map((metric, index) => {
          return (
            <div
              key={index}
              className="shadow-sm rounded-lg p-4"
              style={{ backgroundColor: metric.color }}
            >
              <div className="flex justify-between items-center">
                <p className="font-medium text-xs text-[#f5f5f5]">
                  {metric.title}
                </p>
                <div className="flex items-center gap-1">
                  <svg
                    className="w-3 h-3"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                    style={{ color: metric.isIncrease ? "#f5f5f5" : "red" }}
                  >
                    <path
                      d={metric.isIncrease ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"}
                    />
                  </svg>
                  <p
                    className="font-medium text-xs"
                    style={{ color: metric.isIncrease ? "#f5f5f5" : "red" }}
                  >
                    {metric.percentage}
                  </p>
                </div>
              </div>
              <p className="mt-1 font-semibold text-2xl text-[#f5f5f5]">
                {metric.value}
              </p>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col justify-between mt-12">
        <div>
          <h2 className="font-semibold text-[#f5f5f5] text-xl">
            Item Details
          </h2>
          <p className="text-sm text-[#ababab]">
            Lorem, ipsum dolor sit amet consectetur adipisicing elit.
            Distinctio, obcaecati?
          </p>
        </div>

        <div className="mt-6 grid grid-cols-4 gap-4">

            {
                itemsData.map((item, index) => {
                    return (
                        <div key={index} className="shadow-sm rounded-lg p-4" style={{ backgroundColor: item.color }}>
                        <div className="flex justify-between items-center">
                          <p className="font-medium text-xs text-[#f5f5f5]">{item.title}</p>
                          <div className="flex items-center gap-1">
                            <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4" fill="none">
                              <path d="M5 15l7-7 7 7" />
                            </svg>
                            <p className="font-medium text-xs text-[#f5f5f5]">{item.percentage}</p>
                          </div>
                        </div>
                        <p className="mt-1 font-semibold text-2xl text-[#f5f5f5]">{item.value}</p>
                      </div>
                    )
                })
            }

        </div>
      </div>
    </div>
  );
};

export default Metrics;
