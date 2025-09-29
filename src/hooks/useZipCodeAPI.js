import { useState, useCallback } from 'react';

// Option 1: Zippopotam.us - Free, no API key needed
export const useZipCodeAPI = () => {
  const [loading, setLoading] = useState(false);

  const searchZipCode = useCallback(async (query) => {
    if (!query || query.length < 3) return [];
    
    setLoading(true);
    try {
      // If it looks like a zip code (all numbers), search by zip
      if (/^\d+$/.test(query)) {
        const response = await fetch(`https://api.zippopotam.us/us/${query}`);
        if (response.ok) {
          const data = await response.json();
          return [{
            zip: data['post code'],
            city: data.places[0]['place name'],
            state: data.places[0]['state abbreviation'],
            latitude: data.places[0].latitude,
            longitude: data.places[0].longitude
          }];
        }
      }
      return [];
    } catch (error) {
      console.error('Zip code API error:', error);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return { searchZipCode, loading };
};

// Option 2: ZIP Code API from RapidAPI (requires free API key)
export const useZipCodeAPIWithKey = () => {
  const [loading, setLoading] = useState(false);
  
  // You'll need to sign up at https://rapidapi.com/redline/api/redline-zipcode
  // and get a free API key
  const API_KEY = import.meta.env.VITE_RAPIDAPI_KEY || '';

  const searchZipCode = useCallback(async (query) => {
    if (!query || query.length < 3 || !API_KEY) return [];
    
    setLoading(true);
    try {
      const response = await fetch(
        `https://redline-redline-zipcode.p.rapidapi.com/rest/info.json/${query}/degrees`,
        {
          headers: {
            'X-RapidAPI-Key': API_KEY,
            'X-RapidAPI-Host': 'redline-redline-zipcode.p.rapidapi.com'
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        return [{
          zip: data.zip_code,
          city: data.city,
          state: data.state,
          latitude: data.lat,
          longitude: data.lng
        }];
      }
      return [];
    } catch (error) {
      console.error('Zip code API error:', error);
      return [];
    } finally {
      setLoading(false);
    }
  }, [API_KEY]);

  return { searchZipCode, loading };
};

// Option 3: Use a complete ZIP code database file
// Download from: https://simplemaps.com/data/us-zips (free version available)
export const useLocalZipDatabase = () => {
  const [database, setDatabase] = useState(null);
  const [loading, setLoading] = useState(false);

  // Load the database once
  const loadDatabase = useCallback(async () => {
    if (database) return database;
    
    setLoading(true);
    try {
      // You would need to download and place the CSV/JSON file in public folder
      const response = await fetch('/data/uszips.json');
      const data = await response.json();
      setDatabase(data);
      return data;
    } catch (error) {
      console.error('Failed to load zip database:', error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [database]);

  const searchZipCode = useCallback(async (query) => {
    if (!query || query.length < 1) return [];
    
    let data = database;
    if (!data) {
      data = await loadDatabase();
      if (!data) return [];
    }

    const lowerQuery = query.toLowerCase();
    
    // Search by zip or city
    const results = data.filter(item => 
      item.zip.startsWith(query) || 
      item.city.toLowerCase().includes(lowerQuery)
    ).slice(0, 10);
    
    return results;
  }, [database, loadDatabase]);

  return { searchZipCode, loading };
};