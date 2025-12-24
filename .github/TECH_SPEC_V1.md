# Storium V1 - Technical Specification

**Version:** 1.0  
**Last Updated:** December 24, 2025  
**Status:** Draft

## Overview

Storium is a multi-user home/lab inventory management system that allows users to organize physical items across hierarchical locations, track item movements, and search efficiently across large inventories.

### Key Features

- Multi-user support via Spaces (shared inventory environments)
- Hierarchical location organization (ROOT → FLOOR → ROOM → CONTAINER)
- Multi-method item identification (NFC, QR codes, barcodes)
- Item tagging and categorization
- Movement history tracking
- Fuzzy search with full location paths
- Performance optimized for 10,000+ items per space

### Out of Scope for V1

- Authentication and authorization (design is extensible for future JWT implementation)
- User permissions and role-based access control
- Real-time notifications
- Bulk import/export
- Advanced analytics

---

## Data Model

### Entity Relationships

```
Space (1) ──→ (N) Members
Space (1) ──→ (N) Locations
Space (1) ──→ (N) Tags
Space (1) ──→ (N) Items

Location (1) ──→ (N) Location (self-referencing hierarchy)
Location (1) ──→ (N) Items

Item (N) ←──→ (N) Tag (via ItemTag join table)
Item (1) ──→ (N) MovementHistory

Member (1) ──→ (N) Items (created_by)
Member (1) ──→ (N) Locations (created_by)
Member (1) ──→ (N) MovementHistory (moved_by)
```

### Entities

#### 1. Space

Multi-tenant isolation boundary. All data belongs to a space.

| Field       | Type          | Constraints           | Description                      |
| ----------- | ------------- | --------------------- | -------------------------------- |
| id          | STRING (CUID) | PRIMARY KEY           | Unique identifier                |
| name        | STRING        | NOT NULL              | Space name (e.g., "Home", "Lab") |
| description | STRING        | NULLABLE              | Optional description             |
| created_at  | TIMESTAMP     | NOT NULL, DEFAULT NOW | Creation timestamp               |
| updated_at  | TIMESTAMP     | NOT NULL, AUTO        | Last update timestamp            |

**Indexes:**

- `PRIMARY KEY (id)`
- `INDEX (name)` - for search

---

#### 2. Member

Users who belong to a space. No authentication in V1.

| Field      | Type          | Constraints                      | Description                     |
| ---------- | ------------- | -------------------------------- | ------------------------------- |
| id         | STRING (CUID) | PRIMARY KEY                      | Unique identifier               |
| space_id   | STRING        | FOREIGN KEY → Space.id, NOT NULL | Parent space                    |
| name       | STRING        | NOT NULL                         | Member's display name           |
| email      | STRING        | UNIQUE, NOT NULL                 | Email address (for future auth) |
| role       | STRING        | NULLABLE                         | Future: ADMIN, MEMBER, VIEWER   |
| created_at | TIMESTAMP     | NOT NULL, DEFAULT NOW            | Creation timestamp              |
| updated_at | TIMESTAMP     | NOT NULL, AUTO                   | Last update timestamp           |

**Indexes:**

- `PRIMARY KEY (id)`
- `INDEX (space_id)` - multi-tenant queries
- `UNIQUE INDEX (email)` - future authentication
- `INDEX (space_id, name)` - search within space

**Constraints:**

- `FOREIGN KEY (space_id) REFERENCES Space(id) ON DELETE CASCADE`

---

#### 3. Location

Physical locations in a hierarchical structure.

