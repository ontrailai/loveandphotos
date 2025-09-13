/**
 * Mock Supabase client for testing
 * Provides in-memory database simulation
 */

import { jest } from '@jest/globals';

// In-memory data store for tests
let mockData = {
  users: [],
  photographers: [],
  packages: [],
  bookings: [],
  reviews: [],
  availability: [],
  pay_tiers: [
    { id: 'bronze', name: 'Bronze', price_range: '$200-$500', features: ['Basic editing', 'Digital gallery'] },
    { id: 'silver', name: 'Silver', price_range: '$500-$1000', features: ['Advanced editing', 'Digital gallery', 'Print release'] },
    { id: 'gold', name: 'Gold', price_range: '$1000-$2000', features: ['Premium editing', 'Digital gallery', 'Print release', 'Same-day preview'] },
    { id: 'platinum', name: 'Platinum', price_range: '$2000+', features: ['Luxury service', 'Premium editing', 'Digital gallery', 'Print release', 'Same-day preview', 'Personal consultation'] }
  ],
  portfolio_items: [],
  contact_submissions: [],
  training_modules: [],
  training_status: [],
  messages: []
};

// Reset mock data between tests
export const resetMockData = () => {
  Object.keys(mockData).forEach(table => {
    if (Array.isArray(mockData[table])) {
      mockData[table] = [];
    }
  });

  // Re-add default pay_tiers
  mockData.pay_tiers = [
    { id: 'bronze', name: 'Bronze', price_range: '$200-$500', features: ['Basic editing', 'Digital gallery'] },
    { id: 'silver', name: 'Silver', price_range: '$500-$1000', features: ['Advanced editing', 'Digital gallery', 'Print release'] },
    { id: 'gold', name: 'Gold', price_range: '$1000-$2000', features: ['Premium editing', 'Digital gallery', 'Print release', 'Same-day preview'] },
    { id: 'platinum', name: 'Platinum', price_range: '$2000+', features: ['Luxury service', 'Premium editing', 'Digital gallery', 'Print release', 'Same-day preview', 'Personal consultation'] }
  ];
};

// Seed mock data with test records
export const seedMockData = (table, records) => {
  if (mockData[table]) {
    mockData[table].push(...records);
  }
};

// Mock query builder
const createMockQueryBuilder = (table, data = []) => ({
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  neq: jest.fn().mockReturnThis(),
  gt: jest.fn().mockReturnThis(),
  gte: jest.fn().mockReturnThis(),
  lt: jest.fn().mockReturnThis(),
  lte: jest.fn().mockReturnThis(),
  like: jest.fn().mockReturnThis(),
  ilike: jest.fn().mockReturnThis(),
  in: jest.fn().mockReturnThis(),
  is: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  offset: jest.fn().mockReturnThis(),
  range: jest.fn().mockReturnThis(),
  single: jest.fn().mockImplementation(() =>
    Promise.resolve({ data: data[0] || null, error: null })
  ),
  maybeSingle: jest.fn().mockImplementation(() =>
    Promise.resolve({ data: data[0] || null, error: null })
  ),
  then: jest.fn().mockImplementation((callback) =>
    callback({ data, error: null })
  )
});

