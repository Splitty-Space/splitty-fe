import type {ReactNode} from "react";
import DatePickerProviders from "@/app/components/datePickerProviders/DatePickerProviders";

export default function SettleUpPaymentLayout({children}: {children: ReactNode}) {
    return <DatePickerProviders>{children}</DatePickerProviders>;
}
