import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="relative">
        {children || <Outlet />}
      </main>
    </div>
  )
}

export default Layout
