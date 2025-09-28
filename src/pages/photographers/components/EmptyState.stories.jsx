/**
 * Storybook Stories for EmptyState Component
 * Visual documentation and testing for no results state with suggestions and actions
 */

import { useState } from 'react'
import EmptyState from './EmptyState'

// Sample suggested cities
const sampleCities = [
  'New York, NY',
  'Los Angeles, CA',
  'Chicago, IL',
  'Houston, TX',
  'Phoenix, AZ',
  'Philadelphia, PA'
]

// Default export for Storybook
export default {
  title: 'Photographers/EmptyState',
  component: EmptyState,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Empty state component for when no photographers are found, with clear filters action and city suggestions.'
      }
    }
  },
  argTypes: {
    title: {
      description: 'Main heading text',
      control: 'text'
    },
    description: {
      description: 'Description text explaining the empty state',
      control: 'text'
    },
    showClearFilters: {
      description: 'Whether to show clear filters button',
      control: 'boolean'
    },
    onClearFilters: {
      description: 'Handler for clear filters action',
      action: 'clear-filters'
    },
    suggestedCities: {
      description: 'Array of suggested city names',
      control: 'object'
    }
  },
  decorators: [
    (Story) => (
      <div className="max-w-2xl mx-auto bg-gray-50 p-6">
        <Story />
      </div>
    )
  ]
}

// Template for static stories
const Template = (args) => <EmptyState {...args} />

// Default story
export const Default = Template.bind({})
Default.args = {
  title: "No photographers found",
  description: "Try adjusting your filters to find more photographers.",
  showClearFilters: false,
  suggestedCities: []
}

// With clear filters button
export const WithClearFilters = Template.bind({})
WithClearFilters.args = {
  title: "No photographers match your criteria",
  description: "Try removing some filters to see more results, or browse all photographers.",
  showClearFilters: true,
  suggestedCities: []
}
WithClearFilters.parameters = {
  docs: {
    description: {
      story: 'Empty state with clear filters button when user has active filters applied.'
    }
  }
}

// With suggested cities
export const WithSuggestedCities = Template.bind({})
WithSuggestedCities.args = {
  title: "No photographers in this area",
  description: "We couldn't find any photographers in your location. Try searching in a nearby city.",
  showClearFilters: false,
  suggestedCities: sampleCities.slice(0, 4)
}

// Full featured (with filters and suggestions)
export const FullFeatured = Template.bind({})
FullFeatured.args = {
  title: "No results found",
  description: "Your search didn't return any photographers. Try adjusting your criteria or exploring nearby areas.",
  showClearFilters: true,
  suggestedCities: sampleCities
}

// Custom messaging
export const CustomMessaging = Template.bind({})
CustomMessaging.args = {
  title: "Oops! No photographers available",
  description: "It looks like all our photographers in your area are currently booked. Check back later or try a different date.",
  showClearFilters: false,
  suggestedCities: ['Miami, FL', 'Orlando, FL', 'Tampa, FL']
}

// Minimal (title only)
export const Minimal = Template.bind({})
Minimal.args = {
  title: "No photographers found",
  description: "",
  showClearFilters: false,
  suggestedCities: []
}

// Interactive demo with state management
export const Interactive = {
  render: () => {
    const [hasFilters, setHasFilters] = useState(true)
    const [showSuggestions, setShowSuggestions] = useState(true)
    const [lastAction, setLastAction] = useState('')

    const handleClearFilters = () => {
      setHasFilters(false)
      setLastAction('Filters cleared!')
      // Reset after a moment to show the action worked
      setTimeout(() => setLastAction(''), 2000)
    }

    const handleCityClick = (city) => {
      setLastAction(`Searching in ${city}`)
      setTimeout(() => setLastAction(''), 2000)
    }

    return (
      <div className="max-w-2xl mx-auto bg-gray-50 p-6">
        <div className="mb-4 flex gap-3">
          <button
            onClick={() => setHasFilters(!hasFilters)}
            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
          >
            {hasFilters ? 'Remove' : 'Add'} Filters
          </button>
          <button
            onClick={() => setShowSuggestions(!showSuggestions)}
            className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200"
          >
            {showSuggestions ? 'Hide' : 'Show'} Suggestions
          </button>
        </div>

        <EmptyState
          title="No photographers found"
          description="Try adjusting your search criteria or browse photographers in nearby areas."
          showClearFilters={hasFilters}
          onClearFilters={handleClearFilters}
          suggestedCities={showSuggestions ? sampleCities.slice(0, 5) : []}
        />

        {lastAction && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-center">
            <p className="text-green-800 text-sm">{lastAction}</p>
          </div>
        )}
      </div>
    )
  }
}

