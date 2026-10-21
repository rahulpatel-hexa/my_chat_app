import app from "./app";
import { connectDB } from "./config/db";
import { env } from "./config/env";

const startServer = async (): Promise<void> => {
  await connectDB();

  app.listen(env.port, () => {
    console.log(`Server listening on port http://localhost:${env.port}`);
  });
};

void startServer().catch((error: unknown) => {
  console.error("Unable to start server:", error);
  process.exitCode = 1;
});
