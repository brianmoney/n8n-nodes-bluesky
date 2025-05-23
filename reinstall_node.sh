#!/bin/bash

# Helper script to completely reinstall the n8n-nodes-bluesky-enhanced package
# This will ensure the cache is cleared and the new version is properly installed

# Step 1: Uninstall the current package (if any)
echo "Uninstalling current version of n8n-nodes-bluesky-enhanced..."
npm uninstall -g n8n-nodes-bluesky-enhanced

# Step 2: Clear n8n node cache
echo "Clearing n8n node cache..."
rm -rf ~/.n8n/nodes/node_modules/n8n-nodes-bluesky-enhanced
rm -rf ~/.n8n/nodes/.cache

# Step 3: Install the latest version
echo "Installing latest version of n8n-nodes-bluesky-enhanced..."
npm install -g n8n-nodes-bluesky-enhanced

# Step 4: Restart n8n (if it's running as a service)
echo "Attempting to restart n8n service..."
if systemctl is-active --quiet n8n; then
  sudo systemctl restart n8n
  echo "n8n service has been restarted"
else
  echo "n8n service not found, might be running in another way"
  echo "Please manually restart your n8n instance"
fi

echo "Done! Please check version with: npm list -g n8n-nodes-bluesky-enhanced"
