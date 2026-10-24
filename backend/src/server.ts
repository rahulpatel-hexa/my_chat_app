import { createServer } from "node:http";
import app from "./app";
import { connectDB } from "./config/db";
import { env } from "./config/env";
import { initializeSocket } from "./sockets/socket";

const startServer = async (): Promise<void> => {
  await connectDB();

  const httpServer = createServer(app);
  initializeSocket(httpServer);

  httpServer.listen(env.port, () => {
    console.log(`Server listening on port http://localhost:${env.port}`);
  });
};

void startServer().catch((error: unknown) => {
  console.error("Unable to start server:", error);
  process.exitCode = 1;
});
