'use client';
import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { FacebookIcon, FrameIcon, InstagramIcon, LinkedinIcon, YoutubeIcon } from 'lucide-react';

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
    label: 'Clients',
    links: [
      { title: 'Book', href: '/photographers' },
      { title: 'Guide', href: '/how-it-works' },
      { title: 'Pricing', href: '/pricing' },
      { title: 'Locations', href: '/photographers' }
    ]
  },
  {
    label: 'Talent',
    links: [
      { title: 'Join', href: '/signup?role=photographer' },
      { title: 'Tools', href: '/resources' },
      { title: 'FAQ', href: '/faq' },
      { title: 'Learn', href: '/learn' }
    ]
  },
  {
    label: 'Company',
    links: [
      { title: 'About', href: '/about' },
      { title: 'Contact', href: '/contact' },
      { title: 'Privacy', href: '/privacy' },
      { title: 'Terms', href: '/terms' }
    ]
  },
  {
    label: 'Connect',
    links: [
      { title: 'Facebook', href: 'https://www.facebook.com/profile.php?id=61573197380793', icon: FacebookIcon },
      { title: 'Instagram', href: 'https://www.instagram.com/lovesandphotos/', icon: InstagramIcon },
      { title: 'Yelp', href: 'https://www.yelp.com/biz/love-and-photos-arden-arcade-2?utm_campaign=www_business_share_popup&utm_medium=copy_link&utm_source=(direct)', icon: YelpIcon },
      { title: 'The Knot', href: 'https://www.theknot.com/marketplace/love-and-photos-springfield-mo-2092546', icon: TheKnotIcon }
    ]
  },
];

export function Footer() {
  return (
    <footer className='md:rounded-t-6xl relative w-full max-w-[60rem] mx-auto flex flex-col items-center justify-center rounded-t-4xl border-t bg-[radial-gradient(35%_128px_at_50%_0%,theme(backgroundColor.white/8%),transparent)] px-6 py-12 lg:pt-8 lg:pb-4'>
      <div className='bg-foreground/20 absolute top-0 right-1/2 left-1/2 h-px w-1/3 -translate-x-1/2 -translate-y-1/2 rounded-full blur' />
      <div className='container mx-auto max-w-[60rem] px-4 md:px-6 py-10'>
        {/* Grid with custom template - fixed logo width, tighter inner columns */}
        <div className='grid grid-cols-2 gap-x-4 gap-y-8 items-start md:grid-cols-[200px_max-content_max-content_max-content_max-content] md:!gap-x-[5rem]'>
          {/* Logo column */}
          <AnimatedContainer className='col-span-2 md:col-span-1'>
            <img
              src="/branding/logo.svg"
              alt="Love & Photos logo"
              className="block w-28 md:w-32 h-auto md:ml-[65px]"
            />
            <p className='text-xs text-muted-foreground mt-2 md:ml-[65px]'>
              © 2025 Love & Photos
            </p>
          </AnimatedContainer>

          {/* All four link columns - no spacers */}
          {footerLinks.map((section, i) => (
            <AnimatedContainer key={section.label} delay={0.1 + i * 0.1} className='col-span-1 space-y-2'>
              <div className='space-y-2'>
              <h3 className='text-xs font-semibold uppercase tracking-wider text-foreground mb-4'>
                {section.label}
              </h3>
              <ul className='text-muted-foreground mt-4 space-y-2 text-sm'>
                {section.links.map(link => (
                  <li key={link.title}>
                    <a
                      href={link.href}
                      className='hover:text-foreground inline-flex items-center transition-all duration-300 text-muted-foreground hover:text-foreground'
                      target={link.href.startsWith('http') ? '_blank' : undefined}
                      rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                      aria-label={link.title}
                    >
                      {link.icon && <link.icon className='me-1 size-4' />}
                      {link.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </AnimatedContainer>
          ))}
        </div>
      </div>
    </footer>
  );
}

function AnimatedContainer({ className, delay = 0.1, children }) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ filter: 'blur(4px)', translateY: -8, opacity: 0 }}
      whileInView={{ filter: 'blur(0px)', translateY: 0, opacity: 1 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.8 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}