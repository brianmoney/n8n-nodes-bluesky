#!/usr/bin/env bash
# install.sh: Deploy n8n-nodes-bluesky-enhanced into your n8n custom modules directory

set -euo pipefail

DEST="/home/brian/stacks/seatable-compose/n8n/custom/n8n-nodes-bluesky-enhanced"

echo "Building the project first..."
npm run build

echo "Removing existing directory: $DEST"
rm -rf "$DEST"

echo "Creating destination directory: $DEST"
mkdir -p "$DEST"

echo "Copying package.json and index.js to $DEST"
cp -v package.json index.js "$DEST"

echo "Copying dist/ directory to $DEST"
cp -rv dist "$DEST"

echo "Creating production-only package.json for deployment..."
cd "$DEST"

# Create a temporary package.json without the preinstall script and dev dependencies
cat > package.json << 'EOF'
{
  "name": "n8n-nodes-bluesky-enhanced",
  "version": "1.6.0",
  "description": "Enhanced BlueSky API nodes for n8n with list management, follower/follows pagination, search functionality, media posting, thread management, reply/quote operations, and analytics features",
  "main": "index.js",
  "n8n": {
    "n8nNodesApiVersion": 1,
    "credentials": [
      "dist/credentials/BlueskyApi.credentials.js"
    ],
    "nodes": [
      "dist/nodes/Bluesky/Bluesky.node.js"
    ]
  },
  "dependencies": {
    "@atproto/api": "^0.15.8",
    "@atproto/syntax": "^0.4.0",
    "image-size": "^1.1.1",
    "open-graph-scraper": "^6.8.2"
  }
}
EOF

echo "Installing production dependencies..."
npm install --omit=dev --no-audit --no-fund

echo "Deployment complete. You can now restart n8n to load the Bluesky Enhanced nodes."
