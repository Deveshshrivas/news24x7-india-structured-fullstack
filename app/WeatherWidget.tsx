'use client';

import { useEffect, useState } from 'react';

export default function WeatherWidget() {
  const [weather, setWeather] = useState<{ text: string; error: boolean; loading: boolean }>({
    text: '',
    error: false,
    loading: true,
  });

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    fetch('https://wttr.in/?format=%l:+%c+%t', { signal: controller.signal })
      .then((res) => {
        clearTimeout(timeoutId);
        if (!res.ok) throw new Error('Failed to fetch weather');
        return res.text();
      })
      .then((text) => {
        if (text.includes('Unknown') || text.includes('ERROR') || text.trim().startsWith('<')) throw new Error('Invalid response');
        setWeather({ text: text.trim(), error: false, loading: false });
      })
      .catch(() => {
        setWeather({ text: '', error: true, loading: false });
      });

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, []);

  if (weather.loading) {
    return <div style={{ fontSize: '11px', color: '#888', padding: '4px 8px', height: '24px' }}>मौसम...</div>;
  }

  if (weather.error || !weather.text) {
    return null;
  }

  return (
    <div style={{
      fontSize: '11px',
      color: '#656d7a',
      fontWeight: 'bold',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      background: '#f4f5f7',
      padding: '4px 8px',
      borderRadius: '6px',
      border: '1px solid #e1e5ea',
      whiteSpace: 'nowrap',
      boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)'
    }} title="आपका स्थानीय मौसम">
      {weather.text}
    </div>
  );
}
