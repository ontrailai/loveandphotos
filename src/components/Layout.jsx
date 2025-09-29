import { Outlet } from 'react-router-dom'
import { CleanNavbar } from './ui/clean-navbar'
import { Footer } from './ui/footer-section'
import ChatAssistant from './ui/ChatAssistant'

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <CleanNavbar />
      <main className="relative flex-1 pt-16 md:pt-20">
        {children || <Outlet />}
      </main>
      <Footer />
      <ChatAssistant />
    </div>
  )
}

export default Layout
