import React from 'react';
import { Footer } from '../components/ui/footer-section';

export default function Demo() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-center mb-8">Love & Photos Footer Demo</h1>
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Component Features</h2>
          <ul className="space-y-2 text-gray-700">
            <li>✨ Smooth scroll-triggered animations using Motion</li>
            <li>🎨 Radial gradient background with blur accent</li>
            <li>📱 Fully responsive grid layout</li>
            <li>♿ Reduced motion support for accessibility</li>
            <li>🔗 External links open in new tabs with security attributes</li>
            <li>📍 Complete Love & Photos navigation links</li>
          </ul>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8 mb-16">
          <h2 className="text-2xl font-semibold mb-4">Animation Details</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2">Motion Effects:</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Initial blur (4px) → clear on scroll</li>
                <li>• Vertical translation (-8px) → 0</li>
                <li>• Opacity fade-in (0 → 1)</li>
                <li>• Staggered delays per section</li>
                <li>• 0.8s smooth transitions</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Accessibility:</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Respects user motion preferences</li>
                <li>• Falls back to static display</li>
                <li>• Viewport-triggered animations</li>
                <li>• One-time animation execution</li>
                <li>• Semantic HTML structure</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Spacer to demonstrate scroll behavior */}
        <div className="h-96"></div>
      </div>

      {/* Footer Component Demo */}
      <Footer />
    </div>
  );
}