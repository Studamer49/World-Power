import { Router, Request } from 'express';
import prisma from '../prisma';
import { requireAdmin } from '../middleware/auth';

const router = Router();

// GET - Public notes for a country (only top-level notes, with replies nested)
router.get('/', async (req: Request, res) => {
  try {
    const { countryId } = req.query;
    const include = {
      replies: { orderBy: { createdAt: 'asc' as const } },
    };
    let where: any = { replyToId: null };
    if (countryId) where = { ...where, countryId: countryId as string };

    const notes = await prisma.note.findMany({
      where,
      include,
      orderBy: { createdAt: 'desc' as const },
    });
    res.json(notes);
  } catch (error) {
    console.error('Error fetching notes:', error);
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
});

// GET /all - Admin: all notes across all countries (top-level + nested replies)
router.get('/all', requireAdmin, async (_req, res) => {
  try {
    const notes = await prisma.note.findMany({
      where: { replyToId: null },
      include: {
        replies: { orderBy: { createdAt: 'asc' as const } },
      },
      orderBy: { createdAt: 'desc' as const },
    });
    res.json(notes);
  } catch (error) {
    console.error('Error fetching all notes:', error);
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
});

// POST - Create a note (public: must provide countryId + password matching the country)
router.post('/', async (req, res) => {
  try {
    const { countryId, text, day, date, password, author, replyToId } = req.body;

    const country = await prisma.country.findUnique({ where: { id: countryId } });
    if (!country) {
      res.status(404).json({ error: 'Country not found' });
      return;
    }

    if (!country.password || country.password.length === 0) {
      res.status(403).json({ error: 'This country does not have a password set yet' });
      return;
    }

    if (password !== country.password) {
      res.status(401).json({ error: 'Invalid country password' });
      return;
    }

    if (!text || !text.trim()) {
      res.status(400).json({ error: 'Note text required' });
      return;
    }

    // Validate that replyToId belongs to the same country
    if (replyToId) {
      const parent = await prisma.note.findUnique({ where: { id: replyToId } });
      if (!parent || parent.countryId !== countryId) {
        res.status(400).json({ error: 'Invalid reply target' });
        return;
      }
    }

    const note = await prisma.note.create({
      data: {
        countryId,
        text: text.trim(),
        day: day || 0,
        date: date || '',
        author: (author || country.name).trim(),
        isGM: false,
        replyToId: replyToId || null,
      },
    });
    res.status(201).json(note);
  } catch (error) {
    console.error('Error creating note:', error);
    res.status(500).json({ error: 'Failed to create note' });
  }
});

// POST /:id/reply - GM replies to a note
router.post('/:id/reply', requireAdmin, async (req: any, res) => {
  try {
    const parent = await prisma.note.findUnique({ where: { id: req.params.id } });
    if (!parent) {
      res.status(404).json({ error: 'Note not found' });
      return;
    }

    const { text, day, date } = req.body;
    if (!text || !text.trim()) {
      res.status(400).json({ error: 'Reply text required' });
      return;
    }

    const note = await prisma.note.create({
      data: {
        countryId: parent.countryId,
        text: text.trim(),
        day: day || 0,
        date: date || '',
        author: 'Game Master',
        isGM: true,
        replyToId: parent.id,
      },
    });
    res.status(201).json(note);
  } catch (error) {
    console.error('Error replying to note:', error);
    res.status(500).json({ error: 'Failed to reply to note' });
  }
});

// DELETE /:id - Delete note (admin)
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    await prisma.note.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting note:', error);
    res.status(500).json({ error: 'Failed to delete note' });
  }
});

export default router;
