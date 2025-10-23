# Employee Order Status Update Permissions

## Overview
This implementation allows employees (with roles: employee, waiter, cashier, manager, admin) to update order status in the POS system.

## Changes Made

### 1. Backend Changes

#### New Middleware: `middlewares/employeeAuth.js`
- Created `requireEmployee` middleware that allows multiple roles to update orders
- Supported roles: `admin`, `manager`, `waiter`, `cashier`, `employee` (case-insensitive)

#### Updated Routes: `routes/orderRoute.js`
- Changed order update route from `requireManager` to `requireEmployee` middleware
- Route: `PUT /api/order/:id` now uses `requireEmployee` instead of `requireManager`

#### Updated User Model: `models/userModel.js`
- Added role validation with enum for all supported roles
- Includes validation for: admin, manager, waiter, cashier, employee

### 2. Frontend Changes

#### Updated Utilities: `src/utils/index.js`
- Added `canUpdateOrderStatus(userRole)` function to check permissions
- Added `getRoleDisplayName(role)` for Vietnamese role names
- Added `isAdmin(userRole)` and `isManager(userRole)` helper functions

#### Updated Components:
- `src/components/orders/OrderCard.jsx`: Added permission checking for status update buttons
- `src/pages/KitchenDisplay.jsx`: Added permission checking for kitchen display actions
- `src/pages/EmployeeManagement.jsx`: Added new roles (waiter, cashier) to dropdown

## How to Test

### 1. Restart the Server
```bash
cd pos-backend
# Kill any existing Node.js processes if needed
# Then start the server
npm run dev
# or
npm start
```

### 2. Run the Test Script
```bash
cd pos-backend
node test-employee-permissions.js
```

### 3. Expected Results
- ✅ `waiter` role should be able to update order status
- ✅ `cashier` role should be able to update order status  
- ✅ `manager` role should be able to update order status
- ✅ `admin` role should be able to update order status
- ✅ `employee` role should be able to update order status

## User Roles and Permissions

| Role | Vietnamese Name | Can Update Orders | Can Manage Employees | Can Access Dashboard |
|------|----------------|-------------------|---------------------|---------------------|
| admin | Quản trị viên | ✅ | ✅ | ✅ |
| manager | Quản lý | ✅ | ❌ | ✅ |
| waiter | Phục vụ | ✅ | ❌ | ❌ |
| cashier | Thu ngân | ✅ | ❌ | ❌ |
| employee | Nhân viên | ✅ | ❌ | ❌ |

## Frontend Permission Checking

The frontend now checks user permissions before showing order status update buttons:

```javascript
import { canUpdateOrderStatus } from '../utils';

const { role } = useSelector(state => state.user);
const canUpdate = canUpdateOrderStatus(role);

// Only show update buttons if user has permission
{canUpdate && (
  <div className="status-update-buttons">
    {/* Status update buttons */}
  </div>
)}
```

## Troubleshooting

### If Employee Role Still Can't Update Orders:
1. **Restart the server** - The most common issue is that the server needs to be restarted to pick up the new middleware
2. **Clear browser cache** - Frontend changes might be cached
3. **Check server logs** - Look for any errors in the console
4. **Verify middleware** - Run `node verify-routes.js` to test middleware functions

### Server Restart Commands:
```bash
# Find Node.js processes
tasklist /FI "IMAGENAME eq node.exe"

# Kill specific process (replace PID)
taskkill /PID <process_id> /F

# Or restart using nodemon
cd pos-backend
npm run dev
```

## API Endpoints

### Update Order Status
```
PUT /api/order/:id
Authorization: Cookie-based (accessToken)
Required Role: employee, waiter, cashier, manager, or admin

Body:
{
  "orderStatus": "Pending" | "In Progress" | "Ready" | "Completed"
}
```

## Security Notes

- All order status updates require authentication (valid accessToken cookie)
- Only users with appropriate roles can update order status
- Invalid roles are rejected at both middleware and model validation levels
- Frontend provides user-friendly permission checking to hide unavailable actions
