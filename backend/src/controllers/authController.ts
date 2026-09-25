import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User';
import { Resident } from '../models/Resident';
import { env } from '../config/env';
import { AuthRequest } from '../middleware/auth';

const generateToken = (user: IUser): string => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
      name: user.name,
    },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] }
  );
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { identifier, password } = req.body; // identifier can be email or phone
    if (!identifier || !password) {
      res.status(400).json({ success: false, message: 'Email/Phone and password are required.' });
      return;
    }

    const user = await User.findOne({
      $or: [
        { email: identifier.toLowerCase().trim() },
        { phone: identifier.trim() },
      ],
    });

    if (!user) {
      res.status(401).json({ success: false, message: 'Invalid credentials.' });
      return;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({ success: false, message: 'Invalid credentials.' });
      return;
    }

    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user);
    const resident = user.role === 'RESIDENT' ? await Resident.findOne({ user: user._id }) : null;

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatarUrl: user.avatarUrl,
      },
      resident,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const devLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    // Block dev-login in production
    if (env.NODE_ENV === 'production') {
      res.status(403).json({ success: false, message: 'Development login is not available in production.' });
      return;
    }

    const { role } = req.body; // 'RESIDENT' | 'WARDEN' | 'ADMIN'
    const targetRole = role || 'RESIDENT';

    let user: IUser | null = null;
    if (targetRole === 'RESIDENT') {
      user = await User.findOne({ email: 'ananya.sharma@slgluxury.com' });
    } else if (targetRole === 'WARDEN') {
      user = await User.findOne({ email: 'shanti.reddy@slgluxury.com' });
    } else {
      user = await User.findOne({ role: 'ADMIN' });
    }

    if (!user) {
      // Fallback: pick any user matching the role
      user = await User.findOne({ role: targetRole });
    }

    if (!user) {
      res.status(404).json({ success: false, message: `No development user found for role ${targetRole}. Please run npm run seed first.` });
      return;
    }

    const token = generateToken(user);
    const resident = user.role === 'RESIDENT' ? await Resident.findOne({ user: user._id }) : null;

    res.json({
      success: true,
      message: `Logged in as ${user.name} (${user.role}) [Development Mode]`,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatarUrl: user.avatarUrl,
      },
      resident,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const resident = req.user.role === 'RESIDENT' ? await Resident.findOne({ user: req.user._id }) : null;

    res.json({
      success: true,
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        phone: req.user.phone,
        role: req.user.role,
        avatarUrl: req.user.avatarUrl,
      },
      resident,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updatePushToken = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { pushToken } = req.body;
    if (req.user) {
      req.user.pushToken = pushToken;
      await req.user.save();
    }
    res.json({ success: true, message: 'Push token updated successfully.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
