import { Router, Request, Response } from 'express';
import Service from '../models/Service';
import { protect } from '../middleware/auth';

const router = Router();

// Public — used by booking form
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const services = await Service.find({ active: true });
    res.json({ success: true, data: services });
  } catch {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Admin — all services including inactive
router.get('/all', protect, async (_req: Request, res: Response): Promise<void> => {
  try {
    const services = await Service.find().sort({ createdAt: -1 });
    res.json({ success: true, data: services });
  } catch {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) {
      res.status(404).json({ success: false, error: 'Service not found' });
      return;
    }
    res.json({ success: true, data: service });
  } catch {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

router.post('/', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    // Assign UUIDs to rooms and extras if missing
    if (req.body.rooms) {
      req.body.rooms = req.body.rooms.map((r: { id?: string }) => ({
        ...r,
        id: r.id || Math.random().toString(36).slice(2),
      }));
    }
    if (req.body.extras) {
      req.body.extras = req.body.extras.map((e: { id?: string }) => ({
        ...e,
        id: e.id || Math.random().toString(36).slice(2),
      }));
    }
    const service = await Service.create(req.body);
    res.status(201).json({ success: true, data: service });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Server error';
    res.status(400).json({ success: false, error: msg });
  }
});

router.put('/:id', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const service = await Service.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!service) {
      res.status(404).json({ success: false, error: 'Service not found' });
      return;
    }
    res.json({ success: true, data: service });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Server error';
    res.status(400).json({ success: false, error: msg });
  }
});

router.delete('/:id', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const service = await Service.findByIdAndDelete(req.params.id);
    if (!service) {
      res.status(404).json({ success: false, error: 'Service not found' });
      return;
    }
    res.json({ success: true, data: {} });
  } catch {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

export default router;
