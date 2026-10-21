import { env } from "../config/env";

export const sendOtpSms = async(phone: string, otp: string): Promise<void> => {
    if (env.nodeEnv === "development") {
        console.log(`[DEV] SMS OTP for ${phone}: ${otp}`);
        return;
    }
    // TODO: MSG91 / Twilio yahan lagega
    throw new Error("SMS provider not configured");
}

