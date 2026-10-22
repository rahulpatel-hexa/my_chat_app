import "dotenv/config";

const port = Number(process.env.PORT ?? 5000);
const mongodbUri = process.env.MONGODB_URI;

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("PORT must be an integer between 1 and 65535.");
}

if (!mongodbUri) {
  throw new Error("MONGODB_URI is required. Add it to the backend .env file.");
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port,
  mongodbUri,
  mongodbDbName: process.env.MONGODB_DB_NAME,
  mongodbUsername: process.env.MONGODB_USERNAME,
  mongodbPassword: process.env.MONGODB_PASSWORD,

  jwtAccessSecret: process.env.JWT_ACCESS_SECRET as string,
  accessTokenExpires: process.env.ACCESS_TOKEN_EXPIRES ?? "15m",
  refreshTokenDays: Number(process.env.REFRESH_TOKEN_DAYS ?? 30),
  otpExpiresMin: Number(process.env.OTP_EXPIRES_MIN ?? 5),
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },
  smtp: {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.MAIL_FROM,
  },
};
