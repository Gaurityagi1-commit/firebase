import { QueryClient } from '@tanstack/react-query';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            // Configure global query options if needed
            staleTime: 1000 * 60 * 5, // 5 minutes
            refetchOnWindowFocus: true, // Refetch on window focus
        },
    },
});

export default queryClient;
