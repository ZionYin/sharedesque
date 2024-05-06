import React from "react";
import { useNavigate } from "react-router-dom";
import { apiService } from "../services/apiService";
import Button from "react-bootstrap/Button";

export default function CreateRoom() {
  const navigate = useNavigate();
  const handleCreate = () => {
    apiService
      .createRoom()
      .then((data) => navigate(`/rooms/${data.roomId}`))
      .catch(() => alert("Room creation failed!"));
  };

  return (
    <>
      <Button className="btn-secondary m-2" onClick={handleCreate}>
        Create New Room
      </Button>
    </>
  );
}
