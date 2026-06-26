import { useEffect, useState } from "react";

import { fetchNotifications, fetchUnreadNotifications } from "../api/notifications";

const DEFAULT_PAGE_SIZE = 10;

export function useNotifications({ page = 1, limit = DEFAULT_PAGE_SIZE, notificationType = "All" } = {}) {
  const [notifications, setNotifications] = useState([]);
  const [total, setTotal] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    const loadNotifications = async () => {
      setLoading(true);
      setError("");

      try {
        const [notificationResult, unreadResult] = await Promise.all([
          fetchNotifications({
            page,
            limit,
            notificationType,
            signal: controller.signal,
          }),
          fetchUnreadNotifications({ signal: controller.signal }),
        ]);

        setNotifications(notificationResult.notifications);
        setTotal(notificationResult.total);
        setUnreadCount(unreadResult.notifications.length);
      } catch (fetchError) {
        if (fetchError?.name === "AbortError") {
          return;
        }

        const message = fetchError instanceof Error ? fetchError.message : "Unable to load notifications.";
        setNotifications([]);
        setTotal(0);
        setUnreadCount(0);
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    loadNotifications();

    return () => controller.abort();
  }, [limit, notificationType, page]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return {
    notifications,
    total,
    totalPages,
    unreadCount,
    loading,
    error,
  };
}
