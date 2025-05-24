import { INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { AtpAgent } from '@atproto/api';

export const notificationProperties: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['notifications'],
			},
		},
		options: [
			{
				name: 'Get Notifications',
				value: 'getNotifications',
				description: 'Get a list of notifications for the authenticated user',
				action: 'Get notifications',
			},
			{
				name: 'Get Unread Count',
				value: 'getUnreadCount',
				description: 'Get count of unread notifications for the authenticated user',
				action: 'Get unread notification count',
			},
			{
				name: 'Mark as Seen',
				value: 'markAsSeen',
				description: 'Mark notifications as seen up to a specific timestamp',
				action: 'Mark notifications as seen',
			},
		],
		default: 'getNotifications',
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
				resource: ['notifications'],
				operation: ['getNotifications'],
			},
		},
	},
	{
		displayName: 'Priority Only',
		name: 'priority',
		type: 'boolean',
		default: false,
		description: 'Whether to only return high-priority notifications (mentions, replies, etc.)',
		displayOptions: {
			show: {
				resource: ['notifications'],
				operation: ['getNotifications'],
			},
		},
	},
	{
		displayName: 'Cursor',
		name: 'cursor',
		type: 'string',
		default: '',
		description: 'Pagination cursor for retrieving more notifications',
		displayOptions: {
			show: {
				resource: ['notifications'],
				operation: ['getNotifications'],
			},
		},
	},
	{
		displayName: 'Since',
		name: 'since',
		type: 'dateTime',
		default: '',
		description: 'Only return notifications newer than this timestamp',
		displayOptions: {
			show: {
				resource: ['notifications'],
				operation: ['getNotifications'],
			},
		},
	},
	{
		displayName: 'Priority',
		name: 'priority',
		type: 'boolean',
		default: false,
		description: 'Whether to only return high-priority notifications (mentions, replies, etc.)',
		displayOptions: {
			show: {
				resource: ['notifications'],
				operation: ['getNotifications'],
			},
		},
	},
	{
		displayName: 'Seen At',
		name: 'seenAt',
		type: 'dateTime',
		default: '',
		required: true,
		description: 'Timestamp to mark notifications as seen up to',
		displayOptions: {
			show: {
				resource: ['notifications'],
				operation: ['markAsSeen'],
			},
		},
	},
];

export async function getNotificationsOperation(
	agent: AtpAgent,
	limit: number,
	cursor?: string,
	since?: string,
	priority?: boolean,
): Promise<INodeExecutionData[]> {
	const returnData: INodeExecutionData[] = [];

	try {
		const params: any = {
			limit,
		};

		if (cursor) {
			params.cursor = cursor;
		}

		if (since) {
			params.since = since;
		}

		if (priority) {
			params.priority = true;
		}

		const response = await agent.app.bsky.notification.listNotifications(params);

		// Process each notification
		response.data.notifications.forEach((notification: any) => {
			returnData.push({
				json: {
					uri: notification.uri,
					cid: notification.cid,
					author: notification.author,
					reason: notification.reason,
					reasonSubject: notification.reasonSubject,
					record: notification.record,
					isRead: notification.isRead,
					indexedAt: notification.indexedAt,
					seenAt: notification.seenAt,
					labels: notification.labels,
				},
			});
		});

		// Add pagination info as the last item if cursor exists
		if (response.data.cursor) {
			returnData.push({
				json: {
					_pagination: {
						cursor: response.data.cursor,
						hasMore: true,
					},
				},
			});
		}
	} catch (error) {
		throw new Error(`Failed to get notifications: ${error.message}`);
	}

	return returnData;
}

export async function getUnreadCountOperation(agent: AtpAgent): Promise<INodeExecutionData[]> {
	try {
		const response = await agent.app.bsky.notification.getUnreadCount();

		return [
			{
				json: {
					count: response.data.count,
				},
			},
		];
	} catch (error) {
		throw new Error(`Failed to get unread count: ${error.message}`);
	}
}

export async function markAsSeenOperation(
	agent: AtpAgent,
	seenAt: string,
): Promise<INodeExecutionData[]> {
	try {
		await agent.app.bsky.notification.updateSeen({
			seenAt,
		});

		return [
			{
				json: {
					success: true,
					seenAt,
					message: `Notifications marked as seen up to ${seenAt}`,
				},
			},
		];
	} catch (error) {
		throw new Error(`Failed to mark notifications as seen: ${error.message}`);
	}
}
