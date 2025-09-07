#!/bin/bash

# LoveP Marketplace - Quick Setup Script
# This script helps set up the development environment

echo "🚀 LoveP Marketplace Setup"
echo "========================="
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from example..."
    cp .env.example .env
    echo "✅ .env file created"
    echo ""
    echo "⚠️  IMPORTANT: Please edit .env with your actual credentials:"
    echo "   - Supabase URL and Anon Key"
    echo "   - Stripe Publishable Key"
    echo ""
else
    echo "✅ .env file already exists"
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo "✅ Dependencies installed"
else
    echo "✅ Dependencies already installed"
fi

# Install additional dev dependencies for better DX
echo ""
echo "📦 Installing additional development tools..."
npm install -D concurrently express cors

echo ""
echo "🎨 Setup Complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env with your Supabase and Stripe credentials"
echo "2. Run 'npm run dev' to start the development server"
echo "3. Visit http://localhost:5173"
echo ""
echo "Need help? Check out:"
echo "- README.md for general information"
echo "- PHASE1_COMPLETE.md for architecture details"
echo "- PHASE2_IMPLEMENTATION.md for feature documentation"
echo ""
echo "Happy coding! 🎉"
