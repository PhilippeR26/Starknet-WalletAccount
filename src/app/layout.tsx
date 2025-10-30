import type { Metadata } from 'next'
import './globals.css'
import { Provider } from "@/components/ui/provider"

export const metadata: Metadata = {
  title: 'Starknet-WalletAccount',
  description: 'test of WalletAccount for Starknet',
  icons: {
    icon: "./favicon.ico",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Provider>
          {children}
        </Provider>
      </body>
    </html>
  )
}
