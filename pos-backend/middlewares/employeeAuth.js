const createHttpError = require("http-errors");

const requireEmployee = (req, res, next) => {
    try {
        // Kiểm tra xem user có tồn tại không (đã được kiểm tra bởi isVerifiedUser)
        if (!req.user) {
            const error = createHttpError(401, "User not authenticated!");
            return next(error);
        }

        // Kiểm tra role employee, waiter, cashier, manager, admin (chấp nhận cả viết hoa và viết thường)
        const allowedRoles = [
            'admin', 'Admin', 
            'manager', 'Manager', 
            'waiter', 'Waiter', 
            'cashier', 'Cashier',
            'employee', 'Employee'
        ];
        
        if (!allowedRoles.includes(req.user.role)) {
            const error = createHttpError(403, "Access denied! Employee privileges required to update order status.");
            return next(error);
        }

        next();
    } catch (error) {
        const err = createHttpError(403, "Access denied!");
        next(err);
    }
};

module.exports = { requireEmployee };
