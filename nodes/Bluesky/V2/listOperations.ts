import { AtpAgent } from '@atproto/api';
import { INodeExecutionData, INodeProperties, IDataObject } from 'n8n-workflow';
import { AtUri } from '@atproto/syntax';

export const listProperties: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['list'],
			},
		},
		options: [
			{
				name: 'Add User to List',
				value: 'addUserToList',
				description: 'Add a user to a list',
				action: 'Add user to list',
			},
			{
				name: 'Create List',
				value: 'createList',
				description: 'Create a new custom list',
				action: 'Create a list',
			},
			{
				name: 'Delete List',
				value: 'deleteList',
				description: 'Delete a list',
				action: 'Delete a list',
			},
			{
				name: 'Get List Feed',
				value: 'getListFeed',
				description: 'Get posts from a specific list',
				action: 'Get list feed',
			},
			{
				name: 'Get Lists',
				value: 'getLists',
				description: 'Get all lists for a user',
				action: 'Get user lists',
			},
			{
				name: 'Remove User From List',
				value: 'removeUserFromList',
				description: 'Remove a user from a list',
				action: 'Remove user from list',
			},
			{
				name: 'Update List',
				value: 'updateList', 
				description: 'Update an existing list',
				action: 'Update a list',
			},
		],
		default: 'createList',
	},
	
	// List URI (for operations that need it)
	{
		displayName: 'List URI',
		name: 'listUri',
		type: 'string',
		required: true,
		default: '',
		description: 'The AT URI of the list',
		displayOptions: {
			show: {
				resource: ['list'],
				operation: ['updateList', 'deleteList', 'getListFeed', 'addUserToList', 'removeUserFromList'],
			},
		},
	},

	// Actor/User for getLists operation
	{
		displayName: 'Actor',
		name: 'actor',
		type: 'string',
		required: true,
		default: '',
		description: 'Handle or DID of the user whose lists to retrieve',
		displayOptions: {
			show: {
				resource: ['list'],
				operation: ['getLists'],
			},
		},
	},

	// List creation/update fields
	{
		displayName: 'List Name',
		name: 'name',
		type: 'string',
		required: true,
		default: '',
		description: 'Name of the list',
		displayOptions: {
			show: {
				resource: ['list'],
				operation: ['createList', 'updateList'],
			},
		},
	},
	{
		displayName: 'Purpose',
		name: 'purpose',
		type: 'options',
		required: true,
		default: 'app.bsky.graph.defs#curatelist',
		description: 'Purpose of the list',
		options: [
			{
				name: 'Curate List',
				value: 'app.bsky.graph.defs#curatelist',
				description: 'A curated list of users',
			},
			{
				name: 'Mod List',
				value: 'app.bsky.graph.defs#modlist',
				description: 'A moderation list',
			},
		],
		displayOptions: {
			show: {
				resource: ['list'],
				operation: ['createList', 'updateList'],
			},
		},
	},
	{
		displayName: 'Description',
		name: 'description',
		type: 'string',
		default: '',
		description: 'Description of the list',
		typeOptions: {
			rows: 3,
		},
		displayOptions: {
			show: {
				resource: ['list'],
				operation: ['createList', 'updateList'],
			},
		},
	},

	// User to add/remove from list
	{
		displayName: 'User DID',
		name: 'userDid',
		type: 'string',
		required: true,
		default: '',
		description: 'DID of the user to add or remove from the list',
		displayOptions: {
			show: {
				resource: ['list'],
				operation: ['addUserToList', 'removeUserFromList'],
			},
		},
	},

	// List item URI (for remove operation)
	{
		displayName: 'List Item URI',
		name: 'listItemUri',
		type: 'string',
		required: true,
		default: '',
		description: 'The AT URI of the list item to remove',
		displayOptions: {
			show: {
				resource: ['list'],
				operation: ['removeUserFromList'],
			},
		},
	},

	// Pagination options
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
				resource: ['list'],
				operation: ['getLists', 'getListFeed'],
			},
		},
	},
];

/**
 * Create a new list
 */
export async function createListOperation(
	agent: AtpAgent,
	name: string,
	purpose: string,
	description?: string,
): Promise<INodeExecutionData[]> {
	const returnData: INodeExecutionData[] = [];

	const record = {
		$type: 'app.bsky.graph.list',
		name,
		purpose,
		description: description || '',
		createdAt: new Date().toISOString(),
	};

	const response = await agent.com.atproto.repo.createRecord({
		repo: agent.session!.did,
		collection: 'app.bsky.graph.list',
		record,
	});

	returnData.push({
		json: {
			uri: response.data.uri,
			cid: response.data.cid,
			...record,
		},
	});

	return returnData;
}

