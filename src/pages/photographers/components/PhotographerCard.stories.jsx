/**
 * Storybook Stories for PhotographerCard Component
 * Visual documentation and testing for photographer cards in grid view
 */

import PhotographerCard from './PhotographerCard'
import { TrustBadges } from './TrustBadges'
import AvailabilityChip from './AvailabilityChip'

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
  total_bookings: 156,
  availability_level: 'high'
}

// Default export for Storybook
export default {
  title: 'Photographers/PhotographerCard',
  component: PhotographerCard,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Photographer card component for grid view with hover effects, trust metrics, and availability indicators.'
      }
    }
  },
  argTypes: {
    photographer: {
      description: 'Photographer data object with all required fields',
      control: 'object'
    },
    viewMode: {
      description: 'Display mode for the card',
      control: 'radio',
      options: ['grid', 'list'],
      defaultValue: 'grid'
    },
    showPricing: {
      description: 'Whether to show pricing or login prompt',
      control: 'boolean',
      defaultValue: false
    },
    onClick: {
      description: 'Click handler for card interaction',
      action: 'photographer-clicked'
    }
  },
  decorators: [
    (Story) => (
      <div className="max-w-sm mx-auto bg-gray-50 p-4">
        <Story />
      </div>
    )
  ]
}

// Template for creating stories
const Template = (args) => <PhotographerCard {...args} />

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
      story: 'Verified photographer card showing pricing information for authenticated users.'
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
    availability_level: 'unknown'
  }
}

// High-performing photographer
export const TopPerformer = Template.bind({})
TopPerformer.args = {
  photographer: {
    ...mockPhotographerBase,
    users: { full_name: 'Maria Rodriguez', avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face' },
    average_rating: 5.0,
    total_reviews: 124,
    pay_tiers: { name: 'Platinum', hourly_rate: 400 },
    specialties: ['Wedding', 'Portrait', 'Event', 'Corporate'],
    languages: ['English', 'Spanish', 'French'],
    total_bookings: 287,
    avg_response_time_minutes: 15,
    acceptance_rate: 0.98,
    availability_level: 'medium',
    is_love_and_photos_choice: true
  },
  showPricing: true
}

// Photographer with long name and bio
export const LongContent = Template.bind({})
LongContent.args = {
  photographer: {
    ...mockPhotographerBase,
    users: { full_name: 'Christopher Alexander Montgomery-Williams', avatar_url: null },
    specialties: ['Wedding', 'Portrait', 'Event', 'Corporate', 'Family', 'Newborn'],
    bio: 'Award-winning professional photographer specializing in luxury weddings and high-end corporate events with over 15 years of experience in the industry.',
    location_city: 'San Francisco',
    location_state: 'CA'
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

// Low availability photographer
export const LowAvailability = Template.bind({})
LowAvailability.args = {
  photographer: {
    ...mockPhotographerBase,
    availability_level: 'low',
    avg_response_time_minutes: 180,
    acceptance_rate: 0.65,
    total_bookings: 45
  }
}

// Different tier variations
export const BronzeTier = Template.bind({})
BronzeTier.args = {
  photographer: {
    ...mockPhotographerBase,
    pay_tiers: { name: 'Bronze', hourly_rate: 100 },
    total_reviews: 8,
    average_rating: 4.2
  }
}

export const SilverTier = Template.bind({})
SilverTier.args = {
  photographer: {
    ...mockPhotographerBase,
    pay_tiers: { name: 'Silver', hourly_rate: 150 }
  }
}

// Loading state simulation
export const Loading = () => (
  <div className="max-w-sm mx-auto bg-gray-50 p-4">
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-pulse">
      <div className="h-48 bg-gray-200"></div>
      <div className="p-5 space-y-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-gray-200"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
        <div className="flex space-x-1">
          {[1,2,3,4,5].map(i => <div key={i} className="w-4 h-4 bg-gray-200 rounded"></div>)}
        </div>
        <div className="h-3 bg-gray-200 rounded w-2/3"></div>
        <div className="flex justify-between">
          <div className="h-3 bg-gray-200 rounded w-16"></div>
          <div className="h-3 bg-gray-200 rounded w-16"></div>
          <div className="h-3 bg-gray-200 rounded w-16"></div>
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
      <div className="max-w-sm mx-auto bg-gray-50 p-4">
        <PhotographerCard
          photographer={mockPhotographerBase}
          onClick={() => setClicked(!clicked)}
          className={clicked ? 'ring-2 ring-[#FF4D6D]' : ''}
        />
        <p className="text-center mt-4 text-sm text-gray-600">
          {clicked ? 'Card clicked!' : 'Click the card to see interaction'}
        </p>
      </div>
    )
  }
}

// Grid layout showcase
export const GridShowcase = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 p-6 bg-gray-50">
      <PhotographerCard photographer={mockPhotographerBase} />
      <PhotographerCard photographer={{...mockPhotographerBase, is_love_and_photos_choice: true}} showPricing />
      <PhotographerCard photographer={{
        ...mockPhotographerBase,
        users: { full_name: 'Mike Wilson', avatar_url: null },
        pay_tiers: { name: 'Bronze', hourly_rate: 100 },
        availability_level: 'low'
      }} />
    </div>
  )
}

// Responsive behavior
export const ResponsiveBehavior = {
  render: () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold mb-4">Mobile (375px)</h3>
        <div className="w-[375px] mx-auto">
          <PhotographerCard photographer={mockPhotographerBase} />
        </div>
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-4">Tablet (768px)</h3>
        <div className="w-[400px] mx-auto">
          <PhotographerCard photographer={mockPhotographerBase} />
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
      <div className="max-w-sm mx-auto">
        <Story />
      </div>
    </div>
  )
]

// Accessibility testing
export const AccessibilityDemo = {
  render: () => (
    <div className="max-w-sm mx-auto bg-gray-50 p-4">
      <PhotographerCard
        photographer={mockPhotographerBase}
        onClick={() => alert('Card clicked - accessible via keyboard')}
      />
      <div className="mt-4 text-sm text-gray-600">
        <p><strong>Accessibility features:</strong></p>
        <ul className="list-disc list-inside mt-2 space-y-1">
          <li>Keyboard focusable</li>
          <li>Screen reader friendly</li>
          <li>Semantic HTML structure</li>
          <li>Proper ARIA attributes</li>
          <li>Sufficient color contrast</li>
        </ul>
      </div>
    </div>
  )
}