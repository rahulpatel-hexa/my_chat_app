export const getPublicAvatarUrl = (avatarUrl: string | null | undefined, origin: string): string | null => {
    if (!avatarUrl) return null;
    if (/^https?:\/\//i.test(avatarUrl)) return avatarUrl;
    return new URL(avatarUrl, origin).toString();
};
