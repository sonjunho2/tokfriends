import json
from datetime import datetime

try:
    import yaml  # type: ignore
except ImportError:  # pragma: no cover
    yaml = None

def to_yaml(data):
    if yaml is not None:
        return yaml.safe_dump(data, sort_keys=False, allow_unicode=True)
    # minimal fallback YAML emitter
    def emit(obj, indent=0):
        sp = '  ' * indent
        if isinstance(obj, dict):
            lines = []
            for k, v in obj.items():
                if isinstance(v, (dict, list)):
                    lines.append(f"{sp}{k}:")
                    lines.append(emit(v, indent + 1))
                else:
                    lines.append(f"{sp}{k}: {json.dumps(v, ensure_ascii=False)}")
            return '\n'.join(lines)
        if isinstance(obj, list):
            lines = []
            for item in obj:
                if isinstance(item, (dict, list)):
                    lines.append(f"{sp}-")
                    lines.append(emit(item, indent + 1))
                else:
                    lines.append(f"{sp}- {json.dumps(item, ensure_ascii=False)}")
            return '\n'.join(lines)
        return f"{sp}{json.dumps(obj, ensure_ascii=False)}"
    return emit(data)

components = {
    "schemas": {
        "AuthUser": {
            "type": "object",
            "properties": {
                "id": {"type": "string"},
                "email": {"type": ["string", "null"], "format": "email"},
                "displayName": {"type": ["string", "null"]},
                "provider": {"type": ["string", "null"]},
                "pointsBalance": {"type": "integer"},
                "profile": {
                    "type": ["object", "null"],
                    "additionalProperties": True,
                },
            },
        },
        "AuthEmailSignupRequest": {
            "type": "object",
            "required": ["email", "password", "dob", "gender"],
            "properties": {
                "email": {"type": "string", "format": "email"},
                "password": {"type": "string", "minLength": 8},
                "displayName": {"type": "string"},
                "dob": {"type": "string"},
                "gender": {"type": "string"},
            },
        },
        "AuthEmailLoginRequest": {
            "type": "object",
            "required": ["email", "password"],
            "properties": {
                "email": {"type": "string", "format": "email"},
                "password": {"type": "string"},
            },
        },
        "AuthEmailResponse": {
            "type": "object",
            "required": ["user", "token", "access_token"],
            "properties": {
                "user": {"$ref": "#/components/schemas/AuthUser"},
                "token": {"type": "string"},
                "access_token": {"type": "string"},
            },
        },
        "AuthPhoneRequestOtp": {
            "type": "object",
            "required": ["phone", "countryCode"],
            "properties": {
                "phone": {"type": "string"},
                "countryCode": {"type": "string"},
            },
        },
        "AuthPhoneRequestOtpResponse": {
            "type": "object",
            "required": ["requestId", "expiresIn"],
            "properties": {
                "requestId": {"type": "string"},
                "expiresIn": {"type": "integer"},
                "debugCode": {"type": "string"},
            },
        },
        "AuthPhoneVerifyRequest": {
            "type": "object",
            "required": ["requestId", "phone", "code"],
            "properties": {
                "requestId": {"type": "string"},
                "phone": {"type": "string"},
                "code": {"type": "string"},
            },
        },
        "AuthPhoneVerifyResponseSuccess": {
            "type": "object",
            "required": ["token", "user"],
            "properties": {
                "token": {"type": "string"},
                "user": {"$ref": "#/components/schemas/AuthUser"},
            },
        },
        "AuthPhoneVerifyResponsePending": {
            "type": "object",
            "required": ["needsProfile", "verificationId"],
            "properties": {
                "needsProfile": {"type": "boolean"},
                "verificationId": {"type": "string"},
            },
        },
        "AuthCompletePhoneProfileRequest": {
            "type": "object",
            "required": ["phone", "verificationId", "nickname", "birthYear", "gender"],
            "properties": {
                "phone": {"type": "string"},
                "verificationId": {"type": "string"},
                "nickname": {"type": "string"},
                "birthYear": {"type": "integer"},
                "gender": {"type": "string"},
                "region": {"type": "string"},
                "headline": {"type": "string"},
                "bio": {"type": "string"},
                "avatarUri": {"type": "string"},
            },
        },
        "UserSummary": {
            "type": "object",
            "properties": {
                "id": {"type": "string"},
                "email": {"type": ["string", "null"]},
                "displayName": {"type": ["string", "null"]},
                "status": {"type": "string"},
                "provider": {"type": ["string", "null"]},
                "pointsBalance": {"type": "integer"},
                "createdAt": {"type": "string"},
                "profile": {"type": ["object", "null"], "additionalProperties": True},
                "counts": {"type": ["object", "null"], "additionalProperties": True},
            },
        },
        "UsersMeResponse": {
            "type": "object",
            "properties": {
                "ok": {"type": "boolean"},
                "data": {"$ref": "#/components/schemas/UserSummary"},
            },
        },
        "UsersUpdateRequest": {
            "type": "object",
            "properties": {
                "displayName": {"type": "string"},
                "nickname": {"type": "string"},
                "bio": {"type": "string"},
                "region1": {"type": "string"},
                "region2": {"type": "string"},
                "interests": {
                    "oneOf": [
                        {"type": "array", "items": {"type": "string"}},
                        {"type": "string"},
                    ]
                },
                "marketingOptIn": {
                    "oneOf": [
                        {"type": "boolean"},
                        {"type": "string"},
                    ]
                },
                "headline": {"type": "string"},
                "avatarUri": {"type": "string"},
            },
        },
        "UsersSearchResponse": {
            "type": "object",
            "properties": {
                "ok": {"type": "boolean"},
                "data": {"type": "array", "items": {"type": "object", "additionalProperties": True}},
            },
        },
        "AdminUsersListResponse": {
            "type": "object",
            "properties": {
                "ok": {"type": "boolean"},
                "page": {"type": "integer"},
                "limit": {"type": "integer"},
                "total": {"type": "integer"},
                "totalPages": {"type": "integer"},
                "data": {"type": "array", "items": {"type": "object", "additionalProperties": True}},
            },
        },
        "AdminUserDetailResponse": {
            "type": "object",
            "properties": {
                "ok": {"type": "boolean"},
                "data": {"type": "object", "additionalProperties": True},
            },
        },
        "AdminUserProfileUpdate": {
            "type": "object",
            "additionalProperties": True,
        },
        "AdminUserStatusUpdate": {
            "type": "object",
            "required": ["status"],
            "properties": {
                "status": {"type": "string"},
                "expiresAt": {"type": "string"},
            },
        },
        "AdminUserNote": {
            "type": "object",
            "required": ["note"],
            "properties": {
                "note": {"type": "string"},
                "authorId": {"type": "string"},
            },
        },
        "AdminUserAction": {
            "type": "object",
            "properties": {
                "reason": {"type": "string"},
                "performedBy": {"type": "string"},
                "metadata": {"type": "object", "additionalProperties": True},
            },
        },
        "CreatePostRequest": {
            "type": "object",
            "required": ["topicId", "content"],
            "properties": {
                "topicId": {"type": "string"},
                "content": {"type": "string"},
            },
        },
        "Post": {
            "type": "object",
            "properties": {
                "id": {"type": "string"},
                "userId": {"type": "string"},
                "topicId": {"type": "string"},
                "content": {"type": "string"},
                "createdAt": {"type": "string"},
            },
        },
        "PaginatedPosts": {
            "type": "object",
            "properties": {
                "items": {"type": "array", "items": {"$ref": "#/components/schemas/Post"}},
                "nextCursor": {"type": ["string", "null"]},
                "hasMore": {"type": "boolean"},
            },
        },
        "Topic": {
            "type": "object",
            "properties": {
                "id": {"type": "string"},
                "name": {"type": "string"},
                "createdAt": {"type": "string"},
                "postsCount": {"type": "integer"},
            },
        },
        "DiscoverUser": {
            "type": "object",
            "properties": {
                "id": {"type": "string"},
                "email": {"type": "string"},
                "displayName": {"type": ["string", "null"]},
                "gender": {"type": ["string", "null"]},
                "dob": {"type": ["string", "null"]},
                "region1": {"type": ["string", "null"]},
                "region2": {"type": ["string", "null"]},
            },
        },
        "FriendshipRequest": {
            "type": "object",
            "required": ["requesterId", "addresseeId"],
            "properties": {
                "requesterId": {"type": "string"},
                "addresseeId": {"type": "string"},
            },
        },
        "Friendship": {
            "type": "object",
            "properties": {
                "id": {"type": "string"},
                "requesterId": {"type": "string"},
                "addresseeId": {"type": "string"},
                "status": {"type": "string"},
                "createdAt": {"type": "string"},
                "updatedAt": {"type": "string"},
            },
            "additionalProperties": True,
        },
        "ChatMessageRequest": {
            "type": "object",
            "required": ["chatId", "senderId", "content"],
            "properties": {
                "chatId": {"type": "string"},
                "senderId": {"type": "string"},
                "content": {"type": "string"},
            },
        },
        "ChatRoomRequest": {
            "type": "object",
            "required": ["userAId", "userBId"],
            "properties": {
                "userAId": {"type": "string"},
                "userBId": {"type": "string"},
                "title": {"type": "string"},
                "category": {"type": "string"},
            },
        },
        "ChatDirectRequest": {
            "type": "object",
            "required": ["targetUserId"],
            "properties": {
                "targetUserId": {"type": "string"},
            },
        },
        "PointProduct": {
            "type": "object",
            "properties": {
                "id": {"type": "string"},
                "productId": {"type": "string"},
                "label": {"type": "string"},
                "priceText": {"type": "string"},
                "points": {"type": "integer"},
                "recommended": {"type": "boolean"},
                "currency": {"type": "string"},
            },
        },
        "ConfirmPurchaseRequest": {
            "type": "object",
            "required": ["productId", "transactionId", "receipt", "platform"],
            "properties": {
                "productId": {"type": "string"},
                "transactionId": {"type": "string"},
                "receipt": {"type": "string"},
                "platform": {"type": "string"},
            },
        },
        "ConfirmPurchaseResponse": {
            "type": "object",
            "properties": {
                "success": {"type": "boolean"},
                "balance": {"type": "integer"},
            },
        },
        "GiftItem": {
            "type": "object",
            "properties": {
                "id": {"type": "string"},
                "name": {"type": "string"},
                "description": {"type": "string"},
                "imageUrl": {"type": "string"},
                "priceCents": {"type": "integer"},
                "currency": {"type": "string"},
            },
        },
        "LegalDocument": {
            "type": "object",
            "properties": {
                "slug": {"type": "string"},
                "title": {"type": "string"},
                "content": {"type": "string"},
            },
        },
        "Announcement": {
            "type": "object",
            "properties": {
                "id": {"type": "string"},
                "title": {"type": "string"},
                "body": {"type": "string"},
                "isActive": {"type": "boolean"},
                "createdAt": {"type": "string"},
                "startsAt": {"type": ["string", "null"]},
                "endsAt": {"type": ["string", "null"]},
            },
        },
        "AnnouncementCreate": {
            "type": "object",
            "required": ["title", "body"],
            "properties": {
                "title": {"type": "string"},
                "body": {"type": "string"},
                "isActive": {"type": "boolean"},
                "startsAt": {"type": "string"},
                "endsAt": {"type": ["string", "null"]},
            },
        },
        "AnnouncementUpdate": {
            "type": "object",
            "properties": {
                "title": {"type": "string"},
                "body": {"type": "string"},
                "isActive": {"type": "boolean"},
                "startsAt": {"type": "string"},
                "endsAt": {"type": ["string", "null"]},
            },
        },
        "ReportItem": {
            "type": "object",
            "properties": {
                "id": {"type": "string"},
                "reason": {"type": "string"},
                "status": {"type": "string"},
                "createdAt": {"type": "string"},
            },
            "additionalProperties": True,
        },
        "MetricsSummary": {
            "type": "object",
            "properties": {
                "users": {"type": "integer"},
                "posts": {"type": "integer"},
                "chats": {"type": "integer"},
                "reports": {"type": "integer"},
                "activeAnnouncements": {"type": "integer"},
                "bannedWords": {"type": "integer"},
                "activeSubscriptions": {"type": "integer"},
            },
        },
        "MetricsDashboard": {
            "type": "object",
            "additionalProperties": True,
        },
        "CommunityReport": {
            "type": "object",
            "required": ["reason"],
            "properties": {
                "targetUserId": {"type": "string"},
                "postId": {"type": "string"},
                "reason": {"type": "string"},
            },
        },
        "CommunityBlock": {
            "type": "object",
            "required": ["blockedUserId"],
            "properties": {
                "blockedUserId": {"type": "string"},
            },
        },
        "TranslateRequest": {
            "type": "object",
            "required": ["text", "source", "target"],
            "properties": {
                "text": {"type": "string"},
                "source": {"type": "string"},
                "target": {"type": "string"},
            },
        },
        "TranslateResponse": {
            "type": "object",
            "properties": {
                "text": {"type": "string"},
                "provider": {"type": "string"},
                "mode": {"type": "string"},
                "error": {"type": "string"},
            },
        },
        "HealthResponse": {
            "type": "object",
            "properties": {
                "ok": {"type": "boolean"},
                "timestamp": {"type": "string"},
                "components": {"type": "array", "items": {"type": "object", "additionalProperties": True}},
            },
        },
        "AdminSetRoleRequest": {
            "type": "object",
            "required": ["role"],
            "properties": {
                "role": {"type": "string"},
            },
        },
        "RefundRequest": {
            "type": "object",
            "required": ["userId", "platform", "productId", "receiptId"],
            "properties": {
                "userId": {"type": "string"},
                "platform": {"type": "string"},
                "productId": {"type": "string"},
                "receiptId": {"type": "string"},
                "reason": {"type": "string"},
            },
        },
        "Refund": {
            "type": "object",
            "additionalProperties": True,
        },
    }
}