| Field              | Type          | Constraints                         | Description                         |
| ------------------ | ------------- | ----------------------------------- | ----------------------------------- |
| id                 | STRING (CUID) | PRIMARY KEY                         | Unique identifier                   |
| space_id           | STRING        | FOREIGN KEY → Space.id, NOT NULL    | Parent space                        |
| name               | STRING        | NOT NULL                            | Location name                       |
| location_type      | ENUM          | NOT NULL                            | ROOT, FLOOR, ROOM, CONTAINER, OTHER |
| parent_location_id | STRING        | FOREIGN KEY → Location.id, NULLABLE | Parent location (null = root)       |
| nfc_tag            | STRING        | UNIQUE, NULLABLE                    | NFC identifier                      |
| qr_code            | STRING        | UNIQUE, NULLABLE                    | QR code identifier                  |
| barcode            | STRING        | UNIQUE, NULLABLE                    | Barcode identifier                  |
| created_by_id      | STRING        | FOREIGN KEY → Member.id, NOT NULL   | Creator                             |
| updated_by_id      | STRING        | FOREIGN KEY → Member.id, NULLABLE   | Last updater                        |
| created_at         | TIMESTAMP     | NOT NULL, DEFAULT NOW               | Creation timestamp                  |
| updated_at         | TIMESTAMP     | NOT NULL, AUTO                      | Last update timestamp               |

**Indexes:**

- `PRIMARY KEY (id)`
- `INDEX (space_id)` - multi-tenant queries
- `INDEX (parent_location_id)` - hierarchy traversal
- `INDEX (name)` - fuzzy search
- `UNIQUE INDEX (nfc_tag)` - scan lookup
- `UNIQUE INDEX (qr_code)` - scan lookup
- `UNIQUE INDEX (barcode)` - scan lookup

**Constraints:**

- `FOREIGN KEY (space_id) REFERENCES Space(id) ON DELETE CASCADE`
- `FOREIGN KEY (parent_location_id) REFERENCES Location(id) ON DELETE CASCADE`
- `FOREIGN KEY (created_by_id) REFERENCES Member(id) ON DELETE RESTRICT`
- `FOREIGN KEY (updated_by_id) REFERENCES Member(id) ON DELETE SET NULL`

---

#### 4. Item

Physical items stored in locations.

| Field            | Type          | Constraints                         | Description           |
| ---------------- | ------------- | ----------------------------------- | --------------------- |
| id               | STRING (CUID) | PRIMARY KEY                         | Unique identifier     |
| space_id         | STRING        | FOREIGN KEY → Space.id, NOT NULL    | Parent space          |
| name             | STRING        | NOT NULL                            | Item name             |
| description      | STRING        | NULLABLE                            | Item description      |
| quantity         | INTEGER       | NOT NULL, DEFAULT 1                 | Item quantity         |
| image_url        | STRING        | NULLABLE                            | Optional image URL    |
| location_id      | STRING        | FOREIGN KEY → Location.id, NOT NULL | Current location      |
| nfc_tag          | STRING        | UNIQUE, NULLABLE                    | NFC identifier        |
| qr_code          | STRING        | UNIQUE, NULLABLE                    | QR code identifier    |
| barcode          | STRING        | UNIQUE, NULLABLE                    | Barcode identifier    |
| created_by_id    | STRING        | FOREIGN KEY → Member.id, NOT NULL   | Creator               |
| updated_by_id    | STRING        | FOREIGN KEY → Member.id, NULLABLE   | Last updater          |
| last_moved_by_id | STRING        | FOREIGN KEY → Member.id, NULLABLE   | Last mover            |
| created_at       | TIMESTAMP     | NOT NULL, DEFAULT NOW               | Creation timestamp    |
| updated_at       | TIMESTAMP     | NOT NULL, AUTO                      | Last update timestamp |

**Indexes:**

- `PRIMARY KEY (id)`
- `INDEX (space_id)` - multi-tenant queries
- `INDEX (location_id)` - location queries
- `INDEX (name)` - fuzzy search
- `UNIQUE INDEX (nfc_tag)` - scan lookup
- `UNIQUE INDEX (qr_code)` - scan lookup
- `UNIQUE INDEX (barcode)` - scan lookup

**Constraints:**

