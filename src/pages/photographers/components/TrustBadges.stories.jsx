/**
 * Storybook Stories for TrustBadges Component
 * Visual documentation and testing for trust metrics display components
 */

import { TrustBadge, TrustBadges } from './TrustBadges'

// Default export for Storybook
export default {
  title: 'Photographers/TrustBadges',
  component: TrustBadges,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Trust metrics display components for showing photographer bookings, response time, and acceptance rate with color-coded performance indicators.'
      }
    }
  },
  subcomponents: { TrustBadge }
}

// Template for static stories
const Template = (args) => <TrustBadges {...args} />

// Default story with all metrics
export const Default = Template.bind({})
Default.args = {
  totalBookings: 25,
  avgResponseTimeMinutes: 45,
  acceptanceRate: 0.88,
  layout: 'horizontal'
}

// High performance metrics
export const HighPerformance = Template.bind({})
HighPerformance.args = {
  totalBookings: 156,
  avgResponseTimeMinutes: 15,
  acceptanceRate: 0.96,
  layout: 'horizontal'
}
HighPerformance.parameters = {
  docs: {
    description: {
      story: 'Trust badges showing high-performance metrics with green color indicators for excellent values.'
    }
  }
}

// Medium performance metrics
export const MediumPerformance = Template.bind({})
MediumPerformance.args = {
  totalBookings: 18,
  avgResponseTimeMinutes: 75,
  acceptanceRate: 0.75,
  layout: 'horizontal'
}

// Lower performance metrics
export const LowerPerformance = Template.bind({})
LowerPerformance.args = {
  totalBookings: 3,
  avgResponseTimeMinutes: 180,
  acceptanceRate: 0.60,
  layout: 'horizontal'
}

// Vertical layout
export const VerticalLayout = Template.bind({})
VerticalLayout.args = {
  totalBookings: 42,
  avgResponseTimeMinutes: 30,
  acceptanceRate: 0.91,
  layout: 'vertical'
}

// Partial data (missing some metrics)
export const PartialData = Template.bind({})
PartialData.args = {
  totalBookings: 12,
  avgResponseTimeMinutes: null,
  acceptanceRate: 0.85,
  layout: 'horizontal'
}

// Only one metric
export const SingleMetric = Template.bind({})
SingleMetric.args = {
  totalBookings: null,
  avgResponseTimeMinutes: null,
  acceptanceRate: 0.92,
  layout: 'horizontal'
}

// Zero values (should display)
export const ZeroValues = Template.bind({})
ZeroValues.args = {
  totalBookings: 0,
  avgResponseTimeMinutes: 0,
  acceptanceRate: 0,
  layout: 'horizontal'
}

// All null values (should not render)
export const AllNullValues = Template.bind({})
AllNullValues.args = {
  totalBookings: null,
  avgResponseTimeMinutes: null,
  acceptanceRate: null,
  layout: 'horizontal'
}

// Individual TrustBadge stories
export const IndividualBadges = {
  render: () => (
    <div className="space-y-8 max-w-md mx-auto bg-gray-50 p-6">
      <div>
        <h3 className="font-semibold mb-4">Bookings Badge Variations</h3>
        <div className="space-y-3">
          <TrustBadge type="bookings" value={1} />
          <TrustBadge type="bookings" value={5} />
          <TrustBadge type="bookings" value={25} />
          <TrustBadge type="bookings" value={67} />
          <TrustBadge type="bookings" value={156} />
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-4">Response Time Badge Variations</h3>
        <div className="space-y-3">
          <TrustBadge type="response" value={15} />
          <TrustBadge type="response" value={30} />
          <TrustBadge type="response" value={60} />
          <TrustBadge type="response" value={120} />
          <TrustBadge type="response" value={180} />
          <TrustBadge type="response" value={360} />
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-4">Acceptance Rate Badge Variations</h3>
        <div className="space-y-3">
          <TrustBadge type="acceptance" value={0.45} />
          <TrustBadge type="acceptance" value={0.65} />
          <TrustBadge type="acceptance" value={0.78} />
          <TrustBadge type="acceptance" value={0.89} />
          <TrustBadge type="acceptance" value={0.95} />
          <TrustBadge type="acceptance" value={1.0} />
        </div>
      </div>
    </div>
  )
}

