import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { BrowserRouter } from "react-router-dom";
import RoomProvider from "system/context/RoomContextProvider";
import LocalProvider from "system/context/localInfo/LocalContextProvider";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(
  <BrowserRouter>
    <RoomProvider>
      <LocalProvider>
        <App />
      </LocalProvider>
    </RoomProvider>
  </BrowserRouter>
);