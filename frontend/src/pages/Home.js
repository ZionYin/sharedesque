import React, { useEffect, useState } from "react";
import { Container, Navbar } from "react-bootstrap";
//import Button from "react-bootstrap/Button"; test1
import ChooseRoom from "../components/ChooseRoom.js";
import CreateRoom from "../components/CreateRoom.js";

const serverPublickey =
  "BBQqPlxLudd5NqXiTJE9eyXAVyjSdk-XjjBljXzPYLHm2BtS4CsQ98jsOY4U9_GZ_Eqj3Ftnkx2DhIJne4xgYUw";

export default function Home() {
  const [pushSub, setPushSub] = useState(null);

  useEffect(() => {
    setPushSub(getSub());

    function getSub() {
      if ("serviceWorker" in navigator) {
        if ("PushManager" in window) {
          navigator.serviceWorker
            .register("/worker.js")
            .then((registration) => {
              console.log("Service worker successfully registered");
              return registration;
            })
            .then(function (registration) {
              const permissionResult = askPermission()
                .then(function (permissionResult) {
                  if (permissionResult === "granted") {
                    console.log("Permission granted.");
                    const newSub = registration.pushManager
                      .subscribe({
                        userVisibleOnly: true,
                        applicationServerKey:
                          urlBase64ToUint8Array(serverPublickey),
                      })
                      .then(function (newSub) {
                        console.log(newSub);
                        localStorage.setItem("pushSub", JSON.stringify(newSub));
                        return newSub;
                      });
                  } else {
                    console.log("Permission not granted.");
                    return null;
                  }
                })
                .catch(function (error) {
                  console.error("Error asking for permission.", error);
                });
            })
            .catch(function (error) {
              console.error("Error registering service worker: ", error);
            });
        } else {
          console.log("No push manager in window");
          return null;
        }
      } else {
        console.log("No service worker in navigator");
        return null;
      }
    }

    async function askPermission() {
      const permissionResult = await Notification.requestPermission();
      return permissionResult;
    }
  }, []);

  function urlBase64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, "+")
      .replace(/_/g, "/");
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  return (
    <div>
      <Navbar bg="light" className="border">
        <Container>
          <Navbar.Brand href="/">Sharedesque</Navbar.Brand>
        </Container>
      </Navbar>
      <Container className="py-5 text-center">
        <h1>Share your screen with no hassle</h1>
        <CreateRoom />
        <ChooseRoom />
      </Container>
    </div>
  );
}
