import { Outlet } from 'react-router-dom'
import { CleanNavbar } from './ui/clean-navbar'
import { Footer } from './ui/footer-section'
import ChatAssistant from './ui/ChatAssistant'

const PublicLayout = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <CleanNavbar />
      <div className="flex-1 pt-16 md:pt-20">
        <Outlet />
      </div>
      <Footer />
      <ChatAssistant />
    </div>
  )
}

export default PublicLayout
