import { BookOpen } from 'lucide-react'

const ResourcesPage = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center">
          <div className="p-3 bg-primary-100 rounded-lg mr-4">
            <BookOpen className="w-8 h-8 text-primary-600" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Resources</h1>
            <p className="text-gray-600 mt-1">
              Helpful guides, tools, and links for photographers
            </p>
          </div>
        </div>
      </div>

      {/* Resource Center Placeholder */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
        <div className="text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary-50 to-pink-50 rounded-full mb-6">
            <BookOpen className="w-10 h-10 text-primary-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">📚 Resource Center</h2>
          <p className="text-lg text-gray-600 mb-6">
            Helpful guides, tools, and links will appear here soon.
          </p>
          <p className="text-sm text-gray-500">
            We're building a comprehensive resource library to help you succeed as a photographer.
            Check back soon for training materials, best practices, FAQs, and useful tools.
          </p>
        </div>
      </div>
    </div>
  )
}

export default ResourcesPage
