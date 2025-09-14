import { motion } from "motion/react";
import { Star } from "lucide-react";

// Utility function to render star ratings
const renderStars = (rating) => {
  return Array.from({ length: 5 }, (_, i) => (
    <Star
      key={i}
      className={`w-4 h-4 ${
        i < rating
          ? "fill-amber-400 text-amber-400"
          : "fill-muted text-muted"
      }`}
    />
  ));
};

// Animation variants for the testimonial cards
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

// Individual testimonial card component
const TestimonialCard = ({ testimonial, index }) => {
  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className="bg-card p-6 rounded-2xl shadow-sm border border-border hover:shadow-md transition-shadow duration-300"
    >
      {/* Rating stars */}
      <div className="flex space-x-1 mb-4">
        {renderStars(testimonial.rating)}
      </div>

      {/* Review text */}
      <blockquote className="text-foreground mb-6 leading-relaxed">
        "{testimonial.comment}"
      </blockquote>

      {/* Author info */}
      <div className="flex items-center space-x-3">
        <div className="flex-shrink-0">
          {testimonial.avatar ? (
            <img
              src={testimonial.avatar}
              alt={testimonial.name}
              className="w-12 h-12 rounded-full object-cover border-2 border-border"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/30 flex items-center justify-center">
              <span className="text-primary font-medium text-lg">
                {testimonial.name.charAt(0)}
              </span>
            </div>
          )}
        </div>
        <div>
          <div className="font-medium text-foreground">{testimonial.name}</div>
          {testimonial.location && (
            <div className="text-sm text-muted-foreground">{testimonial.location}</div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// Main testimonials grid component
export default function TestimonialsColumns({ testimonials, className = "" }) {
  if (!testimonials || testimonials.length === 0) {
    return null;
  }

  // Split testimonials into three columns for desktop layout
  const columns = [[], [], []];
  testimonials.forEach((testimonial, index) => {
    columns[index % 3].push(testimonial);
  });

  return (
    <div className={`w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${className}`}>
      {/* Mobile layout - single column */}
      <div className="grid md:hidden gap-6">
        {testimonials.slice(0, 6).map((testimonial, index) => (
          <TestimonialCard
            key={testimonial.id}
            testimonial={testimonial}
            index={index}
          />
        ))}
      </div>

      {/* Desktop layout - three columns with staggered animations */}
      <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {columns.map((column, columnIndex) => (
          <motion.div
            key={columnIndex}
            className="space-y-6"
            initial={{ opacity: 0, x: columnIndex % 2 === 0 ? -50 : 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{
              duration: 0.8,
              delay: columnIndex * 0.2,
              ease: "easeOut"
            }}
          >
            {column.map((testimonial, index) => (
              <TestimonialCard
                key={testimonial.id}
                testimonial={testimonial}
                index={index}
              />
            ))}
          </motion.div>
        ))}
      </div>
    </div>
  );
}