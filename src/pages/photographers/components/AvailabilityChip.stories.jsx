/**
 * Storybook Stories for AvailabilityChip Component
 * Visual documentation and testing for photographer availability indicators
 */

import AvailabilityChip, { AvailabilityDot, getAvailabilityLevel } from './AvailabilityChip'

// Default export for Storybook
export default {
  title: 'Photographers/AvailabilityChip',
  component: AvailabilityChip,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Color-coded availability indicators for photographers with configurable sizes, labels, and icon display options.'
      }
    }
  },
  argTypes: {
    level: {
      description: 'Availability level',
      control: 'radio',
      options: ['high', 'medium', 'low', 'unknown']
    },
    showIcon: {
      description: 'Show calendar icon',
      control: 'boolean'
    },
    showLabel: {
      description: 'Show text label',
      control: 'boolean'
    },
    size: {
      description: 'Component size',
      control: 'radio',
      options: ['sm', 'md', 'lg']
    }
  },
  subcomponents: { AvailabilityDot }
}

// Template for static stories
const Template = (args) => <AvailabilityChip {...args} />

// Default story
export const Default = Template.bind({})
Default.args = {
  level: 'high',
  showIcon: false,
  showLabel: true,
  size: 'sm'
}

// High availability
export const HighAvailability = Template.bind({})
HighAvailability.args = {
  level: 'high',
  showIcon: false,
  showLabel: true,
  size: 'sm'
}
HighAvailability.parameters = {
  docs: {
    description: {
      story: 'Green chip indicating high availability - photographer is readily available for bookings.'
    }
  }
}

// Medium availability
export const MediumAvailability = Template.bind({})
MediumAvailability.args = {
  level: 'medium',
  showIcon: false,
  showLabel: true,
  size: 'sm'
}

// Low availability
export const LowAvailability = Template.bind({})
LowAvailability.args = {
  level: 'low',
  showIcon: false,
  showLabel: true,
  size: 'sm'
}

// Unknown availability
export const UnknownAvailability = Template.bind({})
UnknownAvailability.args = {
  level: 'unknown',
  showIcon: false,
  showLabel: true,
  size: 'sm'
}

// With icon
export const WithIcon = Template.bind({})
WithIcon.args = {
  level: 'high',
  showIcon: true,
  showLabel: true,
  size: 'md'
}

// Without label
export const WithoutLabel = Template.bind({})
WithoutLabel.args = {
  level: 'medium',
  showIcon: false,
  showLabel: false,
  size: 'sm'
}

// Large size
export const LargeSize = Template.bind({})
LargeSize.args = {
  level: 'high',
  showIcon: true,
  showLabel: true,
  size: 'lg'
}

// All levels comparison
export const AllLevels = {
  render: () => (
    <div className="space-y-6 max-w-md mx-auto bg-gray-50 p-6">
      <h3 className="font-semibold">Availability Levels</h3>

      <div className="bg-white p-4 rounded-lg space-y-3">
        <div className="flex items-center justify-between">
          <AvailabilityChip level="high" />
          <span className="text-sm text-gray-600">Readily available</span>
        </div>

        <div className="flex items-center justify-between">
          <AvailabilityChip level="medium" />
          <span className="text-sm text-gray-600">Limited availability</span>
        </div>

        <div className="flex items-center justify-between">
          <AvailabilityChip level="low" />
          <span className="text-sm text-gray-600">Busy/booked</span>
        </div>

        <div className="flex items-center justify-between">
          <AvailabilityChip level="unknown" />
          <span className="text-sm text-gray-600">Status unclear</span>
        </div>
      </div>
    </div>
  )
}

// Size variations
export const SizeVariations = {
  render: () => (
    <div className="space-y-6 max-w-md mx-auto bg-gray-50 p-6">
      <h3 className="font-semibold">Size Variations</h3>

      <div className="bg-white p-4 rounded-lg space-y-4">
        <div>
          <h4 className="font-medium mb-2">Small (sm)</h4>
          <div className="flex items-center gap-3">
            <AvailabilityChip level="high" size="sm" />
            <AvailabilityChip level="medium" size="sm" />
            <AvailabilityChip level="low" size="sm" />
            <AvailabilityChip level="unknown" size="sm" />
          </div>
        </div>

        <div>
          <h4 className="font-medium mb-2">Medium (md)</h4>
          <div className="flex items-center gap-3">
            <AvailabilityChip level="high" size="md" />
            <AvailabilityChip level="medium" size="md" />
            <AvailabilityChip level="low" size="md" />
            <AvailabilityChip level="unknown" size="md" />
          </div>
        </div>

        <div>
          <h4 className="font-medium mb-2">Large (lg)</h4>
          <div className="flex items-center gap-3">
            <AvailabilityChip level="high" size="lg" />
            <AvailabilityChip level="medium" size="lg" />
            <AvailabilityChip level="low" size="lg" />
            <AvailabilityChip level="unknown" size="lg" />
          </div>
        </div>
      </div>
    </div>
  )
}

