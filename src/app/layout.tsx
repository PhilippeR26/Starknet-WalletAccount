import './globals.css'

export const metadata = {
  title: 'Cairo1-JS',
  description: 'Demo of Starknet.js with Cairo 1',
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
