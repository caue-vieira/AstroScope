// ─── Types ────────────────────────────────────────────────────────────────────

export interface SbdbElement {
    name: string;
    value: string;
    sigma: string | null;
    units: string | null;
    title: string;
    label: string;
}

export interface SbdbOrbit {
    epoch: string;
    elements: SbdbElement[];
    moid: string;
    moid_jup: string;
    condition_code: string;
    t_jup: string;
    rms: string;
    n_obs_used: number;
    data_arc: string;
    first_obs: string;
    last_obs: string;
    soln_date: string;
}

export interface SbdbObject {
    fullname: string;
    shortname: string;
    des: string;
    neo: boolean;
    pha: boolean;
    orbit_class: {
        code: string;
        name: string;
    };
    spkid: string;
    kind: string;
}

export interface SbdbResponse {
    orbit: SbdbOrbit;
    object: SbdbObject;
}

// ─── Parsed orbital elements (internal representation) ────────────────────────

export interface OrbitalElements {
    /** Semi-major axis [AU] */
    a: number;
    /** Eccentricity [dimensionless] */
    e: number;
    /** Inclination [rad] */
    i: number;
    /** Longitude of ascending node [rad] */
    Omega: number;
    /** Argument of perihelion [rad] */
    omega: number;
    /** Mean anomaly at epoch [rad] */
    M0: number;
    /** Epoch [Julian Day TDB] */
    t0: number;
    /** Minimum orbit intersection distance with Earth [AU] */
    moid: number;
    /** Orbital condition code (0 = best) */
    conditionCode: string;
    /** Orbital period [days] — derived from a via Kepler's 3rd law */
    period: number;
    /** Perihelion distance [AU] */
    q: number;
    /** Aphelion distance [AU] */
    ad: number;
}

// ─── Display metadata (non-kinematic info for cards) ─────────────────────────

export interface AsteroidInfo {
    fullname: string;
    shortname: string;
    designation: string;
    isNeo: boolean;
    isPha: boolean;
    orbitClass: string;
    moid: string;
    moidJup: string;
    conditionCode: string;
    tJup: string;
    rms: string;
    nObsUsed: number;
    dataArc: string;
    firstObs: string;
    lastObs: string;
    period: string;
    semiMajorAxis: string;
    eccentricity: string;
    inclination: string;
    perihelionDist: string;
    aphelionDist: string;
}

// ─── Gravitational constant [AU³/d²] ──────────────────────────────────────────

const MU = 2.9591220828559e-4;

// ─── Parser ───────────────────────────────────────────────────────────────────

/**
 * Receives a raw SBDB API response and extracts:
 * 1. OrbitalElements for kinematic propagation
 * 2. AsteroidInfo for UI display cards
 */
export function parseSbdbResponse(data: SbdbResponse): {
    elements: OrbitalElements;
    info: AsteroidInfo;
} {
    const DEG_TO_RAD = Math.PI / 180;

    // Build a lookup map: element name → numeric value
    const raw: Record<string, number> = {};
    for (const el of data.orbit.elements) {
        raw[el.name] = parseFloat(el.value);
    }

    const a = raw["a"];
    const e = raw["e"];

    // Derive period from semi-major axis via Kepler's 3rd law (days)
    const n = Math.sqrt(MU / (a * a * a)); // mean motion [rad/d]
    const period = (2 * Math.PI) / n;       // period [d]

    const elements: OrbitalElements = {
        a,
        e,
        i: raw["i"] * DEG_TO_RAD,
        Omega: raw["om"] * DEG_TO_RAD,
        omega: raw["w"] * DEG_TO_RAD,
        M0: raw["ma"] * DEG_TO_RAD,
        t0: parseFloat(data.orbit.epoch),
        moid: parseFloat(data.orbit.moid),
        conditionCode: data.orbit.condition_code,
        period,
        q: raw["q"],
        ad: raw["ad"],
    };

    const info: AsteroidInfo = {
        fullname: data.object.fullname,
        shortname: data.object.shortname,
        designation: data.object.des,
        isNeo: data.object.neo,
        isPha: data.object.pha,
        orbitClass: data.object.orbit_class.name,
        moid: parseFloat(data.orbit.moid).toFixed(6),
        moidJup: parseFloat(data.orbit.moid_jup).toFixed(3),
        conditionCode: data.orbit.condition_code,
        tJup: parseFloat(data.orbit.t_jup).toFixed(3),
        rms: parseFloat(data.orbit.rms).toFixed(2),
        nObsUsed: data.orbit.n_obs_used,
        dataArc: data.orbit.data_arc,
        firstObs: data.orbit.first_obs,
        lastObs: data.orbit.last_obs,
        period: period.toFixed(2),
        semiMajorAxis: a.toFixed(6),
        eccentricity: e.toFixed(6),
        inclination: raw["i"].toFixed(4),
        perihelionDist: raw["q"].toFixed(6),
        aphelionDist: raw["ad"].toFixed(6),
    };

    return { elements, info };
}