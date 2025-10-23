import React, { useState, useEffect } from "react";
import BottomNav from "../components/shared/BottomNav";
import BackButton from "../components/shared/BackButton";
import TableCard from "../components/tables/TableCard";
import { keepPreviousData, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getTables, addTable } from "../https";
import { enqueueSnackbar } from "notistack";
import { FaPlus, FaTimes } from "react-icons/fa";
import { useSocket } from "../contexts/SocketContext";
import { useSelector } from "react-redux";

const Tables = () => {
  const [status, setStatus] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTable, setNewTable] = useState({
    tableNo: "",
    status: "Available"
  });
  const queryClient = useQueryClient();
  const { socket } = useSocket();
  const user = useSelector(state => state.user);

  useEffect(() => {
    document.title = "POS | Bàn"
  }, [])

  // Debug user authentication status
  useEffect(() => {
    console.log('👤 Current user state:', user);
    console.log('🔐 User authenticated:', user.isAuth);
    console.log('🆔 User ID:', user._id);
  }, [user]);

  // Listen for table updates via socket
  useEffect(() => {
    if (socket) {
      const handleTableUpdate = (tableData) => {
        console.log('Table updated via socket:', tableData);
        // Invalidate tables query to refetch latest data
        queryClient.invalidateQueries(['tables']);
      };

      socket.on('table-updated', handleTableUpdate);

      return () => {
        socket.off('table-updated', handleTableUpdate);
      };
    }
  }, [socket, queryClient]);

  const { data: resData, isError, error } = useQuery({
    queryKey: ["tables"],
    queryFn: async () => {
      console.log('🔍 Fetching tables...');
      return await getTables();
    },
    placeholderData: keepPreviousData,
  });

  // Mutation to create new table
  const addTableMutation = useMutation({
    mutationFn: (tableData) => addTable(tableData),
    onSuccess: () => {
      enqueueSnackbar("Tạo bàn thành công!", { variant: "success" });
      queryClient.invalidateQueries(["tables"]);
      setShowAddModal(false);
      setNewTable({ tableNo: "", status: "Available" });
    },
    onError: (error) => {
      console.log("Add Table Error:", error);
      enqueueSnackbar("Tạo bàn thất bại!", { variant: "error" });
    },
  });

  const handleAddTable = () => {
    if (!newTable.tableNo.trim()) {
      enqueueSnackbar("Vui lòng nhập số bàn!", { variant: "error" });
      return;
    }
    addTableMutation.mutate(newTable);
  };

  if(isError) {
    console.error('❌ Tables fetch error:', error);
    enqueueSnackbar("Đã xảy ra lỗi!", { variant: "error" })
  }

  console.log('📊 Tables data:', resData);
  console.log('❌ Tables error:', error);

  // Filter tables by status
  const filteredTables = resData?.data.data.filter(table => {
    if (status === "all") return true;
    if (status === "booked") return table.status === "Booked";
    if (status === "available") return table.status === "Available";
    if (status === "occupied") return table.status === "Occupied";
    return true;
  }) || [];

  return (
    <section className="bg-[#1f1f1f] h-[calc(100vh-5rem)] overflow-hidden">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between px-4 md:px-10 py-3 md:py-4 gap-3">
        <div className="flex items-center gap-3 md:gap-4">
          <BackButton />
          <h1 className="text-[#f5f5f5] text-xl md:text-2xl font-bold tracking-wider">
            Bàn
          </h1>
        </div>
        <div className="flex items-center justify-start md:justify-around gap-2 md:gap-4 overflow-x-auto w-full md:w-auto scrollbar-hide">
          <button
            onClick={() => setStatus("all")}
            className={`text-[#ababab] text-sm md:text-lg whitespace-nowrap ${
              status === "all" ? "bg-[#383838]" : ""
            } rounded-lg px-3 md:px-5 py-2 font-semibold transition-colors`}
          >
            Tất cả
          </button>
          <button
            onClick={() => setStatus("available")}
            className={`text-[#ababab] text-sm md:text-lg whitespace-nowrap ${
              status === "available" ? "bg-[#383838]" : ""
            } rounded-lg px-3 md:px-5 py-2 font-semibold transition-colors`}
          >
            Trống
          </button>
          <button
            onClick={() => setStatus("booked")}
            className={`text-[#ababab] text-sm md:text-lg whitespace-nowrap ${
              status === "booked" ? "bg-[#383838]" : ""
            } rounded-lg px-3 md:px-5 py-2 font-semibold transition-colors`}
          >
            Đã đặt
          </button>
          <button
            onClick={() => setStatus("occupied")}
            className={`text-[#ababab] text-sm md:text-lg whitespace-nowrap ${
              status === "occupied" ? "bg-[#383838]" : ""
            } rounded-lg px-3 md:px-5 py-2 font-semibold transition-colors`}
          >
            Đang dùng
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-[#f6b100] text-[#1f1f1f] px-3 md:px-4 py-2 rounded-lg font-semibold flex items-center gap-2 hover:bg-[#e6a100] transition-colors whitespace-nowrap text-sm md:text-base"
          >
            <FaPlus size={14} className="md:hidden" />
            <FaPlus size={16} className="hidden md:block" />
            <span className="hidden sm:inline">Thêm bàn</span>
            <span className="sm:hidden">Thêm</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4 px-4 md:px-8 lg:px-12 py-4 h-[calc(100vh-12rem)] md:h-[650px] overflow-y-scroll scrollbar-hide">
        {filteredTables.map((table) => {
          return (
            <TableCard
              key={table._id}
              id={table._id}
              name={table.tableNo}
              status={table.status}
              initials={table?.currentOrder?.customerDetails?.name}
              seats={table.seats}
              currentOrder={table.currentOrder}
            />
          );
        })}
      </div>

      {/* Add Table Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] rounded-lg p-4 md:p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-3 md:mb-4">
              <h2 className="text-[#f5f5f5] text-lg md:text-xl font-bold">Thêm bàn mới</h2>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-[#ababab] hover:text-white"
              >
                <FaTimes size={18} className="md:hidden" />
                <FaTimes size={20} className="hidden md:block" />
              </button>
            </div>
            
            <div className="space-y-3 md:space-y-4">
              <div>
                <label className="block text-[#ababab] mb-1.5 md:mb-2 text-xs md:text-sm font-medium">Số bàn</label>
                <input
                  type="text"
                  value={newTable.tableNo}
                  onChange={(e) => setNewTable({...newTable, tableNo: e.target.value})}
                  placeholder="Nhập số bàn"
                  className="w-full bg-[#262626] text-[#f5f5f5] rounded-lg p-2.5 md:p-3 focus:outline-none focus:ring-2 focus:ring-[#f6b100] text-sm md:text-base"
                />
              </div>
              

              <div>
                <label className="block text-[#ababab] mb-1.5 md:mb-2 text-xs md:text-sm font-medium">Số ghế</label>
                <select
                  value={newTable.seats}
                  onChange={(e) => setNewTable({...newTable, seats: parseInt(e.target.value)})}
                  className="w-full bg-[#262626] text-[#f5f5f5] rounded-lg p-2.5 md:p-3 focus:outline-none focus:ring-2 focus:ring-[#f6b100] text-sm md:text-base"
                >
                  <option value={2}>2 ghế</option>
                  <option value={4}>4 ghế</option>
                  <option value={6}>6 ghế</option>
                  <option value={8}>8 ghế</option>
                  <option value={10}>10 ghế</option>
                  <option value={12}>12 ghế</option>
                </select>
              </div>

              
              <div>
                <label className="block text-[#ababab] mb-1.5 md:mb-2 text-xs md:text-sm font-medium">Trạng thái ban đầu</label>
                <select
                  value={newTable.status}
                  onChange={(e) => setNewTable({...newTable, status: e.target.value})}
                  className="w-full bg-[#262626] text-[#f5f5f5] rounded-lg p-2.5 md:p-3 focus:outline-none focus:ring-2 focus:ring-[#f6b100] text-sm md:text-base"
                >
                  <option value="Available">Trống</option>
                  <option value="Booked">Đã đặt</option>
                  <option value="Occupied">Đang dùng</option>
                </select>
              </div>
            </div>

            <div className="mt-4 md:mt-6 flex justify-end gap-2 md:gap-3">
              <button 
                onClick={() => setShowAddModal(false)}
                className="bg-[#383838] text-[#f5f5f5] px-3 md:px-4 py-2 rounded-lg font-semibold hover:bg-[#4a4a4a] transition-colors text-sm md:text-base"
              >
                Hủy
              </button>
              <button 
                onClick={handleAddTable}
                disabled={addTableMutation.isPending}
                className={`px-3 md:px-4 py-2 rounded-lg font-semibold text-sm md:text-base ${
                  addTableMutation.isPending
                    ? "bg-[#2a2a2a] text-[#666] cursor-not-allowed"
                    : "bg-[#f6b100] text-[#1f1f1f] hover:bg-[#e6a100]"
                }`}
              >
                {addTableMutation.isPending ? "Đang tạo..." : "Tạo bàn"}
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </section>
  );
};

export default Tables;