endpoints = [
    {
        "path": "/",
        "method": "get",
        "summary": "Redirect to docs",
        "tags": ["root"],
        "public": True,
        "responses": {
            "302": {"description": "Redirect to /docs"}
        },
    },
    {
        "path": "/health",
        "method": "get",
        "summary": "Health check",
        "tags": ["health"],
        "public": True,
        "responses": {
            "200": {
                "description": "Service health",
                "content": {"application/json": {"schema": {"$ref": "#/components/schemas/HealthResponse"}}},
            }
        },
    },
    {
        "path": "/auth/signup/email",
        "method": "post",
        "summary": "Email signup",
        "tags": ["auth"],
        "public": True,
        "aliases": ["/auth/signup", "/auth/register", "/auth/users/signup", "/auth/users/register"],
        "requestBody": {"schema": {"$ref": "#/components/schemas/AuthEmailSignupRequest"}},
        "responses": {
            "201": {"description": "User created", "content": {"application/json": {"schema": {"$ref": "#/components/schemas/AuthEmailResponse"}}}},
            "400": {"description": "Invalid input"},
        },
    },
    {
        "path": "/auth/login/email",
        "method": "post",
        "summary": "Email login",
        "tags": ["auth"],
        "public": True,
        "aliases": ["/auth/login"],
        "requestBody": {"schema": {"$ref": "#/components/schemas/AuthEmailLoginRequest"}},
        "responses": {
            "200": {"description": "Login success", "content": {"application/json": {"schema": {"$ref": "#/components/schemas/AuthEmailResponse"}}}},
            "401": {"description": "Invalid credentials"},
        },
    },
    {
        "path": "/auth/apple",
        "method": "post",
        "summary": "Apple login",
        "tags": ["auth"],
        "public": True,
        "requestBody": {"schema": {"type": "object", "properties": {"token": {"type": "string"}, "idToken": {"type": "string"}, "authorizationCode": {"type": "string"}}, "required": ["token"]}},
        "responses": {
            "400": {"description": "Not implemented"}
        },
    },
    {
        "path": "/auth/phone/request-otp",
        "method": "post",
        "summary": "Request phone OTP",
        "tags": ["auth"],
        "public": True,
        "requestBody": {"schema": {"$ref": "#/components/schemas/AuthPhoneRequestOtp"}},
        "responses": {
            "200": {"description": "OTP issued", "content": {"application/json": {"schema": {"$ref": "#/components/schemas/AuthPhoneRequestOtpResponse"}}}},
            "400": {"description": "Invalid phone"},
        },
    },
    {
        "path": "/auth/phone/verify",
        "method": "post",
        "summary": "Verify phone OTP",
        "tags": ["auth"],
        "public": True,
        "requestBody": {"schema": {"$ref": "#/components/schemas/AuthPhoneVerifyRequest"}},
        "responses": {
            "200": {
                "description": "Verification result",
                "content": {
                    "application/json": {
                        "schema": {
                            "oneOf": [
                                {"$ref": "#/components/schemas/AuthPhoneVerifyResponseSuccess"},
                                {"$ref": "#/components/schemas/AuthPhoneVerifyResponsePending"},
                            ]
                        }
                    }
                },
            },
            "400": {"description": "Invalid request"},
            "401": {"description": "Incorrect code"},
        },
    },
    {
        "path": "/auth/phone/complete-profile",
        "method": "post",
        "summary": "Complete phone profile",
        "tags": ["auth"],
        "public": True,
        "requestBody": {"schema": {"$ref": "#/components/schemas/AuthCompletePhoneProfileRequest"}},
        "responses": {
            "200": {"description": "Account issued", "content": {"application/json": {"schema": {"$ref": "#/components/schemas/AuthPhoneVerifyResponseSuccess"}}}},
            "400": {"description": "Invalid verification"},
            "409": {"description": "Already registered"},
        },
    },
    {
        "path": "/users/me",
        "method": "get",
        "summary": "Get current user",
        "tags": ["users"],
        "public": False,
        "responses": {
            "200": {"description": "Current profile", "content": {"application/json": {"schema": {"$ref": "#/components/schemas/UsersMeResponse"}}}},
            "404": {"description": "Not found"},
        },
    },
    {
        "path": "/users/search",
        "method": "get",
        "summary": "Search users",
        "tags": ["users"],
        "public": False,
        "responses": {
            "200": {"description": "Matches", "content": {"application/json": {"schema": {"$ref": "#/components/schemas/UsersSearchResponse"}}}},
        },
    },
    {
        "path": "/users/{id}",
        "method": "patch",
        "summary": "Update profile",
        "tags": ["users"],
        "public": False,
        "requestBody": {"schema": {"$ref": "#/components/schemas/UsersUpdateRequest"}},
        "responses": {
            "200": {"description": "Updated profile", "content": {"application/json": {"schema": {"$ref": "#/components/schemas/UsersMeResponse"}}}},
            "403": {"description": "Forbidden"},
            "404": {"description": "Not found"},
        },
    },
    {
        "path": "/users/{id}",
        "method": "get",
        "summary": "Get user",
        "tags": ["users"],
        "public": False,
        "responses": {
            "200": {"description": "User detail", "content": {"application/json": {"schema": {"$ref": "#/components/schemas/UsersMeResponse"}}}},
            "404": {"description": "Not found"},
        },
    },
    {
        "path": "/admin/users",
        "method": "get",
        "summary": "Admin list users",
        "tags": ["admin/users"],
        "public": False,
        "responses": {
            "200": {"description": "Paginated", "content": {"application/json": {"schema": {"$ref": "#/components/schemas/AdminUsersListResponse"}}}},
        },
    },
    {
        "path": "/admin/users/{id}",
        "method": "get",
        "summary": "Admin user detail",
        "tags": ["admin/users"],
        "public": False,
        "responses": {
            "200": {"description": "Detail", "content": {"application/json": {"schema": {"$ref": "#/components/schemas/AdminUserDetailResponse"}}}},
            "404": {"description": "Not found"},
        },
    },
    {
        "path": "/admin/users/{id}",
        "method": "patch",
        "summary": "Admin update user",
        "tags": ["admin/users"],
        "public": False,
        "requestBody": {"schema": {"$ref": "#/components/schemas/AdminUserProfileUpdate"}},
        "responses": {
            "200": {"description": "Updated", "content": {"application/json": {"schema": {"$ref": "#/components/schemas/AdminUserDetailResponse"}}}},
        },
    },
    {
        "path": "/admin/users/{id}/status",
        "method": "patch",
        "summary": "Admin update status",
        "tags": ["admin/users"],
        "public": False,
        "requestBody": {"schema": {"$ref": "#/components/schemas/AdminUserStatusUpdate"}},
        "responses": {
            "200": {"description": "Status updated"},
        },
    },
    {
        "path": "/admin/users/{id}/notes",
        "method": "post",
        "summary": "Admin add note",
        "tags": ["admin/users"],
        "public": False,
        "requestBody": {"schema": {"$ref": "#/components/schemas/AdminUserNote"}},
        "responses": {
            "200": {"description": "Note added"},
            "400": {"description": "Missing note"},
        },
    },
    {
        "path": "/admin/users/{id}/actions/resend-verification",
        "method": "post",
        "summary": "Log resend verification",
        "tags": ["admin/users"],
        "public": False,
        "requestBody": {"schema": {"$ref": "#/components/schemas/AdminUserAction"}},
        "responses": {
            "200": {"description": "Logged"},
        },
    },
    {
        "path": "/admin/users/{id}/actions/password-reset",
        "method": "post",
        "summary": "Log password reset",
        "tags": ["admin/users"],
        "public": False,
        "requestBody": {"schema": {"$ref": "#/components/schemas/AdminUserAction"}},
        "responses": {
            "200": {"description": "Logged"},
        },
    },
    {
        "path": "/admin/users/{id}/actions/escalate",
        "method": "post",
        "summary": "Log escalate",
        "tags": ["admin/users"],
        "public": False,
        "requestBody": {"schema": {"$ref": "#/components/schemas/AdminUserAction"}},
        "responses": {
            "200": {"description": "Logged"},
        },
    },
    {
        "path": "/posts",
        "method": "post",
        "summary": "Create post",
        "tags": ["posts"],
        "public": False,
        "requestBody": {"schema": {"$ref": "#/components/schemas/CreatePostRequest"}},
        "responses": {
            "201": {"description": "Created", "content": {"application/json": {"schema": {"$ref": "#/components/schemas/Post"}}}},
        },
    },
    {
        "path": "/posts",
        "method": "get",
        "summary": "List posts",
        "tags": ["posts"],
        "public": False,
        "responses": {
            "200": {"description": "List", "content": {"application/json": {"schema": {"$ref": "#/components/schemas/PaginatedPosts"}}}},
        },
    },
    {
        "path": "/topics/{id}/posts",
        "method": "get",
        "summary": "Posts by topic",
        "tags": ["posts"],
        "public": False,
        "responses": {
            "200": {"description": "List", "content": {"application/json": {"schema": {"$ref": "#/components/schemas/PaginatedPosts"}}}},
        },
    },
    {
        "path": "/topics",
        "method": "get",
        "summary": "List topics",
        "tags": ["topics"],
        "public": False,
        "responses": {
            "200": {"description": "Topics", "content": {"application/json": {"schema": {"type": "array", "items": {"$ref": "#/components/schemas/Topic"}}}}},
        },
    },
    {
        "path": "/discover",
        "method": "get",
        "summary": "Discover users",
        "tags": ["discover"],
        "public": False,
        "responses": {
            "200": {"description": "Matches", "content": {"application/json": {"schema": {"type": "object", "properties": {"ok": {"type": "boolean"}, "data": {"type": "array", "items": {"$ref": "#/components/schemas/DiscoverUser"}}}}}}},
        },
    },
    {
        "path": "/friendships",
        "method": "post",
        "summary": "Send friend request",
        "tags": ["friendships"],
        "public": False,
        "requestBody": {"schema": {"$ref": "#/components/schemas/FriendshipRequest"}},
        "responses": {
            "200": {"description": "Created", "content": {"application/json": {"schema": {"type": "object", "properties": {"ok": {"type": "boolean"}, "data": {"$ref": "#/components/schemas/Friendship"}}}}}},
        },
    },
    {
        "path": "/friendships/{id}/accept",
        "method": "post",
        "summary": "Accept friend",
        "tags": ["friendships"],
        "public": False,
        "responses": {
            "200": {"description": "Accepted", "content": {"application/json": {"schema": {"type": "object", "properties": {"ok": {"type": "boolean"}, "data": {"$ref": "#/components/schemas/Friendship"}}}}}},
        },
    },
    {
        "path": "/friendships/{id}/decline",
        "method": "post",
        "summary": "Decline friend",
        "tags": ["friendships"],
        "public": False,
        "responses": {
            "200": {"description": "Declined", "content": {"application/json": {"schema": {"type": "object", "properties": {"ok": {"type": "boolean"}, "data": {"$ref": "#/components/schemas/Friendship"}}}}}},
        },
    },
    {
        "path": "/friendships/{id}/cancel",
        "method": "post",
        "summary": "Cancel friend",
        "tags": ["friendships"],
        "public": False,
        "responses": {
            "200": {"description": "Cancelled", "content": {"application/json": {"schema": {"type": "object", "properties": {"ok": {"type": "boolean"}, "data": {"$ref": "#/components/schemas/Friendship"}}}}}},
        },
    },
    {
        "path": "/friendships",
        "method": "get",
        "summary": "List friend requests",
        "tags": ["friendships"],
        "public": False,
        "responses": {
            "200": {"description": "Requests", "content": {"application/json": {"schema": {"type": "object", "properties": {"ok": {"type": "boolean"}, "data": {"type": "array", "items": {"$ref": "#/components/schemas/Friendship"}}}}}}},
        },
    },
    {
        "path": "/chats",
        "method": "get",
        "summary": "List chats",
        "tags": ["chats"],
        "public": False,
        "responses": {
            "200": {"description": "Chats", "content": {"application/json": {"schema": {"type": "array", "items": {"type": "object", "additionalProperties": True}}}}},
        },
    },
    {
        "path": "/chats/message",
        "method": "post",
        "summary": "Send message",
        "tags": ["chats"],
        "public": False,
        "requestBody": {"schema": {"$ref": "#/components/schemas/ChatMessageRequest"}},
        "responses": {
            "200": {"description": "Message", "content": {"application/json": {"schema": {"type": "object", "additionalProperties": True}}}},
        },
    },
    {
        "path": "/chats/rooms",
        "method": "post",
        "summary": "Create chat room",
        "tags": ["chats"],
        "public": False,
        "aliases": ["/chats/chat/rooms", "/chats/chats/rooms", "/chats/conversations"],
        "requestBody": {"schema": {"$ref": "#/components/schemas/ChatRoomRequest"}},
        "responses": {
            "200": {"description": "Room", "content": {"application/json": {"schema": {"type": "object", "properties": {"ok": {"type": "boolean"}, "id": {"type": "string"}, "userAId": {"type": "string"}, "userBId": {"type": "string"}, "title": {"type": "string"}, "category": {"type": "string"}}}}}},
        },
    },
    {
        "path": "/chats/direct",
        "method": "post",
        "summary": "Ensure direct chat",
        "tags": ["chats"],
        "public": False,
        "requestBody": {"schema": {"$ref": "#/components/schemas/ChatDirectRequest"}},
        "responses": {
            "200": {"description": "Direct room", "content": {"application/json": {"schema": {"type": "object", "properties": {"id": {"type": "string"}, "title": {"type": "string"}, "participants": {"type": "array", "items": {"type": "object", "additionalProperties": True}}}}}}},
            "400": {"description": "Invalid target"},
            "404": {"description": "Target not found"},
        },
    },
    {
        "path": "/store/point-products",
        "method": "get",
        "summary": "List point products",
        "tags": ["store"],
        "public": True,
        "responses": {
            "200": {"description": "Products", "content": {"application/json": {"schema": {"type": "object", "properties": {"items": {"type": "array", "items": {"$ref": "#/components/schemas/PointProduct"}}}}}}},
        },
    },
    {
        "path": "/store/purchases/confirm",
        "method": "post",
        "summary": "Confirm purchase",
        "tags": ["store"],
        "public": False,
        "requestBody": {"schema": {"$ref": "#/components/schemas/ConfirmPurchaseRequest"}},
        "responses": {
            "200": {"description": "Balance", "content": {"application/json": {"schema": {"$ref": "#/components/schemas/ConfirmPurchaseResponse"}}}},
            "400": {"description": "Invalid"},
            "409": {"description": "Duplicate"},
        },
    },
    {
        "path": "/gifts",
        "method": "get",
        "summary": "List gifts",
        "tags": ["gifts"],
        "public": True,
        "responses": {
            "200": {"description": "Gifts", "content": {"application/json": {"schema": {"type": "object", "properties": {"ok": {"type": "boolean"}, "data": {"type": "array", "items": {"$ref": "#/components/schemas/GiftItem"}}, "items": {"type": "array", "items": {"$ref": "#/components/schemas/GiftItem"}}}}}}},
        },
    },
    {
        "path": "/legal-documents/{slug}",
        "method": "get",
        "summary": "Get legal document",
        "tags": ["legal"],
        "public": True,
        "responses": {
            "200": {"description": "Document", "content": {"application/json": {"schema": {"$ref": "#/components/schemas/LegalDocument"}}}},
            "404": {"description": "Not found"},
        },
    },
    {
        "path": "/admin/announcements",
        "method": "get",
        "summary": "Admin list announcements",
        "tags": ["admin/announcements"],
        "public": False,
        "responses": {
            "200": {"description": "Announcements", "content": {"application/json": {"schema": {"type": "object", "properties": {"ok": {"type": "boolean"}, "data": {"type": "array", "items": {"$ref": "#/components/schemas/Announcement"}}}}}}},
        },
    },
    {
        "path": "/admin/announcements",
        "method": "post",
        "summary": "Create announcement",
        "tags": ["admin/announcements"],
        "public": False,
        "requestBody": {"schema": {"$ref": "#/components/schemas/AnnouncementCreate"}},
        "responses": {
            "201": {"description": "Created", "content": {"application/json": {"schema": {"type": "object", "properties": {"ok": {"type": "boolean"}, "data": {"$ref": "#/components/schemas/Announcement"}}}}}},
        },
    },
    {
        "path": "/admin/announcements/{id}",
        "method": "patch",
        "summary": "Update announcement",
        "tags": ["admin/announcements"],
        "public": False,
        "requestBody": {"schema": {"$ref": "#/components/schemas/AnnouncementUpdate"}},
        "responses": {
            "200": {"description": "Updated", "content": {"application/json": {"schema": {"type": "object", "properties": {"ok": {"type": "boolean"}, "data": {"$ref": "#/components/schemas/Announcement"}}}}}},
        },
    },
    {
        "path": "/admin/announcements/{id}",
        "method": "delete",
        "summary": "Delete announcement",
        "tags": ["admin/announcements"],
        "public": False,
        "responses": {
            "200": {"description": "Deleted", "content": {"application/json": {"schema": {"type": "object", "properties": {"ok": {"type": "boolean"}}}}}},
        },
    },
    {
        "path": "/announcements/active",
        "method": "get",
        "summary": "Active announcements",
        "tags": ["announcements"],
        "public": False,
        "responses": {
            "200": {"description": "Active", "content": {"application/json": {"schema": {"type": "object", "properties": {"ok": {"type": "boolean"}, "data": {"type": "array", "items": {"$ref": "#/components/schemas/Announcement"}}}}}}},
        },
    },
    {
        "path": "/announcements",
        "method": "get",
        "summary": "List announcements",
        "tags": ["announcements"],
        "public": False,
        "responses": {
            "200": {"description": "Announcements", "content": {"application/json": {"schema": {"type": "object", "properties": {"ok": {"type": "boolean"}, "data": {"type": "array", "items": {"$ref": "#/components/schemas/Announcement"}}}}}}},
        },
    },
    {
        "path": "/admin/reports",
        "method": "get",
        "summary": "Admin list reports",
        "tags": ["admin/reports"],
        "public": False,
        "responses": {
            "200": {"description": "Reports", "content": {"application/json": {"schema": {"type": "object", "properties": {"ok": {"type": "boolean"}, "data": {"type": "array", "items": {"$ref": "#/components/schemas/ReportItem"}}}}}}},
        },
    },
    {
        "path": "/admin/reports/recent",
        "method": "get",
        "summary": "Recent reports",
        "tags": ["admin/reports"],
        "public": False,
        "responses": {
            "200": {"description": "Recent", "content": {"application/json": {"schema": {"type": "object", "properties": {"ok": {"type": "boolean"}, "data": {"type": "array", "items": {"$ref": "#/components/schemas/ReportItem"}}}}}}},
        },
    },
    {
        "path": "/metrics",
        "method": "get",
        "summary": "Metrics summary",
        "tags": ["metrics"],
        "public": False,
        "responses": {
            "200": {"description": "Summary", "content": {"application/json": {"schema": {"type": "object", "properties": {"ok": {"type": "boolean"}, "data": {"$ref": "#/components/schemas/MetricsSummary"}}}}}},
        },
    },
    {
        "path": "/metrics/dashboard",
        "method": "get",
        "summary": "Metrics dashboard",
        "tags": ["metrics"],
        "public": False,
        "responses": {
            "200": {"description": "Dashboard", "content": {"application/json": {"schema": {"type": "object", "properties": {"ok": {"type": "boolean"}, "data": {"$ref": "#/components/schemas/MetricsDashboard"}}}}}},
        },
    },
    {
        "path": "/community/report",
        "method": "post",
        "summary": "Report content",
        "tags": ["community"],
        "public": False,
        "requestBody": {"schema": {"$ref": "#/components/schemas/CommunityReport"}},
        "responses": {
            "200": {"description": "Reported", "content": {"application/json": {"schema": {"type": "object", "properties": {"ok": {"type": "boolean"}, "id": {"type": "string"}}}}}},
        },
    },
    {
        "path": "/community/block",
        "method": "post",
        "summary": "Block user",
        "tags": ["community"],
        "public": False,
        "requestBody": {"schema": {"$ref": "#/components/schemas/CommunityBlock"}},
        "responses": {
            "200": {"description": "Blocked", "content": {"application/json": {"schema": {"type": "object", "properties": {"ok": {"type": "boolean"}, "id": {"type": "string"}}}}}},
        },
    },
    {
        "path": "/translate",
        "method": "post",
        "summary": "Translate text",
        "tags": ["translate"],
        "public": False,
        "requestBody": {"schema": {"$ref": "#/components/schemas/TranslateRequest"}},
        "responses": {
            "200": {"description": "Translated", "content": {"application/json": {"schema": {"$ref": "#/components/schemas/TranslateResponse"}}}},
        },
    },
    {
        "path": "/icebreakers",
        "method": "get",
        "summary": "Get icebreakers",
        "tags": ["icebreakers"],
        "public": False,
        "responses": {
            "200": {"description": "Prompts", "content": {"application/json": {"schema": {"type": "array", "items": {"type": "string"}}}}},
        },
    },
    {
        "path": "/admin/users/{id}/role",
        "method": "patch",
        "summary": "Set user role",
        "tags": ["admin"],
        "public": False,
        "requestBody": {"schema": {"$ref": "#/components/schemas/AdminSetRoleRequest"}},
        "responses": {
            "200": {"description": "Role updated", "content": {"application/json": {"schema": {"type": "object", "additionalProperties": True}}}},
        },
    },
    {
        "path": "/admin/refunds",
        "method": "get",
        "summary": "List refunds",
        "tags": ["admin"],
        "public": False,
        "responses": {
            "200": {"description": "Refunds", "content": {"application/json": {"schema": {"type": "array", "items": {"$ref": "#/components/schemas/Refund"}}}}},
        },
    },
    {
        "path": "/admin/refunds",
        "method": "post",
        "summary": "Create refund",
        "tags": ["admin"],
        "public": False,
        "requestBody": {"schema": {"$ref": "#/components/schemas/RefundRequest"}},
        "responses": {
            "201": {"description": "Created", "content": {"application/json": {"schema": {"$ref": "#/components/schemas/Refund"}}}},
        },
    },
    {
        "path": "/admin/refunds/{id}/approve",
        "method": "patch",
        "summary": "Approve refund",
        "tags": ["admin"],
        "public": False,
        "responses": {
            "200": {"description": "Approved", "content": {"application/json": {"schema": {"$ref": "#/components/schemas/Refund"}}}},
        },
    },
    {
        "path": "/admin/refunds/{id}/deny",
        "method": "patch",
        "summary": "Deny refund",
        "tags": ["admin"],
        "public": False,
        "responses": {
            "200": {"description": "Denied", "content": {"application/json": {"schema": {"$ref": "#/components/schemas/Refund"}}}},
        },
    },
]

