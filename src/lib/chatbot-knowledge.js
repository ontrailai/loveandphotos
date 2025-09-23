// Comprehensive Wedding Photography Knowledge Base for Love & Photos Chatbot

export const WEDDING_PHOTOGRAPHY_KNOWLEDGE = {
  // Photography Styles & Terminology
  styles: {
    candid: {
      name: 'Candid/Photojournalistic',
      description: 'Natural, unposed moments captured as they happen',
      bestFor: 'Couples who want authentic emotions and spontaneous moments',
      examples: 'Laughter during speeches, tears during vows, dancing moments'
    },
    posed: {
      name: 'Traditional/Posed',
      description: 'Carefully arranged and directed shots',
      bestFor: 'Formal family portraits, classic couple poses',
      examples: 'Family group photos, bridal party lineups, couple portraits'
    },
    artistic: {
      name: 'Fine Art/Editorial',
      description: 'Creative, stylized photography with artistic vision',
      bestFor: 'Fashion-forward couples, magazine-worthy shots',
      examples: 'Dramatic lighting, unique angles, creative compositions'
    },
    documentary: {
      name: 'Documentary',
      description: 'Story-telling approach capturing the full narrative',
      bestFor: 'Couples wanting comprehensive coverage of their day',
      examples: 'Getting ready, venue details, guest interactions, full timeline'
    }
  },

  // Video Terminology
  videoTerms: {
    highlightReel: {
      term: 'Highlight Reel',
      duration: '3-5 minutes',
      description: 'Cinematic summary of your best moments set to music',
      includes: ['Key ceremony moments', 'Best reception footage', 'Couple portraits', 'Music overlay']
    },
    fullCeremony: {
      term: 'Full Ceremony Edit',
      duration: '30-60 minutes',
      description: 'Complete ceremony coverage from processional to recessional',
      includes: ['Multiple angles', 'Full audio of vows', 'Readings and speeches', 'Guest reactions']
    },
    documentaryEdit: {
      term: 'Documentary/Feature Film',
      duration: '60-90 minutes',
      description: 'Full story of your wedding day from start to finish',
      includes: ['Getting ready', 'Full ceremony', 'Speeches', 'Reception highlights', 'Interviews']
    },
    rawFootage: {
      term: 'Raw Footage',
      duration: '4-8 hours',
      description: 'Unedited footage from all cameras',
      includes: ['All captured moments', 'Multiple angles', 'No color correction', 'No audio sync']
    }
  },

  // Common Questions & Concerns
  faqs: {
    timing: {
      booking: 'We recommend booking 6-12 months in advance, especially for peak season (May-October)',
      delivery: 'Photos typically delivered within 4-6 weeks, videos within 8-12 weeks',
      coverage: 'Most couples book 6-8 hours to cover ceremony through reception'
    },
    weather: {
      rain: 'Photographers come prepared with umbrellas, covers, and backup plans. Rain creates romantic photos!',
      backup: 'Indoor backup locations are always scouted in advance',
      rescheduling: 'Weather-related rescheduling policies vary by photographer'
    },
    logistics: {
      travel: 'Most photographers include local travel (within 50 miles). Additional fees may apply for destination weddings',
      meals: 'Please provide a vendor meal for shoots over 4 hours',
      timeline: 'Your photographer will help create a photo timeline to maximize coverage'
    },
    editing: {
      style: 'Each photographer has a signature editing style - view portfolios to find your preference',
      requests: 'Minor edit requests usually accommodated, major changes may incur fees',
      filters: 'Professional editing goes beyond filters - color grading, exposure, skin smoothing'
    },
    rights: {
      usage: 'You receive full personal usage rights with all packages',
      printing: 'Pro and Luxe packages include print rights',
      sharing: 'Share freely on social media - tag your photographer!'
    }
  },

  // Package Comparisons
  packageGuidance: {
    starter: {
      idealFor: ['Elopements', 'Small ceremonies', 'Engagement sessions', 'Courthouse weddings'],
      notIdealFor: ['Full-day weddings', 'Large guest counts', 'Multiple locations']
    },
    pro: {
      idealFor: ['Traditional weddings', 'Medium-sized events', 'Single venue', '50-150 guests'],
      notIdealFor: ['All-day coverage needs', 'Multiple photographers needed']
    },
    luxe: {
      idealFor: ['Full-day coverage', 'Large weddings', 'Multiple locations', 'Luxury events'],
      includes: ['Second shooter often included', 'Premium albums', 'Engagement session']
    }
  },

  // Trust Building Information
  trustFactors: {
    vetting: 'Every photographer goes through portfolio review, reference checks, and insurance verification',
    insurance: 'All photographers carry liability insurance and equipment insurance',
    contracts: 'Clear contracts protect both you and the photographer',
    reviews: 'All reviews are from verified bookings - no fake reviews',
    guarantee: 'If anything goes wrong, we\'ll make it right or refund your money'
  },

  // Booking Process Details
  bookingProcess: {
    steps: [
      'Browse and filter photographers',
      'View portfolios and read reviews',
      'Check availability via booking request',
      'Receive quotes within 24 hours',
      'Video call with top choices',
      'Secure booking with deposit',
      'Complete personalization quiz',
      'Pre-wedding consultation',
      'Your big day!',
      'Receive edited gallery'
    ],
    deposits: 'Typically 25-50% to secure date',
    payments: 'Remaining balance due 2-4 weeks before event',
    contracts: 'Digital contracts via DocuSign for convenience'
  },

  // Location-Specific Info
  locations: {
    losAngeles: {
      popularVenues: ['Malibu beaches', 'DTLA rooftops', 'Hollywood Hills estates'],
      peakSeason: 'March-November',
      averagePrice: '$2,500-5,000'
    },
    sanFrancisco: {
      popularVenues: ['Golden Gate views', 'Wine country', 'City Hall'],
      peakSeason: 'April-October',
      averagePrice: '$3,000-6,000'
    },
    sanDiego: {
      popularVenues: ['Beach ceremonies', 'Balboa Park', 'Historic venues'],
      peakSeason: 'Year-round',
      averagePrice: '$2,000-4,500'
    }
  },

  // Industry Insights
  tips: {
    budgeting: 'Allocate 10-15% of wedding budget to photography/videography',
    priorities: 'Photos last forever - prioritize this over flowers or favors',
    timeline: 'Build in buffer time - rushed photos show stress',
    preparation: 'Create a shot list of must-have photos',
    communication: 'Share Pinterest boards and inspiration with your photographer'
  }
}