- `FOREIGN KEY (space_id) REFERENCES Space(id) ON DELETE CASCADE`
- `FOREIGN KEY (location_id) REFERENCES Location(id) ON DELETE RESTRICT`
- `FOREIGN KEY (created_by_id) REFERENCES Member(id) ON DELETE RESTRICT`
- `FOREIGN KEY (updated_by_id) REFERENCES Member(id) ON DELETE SET NULL`
- `FOREIGN KEY (last_moved_by_id) REFERENCES Member(id) ON DELETE SET NULL`

---

#### 5. Tag

Labels for categorizing items. Unique per space.

| Field         | Type          | Constraints                       | Description                      |
| ------------- | ------------- | --------------------------------- | -------------------------------- |
| id            | STRING (CUID) | PRIMARY KEY                       | Unique identifier                |
| space_id      | STRING        | FOREIGN KEY → Space.id, NOT NULL  | Parent space                     |
| name          | STRING        | NOT NULL                          | Tag name                         |
| color         | STRING        | NULLABLE                          | Hex color code (e.g., "#FF5733") |
| created_by_id | STRING        | FOREIGN KEY → Member.id, NOT NULL | Creator                          |
| created_at    | TIMESTAMP     | NOT NULL, DEFAULT NOW             | Creation timestamp               |
| updated_at    | TIMESTAMP     | NOT NULL, AUTO                    | Last update timestamp            |

**Indexes:**

- `PRIMARY KEY (id)`
- `INDEX (space_id)` - multi-tenant queries
- `UNIQUE INDEX (space_id, name)` - unique tag names per space

**Constraints:**

- `FOREIGN KEY (space_id) REFERENCES Space(id) ON DELETE CASCADE`
- `FOREIGN KEY (created_by_id) REFERENCES Member(id) ON DELETE RESTRICT`

---

#### 6. ItemTag

Many-to-many join table for Item ↔ Tag relationships.

| Field      | Type      | Constraints                     | Description          |
| ---------- | --------- | ------------------------------- | -------------------- |
| item_id    | STRING    | FOREIGN KEY → Item.id, NOT NULL | Item reference       |
| tag_id     | STRING    | FOREIGN KEY → Tag.id, NOT NULL  | Tag reference        |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW           | Assignment timestamp |

**Indexes:**

- `PRIMARY KEY (item_id, tag_id)` - composite primary key
- `INDEX (tag_id)` - reverse lookup (items by tag)

**Constraints:**

- `FOREIGN KEY (item_id) REFERENCES Item(id) ON DELETE CASCADE`
- `FOREIGN KEY (tag_id) REFERENCES Tag(id) ON DELETE CASCADE`

---

#### 7. MovementHistory

Audit trail for item location changes.

| Field            | Type          | Constraints                         | Description                         |
| ---------------- | ------------- | ----------------------------------- | ----------------------------------- |
| id               | STRING (CUID) | PRIMARY KEY                         | Unique identifier                   |
| item_id          | STRING        | FOREIGN KEY → Item.id, NOT NULL     | Item moved                          |
| from_location_id | STRING        | NULLABLE                            | Previous location (null = new item) |
| to_location_id   | STRING        | FOREIGN KEY → Location.id, NOT NULL | New location                        |
| moved_by_id      | STRING        | FOREIGN KEY → Member.id, NOT NULL   | Member who moved                    |
| notes            | STRING        | NULLABLE                            | Optional notes                      |
| moved_at         | TIMESTAMP     | NOT NULL, DEFAULT NOW               | Movement timestamp                  |

**Indexes:**

- `PRIMARY KEY (id)`
- `INDEX (item_id)` - item history queries
- `INDEX (moved_at)` - chronological queries

**Constraints:**

- `FOREIGN KEY (item_id) REFERENCES Item(id) ON DELETE CASCADE`
- `FOREIGN KEY (to_location_id) REFERENCES Location(id) ON DELETE RESTRICT`
- `FOREIGN KEY (moved_by_id) REFERENCES Member(id) ON DELETE RESTRICT`

---

## RESTful API Specification

### Base URL

```
http://localhost:4000/api/v1
```

### Common Response Patterns

#### Success Response

```json
{
  "success": true,
  "data": {
    /* entity or array */
  }
}
```

