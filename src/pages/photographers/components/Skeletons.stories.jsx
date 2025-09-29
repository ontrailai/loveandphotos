/**
 * Storybook Stories for Skeletons Component
 * Visual documentation and testing for loading states with shimmer animations
 */

import { useState } from 'react'
import Skeletons, { CardSkeleton, RowSkeleton, FilterSkeleton } from './Skeletons'

// Default export for Storybook
export default {
  title: 'Photographers/Skeletons',
  component: Skeletons,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Loading skeleton components with shimmer animations for photographer cards, rows, and filters during data fetching.'
      }
    }
  },
  argTypes: {
    count: {
      description: 'Number of skeleton items to render',
      control: { type: 'range', min: 1, max: 12, step: 1 }
    },
    viewMode: {
      description: 'Layout mode for skeletons',
      control: 'radio',
      options: ['grid', 'list', 'filter']
    }
  },
  subcomponents: { CardSkeleton, RowSkeleton, FilterSkeleton }
}

// Template for static stories
const Template = (args) => <Skeletons {...args} />

// Default story - grid view
export const Default = Template.bind({})
Default.args = {
  count: 6,
  viewMode: 'grid'
}

// Grid view with different counts
export const GridView = Template.bind({})
GridView.args = {
  count: 9,
  viewMode: 'grid'
}
GridView.parameters = {
  docs: {
    description: {
      story: 'Grid layout skeleton loading state with shimmer animation for photographer cards.'
    }
  }
}

// List view
export const ListView = Template.bind({})
ListView.args = {
  count: 5,
  viewMode: 'list'
}

// Filter skeleton
export const FilterView = Template.bind({})
FilterView.args = {
  viewMode: 'filter'
}

// Small count
export const SmallCount = Template.bind({})
SmallCount.args = {
  count: 3,
  viewMode: 'grid'
}

// Large count
export const LargeCount = Template.bind({})
LargeCount.args = {
  count: 12,
  viewMode: 'grid'
}

// Individual skeleton components
export const IndividualSkeletons = {
  render: () => (
    <div className="space-y-8 max-w-4xl mx-auto bg-gray-50 p-6">
      <div>
        <h3 className="font-semibold mb-4">Card Skeleton (Grid View)</h3>
        <div className="max-w-sm">
          <CardSkeleton />
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-4">Row Skeleton (List View)</h3>
        <div className="max-w-2xl">
          <RowSkeleton />
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-4">Filter Skeleton</h3>
        <div className="max-w-sm">
          <FilterSkeleton />
        </div>
      </div>
    </div>
  )
}

// View mode comparison
export const ViewModeComparison = {
  render: () => (
    <div className="space-y-8 bg-gray-50 p-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Grid View Skeletons</h3>
        <Skeletons count={6} viewMode="grid" />
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">List View Skeletons</h3>
        <Skeletons count={4} viewMode="list" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1">
          <h3 className="text-lg font-semibold mb-4">Filter Skeleton</h3>
          <Skeletons viewMode="filter" />
        </div>
        <div className="lg:col-span-3">
          <h3 className="text-lg font-semibold mb-4">Grid Content</h3>
          <Skeletons count={6} viewMode="grid" />
        </div>
      </div>
    </div>
  )
}

// Animation showcase
export const AnimationShowcase = {
  render: () => {
    const [key, setKey] = useState(0)

    return (
      <div className="max-w-4xl mx-auto bg-gray-50 p-6">
        <div className="mb-6 text-center">
          <button
            onClick={() => setKey(prev => prev + 1)}
            className="px-4 py-2 bg-[#FF4D6D] text-white rounded-lg hover:bg-[#FF4D6D]/90"
          >
            Replay Entrance Animation
          </button>
        </div>

        <Skeletons key={key} count={6} viewMode="grid" />

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-800 mb-2">Animation Features</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• <strong>Entrance Animation:</strong> Staggered fade-in with 0.1s delay between items</li>
            <li>• <strong>Shimmer Effect:</strong> Continuous gradient animation simulating content loading</li>
            <li>• <strong>Performance:</strong> GPU-accelerated with Framer Motion</li>
            <li>• <strong>Responsive:</strong> Maintains smooth animation across all device sizes</li>
          </ul>
        </div>
      </div>
    )
  }
}

