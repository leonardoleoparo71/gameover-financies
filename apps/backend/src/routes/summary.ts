import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

// GET /summary — rules-based smart insights
router.get('/', async (req: AuthRequest, res: Response) => {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);

  const [transactions, purchases, goals, prevSnapshot, user] = await Promise.all([
    prisma.transaction.findMany({ where: { userId: req.userId!, date: { gte: start, lt: end } } }),
    prisma.futurePurchase.findMany({ where: { userId: req.userId! } }),
    prisma.goal.findMany({ where: { userId: req.userId! } }),
    prisma.monthlySnapshot.findFirst({
      where: { userId: req.userId!, OR: [{ month: month - 1, year }, { month: 12, year: year - 1 }] },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    }),
    prisma.user.findUnique({ where: { id: req.userId! }, select: { salary: true } }),
  ]);

  const transactionsIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalIncome = transactionsIncome + (user?.salary || 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const totalPurchasesCost = purchases.reduce((s, p) => s + p.value, 0);
  const saved = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? (saved / totalIncome) * 100 : 0;
  const spendRate = totalIncome > 0 ? (totalExpense / totalIncome) * 100 : 0;

  const leisureExpense = transactions
    .filter(t => t.type === 'expense' && t.category === 'leisure')
    .reduce((s, t) => s + t.amount, 0);

  const insights: string[] = [];

  // No data this month
  if (transactions.length === 0) {
    insights.push('Você ainda não registrou nenhuma transação nesse mês.');
  }

  // Savings rate
  if (totalIncome > 0) {
    if (savingsRate < 10) {
      insights.push(`⚠️ Você está guardando apenas ${savingsRate.toFixed(1)}% da sua renda. Tente chegar a pelo menos 20%.`);
    } else if (savingsRate >= 30) {
      insights.push(`🌟 Excelente! Você está guardando ${savingsRate.toFixed(1)}% da sua renda este mês.`);
    } else {
      insights.push(`Você está guardando ${savingsRate.toFixed(1)}% da sua renda este mês.`);
    }
  }

  // Leisure spending comparison
  if (prevSnapshot && leisureExpense > 0) {
    const prevLeisure = prevSnapshot.totalExpense * 0.2; // rough estimate if not tracked separately
    if (leisureExpense > prevLeisure * 1.2) {
      insights.push(`📈 Seu gasto com lazer aumentou em relação ao mês anterior.`);
    }
  }

  // Impact of future purchases on savings
  if (purchases.length > 0 && totalIncome > 0) {
    const impact = (totalPurchasesCost / totalIncome) * 100;
    insights.push(`🛒 Suas compras futuras planejadas representam ${impact.toFixed(1)}% da sua renda mensal.`);
  }

  // Goals progress
  for (const goal of goals) {
    if (saved > 0) {
      const progress = Math.min((saved / goal.targetValue) * 100, 100);
      if (progress < 25 && goal.targetValue > 0) {
        insights.push(`🎯 Meta "${goal.name}": você atingiu ${progress.toFixed(0)}% do valor necessário com o que sobrou este mês.`);
      }
    }
  }

  // Specific purchase insight
  if (purchases.length > 0 && goals.length > 0) {
    const biggestPurchase = purchases.reduce((a, b) => a.value > b.value ? a : b);
    const firstGoal = goals[0];
    if (firstGoal.targetValue > 0) {
      const pct = (biggestPurchase.value / firstGoal.targetValue) * 100;
      insights.push(`💡 "${biggestPurchase.name}" impacta sua meta "${firstGoal.name}" em ${pct.toFixed(1)}%.`);
    }
  }

  res.json({
    month,
    year,
    totalIncome,
    totalExpense,
    saved,
    savingsRate: parseFloat(savingsRate.toFixed(2)),
    spendRate: parseFloat(spendRate.toFixed(2)),
    totalPurchasesCost,
    insights,
  });
});

export default router;
