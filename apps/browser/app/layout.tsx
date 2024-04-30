import clsx from "clsx";
import Script from "next/script";
import { config } from "@fortawesome/fontawesome-svg-core";
import { Ubuntu_FONT } from "@/lib/fonts";

import "../styles/globals.css";
import "@fortawesome/fontawesome-svg-core/styles.css";
import "react-toastify/dist/ReactToastify.css";
import SidebarLayout from "@/components/SidebarLayout";
import { Providers } from "@/components/providers/Providers";
import { cookies } from "next/headers";
import { Metadata } from "next";
config.autoAddCss = false;

const fakeSession = {
  user: {
    id: "fake-user-id",
    name: "John Doe",
    email: "john@example.com",
    image: "https://example.com/avatar.jpg"
  },
  supabaseAccessToken: "fake-access-token",
  expires: "9999-12-31T23:59:59.999Z"
};


export const metadata: Metadata = {
  title: "evo.ninja"
}

export default function EvoApp({ children }: { children: React.ReactNode }) {
  const currentDevice = cookies().get("X-User-Device");
  return (
    <html>
      <body>
        <div className={clsx(Ubuntu_FONT.className, "h-full")}>
         

          <Providers session={fakeSession}>
            <SidebarLayout isMobile={!!(currentDevice?.value === "mobile")}>
              {children}
            </SidebarLayout>
          </Providers>
        </div>
      </body>
    </html>
  );
}
