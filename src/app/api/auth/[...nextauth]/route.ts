import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

// Create the handler
const handler = NextAuth(authOptions);

// Export handlers for GET and POST
export { handler as GET, handler as POST };
