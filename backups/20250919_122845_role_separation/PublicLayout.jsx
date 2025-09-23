import { Outlet } from 'react-router-dom'
import { CleanNavbar } from './ui/clean-navbar'

const PublicLayout = () => {
  return (
    <div className="min-h-screen">
      <CleanNavbar />
      <div className="pt-16 md:pt-20">
        <Outlet />
      </div>
    </div>
  )
}

export default PublicLayout