// Icon variations
export const IconVariations = {
  render: () => (
    <div className="space-y-6 max-w-md mx-auto bg-gray-50 p-6">
      <h3 className="font-semibold">Icon Variations</h3>

      <div className="bg-white p-4 rounded-lg space-y-4">
        <div>
          <h4 className="font-medium mb-2">Without Icon</h4>
          <div className="flex items-center gap-3">
            <AvailabilityChip level="high" showIcon={false} size="md" />
            <AvailabilityChip level="medium" showIcon={false} size="md" />
          </div>
        </div>

        <div>
          <h4 className="font-medium mb-2">With Icon</h4>
          <div className="flex items-center gap-3">
            <AvailabilityChip level="high" showIcon={true} size="md" />
            <AvailabilityChip level="medium" showIcon={true} size="md" />
          </div>
        </div>
      </div>
    </div>
  )
}

// Label variations
export const LabelVariations = {
  render: () => (
    <div className="space-y-6 max-w-md mx-auto bg-gray-50 p-6">
      <h3 className="font-semibold">Label Variations</h3>

      <div className="bg-white p-4 rounded-lg space-y-4">
        <div>
          <h4 className="font-medium mb-2">Small Size (Short Labels)</h4>
          <div className="flex items-center gap-3">
            <AvailabilityChip level="high" size="sm" showLabel={true} />
            <AvailabilityChip level="medium" size="sm" showLabel={true} />
            <AvailabilityChip level="low" size="sm" showLabel={true} />
            <AvailabilityChip level="unknown" size="sm" showLabel={true} />
          </div>
        </div>

        <div>
          <h4 className="font-medium mb-2">Large Size (Full Labels)</h4>
          <div className="flex items-center gap-3 flex-wrap">
            <AvailabilityChip level="high" size="lg" showLabel={true} />
            <AvailabilityChip level="medium" size="lg" showLabel={true} />
            <AvailabilityChip level="low" size="lg" showLabel={true} />
            <AvailabilityChip level="unknown" size="lg" showLabel={true} />
          </div>
        </div>

        <div>
          <h4 className="font-medium mb-2">No Labels (Dot Only)</h4>
          <div className="flex items-center gap-3">
            <AvailabilityChip level="high" size="md" showLabel={false} />
            <AvailabilityChip level="medium" size="md" showLabel={false} />
            <AvailabilityChip level="low" size="md" showLabel={false} />
            <AvailabilityChip level="unknown" size="md" showLabel={false} />
          </div>
        </div>
      </div>
    </div>
  )
}

// AvailabilityDot component showcase
export const AvailabilityDots = {
  render: () => (
    <div className="space-y-6 max-w-md mx-auto bg-gray-50 p-6">
      <h3 className="font-semibold">Availability Dots (Minimal)</h3>

      <div className="bg-white p-4 rounded-lg space-y-4">
        <div>
          <h4 className="font-medium mb-2">Small Dots</h4>
          <div className="flex items-center gap-3">
            <AvailabilityDot level="high" size="sm" />
            <AvailabilityDot level="medium" size="sm" />
            <AvailabilityDot level="low" size="sm" />
            <AvailabilityDot level="unknown" size="sm" />
          </div>
        </div>

        <div>
          <h4 className="font-medium mb-2">Medium Dots</h4>
          <div className="flex items-center gap-3">
            <AvailabilityDot level="high" size="md" />
            <AvailabilityDot level="medium" size="md" />
            <AvailabilityDot level="low" size="md" />
            <AvailabilityDot level="unknown" size="md" />
          </div>
        </div>

        <div>
          <h4 className="font-medium mb-2">Large Dots</h4>
          <div className="flex items-center gap-3">
            <AvailabilityDot level="high" size="lg" />
            <AvailabilityDot level="medium" size="lg" />
            <AvailabilityDot level="low" size="lg" />
            <AvailabilityDot level="unknown" size="lg" />
          </div>
        </div>
      </div>
    </div>
  )
}

