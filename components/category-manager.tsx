'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useCategories } from '@/hooks/use-categories';
import { Plus, Pencil, Trash2 } from 'lucide-react';

interface CategoryManagerProps {
  userId: string;
}

export function CategoryManager({ userId }: CategoryManagerProps) {
  const { categories, addCategory, updateCategory, deleteCategory } = useCategories(userId);
  const [isOpen, setIsOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('tag');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCategory) {
      await updateCategory(editingCategory.id, { name, icon });
    } else {
      await addCategory({ user_id: userId, name, icon });
    }
    setName('');
    setIcon('tag');
    setEditingCategory(null);
    setIsOpen(false);
  };

  const openEdit = (category: any) => {
    setEditingCategory(category);
    setName(category.name);
    setIcon(category.icon);
    setIsOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Categories</h3>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" /> Add Category
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
                <Label htmlFor="catIcon">Icon (emoji or icon name)</Label>
                <Input
                  id="catIcon"
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  placeholder="shopping-bag"
                />
              </div>
              <Button type="submit" className="w-full">
                {editingCategory ? 'Update' : 'Add'} Category
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2">
        {categories.map((category) => (
          <div key={category.id} className="flex items-center justify-between p-3 bg-secondary/20 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-lg">{category.icon === 'tag' ? '🏷️' : '📁'}</span>
              <span>{category.name}</span>
              {category.is_default && (
                <span className="text-xs text-muted-foreground">(default)</span>
              )}
            </div>
            {!category.is_default && (
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={() => openEdit(category)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-red-500 hover:text-red-600"
                  onClick={() => deleteCategory(category.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
