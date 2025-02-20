import { Inter } from 'next/font/google'
import { ConfigProvider } from 'antd'
// Import antd styles
import 'antd/dist/reset.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Job Map',
  description: 'Job Map Application',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      
      <body className={inter.className}>
        <ConfigProvider>
          {children}
        </ConfigProvider>
      </body>
    </html>
  )
}
