#!/bin/bash

# Comprehensive Test Execution Script for Photographer Thumbnail Testing
# Runs all test suites with proper setup and reporting

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BASE_URL=${BASE_URL:-"http://localhost:5173"}
SCREENSHOT_DIR="tests/screenshots"
COVERAGE_DIR="coverage"
REPORT_DIR="test-reports"

# Functions
print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Cleanup function
cleanup() {
    if [ ! -z "$DEV_SERVER_PID" ]; then
        print_info "Stopping development server (PID: $DEV_SERVER_PID)"
        kill $DEV_SERVER_PID 2>/dev/null || true
        wait $DEV_SERVER_PID 2>/dev/null || true
    fi
}

# Trap cleanup on exit
trap cleanup EXIT

# Create directories
mkdir -p "$SCREENSHOT_DIR"
mkdir -p "$COVERAGE_DIR"
mkdir -p "$REPORT_DIR"

print_header "Photographer Thumbnail Testing Suite"

# Check if dev server is running
check_server() {
    if curl -s "$BASE_URL" > /dev/null 2>&1; then
        print_success "Development server is running at $BASE_URL"
        return 0
    else
        return 1
    fi
}

# Start dev server if needed
if ! check_server; then
    print_info "Starting development server..."
    npm run dev:direct > /dev/null 2>&1 &
    DEV_SERVER_PID=$!

    # Wait for server to start
    for i in {1..30}; do
        if check_server; then
            print_success "Development server started (PID: $DEV_SERVER_PID)"
            break
        fi
        if [ $i -eq 30 ]; then
            print_error "Failed to start development server"
            exit 1
        fi
        sleep 2
    done
fi

# Test execution flags
RUN_UNIT=${RUN_UNIT:-true}
RUN_INTEGRATION=${RUN_INTEGRATION:-true}
RUN_E2E=${RUN_E2E:-true}
RUN_PERFORMANCE=${RUN_PERFORMANCE:-true}
GENERATE_COVERAGE=${GENERATE_COVERAGE:-true}

# Unit Tests
if [ "$RUN_UNIT" = "true" ]; then
    print_header "Running Unit Tests"

    if npm run test -- --testPathPattern="photographer-thumbnails.unit.test.jsx" --verbose; then
        print_success "Unit tests passed"
    else
        print_error "Unit tests failed"
        exit 1
    fi
fi

# Integration Tests
if [ "$RUN_INTEGRATION" = "true" ]; then
    print_header "Running Integration Tests"

    if npm run test -- --testPathPattern="photographer-grid-integration.test.jsx" --verbose; then
        print_success "Integration tests passed"
    else
        print_error "Integration tests failed"
        exit 1
    fi
fi

# E2E Tests
if [ "$RUN_E2E" = "true" ]; then
    print_header "Running E2E Tests"

    # Install Playwright browsers if needed
    if ! npx playwright --version > /dev/null 2>&1; then
        print_info "Installing Playwright browsers..."
        npx playwright install
    fi

    if npx playwright test tests/photographer-thumbnail-e2e.spec.js --reporter=html --output-dir="$REPORT_DIR/e2e"; then
        print_success "E2E tests passed"
        print_info "E2E report available at: $REPORT_DIR/e2e/index.html"
    else
        print_error "E2E tests failed"
        exit 1
    fi
fi

# Performance Tests
if [ "$RUN_PERFORMANCE" = "true" ]; then
    print_header "Running Performance Tests"

    if npx playwright test tests/performance/photographer-grid-performance.spec.js --reporter=html --output-dir="$REPORT_DIR/performance"; then
        print_success "Performance tests passed"
        print_info "Performance report available at: $REPORT_DIR/performance/index.html"
    else
        print_error "Performance tests failed"
        exit 1
    fi
fi

# Generate Coverage Report
if [ "$GENERATE_COVERAGE" = "true" ]; then
    print_header "Generating Coverage Report"

    if npm run test:coverage -- --testPathPattern="photographer" --collectCoverageFrom="src/components/ui/featured-photographers.jsx,src/lib/supabaseClient.js"; then
        print_success "Coverage report generated"
        print_info "Coverage report available at: $COVERAGE_DIR/lcov-report/index.html"
    else
        print_warning "Coverage generation completed with warnings"
    fi
fi

# Summary Report
print_header "Test Results Summary"

# Check screenshot directory
SCREENSHOT_COUNT=$(find "$SCREENSHOT_DIR" -name "*.png" 2>/dev/null | wc -l || echo 0)
print_info "Generated $SCREENSHOT_COUNT screenshots"

# Check if any tests failed
if [ -f "$REPORT_DIR/e2e/index.html" ]; then
    print_success "E2E test report generated"
fi

if [ -f "$REPORT_DIR/performance/index.html" ]; then
    print_success "Performance test report generated"
fi

if [ -d "$COVERAGE_DIR" ] && [ "$(ls -A $COVERAGE_DIR)" ]; then
    print_success "Coverage report generated"
fi

# Performance summary
if [ -f "test-results.json" ]; then
    print_info "Performance metrics logged to test-results.json"
fi

print_header "Test Suite Completed Successfully"

# Provide useful commands for manual testing
print_info "Useful commands for manual testing:"
echo "  🔍 View E2E report:       open $REPORT_DIR/e2e/index.html"
echo "  📊 View performance:      open $REPORT_DIR/performance/index.html"
echo "  📋 View coverage:         open $COVERAGE_DIR/lcov-report/index.html"
echo "  🖼️  View screenshots:      ls -la $SCREENSHOT_DIR/"
echo "  🔄 Re-run specific test:  npm test -- --testNamePattern='thumbnail rendering'"
echo "  🎭 Re-run E2E only:       npx playwright test tests/photographer-thumbnail-e2e.spec.js"
echo "  ⚡ Re-run performance:    npx playwright test tests/performance/"

print_success "All photographer thumbnail tests completed successfully! 🎉"