#### Error Response

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message"
  }
}
```

---

### 1. Space APIs

#### POST /spaces

Create a new space.

**Request Body:**

```json
{
  "name": "My Home",
  "description": "Main household inventory"
}
```

**Response:** `201 Created`

```json
{
  "success": true,
  "data": {
    "id": "clx123abc",
    "name": "My Home",
    "description": "Main household inventory",
    "created_at": "2025-12-24T00:00:00.000Z",
    "updated_at": "2025-12-24T00:00:00.000Z"
  }
}
```

---

#### GET /spaces

List all spaces.

**Query Parameters:**

- `limit` (optional): Number of results (default: 50)
- `offset` (optional): Pagination offset (default: 0)

**Response:** `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": "clx123abc",
      "name": "My Home",
      "description": "Main household inventory",
      "created_at": "2025-12-24T00:00:00.000Z",
      "updated_at": "2025-12-24T00:00:00.000Z"
    }
  ]
}
```

---

#### GET /spaces/:spaceId

Get a single space by ID.

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "clx123abc",
    "name": "My Home",
    "description": "Main household inventory",
    "created_at": "2025-12-24T00:00:00.000Z",
    "updated_at": "2025-12-24T00:00:00.000Z"
  }
}
```

---

#### PATCH /spaces/:spaceId

Update a space.

**Request Body:**

```json
{
  "name": "Updated Home",
  "description": "New description"
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "clx123abc",
    "name": "Updated Home",
    "description": "New description",
    "updated_at": "2025-12-24T01:00:00.000Z"
  }
}
```

---

#### DELETE /spaces/:spaceId

Delete a space and all associated data.

**Response:** `204 No Content`

---

### 2. Member APIs

#### POST /spaces/:spaceId/members

Create a new member in a space.

**Request Body:**

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "role": "MEMBER"
}
```

**Response:** `201 Created`

```json
{
  "success": true,
  "data": {
    "id": "clx456def",
    "space_id": "clx123abc",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "MEMBER",
    "created_at": "2025-12-24T00:00:00.000Z",
    "updated_at": "2025-12-24T00:00:00.000Z"
  }
}
```

---

#### GET /spaces/:spaceId/members

List all members in a space.

**Response:** `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": "clx456def",
      "space_id": "clx123abc",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "MEMBER",
      "created_at": "2025-12-24T00:00:00.000Z"
    }
  ]
}
```

---

#### PATCH /spaces/:spaceId/members/:memberId

Update a member.

**Request Body:**

```json
{
  "name": "John Updated",
  "role": "ADMIN"
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "clx456def",
    "name": "John Updated",
    "role": "ADMIN",
    "updated_at": "2025-12-24T01:00:00.000Z"
  }
}
```

---

#### DELETE /spaces/:spaceId/members/:memberId

Remove a member from a space.

**Response:** `204 No Content`

---

### 3. Location APIs

#### POST /spaces/:spaceId/locations

Create a new location.

**Request Body:**

```json
{
  "name": "Kitchen",
  "location_type": "ROOM",
  "parent_location_id": "clx789ghi",
  "nfc_tag": "NFC-001",
  "qr_code": "QR-KITCHEN-001",
  "created_by_id": "clx456def"
}
```

**Response:** `201 Created`

```json
{
  "success": true,
  "data": {
    "id": "clx789ghi",
    "space_id": "clx123abc",
    "name": "Kitchen",
    "location_type": "ROOM",
    "parent_location_id": "clx789ghi",
    "nfc_tag": "NFC-001",
    "qr_code": "QR-KITCHEN-001",
    "barcode": null,
    "created_by_id": "clx456def",
    "created_at": "2025-12-24T00:00:00.000Z",
    "updated_at": "2025-12-24T00:00:00.000Z"
  }
}
```

---

#### GET /spaces/:spaceId/locations

List all locations in a space.

**Query Parameters:**

- `parent_location_id` (optional): Filter by parent location
- `location_type` (optional): Filter by type

**Response:** `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": "clx789ghi",
      "name": "Kitchen",
      "location_type": "ROOM",
      "parent_location_id": null,
      "path": "Home / Kitchen",
      "created_at": "2025-12-24T00:00:00.000Z"
    }
  ]
}
```

---

#### GET /spaces/:spaceId/locations/:locationId

Get a single location with full hierarchy path.

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "clx789ghi",
    "name": "Kitchen",
    "location_type": "ROOM",
    "parent_location_id": "clx111aaa",
    "path": "Home / First Floor / Kitchen",
    "nfc_tag": "NFC-001",
    "created_by": {
      "id": "clx456def",
      "name": "John Doe"
    },
    "created_at": "2025-12-24T00:00:00.000Z"
  }
}
```

