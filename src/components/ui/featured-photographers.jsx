import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Star, ArrowRight, MapPin, Calendar, Users, Heart, AlertCircle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { getFeaturedPhotographers, getFeaturedPhotographersMetrics, getPhotographerProfileLink, formatCurrency } from '@/lib/supabaseClient';

// GridPattern helper component
const GridPattern = ({
  width = 40,
  height = 40,
  x = -1,
  y = -1,
  strokeDasharray = "0",
  className = "",
  ...props
}) => {
  const id = React.useId();

  return (
    <svg
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 h-full w-full fill-muted/30 stroke-muted/30 ${className}`}
      {...props}
    >
      <defs>
        <pattern
          id={id}
          width={width}
          height={height}
          patternUnits="userSpaceOnUse"
          x={x}
          y={y}
        >
          <path
            d={`M.5 ${height}V.5H${width}`}
            fill="none"
            strokeDasharray={strokeDasharray}
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" strokeWidth={0} fill={`url(#${id})`} />
    </svg>
  );
};

// Empty State Component
const EmptyState = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="text-center py-16"
  >
    <div className="mx-auto max-w-md">
      <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-medium text-foreground mb-2">
        No photographers available
      </h3>
      <p className="text-muted-foreground mb-6">
        We're currently updating our photographer network. Please check back soon or browse our full directory.
      </p>
      <Button
        className="bg-primary hover:bg-primary/90 text-primary-foreground"
        asChild
      >
        <Link to="/photographers">
          View All Photographers
          <ArrowRight className="h-4 w-4 ml-2" />
        </Link>
      </Button>
    </div>
  </motion.div>
);

// Error State Component
const ErrorState = ({ onRetry }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="text-center py-16"
  >
    <div className="mx-auto max-w-md">
      <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
      <h3 className="text-lg font-medium text-foreground mb-2">
        Unable to load photographers
      </h3>
      <p className="text-muted-foreground mb-6">
        We're having trouble connecting to our database. Please try again or browse our photographer directory.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button
          onClick={onRetry}
          variant="outline"
        >
          Try Again
        </Button>
        <Button
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
          asChild
        >
          <Link to="/photographers">
            View All Photographers
            <ArrowRight className="h-4 w-4 ml-2" />
          </Link>
        </Button>
      </div>
    </div>
  </motion.div>
);

// Skeleton Loading Component
const SkeletonCard = ({ index }) => (
  <motion.div
    key={`skeleton-${index}`}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.1, duration: 0.6 }}
    className="animate-pulse"
  >
    <Card className="relative overflow-hidden border-border/50 bg-background/80">
      <CardContent className="relative p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 bg-muted rounded-full" />
            <div className="flex-1 min-w-0">
              <div className="h-4 bg-muted rounded w-3/4 mb-2" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </div>
          </div>
          <div className="h-6 bg-muted rounded w-16" />
        </div>
        <div className="space-y-3 mb-4">
          <div className="h-3 bg-muted rounded" />
          <div className="h-3 bg-muted rounded w-2/3" />
          <div className="h-3 bg-muted rounded w-3/4" />
        </div>
        <div className="h-16 bg-muted rounded mb-4" />
        <div className="h-8 bg-muted rounded" />
      </CardContent>
    </Card>
  </motion.div>
);

