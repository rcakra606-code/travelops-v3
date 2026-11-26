import { QueryClient } from '@tanstack/react-query';

export const QUERY_KEYS = {
  tours: ['travelops', 'tours'],
  documents: ['travelops', 'documents'],
  cruises: ['travelops', 'cruises'],
  hotels: ['travelops', 'hotels'],
  corporate: ['travelops', 'corporate'],
  sales: ['travelops', 'sales'],
  telecoms: ['travelops', 'telecoms'],
  overtimes: ['travelops', 'overtimes'],
  productivity: ['travelops', 'productivity'],
  users: ['travelops', 'users'],
  knowledge: ['travelops', 'knowledge'],
  cruiseGuides: ['travelops', 'cruise_guides'],
  settings: ['travelops', 'settings']
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000, // 2 minutes fresh cache between route transitions
      gcTime: 15 * 60 * 1000, // Keep inactive domain data cached for 15 minutes
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      retry: 1
    },
    mutations: {
      retry: 0
    }
  }
});
