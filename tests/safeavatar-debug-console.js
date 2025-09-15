/**
 * SafeAvatar Debug Console Script
 * Run this in the browser console on /photographers page to diagnose thumbnail failures
 */

(function() {
  console.log('🔍 SafeAvatar Debug Analysis Starting...');
  console.log('===============================================');

  // Function to validate image URL (copy of SafeAvatar logic)
  const isValidImageUrl = (url) => {
    if (!url) return false;

    try {
      const urlObj = new URL(url);
      const validPatterns = [
        'avatar',
        'profile',
        'user',
        'photo',
        'gravatar',
        'githubusercontent',
        'googleusercontent',
        'supabase'
      ];

      const urlString = urlObj.toString().toLowerCase();
      return validPatterns.some(pattern => urlString.includes(pattern)) ||
             /\.(jpg|jpeg|png|gif|webp|svg)($|\?)/i.test(urlString);
    } catch {
      return url.startsWith('/') || url.startsWith('data:') || url.startsWith('blob:');
    }
  };

  // Function to test URL accessibility
  const testUrlAccess = async (url) => {
    try {
      const response = await fetch(url, {
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-cache'
      });
      return {
        accessible: true,
        status: response.status,
        type: response.type,
        headers: Object.fromEntries(response.headers.entries())
      };
    } catch (error) {
      return {
        accessible: false,
        error: error.message,
        name: error.name
      };
    }
  };

  // Main analysis function
  const analyzePhotographerAvatars = async () => {
    // Find all photographer cards
    const cards = document.querySelectorAll('[data-testid="photographer-card"], .cursor-pointer');
    console.log(`📊 Found ${cards.length} photographer cards to analyze`);

    if (cards.length === 0) {
      console.warn('⚠️ No photographer cards found. Make sure you\'re on the /photographers page');
      return;
    }

    const results = [];

    // Analyze first 10 cards to avoid overwhelming
    const cardsToAnalyze = Array.from(cards).slice(0, 10);

    for (let i = 0; i < cardsToAnalyze.length; i++) {
      const card = cardsToAnalyze[i];
      console.log(`\n🔍 Analyzing Card ${i + 1}:`);

      // Find SafeAvatar component
      const avatarContainer = card.querySelector('[class*="rounded-full"]');
      const avatarImg = card.querySelector('img');
      const avatarText = card.querySelector('[class*="rounded-full"] span');

      // Extract photographer data from DOM
      const nameElement = card.querySelector('h3');
      const name = nameElement?.textContent?.trim() || `Photographer ${i + 1}`;

      let avatarSrc = null;
      if (avatarImg) {
        avatarSrc = avatarImg.src || avatarImg.getAttribute('src');
      }

      const result = {
        cardIndex: i + 1,
        name,
        avatarSrc,
        hasImage: !!avatarImg,
        hasInitials: !!avatarText,
        isShowingFallback: !!avatarText && !avatarImg,
        validationResult: null,
        accessibilityResult: null
      };

      console.log(`  👤 Name: ${name}`);
      console.log(`  🖼️ Has Image Element: ${result.hasImage}`);
      console.log(`  🔤 Showing Initials: ${result.isShowingFallback}`);

      if (avatarSrc) {
        console.log(`  🔗 Avatar URL: ${avatarSrc}`);

        // Test SafeAvatar validation
        result.validationResult = isValidImageUrl(avatarSrc);
        console.log(`  ✅ URL Validation: ${result.validationResult ? 'PASS' : 'FAIL'}`);

        // Test actual accessibility
        console.log(`  🌐 Testing URL accessibility...`);
        result.accessibilityResult = await testUrlAccess(avatarSrc);

        if (result.accessibilityResult.accessible) {
          console.log(`  ✅ URL Access: SUCCESS (${result.accessibilityResult.status})`);
        } else {
          console.log(`  ❌ URL Access: FAILED - ${result.accessibilityResult.error}`);
        }
      } else {
        console.log(`  ❌ No avatar URL found`);
      }

      results.push(result);

      // Small delay to avoid overwhelming the browser
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Summary analysis
    console.log('\n📋 SUMMARY ANALYSIS:');
    console.log('===============================================');

    const totalAnalyzed = results.length;
    const showingImages = results.filter(r => r.hasImage && !r.isShowingFallback).length;
    const showingFallbacks = results.filter(r => r.isShowingFallback).length;
    const validUrls = results.filter(r => r.validationResult === true).length;
    const accessibleUrls = results.filter(r => r.accessibilityResult?.accessible === true).length;

    console.log(`📊 Total Cards Analyzed: ${totalAnalyzed}`);
    console.log(`🖼️ Showing Images: ${showingImages} (${Math.round(showingImages/totalAnalyzed*100)}%)`);
    console.log(`🔤 Showing Fallbacks: ${showingFallbacks} (${Math.round(showingFallbacks/totalAnalyzed*100)}%)`);
    console.log(`✅ Valid URLs: ${validUrls}/${totalAnalyzed} (${Math.round(validUrls/totalAnalyzed*100)}%)`);
    console.log(`🌐 Accessible URLs: ${accessibleUrls}/${totalAnalyzed} (${Math.round(accessibleUrls/totalAnalyzed*100)}%)`);

    // Problem identification
    console.log('\n🚨 PROBLEM IDENTIFICATION:');
    console.log('===============================================');

    if (showingFallbacks > showingImages) {
      console.warn('⚠️ SYSTEMATIC FALLBACK ISSUE: Most avatars showing initials instead of images');

      if (validUrls < totalAnalyzed * 0.5) {
        console.error('❌ URL VALIDATION FAILURE: SafeAvatar validation rejecting valid URLs');
      }

      if (accessibleUrls < totalAnalyzed * 0.5) {
        console.error('❌ NETWORK ACCESS FAILURE: URLs not accessible (CORS, 404, etc.)');
      }
    }

    // Detailed results for manual inspection
    console.log('\n📝 DETAILED RESULTS:');
    console.log('===============================================');
    console.table(results.map(r => ({
      Card: r.cardIndex,
      Name: r.name.slice(0, 20),
      'Has Image': r.hasImage,
      'Showing Fallback': r.isShowingFallback,
      'Valid URL': r.validationResult,
      'Accessible': r.accessibilityResult?.accessible || 'N/A',
      'Error': r.accessibilityResult?.error?.slice(0, 30) || 'None'
    })));

    return results;
  };

  // Export for manual use
  window.debugSafeAvatar = {
    analyze: analyzePhotographerAvatars,
    isValidImageUrl,
    testUrlAccess
  };

  console.log('🚀 Debug tools loaded! Run: window.debugSafeAvatar.analyze()');

  // Auto-run analysis
  setTimeout(() => {
    console.log('🔄 Auto-running analysis...');
    analyzePhotographerAvatars();
  }, 1000);

})();