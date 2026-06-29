"use client";

import Image from "next/image";
import { useState } from "react";
import { HeaderSeparator } from "./components/HeaderSeparator";
import { LightCurveProvider } from "./components/LightCurveStore";
import { OrbitProvider } from "./components/OrbitStore";
import ToggleTheme from "./components/ToggleTheme";
import AboutPage from "./pages/About";
import GeneratePDF from "./pages/GeneratePDF";
import LightCurve from "./pages/LightCurve";
import Orbit from "./pages/Orbit";

export default function Home() {
    const [darkTheme, setDarkTheme] = useState(true);
    const [activePage, setActivePage] = useState<number>(0);

    return (
        // Provider wraps the whole app so state survives page switches
        <LightCurveProvider>
            <OrbitProvider>
                <section className="h-screen flex flex-col">
                    {/* ── Header ───────────────────────────────────────────── */}
                    <div className="flex w-full h-20 shadow-md shadow-zinc-300 dark:shadow-zinc-900 justify-between shrink-0">
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

                        <nav className="flex h-full mx-auto justify-between">
                            <NavButton
                                label="Curva de Luz"
                                active={activePage === 0}
                                onClick={() => setActivePage(0)}
                            />
                            <HeaderSeparator />
                            <NavButton
                                label="Órbita 3D"
                                active={activePage === 1}
                                onClick={() => setActivePage(1)}
                            />
                            <HeaderSeparator />
                            <NavButton
                                label="Gerar PDF"
                                active={activePage === 2}
                                onClick={() => setActivePage(2)}
                            />
                            <HeaderSeparator />
                            <NavButton
                                label="Sobre o projeto"
                                active={activePage === 3}
                                onClick={() => setActivePage(3)}
                            />
                        </nav>

                        <div className="flex-1" />
                    </div>

                    {/* ── Pages ────────────────────────────────────────────── */}
                    <main className="flex-1 min-h-0 overflow-y-auto">
                        {activePage === 0 && <LightCurve />}
                        {activePage === 1 && <Orbit />}
                        {activePage === 2 && <GeneratePDF />}
                        {activePage === 3 && <AboutPage />}
                    </main>
                </section>
            </OrbitProvider>
        </LightCurveProvider>
    );
}

// ─── Nav button ───────────────────────────────────────────────────────────────

function NavButton({
    label,
    active,
    onClick,
}: {
    label: string;
    active: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`
                px-8 rounded-xl hover:cursor-pointer h-[70%] my-auto mx-2 text-sm
                transition-colors
                ${active
                    ? "bg-zinc-200 dark:bg-[#d4d4d840] font-medium"
                    : "hover:bg-zinc-200 dark:hover:bg-[#d4d4d825]"
                }
            `}
        >
            {label}
        </button>
    );
}
