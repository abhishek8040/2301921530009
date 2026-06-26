import { useEffect, useMemo, useState } from "react";

import NotificationsIcon from "@mui/icons-material/Notifications";
import {
  Alert,
  Badge,
  Box,
  CircularProgress,
  Divider,
  Paper,
  Typography,
} from "@mui/material";

import { NotificationCard } from "../components/NotificationCard";
import { NotificationFilter } from "../components/NotificationFilter";
import { useNotifications } from "../hooks/useNotifications";
import { logEvent } from "../utils/logger";

const PRIORITY_ORDER = {
  Placement: 0,
  Result: 1,
  Event: 2,
};

export function PriorityNotificationsPage() {
  const [filter, setFilter] = useState("All");
  const { notifications, loading, error } = useNotifications({
    page: 1,
    limit: 100,
    notificationType: filter,
  });

  useEffect(() => {
    void logEvent("Priority notifications page opened", "info");
  }, []);

  const topNotifications = useMemo(() => {
    return [...notifications]
      .sort((left, right) => {
        const leftPriority = PRIORITY_ORDER[left.type] ?? 99;
        const rightPriority = PRIORITY_ORDER[right.type] ?? 99;

        if (leftPriority !== rightPriority) {
          return leftPriority - rightPriority;
        }

        const leftDate = new Date(left.createdAt || left.timestamp || 0).getTime();
        const rightDate = new Date(right.createdAt || right.timestamp || 0).getTime();

        return rightDate - leftDate;
      })
      .slice(0, 10);
  }, [notifications]);

  return (
    <Box sx={{ maxWidth: 900, mx: "auto", px: { xs: 1, sm: 2 }, py: 4 }}>
      <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3, mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Badge badgeContent={topNotifications.filter((notification) => !notification.isRead).length} color="primary" max={99}>
              <NotificationsIcon sx={{ fontSize: 30 }} />
            </Badge>
            <Box>
              <Typography variant="h5" fontWeight={700}>
                Priority Notifications
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Top 10 notifications ranked by placement, result, and event priority.
              </Typography>
            </Box>
          </Box>

          <NotificationFilter value={filter} onChange={setFilter} />
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
          Failed to load priority notifications: {error}
        </Alert>
      )}

      {!loading && !error && topNotifications.length === 0 && (
        <Alert severity="info">No priority notifications are available.</Alert>
      )}

      {!loading && topNotifications.length > 0 && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          {topNotifications.map((notification) => (
            <NotificationCard key={notification.id} notification={notification} />
          ))}
        </Box>
      )}
    </Box>
  );
}