import ReduxContextProvider from "./redux";
import { GoogleAnalytics } from "@next/third-parties/google";

import type { Viewport } from "next";

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
};

type Props = {
  children: React.ReactNode;
};

export default function RootLayout({ children }: Props) {
  return (
    <html lang="en">
      <body>
        <ReduxContextProvider>{children}</ReduxContextProvider>
        <GoogleAnalytics gaId="UA-96948-20" />
      </body>
    </html>
  );
}
