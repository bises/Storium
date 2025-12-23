import Fastify from 'fastify';

const server = Fastify({ logger: true });

server.get('/health', async () => ({ status: 'ok' }));

const start = async () => {
  try {
    await server.listen({ port: 4000 });
    server.log.info('Server listening');
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
