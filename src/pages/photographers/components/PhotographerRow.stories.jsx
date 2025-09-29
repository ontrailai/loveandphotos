/**
 * Storybook Stories for PhotographerRow Component
 * Visual documentation and testing for photographer list view layout
 */

import PhotographerRow from './PhotographerRow'
import { TrustBadges } from './TrustBadges'

// Mock data for stories
const mockPhotographerBase = {
  user_id: 'user123',
  users: {
    full_name: 'Sarah Johnson',
    avatar_url: 'https://images.unsplash.com/photo-1494790108755-2616b5fd1e4c?w=150&h=150&fit=crop&crop=face'
  },
  specialties: ['Wedding', 'Portrait'],
  average_rating: 4.8,
  total_reviews: 25,
  pay_tiers: {
    name: 'Gold',
    hourly_rate: 200
  },
  portfolio_items: [
    { image_url: 'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=400&h=300&fit=crop' }
  ],
  is_verified: true,
  is_love_and_photos_choice: false,
  languages: ['English', 'Spanish'],
  location_city: 'New York',
  location_state: 'NY',
  bio: 'Professional wedding and portrait photographer with 8 years of experience capturing life\'s most precious moments.',
  acceptance_rate: 0.92,
  avg_response_time_minutes: 45,
  total_bookings: 156
}

// Default export for Storybook
export default {
  title: 'Photographers/PhotographerRow',
  component: PhotographerRow,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Photographer row component for list view with horizontal layout, trust metrics, and hover effects.'
      }
    }
  },
  argTypes: {
    photographer: {
      description: 'Photographer data object with all required fields',
      control: 'object'
    },
    showPricing: {
      description: 'Whether to show pricing or login prompt',
      control: 'boolean',
      defaultValue: false
    },
    onClick: {
      description: 'Click handler for row interaction',
      action: 'photographer-clicked'
    },
    className: {
      description: 'Additional CSS classes',
      control: 'text'
    }
  },
  decorators: [
    (Story) => (
      <div className="max-w-4xl mx-auto bg-gray-50 p-4">
        <Story />
      </div>
    )
  ]
}

// Template for creating stories
const Template = (args) => <PhotographerRow {...args} />

// Default story
export const Default = Template.bind({})
Default.args = {
  photographer: mockPhotographerBase,
  showPricing: false
}

// Verified photographer with pricing
export const VerifiedWithPricing = Template.bind({})
VerifiedWithPricing.args = {
  photographer: mockPhotographerBase,
  showPricing: true
}
VerifiedWithPricing.parameters = {
  docs: {
    description: {
      story: 'Verified photographer row showing pricing information for authenticated users.'
    }
  }
}

// Love & Photos Choice badge
export const LoveAndPhotosChoice = Template.bind({})
LoveAndPhotosChoice.args = {
  photographer: {
    ...mockPhotographerBase,
    is_love_and_photos_choice: true,
    average_rating: 4.9,
    total_reviews: 87,
    pay_tiers: { name: 'Platinum', hourly_rate: 350 }
  },
  showPricing: true
}

// New photographer with limited data
export const NewPhotographer = Template.bind({})
NewPhotographer.args = {
  photographer: {
    ...mockPhotographerBase,
    users: { full_name: 'Alex Chen', avatar_url: null },
    average_rating: 0,
    total_reviews: 0,
    pay_tiers: { name: 'Bronze', hourly_rate: 125 },
    is_verified: false,
    specialties: ['Event'],
    languages: ['English'],
    total_bookings: 0,
    avg_response_time_minutes: null,
    acceptance_rate: null,
    bio: 'New to the platform and excited to capture your special moments.'
  }
}

// High-performing photographer
export const TopPerformer = Template.bind({})
TopPerformer.args = {
  photographer: {
    ...mockPhotographerBase,
    users: {
      full_name: 'Maria Rodriguez',
      avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face'
    },
    average_rating: 5.0,
    total_reviews: 124,
    pay_tiers: { name: 'Platinum', hourly_rate: 400 },
    specialties: ['Wedding', 'Portrait', 'Event', 'Corporate'],
    languages: ['English', 'Spanish', 'French'],
    total_bookings: 287,
    avg_response_time_minutes: 15,
    acceptance_rate: 0.98,
    is_love_and_photos_choice: true,
    bio: 'Award-winning photographer with over 12 years of experience in luxury events and corporate photography.'
  },
  showPricing: true
}

