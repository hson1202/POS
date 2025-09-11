import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { axiosWrapper } from "../../https/axiosWrapper";
import { FaUtensils } from "react-icons/fa";

const PopularDishes = () => {
  // Fetch popular dishes from API
  const { data: popularDishesData, isLoading, error } = useQuery({
    queryKey: ["popular-dishes"],
    queryFn: async () => {
      const response = await axiosWrapper.get('/api/order/popular');
      return response.data;
    },
    refetchInterval: 60000, // Refresh every minute
  });

  const popularDishes = popularDishesData?.data || [];

  return (
    <div className="mt-6 pr-6">
      <div className="bg-[#1a1a1a] w-full rounded-lg">
        <div className="flex justify-between items-center px-6 py-4">
          <h1 className="text-[#f5f5f5] text-lg font-semibold tracking-wide">
            Popular Dishes
          </h1>
          <a href="/menu" className="text-[#025cca] text-sm font-semibold">
            View all
          </a>
        </div>

        <div className="overflow-y-scroll h-[680px] scrollbar-hide">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F6B100]"></div>
              <p className="text-[#ababab] mt-4">Loading popular dishes...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full">
              <FaUtensils className="text-4xl text-[#ababab] mb-4" />
              <p className="text-[#ababab]">Unable to load popular dishes</p>
            </div>
          ) : popularDishes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full">
              <FaUtensils className="text-4xl text-[#ababab] mb-4" />
              <p className="text-[#ababab]">No popular dishes yet</p>
              <p className="text-[#ababab] text-sm mt-2">Start taking orders to see popular items</p>
            </div>
          ) : (
            popularDishes.map((dish, index) => {
              return (
                <div
                  key={dish.id}
                  className="flex items-center gap-4 bg-[#1f1f1f] rounded-[15px] px-6 py-4 mt-4 mx-6 hover:bg-[#262626] transition-colors cursor-pointer"
                >
                  <h1 className="text-[#f5f5f5] font-bold text-xl mr-4">
                    {index + 1 < 10 ? `0${index + 1}` : index + 1}
                  </h1>
                  <div className="w-[50px] h-[50px] rounded-full bg-[#262626] flex items-center justify-center">
                    <FaUtensils className="text-[#F6B100] text-xl" />
                  </div>
                  <div className="flex-1">
                    <h1 className="text-[#f5f5f5] font-semibold tracking-wide">{dish.name}</h1>
                    <p className="text-[#f5f5f5] text-sm font-semibold mt-1">
                      <span className="text-[#ababab]">Orders: </span>
                      {dish.count}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[#F6B100] text-sm font-semibold">
                      {new Intl.NumberFormat('hu-HU', {
                        style: 'currency',
                        currency: 'HUF'
                      }).format(dish.revenue || 0)}
                    </p>
                    <p className="text-[#ababab] text-xs">Total Revenue</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default PopularDishes;
