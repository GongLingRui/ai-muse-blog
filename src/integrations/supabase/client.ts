// Temporary stub for Supabase client
// TODO: Remove this when migration is complete

export const supabase = {
  from: (table: string) => ({
    select: (columns: string, config?: any) => ({
      eq: (field: string, value: any) => ({ data: [], error: null }),
      contains: (field: string, value: any) => ({ data: [], error: null }),
      order: (field: string, config: any) => ({ data: [], error: null }),
      range: (start: number, end: number) => ({ data: [], error: null }),
      data: [],
      error: null,
    }),
    insert: (data: any) => ({ data: [], error: null }),
    update: (data: any) => ({ data: [], error: null }),
    delete: () => ({ data: [], error: null }),
  }),
  auth: {
    getUser: () => ({ data: { user: null }, error: null }),
  },
};