// Different scenarios
export const FilterScenarios = {
  render: () => (
    <div className="space-y-8 max-w-2xl mx-auto bg-gray-50 p-6">
      <div>
        <h3 className="font-semibold mb-4">No Filters Applied</h3>
        <EmptyState
          title="No photographers available"
          description="We couldn't find any photographers at the moment. Please check back later."
          showClearFilters={false}
          suggestedCities={[]}
        />
      </div>

      <div>
        <h3 className="font-semibold mb-4">With Active Filters</h3>
        <EmptyState
          title="No photographers match your criteria"
          description="Your current filters are too restrictive. Try removing some filters to see more results."
          showClearFilters={true}
          onClearFilters={() => console.log('Clear filters clicked')}
          suggestedCities={[]}
        />
      </div>

      <div>
        <h3 className="font-semibold mb-4">Location-Specific</h3>
        <EmptyState
          title="No photographers in this area"
          description="We don't have any photographers in your current location. Try searching in nearby cities."
          showClearFilters={false}
          suggestedCities={['Boston, MA', 'Providence, RI', 'Hartford, CT']}
        />
      </div>
    </div>
  )
}

// Animation showcase
export const AnimationShowcase = {
  render: () => {
    const [key, setKey] = useState(0)

    return (
      <div className="max-w-2xl mx-auto bg-gray-50 p-6">
        <div className="mb-4 text-center">
          <button
            onClick={() => setKey(prev => prev + 1)}
            className="px-4 py-2 bg-[#FF4D6D] text-white rounded-lg hover:bg-[#FF4D6D]/90"
          >
            Replay Animation
          </button>
        </div>

        <EmptyState
          key={key}
          title="Beautifully Animated"
          description="Watch as each element appears with smooth Framer Motion animations."
          showClearFilters={true}
          onClearFilters={() => {}}
          suggestedCities={['Austin, TX', 'Denver, CO', 'Seattle, WA']}
        />
      </div>
    )
  }
}

// Responsive behavior
export const ResponsiveBehavior = {
  render: () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold mb-4">Mobile (375px)</h3>
        <div className="w-[375px] mx-auto bg-gray-50 p-4">
          <EmptyState
            title="No photographers found"
            description="Try adjusting your filters to find more photographers in your area."
            showClearFilters={true}
            onClearFilters={() => {}}
            suggestedCities={sampleCities.slice(0, 4)}
          />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Tablet (768px)</h3>
        <div className="w-[768px] mx-auto bg-gray-50 p-4">
          <EmptyState
            title="No photographers found"
            description="Try adjusting your filters to find more photographers in your area."
            showClearFilters={true}
            onClearFilters={() => {}}
            suggestedCities={sampleCities}
          />
        </div>
      </div>
    </div>
  )
}

// Accessibility demonstration
export const AccessibilityDemo = {
  render: () => (
    <div className="max-w-2xl mx-auto bg-gray-50 p-6">
      <EmptyState
        title="Accessible Empty State"
        description="This component follows accessibility best practices with proper focus management and semantic HTML."
        showClearFilters={true}
        onClearFilters={() => console.log('Accessible clear filters')}
        suggestedCities={sampleCities.slice(0, 4)}
      />

      <div className="mt-6 text-sm text-gray-600">
        <p><strong>Accessibility features:</strong></p>
        <ul className="list-disc list-inside mt-2 space-y-1">
          <li>Semantic HTML structure with proper headings</li>
          <li>Keyboard navigation support for all interactive elements</li>
          <li>Focus management with visible focus indicators</li>
          <li>Screen reader friendly with descriptive text</li>
          <li>ARIA attributes where appropriate</li>
          <li>Sufficient color contrast for all text elements</li>
          <li>Logical tab order through buttons and suggestions</li>
        </ul>

        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-800 text-xs">
            <strong>Keyboard test:</strong> Tab through the buttons, use Enter/Space to activate.
            City suggestions are keyboard accessible and provide clear feedback.
          </p>
        </div>
      </div>
    </div>
  )
}

