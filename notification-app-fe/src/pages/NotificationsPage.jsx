import { useEffect, useMemo, useState } from "react";

import NotificationsIcon from "@mui/icons-material/Notifications";
import {
  Alert,
  Badge,
  Box,
  CircularProgress,
  Divider,
  Pagination,
  Paper,
  Typography,
} from "@mui/material";

import { NotificationCard } from "../components/NotificationCard";
import { NotificationFilter } from "../components/NotificationFilter";
import { useNotifications } from "../hooks/useNotifications";
import { logEvent } from "../utils/logger";

export function NotificationsPage() {
  const [filter, setFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [viewedIds, setViewedIds] = useState([]);

  const { notifications, totalPages, loading, error, unreadCount } = useNotifications({
    page,
    limit: 10,
    notificationType: filter,
  });

  useEffect(() => {
    void logEvent("All notifications page opened", "info");
  }, []);

  const displayedNotifications = useMemo(
    () =>
      notifications.map((notification) =>
        viewedIds.includes(notification.id)
          ? { ...notification, isRead: true }
          : notification,
      ),
    [notifications, viewedIds],
  );

  const displayUnreadCount = displayedNotifications.filter((notification) => !notification.isRead).length;

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    setPage(1);
    void logEvent(`Notification filter changed to ${newFilter}`, "info");
  };

  const handlePageChange = (_, newPage) => {
    setPage(newPage);
  };

  const handleNotificationViewed = (notification) => {
    if (!notification?.id) {
      return;
    }

    setViewedIds((current) =>
      current.includes(notification.id) ? current : [...current, notification.id],
    );
    void logEvent(`Notification viewed: ${notification.id}`, "info");
  };

  return (
    <Box sx={{ maxWidth: 900, mx: "auto", px: { xs: 1, sm: 2 }, py: 4 }}>
      <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3, mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Badge badgeContent={displayUnreadCount || unreadCount} color="primary" max={99}>
              <NotificationsIcon sx={{ fontSize: 30 }} />
            </Badge>
            <Box>
              <Typography variant="h5" fontWeight={700}>
                Notifications
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Browse and filter campus updates in real time.
              </Typography>
            </Box>
          </Box>

          <NotificationFilter value={filter} onChange={handleFilterChange} />
        </Box>
      </Paper>

      <Divider sx={{ mb: 3 }} />

      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress />
        </Box>
      )}

      {!loading && error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Failed to load notifications: {error}
        </Alert>
      )}

      {!loading && !error && displayedNotifications.length === 0 && (
        <Alert severity="info">No notifications match the selected filter.</Alert>
      )}

      {!loading && displayedNotifications.length > 0 && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          {displayedNotifications.map((notification) => (
            <NotificationCard
              key={notification.id}
              notification={notification}
              onClick={handleNotificationViewed}
            />
          ))}
        </Box>
      )}

      {!loading && totalPages > 1 && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={handlePageChange}
            color="primary"
            shape="rounded"
          />
        </Box>
      )}
    </Box>
  );
}
