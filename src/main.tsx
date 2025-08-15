import React from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";
import { App } from "./pages/App";

createRoot(document.getElementById("root") as HTMLElement).render(<App />);
