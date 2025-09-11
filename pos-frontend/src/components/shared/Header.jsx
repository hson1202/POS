import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { FaSignOutAlt, FaUser } from "react-icons/fa";
import { removeUser } from "../../redux/slices/userSlice";
import { logout } from "../../https";
import { enqueueSnackbar } from "notistack";
import NotificationBell from "./NotificationBell";

const Header = () => {
  const { name, role } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      dispatch(removeUser());
      enqueueSnackbar("Logged out successfully!", { variant: "success" });
      navigate("/auth");
    } catch (error) {
      enqueueSnackbar("Logout failed!", { variant: "error" });
    }
  };

  return (
    <div className="bg-[#1a1a1a] px-8 py-4 border-b border-[#2a2a2a]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-[#f5f5f5] text-xl font-bold">Restaurant POS</h1>
          <div className="text-[#ababab] text-sm">
            Welcome back, <span className="text-[#f6b100] font-semibold">{name}</span>
          </div>
          <div className="text-[#ababab] text-xs bg-[#2a2a2a] px-2 py-1 rounded">
            {role}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Notification Bell */}
          <NotificationBell />
          
          {/* User Menu */}
          <div className="flex items-center gap-2">
            <div className="bg-[#f6b100] p-2 rounded-lg">
              <FaUser className="text-[#1f1f1f]" />
            </div>
            <button
              onClick={handleLogout}
              className="bg-[#2a2a2a] hover:bg-[#3a3a3a] p-2 rounded-lg transition-colors"
              title="Logout"
            >
              <FaSignOutAlt className="text-[#f5f5f5]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;
