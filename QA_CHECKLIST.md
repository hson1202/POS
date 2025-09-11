# 📋 QA/UAT CHECKLIST - Restaurant POS System

## 🎯 Tiêu chí hoàn thành
- ✅ Dashboard hiển thị dữ liệu thật từ API
- ✅ Đơn mới tạo từ bàn → trong ≤5s bếp nhận thông báo
- ✅ Bill tự in và phát âm báo khi khách đặt món tại bàn

---

## 1. 🏠 DASHBOARD & DATA INTEGRATION

### ✅ Completed
- [x] Dashboard displays real-time stats from API
- [x] Popular dishes fetched from actual order data
- [x] Metrics component uses real API data
- [x] Recent orders show actual orders
- [x] No mock/hardcoded data in dashboard

### 🔍 Test Steps
1. Navigate to Dashboard (`/dashboard`)
2. Verify all numbers update from API
3. Check Popular Dishes shows real order data
4. Confirm metrics refresh every 30 seconds

---

## 2. 🍳 KITCHEN NOTIFICATION SYSTEM

### ✅ Completed
- [x] WebSocket/Socket.io implemented
- [x] Real-time notifications to kitchen on new orders
- [x] Kitchen Display interface (`/kitchen`)
- [x] Auto-refresh every 5 seconds
- [x] Sound alert on new orders
- [x] Desktop notifications (if permission granted)

### 🔍 Test Steps
1. Open Kitchen Display in one browser tab
2. Place order from another tab/device
3. Verify notification appears within 5 seconds
4. Check sound plays automatically
5. Confirm order status updates in real-time

---

## 3. 🖨️ AUTO-PRINT SYSTEM

### ✅ Completed
- [x] Auto-print receipt when order placed from table
- [x] Sound alert plays with printing
- [x] Print preview shows correct format
- [x] Order details included in receipt

### 🔍 Test Steps
1. Navigate to table menu (`/table/1`)
2. Add items to cart
3. Place order
4. Verify print dialog opens automatically
5. Check sound alert plays
6. Confirm receipt format is correct

---

## 4. 🛒 CUSTOMER ORDERING FLOW

### 📝 Test Scenarios
- [ ] **Browse Menu**
  - Navigate to `/table/1`
  - View menu categories
  - See item details and prices
  
- [ ] **Add to Cart**
  - Add multiple items
  - Adjust quantities
  - Remove items
  - View cart total

- [ ] **Customer Info**
  - Enter customer name
  - Enter phone number
  - Specify number of guests

- [ ] **Place Order**
  - Submit order successfully
  - Receive confirmation message
  - Auto-print receipt (table orders)
  - Clear cart after order

- [ ] **Order Tracking**
  - View order status
  - See order details
  - Track preparation progress

---

## 5. 🔔 REAL-TIME FEATURES

### ✅ Implemented
- [x] WebSocket connection status indicator
- [x] New order notifications
- [x] Order status updates
- [x] Auto-refresh data

### 🔍 Test Steps
1. Check connection indicator (green = connected)
2. Test new order notifications
3. Update order status and verify broadcast
4. Confirm all connected clients receive updates

---

## 6. 🐛 EDGE CASES & ERROR HANDLING

### Test Scenarios
- [ ] **Network Issues**
  - Disconnect internet
  - Place order offline
  - Verify error message
  - Check reconnection

- [ ] **Inventory**
  - Order item with low stock
  - Verify stock deduction
  - Check insufficient stock warning

- [ ] **Concurrent Orders**
  - Place multiple orders simultaneously
  - Verify all orders process correctly
  - Check kitchen receives all notifications

- [ ] **Print Failures**
  - Cancel print dialog
  - Verify order still completes
  - Check error handling

---

## 7. 📱 RESPONSIVE DESIGN

### Devices to Test
- [ ] Desktop (1920x1080)
- [ ] Tablet (768x1024)
- [ ] Mobile (375x667)
- [ ] Kitchen Display (various sizes)

---

## 8. 🔐 SECURITY & PERMISSIONS

### Test Cases
- [ ] Role-based access (Admin, Manager, Staff, Kitchen)
- [ ] Protected routes require authentication
- [ ] JWT token validation
- [ ] Session timeout handling

---

## 9. 📊 REPORTING & ANALYTICS

### Features to Verify
- [ ] Daily revenue calculation
- [ ] Popular dishes ranking
- [ ] Order history filtering
- [ ] Payment tracking
- [ ] Inventory alerts

---

## 10. 🚀 PERFORMANCE

### Metrics to Check
- [ ] Page load time < 3 seconds
- [ ] API response time < 1 second
- [ ] WebSocket latency < 500ms
- [ ] Print dialog opens < 2 seconds

---

## 11. 💾 DATA PERSISTENCE

### Verify
- [ ] Orders saved to database
- [ ] Inventory updates persisted
- [ ] Customer info stored
- [ ] Payment records maintained

---

## 12. 🎨 UI/UX CONSISTENCY

### Check
- [ ] Consistent color scheme
- [ ] Proper loading states
- [ ] Error message clarity
- [ ] Success feedback
- [ ] Navigation flow

---

## 📝 NOTES FOR DEPLOYMENT

### Pre-deployment Checklist
- [ ] Replace notification.mp3 with actual sound file
- [ ] Configure printer settings for production
- [ ] Set WebSocket URL for production server
- [ ] Update CORS settings
- [ ] Enable HTTPS
- [ ] Set up monitoring/logging
- [ ] Configure backup system
- [ ] Test with real printer hardware

### Environment Variables Required
```env
# Backend
MONGODB_URI=<production_db_url>
JWT_SECRET=<secure_secret>
FRONTEND_URL=<production_frontend_url>
PORT=3000

# Frontend
VITE_API_URL=<production_api_url>
```

---

## ✅ SIGN-OFF

- [ ] **Developer Testing Complete**
- [ ] **QA Testing Complete**
- [ ] **UAT Complete**
- [ ] **Production Ready**

---

**Last Updated:** September 11, 2025
**Version:** 1.0.0
