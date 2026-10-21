import nodemailer from "nodemailer";
import { env } from "../config/env";

const transporter = nodemailer.createTransport({
    host: env.smtp.host,
    port: env.smtp.port,
    auth: {
        user: env.smtp.user,
        pass: env.smtp.pass
    },
});

export const sendOtpEmail = async (to: string, otp: string): Promise<void> => {
    if (env.nodeEnv === "development") {
        console.log(`[DEV] OTP for ${to}: ${otp}`);
        return;
    }

    await transporter.sendMail({
        from: env.smtp.from,
        to,
        subject: "Your verification code",
        text: `Your OTP is ${otp}. It expires in ${env.otpExpiresMin} minutes.`,
    });
};
