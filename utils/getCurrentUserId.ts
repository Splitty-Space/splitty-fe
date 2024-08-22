import {MASTER_USER_ID} from "@/API/APIConstants";

export default function getCurrentUserId() {
    return global?.window && window?.Telegram?.WebApp?.initDataUnsafe.user?.id || MASTER_USER_ID;
}