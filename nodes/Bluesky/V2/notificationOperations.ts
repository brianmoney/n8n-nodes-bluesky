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
				resource: ['notification'],
			},
		},
		options: [
			{
				name: 'Get Unread Count',
				value: 'getUnreadCount',
				description: 'Get the number of unread notifications',
				action: 'Get unread notification count',
			},
			{
				name: 'List Notifications',
				value: 'listNotifications',
				description: 'List notifications for the authenticated user',
				action: 'List notifications',
			},
			{
				name: 'Mark Notifications as Seen',
				value: 'updateSeen',
				description: 'Notify server that notifications have been seen',
				action: 'Mark notifications as seen',
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
			maxValue: 100, // API max for listNotifications
		},
		default: 50,
		description: 'Max number of notifications to return',
		displayOptions: {
			show: {
				resource: ['notification'],
				operation: ['listNotifications'],
			},
		},
	},
	{
		displayName: 'Unread Only',
		name: 'unreadOnly',
		type: 'boolean',
		default: true,
		description: 'If true, only unread notifications will be returned. Note: Pagination is based on underlying API pages.',
		displayOptions: {
			show: {
				resource: ['notification'],
				operation: ['listNotifications'],
			},
		},
	},
	{
		displayName: 'Mark Retrieved as Read',
		name: 'markRetrievedAsRead',
		type: 'boolean',
		default: true,
		description: 'Whether to mark retrieved notifications as read (if listing) or all notifications as read (if getting unread count/explicitly updating seen). Has no effect if "Unread Only" is true during the filtering phase but will apply after unread items are collected.',
		displayOptions: {
			show: {
				resource: ['notification'],
				operation: ['listNotifications', 'getUnreadCount', 'updateSeen'],
			},
		},
	},
	{
		displayName: 'Seen At (ISO Date String)',
		name: 'seenAt',
		type: 'string',
		default: '',
		description: 'Optional ISO 8601 date string. If provided for "Mark Notifications as Seen", marks notifications up to this time as read. If not, uses current time.',
		displayOptions: {
			show: {
				resource: ['notification'],
				operation: ['updateSeen'],
			},
		},
	},
	{
		displayName: 'Priority Notifications Only',
		name: 'priority',
		type: 'boolean',
		default: false,
		description: 'Whether to only count priority notifications (mentions, quotes, replies)',
		displayOptions: {
			show: {
				resource: ['notification'],
				operation: ['getUnreadCount'],
			},
		},
	},
];

/**
 * List notifications for the authenticated user
 */
export async function listNotificationsOperation(
	agent: AtpAgent,
	userRequestedLimit: number,
	unreadOnly: boolean,
	markRetrievedAsRead: boolean,
	initialCursor?: string,
): Promise<INodeExecutionData[]> {
	const notificationsToReturn: INodeExecutionData[] = [];
	let currentApiCursor: string | undefined = initialCursor;
	const API_PAGE_SIZE = 100; // Max notifications per API page
	let lastRetrievedUnreadNotificationTimestamp: string | undefined = undefined;

	if (unreadOnly) {
		let unreadNotificationsCollected = 0;

		while (unreadNotificationsCollected < userRequestedLimit) {
			const response = await agent.api.app.bsky.notification.listNotifications({
				limit: API_PAGE_SIZE,
				cursor: currentApiCursor,
				// Do NOT pass seenAt here to ensure notification.isRead is accurate for filtering
			});

			if (!response.data.notifications || response.data.notifications.length === 0) {
				currentApiCursor = undefined; // No more notifications from API
				break;
			}
			currentApiCursor = response.data.cursor; // Update cursor for the next potential iteration

			for (const notification of response.data.notifications) {
				if (!notification.isRead) { // Filter for unread
					const notificationData = { ...notification, reasonSubjectUri: notification.reasonSubject };
					notificationsToReturn.push({
						json: notificationData,
					} as INodeExecutionData);
					
					// Keep track of the latest timestamp among retrieved unread notifications
					if (notification.indexedAt) {
						if (!lastRetrievedUnreadNotificationTimestamp || new Date(notification.indexedAt) > new Date(lastRetrievedUnreadNotificationTimestamp)) {
							lastRetrievedUnreadNotificationTimestamp = notification.indexedAt;
						}
					}

					unreadNotificationsCollected++;
					if (unreadNotificationsCollected >= userRequestedLimit) {
						break; // Reached user's desired limit
					}
				}
			}

			if (unreadNotificationsCollected >= userRequestedLimit || !currentApiCursor) {
				break; // Met limit or no more API pages
			}
		}

		// After collecting unread notifications, if user also wanted to mark them as read
		if (markRetrievedAsRead && lastRetrievedUnreadNotificationTimestamp) {
			try {
				// Mark as seen up to the timestamp of the most recent unread notification retrieved
				await agent.api.app.bsky.notification.updateSeen({ seenAt: lastRetrievedUnreadNotificationTimestamp });
			} catch (e: any) {
				// Log or handle error from updateSeen, but don't fail the whole operation
				console.warn(`Failed to mark notifications as seen up to ${lastRetrievedUnreadNotificationTimestamp}: ${e.message}`);
			}
		}
	} else { // Behavior for unreadOnly = false
		const seenAt = markRetrievedAsRead ? new Date().toISOString() : undefined;
		const response = await agent.api.app.bsky.notification.listNotifications({
			limit: userRequestedLimit, // Use user's limit directly
			cursor: initialCursor,
			seenAt: seenAt, // Pass seenAt directly if not filtering for unread only
		});

		if (response.data.notifications) {
			response.data.notifications.forEach((notification) => {
				// The 'isRead' field in the response will reflect the 'seenAt' if provided
				notificationsToReturn.push({
					json: { ...notification, reasonSubjectUri: notification.reasonSubject },
				} as INodeExecutionData);
			});
		}
		currentApiCursor = response.data.cursor;
	}

	// Add pagination item if a cursor exists for the next set of raw API data
	if (currentApiCursor) {
		notificationsToReturn.push({
			json: { cursor: currentApiCursor, _pagination: true },
		} as INodeExecutionData);
	}
	return notificationsToReturn;
}

/**
 * Get the number of unread notifications
 */
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
