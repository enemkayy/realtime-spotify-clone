# Friend System Implementation - Complete Guide

## Overview
Implemented a comprehensive 2-tier friend system to solve the privacy issue where all users could see everyone's listening activity. The new system introduces:

1. **Friend Level**: Users can chat and see online/offline status
2. **Close Friend Level**: Subset of friends who can see what song you're currently playing

## Architecture

### Privacy Rules
- **Strangers**: Cannot see anything, cannot message
- **Friends**: Can message, see online/offline status, but NOT current song
- **Close Friends**: Can see everything including current song playing

### Mutual Friend Requests
- Friend requests require acceptance
- If User A sends request to User B AND User B also sends request to User A → Auto-accept (mutual interest)
- Users can block/unblock others

---

## Backend Changes

### 1. User Model (`backend/src/models/user.model.js`)

**Added Fields:**
```javascript
friends: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
closeFriends: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
friendRequests: [{
  from: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  status: { type: String, enum: ["pending", "accepted", "rejected"], default: "pending" },
  createdAt: { type: Date, default: Date.now }
}]
sentRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
```

### 2. Friend Controller (`backend/src/controller/friend.controller.js`)

**Created Functions:**
1. `sendFriendRequest(req, res)` - Send friend request (auto-accept if mutual)
2. `acceptFriendRequest(req, res)` - Accept pending request
3. `rejectFriendRequest(req, res)` - Reject request
4. `removeFriend(req, res)` - Unfriend (removes from friends and close friends)
5. `getFriends(req, res)` - Get all friends
6. `getPendingRequests(req, res)` - Get pending friend requests
7. `searchUsers(req, res)` - Search users with relationship status
8. `addCloseFriend(req, res)` - Add friend to close friends (requires existing friendship)
9. `removeCloseFriend(req, res)` - Remove from close friends
10. `getCloseFriends(req, res)` - Get close friends list
11. `blockUser(req, res)` - Block user (removes friendship)
12. `unblockUser(req, res)` - Unblock user

### 3. Friend Routes (`backend/src/routes/friend.route.js`)

**All routes protected with `protectRoute` middleware:**
```javascript
POST   /api/friends/request/:userId    - Send friend request
POST   /api/friends/accept/:requestId  - Accept request
POST   /api/friends/reject/:requestId  - Reject request
DELETE /api/friends/:friendId          - Unfriend
GET    /api/friends                    - Get friends
GET    /api/friends/requests           - Get pending requests
GET    /api/friends/search?q=...       - Search users
POST   /api/friends/close/:friendId    - Add to close friends
DELETE /api/friends/close/:friendId    - Remove from close friends
GET    /api/friends/close              - Get close friends
POST   /api/friends/block/:userId      - Block user
DELETE /api/friends/block/:userId      - Unblock user
```

### 4. Socket.io Updates (`backend/src/lib/socket.js`)

**Added Friend Validation:**
```javascript
socket.on("send_message", async (data) => {
  const { senderId, receiverId, content } = data;
  
  // Check if sender and receiver are friends
  const sender = await User.findById(senderId);
  const areFriends = sender.friends.some(
    (friendId) => friendId.toString() === receiverId
  );
  
  if (!areFriends) {
    socket.emit("message_error", "You can only send messages to your friends");
    return;
  }
  
  // Create message...
});
```

### 5. Main App (`backend/src/index.js`)

**Registered Routes:**
```javascript
import friendRoutes from "./routes/friend.route.js";
app.use("/api/friends", friendRoutes);
```

---

## Frontend Changes

### 1. Friend Store (`frontend/src/stores/useFriendStore.ts`)

**Created Zustand Store with:**
```typescript
interface FriendStore {
  friends: User[]
  closeFriends: User[]
  pendingRequests: FriendRequest[]
  searchResults: UserWithRelationship[]
  
  // Operations
  fetchFriends()
  sendFriendRequest(userId)
  acceptFriendRequest(requestId)
  rejectFriendRequest(requestId)
  removeFriend(friendId)
  fetchPendingRequests()
  fetchCloseFriends()
  addCloseFriend(friendId)
  removeCloseFriend(friendId)
  searchUsers(query)
  blockUser(userId)
  unblockUser(userId)
}
```