---

#### GET /spaces/:spaceId/locations/scan/:identifier

Fetch location by NFC tag, QR code, or barcode.

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "clx789ghi",
    "name": "Kitchen",
    "path": "Home / First Floor / Kitchen",
    "location_type": "ROOM"
  }
}
```

---

#### PATCH /spaces/:spaceId/locations/:locationId

Update a location.

**Request Body:**

```json
{
  "name": "Main Kitchen",
  "parent_location_id": "clx222bbb",
  "updated_by_id": "clx456def"
}
```

**Response:** `200 OK`

---

#### DELETE /spaces/:spaceId/locations/:locationId

Delete a location (cascades to child locations).

**Response:** `204 No Content`

---

### 4. Item APIs

#### POST /spaces/:spaceId/items

Create a new item.

**Request Body:**

```json
{
  "name": "Coffee Maker",
  "description": "Breville espresso machine",
  "quantity": 1,
  "image_url": "https://example.com/image.jpg",
  "location_id": "clx789ghi",
  "nfc_tag": "NFC-ITEM-001",
  "barcode": "1234567890123",
  "created_by_id": "clx456def"
}
```

**Response:** `201 Created`

```json
{
  "success": true,
  "data": {
    "id": "clxABCxyz",
    "space_id": "clx123abc",
    "name": "Coffee Maker",
    "description": "Breville espresso machine",
    "quantity": 1,
    "image_url": "https://example.com/image.jpg",
    "location_id": "clx789ghi",
    "nfc_tag": "NFC-ITEM-001",
    "barcode": "1234567890123",
    "created_by_id": "clx456def",
    "created_at": "2025-12-24T00:00:00.000Z"
  }
}
```

---

#### GET /spaces/:spaceId/items

List all items in a space.

**Query Parameters:**

- `location_id` (optional): Filter by location
- `tag_id` (optional): Filter by tag
- `search` (optional): Fuzzy search by name
- `limit` (default: 50)
- `offset` (default: 0)

**Response:** `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": "clxABCxyz",
      "name": "Coffee Maker",
      "quantity": 1,
      "location": {
        "id": "clx789ghi",
        "name": "Kitchen",
        "path": "Home / First Floor / Kitchen"
      },
      "tags": [{ "id": "clxTAG001", "name": "Appliances" }],
      "created_at": "2025-12-24T00:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 150,
    "limit": 50,
    "offset": 0
  }
}
```

---

#### GET /spaces/:spaceId/items/:itemId

Get a single item with full details.

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "clxABCxyz",
    "name": "Coffee Maker",
    "description": "Breville espresso machine",
    "quantity": 1,
    "image_url": "https://example.com/image.jpg",
    "location": {
      "id": "clx789ghi",
      "name": "Kitchen",
      "path": "Home / First Floor / Kitchen"
    },
    "tags": [{ "id": "clxTAG001", "name": "Appliances", "color": "#FF5733" }],
    "created_by": {
      "id": "clx456def",
      "name": "John Doe"
    },
    "created_at": "2025-12-24T00:00:00.000Z",
    "updated_at": "2025-12-24T00:00:00.000Z"
  }
}
```

---

#### GET /spaces/:spaceId/items/scan/:identifier

