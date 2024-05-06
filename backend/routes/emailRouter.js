import { Router } from "express";
import { roomClient } from "../redisClients.js";
import { sendInvite } from "../externalApiService/sendgrid.js";
import { emailInviteValidator } from "../middleware/jsonValidator.js";

export const emailRouter = Router();

/* Send email for existing room */
emailRouter.post(
  "/invites/",
  emailInviteValidator,
  async function (req, res, next) {
    try {
      const roomId = req.body.room;
      const roomExists = await roomClient.exists(roomId);
      if (!roomExists) {
        return res.status(404).json({
          error: "Room ID not found",
        });
      } else {
        const sentEmail = await sendInvite({
          to: req.body.attendees,
          organizer: req.body.organizer,
          date: null,
          room: roomId,
        });
        return res.json(sentEmail);
      }
    } catch (e) {
      next(e);
    }
  }
);
