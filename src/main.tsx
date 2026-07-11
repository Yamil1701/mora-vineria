import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App";
import { AppErrorBoundary } from "./components/AppErrorBoundary";
import "./styles/index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter basename="/mora-vineria">
      <AppErrorBoundary><App /></AppErrorBoundary>
    </BrowserRouter>
  </React.StrictMode>,
);
