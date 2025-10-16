/**
 * Empty State - Exact Magic MCP Design
 * Copied directly from Magic MCP output
 */

import { motion, useReducedMotion } from 'framer-motion'
import { Calendar } from 'lucide-react'
import { Link } from 'react-router-dom'

const EmptyState = () => {
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

  return (
    <motion.div
      variants={shouldAnimate ? itemVariants : {}}
      initial={shouldAnimate ? "hidden" : false}
      animate={shouldAnimate ? "visible" : false}
      className="bg-muted/30 rounded-xl p-12 text-center"
    >
      <Calendar className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
      <h3 className="text-xl font-semibold mb-2">No Upcoming Bookings</h3>
      <p className="text-muted-foreground mb-6">
        Book your next photography session to get started
      </p>
      <Link to="/browse">
        <motion.button
          whileHover={shouldAnimate ? { scale: 1.05 } : {}}
          whileTap={shouldAnimate ? { scale: 0.95 } : {}}
          className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
        >
          Browse Photographers
        </motion.button>
      </Link>
    </motion.div>
  )
}

export default EmptyState