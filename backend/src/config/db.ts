import mongoose from "mongoose";
import dns from "node:dns";
import { env } from "./env";

dns.setServers(["8.8.8.8"]);

export const connectDB = async (): Promise<void> => {
  await mongoose.connect(env.mongodbUri, {
    ...(env.mongodbDbName ? { dbName: env.mongodbDbName } : {}),
  });
  console.info(`MongoDB connected: ${mongoose.connection.host}`);
};
