
import type { Metadata } from "next";

import "./globals.css";
import Provider from "@/Provider";
import StoreProvider from "@/redux/StoreProvider";
import InitUser from "@/InitUser";




export const metadata: Metadata = {
  title: "WHISTLE | 10-minute Quick Commerce",
  description: "WHISTLE is a quick commerce platform delivering essentials with a fast yellow + red flair.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="w-full min-h-screen bg-linear-to-b from-yellow-50 to-white">
        <Provider>
          <StoreProvider>
          
        <InitUser/>
        
        {children}
          </StoreProvider>
        </Provider>
      </body>
    </html>
  );
}