// Interactive loading demo
export const InteractiveLoadingDemo = {
  render: () => {
    const [isLoading, setIsLoading] = useState(true)
    const [viewMode, setViewMode] = useState('grid')
    const [count, setCount] = useState(6)

    const toggleLoading = () => {
      setIsLoading(prev => !prev)
    }

    const startLoading = () => {
      setIsLoading(true)
      // Simulate loading time
      setTimeout(() => setIsLoading(false), 3000)
    }

    return (
      <div className="max-w-4xl mx-auto bg-gray-50 p-6">
        <div className="mb-6 flex flex-wrap gap-3">
          <button
            onClick={toggleLoading}
            className={`px-4 py-2 rounded-lg text-white ${
              isLoading
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-green-500 hover:bg-green-600'
            }`}
          >
            {isLoading ? 'Stop Loading' : 'Start Loading'}
          </button>

          <button
            onClick={startLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Simulate 3s Load
          </button>

          <select
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="grid">Grid View</option>
            <option value="list">List View</option>
            <option value="filter">Filter View</option>
          </select>

          <input
            type="range"
            min="1"
            max="12"
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            className="px-3 py-2"
          />
          <span className="px-3 py-2 text-sm text-gray-600">Count: {count}</span>
        </div>

        {isLoading ? (
          <Skeletons count={count} viewMode={viewMode} />
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Content Loaded!</h3>
            <p className="text-gray-600">This is where the actual photographer data would appear.</p>
          </div>
        )}
      </div>
    )
  }
}

// Count variations
export const CountVariations = {
  render: () => (
    <div className="space-y-8 bg-gray-50 p-6">
      <div>
        <h3 className="font-semibold mb-4">Single Item (count: 1)</h3>
        <Skeletons count={1} viewMode="grid" />
      </div>

      <div>
        <h3 className="font-semibold mb-4">Small Set (count: 3)</h3>
        <Skeletons count={3} viewMode="grid" />
      </div>

      <div>
        <h3 className="font-semibold mb-4">Standard Set (count: 6)</h3>
        <Skeletons count={6} viewMode="grid" />
      </div>

      <div>
        <h3 className="font-semibold mb-4">Large Set (count: 12)</h3>
        <Skeletons count={12} viewMode="grid" />
      </div>
    </div>
  )
}

// Responsive behavior
export const ResponsiveBehavior = {
  render: () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold mb-4">Mobile (375px) - Single Column</h3>
        <div className="w-[375px] mx-auto bg-gray-50 p-4">
          <Skeletons count={4} viewMode="grid" />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Tablet (768px) - Two Columns</h3>
        <div className="w-[768px] mx-auto bg-gray-50 p-4">
          <Skeletons count={6} viewMode="grid" />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Desktop (1200px) - Three Columns</h3>
        <div className="w-[1200px] mx-auto bg-gray-50 p-4">
          <Skeletons count={9} viewMode="grid" />
        </div>
      </div>
    </div>
  )
}

// Performance showcase
export const PerformanceShowcase = {
  render: () => {
    const [renderCount, setRenderCount] = useState(0)
    const [itemCount, setItemCount] = useState(6)

    // Track renders
    React.useEffect(() => {
      setRenderCount(prev => prev + 1)
    })

    return (
      <div className="max-w-4xl mx-auto bg-gray-50 p-6">
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">
            Number of Items: {itemCount}
          </label>
          <input
            type="range"
            min="1"
            max="20"
            value={itemCount}
            onChange={(e) => setItemCount(Number(e.target.value))}
            className="w-full"
          />
        </div>

        <Skeletons count={itemCount} viewMode="grid" />

        <div className="mt-6 p-4 bg-white rounded-lg">
          <h4 className="font-medium text-gray-900 mb-3">Performance Metrics:</h4>
          <div className="space-y-2 text-sm">
            <p><strong>Component renders:</strong> {renderCount}</p>
            <p><strong>Skeleton items:</strong> {itemCount}</p>
            <p><strong>Animation engine:</strong> Framer Motion with GPU acceleration</p>
            <p><strong>Memory usage:</strong> Optimized with efficient DOM structure</p>
          </div>

          <div className="mt-4 p-3 bg-gray-50 rounded text-xs text-gray-600">
            <p><strong>Performance Features:</strong></p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>Shimmer animations use CSS transforms for GPU acceleration</li>
              <li>Staggered entrance animations prevent layout thrashing</li>
              <li>Minimal DOM with efficient gradient backgrounds</li>
              <li>Framer Motion optimizations for smooth 60fps animations</li>
              <li>Scales efficiently from 1 to 20+ skeleton items</li>
            </ul>
          </div>
        </div>
      </div>
    )
  }
}