// Photographer Card Component
const PhotographerCard = ({ photographer, index }) => {
  const [isHovered, setIsHovered] = useState(false);

  const profileLink = getPhotographerProfileLink(photographer);

  const getTierColor = (tier) => {
    const tierMap = {
      'Gold': 'bg-amber-100 text-neutral-900 border-amber-200 dark:bg-amber-100 dark:text-neutral-900 dark:border-amber-200',
      'Silver': 'bg-slate-100 text-neutral-900 border-slate-200 dark:bg-slate-100 dark:text-neutral-900 dark:border-slate-200',
      'Bronze': 'bg-orange-100 text-neutral-900 border-orange-200 dark:bg-orange-100 dark:text-neutral-900 dark:border-orange-200',
      'New': 'bg-emerald-100 text-neutral-900 border-emerald-200 dark:bg-emerald-100 dark:text-neutral-900 dark:border-emerald-200',
      'Platinum': 'bg-purple-100 text-neutral-900 border-purple-200 dark:bg-purple-100 dark:text-neutral-900 dark:border-purple-200'
    };
    return tierMap[tier] || tierMap['Bronze'];
  };

  const formatNumber = (num) => {
    if (!num || num === 0) return '0';
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num.toString();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.6 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <Card className="group/card relative h-full rounded-2xl border border-border bg-card transition-colors shadow-[0_1px_1px_rgba(0,0,0,0.03)] hover:bg-accent hover:border-border hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)]">
        <GridPattern
          width={20}
          height={20}
          x={-1}
          y={-1}
          strokeDasharray="2"
          className="absolute inset-0 opacity-0 group-hover/card:opacity-30 transition-opacity duration-300 stroke-border/20"
        />

        <CardContent className="relative flex flex-col h-full p-6">
          {/* Header with Avatar and Badge */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar className="h-12 w-12 border-2 border-background shadow-md">
                  <AvatarImage src={photographer.users?.avatar_url || photographer.avatar_url} alt={photographer.full_name} />
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {photographer.full_name?.split(' ').map(n => n[0]).join('') || 'P'}
                  </AvatarFallback>
                </Avatar>
                {photographer.vetted && (
                  <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-1">
                    <Star className="h-3 w-3 text-white fill-current" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground truncate">{photographer.full_name}</h3>
                {photographer.hourly_rate && formatCurrency(photographer.hourly_rate) && (
                  <p className="text-sm text-muted-foreground truncate">
                    From {formatCurrency(photographer.hourly_rate)}/hr
                  </p>
                )}
              </div>
            </div>
            <Badge variant="outline" className={`text-xs font-medium ${getTierColor(photographer.tier)}`}>
              {photographer.tier}
            </Badge>
          </div>

          {/* Info Section */}
          <div className="space-y-3 mb-4">
            {(photographer.city || photographer.state) && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">
                  {[photographer.city, photographer.state].filter(Boolean).join(', ')}
                </span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4 flex-shrink-0" />
              <span>Joined {photographer.joinedDate}</span>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4 mb-4 p-3 bg-muted/30 rounded-lg">
            <div className="text-center">
              <div className="font-semibold text-foreground tabular-nums">{formatNumber(photographer.total_reviews)}</div>
              <div className="text-xs text-muted-foreground">Reviews</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-foreground tabular-nums">{photographer.weddings_completed || 0}</div>
              <div className="text-xs text-muted-foreground">Weddings</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-foreground tabular-nums flex items-center justify-center gap-1">
                {photographer.average_rating ? Number(photographer.average_rating).toFixed(1) : '0.0'}
                <Star className="h-3 w-3 text-yellow-500 fill-current" />
              </div>
              <div className="text-xs text-muted-foreground">Rating</div>
            </div>
          </div>

          {/* Optional Bio */}
          {photographer.bio && (
            <blockquote className="text-sm text-muted-foreground italic mb-4 line-clamp-3">
              "{photographer.bio}"
            </blockquote>
          )}

          {/* View Profile Button - only show if we have a valid link */}
          {profileLink && (
            <div className="mt-auto">
              <motion.div
                animate={{ x: isHovered ? 4 : 0 }}
                transition={{ duration: 0.2 }}
              >
                {/*
                  ADR: React Router Link + Button Pattern

                  Decision: Use Button asChild with Link for proper navigation semantics
                  Rationale:
                  - Avoids nested interactive elements (a > button)
                  - Maintains shadcn/ui Button styling
                  - Provides proper React Router navigation
                  - Supports keyboard accessibility (Enter/Space)
                  - No JavaScript required for navigation

                  Alternative considered: onClick with navigate() - requires JS and less semantic
                */}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full group/btn border border-border hover:border-border hover:bg-accent text-foreground shadow-none ring-0 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  asChild
                >
                  <Link
                    to={profileLink}
                    aria-label={`View ${photographer.full_name}'s profile`}
                    className="flex items-center justify-center"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    View Profile
                    <ArrowRight className="h-4 w-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </motion.div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Main Featured Photographers Section Component
const FeaturedPhotographersSection = ({
  title = "Featured Photographers",
  subtitle = "Handpicked, vetted wedding photographers ready for your date.",
  showStats = true,
  maxUsers = 6
}) => {
  const [photographers, setPhotographers] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch photographers first
      const photographersData = await getFeaturedPhotographers(maxUsers);
      setPhotographers(photographersData);

      // Then fetch metrics using photographer IDs
      if (showStats && photographersData.length > 0) {
        const photographerIds = photographersData.map(p => p.id);
        const metricsData = await getFeaturedPhotographersMetrics(photographerIds);
        setMetrics(metricsData);
      } else {
        setMetrics(null);
      }
    } catch (err) {
      console.error('Error fetching featured photographers data:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [maxUsers, showStats]);

  const handleRetry = () => {
    fetchData();
  };

  // Show error state
  if (error && !loading) {
    return (
      <section className="relative w-full py-20 px-4 bg-muted">
        <div className="relative mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="lp-h2 mb-4">
                {title}
              </h2>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                {subtitle}
              </p>
            </motion.div>
          </div>
          <ErrorState onRetry={handleRetry} />
        </div>
      </section>
    );
  }

  // Show empty state if no photographers and not loading
  if (!loading && photographers.length === 0 && !error) {
    return (
      <section className="relative w-full py-20 px-4 bg-muted">
        <div className="relative mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="lp-h2 mb-4">
                {title}
              </h2>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                {subtitle}
              </p>
            </motion.div>
          </div>
          <EmptyState />
        </div>
      </section>
    );
  }

  return (
    <section className="relative w-full py-20 px-4 bg-background">
      <div className="relative mx-auto max-w-7xl">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-4">
              {title}
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              {subtitle}
            </p>
          </motion.div>

          {/* New Metrics from Database - Temporarily Disabled for Testing */}
          {showStats && photographers.length > 0 && metrics && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="flex flex-wrap justify-center gap-8 mt-12 p-6 bg-muted/50 rounded-2xl border border-border"
            >
              <div className="text-center">
                <div className="text-3xl font-bold text-foreground tabular-nums">
                  {(metrics?.acceptanceRate ?? null) !== null ? `${Math.round(metrics.acceptanceRate)}%` : '—'}
                </div>
                <div className="text-sm text-muted-foreground">Booking Acceptance Rate (%)</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-foreground tabular-nums">
                  {(metrics?.fiveStarReviews ?? null) !== null ? `${metrics.fiveStarReviews}%` : '—'}
                </div>
                <div className="text-sm text-muted-foreground">5 Star Reviews (%)</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-foreground tabular-nums">
                  {(metrics?.responseTime ?? null) !== null ? `${Math.round(metrics.responseTime)} hrs` : '—'}
                </div>
                <div className="text-sm text-muted-foreground">Response Time (hrs)</div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Photographers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
          {loading ? (
            // Loading skeletons
            [...Array(maxUsers)].map((_, i) => (
              <SkeletonCard key={i} index={i} />
            ))
          ) : (
            // Real photographer cards
            photographers.map((photographer, index) => (
              <PhotographerCard
                key={photographer.id}
                photographer={photographer}
                index={index}
              />
            ))
          )}
        </div>

        {/* CTA Button - only show if we have photographers or there's an error */}
        {(!loading && (photographers.length > 0 || error)) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-center mt-12"
          >
            <Button
              variant="neutral"
              size="sm"
              className="rounded-full h-9 px-4 shadow-none"
              asChild
            >
              <Link to="/photographers" className="flex items-center justify-center">
                View Photographers
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </motion.div>
        )}
      </div>
    </section>
  );
};

export { FeaturedPhotographersSection, PhotographerCard, GridPattern };