import { INodeExecutionData, INodeProperties, IDataObject } from 'n8n-workflow';
import { AtpAgent } from '@atproto/api';

/**
 * Helper function to handle chat operation errors with better messaging
 */
function handleChatError(error: any, operation: string): Error {
	if (error?.error === 'XRPCNotSupported' || error?.message?.includes('XRPCNotSupported')) {
		return new Error(
			`Chat functionality is currently experimental and not available on the main bsky.social instance. ` +
			`To use chat features, you need to connect to a Bluesky instance that supports chat operations. ` +
			`Error: ${error.message || error}`
		);
	}
	
	return new Error(`Error ${operation}: ${error.message || error}`);
}

export const chatProperties: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['chat'],
			},
		},
		options: [
			{
				name: 'Accept Conversation',
				value: 'acceptConvo',
				description: 'Accept a pending conversation request',
				action: 'Accept a conversation request',
			},
			{
				name: 'Delete Message',
				value: 'deleteMessage',
				description: 'Delete a message from a conversation (for yourself only)',
				action: 'Delete a message from conversation',
			},
			{
				name: 'Get Conversation',
				value: 'getConvo',
				description: 'Get details of a specific conversation',
				action: 'Get conversation details',
			},
			{
				name: 'Get Conversation for Members',
				value: 'getConvoForMembers',
				description: 'Get or create a conversation for specific members',
				action: 'Get conversation for members',
			},
			{
				name: 'Get Messages',
				value: 'getMessages',
				description: 'Get messages from a conversation',
				action: 'Get messages from conversation',
			},
			{
				name: 'Leave Conversation',
				value: 'leaveConvo',
				description: 'Leave a conversation',
				action: 'Leave a conversation',
			},
			{
				name: 'List Conversations',
				value: 'listConvos',
				description: 'List all conversations for the authenticated user',
				action: 'List conversations',
			},
			{
				name: 'Mute Conversation',
				value: 'muteConvo',
				description: 'Mute a conversation to stop receiving notifications',
				action: 'Mute a conversation',
			},
			{
				name: 'Send Message',
				value: 'sendMessage',
				description: 'Send a message to a conversation',
				action: 'Send a message',
			},
			{
				name: 'Unmute Conversation',
				value: 'unmuteConvo',
				description: 'Unmute a previously muted conversation',
				action: 'Unmute a conversation',
			},
			{
				name: 'Update Read Status',
				value: 'updateRead',
				description: 'Mark messages as read up to a specific message',
				action: 'Update read status',
			},
		],
		default: 'listConvos',
	},
	{
		displayName: 'Conversation ID',
		name: 'convoId',
		type: 'string',
		default: '',
		required: true,
		description: 'The ID of the conversation',
		displayOptions: {
			show: {
				resource: ['chat'],
				operation: [
					'acceptConvo',
					'deleteMessage',
					'getConvo',
					'getMessages',
					'leaveConvo',
					'muteConvo',
					'sendMessage',
					'unmuteConvo',
					'updateRead',
				],
			},
		},
	},
	{
		displayName: 'Message ID',
		name: 'messageId',
		type: 'string',
		default: '',
		required: true,
		description: 'The ID of the message to delete',
		displayOptions: {
			show: {
				resource: ['chat'],
				operation: ['deleteMessage'],
			},
		},
	},
	{
		displayName: 'Message ID',
		name: 'messageId',
		type: 'string',
		default: '',
		description: 'The ID of the message to mark as read (marks all messages up to this point as read)',
		displayOptions: {
			show: {
				resource: ['chat'],
				operation: ['updateRead'],
			},
		},
	},
	{
		displayName: 'Message Text',
		name: 'messageText',
		type: 'string',
		default: '',
		required: true,
		description: 'The text content of the message to send',
		typeOptions: {
			rows: 3,
		},
		displayOptions: {
			show: {
				resource: ['chat'],
				operation: ['sendMessage'],
			},
		},
	},
	{
		displayName: 'Members',
		name: 'members',
		type: 'string',
		default: '',
		required: true,
		description: 'Comma-separated list of DIDs for conversation members',
		placeholder: 'did:plc:example1,did:plc:example2',
		displayOptions: {
			show: {
				resource: ['chat'],
				operation: ['getConvoForMembers'],
			},
		},
	},
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
				resource: ['chat'],
				operation: ['listConvos', 'getMessages'],
			},
		},
	},
	{
		displayName: 'Cursor',
		name: 'cursor',
		type: 'string',
		default: '',
		description: 'Cursor for pagination (to get next page of results)',
		displayOptions: {
			show: {
				resource: ['chat'],
				operation: ['listConvos', 'getMessages'],
			},
		},
	},
	{
		displayName: 'Read State Filter',
		name: 'readState',
		type: 'options',
		options: [
			{
				name: 'All',
				value: '',
				description: 'Show all conversations',
			},
			{
				name: 'Unread',
				value: 'unread',
				description: 'Show only conversations with unread messages',
			},
		],
		default: '',
		description: 'Filter conversations by read state',
		displayOptions: {
			show: {
				resource: ['chat'],
				operation: ['listConvos'],
			},
		},
	},
	{
		displayName: 'Status Filter',
		name: 'status',
		type: 'options',
		options: [
			{
				name: 'All',
				value: '',
				description: 'Show all conversations',
			},
			{
				name: 'Accepted',
				value: 'accepted',
				description: 'Show only accepted conversations',
			},
			{
				name: 'Requests',
				value: 'request',
				description: 'Show only conversation requests',
			},
		],
		default: '',
		description: 'Filter conversations by status',
		displayOptions: {
			show: {
				resource: ['chat'],
				operation: ['listConvos'],
			},
		},
	},
];

