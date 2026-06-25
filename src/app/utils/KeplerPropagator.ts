import type { OrbitalElements } from "./SbdbService";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Vec3 {
    x: number;
    y: number;
    z: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

/** Heliocentric gravitational constant [AU³/d²] */
const MU = 2.9591220828559e-4;

// ─── Kepler solver ────────────────────────────────────────────────────────────

/**
 * Solves the elliptic Kepler equation  E - e·sin(E) = M
 * using Newton-Raphson iteration.
 *
 * @param M  Mean anomaly [rad] — will be normalised to (-π, π]
 * @param e  Eccentricity [0, 1)
 * @param tol Convergence tolerance (default 1e-12)
 * @param maxIter Maximum iterations (default 30)
 * @returns Eccentric anomaly E [rad]
 */
export function solveKepler(
    M: number,
    e: number,
    tol = 1e-12,
    maxIter = 30
): number {
    // Normalise M to (-π, π]
    M = M - 2 * Math.PI * Math.floor((M + Math.PI) / (2 * Math.PI));

    // First-order initial guess
    let E = M + e * Math.sin(M);

    for (let k = 0; k < maxIter; k++) {
        const f = E - e * Math.sin(E) - M;
        const fPrime = 1 - e * Math.cos(E);
        const delta = f / fPrime;
        E -= delta;
        if (Math.abs(delta) < tol) return E;
    }

    // Return best estimate even if tolerance not met (very high-e edge case)
    return E;
}

// ─── Propagator ───────────────────────────────────────────────────────────────

/**
 * Propagates an asteroid's position from Keplerian elements to a heliocentric
 * ecliptic J2000.0 Cartesian vector at epoch t.
 *
 * Pipeline:  M(t) → E (Kepler) → perifocal (xP, yP) → Q rotation → (x, y, z) [AU]
 *
 * @param elements  Parsed orbital elements
 * @param t         Target epoch [Julian Day TDB]
 * @returns Heliocentric ecliptic J2000.0 position [AU]
 */
export function propagateOrbit(elements: OrbitalElements, t: number): Vec3 {
    const { a, e, i, Omega, omega, M0, t0 } = elements;

    // Mean motion [rad/d] — recalculated from a for self-consistency
    const n = Math.sqrt(MU / (a * a * a));

    // Mean anomaly at t
    const M = M0 + n * (t - t0);

    // Eccentric anomaly
    const E = solveKepler(M, e);

    // Perifocal coordinates (avoids computing true anomaly explicitly)
    const xP = a * (Math.cos(E) - e);
    const yP = a * Math.sqrt(1 - e * e) * Math.sin(E);

    // Precompute trig for the three Euler rotations
    const cO = Math.cos(Omega);
    const sO = Math.sin(Omega);
    const cw = Math.cos(omega);
    const sw = Math.sin(omega);
    const ci = Math.cos(i);
    const si = Math.sin(i);

    // Apply rotation matrix Q (first two columns only, since zP = 0)
    const x = (cO * cw - sO * ci * sw) * xP + (-cO * sw - sO * ci * cw) * yP;
    const y = (sO * cw + cO * ci * sw) * xP + (-sO * sw + cO * ci * cw) * yP;
    const z = si * sw * xP + si * cw * yP;

    return { x, y, z };
}

// ─── Orbit ellipse generator ──────────────────────────────────────────────────

/**
 * Generates N evenly-spaced points along the full orbit ellipse.
 * Sweeps E from 0 to 2π, applying the same Q rotation as propagateOrbit.
 *
 * @param elements  Parsed orbital elements
 * @param N         Number of sample points (default 360)
 * @returns Array of heliocentric ecliptic J2000.0 positions [AU]
 */
export function orbitEllipsePoints(elements: OrbitalElements, N = 360): Vec3[] {
    const { a, e, i, Omega, omega } = elements;

    const cO = Math.cos(Omega);
    const sO = Math.sin(Omega);
    const cw = Math.cos(omega);
    const sw = Math.sin(omega);
    const ci = Math.cos(i);
    const si = Math.sin(i);

    const points: Vec3[] = [];

    for (let k = 0; k <= N; k++) {
        const E = (2 * Math.PI * k) / N;

        const xP = a * (Math.cos(E) - e);
        const yP = a * Math.sqrt(1 - e * e) * Math.sin(E);

        const x = (cO * cw - sO * ci * sw) * xP + (-cO * sw - sO * ci * cw) * yP;
        const y = (sO * cw + cO * ci * sw) * xP + (-sO * sw + cO * ci * cw) * yP;
        const z = si * sw * xP + si * cw * yP;

        points.push({ x, y, z });
    }

    return points;
}

// ─── Julian Day helpers ───────────────────────────────────────────────────────

/**
 * Returns the current epoch as a Julian Day (TDB ≈ UTC for visualisation purposes).
 */
export function currentJulianDay(): number {
    // JD epoch: noon 1 Jan 4713 BC (proleptic Julian calendar)
    return Date.now() / 86_400_000 + 2_440_587.5;
}