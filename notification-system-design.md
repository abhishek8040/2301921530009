# Stage 1

# Notification System Design

The objective of this notification system is to provide students with instant updates related to placements, results and campus events. The APIs below are designed so that the frontend can easily retrieve, display and update notification information.

## Features

The system should support the following operations:

- View all notifications
- View unread notifications
- Mark a notification as read
- Mark all notifications as read
- Filter notifications based on notification type
- Receive notifications in real time

---

## API 1 - Fetch Notifications

**Endpoint**

```
GET /api/notifications
```

**Headers**

```
Authorization: Bearer <token>
```

**Query Parameters**

| Parameter | Description |
| ---------- | ----------- |
| page | Page number |
| limit | Notifications per page |
| notificationType | Event / Result / Placement |

### Example Request

```
GET /api/notifications?page=1&limit=10&notificationType=Placement
```

### Response

```json
{
  "notifications": [
    {
      "id": "1",
      "type": "Placement",
      "message": "Microsoft Hiring Drive",
      "isRead": false,
      "createdAt": "2026-04-22T17:51:18Z"
    }
  ],
  "page": 1,
  "limit": 10,
  "total": 50
}
```

This API returns notifications with optional pagination and filtering support.

---

## API 2 - Fetch Unread Notifications

**Endpoint**

```
GET /api/notifications/unread
```

**Headers**

```
Authorization: Bearer <token>
```

### Response

```json
{
  "notifications": [
    {
      "id": "15",
      "type": "Result",
      "message": "Semester Result Published",
      "isRead": false
    }
  ]
}
```

This endpoint is mainly used for showing unread notification badges.

---

## API 3 - Mark Notification as Read

**Endpoint**

```
PUT /api/notifications/{notificationId}/read
```

### Request Body

```json
{
    "isRead": true
}
```

### Response

```json
{
    "message":"Notification updated successfully."
}
```

---

## API 4 - Mark All Notifications as Read

**Endpoint**

```
PUT /api/notifications/read-all
```

### Response

```json
{
    "message":"All notifications marked as read."
}
```

---

## API 5 - Create Notification

This endpoint can be used by the Placement Cell or HR.

**Endpoint**

```
POST /api/notifications
```

### Request

```json
{
    "studentIds":[101,102,103],
    "type":"Placement",
    "message":"Google Hiring Drive starts tomorrow."
}
```

### Response

```json
{
    "message":"Notification created successfully."
}
```

---

# Real-Time Notification

Instead of repeatedly requesting notifications from the server, I would use **WebSockets**.

### Workflow

1. User logs into the application.
2. A WebSocket connection is established.
3. Whenever a new notification is generated, the server pushes it through the socket.
4. The notification list updates automatically.

### Why WebSockets?

- Instant delivery
- Lower latency
- Less database polling
- Better user experience

---

# Stage 2

## Database Selection

I would choose **PostgreSQL** as the persistent storage because the notification data is structured and relationships between students and notifications are straightforward. PostgreSQL also provides ACID compliance, indexing, transactions and good query optimization, making it suitable for this application.

---

## Database Schema

### Students Table

| Column | Type |
|---------|------|
| student_id | BIGINT (PK) |
| name | VARCHAR |
| email | VARCHAR |
| department | VARCHAR |

---

### Notifications Table

| Column | Type |
|---------|------|
| notification_id | UUID (PK) |
| student_id | BIGINT (FK) |
| notification_type | ENUM(Event, Result, Placement) |
| message | TEXT |
| is_read | BOOLEAN |
| created_at | TIMESTAMP |

---

## Why PostgreSQL?

- Strong consistency
- Supports transactions
- Easy joins
- Indexing support
- Handles large datasets efficiently

---

## Possible Challenges

As the number of notifications increases, the following issues may arise:

- Slow search queries
- Increased storage usage
- Longer response time
- Higher database load

---

## Possible Solutions

- Create indexes on frequently searched columns.
- Use pagination instead of fetching everything.
- Archive older notifications.
- Cache frequently accessed notifications using Redis.
- Partition large tables based on creation date.

---

## Sample SQL Queries

### Fetch Notifications

