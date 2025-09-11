import React, { useState, useEffect } from "react";
import BottomNav from "../components/shared/BottomNav";
import BackButton from "../components/shared/BackButton";
import TableCard from "../components/tables/TableCard";
import { keepPreviousData, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getTables, addTable } from "../https";
import { enqueueSnackbar } from "notistack";
import { FaPlus, FaTimes } from "react-icons/fa";

const Tables = () => {
  const [status, setStatus] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTable, setNewTable] = useState({
    tableNo: "",
    seats: 4,
    status: "Available"
  });
  const queryClient = useQueryClient();

  useEffect(() => {
    document.title = "POS | Tables"
  }, [])

  const { data: resData, isError } = useQuery({
    queryKey: ["tables"],
    queryFn: async () => {
      return await getTables();
    },
    placeholderData: keepPreviousData,
  });

  // Mutation to create new table
  const addTableMutation = useMutation({
    mutationFn: (tableData) => addTable(tableData),
    onSuccess: () => {
      enqueueSnackbar("Table created successfully!", { variant: "success" });
      queryClient.invalidateQueries(["tables"]);
      setShowAddModal(false);
      setNewTable({ tableNo: "", seats: 4, status: "Available" });
    },
    onError: (error) => {
      console.log("Add Table Error:", error);
      enqueueSnackbar("Failed to create table!", { variant: "error" });
    },
  });

  const handleAddTable = () => {
    if (!newTable.tableNo.trim()) {
      enqueueSnackbar("Please enter table number!", { variant: "error" });
      return;
    }
    addTableMutation.mutate(newTable);
  };

  if(isError) {
    enqueueSnackbar("Something went wrong!", { variant: "error" })
  }

  console.log(resData);

  // Filter tables by status
  const filteredTables = resData?.data.data.filter(table => {
    if (status === "all") return true;
    if (status === "booked") return table.status === "Booked";
    if (status === "available") return table.status === "Available";
    if (status === "occupied") return table.status === "Occupied";
    return true;
  }) || [];

  return (
    <section className="bg-[#1f1f1f]  h-[calc(100vh-5rem)] overflow-hidden">
      <div className="flex items-center justify-between px-10 py-4">
        <div className="flex items-center gap-4">
          <BackButton />
          <h1 className="text-[#f5f5f5] text-2xl font-bold tracking-wider">
            Tables
          </h1>
        </div>
        <div className="flex items-center justify-around gap-4">
          <button
            onClick={() => setStatus("all")}
            className={`text-[#ababab] text-lg ${
              status === "all" && "bg-[#383838] rounded-lg px-5 py-2"
            }  rounded-lg px-5 py-2 font-semibold`}
          >
            All
          </button>
          <button
            onClick={() => setStatus("available")}
            className={`text-[#ababab] text-lg ${
              status === "available" && "bg-[#383838] rounded-lg px-5 py-2"
            }  rounded-lg px-5 py-2 font-semibold`}
          >
            Available
          </button>
          <button
            onClick={() => setStatus("booked")}
            className={`text-[#ababab] text-lg ${
              status === "booked" && "bg-[#383838] rounded-lg px-5 py-2"
            }  rounded-lg px-5 py-2 font-semibold`}
          >
            Booked
          </button>
          <button
            onClick={() => setStatus("occupied")}
            className={`text-[#ababab] text-lg ${
              status === "occupied" && "bg-[#383838] rounded-lg px-5 py-2"
            }  rounded-lg px-5 py-2 font-semibold`}
          >
            Occupied
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-[#f6b100] text-[#1f1f1f] px-4 py-2 rounded-lg font-semibold flex items-center gap-2 hover:bg-[#e6a100] transition-colors"
          >
            <FaPlus size={16} />
            Add Table
          </button>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-3 px-16 py-4 h-[650px] overflow-y-scroll scrollbar-hide">
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#1a1a1a] rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-[#f5f5f5] text-xl font-bold">Add New Table</h2>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-[#ababab] hover:text-white"
              >
                <FaTimes size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[#ababab] mb-2 text-sm font-medium">Table Number</label>
                <input
                  type="text"
                  value={newTable.tableNo}
                  onChange={(e) => setNewTable({...newTable, tableNo: e.target.value})}
                  placeholder="Enter table number"
                  className="w-full bg-[#262626] text-[#f5f5f5] rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#f6b100]"
                />
              </div>
              
              <div>
                <label className="block text-[#ababab] mb-2 text-sm font-medium">Number of Seats</label>
                <select
                  value={newTable.seats}
                  onChange={(e) => setNewTable({...newTable, seats: parseInt(e.target.value)})}
                  className="w-full bg-[#262626] text-[#f5f5f5] rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#f6b100]"
                >
                  <option value={2}>2 Seats</option>
                  <option value={4}>4 Seats</option>
                  <option value={6}>6 Seats</option>
                  <option value={8}>8 Seats</option>
                  <option value={10}>10 Seats</option>
                  <option value={12}>12 Seats</option>
                </select>
              </div>
              
              <div>
                <label className="block text-[#ababab] mb-2 text-sm font-medium">Initial Status</label>
                <select
                  value={newTable.status}
                  onChange={(e) => setNewTable({...newTable, status: e.target.value})}
                  className="w-full bg-[#262626] text-[#f5f5f5] rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#f6b100]"
                >
                  <option value="Available">Available</option>
                  <option value="Booked">Booked</option>
                  <option value="Occupied">Occupied</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button 
                onClick={() => setShowAddModal(false)}
                className="bg-[#383838] text-[#f5f5f5] px-4 py-2 rounded-lg font-semibold hover:bg-[#4a4a4a] transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleAddTable}
                disabled={addTableMutation.isPending}
                className={`px-4 py-2 rounded-lg font-semibold ${
                  addTableMutation.isPending
                    ? "bg-[#2a2a2a] text-[#666] cursor-not-allowed"
                    : "bg-[#f6b100] text-[#1f1f1f] hover:bg-[#e6a100]"
                }`}
              >
                {addTableMutation.isPending ? "Creating..." : "Create Table"}
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
