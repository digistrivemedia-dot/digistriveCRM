import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata = {
  title: "DigiCRM",
  description: "Professional CRM for managing leads and customer relationships",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${plusJakarta.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
