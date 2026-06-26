import express from "express";
import cors from "cors";

import { Log } from "../logging-middleware/logger.js";

const app = express();
const port = Number.parseInt(process.env.PORT || "3000", 10);
const loggingToken = process.env.LOGGING_TOKEN || process.env.VITE_LOGGING_TOKEN || "";

app.use(cors());
app.use(express.json());

const notifications = [
  {
    id: "1",
    title: "Placement Drive",
    message: "Microsoft hiring drive opens tomorrow at 10 AM.",
    type: "Placement",
    isRead: false,
    createdAt: "2026-06-26T08:00:00Z",
  },
  {
    id: "2",
    title: "Semester Results",
    message: "Semester results have been published.",
    type: "Result",
    isRead: false,
    createdAt: "2026-06-25T15:30:00Z",
  },
  {
    id: "3",
    title: "Tech Talk",
    message: "Campus tech talk starts in the auditorium at 5 PM.",
    type: "Event",
    isRead: true,
    createdAt: "2026-06-24T12:00:00Z",
  },
  {
    id: "4",
    title: "Placement Update",
    message: "Amazon interview shortlist released.",
    type: "Placement",
    isRead: true,
    createdAt: "2026-06-23T10:15:00Z",
  },
  {
    id: "5",
    title: "Result Update",
    message: "Revaluation results are now available.",
    type: "Result",
    isRead: false,
    createdAt: "2026-06-22T09:45:00Z",
  },
  {
    id: "6",
    title: "Hackathon",
    message: "Annual campus hackathon registration is open.",
    type: "Event",
    isRead: false,
    createdAt: "2026-06-21T14:20:00Z",
  },
  {
    id: "7",
    title: "Placement Reminder",
    message: "Resume submission closes at 8 PM today.",
    type: "Placement",
    isRead: false,
    createdAt: "2026-06-20T18:00:00Z",
  },
  {
    id: "8",
    title: "Exam Result",
    message: "Supplementary exam results are out.",
    type: "Result",
    isRead: true,
    createdAt: "2026-06-19T07:30:00Z",
  },
  {
    id: "9",
    title: "Cultural Fest",
    message: "Cultural fest passes are available at the admin block.",
    type: "Event",
    isRead: false,
    createdAt: "2026-06-18T11:00:00Z",
  },
  {
    id: "10",
    title: "Placement Interview",
    message: "Final round interviews begin at 2 PM.",
    type: "Placement",
    isRead: false,
    createdAt: "2026-06-17T16:45:00Z",
  },
  {
    id: "11",
    title: "Result Correction",
    message: "Result correction requests are open for two days.",
    type: "Result",
    isRead: false,
    createdAt: "2026-06-16T09:10:00Z",
  },
  {
    id: "12",
    title: "Guest Lecture",
    message: "Guest lecture on AI ethics this Friday.",
    type: "Event",
    isRead: true,
    createdAt: "2026-06-15T13:05:00Z",
  },
];

function logServerEvent(message, level = "info") {
  if (!loggingToken) {
    return Promise.resolve(null);
  }

  return Log("backend", level, "notification-app-be", message, loggingToken).catch(() => null);
}

function normalizeType(value) {
  if (!value || value === "All") {
    return "All";
  }

  const allowedTypes = new Set(["Placement", "Result", "Event"]);
  return allowedTypes.has(value) ? value : "All";
}

function sortByNewest(items) {
  return [...items].sort((first, second) => new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime());
}

function filterNotifications(notificationType) {
  const type = normalizeType(notificationType);
  const filtered = type === "All" ? notifications : notifications.filter((notification) => notification.type === type);
  return sortByNewest(filtered);
}

app.get("/health", (_, response) => {
  response.json({ ok: true });
});

app.get("/api/notifications", async (request, response) => {
  const page = Math.max(1, Number.parseInt(request.query.page || "1", 10) || 1);
  const limit = Math.max(1, Number.parseInt(request.query.limit || "10", 10) || 10);
  const notificationType = normalizeType(request.query.notificationType);
  const filtered = filterNotifications(notificationType);
  const total = filtered.length;
  const start = (page - 1) * limit;
  const pagedNotifications = filtered.slice(start, start + limit);

  await logServerEvent(`notifications fetched page=${page} limit=${limit} type=${notificationType}`);

  response.json({
    notifications: pagedNotifications,
    page,
    limit,
    total,
  });
});

app.get("/api/notifications/unread", async (_, response) => {
  const unreadNotifications = notifications.filter((notification) => !notification.isRead);

  await logServerEvent("unread notifications fetched");

  response.json({ notifications: unreadNotifications });
});

app.put("/api/notifications/:notificationId/read", async (request, response) => {
  const notification = notifications.find((item) => item.id === request.params.notificationId);

  if (!notification) {
    response.status(404).json({ message: "Notification not found." });
    return;
  }

  notification.isRead = request.body?.isRead ?? true;

  await logServerEvent(`notification viewed ${notification.id}`);

  response.json({ message: "Notification updated successfully." });
});

app.put("/api/notifications/read-all", async (_, response) => {
  notifications.forEach((notification) => {
    notification.isRead = true;
  });

  await logServerEvent("all notifications marked as read");

  response.json({ message: "All notifications marked as read." });
});

app.post("/api/notifications", async (request, response) => {
  const { message, type, title, studentIds } = request.body || {};

  if (!message || !type) {
    response.status(400).json({ message: "message and type are required." });
    return;
  }

  const createdNotification = {
    id: String(notifications.length + 1),
    title: title || `${type} Notification`,
    message,
    type,
    isRead: false,
    createdAt: new Date().toISOString(),
    studentIds: Array.isArray(studentIds) ? studentIds : [],
  };

  notifications.unshift(createdNotification);

  await logServerEvent(`notification created type=${type}`);

  response.status(201).json({ message: "Notification created successfully.", notification: createdNotification });
});

app.use((_, response) => {
  response.status(404).json({ message: "Not found." });
});

app.listen(port, () => {
  console.log(`Notification backend listening on http://127.0.0.1:${port}`);
});