Fetch item by NFC tag, QR code, or barcode.

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "clxABCxyz",
    "name": "Coffee Maker",
    "location": {
      "path": "Home / First Floor / Kitchen"
    }
  }
}
```

---

#### PATCH /spaces/:spaceId/items/:itemId

Update an item.

**Request Body:**

```json
{
  "name": "Updated Coffee Maker",
  "quantity": 2,
  "updated_by_id": "clx456def"
}
```

**Response:** `200 OK`

---

#### POST /spaces/:spaceId/items/:itemId/move

Move an item to a different location.

**Request Body:**

```json
{
  "to_location_id": "clx999zzz",
  "moved_by_id": "clx456def",
  "notes": "Moved to storage"
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "clxABCxyz",
    "location_id": "clx999zzz",
    "updated_at": "2025-12-24T01:00:00.000Z"
  }
}
```

**Side Effect:** Creates a MovementHistory entry.

---

#### DELETE /spaces/:spaceId/items/:itemId

Delete an item.

**Response:** `204 No Content`

---

### 5. Tag APIs

#### POST /spaces/:spaceId/tags

Create a new tag.

**Request Body:**

```json
{
  "name": "Appliances",
  "color": "#FF5733",
  "created_by_id": "clx456def"
}
```

**Response:** `201 Created`

```json
{
  "success": true,
  "data": {
    "id": "clxTAG001",
    "space_id": "clx123abc",
    "name": "Appliances",
    "color": "#FF5733",
    "created_by_id": "clx456def",
    "created_at": "2025-12-24T00:00:00.000Z"
  }
}
```

---

#### GET /spaces/:spaceId/tags

List all tags in a space.

**Response:** `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": "clxTAG001",
      "name": "Appliances",
      "color": "#FF5733",
      "item_count": 5,
      "created_at": "2025-12-24T00:00:00.000Z"
    }
  ]
}
```

---

#### DELETE /spaces/:spaceId/tags/:tagId

Delete a tag (cascades to ItemTag entries).

**Response:** `204 No Content`

---

### 6. ItemTag APIs

#### POST /spaces/:spaceId/items/:itemId/tags

Assign a tag to an item.

**Request Body:**

```json
{
  "tag_id": "clxTAG001"
}
```

**Response:** `201 Created`

```json
{
  "success": true,
  "data": {
    "item_id": "clxABCxyz",
    "tag_id": "clxTAG001",
    "created_at": "2025-12-24T00:00:00.000Z"
  }
}
```

---

#### DELETE /spaces/:spaceId/items/:itemId/tags/:tagId

Remove a tag from an item.

**Response:** `204 No Content`

---

### 7. MovementHistory APIs

#### GET /spaces/:spaceId/items/:itemId/movements

Get movement history for an item.

**Response:** `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": "clxMOV001",
      "from_location": {
        "id": "clx789ghi",
        "name": "Kitchen",
        "path": "Home / First Floor / Kitchen"
      },
      "to_location": {
        "id": "clx999zzz",
        "name": "Storage",
        "path": "Home / Basement / Storage"
      },
      "moved_by": {
        "id": "clx456def",
        "name": "John Doe"
      },
      "notes": "Moved to storage",
      "moved_at": "2025-12-24T01:00:00.000Z"
    }
  ]
}
```

---

#### GET /spaces/:spaceId/movements

Get all recent movements in a space.

**Query Parameters:**

- `limit` (default: 50)
- `offset` (default: 0)

**Response:** `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": "clxMOV001",
      "item": {
        "id": "clxABCxyz",
        "name": "Coffee Maker"
      },
      "to_location": {
        "path": "Home / Basement / Storage"
      },
      "moved_by": {
        "name": "John Doe"
      },
      "moved_at": "2025-12-24T01:00:00.000Z"
    }
  ]
}
```

---

### 8. Search API

#### GET /spaces/:spaceId/search

Fuzzy search across items and locations.

**Query Parameters:**

- `q` (required): Search query
- `type` (optional): Filter by `item` or `location`
- `limit` (default: 50)

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "clxABCxyz",
        "name": "Coffee Maker",
        "location_path": "Home / First Floor / Kitchen",
        "tags": ["Appliances", "Kitchen"],
        "score": 0.95
      }
    ],
    "locations": [
      {
        "id": "clx789ghi",
        "name": "Kitchen",
        "path": "Home / First Floor / Kitchen",
        "score": 0.88
      }
    ]
  }
}
```

