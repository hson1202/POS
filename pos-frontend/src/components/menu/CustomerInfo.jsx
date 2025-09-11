import React, { useState } from "react";
import { useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { formatDate, getAvatarName } from "../../utils";

const CustomerInfo = () => {
  const [dateTime, setDateTime] = useState(new Date());
  const customerData = useSelector((state) => state.customer);
  const { id: tableId } = useParams(); // Get tableId from URL params

  return (
    <div className="flex items-center justify-between px-2 py-2 lg:px-4 lg:py-3">
      <div className="flex flex-col items-start flex-1 min-w-0">
        <h1 className="text-sm lg:text-md text-[#f5f5f5] font-semibold tracking-wide truncate w-full">
          {customerData.customerName || "Guest"}
        </h1>
        <div className="flex flex-wrap gap-1 mt-1">
          <p className="text-xs text-[#ababab] font-medium">
            #{customerData.orderId || "N/A"}
          </p>
          <span className="text-xs text-[#ababab]">•</span>
          <p className="text-xs text-[#ababab] font-medium">
            Dine in
          </p>
          <span className="text-xs text-[#ababab]">•</span>
          <p className="text-xs text-[#ababab] font-medium">
            Table {tableId}
          </p>
        </div>
        <p className="text-xs text-[#ababab] font-medium mt-1">
          {formatDate(dateTime)}
        </p>
      </div>
      <div className="flex-shrink-0 ml-2">
        <button className="bg-[#f6b100] p-2 lg:p-3 text-base lg:text-xl font-bold rounded-lg w-10 h-10 lg:w-12 lg:h-12 flex items-center justify-center">
          {getAvatarName(customerData.customerName) || "G"}
        </button>
      </div>
    </div>
  );
};

export default CustomerInfo;
