/**
 * Storybook Stories for SearchBar Component
 * Visual documentation and testing for location and date search functionality
 */

import { useState } from 'react'
import SearchBar from './SearchBar'

// Default export for Storybook
export default {
  title: 'Photographers/SearchBar',
  component: SearchBar,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Search bar with location autocomplete, date picker, and responsive design for photographer discovery.'
      }
    }
  },
  argTypes: {
    value: {
      description: 'Current location search value',
      control: 'text'
    },
    date: {
      description: 'Current date value (YYYY-MM-DD format)',
      control: 'text'
    },
    onValueChange: {
      description: 'Handler for location value changes',
      action: 'location-changed'
    },
    onDateChange: {
      description: 'Handler for date value changes',
      action: 'date-changed'
    },
    onSubmit: {
      description: 'Handler for form submission',
      action: 'search-submitted'
    },
    isLoading: {
      description: 'Loading state for search operation',
      control: 'boolean'
    },
    placeholder: {
      description: 'Placeholder text for location input',
      control: 'text'
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
const Template = (args) => <SearchBar {...args} />

// Default story
export const Default = Template.bind({})
Default.args = {
  value: '',
  date: '',
  isLoading: false,
  placeholder: 'ZIP code or city'
}

// With values
export const WithValues = Template.bind({})
WithValues.args = {
  value: 'New York, NY',
  date: '2024-06-15',
  isLoading: false,
  placeholder: 'ZIP code or city'
}
WithValues.parameters = {
  docs: {
    description: {
      story: 'Search bar with location and date values filled in, showing clear buttons.'
    }
  }
}

// Loading state
export const Loading = Template.bind({})
Loading.args = {
  value: 'Los Angeles, CA',
  date: '2024-07-20',
  isLoading: true,
  placeholder: 'ZIP code or city'
}

// Custom placeholder
export const CustomPlaceholder = Template.bind({})
CustomPlaceholder.args = {
  value: '',
  date: '',
  isLoading: false,
  placeholder: 'Enter your location or ZIP code'
}

// Interactive demo with state management
export const Interactive = {
  render: () => {
    const [value, setValue] = useState('')
    const [date, setDate] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [searchHistory, setSearchHistory] = useState([])

    const handleSubmit = () => {
      if (value || date) {
        setIsLoading(true)
        const searchData = { location: value, date }
        setSearchHistory(prev => [searchData, ...prev.slice(0, 4)])

        // Simulate API call
        setTimeout(() => setIsLoading(false), 1500)
      }
    }

    return (
      <div className="max-w-2xl mx-auto bg-gray-50 p-6">
        <SearchBar
          value={value}
          date={date}
          onValueChange={setValue}
          onDateChange={setDate}
          onSubmit={handleSubmit}
          isLoading={isLoading}
          placeholder="ZIP code or city"
        />

        <div className="mt-6 p-4 bg-white rounded-lg">
          <h4 className="font-medium text-gray-900 mb-3">Search State:</h4>
          <div className="space-y-2 text-sm">
            <p><strong>Location:</strong> {value || 'None'}</p>
            <p><strong>Date:</strong> {date || 'None'}</p>
            <p><strong>Loading:</strong> {isLoading ? 'Yes' : 'No'}</p>
          </div>

          {searchHistory.length > 0 && (
            <div className="mt-4">
              <h5 className="font-medium text-gray-700 mb-2">Recent Searches:</h5>
              <div className="space-y-1">
                {searchHistory.map((search, index) => (
                  <div key={index} className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                    {search.location && `📍 ${search.location}`}
                    {search.location && search.date && ' • '}
                    {search.date && `📅 ${search.date}`}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }
}

// Autocomplete demonstration
export const AutocompleteDemo = {
  render: () => {
    const [value, setValue] = useState('New')
    const [date, setDate] = useState('')

    return (
      <div className="max-w-2xl mx-auto bg-gray-50 p-6">
        <SearchBar
          value={value}
          date={date}
          onValueChange={setValue}
          onDateChange={setDate}
          onSubmit={() => console.log('Search submitted')}
          isLoading={false}
          placeholder="Start typing to see suggestions..."
        />

        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
          <p className="text-blue-800">
            <strong>Autocomplete Demo:</strong> Type "New", "Los", "Chi", or any city name
            to see autocomplete suggestions appear. Click a suggestion to select it.
          </p>
        </div>
      </div>
    )
  }
}

// Focus states
export const FocusStates = {
  render: () => {
    return (
      <div className="max-w-2xl mx-auto bg-gray-50 p-6 space-y-8">
        <div>
          <h4 className="font-medium mb-3">Normal State</h4>
          <SearchBar
            value=""
            date=""
            onValueChange={() => {}}
            onDateChange={() => {}}
            onSubmit={() => {}}
            placeholder="Click to focus location input"
          />
        </div>

        <div>
          <h4 className="font-medium mb-3">With Content</h4>
          <SearchBar
            value="San Francisco, CA"
            date="2024-08-15"
            onValueChange={() => {}}
            onDateChange={() => {}}
            onSubmit={() => {}}
            placeholder="ZIP code or city"
          />
        </div>
      </div>
    )
  }
}

// Responsive behavior
export const ResponsiveBehavior = {
  render: () => {
    const [value, setValue] = useState('Chicago, IL')
    const [date, setDate] = useState('2024-09-10')

    return (
      <div className="space-y-8">
        <div>
          <h3 className="text-lg font-semibold mb-4">Mobile (375px)</h3>
          <div className="w-[375px] mx-auto bg-gray-50 p-4">
            <SearchBar
              value={value}
              date={date}
              onValueChange={setValue}
              onDateChange={setDate}
              onSubmit={() => {}}
              placeholder="ZIP or city"
            />
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4">Tablet (768px)</h3>
          <div className="w-[768px] mx-auto bg-gray-50 p-4">
            <SearchBar
              value={value}
              date={date}
              onValueChange={setValue}
              onDateChange={setDate}
              onSubmit={() => {}}
              placeholder="ZIP code or city"
            />
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4">Desktop (1200px)</h3>
          <div className="w-[1200px] mx-auto bg-gray-50 p-4">
            <SearchBar
              value={value}
              date={date}
              onValueChange={setValue}
              onDateChange={setDate}
              onSubmit={() => {}}
              placeholder="ZIP code or city"
            />
          </div>
        </div>
      </div>
    )
  }
}

// Popular searches demo
export const PopularSearchesDemo = {
  render: () => {
    const [value, setValue] = useState('')
    const [date, setDate] = useState('')
    const [clickedCity, setClickedCity] = useState('')

    const handleSubmit = () => {
      if (value) {
        setClickedCity(`Searched for: ${value}`)
      }
    }

    return (
      <div className="max-w-2xl mx-auto bg-gray-50 p-6">
        <SearchBar
          value={value}
          date={date}
          onValueChange={setValue}
          onDateChange={setDate}
          onSubmit={handleSubmit}
          placeholder="Try clicking popular searches below"
        />

        {clickedCity && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm">
            <p className="text-green-800">{clickedCity}</p>
          </div>
        )}

        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm">
          <p className="text-yellow-800">
            <strong>Popular Searches Demo:</strong> Click any of the popular search links
            below the search bar to see how they auto-fill the location and trigger search.
          </p>
        </div>
      </div>
    )
  }
}

// Error handling and edge cases
export const ErrorHandling = {
  render: () => {
    const [value, setValue] = useState('')
    const [date, setDate] = useState('')

    return (
      <div className="max-w-2xl mx-auto bg-gray-50 p-6 space-y-6">
        <div>
          <h4 className="font-medium mb-3">Normal Input</h4>
          <SearchBar
            value={value}
            date={date}
            onValueChange={setValue}
            onDateChange={setDate}
            onSubmit={() => {}}
            placeholder="Type normally here"
          />
        </div>

        <div>
          <h4 className="font-medium mb-3">Very Long Input</h4>
          <SearchBar
            value="This is an extremely long location name that should handle gracefully without breaking the layout or user experience"
            date="2024-12-31"
            onValueChange={() => {}}
            onDateChange={() => {}}
            onSubmit={() => {}}
            placeholder="Long text handling"
          />
        </div>

        <div>
          <h4 className="font-medium mb-3">Special Characters</h4>
          <SearchBar
            value="São Paulo, SP & México City"
            date=""
            onValueChange={() => {}}
            onDateChange={() => {}}
            onSubmit={() => {}}
            placeholder="Special characters test"
          />
        </div>

        <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg text-sm">
          <p className="text-orange-800">
            <strong>Error Handling Demo:</strong> Component gracefully handles long text,
            special characters, and maintains responsive layout integrity.
          </p>
        </div>
      </div>
    )
  }
}

// Accessibility demonstration
export const AccessibilityDemo = {
  render: () => {
    const [value, setValue] = useState('')
    const [date, setDate] = useState('')

    return (
      <div className="max-w-2xl mx-auto bg-gray-50 p-6">
        <SearchBar
          value={value}
          date={date}
          onValueChange={setValue}
          onDateChange={setDate}
          onSubmit={() => console.log('Accessible search submitted')}
          placeholder="Fully accessible search"
        />

        <div className="mt-6 text-sm text-gray-600">
          <p><strong>Accessibility features:</strong></p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Keyboard navigation through all form fields</li>
            <li>ARIA labels for screen readers (aria-label, aria-expanded)</li>
            <li>Proper form structure with semantic HTML</li>
            <li>Focus management and visible focus indicators</li>
            <li>Escape key to close autocomplete suggestions</li>
            <li>Clear buttons with descriptive labels</li>
            <li>Date input with min date validation</li>
            <li>Autocomplete suggestions with proper ARIA roles</li>
          </ul>

          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800 text-xs">
              <strong>Test with keyboard:</strong> Tab through inputs, use arrows in date picker,
              type in location for autocomplete, press Escape to close suggestions.
            </p>
          </div>
        </div>
      </div>
    )
  }
}

// Performance showcase
export const PerformanceShowcase = {
  render: () => {
    const [value, setValue] = useState('')
    const [date, setDate] = useState('')
    const [renderCount, setRenderCount] = useState(0)

    // Track renders
    React.useEffect(() => {
      setRenderCount(prev => prev + 1)
    })

    return (
      <div className="max-w-2xl mx-auto bg-gray-50 p-6">
        <SearchBar
          value={value}
          date={date}
          onValueChange={setValue}
          onDateChange={setDate}
          onSubmit={() => console.log('Performance test search')}
          placeholder="Type to test performance"
        />

        <div className="mt-6 p-4 bg-white rounded-lg">
          <h4 className="font-medium text-gray-900 mb-3">Performance Metrics:</h4>
          <div className="space-y-2 text-sm">
            <p><strong>Component renders:</strong> {renderCount}</p>
            <p><strong>Input length:</strong> {value.length} characters</p>
          </div>

          <div className="mt-4 p-3 bg-gray-50 rounded text-xs text-gray-600">
            <p><strong>Optimizations:</strong></p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>Debounced autocomplete suggestions</li>
              <li>Efficient re-renders with proper memoization</li>
              <li>Framer Motion animations with GPU acceleration</li>
              <li>Click outside detection with cleanup</li>
            </ul>
          </div>
        </div>
      </div>
    )
  }
}

// Dark mode (if supported)
export const DarkMode = Template.bind({})
DarkMode.args = {
  value: 'Boston, MA',
  date: '2024-10-15',
  isLoading: false,
  placeholder: 'ZIP code or city'
}
DarkMode.decorators = [
  (Story) => (
    <div className="dark bg-gray-900 p-6">
      <div className="max-w-2xl mx-auto">
        <Story />
      </div>
    </div>
  )
]