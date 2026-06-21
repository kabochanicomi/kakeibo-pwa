import { getAllFixedTemplates, getTransactionsByMonth, bulkAddTransactions } from '../db';

export async function generateFixedExpensesForMonth(year, month) {
  const mm = String(month).padStart(2, '0');
  const firstDay = `${year}-${mm}-01`;
  const lastDayNum = new Date(year, month, 0).getDate();
  const lastDay = `${year}-${mm}-${String(lastDayNum).padStart(2, '0')}`;

  const templates = await getAllFixedTemplates();
  const active = templates.filter(
    (t) => t.start_date <= lastDay && t.end_date >= firstDay
  );
  if (active.length === 0) return 0;

  const existing = await getTransactionsByMonth(year, month);
  const generatedIds = new Set(
    existing.filter((t) => t.fixed_template_id).map((t) => t.fixed_template_id)
  );

  const toGenerate = active.filter((t) => !generatedIds.has(t.uuid));
  if (toGenerate.length === 0) return 0;

  const records = toGenerate.map((t) => {
    const day = Math.min(t.day, lastDayNum);
    return {
      date: `${year}-${mm}-${String(day).padStart(2, '0')}`,
      type: t.type,
      expense_type: t.expense_type,
      category: t.category,
      category_label: t.category_label,
      group_label: t.group_label,
      amount: t.amount,
      payment_method: t.payment_method ?? null,
      store_name: t.name,
      memo: t.memo ?? '',
      fixed_template_id: t.uuid,
    };
  });

  await bulkAddTransactions(records);
  return records.length;
}
