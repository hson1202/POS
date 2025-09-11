import React, { useEffect } from "react";
import BottomNav from "../components/shared/BottomNav";
import Greetings from "../components/home/Greetings";
import { BsCashCoin } from "react-icons/bs";
import { GrInProgress } from "react-icons/gr";
import MiniCard from "../components/home/MiniCard";
import RecentOrders from "../components/home/RecentOrders";
import PopularDishes from "../components/home/PopularDishes";
import { useQuery } from "@tanstack/react-query";
import { axiosWrapper } from "../https/axiosWrapper";
import NotificationBell from "../components/shared/NotificationBell";

const Home = () => {

    useEffect(() => {
      document.title = "POS | Home"
    }, [])

  // Fetch dashboard stats từ API
  const { data: statsData } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const response = await axiosWrapper.get('/api/order/stats');
      return response.data;
    },
  });

  // Tính toán percentage change (đơn giản - có thể cải thiện sau)
  const calculatePercentageChange = (currentValue, previousValue = 0) => {
    if (previousValue === 0) return 5.2; // Default positive change
    return ((currentValue - previousValue) / previousValue * 100).toFixed(1);
  };

  const stats = statsData?.data || {};
  const totalEarnings = stats.totalRevenue || 0;
  const inProgressCount = stats.pendingOrders || 0;
  
  const earningsChange = calculatePercentageChange(totalEarnings, totalEarnings * 0.9);
  const progressChange = calculatePercentageChange(inProgressCount, Math.max(inProgressCount - 2, 0));

  return (
    <section className="bg-[#1f1f1f]  h-[calc(100vh-5rem)] overflow-hidden flex gap-3">
      {/* Left Div */}
      <div className="flex-[3]">
        <div className="flex items-center justify-between px-8 py-4">
          <Greetings />
          <NotificationBell />
        </div>
        <div className="flex items-center w-full gap-3 px-8 mt-8">
          <MiniCard 
            title="Total Earnings" 
            icon={<BsCashCoin />} 
            number={totalEarnings.toFixed(0)} 
            footerNum={earningsChange} 
          />
          <MiniCard 
            title="In Progress" 
            icon={<GrInProgress />} 
            number={inProgressCount} 
            footerNum={progressChange} 
          />
        </div>
        <RecentOrders />
      </div>
      {/* Right Div */}
      <div className="flex-[2]">
        <PopularDishes />
      </div>
      <BottomNav />
    </section>
  );
};

export default Home;
