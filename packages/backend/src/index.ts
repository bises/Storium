import 'dotenv/config';
import Fastify from 'fastify';
import itemRoutes from './modules/items/routes';
import locationRoutes from './modules/locations/routes';
import memberRoutes from './modules/members/routes';
import movementHistoryRoutes from './modules/movement-history/routes';
import spaceRoutes from './modules/spaces/routes';
import tagRoutes from './modules/tags/routes';

const server = Fastify({ logger: true });

// Health check
server.get('/health', async () => ({ status: 'ok' }));

// Register route modules
const start = async () => {
  try {
    // Register all routes
    await server.register(spaceRoutes, { prefix: '/spaces' });
    await server.register(locationRoutes, { prefix: '/spaces' });
    await server.register(itemRoutes, { prefix: '/spaces' });
    await server.register(memberRoutes, { prefix: '/spaces' });
    await server.register(tagRoutes, { prefix: '/spaces' });
    await server.register(movementHistoryRoutes, { prefix: '/spaces' });

    await server.listen({ port: 4000 });
    server.log.info('Server listening on http://localhost:4000');
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
