import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import Form from "react-bootstrap/Form";
import { apiService } from "../services/apiService";

export default function ChooseRoom() {
  const [show, setShow] = useState(false);
  const navigate = useNavigate();
  const [roomId, setRoomId] = useState(null);

  const handleClose = () => setShow(false);
  const handleOpen = () => setShow(true);

  const joinRoom = function () {
    apiService
      .getRoomPeerIds(roomId)
      .then(() => navigate(`/rooms/${roomId}`))
      .catch(() => alert("Room doesn't exist!"));
  };

  return (
    <>
      <Button className="btn-secondary m-2" onClick={handleOpen}>
        Join Existing Room
      </Button>
      <Modal show={show} onHide={handleClose}>
        <Modal.Header closeButton></Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3" controlId="formRoomId">
              <Form.Label>Enter your room ID:</Form.Label>
              <Form.Control
                type="text"
                placeholder="Room ID"
                onChange={(e) => setRoomId(e.target.value)}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={joinRoom} disabled={!roomId}>
            Go
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
