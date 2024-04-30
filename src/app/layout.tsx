import './globals.css'

export const metadata = {
  title: 'Starknet-WalletAccount',
  description: 'test of WalletAccount for Starknet',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {children}</body>
    </html>
  )
}
