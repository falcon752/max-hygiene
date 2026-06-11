import { Router, Request, Response } from 'express';
import Booking from '../models/Booking';
import Customer from '../models/Customer';
import { protect } from '../middleware/auth';
import { sendBookingEmails, sendLeadEmail } from '../utils/email';

const router = Router();

const generateRef = (): string => {
  const year = new Date().getFullYear();
  const rand = Math.floor(10000 + Math.random() * 90000);
  return `MH-${year}-${rand}`;
};

// Public — lead capture from Step 0
router.post('/lead', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, phone } = req.body;
    if (!name || !email || !phone) {
      res.status(400).json({ success: false, error: 'name, email and phone required' });
      return;
    }
    sendLeadEmail({ name, email, phone }).catch(console.error);
    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Public — submit full booking
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const data = req.body;
    const ref = generateRef();

    const booking = await Booking.create({ ...data, ref });

    // Upsert customer
    const email = data.customer?.email?.toLowerCase();
    if (email) {
      const existing = await Customer.findOne({ email });
      if (existing) {
        existing.bookingCount += 1;
        existing.totalSpent += data.totalPrice || 0;
        await existing.save();
      } else {
        await Customer.create({
          firstName: data.customer.firstName,
          lastName: data.customer.lastName,
          email,
          phone: data.customer.phone,
          address: data.address,
          bookingCount: 1,
          totalSpent: data.totalPrice || 0,
        });
      }
    }

    sendBookingEmails({ ...booking.toObject(), ref }).catch(console.error);

    res.status(201).json({ success: true, data: { ref, id: booking._id } });
  } catch (err: unknown) {
    console.error(err);
    const msg = err instanceof Error ? err.message : 'Server error';
    res.status(400).json({ success: false, error: msg });
  }
});

// Admin routes
router.get('/', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, page = '1', limit = '20', search } = req.query;
    const query: Record<string, unknown> = {};
    if (status) query.status = status;
    if (search) {
      const s = String(search);
      query.$or = [
        { ref: { $regex: s, $options: 'i' } },
        { 'customer.firstName': { $regex: s, $options: 'i' } },
        { 'customer.lastName': { $regex: s, $options: 'i' } },
        { 'customer.email': { $regex: s, $options: 'i' } },
      ];
    }
    const pageNum = parseInt(String(page));
    const limitNum = parseInt(String(limit));
    const total = await Booking.countDocuments(query);
    const bookings = await Booking.find(query)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);
    res.json({ success: true, data: bookings, total, page: pageNum, pages: Math.ceil(total / limitNum) });
  } catch {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

router.get('/stats', protect, async (_req: Request, res: Response): Promise<void> => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [total, thisMonth, lastMonth, pending, revenue] = await Promise.all([
      Booking.countDocuments(),
      Booking.countDocuments({ createdAt: { $gte: startOfMonth } }),
      Booking.countDocuments({ createdAt: { $gte: startOfLastMonth, $lt: startOfMonth } }),
      Booking.countDocuments({ status: 'pending' }),
      Booking.aggregate([
        { $match: { status: { $in: ['confirmed', 'completed'] } } },
        { $group: { _id: null, total: { $sum: '$totalPrice' } } },
      ]),
    ]);

    const monthlyRevenue = await Booking.aggregate([
      { $match: { createdAt: { $gte: startOfMonth }, status: { $in: ['confirmed', 'completed'] } } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } },
    ]);

    res.json({
      success: true,
      data: {
        total,
        thisMonth,
        lastMonth,
        pending,
        totalRevenue: revenue[0]?.total || 0,
        monthlyRevenue: monthlyRevenue[0]?.total || 0,
      },
    });
  } catch {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

router.get('/:id', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      res.status(404).json({ success: false, error: 'Booking not found' });
      return;
    }
    res.json({ success: true, data: booking });
  } catch {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

router.put('/:id', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const booking = await Booking.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!booking) {
      res.status(404).json({ success: false, error: 'Booking not found' });
      return;
    }
    res.json({ success: true, data: booking });
  } catch {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

router.delete('/:id', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id);
    if (!booking) {
      res.status(404).json({ success: false, error: 'Booking not found' });
      return;
    }
    res.json({ success: true, data: {} });
  } catch {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

export default router;
