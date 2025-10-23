# 🔔 Notification System Fix - Giải quyết thông báo bị lặp

## 🔍 Vấn đề trước khi sửa

Hệ thống thông báo bị **lặp 3 lần** khi có đơn hàng mới do có 3 nguồn thông báo chạy song song:

1. **SocketContext**: Socket event `new-order` → âm thanh + snackbar + desktop notification
2. **NotificationBell**: Polling API mỗi 5 giây → âm thanh + snackbar + desktop notification  
3. **PlaceOrderButton**: Khi đặt hàng thành công → âm thanh + snackbar

## ✅ Giải pháp đã áp dụng

### 1. **SocketContext** - Loại bỏ thông báo trùng lặp
```javascript
// TRƯỚC: Phát âm thanh + snackbar + desktop notification
newSocket.on('new-order', (orderData) => {
  // Play notification sound
  const audio = new Audio('/audio/notification.mp3');
  audio.play().catch(e => console.log('Audio play failed:', e));
  
  // Show notification
  enqueueSnackbar(`🍳 New order from Table ${orderData.tableNumber}!`, {
    variant: 'info',
    autoHideDuration: 5000,
  });
  
  // Show desktop notification
  if (Notification.permission === 'granted') {
    new Notification('New Order!', {
      body: `Table ${orderData.tableNumber} - ${orderData.items?.length || 0} items`,
      icon: '/logo.png',
    });
  }
});

// SAU: Chỉ log để debug
newSocket.on('new-order', (orderData) => {
  console.log('New order received via socket:', orderData);
  // Note: Notifications are handled by NotificationBell component to avoid duplicates
});
```

### 2. **NotificationBell** - Tối ưu hóa với socket + chống trùng lặp
```javascript
// Thêm logic chống trùng lặp
const handleNewOrder = (orderData) => {
  const now = Date.now();
  
  // Prevent duplicate notifications within 2 seconds
  if (now - lastNotificationTime < 2000) {
    console.log('Duplicate notification prevented');
    return;
  }
  
  setLastNotificationTime(now);
  // ... xử lý thông báo
};

// Giảm tần suất polling từ 5 giây xuống 30 giây
refetchInterval: 30000, // Reduced frequency since we use socket for real-time updates
```

### 3. **PlaceOrderButton** - Loại bỏ âm thanh trùng lặp
```javascript
// TRƯỚC: Phát âm thanh khi đặt hàng thành công
const audio = new Audio('/audio/notification.mp3');
audio.play().catch(e => console.log('Audio play failed:', e));

// SAU: Loại bỏ âm thanh (chỉ giữ thông báo in hóa đơn)
enqueueSnackbar("🖨️ Order sent to kitchen & printing receipt...", { variant: "info" });
```

## 🎯 Kết quả sau khi sửa

### ✅ Thông báo duy nhất
- **1 âm thanh** duy nhất từ NotificationBell
- **1 snackbar** duy nhất từ NotificationBell  
- **1 desktop notification** duy nhất từ NotificationBell

### ✅ Hiệu suất tối ưu
- Socket real-time thay vì polling liên tục
- Giảm tần suất polling từ 5s xuống 30s (chỉ làm fallback)
- Logic chống trùng lặp trong vòng 2 giây

### ✅ Trải nghiệm người dùng tốt hơn
- Không còn bị spam thông báo
- Âm thanh không bị lặp gây khó chịu
- Thông báo rõ ràng, không gây nhầm lẫn

## 🔧 Cách hoạt động mới

### Luồng thông báo đơn hàng mới:
1. **Backend**: Tạo đơn hàng → `notifyKitchen()` → Socket emit `new-order`
2. **Frontend**: NotificationBell nhận socket event → Kiểm tra duplicate → Hiển thị thông báo
3. **Fallback**: Nếu socket không hoạt động, polling 30s sẽ phát hiện đơn mới

### Các thành phần và vai trò:
- **SocketContext**: Chỉ quản lý kết nối socket, không phát thông báo
- **NotificationBell**: Nguồn thông báo duy nhất, có logic chống trùng lặp
- **PlaceOrderButton**: Chỉ thông báo về việc in hóa đơn, không phát âm thanh

## 🧪 Cách test

### 1. Test thông báo không bị lặp:
```bash
# Tạo đơn hàng mới và kiểm tra:
# - Chỉ có 1 âm thanh notification.mp3
# - Chỉ có 1 snackbar "New order from Table X"
# - Chỉ có 1 desktop notification
```

### 2. Test socket fallback:
```bash
# Tắt socket server và tạo đơn hàng
# - Polling 30s vẫn phát hiện đơn mới
# - Không có thông báo trùng lặp
```

### 3. Test duplicate prevention:
```bash
# Tạo nhiều đơn hàng liên tiếp trong 2 giây
# - Chỉ đơn đầu tiên được thông báo
# - Các đơn sau bị chặn duplicate
```

## 🚨 Lưu ý quan trọng

### Restart Frontend
Sau khi thay đổi, cần restart frontend để áp dụng:
```bash
cd pos-frontend
npm run dev
```

### Kiểm tra Socket Connection
Đảm bảo socket hoạt động bình thường:
```javascript
// Trong browser console
console.log('Socket connected:', socket?.connected);
```

### Monitoring
Theo dõi console để đảm bảo không có lỗi:
```javascript
// Các log cần chú ý:
"New order received via socket:" // SocketContext
"Duplicate notification prevented" // NotificationBell
"Socket connected:" // SocketContext
```

## 📋 Checklist sau khi deploy

- [ ] Tạo đơn hàng mới chỉ có 1 thông báo âm thanh
- [ ] Snackbar không bị lặp
- [ ] Desktop notification không bị lặp  
- [ ] Socket connection hoạt động bình thường
- [ ] Polling fallback hoạt động khi socket lỗi
- [ ] NotificationBell hiển thị đúng số lượng đơn mới
- [ ] Không có lỗi console liên quan đến thông báo