// getAvailabilityLevel utility demo
export const UtilityFunction = {
  render: () => {
    const testCases = [
      { percentage: 90, bookings: null, description: '90% availability' },
      { percentage: 75, bookings: null, description: '75% availability' },
      { percentage: 45, bookings: null, description: '45% availability' },
      { percentage: 10, bookings: null, description: '10% availability' },
      { percentage: null, bookings: 1, description: '1 recent booking' },
      { percentage: null, bookings: 3, description: '3 recent bookings' },
      { percentage: null, bookings: 8, description: '8 recent bookings' },
      { percentage: null, bookings: null, description: 'No data available' }
    ]

    return (
      <div className="space-y-6 max-w-2xl mx-auto bg-gray-50 p-6">
        <h3 className="font-semibold">getAvailabilityLevel() Utility Function</h3>

        <div className="bg-white p-4 rounded-lg">
          <h4 className="font-medium mb-3">Test Cases</h4>
          <div className="space-y-3">
            {testCases.map((testCase, index) => {
              const level = getAvailabilityLevel(testCase.percentage, testCase.bookings)
              return (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AvailabilityChip level={level} />
                    <span className="text-sm text-gray-600">{testCase.description}</span>
                  </div>
                  <span className="text-xs text-gray-500 font-mono">
                    {level}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-800 mb-2">Logic Explanation</h4>
          <div className="text-sm text-blue-700 space-y-1">
            <p><strong>Percentage-based:</strong> ≥80% = high, ≥50% = medium, ≥20% = low, &lt;20% = unknown</p>
            <p><strong>Booking-based:</strong> ≤2 = high, ≤5 = medium, &gt;5 = low</p>
            <p><strong>Priority:</strong> Percentage takes precedence over booking count</p>
          </div>
        </div>
      </div>
    )
  }
}

// Real-world usage examples
export const RealWorldExamples = {
  render: () => (
    <div className="space-y-6 max-w-2xl mx-auto bg-gray-50 p-6">
      <h3 className="font-semibold">Real World Usage Examples</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-lg">
          <h4 className="font-medium mb-3">In Photographer Cards</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Sarah Johnson</span>
              <AvailabilityChip level="high" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Mike Chen</span>
              <AvailabilityChip level="medium" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Lisa Park</span>
              <AvailabilityChip level="low" />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg">
          <h4 className="font-medium mb-3">In Lists (Compact)</h4>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <AvailabilityDot level="high" />
              <span className="text-sm">Available photographers</span>
            </div>
            <div className="flex items-center gap-2">
              <AvailabilityDot level="medium" />
              <span className="text-sm">Limited availability</span>
            </div>
            <div className="flex items-center gap-2">
              <AvailabilityDot level="low" />
              <span className="text-sm">Busy this week</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg">
          <h4 className="font-medium mb-3">With Icons (Calendar)</h4>
          <div className="space-y-3">
            <AvailabilityChip level="high" showIcon={true} size="md" />
            <AvailabilityChip level="medium" showIcon={true} size="md" />
            <AvailabilityChip level="low" showIcon={true} size="md" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg">
          <h4 className="font-medium mb-3">Tooltip Info</h4>
          <div className="space-y-3">
            <div title="High Availability">
              <AvailabilityChip level="high" showLabel={false} />
            </div>
            <div title="Medium Availability">
              <AvailabilityChip level="medium" showLabel={false} />
            </div>
            <div title="Low Availability">
              <AvailabilityChip level="low" showLabel={false} />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">Hover to see tooltips</p>
        </div>
      </div>
    </div>
  )
}

// Accessibility demonstration
export const AccessibilityDemo = {
  render: () => (
    <div className="max-w-md mx-auto bg-gray-50 p-6">
      <h3 className="font-semibold mb-4">Accessibility Features</h3>

      <div className="bg-white p-4 rounded-lg space-y-4">
        <AvailabilityChip level="high" />
        <AvailabilityChip level="medium" />
        <AvailabilityChip level="low" />
        <AvailabilityChip level="unknown" />
      </div>

      <div className="mt-6 text-sm text-gray-600">
        <p><strong>Accessibility features:</strong></p>
        <ul className="list-disc list-inside mt-2 space-y-1">
          <li>Semantic HTML with proper color contrast</li>
          <li>Title attributes for screen reader compatibility</li>
          <li>Color coding supplemented with text labels</li>
          <li>Consistent visual hierarchy and sizing</li>
          <li>WCAG AA compliant color combinations</li>
          <li>No reliance on color alone for information</li>
        </ul>

        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-800 text-xs">
            <strong>Screen reader friendly:</strong> Each chip includes a descriptive title
            and combines color coding with text labels for accessibility.
          </p>
        </div>
      </div>
    </div>
  )
}

// Performance showcase
export const PerformanceShowcase = {
  render: () => {
    const [renderCount, setRenderCount] = React.useState(0)

    // Track renders
    React.useEffect(() => {
      setRenderCount(prev => prev + 1)
    })

    return (
      <div className="max-w-md mx-auto bg-gray-50 p-6">
        <div className="bg-white p-4 rounded-lg space-y-3">
          <AvailabilityChip level="high" />
          <AvailabilityChip level="medium" />
          <AvailabilityChip level="low" />
          <AvailabilityChip level="unknown" />
        </div>

        <div className="mt-6 p-4 bg-white rounded-lg">
          <h4 className="font-medium text-gray-900 mb-3">Performance Metrics:</h4>
          <div className="space-y-2 text-sm">
            <p><strong>Component renders:</strong> {renderCount}</p>
            <p><strong>Configuration lookup:</strong> O(1) constant time</p>
            <p><strong>DOM elements:</strong> Minimal with efficient classes</p>
          </div>

          <div className="mt-4 p-3 bg-gray-50 rounded text-xs text-gray-600">
            <p><strong>Optimizations:</strong></p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>Static configuration object for fast lookups</li>
              <li>Minimal DOM with efficient class composition</li>
              <li>No JavaScript animations or complex state</li>
              <li>Consistent prop types for predictable rendering</li>
            </ul>
          </div>
        </div>
      </div>
    )
  }
}