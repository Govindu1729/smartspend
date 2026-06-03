'use client';
import { useState, useEffect, useCallback } from 'react';
import type { Category } from '@/types';

export function useCategories(userId: string) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCategories = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/categories?user_id=${userId}`);
      const data = await response.json();
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const addCategory = async (categoryData: Omit<Category, 'id'>) => {
    const response = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(categoryData),
    });
    const data = await response.json();
    if (!data.error) {
      setCategories([...categories, data]);
    }
    return data;
  };

  const updateCategory = async (id: string, updates: Partial<Category>) => {
    const response = await fetch('/api/categories', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates }),
    });
    const data = await response.json();
    if (!data.error) {
      setCategories(categories.map((c) => (c.id === id ? data : c)));
    }
  };

  const deleteCategory = async (id: string) => {
    await fetch(`/api/categories?id=${id}`, { method: 'DELETE' });
    setCategories(categories.filter((c) => c.id !== id));
  };

  return { categories, loading, addCategory, updateCategory, deleteCategory, refresh: fetchCategories };
}
