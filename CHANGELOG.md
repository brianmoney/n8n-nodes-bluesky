# Changelog

All notable changes to the n8n-nodes-bluesky-enhanced package will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Chat Operations**: Complete chat messaging functionality
  - **List Conversations**: Get all conversations for the authenticated user with pagination
  - **Send Message**: Send messages to specific conversations
  - **Get Messages**: Retrieve messages from conversations with pagination support
  - **Get Conversation for Members**: Find or create conversations between specific users
  - **Accept Conversation**: Accept incoming conversation requests
  - **Leave Conversation**: Leave existing conversations
  - **Mute/Unmute Conversations**: Control conversation notifications
  - **Update Read Status**: Mark messages as read with timestamp control
  - **Delete Messages**: Remove messages from conversations (self only)
- **Enhanced Feed Filtering**: Added comprehensive filtering options for "Get Author Feed" operation
  - **Posts with Replies**: All posts, including replies (default behavior)
  - **Posts without Replies**: Only top-level posts, excludes replies
  - **Posts with Media**: Only posts containing media attachments
  - **Posts and Author Threads**: Posts and threads authored by the user
  - **Posts with Video**: Only posts containing video content
- **API-Level Filtering**: Filters are applied at the Bluesky API level for optimal performance
- **Enhanced User Experience**: Intuitive dropdown selection for content type filtering

### Changed
- Updated `getAuthorFeed` operation to accept optional filter parameter
- Enhanced test coverage to include filter parameter validation
- Improved documentation with detailed filter descriptions and use cases

### Fixed
- **Test Suite Stability**: Resolved all failing tests to achieve 100% test pass rate (55/55 tests passing)
- **Chat API Mock Structure**: Fixed Jest mock setup for chat operations to properly handle nested API structure
- **Media Upload Testing**: Enhanced mock implementation for binary data upload operations
- **Mock Cleanup Strategy**: Improved test isolation while preserving mock object structure integrity

## [1.3.0] - 2025-05-23

### Added
- **Analytics Resource**: New analytics capabilities for post performance tracking and engagement automation
- **Notification Management**: List notifications with filtering options (priority, pagination, date ranges)
- **Unread Count Tracking**: Get real-time count of unread notifications for the authenticated user
- **Mark as Seen**: Update notification read status with timestamp control
- **Post Interaction Analytics**: Comprehensive analysis of post engagement including:
  - Likes tracking with actor details and timestamps
  - Reposts tracking with user information
  - Replies analysis with thread context
  - Configurable interaction types and limits
  - Automatic analytics summary with aggregated counts
- **Enhanced Notification Operations**: Improved notification handling with cursor-based pagination, priority filtering, and date-based queries
- **Type-Safe Implementation**: Full TypeScript support with proper error handling throughout analytics operations

### Changed
- Updated notification operations to use correct Bluesky API endpoints and response structures
- Improved error handling and user feedback for analytics operations
- Enhanced code organization with dedicated analytics operations module

### Technical
- Fixed TypeScript compilation issues in analytics operations
- Resolved all ESLint warnings and maintained code quality standards
- Added comprehensive test coverage for analytics features
- Integrated analytics seamlessly into existing BlueskyV2 node architecture

## [1.2.0] - 2025-05-23

### Added
- New "Reply to a Post" operation that allows replying to existing posts with proper thread structure
- New "Quote a Post" operation that allows quoting existing posts in new posts
- Complete thread awareness for replies, finding the correct root and parent references

## [1.1.7] - 2025-05-23

### Changed
- Cleaned up verbose debug logging statements while preserving essential error logging
- Improved code readability by removing temporary debugging statements used during development

## [1.1.4] - 2025-05-23

### Fixed
- Fixed "mediaItems is not iterable" error that prevented media from being uploaded in some cases
- Added defensive programming to ensure that mediaItems is always a valid array

## [1.1.3] - 2025-05-23

### Fixed
- Fixed binary data handling for media uploads, allowing images to be properly attached to posts.
- Added detailed error logging for media uploads to help diagnose any issues.

## [1.1.2] - 2025-05-23

### Fixed
- Fixed issue where the 'Graph' resource wasn't selectable in the UI due to missing resource definition.

## [1.1.1] - 2025-05-23

### Fixed
- Fixed an issue with the API method path for thread muting.

## [1.1.0] - 2025-05-23

### Added
- **Post with Media**: Added ability to create posts with attached images.
  - New `includeMedia` boolean parameter for the 'Create Post' operation.
  - New `mediaItems` collection parameter to specify binary image data and alt text for each image.
  - Website card (`websiteCard` parameter) is automatically hidden and not processed if `includeMedia` is true.
- **Get Post Thread**: Added new 'Get Post Thread' operation under the 'Feed' resource.
  - Fetches the full context of a conversation thread (post, parents, replies).
  - Parameters: `uri` (of the root post), `depth` (of parent replies), `parentHeight` (of child replies).
- **Mute Thread**: Added new 'Mute Thread' operation under the new 'Graph' resource.
  - Mutes a conversation thread, preventing notifications for it.
  - Parameter: `uri` (of the root post of the thread to mute).

### Changed
- The 'Create Post' operation now correctly includes `$type: 'app.bsky.feed.post'` and `createdAt` in the post record.

## [1.0.3] - 2025-05-23

### Fixed
- Fixed resource handling for search operations - now search operations will properly appear in the UI
- Improved error handling to use n8n's NodeOperationError

## [1.0.2] - 2025-05-23

### Added
- Added CHANGELOG.md to track version history
- Updated README.md to reference the changelog
- Added new Search resource with two operations:
  - Search Users: Find users by keywords using app.bsky.actor.searchActors
  - Search Posts: Find posts by keywords using app.bsky.feed.searchPosts
- Added optional author filtering for post search

## [1.0.1] - 2025-05-23

### Fixed
- Fixed package.json configuration to properly register the Bluesky node with n8n
- Removed duplicate node registration that was causing installation errors in n8n

## [1.0.0] - 2025-05-23

### Added
- **List All Followers Operation**: Added ability to fetch all followers for a Bluesky user with pagination
  - Configurable maximum results and page size
  - Automatic paging through all results using cursor-based pagination
  - Proper error handling and result formatting
  
- **List All Follows Operation**: Added ability to fetch all accounts a user is following with pagination
  - Configurable maximum results and page size
  - Automatic paging through all results using cursor-based pagination
  - Proper error handling and result formatting

### Changed
- Updated package configuration for better integration with n8n
- Enhanced documentation with detailed examples and use cases
- Optimized handling of API responses

### Fixed
- Several TypeScript type issues in the original codebase
- Icon reference in BlueskyApi.credentials.ts

## [0.1.0] - 2023-09-14

### Added
- Initial fork from [@muench-dev/n8n-nodes-bluesky](https://github.com/muench-dev/n8n-nodes-bluesky)
- Core functionality including:
  - User operations: Block, Get Profile, Mute, Unmute
  - Feed operations: Get Author Feed, Get Timeline
  - Post operations: Create, Like, Unlike, Repost, Delete Repost
