import { Router, Request, Response } from 'express';
import Customer from '../models/Customer';
import Booking from '../models/Booking';
import { protect } from '../middleware/auth';

const router = Router();

router.get('/', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = '1', limit = '20', search } = req.query;
    const query: Record<string, unknown> = {};
    if (search) {
      const s = String(search);
      query.$or = [
        { firstName: { $regex: s, $options: 'i' } },
        { lastName: { $regex: s, $options: 'i' } },
        { email: { $regex: s, $options: 'i' } },
        { phone: { $regex: s, $options: 'i' } },
      ];
    }
    const pageNum = parseInt(String(page));
    const limitNum = parseInt(String(limit));
    const total = await Customer.countDocuments(query);
    const customers = await Customer.find(query)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);
    res.json({ success: true, data: customers, total, page: pageNum, pages: Math.ceil(total / limitNum) });
  } catch {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

router.get('/:id', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      res.status(404).json({ success: false, error: 'Customer not found' });
      return;
    }
    const bookings = await Booking.find({ 'customer.email': customer.email }).sort({ createdAt: -1 });
    res.json({ success: true, data: customer, bookings });
  } catch {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

router.post('/', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const customer = await Customer.create(req.body);
    res.status(201).json({ success: true, data: customer });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Server error';
    res.status(400).json({ success: false, error: msg });
  }
});

router.put('/:id', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!customer) {
      res.status(404).json({ success: false, error: 'Customer not found' });
      return;
    }
    res.json({ success: true, data: customer });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Server error';
    res.status(400).json({ success: false, error: msg });
  }
});

router.delete('/:id', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    await Customer.findByIdAndDelete(req.params.id);
    res.json({ success: true, data: {} });
  } catch {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

export default router;
