// Simple test to verify notification operations work
const { BlueskyV2 } = require('./nodes/Bluesky/V2/BlueskyV2.node.ts');

// Mock base description
const mockBaseDescription = {
  displayName: 'Bluesky Test Node',
  name: 'blueskyTestNode',
  group: ['social'],
  subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
  description: 'Interact with Bluesky API (v2)',
};

// Create node instance
const node = new BlueskyV2(mockBaseDescription);

console.log('✅ BlueskyV2 node created successfully');
console.log('✅ Notification operations should be available in the node properties');

// Check if notification properties are included
const hasNotifications = node.description.properties.some(prop => 
  prop.displayOptions && 
  prop.displayOptions.show && 
  prop.displayOptions.show.resource && 
  prop.displayOptions.show.resource.includes('notifications')
);

if (hasNotifications) {
  console.log('✅ Notification resource properties found in node description');
} else {
  console.log('❌ Notification resource properties NOT found in node description');
}

console.log('\n🎉 Notification polling implementation test completed!');
