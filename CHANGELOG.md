# Changelog

All notable changes to the n8n-nodes-bluesky-enhanced package will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.7.0] - 2025-09-10

### Added
- Reply operation: media and website card support (commit 99e230e)
  - Attach images (up to 4) or a single video to replies; prevents mixing images and video in one reply
  - Website cards in replies with optional Open Graph fetch (title/description/thumbnail) and thumbnail upload
  - Alt text for media; image aspect ratio included when available

### Changed
- Refactored media handling for posts and replies
  - Centralized helpers to process media items and website cards, clearer validation and errors
  - More robust binary checks and Buffer validation before uploads
  - Cleaner embed assembly for images and video

### Developer Experience
- Adopted @n8n/node-cli for local dev, lint, build, and release workflows (scripts added)
- Fixed editor menu export: `index.js` now exports class constructors from `dist` so n8n can read node/credentials descriptions
- Prevent node auto-discovery duplicates: keep only the wrapper node under `nodes/Bluesky/Bluesky.node.ts`; move V1/V2 classes to `src/`

## [1.6.0] - 2025-09-10

### Fixed
- Binary Media Upload Fix: ensure images are correctly included in posts
  - Enhanced binary data validation and buffer handling
  - Improved error reporting with precise messages when binary data is missing
  - Extended debug logging across media upload and post creation
- Aspect Ratio for Image Uploads: maintain correct display in Bluesky clients
  - Added `image-size` dependency to detect dimensions from buffers
  - Updated `binaryUploadHelper.ts` to return optional `{ width, height }` aspectRatio per image with graceful fallback
  - Updated `postOperations.ts` to include aspectRatio in `app.bsky.embed.images` when available

### Technical
- Build and lint pass with no errors; backwards compatible changes only

## [1.5.0]

### Added
- **List Operations**: Complete list management functionality for organizing users and content
  - **Add User to List**: Add users to custom lists for categorization and curation
  - **Create List**: Create new custom lists with configurable names, descriptions, and purposes (curate list or mod list)
  - **Delete List**: Remove lists that are no longer needed with proper cleanup
  - **Get List Feed**: Retrieve posts from specific lists with automatic pagination support
  - **Get Lists**: Get all lists for a user with configurable limits and pagination
  - **Remove User From List**: Remove users from existing lists with proper validation
  - **Update List**: Modify existing list properties including names, descriptions, and purposes
  - Full AT Protocol integration using proper `com.atproto.repo` methods for record management
  - Automatic pagination handling for large lists and feeds
  - Comprehensive input validation and error handling
  - Support for both curate lists (content curation) and mod lists (moderation purposes)

### Technical
- **API Integration**: Implemented proper AT Protocol methods for list operations
  - Uses `com.atproto.repo.createRecord`, `putRecord`, `deleteRecord`, and `getRecord` for list management
  - Uses `app.bsky.graph.getLists` and `app.bsky.feed.getListFeed` for data retrieval
  - Proper URI handling with `@atproto/syntax` for AT Protocol URIs
- **Type Safety**: Added comprehensive TypeScript support with proper type casting and validation
- **Code Quality**: Alphabetized operation options to meet ESLint requirements
- **Test Infrastructure**: Excluded test files from build process to prevent compilation errors

## [1.4.0] - 2025-05-24

### Added
- **Enhanced Analytics Notifications**: Major improvements to notification management in Analytics resource
  - Added `unreadOnly` boolean flag (defaults to true) for filtering unread notifications
  - Added `markRetrievedAsRead` boolean flag (defaults to true) for automatic read status updates
  - Implemented intelligent pagination that automatically handles multiple API pages when filtering for unread notifications
  - Added `seenAt` parameter support for `updateSeenNotifications` operation with timestamp control

### Removed
- **Redundant Notification Resource**: Removed standalone "Notification" resource from UI to eliminate confusion
  - All notification functionality now consolidated under "Analytics" resource
  - Prevents duplicate functionality and improves user experience
  - Maintains backwards compatibility by preserving all notification operations under Analytics

### Fixed
- **Test Suite Completion**: Achieved 100% test pass rate (57/57 tests passing)
  - Fixed all failing tests that referenced removed "notifications" resource
  - Updated test expectations to use "analytics" resource with correct operation names
  - Enhanced test coverage for new notification features
- **API Response Handling**: Added defensive coding to handle undefined API responses
  - Protected against null/undefined responses in notification operations
  - Improved error handling for edge cases in API communication
- **Code Quality**: Resolved all ESLint violations
  - Fixed parameter validation issues in analytics operations
  - Standardized boolean parameter descriptions
  - Removed inappropriate type constraints

### Changed
- **Operation Consolidation**: Streamlined notification operations under Analytics resource
  - `getUnreadCount` and `markAsSeen` operations now use Analytics resource
  - Updated internal routing and parameter handling
  - Improved consistency across notification-related operations
- **Enhanced Message Formatting**: Updated analytics response messages to include timestamps
  - Better tracking of when notifications were marked as seen
  - Improved debugging and audit trail capabilities

### Technical
- **Import Cleanup**: Removed unused notification-related imports from main node file
- **Properties Optimization**: Streamlined node properties configuration by removing redundant notification properties
- **Test Infrastructure**: Enhanced mock implementations for better test reliability and coverage

## [1.3.1] - 2025-05-24

### Changed
- **Chat UI Removed**: Disabled all chat operations from the user interface to avoid confusion since chat APIs are not available on the main Bluesky instance
  - Chat functionality remains in codebase but is hidden from UI
  - Chat operations now throw "operation not supported" errors if accessed
  - Updated tests to verify chat operations are properly disabled
  - Chat features can be re-enabled in future when Bluesky supports them on main instance

### Improved
- **Error Handling**: Enhanced error handling for chat operations with specific `XRPCNotSupported` detection
  - Added centralized `handleChatError` helper function
  - Improved error messages explaining chat API limitations
  - All chat operations now provide clear feedback about experimental nature

## [Unreleased]

### Added
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

## [1.3.1] - 2025-05-24

### Fixed
- **Chat Error Handling**: Enhanced error messages for chat operations with better feedback when chat functionality is not available on the current Bluesky instance (XRPCNotSupported errors)

### Changed
- **Documentation**: Updated README.md and CHANGELOG.md to clearly mark chat operations as experimental features requiring special Bluesky instance support

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
