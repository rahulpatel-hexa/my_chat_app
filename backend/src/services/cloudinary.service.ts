import { randomUUID } from "node:crypto";
import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";
import { env } from "../config/env";
import { ApiError } from "../utils/ApiError";

const configureCloudinary = () => {
    const { cloudName, apiKey, apiSecret } = env.cloudinary;
    if (!cloudName || !apiKey || !apiSecret) {
        throw new ApiError(503, "Avatar uploads are not configured on the server.");
    }

    cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true,
    });
};

export const uploadAvatarToCloudinary = async (
    buffer: Buffer,
    userId: string,
): Promise<UploadApiResponse> => {
    configureCloudinary();

    return new Promise((resolve, reject) => {
        const upload = cloudinary.uploader.upload_stream(
            {
                folder: "my_chat_app/avatars",
                public_id: `${userId}-${randomUUID()}`,
                resource_type: "image",
            },
            (error, result) => {
                if (error) {
                    reject(new ApiError(502, "Unable to upload profile photo. Please try again."));
                    return;
                }
                if (!result) {
                    reject(new ApiError(502, "Cloudinary did not return the uploaded profile photo."));
                    return;
                }
                resolve(result);
            },
        );
        upload.end(buffer);
    });
};

export const deleteCloudinaryAvatar = async (publicId: string): Promise<void> => {
    configureCloudinary();
    const result = await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
    if (result.result !== "ok" && result.result !== "not found") {
        throw new Error(`Cloudinary avatar deletion failed: ${result.result}`);
    }
};
