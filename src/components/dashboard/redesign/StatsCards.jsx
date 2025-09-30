/**
 * Stats Cards - Exact Magic MCP Design
 * Copied directly from Magic MCP output
 */

import { motion, useReducedMotion } from 'framer-motion'
import { Package, Calendar, CheckCircle2, Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import Progress from '@components/ui/Progress'
import Card from '@components/ui/Card'

const StatsCards = ({ stats = {} }) => {
  const shouldReduceMotion = useReducedMotion()
  const shouldAnimate = !shouldReduceMotion

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 28,
      },
    },
  }

  const statsData = [
    {
      name: "Total Bookings",
      stat: stats.totalBookings || 0,
      percentage: ((stats.totalBookings || 0) / 15) * 100,
      icon: Package,
      color: "text-blue-500"
    },
    {
      name: "Upcoming",
      stat: stats.upcomingEvents || 0,
      percentage: stats.totalBookings > 0
        ? ((stats.upcomingEvents || 0) / stats.totalBookings) * 100
        : 0,
      icon: Calendar,
      color: "text-green-500"
    },
    {
      name: "Completed",
      stat: stats.completedBookings || (stats.totalBookings - stats.upcomingEvents) || 0,
      percentage: stats.totalBookings > 0
        ? (((stats.totalBookings - stats.upcomingEvents) || 0) / stats.totalBookings) * 100
        : 0,
      icon: CheckCircle2,
      color: "text-purple-500"
    },
    {
      name: "Reviews Given",
      stat: stats.reviewsGiven || 0,
      percentage: stats.totalBookings > 0
        ? ((stats.reviewsGiven || 0) / stats.totalBookings) * 100
        : 0,
      icon: Star,
      color: "text-amber-500"
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {statsData.map((item) => {
        const Icon = item.icon
        return (
          <motion.div
            key={item.name}
            variants={shouldAnimate ? itemVariants : {}}
            initial={shouldAnimate ? "hidden" : false}
            animate={shouldAnimate ? "visible" : false}
          >
            <Card className="py-4 hover:shadow-lg transition-shadow duration-300">
              <div className="px-6">
                <div className="flex items-center justify-between mb-2">
                  <dt className="text-sm text-muted-foreground">{item.name}</dt>
                  <Icon className={cn("w-5 h-5", item.color)} />
                </div>
                <dd className="text-2xl font-semibold text-foreground mb-4">
                  {item.stat}
                </dd>
                <Progress value={item.percentage} className="h-2" />
                <dd className="mt-2 flex items-center justify-between text-sm">
                  <span className="text-primary">{Math.round(item.percentage)}%</span>
                </dd>
              </div>
            </Card>
          </motion.div>
        )
      })}
    </div>
  )
}

export default StatsCards