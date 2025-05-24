// Debug test to check mock structure
const { AtpAgent } = require('@atproto/api');

// Create an agent instance (this should use our mock)
const agent = new AtpAgent({});

console.log('Agent structure:');
console.log('agent:', typeof agent);
console.log('agent.api:', typeof agent.api);
console.log('agent.api?.chat:', typeof agent.api?.chat);
console.log('agent.api?.chat?.bsky:', typeof agent.api?.chat?.bsky);
console.log('agent.api?.chat?.bsky?.convo:', typeof agent.api?.chat?.bsky?.convo);

// Check if the nested structure exists
if (agent.api && agent.api.chat && agent.api.chat.bsky && agent.api.chat.bsky.convo) {
  console.log('Mock structure is correct');
  console.log('listConvos:', typeof agent.api.chat.bsky.convo.listConvos);
} else {
  console.log('Mock structure is broken');
  console.log('Full agent structure:', JSON.stringify(agent, null, 2));
}
