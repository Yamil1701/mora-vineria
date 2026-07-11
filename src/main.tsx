import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import App from "./App";
import { AppErrorBoundary } from "./components/AppErrorBoundary";
import "./styles/index.css";

const router = createBrowserRouter(
  [{ path: "*", element: <AppErrorBoundary><App /></AppErrorBoundary> }],
  { basename: "/mora-vineria" },
);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
