import { Request, Response, NextFunction } from 'express';

// Define permissions
export const PERMISSIONS = {
  // Tax form permissions
  TAX_FORM_READ: 'tax_form:read',
  TAX_FORM_WRITE: 'tax_form:write',
  TAX_FORM_DELETE: 'tax_form:delete',
  TAX_FORM_SUBMIT: 'tax_form:submit',
  TAX_FORM_APPROVE: 'tax_form:approve',
  
  // User permissions
  USER_READ: 'user:read',
  USER_WRITE: 'user:write',
  USER_DELETE: 'user:delete',
  
  // Admin permissions
  ADMIN_READ: 'admin:read',
  ADMIN_WRITE: 'admin:write',
  SYSTEM_CONFIG: 'system:config',
} as const;

type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

// Define role permissions mapping
const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  individual: [
    PERMISSIONS.TAX_FORM_READ,
    PERMISSIONS.TAX_FORM_WRITE,
    PERMISSIONS.TAX_FORM_DELETE,
    PERMISSIONS.TAX_FORM_SUBMIT,
    PERMISSIONS.USER_READ,
    PERMISSIONS.USER_WRITE,
  ],
  business: [
    PERMISSIONS.TAX_FORM_READ,
    PERMISSIONS.TAX_FORM_WRITE,
    PERMISSIONS.TAX_FORM_DELETE,
    PERMISSIONS.TAX_FORM_SUBMIT,
    PERMISSIONS.USER_READ,
    PERMISSIONS.USER_WRITE,
  ],
  consultant: [
    PERMISSIONS.TAX_FORM_READ,
    PERMISSIONS.TAX_FORM_WRITE,
    PERMISSIONS.TAX_FORM_DELETE,
    PERMISSIONS.TAX_FORM_SUBMIT,
    PERMISSIONS.TAX_FORM_APPROVE,
    PERMISSIONS.USER_READ,
    PERMISSIONS.USER_WRITE,
  ],
  admin: [
    PERMISSIONS.TAX_FORM_READ,
    PERMISSIONS.TAX_FORM_WRITE,
    PERMISSIONS.TAX_FORM_DELETE,
    PERMISSIONS.TAX_FORM_SUBMIT,
    PERMISSIONS.TAX_FORM_APPROVE,
    PERMISSIONS.USER_READ,
    PERMISSIONS.USER_WRITE,
    PERMISSIONS.USER_DELETE,
    PERMISSIONS.ADMIN_READ,
    PERMISSIONS.ADMIN_WRITE,
    PERMISSIONS.SYSTEM_CONFIG,
  ],
};

// Check if user has permission
export const hasPermission = (userRole: string, permission: Permission): boolean => {
  const rolePermissions = ROLE_PERMISSIONS[userRole] || [];
  return rolePermissions.includes(permission);
};

// Middleware to require specific permission
export const requirePermission = (permission: Permission) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'AUTHENTICATION_REQUIRED',
          message: 'Authentication required'
        }
      });
      return;
    }

    if (!hasPermission(req.user.role, permission)) {
      res.status(403).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'Insufficient permissions for this action',
          details: {
            required: permission,
            userRole: req.user.role
          }
        }
      });
      return;
    }

    next();
  };
};

// Middleware to require specific roles
export const requireRoles = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'AUTHENTICATION_REQUIRED',
          message: 'Authentication required'
        }
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_ROLE',
          message: 'Insufficient role for this action',
          details: {
            required: roles,
            userRole: req.user.role
          }
        }
      });
      return;
    }

    next();
  };
};

// Middleware to check resource ownership
export const requireOwnership = (getResourceUserId: (req: Request) => Promise<string | null>) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'AUTHENTICATION_REQUIRED',
          message: 'Authentication required'
        }
      });
      return;
    }

    // Admins can access any resource
    if (req.user.role === 'admin') {
      next();
      return;
    }

    try {
      const resourceUserId = await getResourceUserId(req);
      
      if (!resourceUserId) {
        res.status(404).json({
          success: false,
          error: {
            code: 'RESOURCE_NOT_FOUND',
            message: 'Resource not found'
          }
        });
        return;
      }

      if (resourceUserId !== req.user.id) {
        res.status(403).json({
          success: false,
          error: {
            code: 'ACCESS_DENIED',
            message: 'You can only access your own resources'
          }
        });
        return;
      }

      next();
    } catch (error) {
      console.error('Error checking resource ownership:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'OWNERSHIP_CHECK_ERROR',
          message: 'Error checking resource ownership'
        }
      });
    }
  };
};

// Get user permissions
export const getUserPermissions = (userRole: string): Permission[] => {
  return ROLE_PERMISSIONS[userRole] || [];
};

// Check multiple permissions (user must have ALL)
export const hasAllPermissions = (userRole: string, permissions: Permission[]): boolean => {
  const rolePermissions = ROLE_PERMISSIONS[userRole] || [];
  return permissions.every(permission => rolePermissions.includes(permission));
};

// Check multiple permissions (user must have ANY)
export const hasAnyPermission = (userRole: string, permissions: Permission[]): boolean => {
  const rolePermissions = ROLE_PERMISSIONS[userRole] || [];
  return permissions.some(permission => rolePermissions.includes(permission));
}; 