import { BrowserRouter, Link, Navigate, Route, Routes } from "react-router-dom";
import {
  AppBar,
  Box,
  Toolbar,
  Typography,
  Button,
  Container,
} from "@mui/material";

import { NotificationsPage } from "./pages/NotificationsPage";
import { PriorityNotificationsPage } from "./pages/PriorityNotificationsPage";

export default function App() {
  return (
    <BrowserRouter>
      <Box sx={{ minHeight: "100vh", bgcolor: "grey.50" }}>
        <AppBar position="static" elevation={0} color="default">
          <Toolbar>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              Campus Notification System
            </Typography>

            <Button color="inherit" component={Link} to="/">
              All Notifications
            </Button>

            <Button color="inherit" component={Link} to="/priority">
              Priority Inbox
            </Button>
          </Toolbar>
        </AppBar>

        <Container sx={{ mt: 3, pb: 4 }}>
          <Routes>
            <Route path="/" element={<NotificationsPage />} />
            <Route path="/priority" element={<PriorityNotificationsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Container>
      </Box>
    </BrowserRouter>
  );
}