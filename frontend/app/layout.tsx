import type { Metadata, Viewport } from "next";
import { Noto_Sans_Thai } from "next/font/google";
import "./globals.css";

const notoSansThai = Noto_Sans_Thai({
    subsets: ["thai", "latin"],
    variable: "--font-noto-sans-thai",
    display: "swap",
});

export const metadata: Metadata = {
    title: "Smart Farm - ระบบจัดการแปลงเกษตร",
    description: "ระบบจัดการแปลงเกษตรอัจฉริยะ บันทึกกิจกรรม ติดตามต้นทุน และวิเคราะห์ผลผลิต",
    keywords: ["smart farm", "เกษตร", "แปลงเกษตร", "บันทึกกิจกรรม", "ต้นทุนการเกษตร"],
    authors: [{ name: "Smart Farm Team" }],
};

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="th" suppressHydrationWarning>
            <body className={`${notoSansThai.variable} font-sans antialiased`}>
                {children}
            </body>
        </html>
    );
}