```sql
SELECT *
FROM notifications
WHERE student_id = ?
ORDER BY created_at DESC
LIMIT 10 OFFSET 0;
```

---

### Fetch Unread Notifications

```sql
SELECT *
FROM notifications
WHERE student_id = ?
AND is_read = false
ORDER BY created_at DESC;
```

---

### Mark Notification as Read

```sql
UPDATE notifications
SET is_read = true
WHERE notification_id = ?;
```

---

### Mark All Notifications as Read

```sql
UPDATE notifications
SET is_read = true
WHERE student_id = ?;
```

---

### Create Notification

```sql
INSERT INTO notifications
(student_id, notification_type, message, is_read, created_at)
VALUES
(101,'Placement','Google Hiring Drive',false,NOW());
```

# Stage 3

## Analysis of the Existing Query

```sql
SELECT *
FROM notifications
WHERE studentID = 1042
AND isRead = false
ORDER BY createdAt ASC;
```

### Is the query correct?

The query is logically correct because it retrieves all unread notifications of a particular student. However, as the number of records grows, its performance will gradually decrease.

### Why is it slow?

The database currently contains around **50,000 students** and nearly **5 million notifications**. If there are no suitable indexes, the database has to scan a large number of rows before finding the matching records.

Sorting the results using `ORDER BY createdAt` also becomes expensive when many notifications belong to the same student.

### Improvements

Instead of relying only on individual indexes, I would create a **composite index**.

```sql
CREATE INDEX idx_notifications_student_read_created
ON notifications(student_id, is_read, created_at);
```

This allows the database to:

- Filter by student_id
- Filter unread notifications
- Return records already ordered by created_at

without performing an additional sort.

### Computational Cost

Without indexes:

```
Time Complexity ≈ O(n)
```

The database may need to scan the entire table.

With the composite index:

```
Time Complexity ≈ O(log n)
```

Only the relevant portion of the index is searched.

---

## Should We Add Indexes on Every Column?

No.

Adding indexes to every column is generally not a good practice.

### Reasons

- Extra storage consumption
- Slower INSERT operations
- Slower UPDATE operations
- Slower DELETE operations
- Increased maintenance cost

Indexes should only be created on columns that are frequently used for:

- WHERE clause
- JOIN
- ORDER BY
- GROUP BY

---

## Query to Find Students Who Received Placement Notifications in the Last 7 Days

```sql
SELECT DISTINCT student_id
FROM notifications
WHERE notification_type = 'Placement'
AND created_at >= NOW() - INTERVAL '7 days';
```

---

## Additional Optimization Ideas

As the notification table keeps growing, I would also consider:

- Table partitioning based on creation date.
- Archiving old notifications.
- Redis caching for recently accessed notifications.
- Pagination instead of returning all records.

---

# Stage 4

## Current Problem

Currently, notifications are fetched from the database every time the user opens or refreshes the page.

This results in:

- High database traffic
- Increased response time
- Poor user experience
- Unnecessary repeated queries

---

## Solution 1 - Redis Cache

Instead of directly querying the database every time, frequently accessed notifications can be stored in Redis.

### Workflow

1. User requests notifications.
2. Check Redis.
3. If data exists, return immediately.
4. Otherwise fetch from PostgreSQL.
5. Store the result in Redis for future requests.

### Advantages

- Extremely fast response
- Lower database load
- Better scalability

### Trade-off

Cache invalidation must be handled whenever notifications are updated.

---

## Solution 2 - WebSockets

Rather than requesting notifications repeatedly, the server pushes new notifications whenever they are created.

### Advantages

- Instant updates
- Better user experience
- Eliminates continuous polling

### Trade-off

Maintaining thousands of active socket connections consumes server memory.

---

## Solution 3 - Pagination

Never return all notifications in one request.

Instead:

```
GET /notifications?page=1&limit=10
```

Advantages:

- Smaller payload
- Faster queries
- Lower memory usage

Trade-off:

Multiple API requests are needed to navigate through older notifications.

---

## Solution 4 - Background Caching

Popular notifications can be refreshed periodically using scheduled background jobs instead of computing them on every request.

### Advantages

- Reduces repeated database work.
- Faster response time.

