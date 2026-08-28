import { Router } from 'express';
import prisma from '../prisma';
import { requireAdmin } from '../middleware/auth';

const router = Router();

// GET - List all expenses
router.get('/', async (_req, res) => {
  try {
    const expenses = await prisma.expense.findMany();

    res.json(expenses);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

// POST - Create expense
router.post('/', requireAdmin, async (req, res) => {
  try {
    const expenseData = req.body;

    // Create expense
    const expense = await prisma.expense.create({
      data: expenseData,
    });

    // Deduct money from country
    if (expenseData.countryId && expenseData.amount) {
      await prisma.country.update({
        where: { id: expenseData.countryId },
        data: {
          money: {
            decrement: expenseData.amount,
          },
        },
      });
    }

    res.status(201).json(expense);
  } catch (error) {
    console.error('Error creating expense:', error);
    res.status(500).json({ error: 'Failed to create expense' });
  }
});

// DELETE /:id - Delete expense
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const expense = await prisma.expense.findUnique({ where: { id } });
    if (!expense) {
      res.status(404).json({ error: 'Expense not found' });
      return;
    }

    // Restore money to country
    if (expense.countryId && expense.amount) {
      await prisma.country.update({
        where: { id: expense.countryId },
        data: {
          money: {
            increment: expense.amount,
          },
        },
      });
    }

    await prisma.expense.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting expense:', error);
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});

export default router;