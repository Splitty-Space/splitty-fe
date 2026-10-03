import type {Metadata, Viewport} from "next";
import type {ReactNode} from "react";
import ClientLayout from "./client-layout";

export const metadata: Metadata = {
    title: "Splitty",
    description: "Share expenses with friends, track balances, and settle up with Splitty in Telegram.",
};

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    viewportFit: "cover",
};

export default function RootLayout({children}: Readonly<{children: ReactNode}>) {
    return (
        <html lang="en">
            <body className="overscroll-none overflow-hidden h-screen body_dark">
                <ClientLayout>{children}</ClientLayout>
            </body>
        </html>
    );
}