// Real-world usage examples
export const RealWorldExamples = {
  render: () => (
    <div className="space-y-8 bg-gray-50 p-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Search Results Loading</h3>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div>
            <FilterSkeleton />
          </div>
          <div className="lg:col-span-3">
            <Skeletons count={9} viewMode="grid" />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Infinite Scroll Loading</h3>
        <div className="space-y-4">
          {/* Existing content (simulated) */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center text-gray-500">
            [Existing photographer cards above...]
          </div>

          {/* Loading new items */}
          <Skeletons count={3} viewMode="list" />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Initial Page Load</h3>
        <div className="space-y-6">
          <div className="bg-white rounded-lg p-4">
            <div className="flex justify-between items-center">
              <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
              <div className="h-6 bg-gray-200 rounded w-24 animate-pulse"></div>
            </div>
          </div>
          <Skeletons count={6} viewMode="grid" />
        </div>
      </div>
    </div>
  )
}

// Accessibility considerations
export const AccessibilityDemo = {
  render: () => (
    <div className="max-w-4xl mx-auto bg-gray-50 p-6">
      <Skeletons count={6} viewMode="grid" />

      <div className="mt-6 text-sm text-gray-600">
        <p><strong>Accessibility considerations:</strong></p>
        <ul className="list-disc list-inside mt-2 space-y-1">
          <li>Respects prefers-reduced-motion for users sensitive to animations</li>
          <li>Maintains consistent layout structure for screen readers</li>
          <li>Uses semantic HTML structure matching final content</li>
          <li>Provides visual loading indication without relying on color alone</li>
          <li>Animations are purely visual and don't affect content hierarchy</li>
          <li>Keyboard navigation flows logically through skeleton structure</li>
        </ul>

        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-800 text-xs">
            <strong>Motion sensitivity:</strong> Users with prefers-reduced-motion will see
            simplified loading states without continuous shimmer animations.
          </p>
        </div>
      </div>
    </div>
  )
}

// Error handling and edge cases
export const EdgeCases = {
  render: () => (
    <div className="space-y-6 max-w-4xl mx-auto bg-gray-50 p-6">
      <div>
        <h3 className="font-semibold mb-4">Zero Count</h3>
        <Skeletons count={0} viewMode="grid" />
        <p className="text-sm text-gray-500 mt-2">No skeletons rendered with count=0</p>
      </div>

      <div>
        <h3 className="font-semibold mb-4">Invalid View Mode</h3>
        <Skeletons count={3} viewMode="invalid" />
        <p className="text-sm text-gray-500 mt-2">Gracefully handles invalid viewMode</p>
      </div>

      <div>
        <h3 className="font-semibold mb-4">Very Large Count (Performance Test)</h3>
        <div className="max-h-96 overflow-y-auto">
          <Skeletons count={50} viewMode="list" />
        </div>
        <p className="text-sm text-gray-500 mt-2">50 skeletons - still performs well</p>
      </div>

      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-yellow-800 text-sm">
          <strong>Edge Case Handling:</strong> Component gracefully handles invalid props,
          extreme values, and maintains performance even with large counts.
        </p>
      </div>
    </div>
  )
}

// Dark mode (if supported)
export const DarkMode = Template.bind({})
DarkMode.args = {
  count: 6,
  viewMode: 'grid'
}
DarkMode.decorators = [
  (Story) => (
    <div className="dark bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        <Story />
      </div>
    </div>
  )
]