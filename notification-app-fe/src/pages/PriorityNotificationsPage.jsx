import { Typography } from "@mui/material";

export function PriorityNotificationsPage() {
  return (
    <>
      <Typography variant="h4">
        Priority Notifications
      </Typography>

      <Typography sx={{ mt: 2 }}>
        Top 10 priority notifications will be displayed here.
      </Typography>
    </>
  );
}