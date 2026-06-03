'use client';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Send, Sparkles, MessageCircle } from 'lucide-react';

interface AIPanelProps {
  userId: string;
}

export function AIPanel({ userId }: AIPanelProps) {
  const [query, setQuery] = useState('');
  const [conversation, setConversation] = useState<Array<{ role: 'user' | 'ai'; content: string }>>([]);
  const [loading, setLoading] = useState(false);

  const suggestedQueries = [
    'How much did I spend on food this month?',
    'Am I overspending on entertainment?',
    'What is my savings rate?',
    'Compare my spending this month vs last month',
    'What are my top 3 expenses?',
  ];

  const handleQuery = async (queryText?: string) => {
    const finalQuery = queryText || query;
    if (!finalQuery.trim()) return;

    setConversation([...conversation, { role: 'user', content: finalQuery }]);
    setQuery('');
    setLoading(true);

    try {
      const response = await fetch('/api/ai/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, query: finalQuery }),
      });
      const data = await response.json();
      setConversation((prev) => [...prev, { role: 'ai', content: data.answer }]);
    } catch (error) {
      console.error('Error querying AI:', error);
    }
    setLoading(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Ask About Your Finances
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Conversation */}
        {conversation.length > 0 && (
          <div className="space-y-4 mb-4 max-h-96 overflow-y-auto">
            {conversation.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Suggested Queries */}
        <div className="flex flex-wrap gap-2">
          {suggestedQueries.map((q, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              onClick={() => handleQuery(q)}
              disabled={loading}
            >
              <Sparkles className="h-3 w-3 mr-1" />
              {q}
            </Button>
          ))}
        </div>

        {/* Query Input */}
        <div className="flex gap-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask anything about your finances..."
            onKeyPress={(e) => e.key === 'Enter' && handleQuery()}
            disabled={loading}
          />
          <Button onClick={() => handleQuery()} disabled={loading || !query.trim()}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
