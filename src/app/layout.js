import { Inter } from 'next/font/google'
import { ConfigProvider, theme } from 'antd'
// Import antd styles
import './globals.css'
import 'antd/dist/reset.css'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { ThemeProvider } from './contexts/ThemeContext'
import { AuthProvider } from '../contexts/AuthContext'
import Navigation from './components/Navigation'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'JobTread tools',
  description: 'JobTread 3rd party tools for Construction Corps',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link 
          rel="stylesheet" 
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" 
        />
      </head>
      <body className={inter.className}>
        <ThemeProvider>
          <AuthProvider>
            <ConfigProvider
              theme={{
                algorithm: [theme.defaultAlgorithm, theme.darkAlgorithm],
              }}
            >
              <Navigation />
              {children}
            </ConfigProvider>
          </AuthProvider>
        </ThemeProvider>
        <ToastContainer position="top-right" autoClose={3000} />
      </body>
    </html>
  )
}
