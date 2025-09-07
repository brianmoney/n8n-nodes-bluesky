![Banner image](https://user-images.githubusercontent.com/10284570/173569848-c624317f-42b1-45a6-ab09-f0ea3c247648.png)

# n8n-nodes-bluesky-enhanced

This is a fork of [@muench-dev/n8n-nodes-bluesky](https://github.com/muench-dev/n8n-nodes-bluesky) with enhanced functionality for the Bluesky social network.

## Key Features

- **User Management**: Follow/follower operations with pagination, profile management, muting/blocking
- **Advanced Posting**: Create posts with media attachments (images/video), replies, quotes, and website cards (including in replies)
- **Media Support**: Image uploads (with automatic aspect ratio) and video uploads (limited - see Video Uploads section)
- **Feed Operations**: Retrieve author feeds with filtering, timelines, and thread contexts
- **Search Capabilities**: Search users and posts with filtering options
- **Analytics & Notifications**: Enhanced notification management with filtering and interaction tracking
- **Thread Management**: Reply to posts, quote posts, and mute conversation threads

## Installation

```bash
npm install n8n-nodes-bluesky-enhanced
```

In n8n community edition, you can install the nodes in the settings page by searching for `n8n-nodes-bluesky-enhanced`.

Alternatively, to deploy into a self-hosted n8n volume, this repo includes an `install.sh` script which:
- Builds the project and copies `dist/` plus a minimal package.json and `index.js` to your custom modules directory
- Installs only production dependencies, avoiding pnpm friction in containers

Edit `install.sh`'s DEST path to your n8n custom modules folder and run it.

## Supported Operations

### User Operations
- **Block User** - Block users to prevent interaction
- **Get Profile** - Get detailed profile information for any user
- **List All Followers** - Fetch all followers with automatic pagination
- **List All Follows** - Fetch all follows with automatic pagination  
- **Mute User** - Mute users to hide their content from feeds
- **Un-mute User** - Remove mute status from users

### Post Operations
- **Create Post** - Create text posts with optional media attachments (images/video) or website cards
- **Like/Unlike** - Like and unlike posts
- **Repost/Delete Repost** - Repost content and manage reposts
- **Reply to Post** - Reply to existing posts with proper thread structure
- **Quote Post** - Quote existing posts in new posts
- **Delete Post** - Remove your own posts

**Media Support:**
- **Images**: Fully functional (up to 4 images per post). Image embeds now include per-image `aspectRatio` automatically detected from the binary (improves display consistency on Bluesky).
- **Video**: Limited functionality (uploads succeed but videos don't display - see Video Uploads section). Video embeds include `aspectRatio` when available.

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

### List Operations
- **Add User to List** - Add users to custom lists for categorization
- **Create List** - Create new custom lists with descriptions and purposes
- **Delete List** - Remove lists that are no longer needed
- **Get List Feed** - Retrieve posts from specific lists with pagination
- **Get Lists** - Get all lists for a user with automatic pagination
- **Remove User From List** - Remove users from existing lists
- **Update List** - Modify list names, descriptions, and purposes

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

### List Management

**Create List**
- **List Name**: Display name for the list
- **Purpose**: Either "Curate List" for content curation or "Mod List" for moderation
- **Description**: Optional description explaining the list's purpose

**Get Lists**
- **Actor**: Handle or DID of the user whose lists to retrieve
- **Limit**: Maximum number of lists to return (1-100, default: 50)

Returns all lists created by the specified user with automatic pagination handling.

**Get List Feed**
- **List URI**: AT URI of the list to retrieve posts from
- **Limit**: Maximum number of posts to return (1-100, default: 50)

Retrieves posts from users who are members of the specified list.

**Add/Remove Users**
- **List URI**: AT URI of the target list
- **User DID**: Decentralized identifier of the user to add/remove
- **List Item URI**: (Remove only) AT URI of the specific list membership record

List operations support automatic pagination and handle large lists efficiently.

### Media Posting

**Create Post with Images**
- **Include Media**: Enable media attachment mode
- **Media Items**: Collection of up to 4 images
  - **Binary Property**: Name of n8n binary property containing image data
  - **Alt Text**: Accessibility description for images

Aspect Ratio Handling:
- Each image's aspect ratio is auto-detected from the binary and sent as `{ width, height }` so images render correctly in Bluesky clients.

When media is included, website card options are automatically disabled.

### Video Uploads

**⚠️ Current Status: Limited Functionality**

Video uploads are technically supported but have significant limitations due to Bluesky's infrastructure:

**Create Post with Video**
- **Include Media**: Enable media attachment mode and select video files
- **Video Items**: Single video file (up to 100MB)
  - **Binary Property**: Name of n8n binary property containing video data
  - **Alt Text**: Accessibility description for the video

**Important Limitations (as of Sep 5, 2025):**
- ✅ **Video uploads succeed** - Files upload without errors
- ❌ **Videos don't display** - Show "Video not found" on Bluesky platform
- ❌ **No video processing** - No thumbnails, playlists, or streaming support
- ❌ **Server APIs not deployed** - Bluesky's video processing pipeline inactive

**Root Cause:**
Bluesky's video infrastructure requires server-side processing to generate streaming playlists and thumbnails. While the complete infrastructure exists in Bluesky's codebase, the video processing APIs are not yet deployed on their servers (all return `XRPCNotSupported`).

**Recommendations:**
- **Monitor Bluesky announcements** for video feature availability updates
- **Test periodically** as the feature could be activated without notice

**Technical Details:**
- Videos upload as binary blobs successfully
- Missing: playlist generation, thumbnail creation, proper embed structure
- Infrastructure ready: Complete video processing pipeline exists in Bluesky's code
- Timeline: Unknown - awaiting server-side deployment by Bluesky team

For detailed technical analysis, see [VIDEO_STATUS_REPORT.md](VIDEO_STATUS_REPORT.md).

### Website Cards (External Embeds)

You can attach a website card to posts and replies when no media is included:
- **URI**: Target URL
- **Fetch Open Graph Tags**: If enabled, the node fetches OG tags (title, description, and image) and uploads the image as a thumbnail
- Or specify Title, Description, and a binary thumbnail property manually

Note: Website card options are hidden when Include Media is enabled.


## Use Cases

This enhanced Bluesky node is perfect for:

- **Social Media Management**: Automated posting, content scheduling, engagement tracking
- **Community Building**: Follower management, notification handling, interaction monitoring
- **List Management**: Organize users into custom lists for content curation and moderation purposes
- **Content Curation**: Create and manage curated lists of users for specialized feeds
- **Moderation**: Build and maintain moderation lists for content filtering and community management
- **Content Analytics**: Post performance tracking, engagement analysis, audience insights
- **Brand Monitoring**: Search functionality for mentions and relevant content
- **Automated Responses**: Reply and quote operations for customer service or engagement
- **Data Collection**: Comprehensive user and content data extraction with pagination
- **Visual Content**: Image posting (fully functional), video posting (limited until Bluesky enables video processing)

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for a detailed list of changes for each version.

Highlights in v1.6.x:
- Automatic aspect ratio detection for images and inclusion in embeds
- Support `Include Media` and `Media Items` for replies (images/video)
- Website cards in posts and replies with optional Open Graph fetch and thumbnail upload
- Packaging fixes: ensure `index.js` exports the built node; add `install.sh` for container-friendly deploys

## Repository

This enhanced version is maintained at: https://github.com/brianmoney/n8n-nodes-bluesky

## License

MIT

## Acknowledgments

This project is based on [@muench-dev/n8n-nodes-bluesky](https://github.com/muench-dev/n8n-nodes-bluesky) by Christian Münch.

## Quick local dev with @n8n/node-cli

- pnpm install
- pnpm dev
- Open http://localhost:5678 and test the node (hot reload)
