import { Router, Request, Response } from 'express';
import Availability from '../models/Availability';
import { protect } from '../middleware/auth';

const router = Router();

// Public — used by booking form to know which dates/slots are available
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { from, to } = req.query;
    const query: Record<string, unknown> = { available: true };
    if (from || to) {
      const dateQuery: Record<string, string> = {};
      if (from) dateQuery.$gte = String(from);
      if (to) dateQuery.$lte = String(to);
      query.date = dateQuery;
    }
    const availability = await Availability.find(query).sort({ date: 1 });
    res.json({ success: true, data: availability });
  } catch {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Admin — get all entries including unavailable
router.get('/all', protect, async (_req: Request, res: Response): Promise<void> => {
  try {
    const all = await Availability.find().sort({ date: 1 });
    res.json({ success: true, data: all });
  } catch {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Admin — set/update a date's availability
router.post('/', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const { date, available, slots } = req.body;
    if (!date) {
      res.status(400).json({ success: false, error: 'date required' });
      return;
    }
    const entry = await Availability.findOneAndUpdate(
      { date },
      { available: available ?? true, slots: slots ?? ['08:00', '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00'] },
      { upsert: true, new: true }
    );
    res.json({ success: true, data: entry });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Server error';
    res.status(400).json({ success: false, error: msg });
  }
});

router.put('/:date', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const entry = await Availability.findOneAndUpdate({ date: req.params.date }, req.body, { new: true });
    if (!entry) {
      res.status(404).json({ success: false, error: 'Availability entry not found' });
      return;
    }
    res.json({ success: true, data: entry });
  } catch {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

router.delete('/:date', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    await Availability.findOneAndDelete({ date: req.params.date });
    res.json({ success: true, data: {} });
  } catch {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

export default router;
