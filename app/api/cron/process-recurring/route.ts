import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { format, addDays, addWeeks, addMonths, addYears, isBefore } from 'date-fns';

/**
 * POST /api/cron/process-recurring
 *
 * Scans `transactions` for rows where `is_recurring = true` and creates
 * new transaction instances whose next occurrence is due today (or earlier).
 * Idempotent: uses a `last_recurred_at` column to track progress.
 *
 * Auth: expects a `CRON_SECRET` env var matching `Authorization: Bearer <secret>`.
 * Set up via Vercel Cron — in vercel.json:
 *   { "crons": [{ "path": "/api/cron/process-recurring", "schedule": "0 9 * * *" }] }
 *
 * Schema (add this column once before deploying):
 *   ALTER TABLE transactions ADD COLUMN IF NOT EXISTS last_recurred_at date;
 */

type Interval = 'daily' | 'weekly' | 'monthly' | 'yearly';

function nextOccurrence(lastDate: Date, interval: Interval, n: number = 1): Date {
  switch (interval) {
    case 'daily': return addDays(lastDate, n);
    case 'weekly': return addWeeks(lastDate, n);
    case 'monthly': return addMonths(lastDate, n);
    case 'yearly': return addYears(lastDate, n);
  }
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json(
      { error: 'CRON_SECRET env var not configured' },
      { status: 500 }
    );
  }
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = getSupabaseAdmin();
  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');

  const { data: recurring, error: fetchErr } = await admin
    .from('transactions')
    .select('*')
    .eq('is_recurring', true)
    .not('recurring_interval', 'is', null);

  if (fetchErr) {
    return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  }

  if (!recurring || recurring.length === 0) {
    return NextResponse.json({
      processed: 0,
      created: 0,
      message: 'No recurring transactions to process.',
    });
  }

  let totalCreated = 0;
  const errors: string[] = [];
  const MAX_BACKFILL = 5;

  for (const parent of recurring) {
    try {
      const interval = parent.recurring_interval as Interval;
      const lastRecurred = parent.last_recurred_at
        ? new Date(parent.last_recurred_at)
        : new Date(parent.date);

      let cursor = lastRecurred;
      const newInstances: Array<Record<string, unknown>> = [];
      let safety = 0;

      while (safety < MAX_BACKFILL) {
        const next = nextOccurrence(cursor, interval, 1);
        if (isBefore(next, today) || format(next, 'yyyy-MM-dd') === todayStr) {
          newInstances.push({
            user_id: parent.user_id,
            amount: parent.amount,
            type: parent.type,
            category_id: parent.category_id,
            description: parent.description
              ? `${parent.description} (recurring)`
              : '(recurring)',
            date: format(next, 'yyyy-MM-dd'),
            is_recurring: false,
            recurring_interval: null,
          });
          cursor = next;
          safety++;
        } else {
          break;
        }
      }

      if (newInstances.length === 0) continue;

      const { error: insertErr } = await admin
        .from('transactions')
        .insert(newInstances);

      if (insertErr) {
        errors.push(`Failed to insert for parent ${parent.id}: ${insertErr.message}`);
        continue;
      }

      const lastNewDate = format(cursor, 'yyyy-MM-dd');
      const { error: updateErr } = await admin
        .from('transactions')
        .update({ last_recurred_at: lastNewDate })
        .eq('id', parent.id);

      if (updateErr) {
        errors.push(`Failed to update parent ${parent.id}: ${updateErr.message}`);
      }

      totalCreated += newInstances.length;
    } catch (err) {
      errors.push(`Unexpected error for parent ${parent.id}: ${String(err)}`);
    }
  }

  return NextResponse.json({
    processed: recurring.length,
    created: totalCreated,
    date: todayStr,
    errors: errors.length > 0 ? errors : undefined,
  });
}