Trade-off

Slight delay before cache reflects the newest data.

---

## Final Recommendation

I would combine all the above approaches:

- PostgreSQL for persistent storage.
- Redis for caching.
- WebSockets for real-time delivery.
- Pagination for API responses.
- Database indexing and partitioning for long-term scalability.

This combination provides better performance while keeping the system scalable as the number of students and notifications continues to increase.

# Stage 5

## Problems with the Current Implementation

```text
function notify_all(student_ids, message):
    for student_id in student_ids:
        send_email(student_id, message)
        save_to_db(student_id, message)
        push_to_app(student_id, message)
```

Although the above implementation is simple, it has several drawbacks.

### Issues

- All operations happen sequentially, making the process slow.
- If sending an email fails, the remaining operations may not execute correctly.
- The entire process depends on external email service response time.
- A failure in one step can interrupt the complete notification flow.
- It is difficult to retry only the failed operations.

---

## What if Email Fails for 200 Students?

If email delivery fails midway, those students should not lose their notifications.

Instead of restarting the entire process, failed email requests should be retried separately.

The notification should already be available inside the application even if email delivery is delayed.

---

## Improved Design

Instead of performing everything synchronously, I would use a message queue.

### Workflow

```
Admin Clicks Notify All
          |
          V
 Save Notification in Database
          |
          V
 Publish Job to Queue
          |
     --------------------
     |                  |
     V                  V
 Email Worker      Push Notification Worker
```

The API only saves the notification and places a job into the queue.

Background workers handle email delivery and real-time notifications independently.

---

## Advantages

- Faster response to the user.
- Independent retry mechanism.
- Better fault tolerance.
- Easy to scale by adding more workers.

---

## Revised Pseudocode

```text
function notifyAll(studentIds, message):

    notificationId = saveNotification(message)

    for each studentId in studentIds:

        saveStudentNotification(studentId, notificationId)

        publishEmailJob(studentId, notificationId)

        publishPushNotificationJob(studentId, notificationId)

    return "Notification queued successfully"
```

---

### Email Worker

```text
while(true):

    job = emailQueue.get()

    try:
        sendEmail(job)

    catch(Exception):
        retry(job)
```

---

### Push Notification Worker

```text
while(true):

    job = pushQueue.get()

    pushNotification(job)
```

---

## Should Saving to DB and Sending Email Happen Together?

No.

Saving to the database is the primary operation because notifications must always be available inside the application.

Sending emails is an external service and should happen asynchronously.

Keeping them separate improves reliability and avoids losing notifications when the email provider is temporarily unavailable.

---

# Stage 6

## Approach

The requirement is to display the Top 10 unread notifications based on:

1. Notification priority.
2. Recency.

Priority order:

```
Placement > Result > Event
```

Each notification receives a priority score.

Example:

| Notification Type | Weight |
|-------------------|--------|
| Placement | 3 |
| Result | 2 |
| Event | 1 |

Notifications are first sorted using the weight and then by timestamp in descending order.

Finally, the first 10 notifications are returned.

---

## Time Complexity

Fetching notifications:

```
O(n)
```

Sorting:

```
O(n log n)
```

Selecting Top 10:

```
O(10)
```

Overall complexity:

```
O(n log n)
```

---

## Improving Performance

Sorting the complete list every time is inefficient when new notifications keep arriving.

Instead, I would maintain a **Priority Queue (Max Heap)**.

Whenever a new notification arrives:

- Calculate its priority.
- Insert it into the heap.
- If heap size exceeds 10, remove the lowest-priority notification.

This ensures that the application always keeps only the best 10 notifications.

Insertion complexity:

```
O(log 10)
```

which is effectively constant time.

---

## Why Priority Queue?

- Faster updates.
- No need to sort the complete list repeatedly.
- Efficient for continuously arriving notifications.
- Lower memory usage since only Top 10 are maintained.

---

## Implementation Language

The solution is implemented in **Java**.

The program:

- Fetches notifications from the provided API.
- Assigns weights based on notification type.
- Sorts using priority and timestamp.
- Displays the Top 10 notifications.
- Uses the Logging Middleware to record important execution steps.