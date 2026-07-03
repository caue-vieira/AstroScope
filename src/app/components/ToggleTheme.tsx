"use client"

import { Switch } from "@/components/ui/switch";
import { useEffect, useState } from "react";

interface ToggleThemeProps {
	darkTheme: boolean;
	setDarkTheme: (value: boolean) => void;
  }

function ToggleTheme({ darkTheme, setDarkTheme }: ToggleThemeProps) {
  useEffect(() => {
	const body = document.body;
	if(darkTheme) {
		body.classList.add("dark");
	} else {
		body.classList.remove("dark")
		body.style.backgroundImage = "";
	}
  }, [darkTheme]);

  return (
	<Switch defaultChecked onClick={() => {
		setDarkTheme(!darkTheme);
	}} />
  )
}

export default ToggleTheme;