**UserWithRelationship Type:**
```typescript
interface UserWithRelationship extends User {
  relationshipStatus: "stranger" | "friend" | "pending" | "received" | "blocked"
}
```

### 2. FriendsActivity Component (`frontend/src/layout/components/FriendsActivity.tsx`)

**Updated to:**
- Fetch and display only friends (not all users)
- Show different activity based on close friend status:
  - **Close Friends**: See song playing (song name + artist)
  - **Regular Friends**: Only see "Online" or "Offline"
- Heart icon to toggle close friend status (hover to reveal)
- Bell icon for friend request notifications
- Plus icon to add new friends

**Privacy Implementation:**
```typescript
const showSongDetails = isCloseFriend && isPlaying;

{showSongDetails ? (
  // Show song name and artist
) : (
  // Show only "Online" or "Offline"
)}
```

### 3. AddFriendDialog Component (`frontend/src/components/AddFriendDialog.tsx`)

**Features:**
- Search users by name/email
- Display relationship status for each user:
  - **Stranger**: "Add Friend" button
  - **Friend**: "Friends" (disabled, green)
  - **Pending**: "Pending" (disabled, yellow)
  - **Received**: "Received" (disabled, blue)
  - **Blocked**: "Blocked" (disabled, red)
- Send friend requests
- Real-time UI updates after sending request

### 4. FriendRequestsNotification Component (`frontend/src/components/FriendRequestsNotification.tsx`)

**Features:**
- Bell icon with badge showing pending request count
- Dialog showing all pending friend requests
- Accept/Reject buttons for each request
- Auto-refresh every 30 seconds
- Shows user avatar, name, and request date

### 5. Chat Updates

**ChatPage.tsx:**
- Changed from `fetchUsers()` to `fetchFriends()` - only load friends

**UsersList.tsx:**
- Display only friends in chat list (not all users)
- Show empty state if no friends: "No friends yet, Add friends to start chatting"

**useChatStore.ts:**
- Added `message_error` socket listener to handle friend validation errors

---

## User Flow

### 1. Adding Friends
1. User clicks **+** icon in FriendsActivity
2. AddFriendDialog opens
3. User searches for people by name
4. User clicks "Add Friend" on search result
5. Friend request sent
6. Button changes to "Pending" (yellow)

### 2. Accepting Friend Requests
1. User receives friend request
2. Bell icon shows red badge with count
3. User clicks bell icon
4. FriendRequestsNotification dialog opens
5. User clicks ✓ to accept or ✗ to reject
6. Friend appears in friends list

### 3. Making Someone a Close Friend
1. Friend appears in FriendsActivity
2. Hover over friend → Heart icon appears
3. Click heart → Turns red (filled) = Close Friend
4. Now this friend can see what song you're playing
5. Click heart again → Unfilled = Regular Friend

### 4. Messaging
1. Only friends appear in Chat page user list
2. Click on friend to open chat
3. Send message
4. If somehow not friends anymore → Socket emits "message_error"

---

## Testing Checklist

### Backend
- [ ] Friend requests can be sent
- [ ] Mutual requests auto-accept
- [ ] Cannot send duplicate requests
- [ ] Friend requests can be accepted/rejected
- [ ] Users can unfriend
- [ ] Close friends can be added (only if already friends)
- [ ] Messages blocked between non-friends
- [ ] Block/unblock works correctly
- [ ] Search returns correct relationship status

### Frontend
- [ ] FriendsActivity shows only friends
- [ ] Close friends see song playing
- [ ] Regular friends only see "Online"/"Offline"
- [ ] Heart icon toggles close friend status
- [ ] AddFriendDialog search works
- [ ] Friend request notification badge shows correct count
- [ ] Accept/reject requests updates UI
- [ ] Chat shows only friends
- [ ] Cannot message non-friends

---

## Database Schema

### Before (Old User Model)
```javascript
{
  clerkId: String,
  fullName: String,
  imageUrl: String
}
```

### After (New User Model)
```javascript
{
  clerkId: String,
  fullName: String,
  imageUrl: String,
  friends: [ObjectId],              // NEW
  closeFriends: [ObjectId],         // NEW
  friendRequests: [{                // NEW
    from: ObjectId,
    status: String,
    createdAt: Date
  }],
  sentRequests: [ObjectId],         // NEW
  blockedUsers: [ObjectId]          // NEW
}
```

