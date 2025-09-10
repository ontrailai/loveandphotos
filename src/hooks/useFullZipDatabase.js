import { useState, useEffect, useCallback } from 'react';

export const useFullZipDatabase = () => {
  const [database, setDatabase] = useState(null);
  const [quickDatabase, setQuickDatabase] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load the quick database on mount for instant results
  useEffect(() => {
    const loadQuickDatabase = async () => {
      try {
        const response = await fetch('/data/uszips-quick.json');
        if (response.ok) {
          const data = await response.json();
          setQuickDatabase(data);
        }
      } catch (err) {
        console.error('Failed to load quick database:', err);
      }
    };
    loadQuickDatabase();
  }, []);

  // Load full database when needed
  const loadFullDatabase = useCallback(async () => {
    if (database) return database;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/data/uszips.json');
      if (!response.ok) throw new Error('Failed to load zip database');
      
      const data = await response.json();
      setDatabase(data);
      console.log(`Loaded ${data.length} zip codes`);
      return data;
    } catch (err) {
      console.error('Failed to load full database:', err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [database]);

  const searchZipCodes = useCallback(async (query) => {
    if (!query || query.length < 1) return [];
    
    const lowerQuery = query.toLowerCase();
    const isNumeric = /^\d+$/.test(query);
    
    // For short queries, use quick database for instant results
    if (query.length <= 3 && quickDatabase) {
      const results = quickDatabase.filter(item => {
        if (isNumeric) {
          return item.zip.startsWith(query);
        } else {
          return item.city.toLowerCase().startsWith(lowerQuery) ||
                 item.city.toLowerCase().includes(lowerQuery);
        }
      }).slice(0, 10);
      
      if (results.length > 0) return results;
    }
    
    // For longer queries or if no quick results, load full database
    let data = database;
    if (!data) {
      data = await loadFullDatabase();
      if (!data) return [];
    }
    
    // Search logic
    let results = [];
    
    if (isNumeric) {
      // If it's numeric, prioritize zip code matches
      results = data.filter(item => item.zip.startsWith(query));
    } else {
      // City search - group by city name
      const cityMatches = data.filter(item => 
        item.city.toLowerCase().startsWith(lowerQuery) ||
        item.city.toLowerCase().includes(lowerQuery)
      );
      
      // Group by city+state to show unique cities
      const uniqueCities = new Map();
      cityMatches.forEach(item => {
        const key = `${item.city}, ${item.state}`;
        if (!uniqueCities.has(key)) {
          uniqueCities.set(key, {
            ...item,
            isCity: true,
            displayName: `${item.city}, ${item.state}`,
            allZips: []
          });
        }
        uniqueCities.get(key).allZips.push(item.zip);
        // Keep the highest population zip as representative
        if (item.population > uniqueCities.get(key).population) {
          uniqueCities.get(key).population = item.population;
        }
      });
      
      results = Array.from(uniqueCities.values());
      
      // Sort by relevance (starts with > contains) and population
      results.sort((a, b) => {
        const aStartsWith = a.city.toLowerCase().startsWith(lowerQuery);
        const bStartsWith = b.city.toLowerCase().startsWith(lowerQuery);
        if (aStartsWith && !bStartsWith) return -1;
        if (!aStartsWith && bStartsWith) return 1;
        return b.population - a.population;
      });
    }
    
    // Limit results
    return results.slice(0, 15);
  }, [database, quickDatabase, loadFullDatabase]);

  // Validate a specific zip code
  const validateZipCode = useCallback(async (zip) => {
    if (!/^\d{5}$/.test(zip)) return null;
    
    // Check quick database first
    if (quickDatabase) {
      const quick = quickDatabase.find(item => item.zip === zip);
      if (quick) return quick;
    }
    
    // Load full database if needed
    let data = database;
    if (!data) {
      data = await loadFullDatabase();
      if (!data) return null;
    }
    
    return data.find(item => item.zip === zip);
  }, [database, quickDatabase, loadFullDatabase]);

  return {
    searchZipCodes,
    validateZipCode,
    loading,
    error,
    isReady: !!quickDatabase
  };
};