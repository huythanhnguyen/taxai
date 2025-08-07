import { Request, Response, NextFunction } from 'express';
import { Pool } from 'pg';

// This would be injected from the main app
let pool: Pool;

export const setAuditPool = (dbPool: Pool) => {
  pool = dbPool;
};

interface AuditLogData {
  userId?: string | undefined;
  action: string;
  resourceType: string;
  resourceId?: string | undefined;
  oldValues?: any;
  newValues?: any;
  ipAddress?: string | undefined;
  userAgent?: string | undefined;
}

// Log audit event to database
export const logAuditEvent = async (data: AuditLogData): Promise<void> => {
  if (!pool) {
    console.warn('Audit pool not initialized');
    return;
  }

  try {
    const query = `
      INSERT INTO audit_logs (
        user_id, action, resource_type, resource_id, 
        old_values, new_values, ip_address, user_agent
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `;

    const values = [
      data.userId || null,
      data.action,
      data.resourceType,
      data.resourceId || null,
      data.oldValues ? JSON.stringify(data.oldValues) : null,
      data.newValues ? JSON.stringify(data.newValues) : null,
      data.ipAddress || null,
      data.userAgent || null,
    ];

    await pool.query(query, values);
  } catch (error) {
    console.error('Failed to log audit event:', error);
    // Don't throw error to avoid breaking the main request
  }
};

// Middleware to automatically log authentication operations
export const auditAuthOperation = (action: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const originalSend = res.send;
    
    res.send = function(data: any) {
      // Log after response is sent
      setImmediate(async () => {
        try {
          const responseData = typeof data === 'string' ? JSON.parse(data) : data;
          const success = responseData?.success !== false;
          
          if (success) {
            await logAuditEvent({
              userId: req.user?.id,
              action,
              resourceType: 'AUTH',
              ipAddress: req.ip || req.connection.remoteAddress,
              userAgent: req.get('User-Agent'),
              newValues: {
                email: req.body?.email,
                timestamp: new Date().toISOString(),
                success: true
              }
            });
          } else {
            await logAuditEvent({
              userId: req.user?.id,
              action: `${action}_FAILED`,
              resourceType: 'AUTH',
              ipAddress: req.ip || req.connection.remoteAddress,
              userAgent: req.get('User-Agent'),
              newValues: {
                email: req.body?.email,
                error: responseData?.error?.message,
                timestamp: new Date().toISOString(),
                success: false
              }
            });
          }
        } catch (error) {
          console.error('Error in audit logging:', error);
        }
      });

      return originalSend.call(this, data);
    };

    next();
  };
};

// Middleware to log resource operations
export const auditResourceOperation = (action: string, resourceType: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const originalSend = res.send;
    
    res.send = function(data: any) {
      // Log after response is sent
      setImmediate(async () => {
        try {
          const responseData = typeof data === 'string' ? JSON.parse(data) : data;
          const success = responseData?.success !== false;
          
          if (success) {
            await logAuditEvent({
              userId: req.user?.id,
              action,
              resourceType,
                             resourceId: req.params?.['id'] || responseData?.data?.id,
              ipAddress: req.ip || req.connection.remoteAddress,
              userAgent: req.get('User-Agent'),
              newValues: req.method === 'POST' || req.method === 'PUT' ? req.body : undefined
            });
          }
        } catch (error) {
          console.error('Error in audit logging:', error);
        }
      });

      return originalSend.call(this, data);
    };

    next();
  };
};

// Middleware to log data changes (for PUT/PATCH operations)
export const auditDataChange = (resourceType: string, getOldData: (req: Request) => Promise<any>) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Get old data before the operation
      const oldData = await getOldData(req);
      
      const originalSend = res.send;
      
      res.send = function(data: any) {
        // Log after response is sent
        setImmediate(async () => {
          try {
            const responseData = typeof data === 'string' ? JSON.parse(data) : data;
            const success = responseData?.success !== false;
            
            if (success) {
              await logAuditEvent({
                userId: req.user?.id,
                action: 'UPDATE',
                resourceType,
                                 resourceId: req.params?.['id'],
                oldValues: oldData,
                newValues: req.body,
                ipAddress: req.ip || req.connection.remoteAddress,
                userAgent: req.get('User-Agent')
              });
            }
          } catch (error) {
            console.error('Error in audit logging:', error);
          }
        });

        return originalSend.call(this, data);
      };

      next();
    } catch (error) {
      console.error('Error getting old data for audit:', error);
      next(); // Continue without audit logging
    }
  };
};

// Get audit logs for a user (admin only)
export const getUserAuditLogs = async (
  userId: string, 
  limit = 50, 
  offset = 0
): Promise<any[]> => {
  if (!pool) {
    throw new Error('Audit pool not initialized');
  }

  const query = `
    SELECT 
      id, user_id, action, resource_type, resource_id,
      old_values, new_values, ip_address, user_agent, created_at
    FROM audit_logs 
    WHERE user_id = $1 
    ORDER BY created_at DESC 
    LIMIT $2 OFFSET $3
  `;

  const result = await pool.query(query, [userId, limit, offset]);
  return result.rows;
};

// Get all audit logs (admin only)
export const getAllAuditLogs = async (
  limit = 100, 
  offset = 0,
  filters?: {
    action?: string;
    resourceType?: string;
    userId?: string;
    startDate?: string;
    endDate?: string;
  }
): Promise<any[]> => {
  if (!pool) {
    throw new Error('Audit pool not initialized');
  }

  let query = `
    SELECT 
      al.id, al.user_id, al.action, al.resource_type, al.resource_id,
      al.old_values, al.new_values, al.ip_address, al.user_agent, al.created_at,
      u.email, u.first_name, u.last_name
    FROM audit_logs al
    LEFT JOIN users u ON al.user_id = u.id
    WHERE 1=1
  `;

  const values: any[] = [];
  let paramIndex = 1;

  if (filters?.action) {
    query += ` AND al.action = $${paramIndex}`;
    values.push(filters.action);
    paramIndex++;
  }

  if (filters?.resourceType) {
    query += ` AND al.resource_type = $${paramIndex}`;
    values.push(filters.resourceType);
    paramIndex++;
  }

  if (filters?.userId) {
    query += ` AND al.user_id = $${paramIndex}`;
    values.push(filters.userId);
    paramIndex++;
  }

  if (filters?.startDate) {
    query += ` AND al.created_at >= $${paramIndex}`;
    values.push(filters.startDate);
    paramIndex++;
  }

  if (filters?.endDate) {
    query += ` AND al.created_at <= $${paramIndex}`;
    values.push(filters.endDate);
    paramIndex++;
  }

  query += ` ORDER BY al.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  values.push(limit, offset);

  const result = await pool.query(query, values);
  return result.rows;
}; 