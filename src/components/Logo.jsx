const Logo = ({ className = "w-8 h-8", animated = true }) => {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 100 100" 
      className={className}
    >
      <defs>
        {/* Gradient for modern look */}
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#EC4899', stopOpacity: 1 }} />
          <stop offset="50%" style={{ stopColor: '#F43F5E', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#FB923C', stopOpacity: 1 }} />
        </linearGradient>

        {/* Subtle shadow */}
        <filter id="softShadow">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.15"/>
        </filter>
      </defs>
      
      {/* Modern camera with heart viewfinder design */}
      <g filter="url(#softShadow)">
        {/* Camera body - rounded rectangle */}
        <rect 
          x="15" 
          y="35" 
          width="70" 
          height="45" 
          rx="8" 
          ry="8" 
          fill="url(#logoGradient)"
        />
        
        {/* Camera lens mount - circle */}
        <circle 
          cx="50" 
          cy="57" 
          r="16" 
          fill="white" 
          opacity="0.95"
        />
        
        {/* Inner lens ring */}
        <circle 
          cx="50" 
          cy="57" 
          r="12" 
          fill="none" 
          stroke="url(#logoGradient)" 
          strokeWidth="2"
        />
        
        {/* Heart-shaped aperture in center */}
        <path 
          d="M50 52 C47 49, 44 49, 44 52 C44 54, 47 58, 50 61 C53 58, 56 54, 56 52 C56 49, 53 49, 50 52Z" 
          fill="url(#logoGradient)"
        />
        
        {/* Viewfinder */}
        <rect 
          x="38" 
          y="25" 
          width="24" 
          height="8" 
          rx="2" 
          ry="2" 
          fill="url(#logoGradient)"
        />
        
        {/* Shutter button */}
        <circle 
          cx="75" 
          cy="30" 
          r="3" 
          fill="white"
          opacity="0.9"
        />
        
        {/* Flash/Light accent */}
        <rect 
          x="23" 
          y="42" 
          width="8" 
          height="8" 
          rx="1" 
          ry="1" 
          fill="white"
          opacity="0.8"
        />
        
        {/* Decorative dot */}
        <circle 
          cx="50" 
          cy="42" 
          r="1.5" 
          fill="white"
          opacity="0.7"
        />
      </g>

      {/* Optional animation - subtle pulse on the heart */}
      {animated && (
        <path 
          d="M50 52 C47 49, 44 49, 44 52 C44 54, 47 58, 50 61 C53 58, 56 54, 56 52 C56 49, 53 49, 50 52Z" 
          fill="url(#logoGradient)"
          opacity="0.3"
        >
          <animate 
            attributeName="opacity" 
            values="0;0.3;0" 
            dur="2s" 
            repeatCount="indefinite"
          />
          <animateTransform
            attributeName="transform"
            type="scale"
            values="1;1.2;1"
            dur="2s"
            additive="sum"
            repeatCount="indefinite"
            begin="0s"
          />
        </path>
      )}
    </svg>
  );
};

// Alternative minimalist design
export const LogoMinimal = ({ className = "w-8 h-8" }) => {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 100 100" 
      className={className}
    >
      <defs>
        <linearGradient id="minimalGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style={{ stopColor: '#EC4899', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#F43F5E', stopOpacity: 1 }} />
        </linearGradient>
      </defs>
      
      {/* Two overlapping circles forming an infinity/connection symbol with heart */}
      <g>
        {/* Left circle - camera lens */}
        <circle 
          cx="35" 
          cy="50" 
          r="22" 
          fill="none" 
          stroke="url(#minimalGradient)" 
          strokeWidth="4"
        />
        
        {/* Right circle forming heart shape */}
        <path 
          d="M65 35 Q55 25, 45 35 Q35 45, 45 60 Q55 75, 65 60 Q75 45, 65 35Z" 
          fill="none" 
          stroke="url(#minimalGradient)" 
          strokeWidth="4"
        />
        
        {/* Connection point */}
        <circle 
          cx="50" 
          cy="50" 
          r="3" 
          fill="url(#minimalGradient)"
        />
      </g>
    </svg>
  );
};

