"use client";

import { Provider as JotaiProvider } from "jotai";
import ReactQueryProvider from "./ReactQueryProvider";
import { SessionProvider } from "next-auth/react";
import ToastProvider from "./ToastProvider";

const fakeSession = {
  user: {
    id: "fake-user-id",
    name: "John Doe",
    email: "john.doe@example.com",
    image: "https://example.com/avatar.jpg"
  },
  expires: "9999-12-31T23:59:59.999Z", // Set to a far future date
  supabaseAccessToken: "fake-access-token"
};



export function Providers({ children, session }: { children: React.ReactNode, session?: typeof fakeSession }) {
  return (
    <SessionProvider
      session={session} // Pass the fake session here
      refetchInterval={15 * 60}
      refetchOnWindowFocus={false}
    >
      <JotaiProvider>
        <ToastProvider>
          <ReactQueryProvider>
            {children}
          </ReactQueryProvider>
        </ToastProvider>
      </JotaiProvider>
    </SessionProvider>
  );
}