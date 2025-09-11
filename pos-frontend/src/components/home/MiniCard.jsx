import React from 'react'

const MiniCard = ({title, icon, number, footerNum}) => {
  // Format số tiền với dấu phẩy
  const formatNumber = (num) => {
    if (title === "Total Earnings") {
      return `${parseInt(num).toLocaleString()} Ft`;
    }
    return num;
  };

  // Xử lý màu sắc cho percentage
  const getPercentageColor = (num) => {
    const value = parseFloat(num);
    return value >= 0 ? "text-[#02ca3a]" : "text-red-500";
  };

  const getPercentageIcon = (num) => {
    const value = parseFloat(num);
    return value >= 0 ? "↗" : "↘";
  };

  return (
    <div className='bg-[#1a1a1a] py-6 px-6 rounded-xl w-[50%] border border-[#2a2a2a] hover:border-[#3a3a3a] transition-all duration-300'>
        <div className='flex items-start justify-between mb-4'>
            <h1 className='text-[#f5f5f5] text-lg font-semibold tracking-wide'>{title}</h1>
            <div className={`${title === "Total Earnings" ? "bg-[#02ca3a]" : "bg-[#f6b100]"} p-3 rounded-lg text-[#f5f5f5] text-xl shadow-lg`}>
              {icon}
            </div>
        </div>
        <div>
            <h1 className='text-[#f5f5f5] text-3xl font-bold mb-2'>{formatNumber(number)}</h1>
            <div className='flex items-center gap-2'>
              <span className={getPercentageColor(footerNum)}>
                {getPercentageIcon(footerNum)}
              </span>
              <span className='text-[#ababab] text-sm'>
                <span className={getPercentageColor(footerNum)}>
                  {Math.abs(footerNum)}%
                </span> than yesterday
              </span>
            </div>
        </div>
    </div>
  )
}

export default MiniCard