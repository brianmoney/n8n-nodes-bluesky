import { INodeExecutionData, INodeProperties, IDataObject } from 'n8n-workflow';
import { AtpAgent } from '@atproto/api';

export const searchProperties: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['search'],
			},
		},
		options: [
			{
				name: 'Search Users',
				value: 'searchUsers',
				description: 'Search for users by keywords',
				action: 'Search for users by keywords',
			},
			{
				name: 'Search Posts',
				value: 'searchPosts',
				description: 'Search for posts by keywords',
				action: 'Search for posts by keywords',
			},
		],
		default: 'searchUsers',
	},
	// Common search query parameter for both operations
	{
		displayName: 'Search Query',
		name: 'q',
		type: 'string',
		default: '',
		required: true,
		description: 'Search query string',
		displayOptions: {
			show: {
				resource: ['search'],
				operation: ['searchUsers', 'searchPosts'],
			},
		},
	},
		// Common limit parameter
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		default: 50,
		description: 'Max number of results to return',
		typeOptions: {
			minValue: 1,
		},
		displayOptions: {
			show: {
				resource: ['search'],
				operation: ['searchUsers', 'searchPosts'],
			},
		},
	},
	{
		displayName: 'Author Handle',
		name: 'author',
		type: 'string',
		default: '',
		description: 'Filter to only posts by the specified author (handle or DID)',
		displayOptions: {
			show: {
				resource: ['search'],
				operation: ['searchPosts'],
			},
		},
	},
];

export async function searchUsersOperation(
	agent: AtpAgent,
	q: string,
	limit: number = 25,
): Promise<INodeExecutionData[]> {
	const returnData: INodeExecutionData[] = [];

	const searchParams = {
		q,
		limit,
	};
	
	try {
		const response = await agent.app.bsky.actor.searchActors(searchParams);
		
		if (response.data.actors && Array.isArray(response.data.actors)) {
			response.data.actors.forEach((actor) => {
				returnData.push({
					json: actor as unknown as IDataObject,
				} as INodeExecutionData);
			});
		}
		
		return returnData;
	} catch (error) {
		throw new Error(`Error searching users: ${error}`);
	}
}

export async function searchPostsOperation(
	agent: AtpAgent,
	q: string,
	limit: number = 25,
	author?: string,
): Promise<INodeExecutionData[]> {
	const returnData: INodeExecutionData[] = [];

	const searchParams: {
		q: string;
		limit: number;
		author?: string;
	} = {
		q,
		limit,
	};
	
	if (author) {
		searchParams.author = author;
	}
	
	try {
		// Using app.bsky.feed.searchPosts for post search
		const response = await agent.app.bsky.feed.searchPosts(searchParams);
		
		if (response.data.posts && Array.isArray(response.data.posts)) {
			response.data.posts.forEach((post) => {
				returnData.push({
					json: post as unknown as IDataObject,
				} as INodeExecutionData);
			});
		}
		
		return returnData;
	} catch (error) {
		throw new Error(`Error searching posts: ${error}`);
	}
}
