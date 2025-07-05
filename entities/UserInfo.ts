export default interface UserInfo {
    id: number;
    name: string;
    username: string;
    photo: Blob;
    referral_code?: string | null;
    default_currency?: string | null;
}
