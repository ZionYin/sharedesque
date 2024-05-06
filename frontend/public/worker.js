self.addEventListener("push", (event) => {
  const data = event.data.json();
  if (data.type === "userJoinedRoom") {
    event.waitUntil(
      self.registration.showNotification("User Connected", {
        body: `A user has joined the room.`,
      })
    );
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
});