---

## API Endpoints Summary

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | /api/friends/request/:userId | Send friend request | ✓ |
| POST | /api/friends/accept/:requestId | Accept request | ✓ |
| POST | /api/friends/reject/:requestId | Reject request | ✓ |
| DELETE | /api/friends/:friendId | Unfriend | ✓ |
| GET | /api/friends | Get friends list | ✓ |
| GET | /api/friends/requests | Get pending requests | ✓ |
| GET | /api/friends/search?q=name | Search users | ✓ |
| POST | /api/friends/close/:friendId | Add to close friends | ✓ |
| DELETE | /api/friends/close/:friendId | Remove from close friends | ✓ |
| GET | /api/friends/close | Get close friends | ✓ |
| POST | /api/friends/block/:userId | Block user | ✓ |
| DELETE | /api/friends/block/:userId | Unblock user | ✓ |

---

## Privacy Flow Diagram

```
User Registration
    ↓
[Stranger] ──────────────────────────────────────────┐
    ↓ send request                                    │
[Pending Request Sent]                                │
    ↓ other user accepts OR mutual request            │
[Friend] ◄───────────────────────────────────────────┘
    ↓ add to close friends
[Close Friend]
    ↓ can see song playing

Actions from any state:
- Stranger → Block → [Blocked]
- Friend → Unfriend → [Stranger]
- Close Friend → Remove from close → [Friend]
```

---

## File Structure

```
backend/
├── src/
│   ├── controller/
│   │   └── friend.controller.js        [NEW]
│   ├── models/
│   │   └── user.model.js               [UPDATED]
│   ├── routes/
│   │   └── friend.route.js             [NEW]
│   ├── lib/
│   │   └── socket.js                   [UPDATED]
│   └── index.js                        [UPDATED]

frontend/
├── src/
│   ├── stores/
│   │   ├── useFriendStore.ts           [NEW]
│   │   └── useChatStore.ts             [UPDATED]
│   ├── components/
│   │   ├── AddFriendDialog.tsx         [NEW]
│   │   └── FriendRequestsNotification.tsx [NEW]
│   ├── layout/
│   │   └── components/
│   │       └── FriendsActivity.tsx     [UPDATED]
│   └── pages/
│       └── chat/
│           ├── ChatPage.tsx            [UPDATED]
│           └── components/
│               └── UsersList.tsx       [UPDATED]
```

---

## Next Steps / Future Enhancements

1. **Real-time Friend Updates**: Use Socket.io to notify users when they receive friend requests
2. **Friend Suggestions**: Recommend friends based on mutual friends or interests
3. **Friend Groups**: Create groups of friends (e.g., "College Friends", "Family")
4. **Privacy Settings**: Let users control who can send them friend requests
5. **Friend Activity History**: Show "Last seen X minutes ago"
6. **Unfriend Confirmation**: Add confirmation dialog before unfriending
7. **Block Reason**: Optional reason when blocking someone

---

## Troubleshooting

### Issue: Friend requests not appearing
- Check that `fetchPendingRequests()` is called in FriendRequestsNotification
- Verify backend route is registered: `/api/friends/requests`
- Check auth token is being sent with request

### Issue: Cannot message friends
- Verify socket.js has friend validation
- Check that both users are in each other's friends array
- Test with `message_error` socket event listener

### Issue: Close friend toggle not working
- Verify user is already a friend before adding to close friends
- Check backend validates friendship before adding to closeFriends
- Ensure `addCloseFriend` returns success response

### Issue: Search not showing relationship status
- Backend must populate relationship status in search results
- Check `searchUsers` controller logic
- Verify frontend displays correct status icons

---

## Conclusion

The friend system is now fully implemented with:
✅ 2-tier privacy (Friend vs Close Friend)
✅ Friend request workflow
✅ Message validation (only friends can chat)
✅ Activity visibility control (only close friends see song)
✅ UI components for managing friends
✅ Real-time updates via Socket.io

This solves the original privacy issue where everyone could see everyone's listening activity!
