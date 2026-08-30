'use client';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Loader2, 
  Send, 
  Sparkles, 
  MessageCircle, 
  X, 
  Maximize2, 
  Minimize2,
  Mic,
  Copy,
  Check
} from 'lucide-react';
import { fadeIn, fadeInUp, scaleInBounce, cardHover, staggerContainerFast } from '@/lib/animations';

interface Message {
  role: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

interface AIChatEnhancedProps {
  userId: string;
}

export function AIChatEnhanced({ userId }: AIChatEnhancedProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [query, setQuery] = useState('');
  const [conversation, setConversation] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestedQueries = [
    '💰 How much did I spend on food this month?',
    '📊 Am I overspending on entertainment?',
    '🎯 What is my savings rate?',
    '📈 Compare my spending this month vs last month',
    '🏆 What are my top 3 expenses?',
    '💡 Give me money-saving tips',
  ];

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversation, isOpen]);

  const handleQuery = async (queryText?: string) => {
    const finalQuery = queryText || query;
    if (!finalQuery.trim()) return;

    const userMessage: Message = {
      role: 'user',
      content: finalQuery.replace(/^[💰📊🎯📈🏆💡]\s*/, ''),
      timestamp: new Date()
    };
    
    setConversation([...conversation, userMessage]);
    setQuery('');
    setLoading(true);

    try {
      const response = await fetch('/api/ai/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, query: userMessage.content }),
      });
      const data = await response.json();
      
      const aiMessage: Message = {
        role: 'ai',
        content: data.answer,
        timestamp: new Date()
      };
      
      setConversation((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error querying AI:', error);
      const errorMessage: Message = {
        role: 'ai',
        content: '😕 Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      };
      setConversation((prev) => [...prev, errorMessage]);
    }
    setLoading(false);
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Floating Action Button
  if (!isOpen) {
    return (
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        className="fixed bottom-6 right-6 z-50"
      >
        <Button
          onClick={() => setIsOpen(true)}
          className="h-14 w-14 rounded-full shadow-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          size="icon"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      </motion.div>
    );
  }

  // Chat Interface
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ 
          opacity: 1, 
          y: 0,
          width: isFullscreen ? '100%' : 'min(400px, 90vw)',
          height: isFullscreen ? '100vh' : 'min(600px, 80vh)'
        }}
        exit={{ opacity: 0, y: 100, transition: { duration: 0.2 } }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className={`fixed bottom-6 right-6 z-50 ${
          isFullscreen 
            ? 'bottom-0 right-0 left-0 top-0 w-full h-full rounded-none' 
            : 'rounded-2xl'
        }`}
      >
        <Card className={`h-full flex flex-col shadow-2xl border-2 ${
          isFullscreen ? '' : 'rounded-2xl'
        }`}>
          {/* Header */}
          <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-t-2xl">
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >
                <Sparkles className="h-6 w-6" />
              </motion.div>
              <div>
                <CardTitle className="text-lg font-semibold">SmartSpend AI</CardTitle>
                <p className="text-xs text-blue-100">Your personal finance assistant</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white hover:bg-white/20"
                onClick={() => setIsFullscreen(!isFullscreen)}
              >
                {isFullscreen ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white hover:bg-white/20"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          {/* Messages */}
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900">
            {conversation.length === 0 && (
              <motion.div
                variants={staggerContainerFast}
                initial="hidden"
                animate="visible"
                className="space-y-4 py-8"
              >
                <div className="text-center py-8">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                    className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center"
                  >
                    <MessageCircle className="h-8 w-8 text-white" />
                  </motion.div>
                  <h3 className="text-lg font-semibold mb-2">Hi! I&apos;m your AI finance assistant</h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    Ask me anything about your spending, budgets, or savings!
                  </p>
                </div>
                
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground text-center">Try asking:</p>
                  {suggestedQueries.map((q, index) => (
                    <motion.div
                      key={index}
                      variants={fadeInUp}
                      custom={index}
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start text-left h-auto py-3 px-4 whitespace-normal"
                        onClick={() => handleQuery(q)}
                        disabled={loading}
                      >
                        <Sparkles className="h-3 w-3 mr-2 text-blue-600" />
                        <span className="text-sm">{q}</span>
                      </Button>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            <AnimatePresence>
              {conversation.map((msg, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] group relative ${
                    msg.role === 'user' 
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white' 
                      : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
                  } rounded-2xl px-4 py-3 shadow-md`}>
                    <p className="text-sm whitespace-pre-wrap pr-8">{msg.content}</p>
                    <div className={`text-xs mt-2 ${
                      msg.role === 'user' ? 'text-blue-100' : 'text-muted-foreground'
                    }`}>
                      {formatTime(msg.timestamp)}
                    </div>
                    
                    {/* Copy button for AI messages */}
                    {msg.role === 'ai' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => copyToClipboard(msg.content, index)}
                      >
                        {copiedIndex === index ? (
                          <Check className="h-3 w-3 text-green-600" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                <div className="bg-white dark:bg-gray-800 rounded-2xl px-4 py-3 shadow-md border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                    <span className="text-sm text-muted-foreground">Thinking...</span>
                  </div>
                </div>
              </motion.div>
            )}
            
            <div ref={messagesEndRef} />
          </CardContent>

          {/* Input Area */}
          <div className="p-4 bg-white dark:bg-gray-800 border-t rounded-b-2xl">
            <div className="flex gap-2">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask anything about your finances..."
                onKeyPress={(e) => e.key === 'Enter' && handleQuery()}
                disabled={loading}
                className="flex-1"
              />
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  onClick={() => handleQuery()} 
                  disabled={loading || !query.trim()}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </motion.div>
            </div>
            
            {/* Voice input placeholder (future feature) */}
            <div className="mt-2 flex justify-center">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground"
                disabled
                title="Voice input coming soon"
              >
                <Mic className="h-3 w-3 mr-1" />
                Voice input (coming soon)
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
