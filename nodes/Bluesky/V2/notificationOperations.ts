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
				name: 'Mark Notifications as Seen',
				value: 'updateSeen',
				description: 'Notify server that notifications have been seen',
				action: 'Mark notifications as seen',
			},
		],
		default: 'getUnreadCount',
	},
	{
		displayName: 'Seen At (ISO Date String)',
		name: 'seenAt',
		type: 'string',
		default: '',
		description: 'Optional ISO 8601 date string. If provided for "Mark Notifications as Seen", marks notifications up to this time as read. If not, uses current time.',
		displayOptions: {
			show: {
				resource: ['notification'], // Only for 'notification' resource
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
				resource: ['notification'], // Only for 'notification' resource
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
): Promise<INodeExecutionData[]> {
	const notificationsToReturn: INodeExecutionData[] = [];
	let currentApiCursor: string | undefined = undefined;
	const API_PAGE_SIZE = 100; // Max notifications per API page
	let lastRetrievedUnreadNotificationTimestamp: string | undefined = undefined;

	if (unreadOnly) {
		let unreadNotificationsCollected = 0;

		while (unreadNotificationsCollected < userRequestedLimit) {
			const response = await agent.app.bsky.notification.listNotifications({
				limit: API_PAGE_SIZE,
				cursor: currentApiCursor,
				// Do NOT pass seenAt here to ensure notification.isRead is accurate for filtering
			});

			if (!response || !response.data || !response.data.notifications || response.data.notifications.length === 0) {
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
				await agent.app.bsky.notification.updateSeen({ seenAt: lastRetrievedUnreadNotificationTimestamp });
			} catch (e: any) {
				// Log or handle error from updateSeen, but don't fail the whole operation
				console.warn(`Failed to mark notifications as seen up to ${lastRetrievedUnreadNotificationTimestamp}: ${e.message}`);
			}
		}
	} else { // Behavior for unreadOnly = false
		let notificationsCollected = 0;

		while (notificationsCollected < userRequestedLimit) {
			const response = await agent.app.bsky.notification.listNotifications({
				limit: Math.min(API_PAGE_SIZE, userRequestedLimit - notificationsCollected),
				cursor: currentApiCursor,
				// Note: seenAt is not supported by listNotifications endpoint
			});

			if (!response || !response.data || !response.data.notifications || response.data.notifications.length === 0) {
				break; // No more notifications available
			}

			// Add all notifications from this page
			response.data.notifications.forEach((notification) => {
				if (notificationsCollected < userRequestedLimit) {
					notificationsToReturn.push({
						json: { ...notification, reasonSubjectUri: notification.reasonSubject },
					} as INodeExecutionData);
					notificationsCollected++;
				}
			});

			currentApiCursor = response.data.cursor;
			
			// If we've collected enough or there's no more data, break
			if (notificationsCollected >= userRequestedLimit || !currentApiCursor) {
				break;
			}
		}

		// If user wants to mark retrieved notifications as read, do it separately
		if (markRetrievedAsRead && notificationsToReturn.length > 0) {
			try {
				// Mark all notifications as seen using current timestamp
				await agent.app.bsky.notification.updateSeen({ seenAt: new Date().toISOString() });
			} catch (e: any) {
				// Log or handle error from updateSeen, but don't fail the whole operation
				console.warn(`Failed to mark notifications as seen: ${e.message}`);
			}
		}
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
