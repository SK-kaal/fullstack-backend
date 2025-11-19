# REST API Reference

## GET /lessons
Returns all lessons sorted alphabetically by subject.

### Example
```
GET https://your-server.example.com/lessons
```

## GET /search?q=
Full-text search across `subject`, `location`, `price`, and `spaces`. Results stream directly from MongoDB using regex-based filters.

```
GET /search?q=math
```

## POST /orders
Create a new order. Body must include `name`, `phone`, and `items` (each with `classId` and `quantity`).

```
POST /orders
Content-Type: application/json
{
  "name": "Ava Clark",
  "phone": "07123456789",
  "items": [
    { "classId": "605cfd...", "quantity": 2 }
  ]
}
```

## PUT /lessons/:id
Update any combination of lesson fields. Primary use case is adjusting `spaces` after checkout.

```
PUT /lessons/605cfd...
Content-Type: application/json
{
  "spaces": 3
}
```

## GET /images/<file>
Serves lesson imagery from the `public/images` directory. Returns JSON 404 if the file is missing.