// Response Generator Functions
export const generateSmartResponse = (intent, context = {}) => {
  const knowledge = WEDDING_PHOTOGRAPHY_KNOWLEDGE
  
  switch(intent) {
    case 'STYLE_QUESTION':
      return generateStyleResponse(context.style, knowledge)
    case 'PACKAGE_QUESTION':
      return generatePackageResponse(context.package, knowledge)
    case 'VIDEO_QUESTION':
      return generateVideoResponse(context.videoType, knowledge)
    case 'LOCATION_QUESTION':
      return generateLocationResponse(context.location, knowledge)
    case 'TRUST_QUESTION':
      return generateTrustResponse(context.concern, knowledge)
    case 'BOOKING_QUESTION':
      return generateBookingResponse(context.step, knowledge)
    default:
      return generateGenericHelpResponse(knowledge)
  }
}

const generateStyleResponse = (style, knowledge) => {
  const styleInfo = knowledge.styles[style]
  if (!styleInfo) return null
  
  return `**${styleInfo.name} Photography**

${styleInfo.description}

**Best for:** ${styleInfo.bestFor}
**Examples:** ${styleInfo.examples}

Would you like to see photographers who specialize in ${styleInfo.name.toLowerCase()} style?`
}

const generatePackageResponse = (packageType, knowledge) => {
  const guidance = knowledge.packageGuidance[packageType]
  if (!guidance) return null
  
  return `The **${packageType.charAt(0).toUpperCase() + packageType.slice(1)} Package** is perfect for:

${guidance.idealFor.map(item => `• ${item}`).join('\n')}

${guidance.notIdealFor ? `\n**May not be ideal for:**\n${guidance.notIdealFor.map(item => `• ${item}`).join('\n')}` : ''}

${guidance.includes ? `\n**Often includes:**\n${guidance.includes.map(item => `• ${item}`).join('\n')}` : ''}

Would you like to see the full package details and pricing?`
}

const generateVideoResponse = (videoType, knowledge) => {
  const videoInfo = knowledge.videoTerms[videoType]
  if (!videoInfo) return null
  
  return `**${videoInfo.term}**

Duration: ${videoInfo.duration}

${videoInfo.description}

**What's included:**
${videoInfo.includes.map(item => `• ${item}`).join('\n')}

This is one of our most popular video options. Would you like to see videographers who offer this service?`
}

