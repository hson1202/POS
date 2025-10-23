# Fix: Bàn Tự Động Chuyển Sang "Occupied" Khi Khách Đặt Món

## Vấn Đề
Khi khách đặt bàn (status "Booked") và sau đó tới quán đặt món, bàn không tự động chuyển sang trạng thái "Occupied" (màu xanh dương). Điều này yêu cầu admin phải thủ công cập nhật trạng thái bàn, gây bất tiện.

## Flow Mong Muốn
1. Khách đặt bàn → Bàn chuyển sang "Booked" (cam)
2. Khách tới quán và bắt đầu đặt món
3. Khi đặt món xong → **Bàn tự động chuyển sang "Occupied" (xanh dương)**
4. Order được tạo/cập nhật thành công với các món đã đặt

## Giải Pháp Đã Thực Hiện

### 1. Backend: Auto-Update Table Status (orderController.js)

**Thay đổi:**
- Khi order với status "Booked" nhận thêm món mới → tự động chuyển order status sang "Pending"
- Tự động cập nhật table status sang "Occupied" khi có món được đặt
- Emit socket event `table-updated` để notify frontend về thay đổi

**Code Logic:**
```javascript
// Nếu order đang ở trạng thái "Booked" và có items được thêm vào
if (existingOrder.orderStatus === "Booked" && addedItems.length > 0) {
  existingOrder.orderStatus = "Pending";
  shouldUpdateTableStatus = true;
}

// Auto-update table status to "Occupied"
if (shouldUpdateTableStatus && addedItems.length > 0) {
  const table = await Table.findById(tableIdentifier);
  if (table && table.status !== "Occupied") {
    table.status = "Occupied";
    table.currentOrder = order._id;
    await table.save();
    
    // Notify via socket
    notifyTableUpdate({
      _id: table._id,
      tableNo: table.tableNo,
      status: table.status,
      currentOrder: order._id
    });
  }
}
```

### 2. Socket: Thêm Table Update Notification (socket.js)

**Thay đổi:**
- Thêm function `notifyTableUpdate()` để emit event `table-updated`
- Export function này để các controller khác có thể sử dụng

**Code:**
```javascript
const notifyTableUpdate = (tableData) => {
  if (io) {
    io.emit('table-updated', tableData);
    console.log('Notified about table update:', tableData._id || tableData.tableNo);
  }
};
```

### 3. Frontend: Cải Thiện PlaceOrderButton (PlaceOrderButton.jsx)

**Thay đổi:**
- Thêm `await` cho việc gọi `updateTable()` 
- Cải thiện error handling
- Thêm comment giải thích rằng backend đã auto-update, frontend chỉ là fallback
- Đổi message thông báo sang tiếng Việt

**Code:**
```javascript
onSuccess: async (resData) => {
  // Backend auto-updates table status, but we try as fallback
  if (tableId && tableId !== "undefined") {
    try {
      await updateTable({ tableId, status: "Occupied", orderId: data._id });
    } catch (error) {
      console.log("Table update failed (backend should have handled it):", error);
    }
  }
  
  // Clear cart and show success message
  dispatch(removeAllItems());
  dispatch(removeCustomer());
  enqueueSnackbar("✅ Đặt món thành công! Đơn hàng đã được gửi tới bếp.", { 
    variant: "success"
  });
}
```

### 4. Frontend: Listen Socket Updates (Tables.jsx)

**Thay đổi:**
- Import `useSocket` hook
- Thêm listener cho event `table-updated`
- Tự động invalidate react-query cache để refresh danh sách bàn

**Code:**
```javascript
const { socket } = useSocket();

useEffect(() => {
  if (socket) {
    const handleTableUpdate = (tableData) => {
      console.log('Table updated via socket:', tableData);
      queryClient.invalidateQueries(['tables']);
    };

    socket.on('table-updated', handleTableUpdate);

    return () => {
      socket.off('table-updated', handleTableUpdate);
    };
  }
}, [socket, queryClient]);
```

## Lợi Ích

✅ **Tự động hóa hoàn toàn**: Không cần admin thủ công cập nhật trạng thái bàn
✅ **Real-time updates**: Socket đảm bảo UI cập nhật ngay lập tức
✅ **UX tốt hơn**: Khách đặt bàn → đến quán → đặt món liền mạch
✅ **Giảm lỗi**: Tránh quên cập nhật trạng thái bàn, gây nhầm lẫn
✅ **Fallback mechanism**: Frontend vẫn cố gắng update nếu backend fail

## Test Cases

### Test Case 1: Bàn Đã Đặt → Khách Tới Đặt Món
1. Admin đặt bàn cho khách (status: Booked)
2. Khách tới quán, nhấn "Bắt đầu gọi món" trong TableCard
3. Chọn món và nhấn "Place Order"
4. **Kỳ vọng**: 
   - Bàn tự động chuyển sang "Occupied" (xanh dương)
   - Order được tạo với status "Pending"
   - Món xuất hiện trong danh sách order
   - Không cần admin can thiệp

### Test Case 2: Bàn Trống → Đặt Món Trực Tiếp
1. Khách walk-in, chọn bàn trống
2. Đặt món trực tiếp
3. **Kỳ vọng**:
   - Bàn tự động chuyển sang "Occupied"
   - Order được tạo thành công

### Test Case 3: Bàn Occupied → Gọi Thêm Món
1. Bàn đã có khách (status: Occupied)
2. Nhấn "Gọi thêm món"
3. Thêm món mới vào order
4. **Kỳ vọng**:
   - Món được thêm vào order hiện tại
   - Status bàn vẫn là "Occupied"
   - Không tạo order mới

## Files Changed

### Backend:
- `pos-backend/controllers/orderController.js` - Logic auto-update table status
- `pos-backend/config/socket.js` - Thêm notifyTableUpdate function

### Frontend:
- `pos-frontend/src/components/menu/PlaceOrderButton.jsx` - Cải thiện error handling
- `pos-frontend/src/pages/Tables.jsx` - Listen socket updates

## Notes

- Backend xử lý logic chính, đảm bảo consistency
- Frontend có fallback mechanism để tăng reliability
- Socket đảm bảo tất cả clients nhận được update real-time
- Không breaking changes - hệ thống cũ vẫn hoạt động bình thường

