import sgMail from "@sendgrid/mail";
import { v4 as uuidv4 } from "uuid";
import sanitizeHtml from "sanitize-html";
import * as dotenv from "dotenv";

dotenv.config();
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
const FROM = process.env.SENDGRID_FROM_ADDRESS;

async function sendEmail(email) {
  const to = email.to;
  const from = FROM;
  const subject = email.subject;
  const text = email.text;
  const html = email.html;
  const custom_args = email.custom_args;
  const msg = {
    to: to,
    from: from,
    subject: subject,
    text: text,
    html: html,
    custom_args: custom_args,
  };
  return await sgMail.send(msg);
}

export async function sendInvite(invite) {
  // before you call this function **MAKE SURE** that room is an actual room and not arbitrary HTML
  const room = invite.room;
  const dirtyMessageText = `<p>You have been invited to a <a href="https://sharedesque.xyz">Sharedesque</a> meeting! Your room code is <b>${room}</b>.</p>`;
  const messageText = sanitizeHtml(dirtyMessageText);
  let recipients;
  if (invite.organizer !== null) {
    recipients = [invite.organizer].concat(invite.to);
  } else {
    recipients = invite.to;
  }

  const subject = "Sharedesque - Room Code";
  const uuid = uuidv4();
  const response = await sendEmail({
    to: recipients,
    from: FROM,
    subject: subject,
    html: messageText,
    custom_args: {
      req_uuid: uuid,
    },
  });
  if (response[0].statusCode !== 202) {
    throw new Error("sendgrid bad response");
  }
  return {
    statusCode: response.statusCode,
    req_uuid: uuid,
  };
}
