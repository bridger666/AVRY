import type { Metadata } from "next"
import Sidebar from "@/components/shared/Sidebar"
import ClientShell from "@/components/ClientShell"
import "@/styles/globals.css"

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
    <html lang="en">
      <body>
        <div className="app-layout">
          <Sidebar />
          <main className="app-main-content">
            {children}
          </main>
        </div>
        <ClientShell />
      </body>
    </html>
  )
}