const generateLocationResponse = (location, knowledge) => {
  const locationInfo = knowledge.locations[location]
  if (!locationInfo) return null
  
  return `**${location.replace(/([A-Z])/g, ' $1').trim()} Wedding Photography**

**Popular Venues:** ${locationInfo.popularVenues.join(', ')}
**Peak Season:** ${locationInfo.peakSeason}
**Average Investment:** ${locationInfo.averagePrice}

We have amazing photographers throughout ${location.replace(/([A-Z])/g, ' $1').trim()}! Would you like to browse local photographers?`
}

const generateTrustResponse = (concern, knowledge) => {
  const trust = knowledge.trustFactors
  
  return `I understand your concern. Here's how we ensure quality and trust:

• **Vetting:** ${trust.vetting}
• **Insurance:** ${trust.insurance}
• **Contracts:** ${trust.contracts}
• **Reviews:** ${trust.reviews}
• **Guarantee:** ${trust.guarantee}

Your peace of mind is our priority. What other questions can I answer?`
}

const generateBookingResponse = (step, knowledge) => {
  const process = knowledge.bookingProcess
  
  return `Here's our simple booking process:

${process.steps.map((step, index) => `${index + 1}. ${step}`).join('\n')}

**Deposit:** ${process.deposits}
**Final Payment:** ${process.payments}
**Contracts:** ${process.contracts}

Ready to start? Browse photographers to begin your journey!`
}

const generateGenericHelpResponse = (knowledge) => {
  return `I'm here to help you find your perfect wedding photographer! I can assist with:

• **Styles:** Candid, posed, artistic, or documentary
• **Packages:** Starter, Pro, or Luxe options
• **Video:** Highlight reels to full documentaries
• **Locations:** Photographers across California
• **Process:** How booking works
• **Trust:** Our quality guarantees

What would you like to explore first?`
}

// Intent Detection
export const detectIntent = (message) => {
  const lower = message.toLowerCase()
  
  // Style-related
  if (lower.match(/candid|posed|artistic|documentary|style|natural|traditional/)) {
    return { intent: 'STYLE_QUESTION', style: extractStyle(lower) }
  }
  
  // Package-related
  if (lower.match(/package|starter|pro|luxe|pricing|cost|budget/)) {
    return { intent: 'PACKAGE_QUESTION', package: extractPackage(lower) }
  }
  
  // Video-related
  if (lower.match(/video|highlight|reel|ceremony|documentary|footage/)) {
    return { intent: 'VIDEO_QUESTION', videoType: extractVideoType(lower) }
  }
  
  // Location-related
  if (lower.match(/los angeles|la|san francisco|sf|san diego|sacramento|location/)) {
    return { intent: 'LOCATION_QUESTION', location: extractLocation(lower) }
  }
  
  // Trust-related
  if (lower.match(/trust|quality|guarantee|insurance|verified|safe|refund/)) {
    return { intent: 'TRUST_QUESTION', concern: 'general' }
  }
  
  // Booking-related
  if (lower.match(/book|process|how|steps|deposit|payment|contract/)) {
    return { intent: 'BOOKING_QUESTION', step: 'overview' }
  }
  
  return { intent: 'GENERAL_HELP' }
}

// Helper extraction functions
const extractStyle = (text) => {
  if (text.includes('candid')) return 'candid'
  if (text.includes('posed') || text.includes('traditional')) return 'posed'
  if (text.includes('artistic')) return 'artistic'
  if (text.includes('documentary')) return 'documentary'
  return null
}

const extractPackage = (text) => {
  if (text.includes('starter')) return 'starter'
  if (text.includes('pro')) return 'pro'
  if (text.includes('luxe')) return 'luxe'
  return null
}

const extractVideoType = (text) => {
  if (text.includes('highlight') || text.includes('reel')) return 'highlightReel'
  if (text.includes('ceremony')) return 'fullCeremony'
  if (text.includes('documentary')) return 'documentaryEdit'
  if (text.includes('raw')) return 'rawFootage'
  return 'highlightReel' // default
}

const extractLocation = (text) => {
  if (text.includes('los angeles') || text.includes(' la ')) return 'losAngeles'
  if (text.includes('san francisco') || text.includes(' sf ')) return 'sanFrancisco'
  if (text.includes('san diego')) return 'sanDiego'
  if (text.includes('sacramento')) return 'sacramento'
  return null
}