'use client';

import { useEffect, useState } from 'react';

export function Greeting({ name }: { name?: string }) {
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    const user = name ? `, ${name}` : '';

    if (hour < 5) setGreeting(`Late night${user}. Markets never sleep.`);
    else if (hour < 12) setGreeting(`Morning${user}. Ready to build?`);
    else if (hour < 17) setGreeting(`Afternoon${user}. Here's your snapshot.`);
    else if (hour < 21) setGreeting(`Evening${user}. Stay on track.`);
    else setGreeting(`Night${user}. Today's spending, summarized.`);
  }, [name]);

  return <span>{greeting}</span>;
}