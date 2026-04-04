import { errorResponse } from '../utils/apiResponse.js';

export const authorize = (allowedRoles) => {
  return (req, res, next) => {
    const roleHierarchy = { viewer: 1, analyst: 2, manager: 3, admin: 4 };

    if (!req.user?.role) {
      return errorResponse(res, 401, 'UNAUTHORIZED', 'User role not found');
    }

    const userLevel = roleHierarchy[req.user.role] || 0;

    // Check if user matches at least one of the allowed roles' levels
    const hasAccess = allowedRoles.some(allowedRole => userLevel >= roleHierarchy[allowedRole]);

    if (!hasAccess) {
      return errorResponse(res, 403, 'FORBIDDEN', 'Insufficient permissions');
    }

    next();
  };
};
