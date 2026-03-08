

export const db = {
  // Placeholder for future RDS connection
  query: async <T>(_sql: string): Promise<T> => {
    throw new Error("DB not configured yet");
  },
};