**Search Algorithm:**

- Full-text search on `name`, `description` fields
- Tag name matching
- Location path matching
- Returns results sorted by relevance score
- Uses PostgreSQL `tsvector` or trigram similarity for fuzzy matching

---

## Database Schema (PostgreSQL)

### Table Creation Order

Due to foreign key dependencies, create tables in this order:

1. `spaces`
2. `members`
3. `locations`
4. `tags`
5. `items`
6. `item_tags`
7. `movement_history`

### Performance Optimizations

#### Indexes Summary

```sql
-- Spaces
CREATE INDEX idx_spaces_name ON spaces(name);

-- Members
CREATE INDEX idx_members_space_id ON members(space_id);
CREATE UNIQUE INDEX idx_members_email ON members(email);
CREATE INDEX idx_members_space_name ON members(space_id, name);

-- Locations
CREATE INDEX idx_locations_space_id ON locations(space_id);
CREATE INDEX idx_locations_parent_id ON locations(parent_location_id);
CREATE INDEX idx_locations_name ON locations(name);
CREATE UNIQUE INDEX idx_locations_nfc ON locations(nfc_tag) WHERE nfc_tag IS NOT NULL;
CREATE UNIQUE INDEX idx_locations_qr ON locations(qr_code) WHERE qr_code IS NOT NULL;
CREATE UNIQUE INDEX idx_locations_barcode ON locations(barcode) WHERE barcode IS NOT NULL;

-- Items
CREATE INDEX idx_items_space_id ON items(space_id);
CREATE INDEX idx_items_location_id ON items(location_id);
CREATE INDEX idx_items_name ON items(name);
CREATE UNIQUE INDEX idx_items_nfc ON items(nfc_tag) WHERE nfc_tag IS NOT NULL;
CREATE UNIQUE INDEX idx_items_qr ON items(qr_code) WHERE qr_code IS NOT NULL;
CREATE UNIQUE INDEX idx_items_barcode ON items(barcode) WHERE barcode IS NOT NULL;

-- Tags
CREATE INDEX idx_tags_space_id ON tags(space_id);
CREATE UNIQUE INDEX idx_tags_space_name ON tags(space_id, name);

-- ItemTags
CREATE INDEX idx_item_tags_tag_id ON item_tags(tag_id);

-- MovementHistory
CREATE INDEX idx_movements_item_id ON movement_history(item_id);
CREATE INDEX idx_movements_moved_at ON movement_history(moved_at DESC);
```

#### Full-Text Search Setup

```sql
-- Add tsvector columns for search
ALTER TABLE items ADD COLUMN search_vector tsvector;
ALTER TABLE locations ADD COLUMN search_vector tsvector;

-- Create GIN indexes for full-text search
CREATE INDEX idx_items_search ON items USING GIN(search_vector);
CREATE INDEX idx_locations_search ON locations USING GIN(search_vector);

-- Trigger to auto-update search vectors
CREATE TRIGGER items_search_update
BEFORE INSERT OR UPDATE ON items
FOR EACH ROW EXECUTE FUNCTION
tsvector_update_trigger(search_vector, 'pg_catalog.english', name, description);

CREATE TRIGGER locations_search_update
BEFORE INSERT OR UPDATE ON locations
FOR EACH ROW EXECUTE FUNCTION
tsvector_update_trigger(search_vector, 'pg_catalog.english', name);
```

---

## Implementation Notes

### Multi-Tenant Isolation

All queries MUST include `space_id` filter to prevent cross-space data leakage.

Example:

