import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { User, IUser, UserRole } from '../models/User';
import { Resident, IResident } from '../models/Resident';

export interface AuthRequest extends Request {
  user?: IUser;
  resident?: IResident | null;
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, env.JWT_SECRET) as { id: string; role: UserRole };

    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      res.status(401).json({ success: false, message: 'Invalid token or inactive account.' });
      return;
    }

    req.user = user;

    // A temporary-password account may only use the authenticated password
    // change endpoint until its owner sets a permanent password.
    const requestPath = req.originalUrl.split('?')[0];
    if (user.mustChangePassword && !requestPath.endsWith('/auth/change-password') && !requestPath.endsWith('/auth/me')) {
      res.status(403).json({ success: false, code: 'PASSWORD_CHANGE_REQUIRED', message: 'Change your temporary password to continue.' });
      return;
    }

    if (user.role === 'RESIDENT') {
      const resident = await Resident.findOne({ user: user._id });
      req.resident = resident;
    }

    next();
  } catch (error: any) {
    res.status(401).json({ success: false, message: 'Authentication failed. Invalid or expired token.' });
  }
};

export const requireRoles = (...roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: `Forbidden. Role '${req.user.role}' is not authorized for this resource. Required: [${roles.join(', ')}]`,
      });
      return;
    }

    next();
  };
};

export const requireAdmin = requireRoles('SUPER_ADMIN', 'ADMIN', 'WARDEN');
export const requireStaffOrAdmin = requireRoles('SUPER_ADMIN', 'ADMIN', 'WARDEN', 'STAFF');
export const requireResident = requireRoles('RESIDENT');
