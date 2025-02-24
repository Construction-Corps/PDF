import { Inter } from 'next/font/google'
import { ConfigProvider, theme } from 'antd'
// Import antd styles
import './globals.css'
import 'antd/dist/reset.css'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { ThemeProvider } from './contexts/ThemeContext'


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
        <ThemeProvider>
          <ConfigProvider
            theme={{
              algorithm: [theme.defaultAlgorithm, theme.darkAlgorithm],
            }}
          >
            {children}
          </ConfigProvider>
        </ThemeProvider>
        <ToastContainer position="top-right" autoClose={3000} />
      </body>
    </html>
  )
}
