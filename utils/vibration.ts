import {hapticFeedback} from "@telegram-apps/sdk";

export const vibration = () => {
    if (hapticFeedback.impactOccurred.isAvailable()) {
        hapticFeedback.impactOccurred("light");
    }
};