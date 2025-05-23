import { INodeExecutionData, INodeProperties, IDataObject } from 'n8n-workflow';
import {
	AppBskyActorGetProfile,
	AppBskyGraphGetFollowers,
	AppBskyGraphGetFollows,
	AppBskyGraphMuteActor,
	AppBskyGraphUnmuteActor,
	AtpAgent,
	AtUri,
} from '@atproto/api';

export const userProperties: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['user'],
			},
		},
		options: [
			{
				name: 'Block User',
				value: 'block',
				description:
					'Blocking a user prevents interaction and hides the user from the client experience',
				action: 'Block a user',
			},
			{
				name: 'Get Profile',
				value: 'getProfile',
				description: 'Get detailed profile view of an actor',
				action: 'Get detailed profile view of an actor',
			},
			{
				name: 'List All Followers',
				value: 'listAllFollowers',
				description: 'Get all followers of a user with automatic pagination',
				action: 'List all followers of a user',
			},
			{
				name: 'List All Follows',
				value: 'listAllFollows',
				description: 'Get all accounts a user is following with automatic pagination',
				action: 'List all follows of a user',
			},
			{
				name: 'Mute User',
				value: 'mute',
				description: 'Muting a user hides their posts from your feeds',
				action: 'Mute a user',
			},
			/*
			Find an easy way to resolve the uri to provide a better user experience
			{
				name: 'Un-Block User',
				value: 'unblock',
				description: 'Unblocking a user restores interaction and shows the user in the client experience',
				action: 'Unblock a user',
			},*/
			{
				name: 'Un-Mute User',
				value: 'unmute',
				description: 'Muting a user hides their posts from your feeds',
				action: 'Unmute a user',
			},
		],
		default: 'getProfile',
	},
	{
		displayName: 'Did',
		name: 'did',
		type: 'string',
		default: '',
		required: true,
		description: 'The DID of the user',
		hint: 'The getProfile operation can be used to get the DID of a user',
		displayOptions: {
			show: {
				resource: ['user'],
				operation: ['mute', 'unmute', 'block'],
			},
		},
	},
	{
		displayName: 'Actor',
		name: 'actor',
		type: 'string',
		default: '',
		required: true,
		description: 'Handle or DID of account to fetch profile of',
		displayOptions: {
			show: {
				resource: ['user'],
				operation: ['getProfile'],
			},
		},
	},
	{
		displayName: 'Handle',
		name: 'handle',
		type: 'string',
		default: '',
		required: true,
		description: 'Handle or DID of the actor whose followers to fetch',
		displayOptions: {
			show: {
				resource: ['user'],
				operation: ['listAllFollowers'],
			},
		},
	},
	{
		displayName: 'Handle',
		name: 'handle',
		type: 'string',
		default: '',
		required: true,
		description: 'Handle or DID of the actor whose follows to fetch',
		displayOptions: {
			show: {
				resource: ['user'],
				operation: ['listAllFollows'],
			},
		},
	},
	{
		displayName: 'Max Results',
		name: 'maxResults',
		type: 'number',
		default: 1000,
		description: 'Maximum number of followers to fetch (default: 1000)',
		typeOptions: {
			minValue: 1,
		},
		displayOptions: {
			show: {
				resource: ['user'],
				operation: ['listAllFollowers'],
			},
		},
	},
	{
		displayName: 'Max Results',
		name: 'maxResults',
		type: 'number',
		default: 1000,
		description: 'Maximum number of follows to fetch (default: 1000)',
		typeOptions: {
			minValue: 1,
		},
		displayOptions: {
			show: {
				resource: ['user'],
				operation: ['listAllFollows'],
			},
		},
	},
	{
		displayName: 'Page Size',
		name: 'pageSize',
		type: 'number',
		default: 100,
		description: 'Number of followers to fetch per request (default: 100, max: 100)',
		typeOptions: {
			minValue: 1,
			maxValue: 100,
		},
		displayOptions: {
			show: {
				resource: ['user'],
				operation: ['listAllFollowers'],
			},
		},
	},
	{
		displayName: 'Page Size',
		name: 'pageSize',
		type: 'number',
		default: 100,
		description: 'Number of follows to fetch per request (default: 100, max: 100)',
		typeOptions: {
			minValue: 1,
			maxValue: 100,
		},
		displayOptions: {
			show: {
				resource: ['user'],
				operation: ['listAllFollows'],
			},
		},
	},
	{
		displayName: 'Uri',
		name: 'uri',
		type: 'string',
		description: 'The URI of the user',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['user'],
				operation: ['unblock'],
			},
		},
	},
];

