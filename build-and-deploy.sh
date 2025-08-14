#!/bin/bash

echo "🚀 Building and Deploying ZenVerse..."

# Build Frontend
echo "📦 Building Frontend..."
cd client
npm run build
cd ..

# Build Backend
echo "🔧 Building Backend..."
cd server
npm install --production
cd ..

echo "✅ Build Complete!"
echo ""
echo "🌐 Next Steps:"
echo "1. Push to GitHub: git add . && git commit -m 'Ready for deployment' && git push"
echo "2. Go to render.com and create new Web Service for backend"
echo "3. Create Static Site for frontend"
echo "4. Set environment variables"
echo "5. Deploy!"
echo ""
echo "📖 See DEPLOYMENT_GUIDE.md for detailed instructions"
