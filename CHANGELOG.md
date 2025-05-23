# Changelog

All notable changes to the n8n-nodes-bluesky-enhanced package will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
