/**
 * Reusable mock factory for Supabase client.
 * Creates chainable query builders that can be configured per test.
 */

// Helper to create a chainable query builder
export function createMockQueryBuilder(resolvedData: any = null, resolvedError: any = null) {
  const builder: any = {
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: resolvedData, error: resolvedError }),
    then: undefined, // Will be set below
  };

  // Make the builder itself thenable (for queries without .single())
  const defaultPromise = Promise.resolve({ data: resolvedData, error: resolvedError });
  builder.then = defaultPromise.then.bind(defaultPromise);
  builder.catch = defaultPromise.catch.bind(defaultPromise);

  return builder;
}

// Create a full mock supabase client
export function createMockSupabase() {
  const mockFrom = jest.fn();
  const mockRpc = jest.fn();

  return {
    from: mockFrom,
    rpc: mockRpc,
    auth: {
      getSession: jest.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: jest.fn().mockReturnValue({
        data: { subscription: { unsubscribe: jest.fn() } },
      }),
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn().mockResolvedValue({ error: null }),
    },
  };
}
