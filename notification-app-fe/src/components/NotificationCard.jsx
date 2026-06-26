import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Typography,
} from "@mui/material";

function formatTimestamp(timestamp) {
  if (!timestamp) {
    return "Unknown time";
  }

  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return timestamp;
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function NotificationCard({ notification, onClick }) {
  const isRead = Boolean(notification?.isRead);
  const badgeLabel = isRead ? "Viewed" : "New";

  return (
    <Card variant="outlined">
      <CardActionArea onClick={() => onClick?.(notification)}>
        <CardContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 2 }}>
              <Typography variant="subtitle1" fontWeight={700}>
                {notification?.title || notification?.message || "Notification"}
              </Typography>

              <Chip
                label={badgeLabel}
                size="small"
                color={isRead ? "default" : "primary"}
                variant={isRead ? "outlined" : "filled"}
              />
            </Box>

            <Typography variant="body2" color="text.secondary">
              {notification?.message || "No message available."}
            </Typography>

            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center" }}>
              <Chip label={notification?.type || "Unknown"} size="small" variant="outlined" />
              <Typography variant="caption" color="text.secondary">
                {formatTimestamp(notification?.createdAt || notification?.timestamp)}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
