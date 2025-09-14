import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from "motion/react";
import { Star, Users, Heart, CalendarDays } from "lucide-react";
import TestimonialsColumns from './ui/testimonials-columns-1.jsx';
import { getFeaturedTestimonials, getTestimonialsStats } from '../lib/supabaseClient.js';

// Loading skeleton component
const TestimonialsSkeleton = () => {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="bg-card p-6 rounded-2xl shadow-sm border border-border">
            <div className="flex space-x-1 mb-4">
              {Array.from({ length: 5 }, (_, j) => (
                <div key={j} className="w-4 h-4 bg-muted rounded animate-pulse" />
              ))}
            </div>
            <div className="space-y-3 mb-6">
              <div className="h-4 bg-muted rounded animate-pulse" />
              <div className="h-4 bg-muted rounded animate-pulse w-5/6" />
              <div className="h-4 bg-muted rounded animate-pulse w-4/6" />
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-muted rounded-full animate-pulse" />
              <div className="space-y-2">
                <div className="h-4 bg-muted rounded animate-pulse w-24" />
                <div className="h-3 bg-muted rounded animate-pulse w-20" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Stats display component
const TestimonialsStats = ({ stats, loading }) => {
  if (loading) {
    return (
      <div className="flex flex-wrap justify-center gap-8 mb-16">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="text-center">
            <div className="w-16 h-8 bg-muted rounded animate-pulse mx-auto mb-2" />
            <div className="w-24 h-4 bg-muted rounded animate-pulse mx-auto" />
          </div>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="flex flex-wrap justify-center gap-8 sm:gap-12 mb-16"
    >
      <div className="text-center">
        <div className="flex items-center justify-center mb-2">
          <Users className="w-5 h-5 text-primary-500 mr-2" />
          <span className="text-3xl sm:text-4xl font-bold text-foreground">
            {stats.totalReviews.toLocaleString()}
          </span>
        </div>
        <p className="text-muted-foreground font-medium">Happy Customers</p>
      </div>

      <div className="text-center">
        <div className="flex items-center justify-center mb-2">
          <Star className="w-5 h-5 text-amber-400 mr-2 fill-current" />
          <span className="text-3xl sm:text-4xl font-bold text-foreground">
            {stats.averageRating}
          </span>
          <span className="text-lg text-muted-foreground ml-1">/5</span>
        </div>
        <p className="text-muted-foreground font-medium">Average Rating</p>
      </div>

      <div className="text-center">
        <div className="flex items-center justify-center mb-2">
          <Heart className="w-5 h-5 text-red-500 mr-2 fill-current" />
          <span className="text-3xl sm:text-4xl font-bold text-foreground">
            {stats.fiveStarPercentage}%
          </span>
        </div>
        <p className="text-muted-foreground font-medium">5-Star Reviews</p>
      </div>
    </motion.div>
  );
};

// Main TestimonialsSection component
export default function TestimonialsSection({ className = "" }) {
  const [testimonials, setTestimonials] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTestimonialsData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch both testimonials and stats in parallel
        const [testimonialsData, statsData] = await Promise.all([
          getFeaturedTestimonials(12),
          getTestimonialsStats()
        ]);

        setTestimonials(testimonialsData);
        setStats(statsData);
      } catch (err) {
        console.error('Error loading testimonials:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTestimonialsData();
  }, []);

  // Don't render if there's an error or no testimonials
  if (error) {
    console.error('Testimonials section error:', error);
    return null; // Silently fail for better UX
  }

  if (!loading && testimonials.length === 0) {
    return null; // Don't render empty section
  }

  return (
    <section className={`py-16 sm:py-20 lg:py-24 bg-background ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            What Our{' '}
            <span className="text-primary-500 relative">
              Customers Say
              <motion.div
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.5 }}
                className="absolute bottom-0 left-0 right-0 h-3 bg-primary-100 rounded-full -z-10"
              />
            </span>
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Don't just take our word for it. Here's what real customers have to say about their photography experiences with Love & Photos.
          </p>
        </motion.div>

        {/* Statistics */}
        <TestimonialsStats stats={stats} loading={loading} />

        {/* Testimonials Grid */}
        {loading ? (
          <TestimonialsSkeleton />
        ) : (
          <TestimonialsColumns testimonials={testimonials} />
        )}

        {/* Call to action */}
        {!loading && testimonials.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-center mt-16"
          >
            <p className="text-lg text-muted-foreground mb-6">
              Ready to create your own amazing photography experience?
            </p>
            <Link to="/book">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full h-9 px-4 border border-primary/80 focus-visible:ring-primary/30 shadow-none transition-colors duration-200 inline-flex items-center font-medium"
              >
                <CalendarDays className="h-4 w-4 mr-2" />
                Check Availability
              </motion.button>
            </Link>
          </motion.div>
        )}
      </div>
    </section>
  );
}