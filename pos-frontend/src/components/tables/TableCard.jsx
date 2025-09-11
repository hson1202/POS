import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAvatarName, getBgColor } from "../../utils"
import { useDispatch } from "react-redux";
import { updateTable } from "../../redux/slices/customerSlice";
import { FaLongArrowAltRight, FaTimes, FaUtensils, FaClock, FaCheck, FaUserPlus } from "react-icons/fa";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateTable as updateTableAPI } from "../../https";
import { enqueueSnackbar } from "notistack";

const TableCard = ({id, name, status, initials, seats, currentOrder}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingData, setBookingData] = useState({
    customerName: "",
    customerPhone: "",
    guests: 1,
    notes: ""
  });
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handleClick = (name) => {
    if(status === "Booked") {
      // If table is booked, show details modal
      setShowDetails(true);
      return;
    }

    // For admin: go to menu to create order
    // For customers: they should access /table/:tableNo directly
    const table = { tableId: id, tableNo: name }
    dispatch(updateTable({table}))
    navigate(`/menu`);
  };

  // Mutation to update table status
  const updateTableMutation = useMutation({
    mutationFn: ({ tableId, ...tableData }) => updateTableAPI({ tableId, ...tableData }),
    onSuccess: () => {
      enqueueSnackbar("Table status updated successfully!", { variant: "success" });
      queryClient.invalidateQueries(["tables"]);
      queryClient.invalidateQueries(["orders"]);
      setShowDetails(false);
      setShowBookingModal(false);
    },
    onError: (error) => {
      console.log("Update Table Error:", error);
      enqueueSnackbar("Failed to update table status!", { variant: "error" });
    },
  });

  const handleStatusUpdate = (newStatus) => {
    updateTableMutation.mutate({
      tableId: id,
      status: newStatus,
      orderId: null // Clear order when changing to Available
    });
  };

  const handleBookTable = () => {
    if (!bookingData.customerName.trim()) {
      enqueueSnackbar("Please enter customer name!", { variant: "error" });
      return;
    }
    if (!bookingData.customerPhone.trim()) {
      enqueueSnackbar("Please enter customer phone!", { variant: "error" });
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
        bookingTime: new Date().toISOString()
      }
    });
  };

  const getStatusColor = (status) => {
    switch(status) {
      case "Booked": return "text-green-600 bg-[#2e4a40]";
      case "Available": return "bg-[#664a04] text-white";
      case "Occupied": return "text-yellow-600 bg-[#4a452e]";
      default: return "bg-[#664a04] text-white";
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

  return (
    <>
      <div onClick={() => handleClick(name)} key={id} className="w-[300px] hover:bg-[#2c2c2c] bg-[#262626] p-4 rounded-lg cursor-pointer relative">
        <div className="flex items-center justify-between px-1">
          <h1 className="text-[#f5f5f5] text-xl font-semibold">Table <FaLongArrowAltRight className="text-[#ababab] ml-2 inline" /> {name}</h1>
          <p className={`${getStatusColor(status)} px-2 py-1 rounded-lg flex items-center gap-1`}>
            {getStatusIcon(status)} {status}
          </p>
        </div>
        <div className="flex items-center justify-center mt-5 mb-8">
          <h1 className={`text-white rounded-full p-5 text-xl`} style={{backgroundColor : initials ? getBgColor() : "#1f1f1f"}} >
            {getAvatarName(initials) || "N/A"}
          </h1>
        </div>
        <p className="text-[#ababab] text-xs">Seats: <span className="text-[#f5f5f5]">{seats}</span></p>
        {currentOrder && (
          <div className="mt-2 p-2 bg-[#1f1f1f] rounded-lg">
            <p className="text-[#ababab] text-xs">Current Order:</p>
            <p className="text-[#f5f5f5] text-sm font-medium">{currentOrder.customerDetails?.name || "Guest"}</p>
            <p className="text-[#ababab] text-xs">{currentOrder.items?.length || 0} items</p>
          </div>
        )}
        
        {/* Action buttons */}
        <div className="absolute bottom-2 right-2 flex gap-2">
          {status === "Available" && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowBookingModal(true);
              }}
              className="bg-[#f6b100] text-[#1f1f1f] px-3 py-1 rounded-lg hover:bg-[#e6a100] transition-colors text-sm font-semibold flex items-center gap-1"
              title="Book this table"
            >
              <FaUserPlus size={12} />
              Book
            </button>
          )}
          
          {/* Customer Menu button - always available for quick access */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/table/${name}`);
            }}
            className="bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold flex items-center gap-1"
            title="Customer menu for this table"
          >
            <FaUtensils size={12} />
            Menu
          </button>
        </div>
      </div>

      {/* Book Table Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#1a1a1a] rounded-lg p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-[#f5f5f5] text-xl font-bold">Book Table {name}</h2>
              <button 
                onClick={() => setShowBookingModal(false)}
                className="text-[#ababab] hover:text-white"
              >
                <FaTimes size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[#ababab] mb-2 text-sm font-medium">Customer Name *</label>
                <input
                  type="text"
                  value={bookingData.customerName}
                  onChange={(e) => setBookingData({...bookingData, customerName: e.target.value})}
                  placeholder="Enter customer name"
                  className="w-full bg-[#262626] text-[#f5f5f5] rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#f6b100]"
                />
              </div>
              
              <div>
                <label className="block text-[#ababab] mb-2 text-sm font-medium">Customer Phone *</label>
                <input
                  type="tel"
                  value={bookingData.customerPhone}
                  onChange={(e) => setBookingData({...bookingData, customerPhone: e.target.value})}
                  placeholder="Enter phone number"
                  className="w-full bg-[#262626] text-[#f5f5f5] rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#f6b100]"
                />
              </div>
              
              <div>
                <label className="block text-[#ababab] mb-2 text-sm font-medium">Number of Guests</label>
                <select
                  value={bookingData.guests}
                  onChange={(e) => setBookingData({...bookingData, guests: parseInt(e.target.value)})}
                  className="w-full bg-[#262626] text-[#f5f5f5] rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#f6b100]"
                >
                  {[...Array(12)].map((_, i) => (
                    <option key={i + 1} value={i + 1}>{i + 1} {i === 0 ? 'Guest' : 'Guests'}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-[#ababab] mb-2 text-sm font-medium">Notes (Optional)</label>
                <textarea
                  value={bookingData.notes}
                  onChange={(e) => setBookingData({...bookingData, notes: e.target.value})}
                  placeholder="Any special requests or notes..."
                  rows={3}
                  className="w-full bg-[#262626] text-[#f5f5f5] rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#f6b100] resize-none"
                />
              </div>

              {/* Table Information Display */}
              <div className="bg-[#262626] p-4 rounded-lg">
                <h3 className="text-[#f5f5f5] font-semibold mb-3">Table Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-[#ababab]">Table Number:</p>
                    <p className="text-[#f5f5f5] font-medium">{name}</p>
                  </div>
                  <div>
                    <p className="text-[#ababab]">Seats:</p>
                    <p className="text-[#f5f5f5] font-medium">{seats}</p>
                  </div>
                  <div>
                    <p className="text-[#ababab]">Current Status:</p>
                    <p className="text-[#f5f5f5] font-medium">{status}</p>
                  </div>
                  <div>
                    <p className="text-[#ababab]">New Status:</p>
                    <p className="text-green-500 font-medium">Booked</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button 
                onClick={() => setShowBookingModal(false)}
                className="bg-[#383838] text-[#f5f5f5] px-4 py-2 rounded-lg font-semibold hover:bg-[#4a4a4a] transition-colors"
              >
                Cancel
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
                {updateTableMutation.isPending ? "Booking..." : "Book Table"}
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
              <h2 className="text-[#f5f5f5] text-xl font-bold">Table {name} Details</h2>
              <button 
                onClick={() => setShowDetails(false)}
                className="text-[#ababab] hover:text-white"
              >
                <FaTimes size={20} />
              </button>
            </div>
            
            {/* Table Info */}
            <div className="bg-[#262626] p-4 rounded-lg mb-4">
              <h3 className="text-[#f5f5f5] font-semibold mb-2">Table Information</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-[#ababab]">Table Number:</p>
                  <p className="text-[#f5f5f5]">{name}</p>
                </div>
                <div>
                  <p className="text-[#ababab]">Seats:</p>
                  <p className="text-[#f5f5f5]">{seats}</p>
                </div>
                <div>
                  <p className="text-[#ababab]">Status:</p>
                  <p className="text-[#f5f5f5]">{status}</p>
                </div>
                <div>
                  <p className="text-[#ababab]">Customer:</p>
                  <p className="text-[#f5f5f5]">{currentOrder?.customerDetails?.name || "N/A"}</p>
                </div>
              </div>
            </div>

                         {/* Customer Information */}
             <div className="bg-[#262626] p-4 rounded-lg mb-4">
               <h3 className="text-[#f5f5f5] font-semibold mb-3">Customer Information</h3>
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
                       <p className="text-[#ababab]">Number of Guests:</p>
                       <p className="text-[#f5f5f5] font-medium">{currentOrder.customerDetails.guests} {currentOrder.customerDetails.guests === 1 ? 'Guest' : 'Guests'}</p>
                     </div>
                     {currentOrder.bookingTime && (
                       <div>
                         <p className="text-[#ababab]">Booked At:</p>
                         <p className="text-[#f5f5f5] font-medium">{new Date(currentOrder.bookingTime).toLocaleString()}</p>
                       </div>
                     )}
                   </div>
                   
                   {currentOrder.notes && (
                     <div className="mt-3 p-3 bg-[#1f1f1f] rounded-lg">
                       <p className="text-[#ababab] text-sm font-medium mb-1">Special Notes:</p>
                       <p className="text-[#f5f5f5] text-sm">{currentOrder.notes}</p>
                     </div>
                   )}
                 </div>
               ) : (
                 <div className="text-center py-4">
                   <p className="text-[#ababab] text-sm">No customer information available</p>
                 </div>
               )}
             </div>

            {/* Current Order */}
            {currentOrder && currentOrder.items && currentOrder.items.length > 0 && (
              <>
                <div className="bg-[#262626] p-4 rounded-lg mb-4">
                  <h3 className="text-[#f5f5f5] font-semibold mb-3">Current Order</h3>
                  <div className="space-y-3">
                    {currentOrder.items?.map((item, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-[#1f1f1f] rounded-lg">
                        <div>
                          <p className="text-[#f5f5f5] font-medium">{item.name}</p>
                          <p className="text-[#ababab] text-sm">Quantity: {item.quantity}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[#f5f5f5] font-semibold">{item.pricePerQuantity} Ft</p>
                          <p className="text-[#ababab] text-sm">Total: {item.price} Ft</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-[#262626] p-4 rounded-lg mb-4">
                  <h3 className="text-[#f5f5f5] font-semibold mb-3">Order Summary</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between font-semibold">
                      <span className="text-[#f5f5f5]">Total:</span>
                      <span className="text-[#f5f5f5]">{currentOrder.bills?.totalWithTax?.toFixed(2)} Ft</span>
                    </div>
                  </div>
                </div>
              </>
            )}

                         {/* Status Update */}
             <div className="bg-[#262626] p-4 rounded-lg mb-4">
               <h3 className="text-[#f5f5f5] font-semibold mb-3">Update Table Status</h3>
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
                     <span className="text-sm">Available</span>
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
                     <span className="text-sm">Booked</span>
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
                     <span className="text-sm">Occupied</span>
                   </div>
                 </button>
               </div>
               
               {/* Status Description */}
               <div className="mt-3 p-3 bg-[#1f1f1f] rounded-lg">
                 <p className="text-[#ababab] text-xs mb-2">Status Description:</p>
                 <div className="space-y-1 text-xs">
                   <div className="flex items-center gap-2">
                     <div className="w-3 h-3 rounded-full bg-[#664a04]"></div>
                     <span className="text-[#f5f5f5]">Available: Table is free and ready for booking</span>
                   </div>
                   <div className="flex items-center gap-2">
                     <div className="w-3 h-3 rounded-full bg-[#2e4a40]"></div>
                     <span className="text-[#f5f5f5]">Booked: Table is reserved for a customer</span>
                   </div>
                   <div className="flex items-center gap-2">
                     <div className="w-3 h-3 rounded-full bg-[#4a452e]"></div>
                     <span className="text-[#f5f5f5]">Occupied: Customer is currently using the table</span>
                   </div>
                 </div>
               </div>
             </div>

            <div className="mt-4 flex justify-end">
              <button 
                onClick={() => setShowDetails(false)}
                className="bg-[#f6b100] text-[#1f1f1f] px-4 py-2 rounded-lg font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TableCard;
