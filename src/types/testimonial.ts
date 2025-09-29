// Type-safe testimonial interface for the testimonials component
export interface Testimonial {
  text: string;
  image: string;
  name: string;
  location: string;
}

// Database review type (what we get from Supabase)
export interface DatabaseReview {
  id: string;
  booking_id?: string;
  reviewer_id?: string;
  photographer_id?: string;
  rating: number;
  comment: string;
  is_featured?: boolean;
  is_verified?: boolean;
  helpful_count?: number;
  response?: string;
  photos?: string[];
  created_at: string;
  updated_at?: string;
  // Joined data from users table
  users?: {
    first_name?: string;
    last_name?: string;
    email?: string;
    avatar_url?: string;
    city?: string;
    state?: string;
  };
}

// Fallback testimonials data for when Supabase fails or returns empty
export const FALLBACK_TESTIMONIALS: Testimonial[] = [
  {
    text: "Love & Photos made finding our wedding photographer so easy! The quality of photographers on the platform is amazing.",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
    name: "Sarah Johnson",
    location: "Austin, TX"
  },
  {
    text: "As a photographer, this platform has transformed my business. The tools and community support are invaluable.",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
    name: "Michael Chen",
    location: "Seattle, WA"
  },
  {
    text: "The booking process was seamless and our engagement photos turned out perfect. Highly recommend!",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150",
    name: "Emily Rodriguez",
    location: "Miami, FL"
  },
  {
    text: "Found the perfect photographer for our family portraits. The platform's search and filter features are excellent.",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
    name: "David Park",
    location: "Chicago, IL"
  },
  {
    text: "Love & Photos has been a game-changer for my photography business. The exposure and bookings have exceeded expectations.",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
    name: "Jessica Martinez",
    location: "Denver, CO"
  },
  {
    text: "The variety of photography styles and price points made it easy to find someone within our budget. Great experience!",
    image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150",
    name: "Robert Taylor",
    location: "Portland, OR"
  },
  {
    text: "Professional, efficient, and the results speak for themselves. Our wedding photos are absolutely stunning.",
    image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150",
    name: "Amanda White",
    location: "Nashville, TN"
  },
  {
    text: "The platform's training resources helped me improve my skills and grow my client base significantly.",
    image: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150",
    name: "Lisa Thompson",
    location: "San Diego, CA"
  }
];

// Helper function to map database reviews to testimonials
export function mapReviewToTestimonial(review: DatabaseReview): Testimonial | null {
  // Skip reviews without comments
  if (!review.comment || review.comment.trim() === '') {
    return null;
  }

  // Generate name from user data or use fallback
  const firstName = review.users?.first_name || 'Anonymous';
  const lastName = review.users?.last_name || 'User';
  const name = `${firstName} ${lastName}`.trim();

  // Generate location from user data or use fallback
  const city = review.users?.city || 'Unknown City';
  const state = review.users?.state || 'USA';
  const location = `${city}, ${state}`;

  // Use avatar URL or generate a placeholder
  const image = review.users?.avatar_url ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&size=150`;

  return {
    text: review.comment,
    image,
    name,
    location
  };
}

// Helper function to ensure we always have testimonials to show
export function ensureTestimonials(reviews: DatabaseReview[]): Testimonial[] {
  // Try to map database reviews to testimonials
  const mappedTestimonials = reviews
    .map(mapReviewToTestimonial)
    .filter((t): t is Testimonial => t !== null);

  // If we have enough mapped testimonials, use them
  if (mappedTestimonials.length >= 3) {
    return mappedTestimonials;
  }

  // If we have some but not enough, combine with fallback
  if (mappedTestimonials.length > 0) {
    const needed = 8 - mappedTestimonials.length;
    return [...mappedTestimonials, ...FALLBACK_TESTIMONIALS.slice(0, needed)];
  }

  // If we have none, use all fallback testimonials
  return FALLBACK_TESTIMONIALS;
}