# Changelog

All notable changes to the n8n-nodes-bluesky-enhanced package will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