/**
 * List conversations for the authenticated user
 */
export async function listConversationsOperation(
	agent: AtpAgent,
	limit: number = 50,
	cursor?: string,
	readState?: string,
	status?: string,
): Promise<INodeExecutionData[]> {
	const returnData: INodeExecutionData[] = [];

	const params: any = { limit };
	if (cursor) params.cursor = cursor;
	if (readState) params.readState = readState;
	if (status) params.status = status;

	try {
		const response = await agent.api.chat.bsky.convo.listConvos(params);

		if (response.data.convos && Array.isArray(response.data.convos)) {
			response.data.convos.forEach((convo) => {
				returnData.push({
					json: convo as unknown as IDataObject,
				} as INodeExecutionData);
			});
		}

		// Include pagination cursor if available
		if (response.data.cursor) {
			returnData.push({
				json: {
					cursor: response.data.cursor,
					_pagination: true,
				} as IDataObject,
			} as INodeExecutionData);
		}

		return returnData;
	} catch (error) {
		throw handleChatError(error, 'listing conversations');
	}
}

/**
 * Get details of a specific conversation
 */
export async function getConversationOperation(
	agent: AtpAgent,
	convoId: string,
): Promise<INodeExecutionData[]> {
	const returnData: INodeExecutionData[] = [];

	try {
		const response = await agent.api.chat.bsky.convo.getConvo({ convoId });

		returnData.push({
			json: response.data.convo as unknown as IDataObject,
		} as INodeExecutionData);

		return returnData;
	} catch (error) {
		throw handleChatError(error, 'getting conversation');
	}
}

/**
 * Get messages from a conversation
 */
export async function getMessagesOperation(
	agent: AtpAgent,
	convoId: string,
	limit: number = 50,
	cursor?: string,
): Promise<INodeExecutionData[]> {
	const returnData: INodeExecutionData[] = [];

	const params: any = { convoId, limit };
	if (cursor) params.cursor = cursor;

	try {
		const response = await agent.api.chat.bsky.convo.getMessages(params);

		if (response.data.messages && Array.isArray(response.data.messages)) {
			response.data.messages.forEach((message) => {
				returnData.push({
					json: message as unknown as IDataObject,
				} as INodeExecutionData);
			});
		}

		// Include pagination cursor if available
		if (response.data.cursor) {
			returnData.push({
				json: {
					cursor: response.data.cursor,
					_pagination: true,
				} as IDataObject,
			} as INodeExecutionData);
		}

		return returnData;
	} catch (error) {
		throw handleChatError(error, 'getting messages');
	}
}

/**
 * Send a message to a conversation
 */