// Alternative: Abstract L&P monogram
export const LogoMonogram = ({ className = "w-8 h-8" }) => {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 100 100" 
      className={className}
    >
      <defs>
        <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#EC4899', stopOpacity: 1 }} />
          <stop offset="50%" style={{ stopColor: '#F43F5E', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#FB923C', stopOpacity: 1 }} />
        </linearGradient>
      </defs>
      
      {/* Gradient background with rounded corners */}
      <rect x="0" y="0" width="100" height="100" rx="20" fill="url(#bgGradient)" />
      
      {/* Decorative frame elements */}
      <g fill="none" stroke="white" strokeWidth="0.5" opacity="0.3">
        <circle cx="50" cy="50" r="40" />
        <path d="M20 20 L30 20 M70 20 L80 20 M20 80 L30 80 M70 80 L80 80" />
        <path d="M20 20 L20 30 M80 20 L80 30 M20 70 L20 80 M80 70 L80 80" />
      </g>
      
      {/* Modern serif L&P with wedding elegance */}
      <g fill="white">
        {/* Letter L - elegant serif style */}
        <g>
          {/* Main vertical stroke */}
          <rect x="26" y="28" width="6" height="32" />
          {/* Horizontal stroke */}
          <rect x="26" y="54" width="20" height="6" />
          {/* Top serif */}
          <path d="M26 28 L32 28 L32 30 L28 30 L28 32 L26 32 Z" />
          {/* Bottom right serif */}
          <path d="M44 54 L46 54 L46 60 L44 60 L44 58 L42 58 L42 56 L44 56 Z" />
        </g>
        
        {/* Decorative ampersand/plus */}
        <g opacity="0.9">
          <circle cx="50" cy="45" r="2" />
          <path d="M48 45 L52 45 M50 43 L50 47" strokeWidth="0.5" stroke="white" fill="none" />
        </g>
        
        {/* Letter P - elegant serif style */}
        <g>
          {/* Main vertical stroke */}
          <rect x="58" y="28" width="6" height="32" />
          {/* Top curve/bowl */}
          <path d="M58 28 L72 28 C78 28, 82 32, 82 38 C82 44, 78 48, 72 48 L58 48 L58 44 L72 44 C76 44, 78 42, 78 38 C78 34, 76 32, 72 32 L64 32 L64 28" />
          {/* Top serif */}
          <path d="M58 28 L64 28 L64 30 L60 30 L60 32 L58 32 Z" />
          {/* Bottom serif */}
          <path d="M58 60 L64 60 L64 58 L62 58 L62 56 L60 56 L60 58 L58 58 Z" />
        </g>
        
        {/* Heart accent between letters */}
        <path 
          d="M50 50 C48.5 48.5, 47 48.5, 47 50 C47 51, 48 52, 50 54 C52 52, 53 51, 53 50 C53 48.5, 51.5 48.5, 50 50Z" 
          fill="white"
          opacity="0.5"
        />
      </g>
      
      {/* Ornamental details */}
      <g fill="white" opacity="0.4">
        {/* Top ornament */}
        <path d="M45 20 C47 18, 50 17, 50 17 C50 17, 53 18, 55 20" fill="none" stroke="white" strokeWidth="1" />
        {/* Bottom ornament */}
        <path d="M45 80 C47 82, 50 83, 50 83 C50 83, 53 82, 55 80" fill="none" stroke="white" strokeWidth="1" />
        {/* Side flourishes */}
        <circle cx="15" cy="50" r="1" />
        <circle cx="85" cy="50" r="1" />
      </g>
      
      {/* Subtle sparkles */}
      <g fill="white">
        <circle cx="20" cy="20" r="0.8" opacity="0.6"/>
        <circle cx="80" cy="80" r="0.8" opacity="0.6"/>
        <circle cx="80" cy="20" r="0.6" opacity="0.4"/>
        <circle cx="20" cy="80" r="0.6" opacity="0.4"/>
      </g>
    </svg>
  );
};

export default Logo;