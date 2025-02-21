import { Inter } from 'next/font/google'
import { ConfigProvider } from 'antd'
// Import antd styles
import './globals.css'
import 'antd/dist/reset.css'


const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Job Map',
  description: 'Job Map Application',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <link 
          rel="stylesheet" 
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" 
        />
      <body className={inter.className}>
        <ConfigProvider>
          {children}
        </ConfigProvider>
      </body>
    </html>
  )
}
