# Bluesky Video Upload Status Report

**Date:** May 25, 2025  
**Package:** n8n-nodes-bluesky  
**Bluesky API Version:** @atproto/api 0.15.8

## Update — September 10, 2025

Recent probing of Bluesky’s public XRPC endpoints shows the video routes are present and require authentication (401 AuthMissing), not returning XRPCNotSupported anymore:

```
GET https://bsky.social/xrpc/app.bsky.video.getUploadLimits   → 401 AuthMissing
GET https://bsky.social/xrpc/app.bsky.video.getJobStatus      → 401 AuthMissing
HEAD https://bsky.social/xrpc/app.bsky.video.uploadVideo      → 401 AuthMissing
```

Implication: endpoints appear deployed; functional behavior (processing pipeline, job flow) now needs to be validated with authenticated requests.

Next steps:
- Test with a valid session (AtpAgent) to call `getUploadLimits`, then `uploadVideo`, then poll `getJobStatus`.
- If job completes and returns a playlist/thumbnail, update this report and node behavior to fully enable video embeds.

## Summary

Video uploads to Bluesky are **technically successful but functionally broken** (as of May 25, 2025). Videos upload as binary blobs but display as "Video not found" on the Bluesky platform. As of Sep 10, 2025, the video endpoints exist (401 AuthMissing without auth); end-to-end behavior with auth is unverified.

## Root Cause

Bluesky requires videos to be processed through a specialized video processing pipeline that:
- Generates streaming playlists (`.m3u8` files)
- Creates thumbnail images
- Processes videos for different quality levels
- Provides proper video embed structure (`app.bsky.embed.video#view`)

Previously: the video processing APIs were not deployed (XRPCNotSupported). Current probes indicate deployment with auth required; processing functionality still needs confirmation.

## Current Status

### ✅ What Works
- **Authentication** - Login and session management
- **Blob uploads** - Videos upload successfully as binary data
- **API integration** - Client-side video API methods are available
- **File validation** - Size limits and format checking work correctly

### ❌ What Doesn't Work
- **Video display** - All uploaded videos show "Video not found" 
- **Video processing** - No thumbnail generation or playlist creation
- **Server APIs (May 25, 2025)** - Returned `XRPCNotSupported` (404)
- **Server APIs (Sep 10, 2025)** - Endpoints present (401 without auth); functional status TBD

### 🔍 Confirmed via Testing
```
Video API Endpoint Status (May 25, 2025):
• app.bsky.video.uploadVideo: XRPCNotSupported ❌
• app.bsky.video.getUploadLimits: XRPCNotSupported ❌  
• app.bsky.video.getJobStatus: XRPCNotSupported ❌
• com.atproto.repo.uploadBlob: Working ✅

Video API Endpoint Status (Sep 10, 2025, unauthenticated):
• app.bsky.video.uploadVideo: AuthMissing (401) ↔︎ endpoint exists
• app.bsky.video.getUploadLimits: AuthMissing (401)
• app.bsky.video.getJobStatus: AuthMissing (401)
```

## Technical Details

### Expected Video Processing Flow
1. Upload video via `app.bsky.video.uploadVideo`
2. Receive job ID for processing status
3. Video gets processed (transcoding, thumbnail generation)
4. Embed structure includes playlist URL and thumbnail
5. Video displays properly in Bluesky feeds

### Current Workaround Flow  
1. Upload video via `com.atproto.repo.uploadBlob` 
2. Create post with video blob reference
3. Video appears in post but shows "Video not found" when clicked
4. No processing occurs (no playlist, no thumbnail)

## Implementation Status

### Infrastructure Ready
Analysis of Bluesky's GitHub repository shows complete video infrastructure:
- Database migrations for video tables ✅
- Video processing pipeline code ✅
- Playlist and thumbnail generation ✅
- Client-side API methods ✅

### Server Deployment Pending
- Video API endpoints not deployed ❌
- Processing pipeline not active ❌
- Database tables may not be migrated ❌

## Recommendations

### For n8n Users
1. **Avoid video uploads** until Bluesky enables video processing
2. **Use images instead** for visual content (images work perfectly)
3. **Monitor Bluesky announcements** for video feature availability
4. **Test periodically** as deployment could happen without notice

### For Developers
1. **Implementation is ready** - Code will work once Bluesky deploys servers
2. **No changes needed** - Current optimistic approach will activate automatically
3. **Monitor API responses** - Watch for status changes from `XRPCNotSupported`

## Future Outlook

### Positive Signs
- Complete infrastructure exists in Bluesky codebase
- Recent database migrations (January 2025) suggest active development
- Client APIs are fully defined and tested
- Video feature is clearly planned and architected

### Timeline
- **Unknown** - Bluesky hasn't announced video feature timeline
- **Infrastructure ready** - Technical foundation is complete
- **Deployment pending** - Waiting for server-side activation

## Workaround Options

### None Currently Available
- **Third-party hosting**: Videos hosted elsewhere can't be embedded natively
- **Link sharing**: Users can share video links but no inline playback
- **Image alternatives**: Use video thumbnails with external links

## Testing Results

```bash
# Video API Status Test Results (May 25, 2025)
✗ getUploadLimits: Not implemented (XRPCNotSupported)
✗ uploadVideo: Not implemented (XRPCNotSupported)  
✗ getJobStatus: Not implemented (XRPCNotSupported)
✓ Blob upload: Working (CID: bafkreiduupnmxpc4fwtrfmwpcxbtk5cnydn4vy7r66oebj7hqqs2kf6c4m)

CONCLUSION:
• Video APIs: NOT YET IMPLEMENTED (all return XRPCNotSupported)
• Blob uploads: WORKING (but videos show "Video not found" on Bluesky)
• Root cause: Videos need proper processing pipeline for display
• Status: Infrastructure exists in code, awaiting server deployment
```

---

**Last Updated:** May 25, 2025  
**Next Review:** Monitor Bluesky announcements and API status changes
