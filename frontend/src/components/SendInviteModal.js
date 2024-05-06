import React, { useEffect, useState } from "react";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import Form from "react-bootstrap/Form";
import Alert from "react-bootstrap/Alert";
import Spinner from "react-bootstrap/Spinner";
import * as EmailValidator from "email-validator";

import PreviousEmailList from "./PreviousEmailList";

import { socket } from "../socket.js";
import { apiService } from "../services/apiService.js";

export default function SendInviteModal(props) {
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [prevEmails, setPrevEmails] = useState({});

  const handleClose = () => setShow(false);
  const handleOpen = () => {
    setError("");
    setShow(true);
  };

  useEffect(() => {
    function onReceivedSgWebhook(email, event, uuid) {
      if (event === "dropped") {
        setPrevEmails((prevState) => ({
          ...prevState,
          [uuid]: { status: "dropped", email: email },
        }));
      } else if (event === "bounced") {
        setPrevEmails((prevState) => ({
          ...prevState,
          [uuid]: { status: "bounced", email: email },
        }));
      } else if (event === "delivered") {
        setPrevEmails((prevState) => ({
          ...prevState,
          [uuid]: { status: "delivered", email: email },
        }));
      }
    }
    socket.on("received-sg-webhook", onReceivedSgWebhook);
    return () => {
      socket.off("received-sg-webhook", onReceivedSgWebhook);
    };
  }, []);

  const sendInvite = () => {
    setLoading(true);
    if (!EmailValidator.validate(email)) {
      setError("Invalid email address.");
      setLoading(false);
      setEmail("");
      return;
    }

    apiService
      .sendInvites({
        organizer: null,
        attendees: [email],
        room: props.roomId,
      })
      .then((res) => {
        socket.emit("ws-join-notif-room", res.req_uuid);
        setPrevEmails((prevState) => ({
          ...prevState,
          [res.req_uuid]: { status: "pending", email: email },
        }));
      })
      .catch((err) => setError(err.toString()))
      .finally(() => setLoading(false));
    setEmail("");
  };

  return (
    <>
      <Button className="btn-secondary m-2" onClick={handleOpen}>
        Invite
      </Button>
      <Modal show={show} onHide={handleClose}>
        <Modal.Header closeButton></Modal.Header>
        <Modal.Body>
          <Alert variant="info">
            It may take a little while before your email is sent.
          </Alert>
          <Form>
            <Form.Label>Invite someone else to this meeting:</Form.Label>
            <Form.Group className="mb-3" controlId="formInvite">
              <Form.Control
                type="email"
                placeholder="example@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Form.Group>
          </Form>
          {error !== "" && <Alert variant="warning">{error}</Alert>}
          <PreviousEmailList emailStatus={prevEmails} />
        </Modal.Body>
        <Modal.Footer>
          {loading && (
            <Spinner animation="border" role="status">
              <span className="visually-hidden">Loading...</span>
            </Spinner>
          )}
          <Button
            variant="primary"
            disabled={email === "" || loading}
            onClick={sendInvite}
          >
            Send Invite
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
