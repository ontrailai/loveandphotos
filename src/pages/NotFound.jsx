import { Link } from 'react-router-dom'
import Button from '@components/ui/Button'

const NotFound = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blush-50 to-sage-50 flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-dusty-300 mb-4">404</h1>
        <h2 className="text-3xl font-semibold text-dusty-900 mb-4">Page Not Found</h2>
        <p className="text-dusty-600 mb-8">The page you're looking for doesn't exist.</p>
        <Link to="/">
          <Button>Go Home</Button>
        </Link>
      </div>
    </div>
  )
}

export default NotFound
