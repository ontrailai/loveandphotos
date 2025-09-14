import { Outlet } from 'react-router-dom'
import { CleanNavbar } from './ui/clean-navbar'

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <CleanNavbar />
      <main className="relative pt-16 md:pt-20">
        {children || <Outlet />}
      </main>
    </div>
  )
}

export default Layout
