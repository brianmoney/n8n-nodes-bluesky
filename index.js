// Export class constructors (not module objects) so n8n can read descriptions
module.exports = {
	nodes: [
		require('./dist/nodes/Bluesky/Bluesky.node.js').Bluesky,
	],
	credentials: [
		require('./dist/credentials/BlueskyApi.credentials.js').BlueskyApi,
	],
};
