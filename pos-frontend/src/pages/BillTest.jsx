import React from 'react';
import { printCompactBill, printBill, generateCompactKitchenBill, generateCompactFullBill } from '../utils/billTemplates';

const BillTest = () => {
  // Sample order data for testing
  const sampleOrder = {
    _id: '67123456789abcdef0123456',
    customerName: 'John Smith',
    customerDetails: {
      name: 'John Smith',
      phone: '0123456789'
    },
    tableNumber: '5',
    table: '5',
    items: [
      {
        name: 'Beef Pho',
        quantity: 2,
        price: 2500,
        total: 5000
      },
      {
        name: 'Grilled Pork Rice',
        quantity: 1,
        price: 2800,
        total: 2800,
        note: 'No onions'
      },
      {
        name: 'Iced Tea',
        quantity: 3,
        price: 450,
        total: 1350
      }
    ],
    totalAmount: 9150,
    orderStatus: 'Pending',
    createdAt: new Date().toISOString()
  };

  const completedOrder = {
    ...sampleOrder,
    orderStatus: 'Completed'
  };

  const handleTestCompactKitchen = () => {
    printCompactBill(sampleOrder);
  };

  const handleTestCompactFull = () => {
    printCompactBill(completedOrder);
  };

  const handleTestRegularKitchen = () => {
    printBill(sampleOrder);
  };

  const handleTestRegularFull = () => {
    printBill(completedOrder);
  };

  const handlePreviewCompactKitchen = () => {
    const html = generateCompactKitchenBill(sampleOrder);
    const newWindow = window.open('', '_blank');
    newWindow.document.write(html);
    newWindow.document.close();
  };

  const handlePreviewCompactFull = () => {
    const html = generateCompactFullBill(completedOrder);
    const newWindow = window.open('', '_blank');
    newWindow.document.write(html);
    newWindow.document.close();
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center">🖨️ Bill Template Test</h1>
      
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
        <div className="flex">
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              <strong>Instructions:</strong> "Compact" templates are optimized for thermal printers - 
              small, paper-saving and suitable for auto-printing. "Regular" templates are full-size for manual printing.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Compact Templates */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 text-green-600">🔥 Compact Templates (Thermal Printer)</h2>
          <div className="space-y-3">
            <button
              onClick={handleTestCompactKitchen}
              className="w-full bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors"
            >
              🍳 Print Compact Kitchen Bill
            </button>
            <button
              onClick={handleTestCompactFull}
              className="w-full bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors"
            >
              🧾 Print Compact Full Bill
            </button>
            <div className="border-t pt-3">
              <p className="text-sm text-gray-600 mb-2">Preview (no printing):</p>
              <button
                onClick={handlePreviewCompactKitchen}
                className="w-full bg-green-100 text-green-700 px-4 py-2 rounded hover:bg-green-200 transition-colors mb-2"
              >
                👀 Preview Compact Kitchen
              </button>
              <button
                onClick={handlePreviewCompactFull}
                className="w-full bg-green-100 text-green-700 px-4 py-2 rounded hover:bg-green-200 transition-colors"
              >
                👀 Preview Compact Full
              </button>
            </div>
          </div>
        </div>

        {/* Regular Templates */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 text-blue-600">📄 Regular Templates (Manual Print)</h2>
          <div className="space-y-3">
            <button
              onClick={handleTestRegularKitchen}
              className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
            >
              🍳 Print Regular Kitchen Bill
            </button>
            <button
              onClick={handleTestRegularFull}
              className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
            >
              🧾 Print Regular Full Bill
            </button>
          </div>
        </div>
      </div>

      {/* Sample Data Display */}
      <div className="mt-8 bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">📋 Sample Order Data</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Kitchen Bill (Pending Order):</h4>
            <pre className="text-xs bg-white p-3 rounded border overflow-x-auto">
{JSON.stringify({
  table: sampleOrder.tableNumber,
  customer: sampleOrder.customerName,
  items: sampleOrder.items.map(item => ({
    name: item.name,
    quantity: item.quantity,
    note: item.note
  })),
  status: sampleOrder.orderStatus
}, null, 2)}
            </pre>
          </div>
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Full Bill (Completed Order):</h4>
            <pre className="text-xs bg-white p-3 rounded border overflow-x-auto">
{JSON.stringify({
  table: completedOrder.tableNumber,
  customer: completedOrder.customerName,
  phone: completedOrder.customerDetails.phone,
  items: completedOrder.items,
  total: completedOrder.totalAmount,
  status: completedOrder.orderStatus
}, null, 2)}
            </pre>
          </div>
        </div>
      </div>

      {/* Features Comparison */}
      <div className="mt-8 bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">⚖️ Template Comparison</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Feature</th>
                <th className="text-left py-2 text-green-600">Compact</th>
                <th className="text-left py-2 text-blue-600">Regular</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-2">Size</td>
                <td className="py-2 text-green-600">280px width (thermal)</td>
                <td className="py-2 text-blue-600">Full width (A4)</td>
              </tr>
              <tr className="border-b">
                <td className="py-2">Font</td>
                <td className="py-2 text-green-600">Courier New, 11-12px</td>
                <td className="py-2 text-blue-600">Arial, 14-18px</td>
              </tr>
              <tr className="border-b">
                <td className="py-2">Styling</td>
                <td className="py-2 text-green-600">Minimal, dashed lines</td>
                <td className="py-2 text-blue-600">Rich, colors, borders</td>
              </tr>
              <tr className="border-b">
                <td className="py-2">Purpose</td>
                <td className="py-2 text-green-600">Auto-print, thermal printer</td>
                <td className="py-2 text-blue-600">Manual print, laser printer</td>
              </tr>
              <tr>
                <td className="py-2">Paper Saving</td>
                <td className="py-2 text-green-600">✅ Very efficient</td>
                <td className="py-2 text-blue-600">❌ Uses more paper</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BillTest;
