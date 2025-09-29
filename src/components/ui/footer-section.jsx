'use client';
import React from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import { 
  FacebookIcon, 
  InstagramIcon, 
  MapPinIcon,
  MailIcon,
  PhoneIcon 
} from 'lucide-react';

// Custom The Knot Icon Component
const TheKnotIcon = () => (
  <img
    src='/brands/knot.svg'
    alt='The Knot'
    className='h-5 w-5 object-contain'
  />
);

// Custom Yelp Icon Component
const YelpIcon = () => (
  <img
    src='/brands/yelp.svg'
    alt='Yelp'
    className='h-5 w-5 object-contain'
  />
);

const footerLinks = [
  {
    label: 'For Clients',
    links: [
      { title: 'Browse Photographers', href: '/photographers' },
      { title: 'How It Works', href: '/how-it-works' },
      { title: 'Pricing', href: '/pricing' },
      { title: 'Video Specialists', href: '/photographers/video' }
    ]
  },
  {
    label: 'For Photographers',
    links: [
      { title: 'Join Our Network', href: '/signup?role=photographer' },
      { title: 'Resources', href: '/resources' },
      { title: 'FAQ', href: '/faq' },
      { title: 'Learn', href: '/learn' }
    ]
  },
  {
    label: 'Company',
    links: [
      { title: 'About Us', href: '/about' },
      { title: 'Contact', href: '/contact' },
      { title: 'Privacy Policy', href: '/privacy' },
      { title: 'Terms & Conditions', href: '/terms' }
    ]
  },
  {
    label: 'Connect',
    links: [
      { 
        title: 'Facebook', 
        href: 'https://www.facebook.com/profile.php?id=61573197380793', 
        icon: FacebookIcon,
        external: true 
      },
      { 
        title: 'Instagram', 
        href: 'https://www.instagram.com/lovesandphotos/', 
        icon: InstagramIcon,
        external: true 
      },
      { 
        title: 'Yelp', 
        href: 'https://www.yelp.com/biz/love-and-photos-arden-arcade-2?utm_campaign=www_business_share_popup&utm_medium=copy_link&utm_source=(direct)', 
        icon: YelpIcon,
        external: true 
      },
      { 
        title: 'The Knot', 
        href: 'https://www.theknot.com/marketplace/love-and-photos-springfield-mo-2092546', 
        icon: TheKnotIcon,
        external: true 
      }
    ]
  },
];

export function Footer() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <footer 
      className='relative w-full bg-gradient-to-b from-background to-muted border-t'
      role="contentinfo"
      aria-label="Site footer"
    >
      {/* Decorative gradient line */}
      <div className='bg-foreground/20 absolute top-0 right-1/2 left-1/2 h-px w-1/3 -translate-x-1/2 -translate-y-1/2 rounded-full blur' />
      
      <div className='container mx-auto px-4 sm:px-6 lg:px-8 py-12'>
        {/* Main footer content */}
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12'>
          
          {/* Logo and tagline column */}
          <AnimatedContainer 
            className='col-span-1 sm:col-span-2 lg:col-span-1' 
            delay={0}
            shouldReduceMotion={shouldReduceMotion}
          >
            <Link to="/" className="inline-block mb-4" aria-label="Love & Photos - Go to homepage">
              <img
                src="/branding/logo.svg"
                alt="Love & Photos logo"
                className="h-10 w-auto"
              />
            </Link>
            <p className='text-sm text-muted-foreground mb-4'>
              Connecting moments with the perfect lens since 2024
            </p>
            <div className='space-y-2 text-sm text-muted-foreground'>
              <div className='flex items-center gap-2'>
                <MapPinIcon className='h-4 w-4 flex-shrink-0' />
                <span>Serving all major US cities</span>
              </div>
              <div className='flex items-center gap-2'>
                <PhoneIcon className='h-4 w-4 flex-shrink-0' />
                <a 
                  href="tel:1-800-PHOTOS" 
                  className='hover:text-foreground transition-colors'
                  aria-label="Call Love & Photos at 1-800-PHOTOS"
                >
                  1-800-PHOTOS
                </a>
              </div>
              <div className='flex items-center gap-2'>
                <MailIcon className='h-4 w-4 flex-shrink-0' />
                <a 
                  href="mailto:hello@loveandphotos.com" 
                  className='hover:text-foreground transition-colors'
                  aria-label="Email Love & Photos at hello@loveandphotos.com"
                >
                  hello@loveandphotos.com
                </a>
              </div>
            </div>
          </AnimatedContainer>

          {/* Link columns */}
          {footerLinks.map((section, i) => (
            <AnimatedContainer 
              key={section.label} 
              delay={0.1 + i * 0.05} 
              className='col-span-1'
              shouldReduceMotion={shouldReduceMotion}
            >
              <h3 className='text-sm font-semibold uppercase tracking-wider text-foreground mb-4'>
                {section.label}
              </h3>
              <ul className='space-y-3' role="list">
                {section.links.map(link => (
                  <li key={link.title}>
                    {link.external ? (
                      <a
                        href={link.href}
                        className='inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-[#fe395f] focus:ring-offset-2 focus:ring-offset-background rounded px-1 -mx-1'
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`${link.title} - opens in new window`}
                      >
                        {link.icon && <link.icon className='h-4 w-4' aria-hidden="true" />}
                        <span>{link.title}</span>
                      </a>
                    ) : (
                      <Link
                        to={link.href}
                        className={`inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-[#fe395f] focus:ring-offset-2 focus:ring-offset-background rounded px-1 -mx-1 ${
                          link.href === '/contact' ? 'font-medium' : ''
                        }`}
                        aria-label={link.title === 'Contact' ? 'Contact Love & Photos' : link.title}
                      >
                        {link.icon && <link.icon className='h-4 w-4' aria-hidden="true" />}
                        <span>{link.title}</span>
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </AnimatedContainer>
          ))}
        </div>

        {/* Bottom bar */}
        <div className='mt-12 pt-8 border-t border-border'>
          <div className='flex flex-col sm:flex-row justify-between items-center gap-4'>
            <p className='text-sm text-muted-foreground text-center sm:text-left'>
              © 2025 Love & Photos. All rights reserved.
            </p>
            <div className='flex items-center gap-6'>
              <Link 
                to='/privacy' 
                className='text-sm text-muted-foreground hover:text-foreground transition-colors'
              >
                Privacy
              </Link>
              <Link 
                to='/terms' 
                className='text-sm text-muted-foreground hover:text-foreground transition-colors'
              >
                Terms
              </Link>
              <Link 
                to='/sitemap' 
                className='text-sm text-muted-foreground hover:text-foreground transition-colors'
              >
                Sitemap
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

// Animated container component with accessibility support
function AnimatedContainer({ className = '', delay = 0.1, children, shouldReduceMotion }) {
  // Skip animation if user prefers reduced motion
  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ filter: 'blur(4px)', translateY: -8, opacity: 0 }}
      whileInView={{ filter: 'blur(0px)', translateY: 0, opacity: 1 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ delay, duration: 0.6, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Named export for compatibility
export default Footer;