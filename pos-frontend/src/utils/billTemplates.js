// Utility functions for different bill types

/**
 * Generate Compact Kitchen Bill - Optimized for thermal printers
 * @param {Object} order - Order object
 * @returns {string} - HTML string for compact kitchen bill
 */
export const generateCompactKitchenBill = (order) => {
  const customerName = order.customerName || order.customerDetails?.name || 'Guest';
  const tableNumber = order.tableNumber || order.table || 'N/A';
  const orderTime = new Date(order.createdAt).toLocaleString('en-US', {
    day: '2-digit',
    month: '2-digit', 
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  
  return `
    <html>
      <head>
        <title>Kitchen Order</title>
        <style>
          body { 
            font-family: 'Courier New', monospace; 
            margin: 0; 
            padding: 10px;
            font-size: 12px;
            line-height: 1.2;
            width: 280px;
          }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .line { border-bottom: 1px dashed #000; margin: 5px 0; }
          .item { margin: 3px 0; }
          .qty { float: right; }
        </style>
      </head>
      <body>
        <div class="center bold">*** KITCHEN ***</div>
        <div class="center">Table: ${tableNumber} | ${orderTime}</div>
        <div class="line"></div>
        
        ${order.items?.map(item => `
          <div class="item">
            <div class="bold">${item.name}</div>
            <div class="qty">Qty: ${item.quantity || 1}</div>
            ${item.note ? `<div style="font-size: 10px; font-style: italic;">* ${item.note}</div>` : ''}
          </div>
        `).join('') || '<div>No items</div>'}
        
        <div class="line"></div>
        <div class="center">Customer: ${customerName}</div>
        <div class="center" style="font-size: 10px;">#${order._id?.slice(-6) || 'N/A'}</div>
      </body>
    </html>
  `;
};

/**
 * Generate Kitchen Bill - Only items for kitchen staff
 * @param {Object} order - Order object
 * @returns {string} - HTML string for kitchen bill
 */
export const generateKitchenBill = (order) => {
  const customerName = order.customerName || order.customerDetails?.name || 'Guest';
  const tableNumber = order.tableNumber || order.table || 'N/A';
  const orderTime = new Date(order.createdAt).toLocaleString();
  
  return `
    <html>
      <head>
        <title>Phiếu Bếp - Bàn ${tableNumber}</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            margin: 20px; 
            font-size: 14px;
            line-height: 1.4;
          }
          .header { 
            text-align: center; 
            margin-bottom: 20px; 
            border-bottom: 2px solid #000;
            padding-bottom: 10px;
          }
          .header h1 { 
            margin: 0; 
            font-size: 24px; 
            font-weight: bold;
          }
          .order-info { 
            margin-bottom: 20px; 
            background: #f5f5f5;
            padding: 10px;
            border-radius: 5px;
          }
          .order-info p { 
            margin: 5px 0; 
            font-weight: bold;
          }
          .items-header {
            background: #333;
            color: white;
            padding: 10px;
            text-align: center;
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 15px;
          }
          .item { 
            padding: 10px; 
            margin-bottom: 10px;
            border: 1px solid #ddd;
            border-radius: 5px;
            background: #fff;
          }
          .item-name { 
            font-size: 18px; 
            font-weight: bold; 
            margin-bottom: 5px;
          }
          .item-quantity { 
            font-size: 16px; 
            color: #666;
          }
          .notes {
            margin-top: 15px;
            padding: 10px;
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 5px;
          }
          .footer {
            margin-top: 20px;
            text-align: center;
            font-size: 12px;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🍳 KITCHEN ORDER</h1>
          <p>Order ID: #${order._id?.slice(-6) || 'N/A'}</p>
        </div>
        
        <div class="order-info">
          <p>🏠 <strong>Table:</strong> ${tableNumber}</p>
          <p>👤 <strong>Customer:</strong> ${customerName}</p>
          <p>⏰ <strong>Time:</strong> ${orderTime}</p>
        </div>

        <div class="items-header">
          📋 ITEMS LIST
        </div>

        <div class="items">
          ${order.items?.map(item => `
            <div class="item">
              <div class="item-name">🍽️ ${item.name}</div>
              ${item.itemCode || item.id ? `<div class="item-code">🏷️ Item Code: <strong>${item.itemCode || item.id}</strong></div>` : ''}
              <div class="item-quantity">📊 Quantity: <strong>${item.quantity || 1}</strong></div>
              ${item.note ? `<div style="margin-top: 5px; font-style: italic; color: #666; background: #fff3cd; padding: 5px; border-radius: 3px;">📝 Note: ${item.note}</div>` : ''}
            </div>
          `).join('') || '<div class="item">No items</div>'}
        </div>

        ${order.notes ? `
          <div class="notes">
            <strong>📝 Special Notes:</strong><br>
            ${order.notes}
          </div>
        ` : ''}

        <div class="footer">
          <p>⏰ Printed at: ${new Date().toLocaleString()}</p>
          <p>🏪 Restaurant POS System</p>
        </div>
      </body>
    </html>
  `;
};

/**
 * Generate Compact Full Bill - Optimized for thermal printers
 * @param {Object} order - Order object
 * @returns {string} - HTML string for compact full bill
 */
export const generateCompactFullBill = (order) => {
  const customerName = order.customerName || order.customerDetails?.name || 'Guest';
  const customerPhone = order.customerPhone || order.customerDetails?.phone || '';
  const tableNumber = order.tableNumber || order.table || 'N/A';
  const orderTime = new Date(order.createdAt).toLocaleString('en-US', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  
  const total = order.totalAmount || order.bills?.totalWithTax || order.bills?.total || 0;
  
  return `
    <html>
      <head>
        <title>Receipt</title>
        <style>
          body { 
            font-family: 'Courier New', monospace; 
            margin: 0; 
            padding: 10px;
            font-size: 11px;
            line-height: 1.2;
            width: 280px;
          }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .line { border-bottom: 1px dashed #000; margin: 5px 0; }
          .item { margin: 2px 0; display: flex; justify-content: space-between; }
          .total-line { border-top: 1px solid #000; padding-top: 3px; margin-top: 5px; }
        </style>
      </head>
      <body>
        <div class="center bold">*** RECEIPT ***</div>
        <div class="center">RESTAURANT POS</div>
        <div class="line"></div>
        
        <div>Table: ${tableNumber} | ${orderTime}</div>
        <div>Customer: ${customerName}</div>
        ${customerPhone ? `<div>Phone: ${customerPhone}</div>` : ''}
        <div>Order ID: #${order._id?.slice(-6) || 'N/A'}</div>
        
        <div class="line"></div>
        
        ${order.items?.map(item => {
          const itemPrice = item.price || item.unitPrice || 0;
          const itemQuantity = item.quantity || 1;
          const itemTotal = item.total || item.totalPrice || (itemPrice * itemQuantity);
          
          return `
            <div class="item">
              <div>${item.name} x${itemQuantity}</div>
              <div>${itemTotal.toLocaleString('hu-HU')} Ft</div>
            </div>
          `;
        }).join('') || '<div>No items</div>'}
        
        <div class="line"></div>
        <div class="item bold total-line">
          <div>TOTAL:</div>
          <div>${total.toLocaleString('hu-HU')} Ft</div>
        </div>
        
        <div class="line"></div>
        <div class="center">*** THANK YOU ***</div>
        <div class="center" style="font-size: 9px;">Please come again!</div>
      </body>
    </html>
  `;
};

/**
 * Generate Full Bill - Complete invoice with prices
 * @param {Object} order - Order object
 * @returns {string} - HTML string for full bill
 */
export const generateFullBill = (order) => {
  const customerName = order.customerName || order.customerDetails?.name || 'Guest';
  const customerPhone = order.customerPhone || order.customerDetails?.phone || 'N/A';
  const tableNumber = order.tableNumber || order.table || 'N/A';
  const orderTime = new Date(order.createdAt).toLocaleString();
  
  // Calculate totals (prices already include tax)
  const total = order.totalAmount || order.bills?.totalWithTax || order.bills?.total || 0;
  
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('hu-HU', {
      style: 'currency',
      currency: 'HUF'
    }).format(amount);
  };

  return `
    <html>
      <head>
        <title>Hóa Đơn - Bàn ${tableNumber}</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            margin: 20px; 
            font-size: 12px;
            line-height: 1.4;
          }
          .header { 
            text-align: center; 
            margin-bottom: 20px; 
            border-bottom: 2px solid #000;
            padding-bottom: 15px;
          }
          .header h1 { 
            margin: 0; 
            font-size: 28px; 
            font-weight: bold;
            color: #333;
          }
          .restaurant-info {
            text-align: center;
            margin-bottom: 20px;
            font-size: 14px;
            color: #666;
          }
          .order-info { 
            margin-bottom: 20px; 
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
          }
          .order-info div {
            padding: 8px;
            background: #f8f9fa;
            border-radius: 4px;
          }
          .order-info strong { 
            color: #333;
          }
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          .items-table th {
            background: #333;
            color: white;
            padding: 12px 8px;
            text-align: left;
            font-weight: bold;
          }
          .items-table td {
            padding: 10px 8px;
            border-bottom: 1px solid #ddd;
          }
          .items-table tr:nth-child(even) {
            background: #f8f9fa;
          }
          .totals {
            margin-top: 20px;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 8px;
            border: 2px solid #dee2e6;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            font-size: 14px;
          }
          .total-row.final {
            font-size: 18px;
            font-weight: bold;
            color: #333;
            border-top: 2px solid #333;
            padding-top: 10px;
            margin-top: 10px;
          }
          .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 11px;
            color: #666;
            border-top: 1px solid #ddd;
            padding-top: 15px;
          }
          .thank-you {
            text-align: center;
            margin: 20px 0;
            font-size: 16px;
            font-weight: bold;
            color: #28a745;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🧾 PAYMENT RECEIPT</h1>
          <div class="restaurant-info">
            <p><strong>RESTAURANT POS SYSTEM</strong></p>
            <p>Address: 123 Main Street, City</p>
            <p>Phone: (84) 123-456-789</p>
          </div>
        </div>
        
        <div class="order-info">
          <div><strong>🏠 Table:</strong> ${tableNumber}</div>
          <div><strong>📄 Order ID:</strong> #${order._id?.slice(-6) || 'N/A'}</div>
          <div><strong>👤 Customer:</strong> ${customerName}</div>
          <div><strong>📞 Phone:</strong> ${customerPhone}</div>
          <div><strong>⏰ Time:</strong> ${orderTime}</div>
          <div><strong>💳 Status:</strong> Completed</div>
        </div>

        <table class="items-table">
          <thead>
            <tr>
              <th>Item Name</th>
              <th style="text-align: center;">Qty</th>
              <th style="text-align: right;">Unit Price</th>
              <th style="text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${order.items?.map(item => {
              const itemPrice = item.price || item.unitPrice || 0;
              const itemQuantity = item.quantity || 1;
              const itemTotal = item.total || item.totalPrice || (itemPrice * itemQuantity);
              const itemCode = item.itemCode || item.id || '';
              const itemNote = item.note || '';
              
              return `
                <tr>
                  <td>
                    <div>${item.name}</div>
                    ${itemCode ? `<div style="font-size: 10px; color: #666;">Code: ${itemCode}</div>` : ''}
                    ${itemNote ? `<div style="font-size: 10px; font-style: italic; color: #666; background: #fff3cd; padding: 2px; border-radius: 2px; margin-top: 2px;">📝 ${itemNote}</div>` : ''}
                  </td>
                  <td style="text-align: center;">${itemQuantity}</td>
                  <td style="text-align: right;">${formatCurrency(itemPrice)}</td>
                  <td style="text-align: right;">${formatCurrency(itemTotal)}</td>
                </tr>
              `;
            }).join('') || '<tr><td colspan="4" style="text-align: center;">No items</td></tr>'}
          </tbody>
        </table>

        <div class="totals">
          <div class="total-row final">
            <span>TOTAL (tax included):</span>
            <span>${formatCurrency(total)}</span>
          </div>
          <div style="text-align: center; margin-top: 10px; font-size: 12px; color: #666;">
            * Price includes VAT
          </div>
        </div>

        <div class="thank-you">
          🎉 THANK YOU! PLEASE COME AGAIN! 🎉
        </div>

        <div class="footer">
          <p>⏰ Printed at: ${new Date().toLocaleString()}</p>
          <p>🏪 Restaurant POS System - Restaurant Management Software</p>
          <p>📧 Email: support@restaurant-pos.com | 🌐 Website: www.restaurant-pos.com</p>
        </div>
      </body>
    </html>
  `;
};

/**
 * Print compact bill for thermal printers (auto-printing)
 * @param {Object} order - Order object
 * @param {boolean} forceFullBill - Force print full bill regardless of status
 */
export const printCompactBill = (order, forceFullBill = false) => {
  const orderStatus = order.orderStatus || order.status || 'pending';
  const isCompleted = orderStatus.toLowerCase() === 'completed';
  
  // Use compact templates for thermal printing
  const billHTML = (isCompleted || forceFullBill) 
    ? generateCompactFullBill(order) 
    : generateCompactKitchenBill(order);
  
  const printWindow = window.open('', '_blank', 'width=320,height=600');
  printWindow.document.write(billHTML);
  printWindow.document.close();
  
  // Auto print immediately for thermal printers
  setTimeout(() => {
    printWindow.print();
    // Close window after printing
    printWindow.onafterprint = () => {
      printWindow.close();
    };
    // Fallback close after 3 seconds
    setTimeout(() => {
      if (!printWindow.closed) {
        printWindow.close();
      }
    }, 3000);
  }, 500);
};

/**
 * Print bill based on order status (regular size for manual printing)
 * @param {Object} order - Order object
 * @param {boolean} forceFullBill - Force print full bill regardless of status
 */
export const printBill = (order, forceFullBill = false) => {
  const orderStatus = order.orderStatus || order.status || 'pending';
  const isCompleted = orderStatus.toLowerCase() === 'completed';
  
  // Use full bill if completed or forced, otherwise use kitchen bill
  const billHTML = (isCompleted || forceFullBill) 
    ? generateFullBill(order) 
    : generateKitchenBill(order);
  
  const printWindow = window.open('', '_blank');
  printWindow.document.write(billHTML);
  printWindow.document.close();
  printWindow.print();
  
  // Close print window after printing
  printWindow.onafterprint = () => {
    printWindow.close();
  };
};

/**
 * Get bill type description
 * @param {Object} order - Order object
 * @returns {string} - Description of bill type
 */
export const getBillTypeDescription = (order) => {
  const orderStatus = order.orderStatus || order.status || 'pending';
  const isCompleted = orderStatus.toLowerCase() === 'completed';
  
  return isCompleted 
    ? '🧾 Print payment receipt (full bill)' 
    : '🍳 Print kitchen order (items only)';
};
