'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useCategories } from '@/hooks/use-categories';
import { Plus, Pencil, Trash2, Palette, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

interface CategoryManagerProps {
  userId: string;
}

const CATEGORY_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e',
  '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6',
  '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899',
  '#f43f5e', '#64748b', '#0f172a',
];

const CATEGORY_ICONS = [
  { value: '🍔', label: 'Food' },
  { value: '🚗', label: 'Transport' },
  { value: '🏠', label: 'Housing' },
  { value: '💡', label: 'Utilities' },
  { value: '🎬', label: 'Entertainment' },
  { value: '🛍️', label: 'Shopping' },
  { value: '💊', label: 'Healthcare' },
  { value: '📚', label: 'Education' },
  { value: '✈️', label: 'Travel' },
  { value: '💰', label: 'Income' },
  { value: '🎯', label: 'Savings' },
  { value: '📱', label: 'Technology' },
  { value: '👕', label: 'Clothing' },
  { value: '🏋️', label: 'Fitness' },
  { value: '🎁', label: 'Gifts' },
  { value: '📝', label: 'Other' },
];

export function CategoryManager({ userId }: CategoryManagerProps) {
  const { categories, addCategory, updateCategory, deleteCategory } = useCategories(userId);
  const [isOpen, setIsOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('🏷️');
  const [color, setColor] = useState('#3b82f6');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCategory) {
      await updateCategory(editingCategory.id, { name, icon, color });
    } else {
      await addCategory({ user_id: userId, name, icon, color, is_default: false });
    }
    setName('');
    setIcon('🏷️');
    setColor('#3b82f6');
    setEditingCategory(null);
    setIsOpen(false);
  };

  const openEdit = (category: any) => {
    setEditingCategory(category);
    setName(category.name);
    setIcon(category.icon || '🏷️');
    setColor(category.color || '#3b82f6');
    setIsOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Categories
        </h3>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" /> Add Category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingCategory ? 'Edit' : 'Add'} Category</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="catName">Category Name</Label>
                <Input
                  id="catName"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Subscriptions"
                  required
                />
              </div>
              
              <div>
                <Label>Choose an Icon</Label>
                <div className="grid grid-cols-8 gap-2 mt-2">
                  {CATEGORY_ICONS.map((item) => (
                    <motion.button
                      key={item.value}
                      type="button"
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setIcon(item.value)}
                      className={`p-2 text-2xl rounded-lg border-2 transition-colors ${
                        icon === item.value
                          ? 'border-primary bg-primary/10'
                          : 'border-transparent hover:bg-secondary'
                      }`}
                      title={item.label}
                    >
                      {item.value}
                    </motion.button>
                  ))}
                </div>
              </div>

              <div>
                <Label>Choose a Color</Label>
                <div className="grid grid-cols-9 gap-2 mt-2">
                  {CATEGORY_COLORS.map((c) => (
                    <motion.button
                      key={c}
                      type="button"
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setColor(c)}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        color === c ? 'border-primary scale-110 shadow-lg' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-secondary/20 rounded-lg">
                <span className="text-3xl">{icon}</span>
                <div 
                  className="w-8 h-8 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <span className="font-medium">{name || 'Category Name'}</span>
              </div>

              <Button type="submit" className="w-full">
                {editingCategory ? 'Update' : 'Add'} Category
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-2">
        <AnimatePresence>
          {categories.map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="overflow-hidden">
                <CardContent className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
                      style={{ backgroundColor: `${category.color}20`, color: category.color }}
                    >
                      {category.icon || '🏷️'}
                    </div>
                    <div>
                      <p className="font-medium">{category.name}</p>
                      {category.is_default && (
                        <Badge variant="secondary" className="text-xs">
                          default
                        </Badge>
                      )}
                    </div>
                  </div>
                  {!category.is_default && (
                    <div className="flex gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => openEdit(category)}
                        className="hover:bg-primary/10 hover:text-primary"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                        onClick={() => deleteCategory(category.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
