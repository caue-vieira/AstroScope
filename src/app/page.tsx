"use client"

import { HeaderSeparator } from "./components/HeaderSeparator";
import Image from "next/image";
import ToggleTheme from "./components/ToggleTheme";
import { useState } from "react";
import AboutPage from "./pages/About";
import Orbit from "./pages/Orbit";
import FileInput from "./components/FileInput";
import LightCurve from "./pages/LightCurve";

export default function Home() {
  const [darkTheme, setDarkTheme] = useState(true);
  const [activePage, setActivePage] = useState<number>(0);

  return (
    <section className="h-screen flex flex-col">
      <div className="flex w-full h-20 shadow-md shadow-zinc-300 dark:shadow-zinc-900 justify-between">
        <div className="flex-1 flex items-center gap-4">
          <Image 
            src={darkTheme ? "/AstroScope-Text-Dark.png" : "/download.png"}
            alt="AstroScope logo" 
            width={250} 
            height={40}
            className="h-auto ml-4"
          />
          <ToggleTheme darkTheme={darkTheme} setDarkTheme={setDarkTheme} />
        </div>
        <div className="flex h-full mx-auto justify-between">
          <button onClick={() => {setActivePage(0)}} type="button" className="px-8 rounded-xl hover:bg-zinc-300 dark:hover:bg-[#d4d4d825] hover:cursor-pointer h-[70%] my-auto mx-2">Curva de Luz</button>
          <HeaderSeparator />
          <button onClick={() => {setActivePage(1)}} type="button" className="px-8 rounded-xl hover:bg-zinc-300 dark:hover:bg-[#d4d4d825] hover:cursor-pointer h-[70%] my-auto mx-2">Órbita 3D</button>
          <HeaderSeparator />
          <button onClick={() => {setActivePage(2)}} type="button" className="px-8 rounded-xl hover:bg-zinc-300 dark:hover:bg-[#d4d4d825] hover:cursor-pointer h-[70%] my-auto mx-2">Gerar PDF</button>
          <HeaderSeparator />
          <button onClick={() => {setActivePage(3)}} type="button" className="px-8 rounded-xl hover:bg-zinc-300 dark:hover:bg-[#d4d4d825] hover:cursor-pointer h-[70%] my-auto mx-2">Sobre o projeto</button>
        </div>

        <div className="flex-1" />
      </div>
      
      {activePage === 0 && <LightCurve />}
      {activePage === 1 && <Orbit />}
      {activePage === 2 && <div>Página Gerar PDF</div>}
      {activePage === 3 && <AboutPage />}

    </section>
  );
}