export async function muteOperation(agent: AtpAgent, did: string): Promise<INodeExecutionData[]> {
	const returnData: INodeExecutionData[] = [];
	const muteResponse: AppBskyGraphMuteActor.Response = await agent.mute(did);

	returnData.push({
		json: muteResponse as Object,
	} as INodeExecutionData);

	return returnData;
}

export async function unmuteOperation(agent: AtpAgent, did: string): Promise<INodeExecutionData[]> {
	const returnData: INodeExecutionData[] = [];
	const unmuteResponse: AppBskyGraphUnmuteActor.Response = await agent.unmute(did);

	returnData.push({
		json: unmuteResponse as Object,
	} as INodeExecutionData);

	return returnData;
}

export async function getProfileOperation(
	agent: AtpAgent,
	actor: string,
): Promise<INodeExecutionData[]> {
	const returnData: INodeExecutionData[] = [];
	const profileResponse: AppBskyActorGetProfile.Response = await agent.getProfile({
		actor: actor,
	});

	returnData.push({
		json: profileResponse.data as unknown as IDataObject,
	} as INodeExecutionData);

	return returnData;
}

export async function blockOperation(agent: AtpAgent, did: string): Promise<INodeExecutionData[]> {
	const returnData: INodeExecutionData[] = [];

	const { uri } = await agent.app.bsky.graph.block.create(
		{ repo: agent.session!.did }, // owner DID
		{
			subject: did, // DID of the user to block
			createdAt: new Date().toISOString(),
		},
	);

	returnData.push({
		json: {
			uri,
		},
	} as INodeExecutionData);

	return returnData;
}

export async function unblockOperation(
	agent: AtpAgent,
	uri: string,
): Promise<INodeExecutionData[]> {
	const returnData: INodeExecutionData[] = [];
	const { rkey } = new AtUri(uri);

	await agent.app.bsky.graph.block.delete({
		repo: agent.session!.did, // Assuming block records are in the user's own repo
		rkey,
	});

	returnData.push({
		json: {
			uri,
		},
	} as INodeExecutionData);

	return returnData;
}

export async function listAllFollowersOperation(
	agent: AtpAgent,
	handle: string,
	maxResults: number = 1000,
	pageSize: number = 100,
): Promise<INodeExecutionData[]> {
	const returnData: INodeExecutionData[] = [];
	
	let total = 0;
	let cursor: string | undefined = undefined;
	const results: any[] = [];
	
	// Loop through all pages using the built-in getFollowers method
	while (total < maxResults) {
		const followersResponse: AppBskyGraphGetFollowers.Response = await agent.app.bsky.graph.getFollowers({
			actor: handle,
			limit: Math.min(pageSize, maxResults - total),
			cursor: cursor,
		});
		
		// Append followers to results
		if (followersResponse.data.followers && Array.isArray(followersResponse.data.followers)) {
			results.push(...followersResponse.data.followers);
			total += followersResponse.data.followers.length;
		}
		
		// Check if we should continue
		if (!followersResponse.data.cursor || total >= maxResults) {
			break;
		}
		
		cursor = followersResponse.data.cursor;
	}
	
	// Trim results to maxResults if needed
	const finalResults = results.slice(0, maxResults);
	
	// Return items in the format expected by n8n
	finalResults.forEach((follower) => {
		returnData.push({
			json: follower,
		});
	});
	
	return returnData;
}

export async function listAllFollowsOperation(
	agent: AtpAgent,
	handle: string,
	maxResults: number = 1000,
	pageSize: number = 100,
): Promise<INodeExecutionData[]> {
	const returnData: INodeExecutionData[] = [];
	
	let total = 0;
	let cursor: string | undefined = undefined;
	const results: any[] = [];
	
	// Loop through all pages using the built-in getFollows method
	while (total < maxResults) {
		const followsResponse: AppBskyGraphGetFollows.Response = await agent.app.bsky.graph.getFollows({
			actor: handle,
			limit: Math.min(pageSize, maxResults - total),
			cursor: cursor,
		});
		
		// Append follows to results
		if (followsResponse.data.follows && Array.isArray(followsResponse.data.follows)) {
			results.push(...followsResponse.data.follows);
			total += followsResponse.data.follows.length;
		}
		
		// Check if we should continue
		if (!followsResponse.data.cursor || total >= maxResults) {
			break;
		}
		
		cursor = followsResponse.data.cursor;
	}
	
	// Trim results to maxResults if needed
	const finalResults = results.slice(0, maxResults);
	
	// Return items in the format expected by n8n
	finalResults.forEach((follow) => {
		returnData.push({
			json: follow,
		});
	});
	
	return returnData;
}
