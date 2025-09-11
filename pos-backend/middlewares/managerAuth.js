const createHttpError = require("http-errors");

const requireManager = (req, res, next) => {
    try {
        // Kiểm tra xem user có tồn tại không (đã được kiểm tra bởi isVerifiedUser)
        if (!req.user) {
            const error = createHttpError(401, "User not authenticated!");
            return next(error);
        }

        // Kiểm tra role manager, waiter, cashier (chấp nhận cả 'admin' và 'Admin')
        const allowedRoles = ['admin', 'Admin', 'manager', 'Manager', 'waiter', 'Waiter', 'cashier', 'Cashier'];
        if (!allowedRoles.includes(req.user.role)) {
            const error = createHttpError(403, "Access denied! Manager privileges required.");
            return next(error);
        }

        next();
    } catch (error) {
        const err = createHttpError(403, "Access denied!");
        next(err);
    }
};

module.exports = { requireManager }; 