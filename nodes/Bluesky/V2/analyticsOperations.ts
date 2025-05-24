import { INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { AtpAgent, AppBskyNotificationGetUnreadCount } from '@atproto/api';

// Import the enhanced listNotificationsOperation from notificationOperations
export { listNotificationsOperation } from './notificationOperations';

export const analyticsProperties: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['analytics'],
			},
		},
		options: [
			{
				name: 'List Notifications',
				value: 'listNotifications',
				description: 'List notifications for the authenticated user (enhanced with filters)',
				action: 'List notifications',
			},
			{
				name: 'Get Unread Notification Count',
				value: 'getUnreadCount',
				description: 'Get count of unread notifications for the authenticated user',
				action: 'Get unread notification count',
			},
			{
				name: 'Update Seen Notifications',
				value: 'updateSeenNotifications',
				description: 'Mark notifications as seen for the authenticated user',
				action: 'Mark notifications as seen',
			},
			{
				name: 'Get Post Interactions',
				value: 'getPostInteractions',
				description: 'Get likes, reposts, and replies for a post',
				action: 'Get post interactions',
			},
		],
		default: 'listNotifications',
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		typeOptions: {
			minValue: 1,
		},
		default: 50,
		description: 'Max number of results to return',
		displayOptions: {
			show: {
				resource: ['analytics'],
				operation: ['listNotifications'],
			},
		},
	},
	{
		displayName: 'Unread Only',
		name: 'unreadOnly',
		type: 'boolean',
		default: true,
		description: 'Whether to return only unread notifications. Note: Pagination is based on underlying API pages.',
		displayOptions: {
			show: {
				resource: ['analytics'],
				operation: ['listNotifications'],
			},
		},
	},
	{
		displayName: 'Mark Retrieved as Read',
		name: 'markRetrievedAsRead',
		type: 'boolean',
		default: true,
		description: 'Whether to mark retrieved notifications as read. For "List Notifications", if "Unread Only" is true, only the specifically retrieved unread items are marked.',
		displayOptions: {
			show: {
				resource: ['analytics'],
				operation: ['listNotifications'],
			},
		},
	},
	{
		displayName: 'Seen At (ISO Date String)',
		name: 'seenAt',
		type: 'string',
		default: '',
		description: 'Optional ISO 8601 date string. If provided, marks notifications up to this time as read. If not, uses current time.',
		displayOptions: {
			show: {
				resource: ['analytics'],
				operation: ['updateSeenNotifications'],
			},
		},
	},
	{
		displayName: 'Post URI',
		name: 'uri',
		type: 'string',
		default: '',
		required: true,
		description: 'The URI of the post to get interactions for',
		displayOptions: {
			show: {
				resource: ['analytics'],
				operation: ['getPostInteractions'],
			},
		},
	},
	{
		displayName: 'Interactions to Retrieve',
		name: 'interactionTypes',
		type: 'multiOptions',
		options: [
			{
				name: 'Likes',
				value: 'likes',
			},
			{
				name: 'Reposts',
				value: 'reposts',
			},
			{
				name: 'Replies',
				value: 'replies',
			},
		],
		default: ['likes', 'reposts', 'replies'],
		description: 'Types of interactions to retrieve',
		displayOptions: {
			show: {
				resource: ['analytics'],
				operation: ['getPostInteractions'],
			},
		},
	},
	{
		displayName: 'Interaction Limit',
		name: 'interactionLimit',
		type: 'number',
		typeOptions: {
			minValue: 1,
			maxValue: 100,
		},
		default: 50,
		description: 'Max number of each interaction type to return',
		displayOptions: {
			show: {
				resource: ['analytics'],
				operation: ['getPostInteractions'],
			},
		},
	},
];

/**
 * Get unread notification count
 */
export async function getUnreadCountOperation(
	agent: AtpAgent,
): Promise<INodeExecutionData[]> {
	const response: AppBskyNotificationGetUnreadCount.Response = await agent.app.bsky.notification.getUnreadCount();

	return [
		{
			json: {
				count: response.data.count,
			},
		},
	];
}

/**
 * Mark notifications as seen
 */
export async function updateSeenNotificationsOperation(
	agent: AtpAgent,
	seenAt?: string,
): Promise<INodeExecutionData[]> {
	const timestamp = seenAt || new Date().toISOString();
	
	await agent.app.bsky.notification.updateSeen({
		seenAt: timestamp,
	});

	return [
		{
			json: {
				success: true,
				seenAt: timestamp,
				message: `Notifications marked as seen up to ${timestamp}`,
			},
		},
	];
}

/**
 * Get post interactions (likes, reposts, and replies)
 */
export async function getPostInteractionsOperation(
	agent: AtpAgent,
	uri: string,
	interactionTypes: string[],
	interactionLimit: number,
): Promise<INodeExecutionData[]> {
	const interactions: { [key: string]: any } = {};

	// Get likes if requested
	if (interactionTypes.includes('likes')) {
		const likesResponse = await agent.getLikes({
			uri,
			limit: interactionLimit,
		});

		interactions.likes = likesResponse.data.likes.map(like => ({
			actor: like.actor,
			createdAt: like.createdAt,
			indexedAt: like.indexedAt,
		}));
	}

	// Get reposts if requested
	if (interactionTypes.includes('reposts')) {
		const repostsResponse = await agent.getRepostedBy({
			uri,
			limit: interactionLimit,
		});

		interactions.reposts = repostsResponse.data.repostedBy;
	}

	// Get replies if requested
	if (interactionTypes.includes('replies')) {
		// First get the thread to access replies
		const threadResponse = await agent.getPostThread({
			uri,
			depth: 1,
		});

		if (threadResponse.data.thread && 'replies' in threadResponse.data.thread) {
			const replies = threadResponse.data.thread.replies || [];
			interactions.replies = replies
				.filter(reply => '$type' in reply && reply.$type === 'app.bsky.feed.defs#threadViewPost')
				.map(reply => {
					// Type assertion after filtering to ensure it's a ThreadViewPost
					const threadReply = reply as any;
					return {
						post: threadReply.post,
						author: threadReply.post?.author,
					};
				})
				.slice(0, interactionLimit);
		} else {
			interactions.replies = [];
		}
	}

	// Add analytics summary
	interactions.analytics = {
		likeCount: interactions.likes?.length || 0,
		repostCount: interactions.reposts?.length || 0, 
		replyCount: interactions.replies?.length || 0,
	};

	return [{
		json: interactions,
	}];
}
