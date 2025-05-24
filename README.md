![Banner image](https://user-images.githubusercontent.com/10284570/173569848-c624317f-42b1-45a6-ab09-f0ea3c247648.png)

# n8n-nodes-bluesky-enhanced

This is a fork of [@muench-dev/n8n-nodes-bluesky](https://github.com/muench-dev/n8n-nodes-bluesky) with enhanced functionality for the Bluesky social network.

## Added Features

- **List All Followers Operation**: Added ability to automatically fetch all followers for a Bluesky user with pagination support
  - Fetches followers via app.bsky.graph.getFollowers
  - Automatically pages through all results using the cursor
  - Configurable maximum limit for number of followers to retrieve
  - Configurable page size for each API request
- **List All Follows Operation**: Added ability to automatically fetch all accounts a user is following with pagination support
  - Fetches follows via app.bsky.graph.getFollows
  - Automatically pages through all results using the cursor
  - Configurable maximum limit for number of follows to retrieve
  - Configurable page size for each API request
- **Search Operations**: Comprehensive search functionality for users and posts
  - Search users by keywords with configurable limits
  - Search posts with author filtering and result limits
- **Media Posting**: Ability to attach images to posts (fixed issue with binary data handling)
- **Thread Operations**: Enhanced thread management capabilities
  - Get Post Thread Operation: Retrieve the full context of a post thread
  - Reply to Posts: Create replies with proper thread structure
  - Quote Posts: Quote existing posts in new posts
  - Mute Thread Operation: Mute conversation threads
- **Analytics & Engagement**: Comprehensive analytics and notification management
  - Notification Management: List, count, and mark notifications as seen
  - Post Interaction Analytics: Track likes, reposts, and replies with detailed metrics
  - Engagement Automation: Perfect for building engagement bots and analytics dashboards
  - Real-time Insights: Get unread counts and interaction summaries

## Installation

```bash
npm install n8n-nodes-bluesky-enhanced
```

In n8n community edition, you can install the nodes in the settings page by searching for `n8n-nodes-bluesky-enhanced`.

## Features

All original features, plus:

- User
	- Block User
	- Get Profile
	- **List All Followers** (New)
	- **List All Follows** (New)
	- Mute User
	- Un-mute User
- Feed
	- Get Author Feed
	- Get Timeline of current user
	- **Get Post Thread** (New) - Retrieve the full context of a post thread.
- Post
	- Create Post (Now supports **attaching images**)
	- Like
	- Unlike
	- Repost
	- Delete Repost
	- **Reply to a Post** (New) - Reply to existing posts with proper thread structure
	- **Quote a Post** (New) - Quote existing posts in new posts
- Search
	- **Search Users** (New)
	- **Search Posts** (New)
- Graph
	- **Mute Thread** (New) - Mute a conversation thread.
- **Chat** (New)
	- **List Conversations** - Get all conversations for the authenticated user
	- **Send Message** - Send messages to specific conversations
	- **Get Messages** - Retrieve messages from conversations with pagination
	- **Get Conversation for Members** - Find conversations between specific users
	- **Accept Conversation** - Accept incoming conversation requests
	- **Leave Conversation** - Leave existing conversations
	- **Mute Conversation** - Mute conversation notifications
	- **Unmute Conversation** - Unmute conversation notifications
	- **Update Read Status** - Mark messages as read
	- **Delete Message** - Remove messages from conversations (self only)
- **Analytics** (New)
	- **List Notifications** - Get notifications for the authenticated user
	- **Get Unread Notification Count** - Get count of unread notifications
	- **Update Seen Notifications** - Mark notifications as seen
	- **Get Post Interactions** - Analyze post engagement (likes, reposts, replies)

## Follower Pagination Configuration

When using the "List All Followers" operation, you can configure:

- **Handle**: The Bluesky handle (e.g., username.bsky.social) of the account whose followers you want to fetch
- **Max Results**: Maximum number of followers to fetch (default: 1000)
- **Page Size**: Number of followers per API request (default: 100, max: 100)

## Follows Pagination Configuration

When using the "List All Follows" operation, you can configure:

- **Handle**: The Bluesky handle (e.g., username.bsky.social) of the account whose follows you want to fetch
- **Max Results**: Maximum number of follows to fetch (default: 1000)
- **Page Size**: Number of follows per API request (default: 100, max: 100)

## Search Configuration

### Search Users
When using the "Search Users" operation, you can configure:
- **Search Query**: Keywords to search for users
- **Limit**: Maximum number of results to return (default: 25, max: 100)

### Search Posts
When using the "Search Posts" operation, you can configure:
- **Search Query**: Keywords to search for posts
- **Limit**: Maximum number of posts to fetch (default: 25, max: 100)
- **Author Handle**: Optional filter to only include posts by a specific author

## Media Posting Configuration (New)

When using the "Create Post" operation, you can now attach images:

- **Include Media**: A boolean toggle. If checked, allows you to add media items. If unchecked, you can add a website card (as before).
- **Media Items**: A collection where you can add one or more images.
  - **Binary Property Name**: The name of the binary property in your n8n workflow that contains the image data (e.g., `imageData`).
  - **Alt Text**: Descriptive alternative text for the image, for accessibility.

*Note: If "Include Media" is checked, the "Website Card" options will be hidden and ignored.*

## Thread Management Configuration (New)

### Get Post Thread
This operation is found under the "Feed" resource.
- **Post URI**: The AT URI of the root post of the thread you want to retrieve (e.g., `at://did:plc:xxxxxxxxxxxx/app.bsky.feed.post/yyyyyyyyy`).
- **Depth**: (Optional) How many levels of parent replies to fetch. Default is 6.
- **Parent Height**: (Optional) How many levels of child replies (replies to the main post) to fetch. Default is 80.

### Mute Thread
This operation is found under the new "Graph" resource.
- **Thread URI**: The AT URI of the root post of the thread you want to mute.

## Feed Filtering Configuration (New)

### Get Author Feed with Filters
Enhanced filtering capabilities for the "Get Author Feed" operation:
- **Actor**: The DID or handle of the author whose posts you want to fetch
- **Limit**: Maximum number of posts to return (default: 50)
- **Filter**: Choose the type of posts to retrieve:
  - **Posts with Replies**: All posts, including replies (default)
  - **Posts without Replies**: Only top-level posts, excludes replies
  - **Posts with Media**: Only posts containing media attachments (images, videos, etc.)
  - **Posts and Author Threads**: Posts and threads authored by the user
  - **Posts with Video**: Only posts containing video content

These filters are applied at the API level for optimal performance, allowing you to get exactly the content you need without post-processing.

Perfect for:
- Content curation and analysis
- Media-focused workflows
- Thread and conversation tracking
- Engagement analysis by content type

## Analytics Configuration (New)

The Analytics resource provides powerful engagement tracking and notification management capabilities for your Bluesky account.

### List Notifications
Get a list of notifications for the authenticated user:
- **Limit**: Maximum number of notifications to retrieve (default: 50)

Returns detailed notification data including:
- Notification reason (like, repost, mention, reply, etc.)
- Author information
- Associated post/record data
- Read status and timestamps

### Get Unread Notification Count
Get the current count of unread notifications for quick engagement monitoring:
- No configuration required
- Returns a simple count value

Perfect for dashboard widgets or automated engagement tracking workflows.

### Update Seen Notifications
Mark all notifications as seen up to the current timestamp:
- No configuration required
- Automatically uses current timestamp
- Returns success confirmation

Useful for automation workflows that process notifications and want to mark them as handled.

### Get Post Interactions
Comprehensive analytics for post engagement and performance tracking:
- **Post URI**: The AT URI of the post to analyze (e.g., `at://did:plc:xxxxxxxxxxxx/app.bsky.feed.post/yyyyyyyyy`)
- **Interactions to Retrieve**: Multi-select options for:
  - **Likes**: Get users who liked the post with timestamps
  - **Reposts**: Get users who reposted with their profile information
  - **Replies**: Get reply posts with author details and content
- **Interaction Limit**: Maximum number of each interaction type to return (1-100, default: 50)

Returns structured analytics data including:
- Individual interaction details (users, timestamps, content)
- Automatic analytics summary with aggregated counts
- Configurable data scope for performance optimization

Perfect for:
- Content performance analysis
- Engagement rate tracking
- Audience analysis and insights
- Automated engagement responses

## Chat Operations Configuration

The chat operations enable full messaging functionality within Bluesky:

### List Conversations
Get all conversations for the authenticated user:
- **Limit**: Maximum number of conversations to return (default: 50, max: 100)
- **Cursor**: Optional pagination cursor for loading more conversations
- Returns conversation details including participants and latest messages

### Send Message
Send messages to specific conversations:
- **Conversation ID**: The ID of the conversation to send the message to
- **Message Text**: The content of the message to send
- Returns the sent message details with timestamp

### Get Messages
Retrieve messages from a specific conversation:
- **Conversation ID**: The ID of the conversation to get messages from
- **Limit**: Maximum number of messages to return (default: 50, max: 100)
- **Cursor**: Optional pagination cursor for loading older messages

### Other Chat Operations
- **Get Conversation for Members**: Find conversations between specific users
- **Accept/Leave Conversations**: Manage conversation participation
- **Mute/Unmute**: Control conversation notifications
- **Update Read Status**: Mark messages as read
- **Delete Messages**: Remove your own messages from conversations

## Testing & Quality

This package maintains high code quality with comprehensive test coverage:

- **55/55 Tests Passing** ✅ - 100% test pass rate
- **Full Integration Testing** - All operations tested with proper mocking
- **TypeScript Support** - Fully typed with proper error handling
- **Jest Test Suite** - Robust testing framework with detailed coverage
- **Continuous Integration** - Automated testing on all changes

Run tests locally:
```bash
npm test
```

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for a detailed list of changes for each version.

## Repository

This enhanced version is maintained at: https://github.com/brianmoney/n8n-nodes-bluesky

## License

MIT

## Acknowledgments

This project is based on [@muench-dev/n8n-nodes-bluesky](https://github.com/muench-dev/n8n-nodes-bluesky) by Christian Münch.
