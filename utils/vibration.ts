import {hapticFeedback} from "@telegram-apps/sdk";

type ImpactHapticFeedbackStyle = "light" | "medium" | "heavy" | "rigid" | "soft";

export const vibration = (style: ImpactHapticFeedbackStyle = "light") => {
    if (hapticFeedback.impactOccurred.isAvailable()) {
        hapticFeedback.impactOccurred(style);
    }
};