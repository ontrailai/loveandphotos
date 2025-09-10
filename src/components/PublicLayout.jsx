import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'

const PublicLayout = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Outlet />
    </div>
  )
}

export default PublicLayout
