'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useTransactions } from '@/hooks/use-transactions';
import { TransactionList } from '@/components/transaction-list';
import { TransactionForm } from '@/components/transaction-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Download, Upload, Filter, X, CheckCircle, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function TransactionsPage() {
  const [user, setUser] = useState<any>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [importStatus, setImportStatus] = useState<{type: 'success' | 'error'; message: string} | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [filters, setFilters] = useState({
    type: 'all',
    category: '',
    search: '',
    dateFrom: '',
    dateTo: '',
  });
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.push('/login');
      else setUser(user);
    });
  }, []);

  const { transactions, loading, addTransaction, updateTransaction, deleteTransaction, refresh } = useTransactions(
    user?.id || ''
  );

  if (!user) return null;

  const filteredTransactions = transactions.filter((t) => {
    if (filters.type !== 'all' && t.type !== filters.type) return false;
    if (filters.category && t.categories?.name !== filters.category) return false;
    if (filters.search && !t.description?.toLowerCase().includes(filters.search.toLowerCase())) return false;
    if (filters.dateFrom && t.date < filters.dateFrom) return false;
    if (filters.dateTo && t.date > filters.dateTo) return false;
    return true;
  });

  const handleExportCSV = () => {
    window.open(`/api/export?user_id=${user.id}`, '_blank');
  };

  const handleExportPDF = () => {
    window.open(`/api/export/pdf?user_id=${user.id}&format=pdf`, '_blank');
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportStatus(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/import', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        setImportStatus({
          type: 'success',
          message: result.message || `Imported ${result.imported} transactions!`,
        });
        refresh();
      } else {
        setImportStatus({
          type: 'error',
          message: result.error || 'Import failed',
        });
      }
    } catch (error) {
      setImportStatus({
        type: 'error',
        message: 'Failed to import file. Check the format.',
      });
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const clearFilters = () => {
    setFilters({ type: 'all', category: '', search: '', dateFrom: '', dateTo: '' });
  };

  const hasActiveFilters = filters.type !== 'all' || filters.category || filters.search || filters.dateFrom || filters.dateTo;

  return (
    <main className="container mx-auto p-4 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Transactions</h1>
        <div className="flex gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".csv,.xlsx,.xls"
            className="hidden"
          />
          <Button variant="outline" onClick={handleImportClick} disabled={isImporting}>
            <Upload className="mr-2 h-4 w-4" />
            {isImporting ? 'Importing...' : 'Import CSV'}
          </Button>
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
          <Button variant="outline" onClick={handleExportPDF}>
            <Download className="mr-2 h-4 w-4" /> Export PDF
          </Button>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Add Transaction
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add Transaction</DialogTitle>
              </DialogHeader>
              <TransactionForm
                userId={user.id}
                onSubmit={async (data) => {
                  await addTransaction(data);
                  setIsAddOpen(false);
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Import Status */}
      {importStatus && (
        <div className={`mb-4 p-4 rounded-lg flex items-center gap-2 ${
          importStatus.type === 'success' ? 'bg-green-50 dark:bg-green-950 text-green-800 dark:text-green-200' : 'bg-red-50 dark:bg-red-950 text-red-800 dark:text-red-200'
        }`}>
          {importStatus.type === 'success' ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
          <span className="text-sm">{importStatus.message}</span>
          <button onClick={() => setImportStatus(null)} className="ml-auto">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-card rounded-lg p-4 mb-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium flex items-center gap-2">
            <Filter className="h-4 w-4" /> Filters
          </h3>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="mr-2 h-4 w-4" /> Clear
            </Button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Select value={filters.type} onValueChange={(value: string) => setFilters({ ...filters, type: value })}>
            <SelectTrigger>
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="income">Income</SelectItem>
              <SelectItem value="expense">Expense</SelectItem>
            </SelectContent>
          </Select>
          <Input
            placeholder="Search description..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
          <Input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
            placeholder="From date"
          />
          <Input
            type="date"
            value={filters.dateTo}
            onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
            placeholder="To date"
          />
        </div>
        {hasActiveFilters && (
          <div className="flex gap-2">
            {filters.type !== 'all' && <Badge variant="secondary">{filters.type}</Badge>}
            {filters.search && <Badge variant="secondary">Search: {filters.search}</Badge>}
            {filters.dateFrom && <Badge variant="secondary">From: {filters.dateFrom}</Badge>}
            {filters.dateTo && <Badge variant="secondary">To: {filters.dateTo}</Badge>}
          </div>
        )}
      </div>

      <TransactionList
        transactions={filteredTransactions}
        loading={loading}
        onUpdate={updateTransaction}
        onDelete={deleteTransaction}
        showAll
      />
    </main>
  );
}