// Mock Supabase client
export const createMockSupabaseClient = () => ({
  from: jest.fn().mockImplementation((table) => {
    const tableData = mockData[table] || [];
    const builder = createMockQueryBuilder(table, tableData);

    // Configure select behavior
    builder.select.mockImplementation((columns = '*') => {
      const selectBuilder = { ...builder };

      selectBuilder.then = jest.fn().mockImplementation((callback) => {
        return callback({ data: tableData, error: null });
      });

      // Add filtering methods
      ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'like', 'ilike', 'in', 'is'].forEach(method => {
        selectBuilder[method] = jest.fn().mockImplementation((column, value) => {
          let filteredData = [...tableData];

          switch (method) {
            case 'eq':
              filteredData = filteredData.filter(item => item[column] === value);
              break;
            case 'neq':
              filteredData = filteredData.filter(item => item[column] !== value);
              break;
            case 'gt':
              filteredData = filteredData.filter(item => item[column] > value);
              break;
            case 'gte':
              filteredData = filteredData.filter(item => item[column] >= value);
              break;
            case 'lt':
              filteredData = filteredData.filter(item => item[column] < value);
              break;
            case 'lte':
              filteredData = filteredData.filter(item => item[column] <= value);
              break;
            case 'like':
            case 'ilike':
              const pattern = value.replace(/%/g, '.*').replace(/_/g, '.');
              const regex = new RegExp(pattern, method === 'ilike' ? 'i' : '');
              filteredData = filteredData.filter(item => regex.test(item[column]));
              break;
            case 'in':
              filteredData = filteredData.filter(item => value.includes(item[column]));
              break;
            case 'is':
              if (value === null) {
                filteredData = filteredData.filter(item => item[column] === null || item[column] === undefined);
              }
              break;
          }

          return {
            ...selectBuilder,
            then: jest.fn().mockImplementation((callback) =>
              callback({ data: filteredData, error: null })
            )
          };
        });
      });

      return selectBuilder;
    });

    // Configure insert behavior
    builder.insert.mockImplementation((records) => {
      const recordsArray = Array.isArray(records) ? records : [records];
      const newRecords = recordsArray.map(record => ({
        id: record.id || `mock-${Date.now()}-${Math.random()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...record
      }));

      mockData[table].push(...newRecords);

      return {
        ...builder,
        then: jest.fn().mockImplementation((callback) =>
          callback({ data: newRecords, error: null })
        )
      };
    });

    // Configure update behavior
    builder.update.mockImplementation((updates) => {
      return {
        ...builder,
        eq: jest.fn().mockImplementation((column, value) => ({
          then: jest.fn().mockImplementation((callback) => {
            const updatedRecords = mockData[table]
              .filter(item => item[column] === value)
              .map(item => ({
                ...item,
                ...updates,
                updated_at: new Date().toISOString()
              }));

            // Apply updates to mock data
            mockData[table] = mockData[table].map(item =>
              item[column] === value ? { ...item, ...updates, updated_at: new Date().toISOString() } : item
            );

            return callback({ data: updatedRecords, error: null });
          })
        }))
      };
    });

    // Configure delete behavior
    builder.delete.mockImplementation(() => ({
      eq: jest.fn().mockImplementation((column, value) => ({
        then: jest.fn().mockImplementation((callback) => {
          const deletedRecords = mockData[table].filter(item => item[column] === value);
          mockData[table] = mockData[table].filter(item => item[column] !== value);
          return callback({ data: deletedRecords, error: null });
        })
      }))
    }));

    return builder;
  }),

  auth: {
    getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
    signUp: jest.fn().mockResolvedValue({ data: { user: null, session: null }, error: null }),
    signIn: jest.fn().mockResolvedValue({ data: { user: null, session: null }, error: null }),
    signOut: jest.fn().mockResolvedValue({ error: null }),
    onAuthStateChange: jest.fn().mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } }
    })
  },

  storage: {
    from: jest.fn().mockReturnValue({
      upload: jest.fn().mockResolvedValue({ data: { path: 'mock/path' }, error: null }),
      download: jest.fn().mockResolvedValue({ data: new Blob(), error: null }),
      remove: jest.fn().mockResolvedValue({ data: [], error: null }),
      list: jest.fn().mockResolvedValue({ data: [], error: null }),
      getPublicUrl: jest.fn().mockReturnValue({
        data: { publicUrl: 'https://mock-storage.com/mock/path' }
      })
    })
  },

  // RPC function calls
  rpc: jest.fn().mockImplementation((functionName, params) => {
    // Mock common RPC functions
    switch (functionName) {
      case 'search_photographers':
        return Promise.resolve({
          data: mockData.photographers.slice(0, 10),
          error: null
        });
      case 'get_photographer_availability':
        return Promise.resolve({
          data: mockData.availability.filter(a => a.photographer_id === params.photographer_id),
          error: null
        });
      default:
        return Promise.resolve({ data: [], error: null });
    }
  })
});

// Export the mock client
export default createMockSupabaseClient;