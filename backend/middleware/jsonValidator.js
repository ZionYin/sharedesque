import { Validator } from "express-json-validator-middleware";
import addFormats from "ajv-formats";

const validateObj = new Validator();
addFormats(validateObj.ajv);

const inviteSchema = {
  type: "object",
  required: ["room", "attendees", "organizer"],
  properties: {
    attendees: {
      type: "array",
      items: {
        type: "string",
        format: "email",
      },
      nullable: true,
      minItems: 1,
    },
    organizer: {
      type: "string",
      format: "email",
      nullable: true,
    },
    room: {
      type: "string",
    },
  },
};

export const emailInviteValidator = validateObj.validate({
  body: inviteSchema,
});
