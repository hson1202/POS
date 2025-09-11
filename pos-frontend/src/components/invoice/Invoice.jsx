import React, { useRef } from "react";
import { motion } from "framer-motion";
import { FaCheck, FaCopy } from "react-icons/fa6";
import { generateShortOrderId } from "../../utils";

const Invoice = ({ orderInfo, setShowInvoice }) => {
  const invoiceRef = useRef(null);
  
  // Tạo Order ID ngắn gọn và dễ nhớ
  const getShortOrderId = () => {
    return generateShortOrderId(orderInfo._id);
  };

  // Copy Order ID to clipboard
  const copyOrderId = () => {
    const orderId = getShortOrderId();
    navigator.clipboard.writeText(orderId);
    // Có thể thêm toast notification ở đây
  };

  const handlePrint = () => {
    const printContent = invoiceRef.current.innerHTML;
    const WinPrint = window.open("", "", "width=900,height=650");

    WinPrint.document.write(`
            <html>
              <head>
                <title>Order Receipt - #${getShortOrderId()}</title>
                <style>
                  body { font-family: Arial, sans-serif; padding: 20px; }
                  .receipt-container { width: 300px; border: 1px solid #ddd; padding: 10px; }
                  h2 { text-align: center; }
                  .order-id { font-size: 18px; font-weight: bold; color: #025cca; text-align: center; margin: 10px 0; }
                  .copy-btn { cursor: pointer; color: #025cca; }
                </style>
              </head>
              <body>
                ${printContent}
              </body>
            </html>
          `);

    WinPrint.document.close();
    WinPrint.focus();
    setTimeout(() => {
      WinPrint.print();
      WinPrint.close();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-4 rounded-lg shadow-lg w-[400px] max-h-[90vh] overflow-y-auto">
        {/* Receipt Content for Printing */}

        <div ref={invoiceRef} className="p-4">
          {/* Receipt Header */}
          <div className="flex justify-center mb-4">
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1.2, opacity: 1 }}
              transition={{ duration: 0.5, type: "spring", stiffness: 150 }}
              className="w-12 h-12 border-8 border-green-500 rounded-full flex items-center justify-center shadow-lg bg-green-500"
            >
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, duration: 0.3 }}
                className="text-2xl"
              >
                <FaCheck className="text-white" />
              </motion.span>
            </motion.div>
          </div>

          <h2 className="text-xl font-bold text-center mb-2">Order Receipt</h2>
          <p className="text-gray-600 text-center">Thank you for your order!</p>

          {/* Order ID - Highlighted và có thể copy */}
          <div className="order-id bg-blue-50 p-4 rounded-lg my-4 text-center border-2 border-blue-200">
            <div className="text-sm text-blue-600 mb-2 font-semibold">YOUR ORDER ID</div>
            <div className="text-3xl font-bold text-blue-700 font-mono tracking-wider">
              #{getShortOrderId()}
            </div>
            <div className="text-xs text-blue-500 mt-2 flex items-center justify-center gap-2">
              <span>Keep this number for reference</span>
              <button 
                onClick={copyOrderId}
                className="copy-btn hover:text-blue-700 transition-colors"
                title="Copy Order ID"
              >
                <FaCopy size={12} />
              </button>
            </div>
          </div>

          {/* Order Details */}
          <div className="mt-4 border-t pt-4 text-sm text-gray-700">
            <p>
              <strong>Date:</strong> {new Date(orderInfo.orderDate).toLocaleDateString()}
            </p>
            <p>
              <strong>Time:</strong> {new Date(orderInfo.orderDate).toLocaleTimeString()}
            </p>
            <p>
              <strong>Name:</strong> {orderInfo.customerDetails.name}
            </p>
            <p>
              <strong>Phone:</strong> {orderInfo.customerDetails.phone}
            </p>
            <p>
              <strong>Guests:</strong> {orderInfo.customerDetails.guests}
            </p>
            <p>
              <strong>Table:</strong> {orderInfo.table}
            </p>
          </div>

          {/* Items Summary */}
          <div className="mt-4 border-t pt-4">
            <h3 className="text-sm font-semibold">Items Ordered</h3>
            <ul className="text-sm text-gray-700">
              {orderInfo.items.map((item, index) => (
                <li
                  key={index}
                  className="flex justify-between items-center text-xs py-1"
                >
                  <span>
                    {item.name} x{item.quantity}
                  </span>
                  <span>{item.price.toFixed(2)} Ft</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Bills Summary */}
          <div className="mt-4 border-t pt-4 text-sm">
            <div className="flex justify-between font-bold text-lg">
              <span>Total:</span>
              <span>{orderInfo.bills.totalWithTax.toFixed(2)} Ft</span>
            </div>
          </div>

          {/* Payment Details */}
          <div className="mb-2 mt-4 text-xs border-t pt-4">
            <p className="font-semibold">Payment Information:</p>
            {orderInfo.paymentMethod === "Cash" ? (
              <p>Payment Method: {orderInfo.paymentMethod}</p>
            ) : (
              <>
                <p>Payment Method: {orderInfo.paymentMethod}</p>
                <p>Transaction ID: {orderInfo.paymentData?.razorpay_payment_id}</p>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="text-center text-xs text-gray-500 mt-6 pt-4 border-t">
            <p>Thank you for dining with us!</p>
            <p>For any issues, please contact us with your Order ID</p>
            <p className="mt-2 font-semibold text-blue-600">Order ID: #{getShortOrderId()}</p>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-between mt-4">
          <button
            onClick={handlePrint}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Print Receipt
          </button>
          <button
            onClick={() => setShowInvoice(false)}
            className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default Invoice;