// Photographer with long name and content
export const LongContent = Template.bind({})
LongContent.args = {
  photographer: {
    ...mockPhotographerBase,
    users: {
      full_name: 'Christopher Alexander Montgomery-Williams III',
      avatar_url: null
    },
    specialties: ['Wedding', 'Portrait', 'Event', 'Corporate', 'Family', 'Newborn', 'Fashion'],
    bio: 'Award-winning professional photographer specializing in luxury weddings and high-end corporate events with over 15 years of experience in the industry. I have traveled internationally and worked with Fortune 500 companies.',
    location_city: 'San Francisco',
    location_state: 'CA',
    languages: ['English', 'Spanish', 'French', 'Italian', 'German']
  }
}

// Photographer with missing portfolio image
export const NoPortfolioImage = Template.bind({})
NoPortfolioImage.args = {
  photographer: {
    ...mockPhotographerBase,
    portfolio_items: [],
    portfolio_images: []
  }
}

// Different tier variations
export const BronzeTier = Template.bind({})
BronzeTier.args = {
  photographer: {
    ...mockPhotographerBase,
    pay_tiers: { name: 'Bronze', hourly_rate: 100 },
    total_reviews: 8,
    average_rating: 4.2,
    total_bookings: 15
  }
}

export const SilverTier = Template.bind({})
SilverTier.args = {
  photographer: {
    ...mockPhotographerBase,
    pay_tiers: { name: 'Silver', hourly_rate: 150 },
    total_reviews: 42,
    average_rating: 4.5
  }
}

export const PlatinumTier = Template.bind({})
PlatinumTier.args = {
  photographer: {
    ...mockPhotographerBase,
    pay_tiers: { name: 'Platinum', hourly_rate: 400 },
    total_reviews: 156,
    average_rating: 4.9,
    is_love_and_photos_choice: true
  },
  showPricing: true
}

// Low performance photographer
export const LowPerformance = Template.bind({})
LowPerformance.args = {
  photographer: {
    ...mockPhotographerBase,
    average_rating: 3.2,
    total_reviews: 5,
    avg_response_time_minutes: 180,
    acceptance_rate: 0.65,
    total_bookings: 12,
    bio: 'Still building my portfolio and improving my skills.',
    specialties: ['Portrait']
  }
}

// Loading state simulation
export const Loading = () => (
  <div className="max-w-4xl mx-auto bg-gray-50 p-4">
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-pulse">
      <div className="flex">
        <div className="w-48 h-36 bg-gray-200"></div>
        <div className="flex-1 p-6">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-4 flex-1">
              <div className="w-12 h-12 rounded-full bg-gray-200"></div>
              <div className="flex-1 space-y-2">
                <div className="h-5 bg-gray-200 rounded w-32"></div>
                <div className="h-4 bg-gray-200 rounded w-64"></div>
                <div className="h-3 bg-gray-200 rounded w-24"></div>
              </div>
            </div>
            <div className="text-right">
              <div className="h-6 bg-gray-200 rounded w-20 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-16 mb-1"></div>
              <div className="h-3 bg-gray-200 rounded w-12"></div>
            </div>
          </div>
          <div className="flex space-x-4 mb-3">
            <div className="h-3 bg-gray-200 rounded w-32"></div>
            <div className="h-3 bg-gray-200 rounded w-24"></div>
          </div>
          <div className="flex space-x-6">
            <div className="h-3 bg-gray-200 rounded w-16"></div>
            <div className="h-3 bg-gray-200 rounded w-16"></div>
            <div className="h-3 bg-gray-200 rounded w-16"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
)

// Interactive states
export const Interactive = {
  render: () => {
    const [clicked, setClicked] = React.useState(false)

    return (
      <div className="max-w-4xl mx-auto bg-gray-50 p-4">
        <PhotographerRow
          photographer={mockPhotographerBase}
          onClick={() => setClicked(!clicked)}
          className={clicked ? 'ring-2 ring-[#FF4D6D]' : ''}
        />
        <p className="text-center mt-4 text-sm text-gray-600">
          {clicked ? 'Row clicked!' : 'Click the row to see interaction'}
        </p>
      </div>
    )
  }
}