export async function sendMessageOperation(
	agent: AtpAgent,
	convoId: string,
	messageText: string,
): Promise<INodeExecutionData[]> {
	const returnData: INodeExecutionData[] = [];

	try {
		const response = await agent.api.chat.bsky.convo.sendMessage({
			convoId,
			message: {
				text: messageText,
			},
		});

		returnData.push({
			json: response.data as unknown as IDataObject,
		} as INodeExecutionData);

		return returnData;
	} catch (error) {
		throw handleChatError(error, 'sending message');
	}
}

/**
 * Get or create a conversation for specific members
 */
export async function getConvoForMembersOperation(
	agent: AtpAgent,
	members: string[],
): Promise<INodeExecutionData[]> {
	const returnData: INodeExecutionData[] = [];

	try {
		const response = await agent.api.chat.bsky.convo.getConvoForMembers({ members });

		returnData.push({
			json: response.data.convo as unknown as IDataObject,
		} as INodeExecutionData);

		return returnData;
	} catch (error) {
		throw handleChatError(error, 'getting conversation for members');
	}
}

/**
 * Accept a conversation request
 */
export async function acceptConversationOperation(
	agent: AtpAgent,
	convoId: string,
): Promise<INodeExecutionData[]> {
	const returnData: INodeExecutionData[] = [];

	try {
		const response = await agent.api.chat.bsky.convo.acceptConvo({ convoId });

		returnData.push({
			json: response.data as unknown as IDataObject,
		} as INodeExecutionData);

		return returnData;
	} catch (error) {
		throw handleChatError(error, 'accepting conversation');
	}
}

/**
 * Leave a conversation
 */
export async function leaveConversationOperation(
	agent: AtpAgent,
	convoId: string,
): Promise<INodeExecutionData[]> {
	const returnData: INodeExecutionData[] = [];

	try {
		const response = await agent.api.chat.bsky.convo.leaveConvo({ convoId });

		returnData.push({
			json: response.data as unknown as IDataObject,
		} as INodeExecutionData);

		return returnData;
	} catch (error) {
		throw handleChatError(error, 'leaving conversation');
	}
}

/**
 * Mute a conversation
 */
export async function muteConversationOperation(
	agent: AtpAgent,
	convoId: string,
): Promise<INodeExecutionData[]> {
	const returnData: INodeExecutionData[] = [];

	try {
		const response = await agent.api.chat.bsky.convo.muteConvo({ convoId });

		returnData.push({
			json: response.data.convo as unknown as IDataObject,
		} as INodeExecutionData);

		return returnData;
	} catch (error) {
		throw handleChatError(error, 'muting conversation');
	}
}

/**
 * Unmute a conversation
 */
export async function unmuteConversationOperation(
	agent: AtpAgent,
	convoId: string,
): Promise<INodeExecutionData[]> {
	const returnData: INodeExecutionData[] = [];

	try {
		const response = await agent.api.chat.bsky.convo.unmuteConvo({ convoId });

		returnData.push({
			json: response.data.convo as unknown as IDataObject,
		} as INodeExecutionData);

		return returnData;
	} catch (error) {
		throw handleChatError(error, 'unmuting conversation');
	}
}

/**
 * Update read status of messages in a conversation
 */
export async function updateReadStatusOperation(
	agent: AtpAgent,
	convoId: string,
	messageId?: string,
): Promise<INodeExecutionData[]> {
	const returnData: INodeExecutionData[] = [];

	const params: any = { convoId };
	if (messageId) params.messageId = messageId;

	try {
		const response = await agent.api.chat.bsky.convo.updateRead(params);

		returnData.push({
			json: response.data.convo as unknown as IDataObject,
		} as INodeExecutionData);

		return returnData;
	} catch (error) {
		throw handleChatError(error, 'updating read status');
	}
}

/**
 * Delete a message from a conversation (for yourself only)
 */
export async function deleteMessageOperation(
	agent: AtpAgent,
	convoId: string,
	messageId: string,
): Promise<INodeExecutionData[]> {
	const returnData: INodeExecutionData[] = [];

	try {
		const response = await agent.api.chat.bsky.convo.deleteMessageForSelf({
			convoId,
			messageId,
		});

		returnData.push({
			json: response.data as unknown as IDataObject,
		} as INodeExecutionData);

		return returnData;
	} catch (error) {
		throw handleChatError(error, 'deleting message');
	}
}
