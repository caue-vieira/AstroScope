"use client"

import axios from "axios";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/Addons.js";

function Orbit() {
    const mountRef = useRef<HTMLDivElement | null>(null);
    const initializedRef = useRef(false);

    useEffect(() => {
        axios.get("https://ssd-api.jpl.nasa.gov/sbdb.api?des=4")
            .then(response => {
                console.log(response.data);
            })

        if (!mountRef.current || initializedRef.current) return;
        initializedRef.current = true;

        const WIDTH = mountRef.current.clientWidth;
        const HEIGHT = mountRef.current.clientHeight;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, WIDTH / HEIGHT, 0.1, 1000);
        camera.position.z = 15;

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
        scene.add(ambientLight);

        // Luzes adicionadas à câmera — ficam fixas na perspectiva do usuário
        const mainLight = new THREE.DirectionalLight(0xffffff, 2);
        mainLight.position.set(10, 3, 5);
        camera.add(mainLight); // <- câmera, não scene

        const backLight = new THREE.DirectionalLight(0x4466ff, 0.5);
        backLight.position.set(-5, -3, -5);
        camera.add(backLight); // <- câmera, não scene

        // Importante: adicionar a câmera à cena para as luzes funcionarem
        scene.add(camera);

        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setClearColor(0x000000, 0);
        renderer.setSize(WIDTH, HEIGHT);
        mountRef.current.appendChild(renderer.domElement);

        renderer.domElement.style.background = "transparent";

        // Inicializa o OrbitControls vinculado ao canvas e à câmera
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;     // suaviza o movimento
        controls.dampingFactor = 0.05;
        
        const textureLoader = new THREE.TextureLoader();

        // Esfera central (maior)
        const centralGeometry = new THREE.SphereGeometry(2, 32, 32);
        const centralTexture = textureLoader.load("/solar-texture.png");
        const centralMaterial = new THREE.MeshStandardMaterial({ map: centralTexture });
        const centralSphere = new THREE.Mesh(centralGeometry, centralMaterial);
        scene.add(centralSphere);

        // Pivot — objeto vazio no centro da esfera maior
        const pivot = new THREE.Object3D();
        scene.add(pivot);

        // Esfera orbitante (menor) — posicionada afastada do centro
        const orbitGeometry = new THREE.SphereGeometry(1, 24, 24);
        const orbitTexture = textureLoader.load("/moon-texture.png");
        const orbitMaterial = new THREE.MeshStandardMaterial({ map: orbitTexture });
        const orbitSphere = new THREE.Mesh(orbitGeometry, orbitMaterial);
        orbitSphere.position.set(10, 0, 0);
        pivot.add(orbitSphere);

        let animationId: number;
        const animate = () => {
        animationId = requestAnimationFrame(animate);

        controls.update();

        renderer.render(scene, camera);
        };
        animate();

        return () => {
        cancelAnimationFrame(animationId);
        controls.dispose();
        orbitTexture.dispose();
        centralMaterial.dispose();
        renderer.dispose();
        if (mountRef.current) {
            mountRef.current.removeChild(renderer.domElement);
        }
        };
    }, [])

    return <div ref={mountRef} className="w-full flex-1 bg-transparent" />;
}

export default Orbit;