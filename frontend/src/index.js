import React from "react";
import ReactDOM from "react-dom/client";
import {
  createBrowserRouter,
  createHashRouter,
  RouterProvider,
} from "react-router-dom";
import "./index.css";
import "bootstrap/dist/css/bootstrap.min.css";
import Home from "./pages/Home.js";
import Room from "./pages/Room.js";

const router = createHashRouter([
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/rooms/:roomId",
    element: <Room />,
  },
]);

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<RouterProvider router={router} />);
