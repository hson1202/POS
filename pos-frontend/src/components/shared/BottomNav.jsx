import React, { useState } from "react";
import { FaHome } from "react-icons/fa";
import { MdOutlineReorder, MdTableBar } from "react-icons/md";
import { CiCircleMore } from "react-icons/ci";
import { BiSolidDish } from "react-icons/bi";
import { useNavigate, useLocation } from "react-router-dom";
import Modal from "./Modal";
import { useDispatch } from "react-redux";
import { setCustomer } from "../../redux/slices/customerSlice";

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [guestCount, setGuestCount] = useState(0);
  const [name, setName] = useState();
  const [phone, setPhone] = useState();

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const increment = () => {
    if(guestCount >= 6) return;
    setGuestCount((prev) => prev + 1);
  }
  const decrement = () => {
    if(guestCount <= 0) return;
    setGuestCount((prev) => prev - 1);
  }

  const isActive = (path) => location.pathname === path;

  const handleCreateOrder = () => {
    // send the data to store
    dispatch(setCustomer({name, phone, guests: guestCount}));
    navigate("/tables");
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#262626] p-2 h-14 md:h-16 flex justify-around z-50">
      <button
        onClick={() => navigate("/")}
        className={`flex flex-col md:flex-row items-center justify-center font-semibold text-xs md:text-base ${
          isActive("/") ? "text-[#f5f5f5] bg-[#343434]" : "text-[#ababab]"
        } flex-1 max-w-[100px] md:max-w-[300px] rounded-[12px] md:rounded-[20px] transition-colors`}
      >
        <FaHome className="md:inline md:mr-2" size={16} />
        <p className="md:inline">Home</p>
      </button>
      <button
        onClick={() => navigate("/orders")}
        className={`flex flex-col md:flex-row items-center justify-center font-semibold text-xs md:text-base ${
          isActive("/orders") ? "text-[#f5f5f5] bg-[#343434]" : "text-[#ababab]"
        } flex-1 max-w-[100px] md:max-w-[300px] rounded-[12px] md:rounded-[20px] transition-colors`}
      >
        <MdOutlineReorder className="md:inline md:mr-2" size={16} />
        <p className="md:inline">Orders</p>
      </button>
      <button
        onClick={() => navigate("/tables")}
        className={`flex flex-col md:flex-row items-center justify-center font-semibold text-xs md:text-base ${
          isActive("/tables") ? "text-[#f5f5f5] bg-[#343434]" : "text-[#ababab]"
        } flex-1 max-w-[100px] md:max-w-[300px] rounded-[12px] md:rounded-[20px] transition-colors`}
      >
        <MdTableBar className="md:inline md:mr-2" size={16} />
        <p className="md:inline">Tables</p>
      </button>
      <button 
        onClick={() => navigate("/more")}
        className={`flex flex-col md:flex-row items-center justify-center font-semibold text-xs md:text-base ${
          isActive("/more") ? "text-[#f5f5f5] bg-[#343434]" : "text-[#ababab]"
        } flex-1 max-w-[100px] md:max-w-[300px] rounded-[12px] md:rounded-[20px] transition-colors`}
      >
        <CiCircleMore className="md:inline md:mr-2" size={16} />
        <p className="md:inline">More</p>
      </button>

      <button
        disabled={isActive("/tables") || isActive("/menu")}
        onClick={openModal}
        className="absolute bottom-4 md:bottom-6 bg-[#F6B100] text-[#f5f5f5] rounded-full p-3 md:p-4 items-center shadow-lg hover:bg-[#e6a100] transition-colors disabled:opacity-50"
      >
        <BiSolidDish size={32} className="md:hidden" />
        <BiSolidDish size={40} className="hidden md:block" />
      </button>

      <Modal isOpen={isModalOpen} onClose={closeModal} title="Create Order">
        <div>
          <label className="block text-[#ababab] mb-1.5 md:mb-2 text-xs md:text-sm font-medium">Customer Name</label>
          <div className="flex items-center rounded-lg p-2.5 md:p-3 px-3 md:px-4 bg-[#1f1f1f]">
            <input value={name} onChange={(e) => setName(e.target.value)} type="text" name="" placeholder="Enter customer name" id="" className="bg-transparent flex-1 text-white focus:outline-none text-sm md:text-base"  />
          </div>
        </div>
        <div>
          <label className="block text-[#ababab] mb-1.5 md:mb-2 mt-2 md:mt-3 text-xs md:text-sm font-medium">Customer Phone</label>
          <div className="flex items-center rounded-lg p-2.5 md:p-3 px-3 md:px-4 bg-[#1f1f1f]">
            <input value={phone} onChange={(e) => setPhone(e.target.value)} type="number" name="" placeholder="+91-9999999999" id="" className="bg-transparent flex-1 text-white focus:outline-none text-sm md:text-base"  />
          </div>
        </div>
        <div>
          <label className="block mb-1.5 md:mb-2 mt-2 md:mt-3 text-xs md:text-sm font-medium text-[#ababab]">Guest</label>
          <div className="flex items-center justify-between bg-[#1f1f1f] px-3 md:px-4 py-2.5 md:py-3 rounded-lg">
            <button onClick={decrement} className="text-yellow-500 text-xl md:text-2xl">&minus;</button>
            <span className="text-white text-sm md:text-base">{guestCount} Person</span>
            <button onClick={increment} className="text-yellow-500 text-xl md:text-2xl">&#43;</button>
          </div>
        </div>
        <button onClick={handleCreateOrder} className="w-full bg-[#F6B100] text-[#f5f5f5] rounded-lg py-2.5 md:py-3 mt-6 md:mt-8 hover:bg-yellow-700 transition-colors font-semibold text-sm md:text-base">
          Create Order
        </button>
      </Modal>
    </div>
  );
};

export default BottomNav;
