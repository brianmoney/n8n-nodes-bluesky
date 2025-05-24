![Banner image](https://user-images.githubusercontent.com/10284570/173569848-c624317f-42b1-45a6-ab09-f0ea3c247648.png)

# n8n-nodes-bluesky-enhanced

This is a fork of [@muench-dev/n8n-nodes-bluesky](https://github.com/muench-dev/n8n-nodes-bluesky) with enhanced functionality for the Bluesky social network.

## Key Features

- **User Management**: Follow/follower operations with pagination, profile management, muting/blocking
- **Advanced Posting**: Create posts with media attachments, replies, quotes, and website cards
- **Feed Operations**: Retrieve author feeds with filtering, timelines, and thread contexts
- **Search Capabilities**: Search users and posts with filtering options
- **Analytics & Notifications**: Enhanced notification management with filtering and interaction tracking
- **Thread Management**: Reply to posts, quote posts, and mute conversation threads

## Installation

```bash
npm install n8n-nodes-bluesky-enhanced
```

In n8n community edition, you can install the nodes in the settings page by searching for `n8n-nodes-bluesky-enhanced`.

## Supported Operations

### User Operations
- **Block User** - Block users to prevent interaction
- **Get Profile** - Get detailed profile information for any user
- **List All Followers** - Fetch all followers with automatic pagination
- **List All Follows** - Fetch all follows with automatic pagination  
- **Mute User** - Mute users to hide their content from feeds
- **Un-mute User** - Remove mute status from users

### Post Operations
- **Create Post** - Create text posts with optional media attachments or website cards
- **Like/Unlike** - Like and unlike posts
- **Repost/Delete Repost** - Repost content and manage reposts
- **Reply to Post** - Reply to existing posts with proper thread structure
- **Quote Post** - Quote existing posts in new posts
- **Delete Post** - Remove your own posts

### Feed Operations
- **Get Author Feed** - Retrieve posts from specific users with filtering options
- **Get Timeline** - Get your personalized timeline
- **Get Post Thread** - Retrieve full conversation threads with context

### Search Operations
- **Search Users** - Find users by keywords with configurable limits
- **Search Posts** - Search posts with optional author filtering

### Analytics Operations
- **List Notifications** - Get notifications with enhanced filtering options
- **Get Unread Count** - Monitor unread notification counts
- **Update Seen Notifications** - Mark notifications as read
- **Get Post Interactions** - Analyze post engagement (likes, reposts, replies)

### Graph Operations  
- **Mute Thread** - Mute conversation threads to stop notifications

## Configuration Examples

### Enhanced Notification Management

The Analytics resource provides comprehensive notification management with advanced filtering:

**List Notifications**
- **Limit**: Max number of results to return
- **Unread Only**: Whether to return only unread notifications (default: true)
- **Mark Retrieved as Read**: Whether to automatically mark retrieved notifications as read (default: true)

This enhanced operation includes automatic pagination and intelligent filtering - when "Unread Only" is enabled, it automatically handles pagination to find unread notifications across multiple API pages.

**Get Post Interactions**
Analyze engagement metrics for any post:
- **Post URI**: AT URI of the post to analyze
- **Interaction Types**: Select likes, reposts, and/or replies
- **Interaction Limit**: Number of each interaction type to retrieve (1-100)

Returns structured data with individual interactions plus automatic analytics summaries.

### Advanced Feed Filtering

**Get Author Feed** now supports content-type filtering:
- **Posts with Replies**: All posts including replies (default)
- **Posts without Replies**: Only top-level posts
- **Posts with Media**: Only posts with media attachments
- **Posts and Author Threads**: Posts and threads by the author
- **Posts with Video**: Only posts containing video

Filters are applied at the API level for optimal performance.

### User Management with Pagination

**List All Followers/Follows**
- **Handle**: Bluesky handle (e.g., username.bsky.social)
- **Max Results**: Maximum number to fetch (default: 1000)
- **Page Size**: Results per API request (default: 100, max: 100)

Automatic pagination handles large follower/following lists efficiently.

### Media Posting

**Create Post with Media**
- **Include Media**: Enable media attachment mode
- **Media Items**: Collection of up to 4 images
  - **Binary Property**: Name of n8n binary property containing image data
  - **Alt Text**: Accessibility description for images

When media is included, website card options are automatically disabled.

## Testing & Quality

This package maintains high code quality with comprehensive test coverage:

- **57/57 Tests Passing** ✅ - 100% test pass rate
- **Full Integration Testing** - All operations tested with proper mocking
- **TypeScript Support** - Fully typed with proper error handling
- **Jest Test Suite** - Robust testing framework with detailed coverage
- **Continuous Integration** - Automated testing on all changes

Run tests locally:
```bash
npm test
```

## Use Cases

This enhanced Bluesky node is perfect for:

- **Social Media Management**: Automated posting, content scheduling, engagement tracking
- **Community Building**: Follower management, notification handling, interaction monitoring  
- **Content Analytics**: Post performance tracking, engagement analysis, audience insights
- **Brand Monitoring**: Search functionality for mentions and relevant content
- **Automated Responses**: Reply and quote operations for customer service or engagement
- **Data Collection**: Comprehensive user and content data extraction with pagination

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for a detailed list of changes for each version.

## Repository

This enhanced version is maintained at: https://github.com/brianmoney/n8n-nodes-bluesky

## License

MIT

## Acknowledgments

This project is based on [@muench-dev/n8n-nodes-bluesky](https://github.com/muench-dev/n8n-nodes-bluesky) by Christian Münch.
