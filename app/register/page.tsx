"use client";

import { useEffect } from "react";
import Home from "../page";

export default function RegisterPage() {
  useEffect(() => {
    const buttons = Array.from(document.querySelectorAll("button"));
    const registerButton = buttons.find((button) =>
      button.textContent?.includes("Registreer ’n ouer/voog")
    );
    registerButton?.click();
  }, []);

  return <Home />;
}
