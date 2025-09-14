'use client';
import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { FacebookIcon, FrameIcon, InstagramIcon, LinkedinIcon, YoutubeIcon } from 'lucide-react';

const footerLinks = [
  {
    label: 'Clients',
    links: [
      { title: 'Find Photographers', href: '/photographers' },
      { title: 'How It Works', href: '/how-it-works' },
      { title: 'Pricing', href: '/pricing' },
      { title: 'Browse by Location', href: '/browse' }
    ]
  },
  {
    label: 'Photographers',
    links: [
      { title: 'Join as Photographer', href: '/signup?role=photographer' },
      { title: 'Resources', href: '/resources' },
      { title: 'FAQ', href: '/faq' },
      { title: 'Training', href: '/training' }
    ]
  },
  {
    label: 'Company',
    links: [
      { title: 'About Us', href: '/about' },
      { title: 'Contact', href: '/contact' },
      { title: 'Privacy Policy', href: '/privacy' },
      { title: 'Terms of Service', href: '/terms' }
    ]
  },
  {
    label: 'Connect',
    links: [
      { title: 'Facebook', href: 'https://facebook.com/loveandphotos', icon: FacebookIcon },
      { title: 'Instagram', href: 'https://instagram.com/loveandphotos', icon: InstagramIcon },
      { title: 'YouTube', href: 'https://youtube.com/loveandphotos', icon: YoutubeIcon },
      { title: 'LinkedIn', href: 'https://linkedin.com/company/loveandphotos', icon: LinkedinIcon }
    ]
  },
];

export function Footer() {
  return (
    <footer className='md:rounded-t-6xl relative w-full max-w-6xl mx-auto flex flex-col items-center justify-center rounded-t-4xl border-t bg-[radial-gradient(35%_128px_at_50%_0%,theme(backgroundColor.white/8%),transparent)] px-6 py-12 lg:py-16'>
      <div className='bg-foreground/20 absolute top-0 right-1/2 left-1/2 h-px w-1/3 -translate-x-1/2 -translate-y-1/2 rounded-full blur' />
      <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-6 md:gap-12 items-start'>
        {/* Col 1: Logo */}
        <AnimatedContainer className='flex flex-col items-start space-y-2'>
          <img
            src="/branding/logo.svg"
            alt="Love & Photos logo"
            className="block w-28 md:w-32 h-auto"
          />
          <p className='text-xs text-muted-foreground mt-2'>
            © 2025 Love & Photos
          </p>
        </AnimatedContainer>

        {/* Cols 2-5: Link columns */}
        {footerLinks.map((section, i) => (
          <AnimatedContainer key={section.label} delay={0.1 + i * 0.1}>
            <div className='space-y-2'>
              <h3 className='text-xs font-semibold uppercase tracking-wider text-gray-900 mb-4'>
                {section.label}
              </h3>
              <ul className='text-muted-foreground mt-4 space-y-2 text-sm'>
                {section.links.map(link => (
                  <li key={link.title}>
                    <a
                      href={link.href}
                      className='hover:text-foreground inline-flex items-center transition-all duration-300 text-gray-600 hover:text-gray-900'
                      target={link.href.startsWith('http') ? '_blank' : undefined}
                      rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
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