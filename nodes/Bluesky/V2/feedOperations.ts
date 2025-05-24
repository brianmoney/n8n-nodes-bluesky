import { AppBskyFeedGetAuthorFeed, AppBskyFeedGetTimeline, AtpAgent } from '@atproto/api';
import { INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { FeedViewPost } from '@atproto/api/dist/client/types/app/bsky/feed/defs';

export const feedProperties: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['feed'],
			},
		},
		options: [
			{
				name: 'Get Author Feed',
				value: 'getAuthorFeed',
				description: 'Author feeds return posts by a single user',
				action: 'Retrieve feed with posts by a single user',
			},
			{
				name: 'Get Post Thread',
				value: 'getPostThread',
				description: 'Retrieve the full context of a post thread',
				action: 'Retrieve a post thread',
			},
			{
				name: 'Timeline',
				value: 'getTimeline',
				description:
					'The default chronological feed of posts from users the authenticated user follows',
				action: 'Retrieve user timeline',
			},
		],
		default: 'getAuthorFeed',
	},
	{
		displayName: 'Actor',
		name: 'actor',
		type: 'string',
		default: '',
		required: true,
		description: "The DID of the author whose posts you'd like to fetch",
		hint: 'The user getProfile operation can be used to get the DID of a user',
		displayOptions: {
			show: {
				resource: ['feed'],
				operation: ['getAuthorFeed'],
			},
		},
	},
	{
		displayName: 'Post URI',
		name: 'uri',
		type: 'string',
		default: '',
		required: true,
		description: 'The URI of the post to fetch the thread for',
		displayOptions: {
			show: {
				resource: ['feed'],
				operation: ['getPostThread'],
			},
		},
	},
	{
		displayName: 'Depth',
		name: 'depth',
		type: 'number',
		typeOptions: {
			minValue: 0,
		},
		default: 6,
		description: 'Depth of parent replies to fetch (max 1000)',
		displayOptions: {
			show: {
				resource: ['feed'],
				operation: ['getPostThread'],
			},
		},
	},
	{
		displayName: 'Parent Height',
		name: 'parentHeight',
		type: 'number',
		typeOptions: {
			minValue: 0,
		},
		default: 80,
		description: 'Depth of child replies to fetch (max 1000)',
		displayOptions: {
			show: {
				resource: ['feed'],
				operation: ['getPostThread'],
			},
		},
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		typeOptions: {
			minValue: 1,
		},
		default: 50,
		required: true,
		description: 'Max number of results to return',
		displayOptions: {
			show: {
				resource: ['feed'],
				operation: ['getAuthorFeed', 'getTimeline'],
			},
		},
	},
	{
		displayName: 'Filter',
		name: 'filter',
		type: 'options',
		default: 'posts_with_replies',
		description: 'Filter posts by type',
		options: [
			{
				name: 'Posts and Author Threads',
				value: 'posts_and_author_threads',
				description: 'Posts and threads authored by the user',
			},
			{
				name: 'Posts with Media',
				value: 'posts_with_media',
				description: 'Only posts containing media attachments',
			},
			{
				name: 'Posts with Replies',
				value: 'posts_with_replies',
				description: 'All posts, including replies',
			},
			{
				name: 'Posts with Video',
				value: 'posts_with_video',
				description: 'Only posts containing video content',
			},
			{
				name: 'Posts without Replies',
				value: 'posts_no_replies',
				description: 'Only top-level posts (excludes replies)',
			},
		],
		displayOptions: {
			show: {
				resource: ['feed'],
				operation: ['getAuthorFeed'],
			},
		},
	},
];

export async function getAuthorFeed(
	agent: AtpAgent,
	actor: string,
	limit: number,
	filter?: string,
): Promise<INodeExecutionData[]> {
	const returnData: INodeExecutionData[] = [];
	const authorFeedResponse: AppBskyFeedGetAuthorFeed.Response = await agent.getAuthorFeed({
		actor: actor,
		limit: limit,
		filter: filter,
	});

	authorFeedResponse.data.feed.forEach((feedPost: FeedViewPost) => {
		returnData.push({
			json: {
				post: feedPost.post,
				reply: feedPost.reply,
				reason: feedPost.reason,
				feedContext: feedPost.feedContext,
			},
		});
	});
	return returnData;
}

export async function getPostThread(
	agent: AtpAgent,
	uri: string,
	depth?: number,
	parentHeight?: number,
): Promise<INodeExecutionData[]> {
	const threadResponse = await agent.getPostThread({
		uri: uri,
		depth: depth,
		parentHeight: parentHeight,
	});

	if (!threadResponse.data.thread) {
		return [];
	}

	// The thread can be of various types, ensure it's serializable to JSON for n8n
	const threadJson = JSON.parse(JSON.stringify(threadResponse.data.thread));

	return [{ json: threadJson }];
}

export async function getTimeline(agent: AtpAgent, limit: number): Promise<INodeExecutionData[]> {
	const returnData: INodeExecutionData[] = [];
	const timelineResponse: AppBskyFeedGetTimeline.Response = await agent.getTimeline({
		limit: limit,
	});

	timelineResponse.data.feed.forEach((feedPost: FeedViewPost) => {
		returnData.push({
			json: {
				post: feedPost.post,
				reply: feedPost.reply,
				reason: feedPost.reason,
				feedContext: feedPost.feedContext,
			},
		});
	});
	return returnData;
}
