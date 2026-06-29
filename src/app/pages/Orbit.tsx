"use client";

import axios from "axios";
import { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/Addons.js";
import { useOrbit } from "@/app/components/OrbitStore";
import { currentJulianDay, orbitEllipsePoints, propagateOrbit } from "@/app/utils/KeplerPropagator";
import { parseSbdbResponse } from "@/app/utils/SbdbService";
import type { OrbitalElements, SbdbResponse } from "@/app/utils/SbdbService";

// ─── Scale factor: 1 AU → scene units ────────────────────────────────────────
const AU_SCALE = 5;

// ─── Main page ────────────────────────────────────────────────────────────────

function Orbit() {
    const mountRef = useRef<HTMLDivElement | null>(null);
    const sceneRef = useRef<{
        scene: THREE.Scene;
        camera: THREE.PerspectiveCamera;
        renderer: THREE.WebGLRenderer;
        controls: OrbitControls;
        asteroidMesh: THREE.Mesh | null;
        orbitLine: THREE.Line | null;
        animationId: number;
    } | null>(null);

    const { query, setQuery, asteroidInfo, setAsteroidInfo, orbitalElements, setOrbitalElements } = useOrbit();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasOrbit, setHasOrbit] = useState(false);
    const [sceneReady, setSceneReady] = useState(false);

    // Mirror orbitalElements into a ref so the restore effect can read it without
    // needing it as a dependency (avoids re-running on every new search).
    const orbitalElementsRef = useRef<OrbitalElements | null>(orbitalElements);
    useEffect(() => { orbitalElementsRef.current = orbitalElements; }, [orbitalElements]);

    // ── Three.js scene initialisation (runs once) ──────────────────────────
    useEffect(() => {
        if (!mountRef.current || sceneRef.current) return;

        const WIDTH = mountRef.current.clientWidth;
        const HEIGHT = mountRef.current.clientHeight;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(60, WIDTH / HEIGHT, 0.01, 2000);
        camera.position.set(0, 20, 30);

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
        scene.add(ambientLight);

        const sunLight = new THREE.PointLight(0xfff5c0, 3, 300);
        sunLight.position.set(0, 0, 0);
        scene.add(sunLight);

        const backLight = new THREE.DirectionalLight(0x4466ff, 0.4);
        backLight.position.set(-10, -5, -10);
        camera.add(backLight);
        scene.add(camera);

        // Renderer
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(WIDTH, HEIGHT);
        renderer.setClearColor(0x000000, 0);
        mountRef.current.appendChild(renderer.domElement);

        // Controls
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.06;
        controls.minDistance = 2;
        controls.maxDistance = 200;

        // Sun
        const textureLoader = new THREE.TextureLoader();
        const sunTexture = textureLoader.load("/solar-texture.png");
        const sunGeom = new THREE.SphereGeometry(1.2, 32, 32);
        const sunMat = new THREE.MeshStandardMaterial({ map: sunTexture, emissiveMap: sunTexture, emissive: new THREE.Color(0xffdd88), emissiveIntensity: 0.4 });
        const sunMesh = new THREE.Mesh(sunGeom, sunMat);
        scene.add(sunMesh);

        // Star field
        const starPositions: number[] = [];
        for (let s = 0; s < 2000; s++) {
            const theta = Math.random() * 2 * Math.PI;
            const phi = Math.acos(2 * Math.random() - 1);
            const r = 400 + Math.random() * 200;
            starPositions.push(
                r * Math.sin(phi) * Math.cos(theta),
                r * Math.sin(phi) * Math.sin(theta),
                r * Math.cos(phi)
            );
        }
        const starGeom = new THREE.BufferGeometry();
        starGeom.setAttribute("position", new THREE.Float32BufferAttribute(starPositions, 3));
        const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.5, sizeAttenuation: true });
        scene.add(new THREE.Points(starGeom, starMat));

        // Ecliptic grid (subtle)
        const gridHelper = new THREE.GridHelper(80, 20, 0x334455, 0x223344);
        gridHelper.material.opacity = 0.15;
        gridHelper.material.transparent = true;
        scene.add(gridHelper);

        // Animate
        let animationId: number = 0;
        const animate = () => {
            animationId = requestAnimationFrame(animate);
            controls.update();
            sunMesh.rotation.y += 0.001;
            renderer.render(scene, camera);
        };
        animate();

        // Responsive resize
        const handleResize = () => {
            if (!mountRef.current) return;
            const W = mountRef.current.clientWidth;
            const H = mountRef.current.clientHeight;
            camera.aspect = W / H;
            camera.updateProjectionMatrix();
            renderer.setSize(W, H);
        };
        window.addEventListener("resize", handleResize);

        sceneRef.current = { scene, camera, renderer, controls, asteroidMesh: null, orbitLine: null, animationId };
        setSceneReady(true);

        return () => {
            cancelAnimationFrame(animationId);
            window.removeEventListener("resize", handleResize);
            controls.dispose();
            renderer.dispose();
            if (mountRef.current) {
                mountRef.current.removeChild(renderer.domElement);
            }
            sceneRef.current = null;
        };
    }, []);

    // ── Draw orbit in existing scene ───────────────────────────────────────
    const drawOrbit = useCallback((elements: OrbitalElements) => {
        const ref = sceneRef.current;
        if (!ref) return;

        const { scene } = ref;

        // Remove previous asteroid and orbit line
        if (ref.asteroidMesh) {
            scene.remove(ref.asteroidMesh);
            ref.asteroidMesh.geometry.dispose();
            (ref.asteroidMesh.material as THREE.Material).dispose();
            ref.asteroidMesh = null;
        }
        if (ref.orbitLine) {
            scene.remove(ref.orbitLine);
            ref.orbitLine.geometry.dispose();
            (ref.orbitLine.material as THREE.Material).dispose();
            ref.orbitLine = null;
        }

        // Orbit ellipse
        const ellipsePoints = orbitEllipsePoints(elements, 720);
        const positions: number[] = [];
        for (const p of ellipsePoints) {
            positions.push(p.x * AU_SCALE, p.z * AU_SCALE, -p.y * AU_SCALE);
        }
        const lineGeom = new THREE.BufferGeometry();
        lineGeom.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
        const lineMat = new THREE.LineBasicMaterial({ color: 0x88aaff, transparent: true, opacity: 0.7 });
        const orbitLine = new THREE.Line(lineGeom, lineMat);
        scene.add(orbitLine);
        ref.orbitLine = orbitLine;

        // Asteroid current position
        const t = currentJulianDay();
        const pos = propagateOrbit(elements, t);

        const textureLoader = new THREE.TextureLoader();
        const moonTexture = textureLoader.load("/moon-texture.png");
        const asteroidGeom = new THREE.SphereGeometry(0.3, 24, 24);
        const asteroidMat = new THREE.MeshStandardMaterial({ map: moonTexture });
        const asteroidMesh = new THREE.Mesh(asteroidGeom, asteroidMat);
        asteroidMesh.position.set(pos.x * AU_SCALE, pos.z * AU_SCALE, -pos.y * AU_SCALE);
        scene.add(asteroidMesh);
        ref.asteroidMesh = asteroidMesh;

        // Reposition camera to fit orbit
        const maxDim = elements.ad * AU_SCALE * 1.8;
        ref.camera.position.set(maxDim * 0.6, maxDim * 0.5, maxDim * 0.7);
        ref.controls.update();

        setHasOrbit(true);
    }, []);

    // ── Restore orbit when re-mounting after a tab switch ─────────────────
    useEffect(() => {
        if (!sceneReady || !orbitalElementsRef.current) return;
        drawOrbit(orbitalElementsRef.current);
    }, [sceneReady, drawOrbit]);

    // ── Search handler ─────────────────────────────────────────────────────
    const handleSearch = useCallback(async () => {
        const trimmed = query.trim();
        if (!trimmed) return;

        setLoading(true);
        setError(null);
        setAsteroidInfo(null);
        setHasOrbit(false);

        try {
            const response = await axios.get<SbdbResponse>(
                `https://ssd-api.jpl.nasa.gov/sbdb.api?sstr=${encodeURIComponent(trimmed)}&full-prec=true&phys-par=true`
            );

            const { elements, info } = parseSbdbResponse(response.data);
            setAsteroidInfo(info);
            setOrbitalElements(elements);
            drawOrbit(elements);
        } catch (err) {
            if (axios.isAxiosError(err) && err.response?.status === 200) {
                setError("Asteroide não encontrado. Tente outro nome ou designação.");
            } else {
                setError("Erro ao buscar dados do JPL. Verifique o nome e tente novamente.");
            }
        } finally {
            setLoading(false);
        }
    }, [query, drawOrbit, setAsteroidInfo, setOrbitalElements]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") handleSearch();
    };

    // ── Render ─────────────────────────────────────────────────────────────
    return (
        <div className="flex flex-col h-full min-h-0 overflow-hidden">

            {/* ── Search bar ──────────────────────────────────────────────── */}
            <div className="flex items-center gap-3 px-6 py-4 border-b border-border shrink-0">
                <div className="flex flex-1 max-w-xl items-center gap-2 bg-card border border-border rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-ring transition-all">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-muted-foreground shrink-0"
                        aria-hidden="true"
                    >
                        <circle cx="11" cy="11" r="8" />
                        <path d="m21 21-4.3-4.3" />
                    </svg>
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Nome ou designação do asteroide (ex: Apophis, 99942, Ceres)"
                        className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
                    />
                </div>
                <button
                    type="button"
                    onClick={handleSearch}
                    disabled={loading || !query.trim()}
                    className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
                >
                    {loading ? "Buscando…" : "Visualizar"}
                </button>
            </div>

            {/* ── Content area ────────────────────────────────────────────── */}
            <div className="flex flex-1 min-h-0 overflow-hidden">

                {/* ── Three.js canvas ─────────────────────────────────────── */}
                <div className="relative flex-1 min-h-0 min-w-0 overflow-hidden">
                    <div ref={mountRef} className="w-full h-full bg-transparent" />

                    {/* Empty state overlay */}
                    {!hasOrbit && !loading && !error && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center text-muted-foreground pointer-events-none">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="48"
                                height="48"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="opacity-25"
                                aria-hidden="true"
                            >
                                <circle cx="12" cy="12" r="10" />
                                <ellipse cx="12" cy="12" rx="10" ry="4" />
                                <line x1="12" y1="2" x2="12" y2="22" />
                            </svg>
                            <p className="text-sm opacity-50">
                                Busque um asteroide para visualizar a órbita.
                            </p>
                        </div>
                    )}

                    {/* Loading overlay */}
                    {loading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-background/40 backdrop-blur-sm">
                            <div className="flex flex-col items-center gap-3">
                                <div className="w-8 h-8 rounded-full border-2 border-border border-t-primary animate-spin" />
                                <p className="text-sm text-muted-foreground">Calculando órbita…</p>
                            </div>
                        </div>
                    )}

                    {/* Error overlay */}
                    {error && !loading && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="bg-destructive/10 border border-destructive/30 text-destructive rounded-lg px-5 py-3 text-sm max-w-xs text-center">
                                {error}
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Info panel ──────────────────────────────────────────── */}
                {asteroidInfo && (
                    <aside className="w-72 shrink-0 border-l border-border overflow-y-auto flex flex-col gap-3 px-4 py-4">

                        {/* Header */}
                        <div className="flex flex-col gap-1">
                            <h2 className="text-sm font-semibold text-foreground leading-tight">
                                {asteroidInfo.fullname}
                            </h2>
                            <div className="flex flex-wrap gap-1.5 mt-1">
                                {asteroidInfo.isNeo && (
                                    <Badge label="NEO" color="amber" />
                                )}
                                {asteroidInfo.isPha && (
                                    <Badge label="PHA" color="red" />
                                )}
                                <Badge label={asteroidInfo.orbitClass} color="blue" />
                            </div>
                        </div>

                        <Divider />

                        {/* Orbital elements */}
                        <Section title="Elementos Orbitais">
                            <InfoCard label="Semieixo maior" value={`${asteroidInfo.semiMajorAxis} AU`} />
                            <InfoCard label="Excentricidade" value={asteroidInfo.eccentricity} />
                            <InfoCard label="Inclinação" value={`${asteroidInfo.inclination}°`} />
                            <InfoCard label="Dist. periélio" value={`${asteroidInfo.perihelionDist} AU`} />
                            <InfoCard label="Dist. afélio" value={`${asteroidInfo.aphelionDist} AU`} />
                            <InfoCard label="Período orbital" value={`${asteroidInfo.period} dias`} />
                        </Section>

                        <Divider />

                        {/* Close approach */}
                        <Section title="Aproximação com a Terra">
                            <InfoCard label="MOID" value={`${asteroidInfo.moid} AU`} />
                            <InfoCard label="MOID Júpiter" value={`${asteroidInfo.moidJup} AU`} />
                            <InfoCard label="T. Tisserand" value={asteroidInfo.tJup} />
                        </Section>

                        <Divider />

                        {/* Observation quality */}
                        <Section title="Qualidade do Ajuste">
                            <InfoCard label="Cód. condição" value={`${asteroidInfo.conditionCode} / 9`} />
                            <InfoCard label="RMS residual" value={`${asteroidInfo.rms}″`} />
                            <InfoCard label="Nº observações" value={String(asteroidInfo.nObsUsed)} />
                            <InfoCard label="Arco de dados" value={`${asteroidInfo.dataArc} dias`} />
                            <InfoCard label="Primeira obs." value={asteroidInfo.firstObs} />
                            <InfoCard label="Última obs." value={asteroidInfo.lastObs} />
                        </Section>

                    </aside>
                )}
            </div>
        </div>
    );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
            {children}
        </div>
    );
}

function InfoCard({ label, value }: { label: string; value: string }) {
    return (
        <div className="bg-card border border-border rounded-lg px-3 py-2">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-sm font-semibold text-foreground font-mono">{value}</p>
        </div>
    );
}

function Badge({ label, color }: { label: string; color: "amber" | "red" | "blue" | "zinc" }) {
    const colorMap: Record<string, string> = {
        amber: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25",
        red:   "bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/25",
        blue:  "bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/25",
        zinc:  "bg-zinc-500/15 text-zinc-600 dark:text-zinc-400 border border-zinc-500/25",
    };
    return (
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${colorMap[color]}`}>
            {label}
        </span>
    );
}

function Divider() {
    return <hr className="border-border" />;
}

export default Orbit;