```sql
SELECT * FROM items
WHERE space_id = ? AND id = ?;
```

### Hierarchical Location Paths

Use recursive CTEs to build full paths:

```sql
WITH RECURSIVE location_path AS (
  SELECT id, name, parent_location_id, name as path
  FROM locations
  WHERE id = ?

  UNION ALL

  SELECT l.id, l.name, l.parent_location_id,
         l.name || ' / ' || lp.path
  FROM locations l
  INNER JOIN location_path lp ON l.id = lp.parent_location_id
)
SELECT path FROM location_path WHERE parent_location_id IS NULL;
```

### Movement History Automation

When updating `item.location_id`, automatically create a `MovementHistory` entry in a database transaction.

### Identifier Uniqueness

NFC tags, QR codes, and barcodes must be globally unique across all spaces to support universal scanning.

### Future Authentication Extension Points

- `Member.email` is unique and ready for JWT-based authentication
- Add `Member.password_hash` field when implementing auth
- Add middleware to extract `member_id` from JWT token
- All `created_by_id`, `updated_by_id`, `moved_by_id` fields already in place

---

## Testing Requirements

### Unit Tests

- CRUD operations for each entity
- Search functionality with various query patterns
- Location hierarchy path generation
- Movement history creation on item moves

### Integration Tests

- Multi-space data isolation
- Cascade delete behavior
- Unique constraint violations (duplicate identifiers)
- Fuzzy search performance with 10,000+ items

### Performance Benchmarks

- Search query response time < 200ms for 10,000 items
- List items with pagination < 100ms
- Recursive location path query < 50ms

---

## Technology Stack

### Backend

- **Runtime:** Node.js v20+ with TypeScript
- **Framework:** Fastify (high-performance HTTP server)
- **ORM:** Prisma 7.x
- **Database:** PostgreSQL 15+
- **Validation:** Zod schemas

### Database

- **Primary:** PostgreSQL 15+
- **Connection Pooling:** PgBouncer (for production)
- **Migrations:** Prisma Migrate

### Development Tools

- **Package Manager:** npm (pnpm workspace)
- **Testing:** Jest or Vitest
- **Linting:** ESLint with TypeScript rules
- **Formatting:** Prettier

---

## Deployment Considerations

### Database

- Use connection pooling for production (max connections: 20)
- Enable query logging for development
- Regular backups with point-in-time recovery
- Vacuum and analyze weekly for optimal performance

### API Server

- Run behind reverse proxy (nginx/Caddy)
- Enable CORS for mobile app integration
- Rate limiting per IP address
- Request logging with structured JSON

### Monitoring

- Database query performance metrics
- API endpoint response times
- Error rate tracking
- Disk usage monitoring for image storage

---

## Future Enhancements (Post-V1)

1. **Authentication & Authorization**

   - JWT-based authentication
   - Role-based access control (ADMIN, MEMBER, VIEWER)
   - Invite system for adding members

2. **Advanced Features**

   - Bulk item import/export (CSV)
   - Low-stock alerts (when quantity < threshold)
   - Expiration date tracking
   - Photo uploads (S3/CloudFlare R2)
   - Real-time notifications (WebSocket)

3. **Performance**

   - Caching layer (Redis)
   - Database read replicas
   - CDN for image assets

4. **Analytics**
   - Most frequently moved items
   - Location utilization metrics
   - Tag popularity statistics

---

## Glossary

- **Space:** Multi-tenant boundary (e.g., "Home", "Lab")
- **Member:** User within a space (no authentication in V1)
- **Location:** Physical place where items are stored
- **Item:** Physical object being tracked
- **Tag:** Category/label for items
- **Identifier:** NFC tag, QR code, or barcode for scanning
- **Movement History:** Audit trail of item location changes
- **Location Path:** Full hierarchical path (e.g., "Home / Floor 1 / Kitchen")

---

## Contact & Contributions

For questions or suggestions about this specification:

- Create an issue in the GitHub repository
- Tag with `tech-spec` label

---

**End of Technical Specification**
