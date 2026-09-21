'use client';

import { useEffect, useState } from 'react';

const wmoCodes: Record<number, string> = {
  0: '☀️', 1: '🌤️', 2: '⛅️', 3: '☁️',
  45: '🌫️', 48: '🌫️', 
  51: '🌧️', 53: '🌧️', 55: '🌧️',
  61: '🌧️', 63: '🌧️', 65: '🌧️',
  71: '❄️', 73: '❄️', 75: '❄️',
  95: '⛈️', 96: '⛈️', 99: '⛈️'
};

export default function WeatherWidget() {
  const [weather, setWeather] = useState<{ text: string; error: boolean; loading: boolean }>({
    text: '',
    error: false,
    loading: true,
  });

  useEffect(() => {
    async function fetchWeather() {
      try {
        const ipRes = await fetch('https://ipwho.is/');
        if (!ipRes.ok) throw new Error('IP API failed');
        const location = await ipRes.json();
        
        if (!location.success || !location.latitude || !location.longitude || !location.city) {
          throw new Error('Invalid location data');
        }

        const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code`);
        if (!weatherRes.ok) throw new Error('Weather API failed');
        const weatherData = await weatherRes.json();
        
        if (!weatherData.current) {
          throw new Error('Invalid weather data');
        }

        const temp = Math.round(weatherData.current.temperature_2m);
        const wind = Math.round(weatherData.current.wind_speed_10m);
        const humidity = Math.round(weatherData.current.relative_humidity_2m);
        const code = weatherData.current.weather_code;
        const icon = wmoCodes[code] || '🌡️';
        
        // Hindi labels: 💨 हवा (Wind), 💧 नमी (Humidity)
        setWeather({ 
          text: `${location.city}: ${icon} ${temp}°C • 💨 ${wind} km/h • 💧 ${humidity}%`, 
          error: false, 
          loading: false 
        });
      } catch (err) {
        setWeather({ text: '', error: true, loading: false });
      }
    }

    fetchWeather();
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
      gap: '6px',
      background: '#f4f5f7',
      padding: '4px 9px',
      borderRadius: '6px',
      border: '1px solid #e1e5ea',
      whiteSpace: 'nowrap',
      boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)'
    }} title="आपका स्थानीय मौसम">
      {weather.text}
    </div>
  );
}
