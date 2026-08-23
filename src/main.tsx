import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { DataProvider } from "./context/DataContext";
import { AuditProvider } from "./context/AuditContext";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <DataProvider>
      <AuditProvider>
        <App />
      </AuditProvider>
    </DataProvider>
  </React.StrictMode>
);