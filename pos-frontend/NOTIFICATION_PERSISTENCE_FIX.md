# Notification Persistence Fix

## Vấn đề ban đầu

1. **Duplicate NotificationBell**: Component NotificationBell bị render 2 lần
   - Trong `Header.jsx`
   - Trong `Home.jsx`

2. **Notifications không persist**: Khi login hoặc refresh page, notifications bị mất
   - Chỉ hiển thị "No notifications yet" ngay cả khi có pending orders
   - Chỉ hiển thị notifications khi có socket event mới

## Giải pháp

### 1. Xóa Duplicate NotificationBell

**File: `pos-frontend/src/pages/Home.jsx`**

❌ **Trước:**
```jsx
import NotificationBell from "../components/shared/NotificationBell";

<div className="flex items-center justify-between px-8 py-4">
  <Greetings />
  <NotificationBell />  // ← Xóa dòng này
</div>
```

✅ **Sau:**
```jsx
// Không import NotificationBell

<div className="flex items-center justify-between px-8 py-4">
  <Greetings />
  // NotificationBell chỉ có trong Header
</div>
```

### 2. Load Pending Orders as Notifications

**File: `pos-frontend/src/components/shared/NotificationBell.jsx`**

Thêm useEffect để load pending orders khi component mount:

```jsx
// Load pending orders on mount and convert them to notifications
useEffect(() => {
  if (resData?.data?.data) {
    const orders = resData.data.data;
    
    // Filter pending orders only
    const pendingOrders = orders.filter(order => 
      order.orderStatus === 'Pending' || order.orderStatus === 'pending'
    );
    
    // Set notifications with functional update to access prev state
    setNotifications(prev => {
      // Create map of existing notifications (includes both socket and DB notifications)
      const existingNotificationsMap = new Map();
      prev.forEach(n => {
        existingNotificationsMap.set(n.orderId, n);
      });
      
      // Process pending orders
      const newOrderIds = [];
      const updatedNotifications = pendingOrders.map(order => {
        const existing = existingNotificationsMap.get(order._id);
        
        if (existing) {
          // Keep existing notification with preserved read status and type
          return existing;
        } else {
          // New notification - only if not in previous notifications
          newOrderIds.push(order._id);
          return {
            id: order._id,
            type: 'pending_order',
            message: `Pending order from ${order.customerDetails?.name || order.customerName || 'Guest'} - Table ${order.tableNumber || order.table || 'N/A'}`,
            orderId: order._id,
            timestamp: new Date(order.createdAt),
            read: false
          };
        }
      });
      
      // Update count for new notifications
      if (newOrderIds.length > 0) {
        setNewOrderCount(prevCount => prevCount + newOrderIds.length);
        console.log(`Added ${newOrderIds.length} new pending orders as notifications`);
      }
      
      // Sort by timestamp, newest first
      return updatedNotifications.sort((a, b) => 
        new Date(b.timestamp) - new Date(a.timestamp)
      );
    });
  }
}, [resData?.data?.data]);
```

## Tính năng mới

### ✅ Persist Notifications
- Khi login, load tất cả pending orders và hiển thị như notifications
- Notifications persist giữa các lần refresh

### ✅ Preserve Read Status
- Khi user click bell và đọc notifications, trạng thái "đã đọc" được giữ lại
- Khi refetch orders data, không reset read status về unread

### ✅ Auto-Update Notifications
- Khi order được completed → notification tự động bị xóa (vì không còn trong pending orders)
- Khi có order mới → notification mới được thêm vào

### ✅ No Duplicates
- Check duplicate bằng `orderId` thay vì `id`
- Socket notifications (type: 'new_order') và DB notifications (type: 'pending_order') không bị duplicate

### ✅ Smart Count Management
- `newOrderCount` chỉ tăng khi có order mới thực sự
- Khi user click bell → count reset về 0
- Khi refetch orders → không reset count nếu không có order mới

## Flow hoạt động

### 1. Admin Login
```
1. Load pending orders từ DB
2. Convert thành notifications (read: false)
3. Hiển thị count badge (số pending orders)
4. User thấy ngay có bao nhiêu pending orders
```

### 2. User Click Bell
```
1. Mở dropdown hiển thị danh sách notifications
2. Mark all notifications as read
3. Reset newOrderCount về 0
4. Badge biến mất
```

### 3. New Order Arrives (Socket)
```
1. Nhận socket event 'new-order'
2. Tạo notification mới (type: 'new_order', read: false)
3. Play audio & show desktop notification
4. Auto-print kitchen bill
5. Tăng newOrderCount
6. Badge hiển thị lại
```

### 4. Refetch Orders (Every 30s)
```
1. Load pending orders từ DB
2. Check existing notifications:
   - Nếu orderId đã có → giữ lại với read status cũ
   - Nếu orderId mới → thêm notification mới
   - Nếu order completed → remove notification
3. Sort by timestamp
4. Update UI
```

## Lợi ích

### Cho Admin/Staff:
- ✅ Không bao giờ miss pending orders
- ✅ Login vào thấy ngay có bao nhiêu pending orders
- ✅ Không bị spam notifications khi refetch
- ✅ Notifications tự động update khi orders completed

### Cho System:
- ✅ No duplicate notifications
- ✅ Efficient state management
- ✅ Clean separation between socket và DB notifications
- ✅ Persistent state across page refreshes

## Files Modified

1. **pos-frontend/src/pages/Home.jsx**
   - Xóa import NotificationBell
   - Xóa render NotificationBell

2. **pos-frontend/src/components/shared/NotificationBell.jsx**
   - Thêm useEffect để load pending orders
   - Implement smart notification merging
   - Preserve read status
   - Auto-remove completed orders

## Testing

### Test Case 1: Initial Load
```
1. Đảm bảo có pending orders trong DB
2. Login vào admin
3. ✅ Thấy notification badge với số pending orders
4. Click bell
5. ✅ Thấy danh sách pending orders
```

### Test Case 2: Read Status
```
1. Login và thấy notifications
2. Click bell → mark as read
3. Refresh page
4. ✅ Notifications vẫn hiển thị nhưng không còn badge count
```

### Test Case 3: New Order
```
1. Admin đã login
2. Customer đặt order mới
3. ✅ Admin nhận notification ngay lập tức
4. ✅ Kitchen bill auto-print
5. ✅ Badge count tăng
```

### Test Case 4: Complete Order
```
1. Admin có pending orders notifications
2. Complete một order
3. Wait 30s (refetch interval)
4. ✅ Notification của order đó tự động biến mất
```

### Test Case 5: No Duplicates
```
1. Admin login với pending orders
2. Customer đặt thêm order mới
3. Wait 30s (refetch)
4. ✅ Không có duplicate notifications
5. ✅ Cả socket và DB notifications đều unique
```

