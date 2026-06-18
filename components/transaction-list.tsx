'use client';
import { useState } from 'react';
import { useTransactions } from '@/hooks/use-transactions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { TransactionForm } from './transaction-form';
import { format } from 'date-fns';
import { Pencil, Trash2, ArrowUpRight, ArrowDownRight, Repeat } from 'lucide-react';

interface TransactionListProps {
  transactions?: any[];
  loading?: boolean;
  onUpdate?: (id: string, updates: any) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  showAll?: boolean;
  userId?: string;
  limit?: number;
}

export function TransactionList({ transactions: propTransactions, loading: propLoading, onUpdate: propOnUpdate, onDelete: propOnDelete, showAll, userId, limit }: TransactionListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // If a userId is provided, fetch transactions using the hook (dashboard use-case)
  const txHook = userId ? useTransactions(userId, limit) : null;
  const transactions = propTransactions ?? txHook?.transactions ?? [];
  const loading = propLoading ?? txHook?.loading ?? false;
  const onUpdate = propOnUpdate ?? txHook?.updateTransaction ?? (async () => {});
  const onDelete = propOnDelete ?? txHook?.deleteTransaction ?? (async () => {});

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading transactions...
        </CardContent>
      </Card>
    );
  }

  if (transactions.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <div class="flex flex-col items-center gap-3 py-4"><div class="p-3 rounded-full bg-primary/10"><svg class="h-8 w-8 text-primary/50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg></div><p class="text-muted-foreground">No transactions yet</p><a href="/transactions"><button class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2">Add Your First Transaction</button></a></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {transactions.map((transaction) => (
            <div
              key={transaction.id}
              className="flex items-center justify-between p-4 bg-secondary/20 rounded-lg hover:bg-secondary/40 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-full ${
                    transaction.type === 'income' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                  }`}
                >
                  {transaction.type === 'income' ? (
                    <ArrowUpRight className="h-4 w-4" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4" />
                  )}
                </div>
                <div>
                  <p className="font-medium">{transaction.description || 'Untitled'}</p>
                  <div className="flex gap-2 items-center">
                    <Badge variant="outline" className="text-xs">
                      {transaction.categories?.name || 'Uncategorized'}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(transaction.date), 'MMM dd, yyyy')}
                    </span>
                    {transaction.is_recurring && (
                      <Repeat className="h-3 w-3 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span
                  className={`font-semibold ${
                    transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {transaction.type === 'income' ? '+' : '-'}₹{transaction.amount.toLocaleString()}
                </span>
                <div className="flex gap-2">
                  <Dialog open={editingId === transaction.id} onOpenChange={() => setEditingId(null)}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={() => setEditingId(transaction.id)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit Transaction</DialogTitle>
                      </DialogHeader>
                      <TransactionForm
                        userId={transaction.user_id}
                        initialData={transaction}
                        onSubmit={async (data) => {
                          await onUpdate(transaction.id, data);
                          setEditingId(null);
                        }}
                      />
                    </DialogContent>
                  </Dialog>
                  <Dialog open={deletingId === transaction.id} onOpenChange={() => setDeletingId(null)}>
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-600"
                        onClick={() => setDeletingId(transaction.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Delete Transaction</DialogTitle>
                      </DialogHeader>
                      <p>Are you sure you want to delete this transaction?</p>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setDeletingId(null)}>
                          Cancel
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={async () => {
                            await onDelete(transaction.id);
                            setDeletingId(null);
                          }}
                        >
                          Delete
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