// Color coding demonstration
export const ColorCodingDemo = {
  render: () => (
    <div className="space-y-8 max-w-2xl mx-auto bg-gray-50 p-6">
      <div>
        <h3 className="font-semibold mb-4">Color Coding Logic</h3>

        <div className="space-y-6">
          <div className="bg-white p-4 rounded-lg">
            <h4 className="font-medium mb-3">Bookings (Events)</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <TrustBadge type="bookings" value={2} />
                <span className="text-sm text-gray-600">&lt; 10 events (Gray)</span>
              </div>
              <div className="flex items-center justify-between">
                <TrustBadge type="bookings" value={25} />
                <span className="text-sm text-gray-600">10-49 events (Purple)</span>
              </div>
              <div className="flex items-center justify-between">
                <TrustBadge type="bookings" value={67} />
                <span className="text-sm text-gray-600">≥ 50 events (Blue)</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg">
            <h4 className="font-medium mb-3">Response Time</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <TrustBadge type="response" value={20} />
                <span className="text-sm text-gray-600">≤ 30 min (Green - Fast)</span>
              </div>
              <div className="flex items-center justify-between">
                <TrustBadge type="response" value={75} />
                <span className="text-sm text-gray-600">31-120 min (Yellow - Medium)</span>
              </div>
              <div className="flex items-center justify-between">
                <TrustBadge type="response" value={180} />
                <span className="text-sm text-gray-600">&gt; 120 min (Gray - Slow)</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg">
            <h4 className="font-medium mb-3">Acceptance Rate</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <TrustBadge type="acceptance" value={0.95} />
                <span className="text-sm text-gray-600">≥ 90% (Green - Excellent)</span>
              </div>
              <div className="flex items-center justify-between">
                <TrustBadge type="acceptance" value={0.78} />
                <span className="text-sm text-gray-600">70-89% (Yellow - Good)</span>
              </div>
              <div className="flex items-center justify-between">
                <TrustBadge type="acceptance" value={0.55} />
                <span className="text-sm text-gray-600">&lt; 70% (Gray - Needs Improvement)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Layout comparison
export const LayoutComparison = {
  render: () => (
    <div className="space-y-8 max-w-2xl mx-auto bg-gray-50 p-6">
      <div>
        <h3 className="font-semibold mb-4">Horizontal Layout (Default)</h3>
        <div className="bg-white p-4 rounded-lg">
          <TrustBadges
            totalBookings={42}
            avgResponseTimeMinutes={30}
            acceptanceRate={0.89}
            layout="horizontal"
          />
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-4">Vertical Layout</h3>
        <div className="bg-white p-4 rounded-lg">
          <TrustBadges
            totalBookings={42}
            avgResponseTimeMinutes={30}
            acceptanceRate={0.89}
            layout="vertical"
          />
        </div>
      </div>
    </div>
  )
}

// Custom labels demo
export const CustomLabels = {
  render: () => (
    <div className="space-y-6 max-w-md mx-auto bg-gray-50 p-6">
      <div>
        <h3 className="font-semibold mb-4">Default Labels</h3>
        <div className="bg-white p-4 rounded-lg space-y-3">
          <TrustBadge type="bookings" value={25} />
          <TrustBadge type="response" value={45} />
          <TrustBadge type="acceptance" value={0.88} />
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-4">Custom Labels</h3>
        <div className="bg-white p-4 rounded-lg space-y-3">
          <TrustBadge type="bookings" value={25} label="Shoots" />
          <TrustBadge type="response" value={45} label="Reply Time" />
          <TrustBadge type="acceptance" value={0.88} label="Acceptance" />
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-4">No Labels</h3>
        <div className="bg-white p-4 rounded-lg space-y-3">
          <TrustBadge type="bookings" value={25} label="" />
          <TrustBadge type="response" value={45} label="" />
          <TrustBadge type="acceptance" value={0.88} label="" />
        </div>
      </div>
    </div>
  )
}

// Edge cases and error handling
export const EdgeCases = {
  render: () => (
    <div className="space-y-6 max-w-md mx-auto bg-gray-50 p-6">
      <div>
        <h3 className="font-semibold mb-4">Edge Cases</h3>

        <div className="space-y-4">
          <div className="bg-white p-4 rounded-lg">
            <h4 className="font-medium mb-2">Very Large Numbers</h4>
            <div className="space-y-2">
              <TrustBadge type="bookings" value={9999} />
              <TrustBadge type="response" value={10000} />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg">
            <h4 className="font-medium mb-2">Decimal Values</h4>
            <div className="space-y-2">
              <TrustBadge type="bookings" value={5.7} />
              <TrustBadge type="acceptance" value={0.876} />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg">
            <h4 className="font-medium mb-2">Zero Values (Should Display)</h4>
            <div className="space-y-2">
              <TrustBadge type="bookings" value={0} />
              <TrustBadge type="response" value={0} />
              <TrustBadge type="acceptance" value={0} />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg">
            <h4 className="font-medium mb-2">Null/Undefined Values (Hidden)</h4>
            <div className="space-y-2">
              <TrustBadge type="bookings" value={null} />
              <TrustBadge type="response" value={undefined} />
              <div className="text-sm text-gray-500 italic">
                ↑ These badges don't render (null/undefined values)
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Real-world examples
export const RealWorldExamples = {
  render: () => (
    <div className="space-y-6 max-w-2xl mx-auto bg-gray-50 p-6">
      <h3 className="font-semibold mb-4">Real World Examples</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-lg">
          <h4 className="font-medium mb-3">New Photographer</h4>
          <TrustBadges
            totalBookings={2}
            avgResponseTimeMinutes={120}
            acceptanceRate={0.75}
            layout="vertical"
          />
        </div>

        <div className="bg-white p-4 rounded-lg">
          <h4 className="font-medium mb-3">Experienced Professional</h4>
          <TrustBadges
            totalBookings={187}
            avgResponseTimeMinutes={25}
            acceptanceRate={0.94}
            layout="vertical"
          />
        </div>

        <div className="bg-white p-4 rounded-lg">
          <h4 className="font-medium mb-3">Busy But Selective</h4>
          <TrustBadges
            totalBookings={89}
            avgResponseTimeMinutes={180}
            acceptanceRate={0.45}
            layout="vertical"
          />
        </div>

        <div className="bg-white p-4 rounded-lg">
          <h4 className="font-medium mb-3">Fast Responder</h4>
          <TrustBadges
            totalBookings={34}
            avgResponseTimeMinutes={5}
            acceptanceRate={0.89}
            layout="vertical"
          />
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
        <TrustBadges
          totalBookings={42}
          avgResponseTimeMinutes={30}
          acceptanceRate={0.89}
          layout="horizontal"
        />

        <div className="mt-6 p-4 bg-white rounded-lg">
          <h4 className="font-medium text-gray-900 mb-3">Performance Metrics:</h4>
          <div className="space-y-2 text-sm">
            <p><strong>Component renders:</strong> {renderCount}</p>
            <p><strong>Null handling:</strong> Efficient filtering</p>
            <p><strong>Color calculation:</strong> Inline for performance</p>
          </div>

          <div className="mt-4 p-3 bg-gray-50 rounded text-xs text-gray-600">
            <p><strong>Optimizations:</strong></p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>Null values filtered before rendering</li>
              <li>Inline color logic without extra calculations</li>
              <li>Minimal DOM with efficient class composition</li>
              <li>No unnecessary re-renders with proper props</li>
            </ul>
          </div>
        </div>
      </div>
    )
  }
}