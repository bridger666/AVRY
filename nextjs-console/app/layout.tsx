import type { Metadata } from "next"
import { Inter_Tight } from "next/font/google"
import Sidebar from "@/components/shared/Sidebar"
import ClientShell from "@/components/ClientShell"
import LocaleWrapper from "@/components/LocaleWrapper"
import { ModeProvider } from "@/contexts/ModeContext"
import { RouterProvider } from "@/contexts/RouterContext"
import "@/styles/globals.css"
import "@/styles/workflow-nodes.css"

const interTight = Inter_Tight({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
  variable: "--font-inter-tight",
})

export const metadata: Metadata = {
  title: "Aivory Console",
  description: "AI-powered workflow automation console",
  icons: {
    icon: '/favicon.svg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={interTight.variable}>
      <body className={`flex h-screen bg-[#353531] overflow-hidden ${interTight.className}`}>
        <LocaleWrapper>
          <ModeProvider>
            <RouterProvider>
              <Sidebar />
              <main className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
                {children}
              </main>
              <ClientShell />
            </RouterProvider>
          </ModeProvider>
        </LocaleWrapper>
      </body>
    </html>
  )
}