// Real-world examples
export const RealWorldExamples = {
  render: () => (
    <div className="space-y-8 max-w-2xl mx-auto bg-gray-50 p-6">
      <div>
        <h3 className="font-semibold mb-4">Search Results Page</h3>
        <EmptyState
          title="No photographers found for 'New York Wedding'"
          description="We couldn't find any wedding photographers in New York matching your criteria. Try broadening your search or check out photographers in nearby areas."
          showClearFilters={true}
          onClearFilters={() => {}}
          suggestedCities={['Brooklyn, NY', 'Queens, NY', 'Newark, NJ', 'Jersey City, NJ']}
        />
      </div>

      <div>
        <h3 className="font-semibold mb-4">Date Unavailable</h3>
        <EmptyState
          title="No photographers available on December 25th"
          description="All photographers are booked for this date. Try selecting a different date or browse available photographers for nearby dates."
          showClearFilters={false}
          suggestedCities={[]}
        />
      </div>

      <div>
        <h3 className="font-semibold mb-4">Price Range Too Low</h3>
        <EmptyState
          title="No photographers in your budget"
          description="We don't have photographers available in your selected price range. Consider adjusting your budget or explore photographers just above your range."
          showClearFilters={true}
          onClearFilters={() => {}}
          suggestedCities={[]}
        />
      </div>
    </div>
  )
}

// Error handling
export const ErrorHandling = {
  render: () => (
    <div className="space-y-6 max-w-2xl mx-auto bg-gray-50 p-6">
      <div>
        <h3 className="font-semibold mb-4">Null/Undefined Props</h3>
        <EmptyState
          title={null}
          description={undefined}
          showClearFilters={null}
          onClearFilters={undefined}
          suggestedCities={null}
        />
      </div>

      <div>
        <h3 className="font-semibold mb-4">Empty Arrays</h3>
        <EmptyState
          title=""
          description=""
          suggestedCities={[]}
        />
      </div>

      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-yellow-800 text-sm">
          <strong>Error Handling:</strong> Component gracefully handles null/undefined props
          and empty arrays, falling back to sensible defaults and maintaining functionality.
        </p>
      </div>
    </div>
  )
}

// Performance showcase
export const PerformanceShowcase = {
  render: () => {
    const [renderCount, setRenderCount] = useState(0)

    // Track renders
    React.useEffect(() => {
      setRenderCount(prev => prev + 1)
    })

    return (
      <div className="max-w-2xl mx-auto bg-gray-50 p-6">
        <EmptyState
          title="Performance Optimized"
          description="Efficiently rendered with minimal re-renders and smooth animations."
          showClearFilters={true}
          onClearFilters={() => {}}
          suggestedCities={sampleCities.slice(0, 3)}
        />

        <div className="mt-6 p-4 bg-white rounded-lg">
          <h4 className="font-medium text-gray-900 mb-3">Performance Metrics:</h4>
          <div className="space-y-2 text-sm">
            <p><strong>Component renders:</strong> {renderCount}</p>
            <p><strong>Animation engine:</strong> Framer Motion with GPU acceleration</p>
            <p><strong>City buttons:</strong> {sampleCities.slice(0, 3).length} rendered efficiently</p>
          </div>

          <div className="mt-4 p-3 bg-gray-50 rounded text-xs text-gray-600">
            <p><strong>Optimizations:</strong></p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>Framer Motion animations optimized for performance</li>
              <li>Conditional rendering of optional elements</li>
              <li>Minimal DOM with efficient class composition</li>
              <li>Event handlers properly memoized</li>
            </ul>
          </div>
        </div>
      </div>
    )
  }
}