security_schemes = {
    "bearerAuth": {
        "type": "http",
        "scheme": "bearer",
        "bearerFormat": "JWT",
    }
}

openapi = {
    "openapi": "3.1.0",
    "info": {
        "title": "tok-friends API",
        "version": "1.0.0",
        "description": "Auto-generated contract based on NestJS controllers.",
    },
    "servers": [
        {"url": "https://api.tokfriends.app", "description": "Production (example)"},
        {"url": "http://localhost:4000", "description": "Local"},
    ],
    "components": {
        "schemas": components["schemas"],
        "securitySchemes": security_schemes,
    },
    "paths": {},
}

contract_endpoints = []
for ep in endpoints:
    path_item = openapi["paths"].setdefault(ep["path"], {})
    op = {
        "summary": ep.get("summary"),
        "tags": ep.get("tags"),
        "responses": ep.get("responses", {}),
    }
    if not ep.get("public", False):
        op["security"] = [{"bearerAuth": []}]
    if "requestBody" in ep:
        schema = ep["requestBody"].get("schema", {"type": "object"})
        op["requestBody"] = {
            "required": True,
            "content": {"application/json": {"schema": schema}},
        }
    if "aliases" in ep:
        op["description"] = (op.get("description") or "") + f" Aliases: {', '.join(ep['aliases'])}."
    method = ep["method"].lower()
    path_item[method] = op

    contract_endpoints.append({
        "path": ep["path"],
        "method": ep["method"].upper(),
        "summary": ep.get("summary"),
        "tags": ep.get("tags"),
        "public": ep.get("public", False),
        "aliases": ep.get("aliases", []),
        "requestSchema": ep.get("requestBody", {}).get("schema"),
        "responses": ep.get("responses"),
    })

metadata = {
    "generatedAt": datetime.utcnow().isoformat() + "Z",
    "endpointCount": len(contract_endpoints),
    "authentication": {
        "default": "bearer",
        "publicEndpoints": [ep["path"] for ep in contract_endpoints if ep["public"]],
    },
}

api_contract = {
    "metadata": metadata,
    "components": components,
    "endpoints": contract_endpoints,
}

with open("_contract/api-contract.json", "w", encoding="utf-8") as f:
    json.dump(api_contract, f, ensure_ascii=False, indent=2)

with open("_contract/openapi.yaml", "w", encoding="utf-8") as f:
    f.write(to_yaml(openapi))

print("Generated contract for", len(contract_endpoints), "endpoints")
