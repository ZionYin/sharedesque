export const apiService = (function () {
  "use strict";

  let baseUrl = "https://api.sharedesque.xyz";
  if (process.env.NODE_ENV === "development") {
    baseUrl = "http://localhost:8000";
  }
  let module = {};

  module.sendInvites = async function (inviteData) {
    return fetch(`${baseUrl}/emails/invites`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(inviteData),
    })
      .then((res) => {
        if (!res.ok) {
          return Promise.reject(new Error(res.statusText));
        } else {
          return res;
        }
      })
      .then((res) => res.json());
  };

  module.sendScheduledInvites = async function (scheduledInviteData) {
    return fetch(`${baseUrl}/emails/invites`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(scheduledInviteData),
    }).then((res) => res.json());
  };

  module.createRoom = async function () {
    return fetch(`${baseUrl}/rooms/create`, {
      method: "GET",
    })
      .then((res) => {
        if (!res.ok) {
          return Promise.reject(new Error(res.statusText));
        } else {
          return res;
        }
      })
      .then((res) => res.json());
  };

  module.getRoomPeerIds = async function (roomId) {
    return fetch(`${baseUrl}/rooms/${roomId}/peerIds`, {
      method: "GET",
    })
      .then((res) => {
        if (!res.ok) {
          return Promise.reject(new Error(res.statusText));
        } else {
          return res;
        }
      })
      .then((res) => res.json());
  };

  return module;
})();
