import React, { useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { useQuery } from '@tanstack/react-query';
import { axiosWrapper } from '../../https/axiosWrapper';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';

const GROUPS = [
  { key: 'day', label: 'Ngày' },
  { key: 'week', label: 'Tuần' },
  { key: 'month', label: 'Tháng' },
  { key: 'quarter', label: 'Quý' },
  { key: 'year', label: 'Năm' },
];

const ANALYTICS_TABS = [
  { key: 'revenue', label: '💰 Doanh thu', icon: '💰' },
  { key: 'tables', label: '🪑 Bàn ăn', icon: '🪑' },
  { key: 'customers', label: '👥 Khách hàng', icon: '👥' },
  { key: 'stock', label: '📦 Kho', icon: '📦' },
];

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#8dd1e1', '#a4de6c'];

export default function AnalyticsSection() {
  const [activeTab, setActiveTab] = useState('revenue');
  const [groupBy, setGroupBy] = useState('month');
  const [range, setRange] = useState({
    from: dayjs().subtract(3, 'month').format('YYYY-MM-DD'),
    to: dayjs().format('YYYY-MM-DD')
  });

  const revenueQuery = useQuery({
    queryKey: ['analytics-revenue', groupBy, range],
    queryFn: async () => {
      const res = await axiosWrapper.get(`/api/analytics/revenue`, { params: { groupBy, from: range.from, to: range.to } });
      return res.data?.data || { series: [], totals: {} };
    },
    keepPreviousData: true,
  });

  const stockQuery = useQuery({
    queryKey: ['analytics-stock', groupBy, range],
    queryFn: async () => {
      const res = await axiosWrapper.get(`/api/analytics/stock`, { params: { groupBy, from: range.from, to: range.to } });
      return res.data?.data || { series: [], topIngredients: [] };
    },
    keepPreviousData: true,
  });

  const tableQuery = useQuery({
    queryKey: ['analytics-tables', groupBy, range],
    queryFn: async () => {
      const res = await axiosWrapper.get(`/api/analytics/tables`, { params: { groupBy, from: range.from, to: range.to } });
      return res.data?.data || { series: [], tableStatus: {}, popularTables: [] };
    },
    keepPreviousData: true,
  });

  const customerQuery = useQuery({
    queryKey: ['analytics-customers', groupBy, range],
    queryFn: async () => {
      const res = await axiosWrapper.get(`/api/analytics/customers`, { params: { groupBy, from: range.from, to: range.to } });
      return res.data?.data || { series: [], topCustomers: [], totals: {} };
    },
    keepPreviousData: true,
  });

  // Helper function to parse labels for chronological sorting
  const parseLabelForSorting = (label) => {
    // DD/MM/YYYY -> YYYY-MM-DD
    if (label.includes('/') && label.split('/').length === 3) {
      const [d, m, y] = label.split('/');
      return `${y}-${m}-${d}`;
    }
    // MM/YYYY -> YYYY-MM
    if (label.includes('/') && label.split('/').length === 2) {
      const [m, y] = label.split('/');
      return `${y}-${m}`;
    }
    // Tuần X/YYYY -> YYYY-WX
    if (label.startsWith('Tuần')) {
      const [_, rest] = label.split(' ');
      const [w, y] = rest.split('/');
      return `${y}-W${String(w).padStart(2, '0')}`;
    }
    // Q1/YYYY -> YYYY-Q1
    if (label.startsWith('Q')) {
      const [q, y] = label.split('/');
      return `${y}-${q}`;
    }
    return label;
  };

  const revenueData = useMemo(() => {
    const s = revenueQuery.data?.series || [];
    return s.map(r => ({
      label: r.label,
      orders: r.orderAmount || 0,
      payments: r.paymentAmount || 0,
      total: (r.orderAmount || 0) + (r.paymentAmount || 0)
    })).sort((a, b) => parseLabelForSorting(a.label).localeCompare(parseLabelForSorting(b.label)));
  }, [revenueQuery.data]);

  const tableSeries = useMemo(() => {
    const s = tableQuery.data?.series || [];
    return [...s].sort((a, b) => parseLabelForSorting(a.label).localeCompare(parseLabelForSorting(b.label)));
  }, [tableQuery.data]);

  const customerSeries = useMemo(() => {
    const s = customerQuery.data?.series || [];
    return [...s].sort((a, b) => parseLabelForSorting(a.label).localeCompare(parseLabelForSorting(b.label)));
  }, [customerQuery.data]);

  const stockSeries = useMemo(() => {
    const s = stockQuery.data?.series || [];
    const map = new Map();
    for (const row of s) {
      const base = map.get(row.label) || { label: row.label, IN_amount: 0, OUT_amount: 0, IN_qty: 0, OUT_qty: 0 };
      base[`${row.type}_amount`] = row.amount;
      base[`${row.type}_qty`] = row.quantity;
      map.set(row.label, base);
    }
    // Sort chronologically
    return Array.from(map.values()).sort((a, b) => parseLabelForSorting(a.label).localeCompare(parseLabelForSorting(b.label)));
  }, [stockQuery.data]);

  const currency = (amount) => new Intl.NumberFormat('hu-HU', { style: 'currency', currency: 'HUF' }).format(amount || 0);

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Tab Selector */}
      <div className="bg-[#262626] border border-[#3a3a3a] rounded-lg p-1.5">
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
          {ANALYTICS_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 md:px-4 py-2 rounded-lg text-sm md:text-base font-semibold whitespace-nowrap transition-colors ${
                activeTab === tab.key
                  ? 'bg-[#F6B100] text-[#1a1a1a]'
                  : 'bg-[#1e1e1e] text-[#ababab] hover:bg-[#2a2a2a] hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-[#262626] border border-[#3a3a3a] rounded-lg p-3 md:p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        <div>
          <label className="block text-sm text-[#ababab] mb-1">Nhóm theo</label>
          <select value={groupBy} onChange={e => setGroupBy(e.target.value)} className="w-full bg-[#1e1e1e] border border-[#3a3a3a] rounded p-2 text-white">
            {GROUPS.map(g => <option key={g.key} value={g.key}>{g.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm text-[#ababab] mb-1">Từ ngày</label>
          <input type="date" value={range.from} onChange={e => setRange(r => ({ ...r, from: e.target.value }))} className="w-full bg-[#1e1e1e] border border-[#3a3a3a] rounded p-2 text-white" />
        </div>
        <div>
          <label className="block text-sm text-[#ababab] mb-1">Đến ngày</label>
          <input type="date" value={range.to} onChange={e => setRange(r => ({ ...r, to: e.target.value }))} className="w-full bg-[#1e1e1e] border border-[#3a3a3a] rounded p-2 text-white" />
        </div>
      </div>

      {/* Revenue Analytics */}
      {activeTab === 'revenue' && (
        <>
          <div className="bg-[#262626] border border-[#3a3a3a] rounded-lg p-3 md:p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 md:mb-4 gap-2">
              <h2 className="text-lg md:text-xl font-semibold">💰 Biểu đồ doanh thu</h2>
              {revenueQuery.data?.totals && (
                <div className="text-[#ababab] text-xs md:text-sm">
                  Tổng: {currency((revenueQuery.data.totals.totalOrderRevenue || 0) + (revenueQuery.data.totals.totalPaymentRevenue || 0))}
                </div>
              )}
            </div>
            <div className="h-56 md:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData} margin={{ left: 0, right: 8, top: 5, bottom: 5 }}>
                  <XAxis dataKey="label" stroke="#ababab" tick={{ fill: '#ababab', fontSize: 12 }} />
                  <YAxis stroke="#ababab" tick={{ fill: '#ababab', fontSize: 12 }} />
                  <Tooltip contentStyle={{ background: '#1e1e1e', border: '1px solid #3a3a3a', color: '#fff' }} formatter={(v, n) => [currency(v), n]} />
                  <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px' }} />
                  <Area type="monotone" dataKey="total" stroke="#F6B100" fill="#F6B100" fillOpacity={0.3} name="Tổng doanh thu" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            <div className="bg-[#262626] border border-[#3a3a3a] rounded-lg p-4 md:p-6">
              <p className="text-[#ababab] text-xs md:text-sm mb-1 md:mb-2">Tổng doanh thu (Order)</p>
              <p className="text-xl md:text-2xl font-bold text-green-400">{currency(revenueQuery.data?.totals?.totalOrderRevenue || 0)}</p>
              <p className="text-xs text-[#ababab] mt-1">{revenueQuery.data?.totals?.totalOrders || 0} đơn</p>
            </div>
            <div className="bg-[#262626] border border-[#3a3a3a] rounded-lg p-4 md:p-6">
              <p className="text-[#ababab] text-xs md:text-sm mb-1 md:mb-2">Tổng doanh thu (Payment)</p>
              <p className="text-xl md:text-2xl font-bold text-blue-400">{currency(revenueQuery.data?.totals?.totalPaymentRevenue || 0)}</p>
              <p className="text-xs text-[#ababab] mt-1">{revenueQuery.data?.totals?.totalPayments || 0} thanh toán</p>
            </div>
            <div className="bg-[#262626] border border-[#3a3a3a] rounded-lg p-4 md:p-6 sm:col-span-2 lg:col-span-1">
              <p className="text-[#ababab] text-xs md:text-sm mb-1 md:mb-2">Khoảng thời gian</p>
              <p className="text-base md:text-lg font-bold text-white">{dayjs(range.from).format('DD/MM/YY')} - {dayjs(range.to).format('DD/MM/YY')}</p>
              <p className="text-xs text-[#ababab] mt-1">Nhóm theo: {GROUPS.find(g => g.key === groupBy)?.label}</p>
            </div>
          </div>
        </>
      )}

      {/* Table Analytics */}
      {activeTab === 'tables' && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            <div className="bg-[#262626] border border-[#3a3a3a] rounded-lg p-4 md:p-6">
              <p className="text-[#ababab] text-xs md:text-sm mb-1 md:mb-2">Tổng số bàn</p>
              <p className="text-2xl md:text-3xl font-bold text-white">{tableQuery.data?.tableStatus?.total || 0}</p>
            </div>
            <div className="bg-green-900/30 border border-green-700 rounded-lg p-4 md:p-6">
              <p className="text-green-300 text-xs md:text-sm mb-1 md:mb-2">Bàn trống</p>
              <p className="text-2xl md:text-3xl font-bold text-green-400">{tableQuery.data?.tableStatus?.available || 0}</p>
            </div>
            <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4 md:p-6">
              <p className="text-blue-300 text-xs md:text-sm mb-1 md:mb-2">Đang sử dụng</p>
              <p className="text-2xl md:text-3xl font-bold text-blue-400">{tableQuery.data?.tableStatus?.occupied || 0}</p>
            </div>
            <div className="bg-orange-900/30 border border-orange-700 rounded-lg p-4 md:p-6">
              <p className="text-orange-300 text-xs md:text-sm mb-1 md:mb-2">Đã đặt</p>
              <p className="text-2xl md:text-3xl font-bold text-orange-400">{tableQuery.data?.tableStatus?.booked || 0}</p>
            </div>
          </div>

          <div className="bg-[#262626] border border-[#3a3a3a] rounded-lg p-3 md:p-4">
            <h2 className="text-lg md:text-xl font-semibold mb-3 md:mb-4">🪑 Số bàn được sử dụng theo thời gian</h2>
            <div className="h-56 md:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tableSeries} margin={{ left: 0, right: 8, top: 5, bottom: 5 }}>
                  <XAxis dataKey="label" stroke="#ababab" tick={{ fill: '#ababab', fontSize: 12 }} />
                  <YAxis stroke="#ababab" tick={{ fill: '#ababab', fontSize: 12 }} />
                  <Tooltip contentStyle={{ background: '#1e1e1e', border: '1px solid #3a3a3a', color: '#fff' }} />
                  <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="tableCount" fill="#F6B100" name="Số bàn đã dùng" />
                  <Bar dataKey="totalOrders" fill="#82ca9d" name="Tổng đơn" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-[#262626] border border-[#3a3a3a] rounded-lg p-3 md:p-4">
            <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4">Top bàn phổ biến</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-[#3a3a3a]">
                  <tr className="text-[#ababab] text-xs md:text-sm">
                    <th className="text-left py-2">Số bàn</th>
                    <th className="text-right py-2">Số đơn</th>
                    <th className="text-right py-2">Doanh thu</th>
                  </tr>
                </thead>
                <tbody>
                  {(tableQuery.data?.popularTables || []).map((table, idx) => (
                    <tr key={idx} className="border-b border-[#2a2a2a]">
                      <td className="py-2 md:py-3 font-semibold text-sm md:text-base">Bàn {table.tableNumber}</td>
                      <td className="text-right text-[#ababab] text-sm md:text-base">{table.orderCount} đơn</td>
                      <td className="text-right text-green-400 font-semibold text-sm md:text-base">{currency(table.totalRevenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Customer Analytics */}
      {activeTab === 'customers' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            <div className="bg-[#262626] border border-[#3a3a3a] rounded-lg p-4 md:p-6">
              <p className="text-[#ababab] text-xs md:text-sm mb-1 md:mb-2">Tổng số khách</p>
              <p className="text-2xl md:text-3xl font-bold text-[#F6B100]">{customerQuery.data?.totals?.totalGuests || 0}</p>
              <p className="text-xs text-[#ababab] mt-1">Trong khoảng thời gian</p>
            </div>
            <div className="bg-[#262626] border border-[#3a3a3a] rounded-lg p-4 md:p-6">
              <p className="text-[#ababab] text-xs md:text-sm mb-1 md:mb-2">Khách hàng unique</p>
              <p className="text-2xl md:text-3xl font-bold text-blue-400">{customerQuery.data?.totals?.uniqueCustomers || 0}</p>
              <p className="text-xs text-[#ababab] mt-1">Theo số điện thoại</p>
            </div>
            <div className="bg-[#262626] border border-[#3a3a3a] rounded-lg p-4 md:p-6 sm:col-span-2 lg:col-span-1">
              <p className="text-[#ababab] text-xs md:text-sm mb-1 md:mb-2">Tổng đơn hàng</p>
              <p className="text-2xl md:text-3xl font-bold text-green-400">{customerQuery.data?.totals?.totalOrders || 0}</p>
              <p className="text-xs text-[#ababab] mt-1">Đơn đã tạo</p>
            </div>
          </div>

          <div className="bg-[#262626] border border-[#3a3a3a] rounded-lg p-3 md:p-4">
            <h2 className="text-lg md:text-xl font-semibold mb-3 md:mb-4">👥 Lượng khách theo thời gian</h2>
            <div className="h-56 md:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={customerSeries} margin={{ left: 0, right: 8, top: 5, bottom: 5 }}>
                  <XAxis dataKey="label" stroke="#ababab" tick={{ fill: '#ababab', fontSize: 12 }} />
                  <YAxis stroke="#ababab" tick={{ fill: '#ababab', fontSize: 12 }} />
                  <Tooltip contentStyle={{ background: '#1e1e1e', border: '1px solid #3a3a3a', color: '#fff' }} />
                  <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px' }} />
                  <Area type="monotone" dataKey="totalGuests" stroke="#F6B100" fill="#F6B100" fillOpacity={0.3} name="Tổng số khách" />
                  <Area type="monotone" dataKey="uniqueCustomers" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.3} name="Khách unique" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-[#262626] border border-[#3a3a3a] rounded-lg p-3 md:p-4">
            <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4">Top khách hàng thân thiết</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-[#3a3a3a]">
                  <tr className="text-[#ababab] text-xs md:text-sm">
                    <th className="text-left py-2">Tên</th>
                    <th className="text-left py-2 hidden sm:table-cell">SĐT</th>
                    <th className="text-right py-2">Số đơn</th>
                    <th className="text-right py-2">Tổng chi</th>
                    <th className="text-right py-2 hidden md:table-cell">TB/đơn</th>
                  </tr>
                </thead>
                <tbody>
                  {(customerQuery.data?.topCustomers || []).map((customer, idx) => (
                    <tr key={idx} className="border-b border-[#2a2a2a]">
                      <td className="py-2 md:py-3 font-semibold text-sm md:text-base">{customer.name || 'N/A'}</td>
                      <td className="text-[#ababab] text-sm md:text-base hidden sm:table-cell">{customer.phone || 'N/A'}</td>
                      <td className="text-right text-[#ababab] text-sm md:text-base">{customer.orderCount}</td>
                      <td className="text-right text-green-400 font-semibold text-sm md:text-base">{currency(customer.totalSpent)}</td>
                      <td className="text-right text-blue-400 text-sm md:text-base hidden md:table-cell">{currency(customer.avgSpent)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Stock Analytics */}
      {activeTab === 'stock' && (
        <>
          <div className="bg-[#262626] border border-[#3a3a3a] rounded-lg p-3 md:p-4">
            <h2 className="text-lg md:text-xl font-semibold mb-3 md:mb-4">📦 Nhập/Xuất kho (HUF)</h2>
            <div className="h-56 md:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stockSeries} margin={{ left: 0, right: 8, top: 5, bottom: 5 }}>
                  <XAxis dataKey="label" stroke="#ababab" tick={{ fill: '#ababab', fontSize: 12 }} />
                  <YAxis stroke="#ababab" tick={{ fill: '#ababab', fontSize: 12 }} />
                  <Tooltip contentStyle={{ background: '#1e1e1e', border: '1px solid #3a3a3a', color: '#fff' }} formatter={(v) => currency(v)} />
                  <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="IN_amount" stackId="a" fill="#82ca9d" name="Nhập (IN)" />
                  <Bar dataKey="OUT_amount" stackId="a" fill="#ff8042" name="Xuất (OUT)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            <div className="bg-[#262626] border border-[#3a3a3a] rounded-lg p-3 md:p-4">
              <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4">Top nguyên liệu theo giá trị</h3>
              <div className="h-56 md:h-72 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={(stockQuery.data?.topIngredients || []).map((d, i) => ({ name: `${d.ingredientName || 'N/A'} (${d.type})`, value: d.amount }))} dataKey="value" nameKey="name" outerRadius={80} label={(entry) => entry.name}>
                      {(stockQuery.data?.topIngredients || []).map((_, i) => (
                        <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#1e1e1e', border: '1px solid #3a3a3a', color: '#fff' }} formatter={(v, n) => [currency(v), n]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-[#262626] border border-[#3a3a3a] rounded-lg p-3 md:p-4">
              <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4">Chi tiết nguyên liệu</h3>
              <div className="space-y-2 max-h-56 md:max-h-72 overflow-y-auto">
                {(stockQuery.data?.topIngredients || []).map((item, idx) => (
                  <div key={idx} className="bg-[#1e1e1e] p-2 md:p-3 rounded-lg">
                    <div className="flex justify-between items-center gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm md:text-base truncate">{item.ingredientName || 'N/A'}</p>
                        <p className="text-xs text-[#ababab]">{item.type === 'IN' ? 'Nhập kho' : 'Xuất kho'} • {item.count} giao dịch</p>
                      </div>
                      <p className="text-base md:text-lg font-bold text-[#F6B100] whitespace-nowrap">{currency(item.amount)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}


