import React from 'react';
import BottomNav from '../components/shared/BottomNav';
import AnalyticsSection from '../components/dashboard/AnalyticsSection';

export default function Analytics() {
  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white p-6 pb-24">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-[#F6B100]">Thống kê</h1>
          <p className="text-[#ababab] mt-2">Doanh thu, nhập/xuất kho theo ngày/tháng/năm/tuần/quý</p>
        </div>
        <AnalyticsSection />
      </div>
      <BottomNav />
    </div>
  );
}