// List layout showcase
export const ListShowcase = {
  render: () => (
    <div className="max-w-4xl mx-auto bg-gray-50 p-4 space-y-4">
      <PhotographerRow photographer={mockPhotographerBase} />
      <PhotographerRow
        photographer={{
          ...mockPhotographerBase,
          is_love_and_photos_choice: true,
          users: { full_name: 'Emma Thompson', avatar_url: null },
          pay_tiers: { name: 'Platinum', hourly_rate: 350 }
        }}
        showPricing
      />
      <PhotographerRow
        photographer={{
          ...mockPhotographerBase,
          users: { full_name: 'Mike Wilson', avatar_url: null },
          pay_tiers: { name: 'Bronze', hourly_rate: 100 },
          average_rating: 4.2,
          total_reviews: 8
        }}
      />
      <PhotographerRow
        photographer={{
          ...mockPhotographerBase,
          users: { full_name: 'Lisa Park', avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face' },
          pay_tiers: { name: 'Silver', hourly_rate: 175 },
          specialties: ['Corporate', 'Event'],
          languages: ['English', 'Korean']
        }}
      />
    </div>
  )
}

// Responsive behavior
export const ResponsiveBehavior = {
  render: () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold mb-4">Tablet (768px)</h3>
        <div className="w-[768px] mx-auto">
          <PhotographerRow photographer={mockPhotographerBase} />
        </div>
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-4">Desktop (1024px)</h3>
        <div className="w-[1024px] mx-auto">
          <PhotographerRow photographer={mockPhotographerBase} showPricing />
        </div>
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-4">Wide Screen (1400px)</h3>
        <div className="w-[1400px] mx-auto">
          <PhotographerRow photographer={mockPhotographerBase} showPricing />
        </div>
      </div>
    </div>
  )
}

// Dark mode (if supported)
export const DarkMode = Template.bind({})
DarkMode.args = {
  photographer: mockPhotographerBase,
  showPricing: true
}
DarkMode.decorators = [
  (Story) => (
    <div className="dark bg-gray-900 p-4">
      <div className="max-w-4xl mx-auto">
        <Story />
      </div>
    </div>
  )
]

// Accessibility testing
export const AccessibilityDemo = {
  render: () => (
    <div className="max-w-4xl mx-auto bg-gray-50 p-4">
      <PhotographerRow
        photographer={mockPhotographerBase}
        onClick={() => alert('Row clicked - accessible via keyboard')}
      />
      <div className="mt-4 text-sm text-gray-600">
        <p><strong>Accessibility features:</strong></p>
        <ul className="list-disc list-inside mt-2 space-y-1">
          <li>Keyboard focusable and clickable</li>
          <li>Screen reader friendly with semantic HTML</li>
          <li>Proper ARIA attributes for interactive elements</li>
          <li>Sufficient color contrast ratios</li>
          <li>Clear visual hierarchy and layout</li>
          <li>Truncated text with meaningful fallbacks</li>
        </ul>
      </div>
    </div>
  )
}

// Error handling
export const ErrorHandling = {
  render: () => (
    <div className="max-w-4xl mx-auto bg-gray-50 p-4 space-y-4">
      <h3 className="text-lg font-semibold mb-4">Error State Handling</h3>

      <div>
        <h4 className="font-medium mb-2">Missing User Data</h4>
        <PhotographerRow
          photographer={{
            ...mockPhotographerBase,
            users: null
          }}
        />
      </div>

      <div>
        <h4 className="font-medium mb-2">Missing Portfolio Images</h4>
        <PhotographerRow
          photographer={{
            ...mockPhotographerBase,
            portfolio_items: [],
            portfolio_images: []
          }}
        />
      </div>

      <div>
        <h4 className="font-medium mb-2">Minimal Data</h4>
        <PhotographerRow
          photographer={{
            user_id: 'minimal',
            users: { full_name: 'John Doe' },
            specialties: [],
            average_rating: 0,
            total_reviews: 0,
            languages: [],
            bio: null
          }}
        />
      </div>
    </div>
  )
}