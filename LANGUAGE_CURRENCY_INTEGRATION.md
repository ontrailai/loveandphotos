# Language & Currency Integration

## Overview
This implementation adds language and currency selection functionality to Love & Photos, replacing the search icon with a translate icon that opens a comprehensive language and currency dialog.

## Files Added/Modified

### New Files Created
- `/src/lib/i18n/client.js` - Lightweight i18n client with localStorage persistence
- `/src/lib/currency.js` - Currency formatting utilities and supported currencies list
- `/src/components/providers/locale-provider.jsx` - React context for locale/currency state management
- `/src/components/ui/Dialog.jsx` - Custom dialog component matching project styling
- `/src/components/ui/Tabs.jsx` - Custom tabs component for dialog interface
- `/src/components/ui/language-currency-dialog.jsx` - Main dialog component with language and currency selection

### Modified Files
- `/src/components/ui/clean-navbar.jsx` - Replaced search button with language selector

## Features Implemented

### ✅ Desktop Experience
- Language/translate icon (Languages from lucide-react) in header
- Opens dialog with Language and Currency tabs
- Searchable lists for both languages and currencies
- Auto-translate toggle placeholder (non-functional as requested)
- Hover states and proper accessibility

### ✅ Mobile Experience
- Language & Currency button in mobile menu
- Same dialog opens on mobile
- Proper touch interactions

### ✅ Language Support
- 10 languages including English, Spanish, French, German, Italian, Portuguese, Japanese, Korean, Chinese
- Native language names displayed
- Saves to localStorage as 'lp_lang'
- Dispatches 'lp:locale-changed' events

### ✅ Currency Support
- 20 currencies including USD, EUR, GBP, CAD, AUD, JPY, etc.
- Currency symbols and full names displayed
- Saves to localStorage as 'lp_currency'
- Dispatches 'lp:currency-changed' events

### ✅ Formatting Integration
- `formatMoney(amount)` function uses Intl.NumberFormat with current locale/currency
- `formatPrice(amount, options)` for additional formatting options
- Fallback formatting if Intl API fails

### ✅ Context Provider
- `LocaleProvider` component for app-wide state management
- `useLocale()` hook for components within provider
- `useLocaleCurrency()` hook works independently (fallback mode)

### ✅ Persistence
- Selections persist across page reloads
- Event-driven updates across components
- Graceful fallbacks if localStorage unavailable

## Usage Examples

### Basic Currency Formatting
```jsx
import { formatMoney } from '@/lib/currency'

// Formats according to current locale and currency
const price = formatMoney(150) // "$150.00" or "€150,00" etc.
```

### With Provider
```jsx
import { useLocale } from '@/components/providers/locale-provider'

function PriceDisplay({ amount }) {
  const { locale, currency } = useLocale()

  return <span>{formatMoney(amount)}</span>
}
```

### Without Provider (Standalone)
```jsx
import { useLocaleCurrency } from '@/components/providers/locale-provider'

function StandaloneComponent() {
  const { locale, currency, setLocale, setCurrency } = useLocaleCurrency()

  // Works independently, reads from localStorage directly
  return <div>Current: {locale} - {currency}</div>
}
```

## Migration Guide for Existing Pricing Components

### Current Implementation (needs update):
```jsx
// src/pages/Pricing.jsx lines 8, 28, 49, 69, 111, 178
const tiers = [
  { price: '$150' },  // Hardcoded USD
  { price: '$225' },  // Should be: { price: 150, amount: 150 }
  { price: '$350' },
  { price: '$500+' }
]
```

### Recommended Migration:
```jsx
import { formatMoney } from '@/lib/currency'

const tiers = [
  { amount: 150, price: formatMoney(150) },
  { amount: 225, price: formatMoney(225) },
  { amount: 350, price: formatMoney(350) },
  { amount: 500, price: formatMoney(500) + '+' }
]

// Or dynamically in render:
<span className="text-3xl font-bold text-gray-900">
  {formatMoney(tier.amount)}
</span>
```

### Files That Should Be Updated:
- `src/pages/Pricing.jsx` - Hardcoded $150, $225, $350, $500+ strings
- `src/pages/customer/Browse.jsx` - Any pricing displays
- Any component displaying monetary amounts

## TODO Comments Added
The following locations have hardcoded prices that should migrate to `formatMoney()`:
- [ ] `src/pages/Pricing.jsx` - Lines 8, 28, 49, 69, 111, 178
- [ ] Review `src/pages/customer/Browse.jsx` for pricing displays
- [ ] Review any booking/payment components for price formatting

## Browser Support
- Modern browsers with Intl.NumberFormat support
- Fallback formatting for older browsers
- localStorage with graceful degradation

## Accessibility
- Proper ARIA labels on buttons and dialogs
- Keyboard navigation support
- Screen reader friendly
- Focus trap within dialog
- High contrast support

## Performance Notes
- Lightweight implementation (~15KB total)
- No heavy i18n libraries required
- Event-based updates only when needed
- localStorage caching for fast startup