import { Router } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../prisma';
import { requireAdmin, verifyToken, getToken } from '../middleware/auth';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin';

router.post('/login', async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) {
      res.status(400).json({ error: 'Password required' });
      return;
    }

    if (password !== ADMIN_PASSWORD) {
      res.status(401).json({ error: 'Invalid password' });
      return;
    }

    const token = jwt.sign({ role: 'admin', admin: true }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, role: 'admin' });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Country login: verifies the country's password and returns a country-scoped token.
// The country is resolved by name (or by its relational table id). Names are stable
// across the GameState blob and the Country table, so this works regardless of how
// the two id namespaces differ.
router.post('/country-login', async (req, res) => {
  try {
    const { countryId, countryName, password } = req.body;
    if (typeof password !== 'string' || !password) {
      res.status(400).json({ error: 'Country and password required' });
      return;
    }

    let country = null;

    if (countryName) {
      country = await prisma.country.findFirst({ where: { name: countryName.trim() } });
    } else if (countryId) {
      country = await prisma.country.findUnique({ where: { id: countryId } });
      // The GameState blob may use different ids. Fall back to matching the blob
      // country by id -> name -> Country table by name.
      if (!country) {
        try {
          const gs = await prisma.gameState.findUnique({ where: { id: 'default' } });
          if (gs) {
            const parsed = JSON.parse(gs.data || '{}');
            const blobCountry = parsed.countries ? parsed.countries[countryId] : null;
            if (blobCountry && blobCountry.name) {
              country = await prisma.country.findFirst({ where: { name: blobCountry.name } });
            }
          }
        } catch (e) {
          console.error('Error resolving country by blob id:', e);
        }
      }
    }

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

    const token = jwt.sign(
      { role: 'country', countryId: country.id, countryName: country.name },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    res.json({ token, role: 'country', countryId: country.id, countryName: country.name });
  } catch (error) {
    console.error('Country login error:', error);
    res.status(500).json({ error: 'Country login failed' });
  }
});

router.get('/verify', (req, res) => {
  const token = getToken(req);
  if (!token) {
    res.json({ valid: false });
    return;
  }

  const payload = verifyToken(token);
  if (!payload) {
    res.json({ valid: false });
    return;
  }

  if (payload.role === 'country' && payload.countryId) {
    res.json({ valid: true, role: 'country', countryId: payload.countryId });
    return;
  }

  if (payload.role === 'admin' || payload.admin === true) {
    res.json({ valid: true, role: 'admin' });
    return;
  }

  res.json({ valid: false });
});

router.get('/admin', requireAdmin, (_req, res) => {
  res.json({ valid: true, role: 'admin' });
});

export default router;
