# Love & Photos AI Chat Assistant Documentation

## Overview
A fully integrated, intelligent AI chatbot for the Love & Photos marketplace that provides real-time assistance with booking questions, pricing inquiries, photographer selection, and wedding media expertise.

## Features

### 🎯 Core Capabilities
- **Intelligent Responses**: Context-aware responses based on wedding photography expertise
- **Package Guidance**: Detailed explanations of Starter, Pro, and Luxe packages
- **Photographer Recommendations**: Help users find photographers by location, style, and specialty
- **Video Add-On Information**: Explain highlight reels, ceremony coverage, and documentary options
- **Trust Building**: Address common concerns with quality guarantees and vetting information
- **Booking Support**: Guide users through the booking process step-by-step

### 🎨 User Interface
- **Floating Chat Button**: Gradient-styled button with brand colors (#fe395f)
- **Animated Chat Window**: Smooth animations with motion/react
- **Typing Indicators**: Visual feedback during response generation
- **Suggestion Chips**: Quick action buttons for common queries
- **Responsive Design**: Optimized for mobile, tablet, and desktop
- **Dark Mode Support**: Automatic theme adaptation

### 📊 Admin Features
- **Chat Monitor Dashboard**: Real-time conversation monitoring at `/admin/chat-monitor`
- **Unanswered Questions Queue**: Track questions requiring human attention
- **Analytics Dashboard**: Conversation metrics and satisfaction rates
- **Export Functionality**: Download chat data for analysis
- **Search & Filter**: Find specific conversations quickly

## Technical Implementation

### Component Structure
```
src/
├── components/
│   ├── ui/
│   │   └── ChatAssistant.jsx       # Main chat UI component
│   └── admin/
│       └── ChatMonitor.jsx         # Admin monitoring dashboard
├── contexts/
│   └── ChatContext.jsx             # Global chat state management
├── lib/
│   ├── chatbot-knowledge.js        # Wedding photography expertise
│   └── chatbot-supabase-schema.sql # Database schema
```

### Key Technologies
- **React**: Component architecture
- **Motion/React**: Animations and transitions
- **Tailwind CSS**: Styling and responsive design
- **Supabase**: Backend database and real-time features
- **LocalStorage**: Conversation persistence

## Knowledge Base

### Photography Styles
- **Candid/Photojournalistic**: Natural, unposed moments
- **Traditional/Posed**: Formal portraits and group photos
- **Fine Art/Editorial**: Creative, magazine-worthy shots
- **Documentary**: Comprehensive storytelling approach

### Package Information
| Package | Price | Coverage | Photos | Best For |
|---------|-------|----------|--------|----------|
| Starter | $149  | 1 hour   | 50+    | Elopements, small ceremonies |
| Pro     | $349  | 3 hours  | 150+   | Traditional weddings |
| Luxe    | $749  | 6+ hours | 400+   | Full-day coverage |

### Video Add-Ons
- **Highlight Reel** (+$500): 3-5 minute cinematic edit
- **Full Ceremony** (+$750): Complete ceremony coverage
- **Documentary Edit** (+$1500): 60-90 minute full story

## Usage Examples

### Common User Queries
```javascript
// Package questions
"What's the difference between Starter and Pro packages?"
"Which package is best for a 100-person wedding?"

// Location-based
"Do you have female photographers in Los Angeles?"
"Show me videographers in San Francisco"

// Trust & Quality
"How do you vet your photographers?"
"What if my photographer gets sick?"

// Booking Process
"How does booking work?"
"What's your cancellation policy?"
```

### Response Patterns
The chatbot uses intelligent pattern matching to provide contextual responses:

1. **Intent Detection**: Analyzes user message for keywords and context
2. **Knowledge Retrieval**: Matches intent to knowledge base
3. **Response Generation**: Creates personalized response with relevant information
4. **Action Suggestions**: Provides clickable chips for next steps

## Integration Points

### Public Pages
The ChatAssistant component is automatically included in:
- `PublicLayout` - All public-facing pages
- `ClientLayout` - Customer dashboard pages
- `Layout` - General pages

### Route References
The chatbot can direct users to:
- `/photographers` - Browse all photographers
- `/photographers/video` - Video specialists only
- `/pricing/client` - Package pricing details
- `/guide` - How booking works
- `/contact` - Human support (footer only)

## Database Schema

### Tables
- `chat_conversations` - Stores conversation metadata
- `chat_messages` - Individual messages within conversations
- `chat_analytics` - Daily aggregated metrics
- `chat_faq_cache` - Cached responses for common questions

### Key Features
- Row-level security for privacy
- Automatic conversation stats updates
- Daily analytics calculation
- FAQ caching for performance

## Performance Optimization

### Caching Strategy
- LocalStorage for recent conversations (20 messages max)
- 24-hour auto-clear for privacy
- FAQ response caching in database

### Loading Optimization
- Lazy loading of chat component
- Debounced typing indicators
- Efficient re-renders with React hooks

## Security & Privacy

### Data Protection
- No collection of sensitive data (SSN, credit cards)
- Optional user authentication
- Conversation data encrypted at rest
- 24-hour automatic cleanup

### Access Control
- Anonymous users can chat
- Authenticated users see their history
- Admins have full monitoring access

## Testing Guide

### User Testing Scenarios
1. **Package Inquiry Flow**
   - Ask about packages
   - Compare features
   - Get pricing information

2. **Photographer Discovery**
   - Search by location
   - Filter by specialty
   - Request specific attributes

3. **Trust Building**
   - Ask about guarantees
   - Inquire about vetting
   - Check cancellation policies

### Admin Testing
1. Access `/admin/chat-monitor`
2. Verify conversation display
3. Test search and filters
4. Export data functionality
5. Mark questions as answered

## Deployment Checklist

- [x] ChatAssistant component created
- [x] Knowledge base configured
- [x] Admin monitor implemented
- [x] Database schema ready
- [x] Context provider setup
- [x] Layout integration complete
- [ ] Supabase tables created
- [ ] RLS policies applied
- [ ] Analytics cron job scheduled
- [ ] Production testing complete

## Future Enhancements

### Phase 2
- Claude AI integration for dynamic responses
- Multi-language support
- Voice input/output
- Proactive chat triggers
- A/B testing framework

### Phase 3
- Machine learning for intent improvement
- Sentiment analysis
- Lead scoring
- CRM integration
- Advanced analytics dashboard

## Maintenance

### Regular Tasks
- Review unanswered questions weekly
- Update FAQ cache monthly
- Analyze conversation patterns quarterly
- Refine response templates based on feedback

### Monitoring
- Check daily analytics for anomalies
- Monitor satisfaction rates
- Track response times
- Review escalation patterns

## Support

For technical support or questions about the chatbot:
1. Check admin dashboard for common issues
2. Review this documentation
3. Contact technical team for assistance

---

*Last Updated: [Current Date]*
*Version: 1.0.0*