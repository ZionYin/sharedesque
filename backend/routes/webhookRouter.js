import express from "express";
import { Router } from "express";
import { webhookEmitter } from "../classes/webhookEmitter.js";
import { EventWebhook, EventWebhookHeader } from "@sendgrid/eventwebhook";

export const webhookRouter = Router();
const sendgridWebhookUrl = process.env.SENDGRID_WEBHOOK_URL;

const SENDGRID_PUBLIC_KEY =
  "MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEz22P6uXCB3ffECTFSYZ8QJGb8k0pQeRrSvyOI363w5NqCAS9uxRrKX8vajShdn5/zXkgDivVJ4QUuBMWadS2Ig==";
const EVENT_WEBHOOK = new EventWebhook();
const EC_PUBLIC_KEY =
  EVENT_WEBHOOK.convertPublicKeyToECDSA(SENDGRID_PUBLIC_KEY);
const verifyWebhook = (reqBody, signature, timestamp) => {
  try {
    return EVENT_WEBHOOK.verifySignature(
      EC_PUBLIC_KEY,
      reqBody,
      signature,
      timestamp
    );
  } catch (err) {
    return false;
  }
};

// post to this webhook
webhookRouter.post(
  `/sendgrid/${sendgridWebhookUrl}`,
  express.raw({
    type: "application/json",
  }),
  (req, res, next) => {
    try {
      const signature = req.get(EventWebhookHeader.SIGNATURE());
      const timestamp = req.get(EventWebhookHeader.TIMESTAMP());

      const reqBody = req.body;
      if (verifyWebhook(reqBody, signature, timestamp)) {
        const webhookBody = JSON.parse(req.body.toString());
        webhookBody.forEach((webhookEvent) => {
          const event = webhookEvent.event;
          const email = webhookEvent.email;
          const webhookId = webhookEvent.req_uuid;
          webhookEmitter.emit("sgWebhookEvent", event, email, webhookId);
          console.log(event, email, webhookId);
        });
        return res.status(200).send();
      } else {
        return res.status(403).send();
      }
    } catch (err) {
      next(err);
    }
  }
);
