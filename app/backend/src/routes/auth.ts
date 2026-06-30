import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import Admin from '../models/Admin';
import { protect, AuthRequest } from '../middleware/auth';

const router = Router();

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ success: false, error: 'Username and password required' });
    return;
  }
  try {
    const admin = await Admin.findOne({ username: username.toLowerCase() });
    if (!admin || !(await admin.comparePassword(password))) {
      res.status(401).json({ success: false, error: 'Invalid credentials' });
      return;
    }
    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET || 'secret', {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    } as jwt.SignOptions);
    res.json({ success: true, token, admin: { id: admin._id, username: admin.username, email: admin.email } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

router.get('/me', protect, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const admin = await Admin.findById(req.adminId).select('-password');
    if (!admin) {
      res.status(404).json({ success: false, error: 'Admin not found' });
      return;
    }
    res.json({ success: true, admin });
  } catch {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

export default router;
