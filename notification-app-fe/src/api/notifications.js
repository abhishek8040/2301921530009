const DEFAULT_BASE_URL = import.meta.env.VITE_NOTIFICATION_API_URL ?? "/api";

function getAuthToken() {
	try {
		return (
			localStorage.getItem("authToken") ||
			localStorage.getItem("token") ||
			sessionStorage.getItem("authToken") ||
			sessionStorage.getItem("token") ||
			import.meta.env.VITE_AUTH_TOKEN ||
			""
		);
	} catch {
		return import.meta.env.VITE_AUTH_TOKEN || "";
	}
}

function toQueryString(params) {
	const query = new URLSearchParams();

	Object.entries(params).forEach(([key, value]) => {
		if (value === undefined || value === null || value === "" || value === "All") {
			return;
		}

		query.set(key, String(value));
	});

	return query.toString();
}

async function fetchJson(path, { signal, method = "GET", body } = {}) {
	const token = getAuthToken();
	const response = await fetch(`${DEFAULT_BASE_URL}${path}`, {
		method,
		signal,
		headers: {
			"Content-Type": "application/json",
			...(token ? { Authorization: `Bearer ${token}` } : {}),
		},
		...(body ? { body: JSON.stringify(body) } : {}),
	});

	let data = null;

	try {
		data = await response.json();
	} catch {
		if (response.ok) {
			throw new Error("Invalid response from notifications API.");
		}
	}

	if (!response.ok) {
		throw new Error(data?.message || `Request failed with status ${response.status}.`);
	}

	if (!data || typeof data !== "object") {
		throw new Error("Invalid response from notifications API.");
	}

	return data;
}

export async function fetchNotifications({ page = 1, limit = 10, notificationType = "All", signal } = {}) {
	const query = toQueryString({ page, limit, notificationType });
	const data = await fetchJson(`/notifications${query ? `?${query}` : ""}`, { signal });

	return {
		notifications: Array.isArray(data.notifications) ? data.notifications : [],
		page: Number(data.page ?? page) || page,
		limit: Number(data.limit ?? limit) || limit,
		total: Number(data.total ?? 0) || 0,
	};
}

export async function fetchUnreadNotifications({ signal } = {}) {
	const data = await fetchJson("/notifications/unread", { signal });

	return {
		notifications: Array.isArray(data.notifications) ? data.notifications : [],
	};
}

export async function markNotificationAsRead(notificationId, signal) {
	return fetchJson(`/notifications/${notificationId}/read`, {
		method: "PUT",
		signal,
		body: { isRead: true },
	});
}

export async function markAllNotificationsAsRead(signal) {
	return fetchJson("/notifications/read-all", {
		method: "PUT",
		signal,
	});
}
