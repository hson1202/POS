import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAvatarName, getBgColor } from "../../utils"
import { useDispatch } from "react-redux";
import { updateTable, setCustomer } from "../../redux/slices/customerSlice";
import { FaLongArrowAltRight, FaTimes, FaUtensils, FaClock, FaCheck, FaUserPlus, FaTrash } from "react-icons/fa";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateTable as updateTableAPI, deleteTable as deleteTableAPI } from "../../https";
import { enqueueSnackbar } from "notistack";

const TableCard = ({id, name, status, initials, seats, currentOrder}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [bookingData, setBookingData] = useState({
    customerName: "",
    customerPhone: "",
    guests: 1,
    notes: "",
    reservationDate: "",
    reservationTime: ""
  });
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handleClick = (name) => {
    // Nếu bàn đã đặt hoặc đang dùng (có currentOrder) thì mở chi tiết để xem món
    if (status !== "Available" || currentOrder) {
      setShowDetails(true);
      return;
    }

    const table = { tableId: id, tableNo: name }
    dispatch(updateTable({table}))
    navigate(`/table/${name}`);
  };

  // Mutation to update table status
  const updateTableMutation = useMutation({
    mutationFn: ({ tableId, ...tableData }) => updateTableAPI({ tableId, ...tableData }),
    onSuccess: () => {
      enqueueSnackbar("Cập nhật trạng thái bàn thành công!", { variant: "success" });
      queryClient.invalidateQueries(["tables"]);
      queryClient.invalidateQueries(["orders"]);
      setShowDetails(false);
      setShowBookingModal(false);
      // Reset form
      setBookingData({
        customerName: "",
        customerPhone: "",
        guests: 1,
        notes: "",
        reservationDate: "",
        reservationTime: ""
      });
    },
    onError: (error) => {
      console.log("Update Table Error:", error);
      enqueueSnackbar("Cập nhật trạng thái bàn thất bại!", { variant: "error" });
    },
  });

  // Mutation to delete table
  const deleteTableMutation = useMutation({
    mutationFn: (tableId) => deleteTableAPI(tableId),
    onSuccess: () => {
      enqueueSnackbar("Xóa bàn thành công!", { variant: "success" });
      queryClient.invalidateQueries(["tables"]);
      setShowDetails(false);
      setShowDeleteConfirm(false);
    },
    onError: (error) => {
      console.log("Delete Table Error:", error);
      const errorMessage = error.response?.data?.message || "Xóa bàn thất bại!";
      enqueueSnackbar(errorMessage, { variant: "error" });
    },
  });

  const handleStatusUpdate = (newStatus) => {
    updateTableMutation.mutate({
      tableId: id,
      status: newStatus,
      orderId: null // Clear order when changing to Available
    });
  };

  const handleDeleteTable = () => {
    deleteTableMutation.mutate(id);
  };

  const handleBookTable = () => {
    if (!bookingData.customerName.trim()) {
      enqueueSnackbar("Vui lòng nhập tên khách!", { variant: "error" });
      return;
    }
    if (!bookingData.customerPhone.trim()) {
      enqueueSnackbar("Vui lòng nhập SĐT khách!", { variant: "error" });
      return;
    }
    if (!bookingData.reservationDate) {
      enqueueSnackbar("Vui lòng chọn ngày đến!", { variant: "error" });
      return;
    }
    if (!bookingData.reservationTime) {
      enqueueSnackbar("Vui lòng chọn giờ đến!", { variant: "error" });
      return;
    }

    // Combine date and time into ISO string
    const reservationDateTime = new Date(`${bookingData.reservationDate}T${bookingData.reservationTime}`);
    
    // Validate not in the past
    if (reservationDateTime < new Date()) {
      enqueueSnackbar("Không thể đặt bàn vào thời gian trong quá khứ!", { variant: "error" });
      return;
    }

    updateTableMutation.mutate({
      tableId: id,
      status: "Booked",
      currentOrder: {
        customerDetails: {
          name: bookingData.customerName,
          phone: bookingData.customerPhone,
          guests: bookingData.guests
        },
        notes: bookingData.notes,
        bookingTime: new Date().toISOString(),
        reservationDateTime: reservationDateTime.toISOString()
      }
    });
  };

  const FRONTEND_BASE_URL = import.meta.env.VITE_PUBLIC_SITE_URL || window.location.origin;

  const generateTableMenuLink = () => {
    // Always generate link pointing to static frontend domain
    return `${FRONTEND_BASE_URL}/table/${encodeURIComponent(name)}`;
  };

  const copyTableLink = () => {
    const link = generateTableMenuLink();
    navigator.clipboard.writeText(link).then(() => {
      enqueueSnackbar("Table link copied to clipboard!", { variant: "success" });
    }).catch(() => {
      enqueueSnackbar("Failed to copy link!", { variant: "error" });
    });
  };

  const getStatusColor = (status) => {
    switch(status) {
      case "Booked": return "bg-orange-700 text-white"; // cam
      case "Available": return "bg-white text-[#1f1f1f]"; // trắng
      case "Occupied": return "bg-blue-700 text-white"; // xanh dương
      default: return "bg-white text-[#1f1f1f]";
    }
  };

  const getTileBgClass = (status) => {
    switch(status) {
      case "Booked": return "bg-orange-500 hover:bg-orange-600";
      case "Available": return "bg-white hover:bg-gray-100";
      case "Occupied": return "bg-blue-500 hover:bg-blue-600";
      default: return "bg-white hover:bg-gray-100";
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case "Booked": return <FaUtensils />;
      case "Available": return <FaCheck />;
      case "Occupied": return <FaClock />;
      default: return <FaCheck />;
    }
  };

  const getHeaderTextClass = (status) => {
    return status === "Available" ? "text-[#1f1f1f]" : "text-white";
  };

  const getTableCircleClass = (status) => {
    switch (status) {
      case "Booked":
        return "bg-orange-500 border-4 border-orange-700";
      case "Occupied":
        return "bg-blue-500 border-4 border-blue-700";
      case "Available":
      default:
        return "bg-white border-4 border-gray-300";
    }
  };

  const getChairClass = (status) => {
    // Ghế màu trung tính để dễ nhìn trên mọi nền
    return "bg-gray-300 border border-gray-400";
  };

  const getCenterTextClass = (status) => {
    return status === "Available" ? "text-[#1f1f1f]" : "text-white";
  };

  return (
    <>
      <div onClick={() => handleClick(name)} key={id} className={`w-full p-3 rounded-lg cursor-pointer relative transition-all duration-200 ${getTileBgClass(status)} shadow-lg`}>
        {/* Header with table number and status badge */}
        <div className="flex items-center justify-between mb-2">
          <h2 className={`${getHeaderTextClass(status)} text-base md:text-lg font-bold truncate`}>
            {name}
          </h2>
          <div className={`${getStatusColor(status)} px-1.5 py-0.5 rounded-md flex items-center gap-1 text-[10px] md:text-xs font-semibold shrink-0`}>
            {getStatusIcon(status)} 
            <span className="hidden sm:inline">{status === 'Available' ? 'Trống' : status === 'Booked' ? 'Đã đặt' : 'Dùng'}</span>
          </div>
        </div>

        {/* Visual round table with 4 chairs */}
        <div className="relative mx-auto my-3 w-20 h-20 md:w-24 md:h-24">
          <div className={`absolute inset-0 rounded-full ${getTableCircleClass(status)}`}></div>
          {/* Center text: initials or seats */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-xs md:text-sm font-bold ${getCenterTextClass(status)}`}>
              {getAvatarName(initials) || seats}
            </span>
          </div>
          {/* Chairs - smaller and responsive */}
          <div className={`absolute w-4 h-4 md:w-5 md:h-5 rounded-full ${getChairClass(status)} top-0 left-1/2 -translate-x-1/2 -translate-y-1/2`}></div>
          <div className={`absolute w-4 h-4 md:w-5 md:h-5 rounded-full ${getChairClass(status)} bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2`}></div>
          <div className={`absolute w-4 h-4 md:w-5 md:h-5 rounded-full ${getChairClass(status)} top-1/2 right-0 translate-x-1/2 -translate-y-1/2`}></div>
          <div className={`absolute w-4 h-4 md:w-5 md:h-5 rounded-full ${getChairClass(status)} top-1/2 left-0 -translate-x-1/2 -translate-y-1/2`}></div>
        </div>

        {/* Seats info */}
        <div className={`${getHeaderTextClass(status)} text-[10px] md:text-xs text-center mb-2`}>
          <span className="font-semibold">{seats} ghế</span>
        </div>

        {/* Current order info - compact */}
        {currentOrder && (
          <div className="mt-2 p-1.5 bg-[#1f1f1f] rounded-md">
            <p className="text-[#f5f5f5] text-[10px] md:text-xs font-medium truncate">
              {currentOrder.customerDetails?.name || "Khách"}
            </p>
            {status === "Booked" ? (
              <p className="text-[#ababab] text-[9px] md:text-[10px] truncate">
                {currentOrder.customerDetails?.guests || 1} khách
                {currentOrder.reservationDateTime && ` • ${new Date(currentOrder.reservationDateTime).toLocaleString('vi-VN', { 
                  day: '2-digit', 
                  month: '2-digit',
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}`}
              </p>
            ) : (
              <p className="text-[#ababab] text-[9px] md:text-[10px]">
                {currentOrder.items?.length || 0} món
              </p>
            )}
          </div>
        )}
        
        {/* Book Table Button - only show when table is Available */}
        {status === "Available" && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowBookingModal(true);
            }}
            className="absolute bottom-2 right-2 bg-[#f6b100] text-[#1f1f1f] px-3 py-1 rounded-lg hover:bg-[#e6a100] transition-colors text-sm font-semibold flex items-center gap-1"
            title="Book this table"
          >
            <FaUserPlus size={12} />
            Book
          </button>
        )}
      </div>

      {/* Book Table Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#1a1a1a] rounded-lg p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-[#f5f5f5] text-xl font-bold">Đặt bàn {name}</h2>
              <button 
                onClick={() => setShowBookingModal(false)}
                className="text-[#ababab] hover:text-white"
              >
                <FaTimes size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[#ababab] mb-2 text-sm font-medium">Tên khách *</label>
                <input
                  type="text"
                  value={bookingData.customerName}
                  onChange={(e) => setBookingData({...bookingData, customerName: e.target.value})}
                  placeholder="Nhập tên khách"
                  className="w-full bg-[#262626] text-[#f5f5f5] rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#f6b100]"
                />
              </div>
              
              <div>
                <label className="block text-[#ababab] mb-2 text-sm font-medium">SĐT khách *</label>
                <input
                  type="tel"
                  value={bookingData.customerPhone}
                  onChange={(e) => setBookingData({...bookingData, customerPhone: e.target.value})}
                  placeholder="Nhập SĐT"
                  className="w-full bg-[#262626] text-[#f5f5f5] rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#f6b100]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#ababab] mb-2 text-sm font-medium">Ngày đến *</label>
                  <input
                    type="date"
                    value={bookingData.reservationDate}
                    onChange={(e) => setBookingData({...bookingData, reservationDate: e.target.value})}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full bg-[#262626] text-[#f5f5f5] rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#f6b100]"
                  />
                </div>
                <div>
                  <label className="block text-[#ababab] mb-2 text-sm font-medium">Giờ đến *</label>
                  <input
                    type="time"
                    value={bookingData.reservationTime}
                    onChange={(e) => setBookingData({...bookingData, reservationTime: e.target.value})}
                    className="w-full bg-[#262626] text-[#f5f5f5] rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#f6b100]"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-[#ababab] mb-2 text-sm font-medium">Số khách</label>
                <select
                  value={bookingData.guests}
                  onChange={(e) => setBookingData({...bookingData, guests: parseInt(e.target.value)})}
                  className="w-full bg-[#262626] text-[#f5f5f5] rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#f6b100]"
                >
                  {[...Array(12)].map((_, i) => (
                    <option key={i + 1} value={i + 1}>{i + 1} khách</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-[#ababab] mb-2 text-sm font-medium">Ghi chú (không bắt buộc)</label>
                <textarea
                  value={bookingData.notes}
                  onChange={(e) => setBookingData({...bookingData, notes: e.target.value})}
                  placeholder="Yêu cầu đặc biệt hoặc ghi chú..."
                  rows={3}
                  className="w-full bg-[#262626] text-[#f5f5f5] rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#f6b100] resize-none"
                />
              </div>

              {/* Table Information Display */}
              <div className="bg-[#262626] p-4 rounded-lg">
                <h3 className="text-[#f5f5f5] font-semibold mb-3">Thông tin bàn</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-[#ababab]">Số bàn:</p>
                    <p className="text-[#f5f5f5] font-medium">{name}</p>
                  </div>
                  <div>
                    <p className="text-[#ababab]">Số ghế:</p>
                    <p className="text-[#f5f5f5] font-medium">{seats}</p>
                  </div>
                </div>
                <div className="mt-3 p-3 bg-orange-900/20 border border-orange-500 rounded-lg">
                  <p className="text-orange-400 text-sm flex items-center gap-2">
                    <FaUtensils size={12} />
                    Sau khi đặt bàn, trạng thái sẽ chuyển sang "Đã đặt"
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
                <button 
                onClick={() => setShowBookingModal(false)}
                className="bg-[#383838] text-[#f5f5f5] px-4 py-2 rounded-lg font-semibold hover:bg-[#4a4a4a] transition-colors"
              >
                Hủy
              </button>
              <button 
                onClick={handleBookTable}
                disabled={updateTableMutation.isPending}
                className={`px-4 py-2 rounded-lg font-semibold ${
                  updateTableMutation.isPending
                    ? "bg-[#2a2a2a] text-[#666] cursor-not-allowed"
                    : "bg-[#f6b100] text-[#1f1f1f] hover:bg-[#e6a100]"
                }`}
              >
                {updateTableMutation.isPending ? "Đang đặt..." : "Đặt bàn"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table details modal */}
      {showDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#1a1a1a] rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-[#f5f5f5] text-xl font-bold">Chi tiết bàn {name}</h2>
              <button 
                onClick={() => setShowDetails(false)}
                className="text-[#ababab] hover:text-white"
              >
                <FaTimes size={20} />
              </button>
            </div>
            
            {/* Table Info */}
            <div className="bg-[#262626] p-4 rounded-lg mb-4">
              <h3 className="text-[#f5f5f5] font-semibold mb-2">Thông tin bàn</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-[#ababab]">Số bàn:</p>
                  <p className="text-[#f5f5f5]">{name}</p>
                </div>
                <div>
                  <p className="text-[#ababab]">Số ghế:</p>
                  <p className="text-[#f5f5f5]">{seats}</p>
                </div>
                <div>
                  <p className="text-[#ababab]">Trạng thái:</p>
                  <p className="text-[#f5f5f5]">{status}</p>
                </div>
                <div>
                  <p className="text-[#ababab]">Khách hàng:</p>
                  <p className="text-[#f5f5f5]">{currentOrder?.customerDetails?.name || "N/A"}</p>
                </div>
              </div>
            </div>

                         {/* Customer Information */}
             <div className="bg-[#262626] p-4 rounded-lg mb-4">
               <h3 className="text-[#f5f5f5] font-semibold mb-3">
                 {status === "Booked" ? "Thông tin đặt bàn" : "Thông tin khách hàng"}
               </h3>
               {currentOrder && currentOrder.customerDetails ? (
                 <div className="space-y-3">
                   <div className="flex items-center gap-3">
                     <div className="w-12 h-12 rounded-full bg-[#f6b100] flex items-center justify-center">
                       <span className="text-[#1f1f1f] font-bold text-lg">
                         {getAvatarName(currentOrder.customerDetails.name)}
                       </span>
                     </div>
                     <div>
                       <p className="text-[#f5f5f5] font-semibold text-lg">{currentOrder.customerDetails.name}</p>
                       <p className="text-[#ababab] text-sm">{currentOrder.customerDetails.phone}</p>
                     </div>
                   </div>
                   
                   <div className="grid grid-cols-2 gap-4 text-sm">
                     <div>
                       <p className="text-[#ababab]">Số khách:</p>
                       <p className="text-[#f5f5f5] font-medium">{currentOrder.customerDetails.guests} khách</p>
                     </div>
                     {currentOrder.reservationDateTime && (
                       <div>
                         <p className="text-[#ababab]">Ngày giờ đến:</p>
                         <p className="text-[#f5f5f5] font-medium">{new Date(currentOrder.reservationDateTime).toLocaleString('vi-VN', {
                           day: '2-digit',
                           month: '2-digit', 
                           year: 'numeric',
                           hour: '2-digit',
                           minute: '2-digit'
                         })}</p>
                       </div>
                     )}
                     {currentOrder.bookingTime && (
                       <div className="col-span-2">
                         <p className="text-[#ababab]">Thời gian đặt bàn:</p>
                         <p className="text-[#f5f5f5] font-medium">{new Date(currentOrder.bookingTime).toLocaleString('vi-VN')}</p>
                       </div>
                     )}
                     {status === "Booked" && (
                       <div className="col-span-2">
                         <p className="text-[#ababab]">Trạng thái:</p>
                         <p className="text-orange-400 font-medium flex items-center gap-2">
                           <FaUtensils /> Đã đặt - chờ khách đến
                         </p>
                       </div>
                     )}
                   </div>
                   
                   {currentOrder.notes && (
                     <div className="mt-3 p-3 bg-[#1f1f1f] rounded-lg">
                       <p className="text-[#ababab] text-sm font-medium mb-1">Ghi chú đặc biệt:</p>
                       <p className="text-[#f5f5f5] text-sm">{currentOrder.notes}</p>
                     </div>
                   )}
                 </div>
               ) : (
                 <div className="text-center py-4">
                       <p className="text-[#ababab] text-sm">Chưa có thông tin khách</p>
                 </div>
               )}
             </div>

            {/* Current Order */}
            {currentOrder && currentOrder.items && currentOrder.items.length > 0 ? (
              <>
                <div className="bg-[#262626] p-4 rounded-lg mb-4">
                  <h3 className="text-[#f5f5f5] font-semibold mb-3">Đơn hiện tại</h3>
                  <div className="space-y-3">
                    {currentOrder.items?.map((item, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-[#1f1f1f] rounded-lg">
                        <div>
                          <p className="text-[#f5f5f5] font-medium">{item.name}</p>
                          <p className="text-[#ababab] text-sm">SL: {item.quantity}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[#f5f5f5] font-semibold">{item.pricePerQuantity} Ft</p>
                          <p className="text-[#ababab] text-sm">Thành tiền: {item.price} Ft</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-[#262626] p-4 rounded-lg mb-4">
                  <h3 className="text-[#f5f5f5] font-semibold mb-3">Tổng kết đơn</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between font-semibold">
                      <span className="text-[#f5f5f5]">Tổng cộng:</span>
                      <span className="text-[#f5f5f5]">{currentOrder.bills?.totalWithTax?.toFixed(2)} Ft</span>
                    </div>
                  </div>
                </div>
              </>
            ) : currentOrder ? (
              <div className="bg-[#262626] p-4 rounded-lg mb-4">
                <h3 className="text-[#f5f5f5] font-semibold mb-3">Đơn hiện tại</h3>
                <p className="text-[#ababab] text-sm">Chưa có món nào được gọi.</p>
              </div>
            ) : null}

                         {/* Start Ordering Button - only show for Booked tables */}
             {status === "Booked" && (
               <div className="bg-[#262626] p-4 rounded-lg mb-4">
                 <h3 className="text-[#f5f5f5] font-semibold mb-3">Khách đã đến?</h3>
                 <button
                   onClick={() => {
                     const table = { tableId: id, tableNo: name }
                     dispatch(updateTable({table}))
                     
                     // Tự động điền thông tin khách từ booking
                     if (currentOrder?.customerDetails) {
                       dispatch(setCustomer({
                         name: currentOrder.customerDetails.name || "",
                         phone: currentOrder.customerDetails.phone || "",
                         guests: currentOrder.customerDetails.guests || 1
                       }));
                     }
                     
                     navigate(`/menu`);
                   }}
                   className="w-full bg-[#f6b100] text-[#1f1f1f] px-4 py-3 rounded-lg font-semibold hover:bg-[#e6a100] transition-colors"
                 >
                   Bắt đầu gọi món
                 </button>
                 <p className="text-[#ababab] text-xs mt-2">Khách hàng đã đến, bắt đầu nhận order</p>
               </div>
             )}

             {/* Add More Items Button - only show for Occupied tables */}
             {status === "Occupied" && (
               <div className="bg-[#262626] p-4 rounded-lg mb-4">
                 <h3 className="text-[#f5f5f5] font-semibold mb-3">Thêm món</h3>
                 <button
                   onClick={() => {
                     const table = { tableId: id, tableNo: name }
                     dispatch(updateTable({table}))
                     
                     // Tự động điền thông tin khách từ đơn hiện tại
                     if (currentOrder?.customerDetails) {
                       dispatch(setCustomer({
                         name: currentOrder.customerDetails.name || "",
                         phone: currentOrder.customerDetails.phone || "",
                         guests: currentOrder.customerDetails.guests || 1
                       }));
                     }
                     
                     setShowDetails(false); // Đóng modal
                     navigate(`/menu`);
                   }}
                   className="w-full bg-[#f6b100] text-[#1f1f1f] px-4 py-3 rounded-lg font-semibold hover:bg-[#e6a100] transition-colors flex items-center justify-center gap-2"
                 >
                   <FaUtensils /> Gọi thêm món
                 </button>
                 <p className="text-[#ababab] text-xs mt-2">Thêm món vào đơn hiện tại của bàn</p>
               </div>
             )}

                         {/* Status Update */}
             <div className="bg-[#262626] p-4 rounded-lg mb-4">
               <h3 className="text-[#f5f5f5] font-semibold mb-3">Cập nhật trạng thái bàn</h3>
               <div className="grid grid-cols-3 gap-3">
                 <button 
                   onClick={() => handleStatusUpdate("Available")}
                   disabled={status === "Available" || updateTableMutation.isPending}
                   className={`px-4 py-3 rounded-lg font-semibold transition-colors ${
                     status === "Available" 
                       ? "bg-[#664a04] text-white cursor-not-allowed" 
                       : "bg-[#1f1f1f] text-[#f5f5f5] hover:bg-[#2a2a2a] border border-[#664a04]"
                   }`}
                 >
                   <div className="flex flex-col items-center gap-1">
                     <FaCheck size={16} />
                     <span className="text-sm">Trống</span>
                   </div>
                 </button>
                 <button 
                   onClick={() => handleStatusUpdate("Booked")}
                   disabled={status === "Booked" || updateTableMutation.isPending}
                   className={`px-4 py-3 rounded-lg font-semibold transition-colors ${
                     status === "Booked" 
                       ? "bg-[#2e4a40] text-green-600 cursor-not-allowed" 
                       : "bg-[#1f1f1f] text-[#f5f5f5] hover:bg-[#2a2a2a] border border-[#2e4a40]"
                   }`}
                 >
                   <div className="flex flex-col items-center gap-1">
                     <FaUtensils size={16} />
                     <span className="text-sm">Đã đặt</span>
                   </div>
                 </button>
                 <button 
                   onClick={() => handleStatusUpdate("Occupied")}
                   disabled={status === "Occupied" || updateTableMutation.isPending}
                   className={`px-4 py-3 rounded-lg font-semibold transition-colors ${
                     status === "Occupied" 
                       ? "bg-[#4a452e] text-yellow-600 cursor-not-allowed" 
                       : "bg-[#1f1f1f] text-[#f5f5f5] hover:bg-[#2a2a2a] border border-[#4a452e]"
                   }`}
                 >
                   <div className="flex flex-col items-center gap-1">
                     <FaClock size={16} />
                     <span className="text-sm">Đang dùng</span>
                   </div>
                 </button>
               </div>
               
               {/* Status Description */}
               <div className="mt-3 p-3 bg-[#1f1f1f] rounded-lg">
                 <p className="text-[#ababab] text-xs mb-2">Mô tả trạng thái:</p>
                 <div className="space-y-1 text-xs">
                   <div className="flex items-center gap-2">
                     <div className="w-3 h-3 rounded-full bg-white border border-gray-400"></div>
                     <span className="text-[#f5f5f5]">Trống: Bàn còn trống, sẵn sàng nhận khách</span>
                   </div>
                   <div className="flex items-center gap-2">
                     <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                     <span className="text-[#f5f5f5]">Đã đặt: Bàn đã được đặt trước</span>
                   </div>
                   <div className="flex items-center gap-2">
                     <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                     <span className="text-[#f5f5f5]">Đang dùng: Đang có khách ngồi</span>
                   </div>
                 </div>
               </div>
             </div>

            <div className="mt-4 flex justify-between">
              {/* Delete Button - Only show for Available tables */}
              {status === "Available" && (
                <button 
                  onClick={() => setShowDeleteConfirm(true)}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center gap-2"
                >
                  <FaTrash size={14} />
                  Xóa bàn
                </button>
              )}
              <button 
                onClick={() => setShowDetails(false)}
                className="bg-[#f6b100] text-[#1f1f1f] px-4 py-2 rounded-lg font-semibold ml-auto"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-[#1a1a1a] rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-red-600 p-3 rounded-full">
                <FaTrash className="text-white text-xl" />
              </div>
              <div>
                <h2 className="text-[#f5f5f5] text-xl font-bold">Xác nhận xóa bàn</h2>
                <p className="text-[#ababab] text-sm">Hành động này không thể hoàn tác</p>
              </div>
            </div>
            
            <div className="bg-[#262626] p-4 rounded-lg mb-4">
              <p className="text-[#f5f5f5] mb-2">Bạn có chắc muốn xóa bàn này?</p>
              <div className="flex items-center gap-2 text-[#ababab] text-sm">
                <span className="font-semibold text-[#f6b100]">Bàn {name}</span>
                <span>•</span>
                <span>{seats} ghế</span>
                <span>•</span>
                <span className={status === "Available" ? "text-green-400" : "text-orange-400"}>
                  {status === "Available" ? "Trống" : status}
                </span>
              </div>
            </div>

            {status !== "Available" && (
              <div className="bg-red-900/20 border border-red-500 rounded-lg p-3 mb-4">
                <p className="text-red-400 text-sm">
                  ⚠️ Không thể xóa bàn đang có khách hoặc đã đặt. Vui lòng hoàn tất order trước.
                </p>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowDeleteConfirm(false)}
                className="bg-[#383838] text-[#f5f5f5] px-4 py-2 rounded-lg font-semibold hover:bg-[#4a4a4a] transition-colors"
              >
                Hủy
              </button>
              <button 
                onClick={handleDeleteTable}
                disabled={deleteTableMutation.isPending || status !== "Available"}
                className={`px-4 py-2 rounded-lg font-semibold flex items-center gap-2 ${
                  deleteTableMutation.isPending || status !== "Available"
                    ? "bg-[#2a2a2a] text-[#666] cursor-not-allowed"
                    : "bg-red-600 text-white hover:bg-red-700"
                }`}
              >
                <FaTrash size={14} />
                {deleteTableMutation.isPending ? "Đang xóa..." : "Xóa bàn"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Table Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#1a1a1a] rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-[#f5f5f5] text-xl font-bold">Delete Table</h2>
              <button 
                onClick={() => setShowDeleteModal(false)}
                className="text-[#ababab] hover:text-white"
              >
                <FaTimes size={20} />
              </button>
            </div>
            
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center">
                  <FaTrash className="text-white" size={20} />
                </div>
                <div>
                  <h3 className="text-[#f5f5f5] font-semibold text-lg">Are you sure?</h3>
                  <p className="text-[#ababab] text-sm">This action cannot be undone.</p>
                </div>
              </div>
              
              <div className="bg-[#262626] p-4 rounded-lg">
                <h4 className="text-[#f5f5f5] font-semibold mb-2">Table Information</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#ababab]">Table Number:</span>
                    <span className="text-[#f5f5f5] font-medium">#{name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#ababab]">Seats:</span>
                    <span className="text-[#f5f5f5] font-medium">{seats}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#ababab]">Status:</span>
                    <span className="text-[#f5f5f5] font-medium">{status}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 p-3 bg-yellow-600/20 border border-yellow-600 rounded-lg">
                <p className="text-yellow-400 text-sm">
                  <strong>Warning:</strong> Deleting this table will permanently remove it from the system. 
                  Any historical data associated with this table will remain but the table will no longer be available for new orders.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowDeleteModal(false)}
                className="bg-[#383838] text-[#f5f5f5] px-4 py-2 rounded-lg font-semibold hover:bg-[#4a4a4a] transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteTable}
                disabled={deleteTableMutation.isPending}
                className={`px-4 py-2 rounded-lg font-semibold ${
                  deleteTableMutation.isPending
                    ? "bg-[#2a2a2a] text-[#666] cursor-not-allowed"
                    : "bg-red-600 text-white hover:bg-red-700"
                }`}
              >
                {deleteTableMutation.isPending ? "Deleting..." : "Delete Table"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TableCard;