/**
 * Update an existing list
 */
export async function updateListOperation(
	agent: AtpAgent,
	listUri: string,
	name: string,
	purpose: string,
	description?: string,
): Promise<INodeExecutionData[]> {
	const returnData: INodeExecutionData[] = [];
	const { rkey } = new AtUri(listUri);

	// Get the current record first
	const currentRecord = await agent.com.atproto.repo.getRecord({
		repo: agent.session!.did,
		collection: 'app.bsky.graph.list',
		rkey,
	});

	const updatedRecord = {
		$type: 'app.bsky.graph.list',
		name,
		purpose,
		description: description || '',
		createdAt: (currentRecord.data.value as any).createdAt || new Date().toISOString(),
	};

	const response = await agent.com.atproto.repo.putRecord({
		repo: agent.session!.did,
		collection: 'app.bsky.graph.list',
		rkey: rkey,
		record: updatedRecord,
	});

	returnData.push({
		json: {
			uri: listUri,
			cid: response.data.cid,
			...updatedRecord,
		},
	});

	return returnData;
}

/**
 * Delete a list
 */
export async function deleteListOperation(
    agent: AtpAgent,
    listUri: string,
): Promise<INodeExecutionData[]> {
    const returnData: INodeExecutionData[] = [];
    const { rkey } = new AtUri(listUri);

    await agent.com.atproto.repo.deleteRecord({
        repo: agent.session!.did,
        collection: 'app.bsky.graph.list',
        rkey,
    });

    returnData.push({
        json: {
            uri: listUri,
            deleted: true,
        } as IDataObject,
    });

    return returnData;
}

/**
 * Get all lists for a user
 */
export async function getListsOperation(
	agent: AtpAgent,
	actor: string,
	limit: number = 50,
	cursor?: string,
): Promise<INodeExecutionData[]> {
	const returnData: INodeExecutionData[] = [];

	const params: any = {
		actor,
		limit,
	};

	if (cursor) {
		params.cursor = cursor;
	}

	const response = await agent.app.bsky.graph.getLists(params);

	// Add lists to return data
	if (response.data.lists) {
		response.data.lists.forEach((list) => {
			returnData.push({
				json: list as unknown as IDataObject,
			});
		});
	}

	// Add pagination info if available
	if (response.data.cursor) {
		returnData.push({
			json: {
				cursor: response.data.cursor,
				pagination: true,
			},
		});
	}

	return returnData;
}

/**
 * Get feed from a specific list
 */
export async function getListFeedOperation(
	agent: AtpAgent,
	listUri: string,
	limit: number = 50,
	cursor?: string,
): Promise<INodeExecutionData[]> {
	const returnData: INodeExecutionData[] = [];

	const params: any = {
		list: listUri,
		limit,
	};

	if (cursor) {
		params.cursor = cursor;
	}

	const response = await agent.app.bsky.feed.getListFeed(params);

	// Add feed items to return data
	if (response.data.feed) {
		response.data.feed.forEach((item) => {
			returnData.push({
				json: item as unknown as IDataObject,
			});
		});
	}

	// Add pagination info if available
	if (response.data.cursor) {
		returnData.push({
			json: {
				cursor: response.data.cursor,
				pagination: true,
			},
		});
	}

	return returnData;
}

/**
 * Add a user to a list
 */
export async function addUserToListOperation(
    agent: AtpAgent,
    listUri: string,
    userDid: string,
): Promise<INodeExecutionData[]> {
    const returnData: INodeExecutionData[] = [];

    const record = {
        $type: 'app.bsky.graph.listitem',
        subject: userDid,
        list: listUri,
        createdAt: new Date().toISOString(),
    };

    const response = await agent.com.atproto.repo.createRecord({
        repo: agent.session!.did,
        collection: 'app.bsky.graph.listitem',
        record,
    });

    returnData.push({
        json: {
            uri: response.data.uri,
            cid: response.data.cid,
            ...record,
        } as IDataObject,
    });

    return returnData;
}

/**
 * Remove a user from a list
 */
export async function removeUserFromListOperation(
    agent: AtpAgent,
    listItemUri: string,
): Promise<INodeExecutionData[]> {
    const returnData: INodeExecutionData[] = [];
    const { rkey } = new AtUri(listItemUri);

    await agent.com.atproto.repo.deleteRecord({
        repo: agent.session!.did,
        collection: 'app.bsky.graph.listitem',
        rkey,
    });

    returnData.push({
        json: {
            uri: listItemUri,
            deleted: true,
        } as IDataObject,
    });

    return returnData;
}
