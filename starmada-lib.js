import { evaluate } from "mathjs";

const sampleWeaponConfig = {
    label: "Example Weapon Battery",
    range: [2,4,6],
    rate_of_fire: 1,
    accuracy_rating: 2,
    impact_rating: 1,
    damage_rating: 1,
    mount_size: 1,
    traits: []
}

const exampleShipConfig = {
    id: "",
    label: "",
    combat_rating: 0, // Calculated
    engine_rating: 1,
    shield_rating: 0,
    hull_track: [], // Calculated
    engine_track: [], // Calculated
    shield_track: [], // Calculated
    batteries: [],
    systems: []

}



const validateHullSize = (hullSize) => { 
    if(hullSize < 1) { throw new Error('Ship hull size must be greater than 0'); }
    if(hullSize > 35) { throw new Error('Ship hull size mus be 35 or less')}
    return hullSize; 
}

const validateShieldRating = (shieldRating) => { 
    if(shieldRating < 0) { throw new Error('Shield rating must be greater than 0'); }
    if(shieldRating > 5) { throw new Error('Shield rating cannot exceed 5')}
    return shieldRating; 
}

export function shipSpaceUnits(hullSize) { return hullSize * (hullSize + 30) * 5; }

export function engineFactor(hullSize) { return hullSize * (hullSize + 5) }
export function shieldFactor(hullSize) { return (hullSize + 4) * 9; }
export function shipFactors(hullSize) { return {
    shield_factor: shieldFactor(hullSize),
    engine_factor: engineFactor(hullSize),
    hull_size: hullSize,
}; }
export function engineSpaceUnits(hullSize, engineRating) { return engineFactor(hullSize) * engineRating; }
export function shieldSpaceUnits(hullSize, shieldRating) {  return shieldFactor(hullSize) * shieldRating; }
export function directionalShieldSpaceUnits(hullSize, directionalShieldRatings) {
    const A = 2 / (6-directionalShieldRatings.forward);
    const B = 1.5 / (6-directionalShieldRatings.port);
    const C = 1.5 / (6-directionalShieldRatings.starboard);
    const D = (6-directionalShieldRatings.aft);
    const equivalentShieldRating = 6 - (6 / (A + B + C + D));
    return shieldFactor(hullSize) * equivalentShieldRating;
}

export function directionalEquivalentShieldRating(hullSize, directionalShieldRatings) {}

export function getAccuracyFactor(accuracy_rating, traits) {

    if(traits.includes("defensive") || traits.includes("seeking")) {
        let accuracyFactor = 0.5;
        switch(accuracy_rating) {
            case 3: accuracyFactor = 0.4; break;
            case 4: accuracyFactor = 0.3; break;
            case 5: accuracyFactor = 0.2; break;
            case 6: accuracyFactor = 0.1; break;
            default: accuracyFactor = 0.50; break;
        }
        return accuracyFactor;
    }

    let accuracyFactor = 0.43;
    switch(accuracy_rating) {
        case 3: accuracyFactor = 0.35; break;
        case 4: accuracyFactor = 0.25; break;
        case 5: accuracyFactor = 0.15; break;
        case 6: accuracyFactor = 0.10; break;
        default: accuracyFactor = 0.43; break;
    }
    return accuracyFactor;
}

export function weaponBaseSpaceUnitsFromConfig(config) {
    return weaponBaseSpaceUnits(
        (config.type == "seeking" ? config.movement_allowance : config.range[2]),
        config.rate_of_fire,
        config.accuracy,
        config.impact,
        config.damage,
        config._relative_tech_level,
        config.traits,
        config.type,
        config.mount_size || 1,
        config._ship_trait_multiplier || 1
    )
}
export function weaponBaseSpaceUnits(maxRange, rateOfFire, accuracy_rating, impact_rating, damage_rating, relativeTechLevel = 0, traits = [], type = "standard", mount_size = 1, shipTraitMultiplier = 1) {

    if(traits.includes("volatile") && rateOfFire !== 1) { throw new Error('Volatile batteries cannot have a rate of fire of greater than 1')}
    if(traits.includes("scatter") && impact_rating !== 1) { throw new Error('Scatter batteries cannot have an impact rating of greater than 1')}
    if(traits.includes("telescopic") && impact_rating !== 1) { throw new Error('Telescopic batteries cannot have an impact rating of greater than 1')}
    if(type == "seeking" && traits.includes("defensive")) { throw new Error('Seeking weapons cannot take the defensive trait'); }
    if(traits.includes("ballistic") && traits.includes("defensive")) { throw new Error('Ballistic weapons cannot be defensive'); }
    if(traits.includes("catastophic") && traits.includes("incapacitating")) { throw new Error('Catastrophic Weapons cannot be incapacitating'); }
    if(traits.includes("expendable") && traits.includes("slow")) { throw new Error('Expendable weapons cannot be slow'); }
    if(traits.includes("non_piercing") && traits.includes("piercing_1")) { throw new Error('Non-piercing weapons cannot be piercing (piercing_1)'); }
    if(traits.includes("non_piercing") && traits.includes("piercing_2")) { throw new Error('Non-piercing weapons cannot be piercing (piercing_2)'); }
    
    let accuracyFactor = getAccuracyFactor(accuracy_rating, [...traits, type]);
    let suReq = maxRange * rateOfFire * accuracyFactor * (impact_rating + 0.25) * (damage_rating + 0.60);

    let rangeTraits = traits.filter(trait => weaponTraitConfigs[trait].type == "range").sort();
    let nonRangeTraits = traits.filter(trait => weaponTraitConfigs[trait].type !== "range");
    if(rangeTraits.length > 2) { throw new Error('Weapons cannot have more than 2 range based traits'); }

    // Trait Multiplers are applied Before Seeking / Defensive Additions ...
    nonRangeTraits.filter((t) => !["accurate", "expendable", "slow"].includes(t)).map((trait) => { 
        suReq *= weaponTraitConfigs[trait]?.baseModifier || 1; 
    })

    // Range Trait Multipliers
    if(rangeTraits.length == 1) { suReq *= weaponTraitConfigs[rangeTraits[0]]?.baseModifier || 1; }
    if(rangeTraits.length == 2) { 
        if(weaponTraitConfigs[rangeTraits[0]].jointModifiers[rangeTraits[1]] === null) { throw new Error('Invalid range trait combination'); }
        suReq *= weaponTraitConfigs[rangeTraits[0]].jointModifiers[rangeTraits[1]] || 1; 
    }

    // Seeking Addition
    if(type == "seeking" ) { 
        suReq += (maxRange * rateOfFire / 3); 
    }
    
    // Defensive Addition
    if(nonRangeTraits.includes("defensive")) { 
        suReq += (rateOfFire * accuracyFactor * 2); 
    }

    // ... Except Accurate, Expendable, and Slow
    nonRangeTraits.filter((t) => ["accurate", "expendable", "slow"].includes(t)).map((trait) => { suReq *= weaponTraitConfigs[trait]?.baseModifier || 1; })
    
    // Apply Mount Size Multipler
    let mountSizeMultiplier = 1;
    switch(mount_size) {
        case 2: mountSizeMultiplier = 1.5; break;
        case 3: mountSizeMultiplier = 2; break;
        case 4: mountSizeMultiplier = 2.5; break;
    }

    // Round to Nearest Tenth
    return Math.round((suReq * mountSizeMultiplier * shipTraitMultiplier * techLevelModifier(relativeTechLevel) * 10)) / 10;
}

export function weaponBankSpaceUnits(weaponBSU, weaponCount, arcCount) { 
    return Math.ceil(weaponBSU * weaponCount * (arcCount + 1)); 
}

export function shipWeaponsSUTotal (batteries, systems, weapons_tech_level, addonSystems = {}) {
    return batteries.reduce((weaponsTotal, battery) => {
        let shipTraitMultiplier = systems.reduce((shipMultiplier, systemKey) => {
            let systemConfig = { ...addonSystems, ...shipSystemsConfigs }[systemKey];
            if(typeof systemConfig.su == "string" && `${systemConfig.su}`.startsWith("*")) { return shipMultiplier * parseFloat(systemConfig.su.slice(1)); }
            return shipMultiplier;
        }, 1);
        let weaponBaseSU = weaponBaseSpaceUnitsFromConfig({...battery.config, _relative_tech_level: weapons_tech_level, _ship_trait_multiplier: shipTraitMultiplier });
        let batterySUTotal = Object.keys(battery.banks).reduce((batteryTotal, bankKey) => {
            let bankSize = battery.banks[bankKey];
            let bankArcCount = bankKey.length;
            return batteryTotal + weaponBankSpaceUnits(weaponBaseSU, bankSize, bankArcCount);
        }, 0);
        return weaponsTotal + batterySUTotal;
    }, 0)
}

export function shipORATTotal (batteries, systems, shipFactors, addonSystems = {}) {
    let batteriesORAT = batteries.reduce((shipORAT, battery) => {
        let shipTraitMultiplier = systems.reduce((shipMultiplier, systemKey) => {
            let systemConfig = { ...addonSystems, ...shipSystemsConfigs }[systemKey];
            if(typeof systemConfig.su == "string" && `${systemConfig.su}`.startsWith("*")) { return shipMultiplier * parseFloat(systemConfig.su.slice(1)); }
            return shipMultiplier;
        }, 1);
        let weaponBaseSU = weaponBaseSpaceUnitsFromConfig({...battery.config, _relative_tech_level: shipFactors.tech_level, _ship_trait_multiplier: shipTraitMultiplier });
        let batteryORATTotal = Object.keys(battery.banks).reduce((batteryTotal, bankKey) => {
            let bankSize = battery.banks[bankKey];
            let bankArcCount = bankKey.length;
            let bankSUTotal = weaponBankSpaceUnits(weaponBaseSU, bankSize, bankArcCount);
            let longRange = (battery.type == "seeking" ? battery.config.movement_allowance : battery.config.range[2]);
            let bankORAT = weaponBankORAT(bankSUTotal, shipFactors.engine_rating, longRange);
            return batteryTotal + bankORAT;
        }, 0);
        
        return shipORAT + batteryORATTotal;
    }, 0)

    let shipTraitsORAT = Object.keys(systems).reduce((traitOratSum, systemKey) => {
        let traitConfig = { ...addonSystems, ...shipSystemsConfigs }[systemKey];
        let systemCount = systems[systemKey];
        if(typeof traitConfig.orat === "string") { traitOratSum += evaluate(traitConfig.orat, { ...shipFactors, flight_count: systemCount, capacity: systemCount, system_count: systemCount }) }
        if(typeof traitConfig.orat === "number") { traitOratSum += traitConfig.orat; }
        return traitOratSum;
    }, 0)

    return batteriesORAT + shipTraitsORAT;
}

export function shipSystemsSUTotal (systems, hull_size, shield_rating, engine_rating, addonSystems = {}) { 
    return Object.keys(systems).reduce((systemsTotal, systemKey) => {
        let systemConfig = { ...addonSystems, ...shipSystemsConfigs }[systemKey];
        let systemCount = systems[systemKey];
        let factors = {...shipFactors(hull_size), engine_rating: engine_rating, shield_rating: shield_rating, flight_count: systemCount, capacity: systemCount, system_count: systemCount };
        if(typeof systemConfig.su == "function") { return systemsTotal + systemConfig.su(factors); }
        if(typeof systemConfig.su == "number") { return systemsTotal + (systemConfig.su * systemCount); }
        if(typeof systemConfig.su == "string") { 
            if(`${systemConfig.su}`.startsWith("*")) { return systemsTotal; }
            return systemsTotal + evaluate(systemConfig.su, factors); 
        }
        return systemsTotal;
    }, 0)
}

export function weaponBankORAT(bankSU, engineRating, maxRange) {
    return bankSU * (engineRating + maxRange) / maxRange;
}

export function combatRating(orat, drat) { return Math.ceil(Math.pow(orat * drat, 0.5)); }

export function shipDRAT(systems, factors, addonSystems = {}) { 
    let shipDRATMultiplier = 1;
    let systemDRATTotal = Object.keys(systems).reduce((systemsTotal, systemKey) => {
        let systemConfig = { ...addonSystems, ...shipSystemsConfigs }[systemKey];
        let systemCount = systems[systemKey];
        if(typeof systemConfig.drat == "function") { return systemsTotal + systemConfig.drat(factors); }
        if(typeof systemConfig.drat == "number") { return systemsTotal + (systemConfig.drat * systemCount); }
        if(typeof systemConfig.drat == "string") { 
            if(`${systemConfig.drat}`.startsWith("*")) { 
                shipDRATMultiplier *= parseFloat(systemConfig.drat.slice(1)); 
                return systemsTotal; 
            }
            return systemsTotal + evaluate(systemConfig.drat, {...factors, flight_count: systemCount, capacity: systemCount, system_count: systemCount }); 
        }
        return systemsTotal;
    }, factors.hull_size * 12 / (6-factors.shield_rating))
    return systemDRATTotal * shipDRATMultiplier; 

}

export const ballisticCombinationModifiers = {
    "carronade": 0.5,
    "diffuse": 0.6,
    "focused": 1.1,
    "guided": 0.9,
    "scatter": 1.1,
    "telescopic": 1.7
}

export const carronadeCombinationModifiers = {
    "diffuse": 0.9,
    "focused": 0.7,
    "guided": 0.8,
    "scatter": 1.8,
    "telescopic": 1.2
}

export const diffuseCombinationModifiers = {
    "focused": 1.4,
    "scatter": 1.7,
    "telescopic": 1.5,
    "guided": null
}

export const focusedCombinationModifiers = {
    "scatter": 1.8,
    "telescopic": 2.8,
    "guided": null
}

export const guidedCombinationModifiers = {
    "scatter": 1.7,
    "telescopic": 2.3
}

export const scatterCombinationModifiers = {
    "telescopic": null
}


export const weaponTraitConfigs = {
    "accurate" : { baseModifier: 1.3, type: "fire-control" },
    "ballistic" : { baseModifier: 0.8, jointModifiers: ballisticCombinationModifiers, type: "range" },
    "carronade" : { baseModifier: 0.8, jointModifiers: carronadeCombinationModifiers, type: "range" },
    "catastrophic" : { baseModifier: 2.0, type: "damage" },
    "deadly": { baseModifier: 2.0, type: "damage" },
    "defensive": { baseModifier: 1.0, type: "fire-control" },
    "diffuse": { baseModifier: 0.9, jointModifiers: diffuseCombinationModifiers, type: "range" },
    "disruptive": { baseModifier: 2.0, type: "damage" },
    "expendable": { baseModifier: 0.2, type: "misc" },
    "fire_linked": { baseModifier: 1.0, type: "fire-control" },
    "focused": { baseModifier: 1.3, jointModifiers: focusedCombinationModifiers, type: "range" },
    "guided": { baseModifier: 1.1, jointModifiers: guidedCombinationModifiers, type: "range" },
    "incapacitating": { baseModifier: 0.7, type: "damage" },
    "kinetic": { baseModifier: 3.0, type: "damage" },
    "modulating": { baseModifier: 2.5, type: "misc" },
    "non_piercing": { baseModifier: 0.7, type: "misc" },
    "piercing_1": { baseModifier: 1.5, type: "misc" },
    "piercing_2": { baseModifier: 2.0, type: "misc" },
    "proximity": { baseModifier: 2.0, type: "misc" },
    "repeating": { baseModifier: 1.4, type: "fire-control" },
    "scatter": { baseModifier: 1.7, jointModifiers: scatterCombinationModifiers, type: "range" },
    "slow": { baseModifier: 0.6, type: "fire-control" },
    "telescopic": { baseModifier: 1.9, type: "range" },
    "volatile": { baseModifier: 3.0, type: "misc" },
}

export const weaponTraitLabels = {
    "accurate" : { label: "Accurate", short_code: "Acr" },
    "ballistic" : { label: "Ballistic" , short_code: "Bls" },
    "carronade" : { label: "Carronade" , short_code: "Crn" },
    "catastrophic" : { label: "Catastrophic" , short_code: "Cts" },
    "deadly" : { label: "Deadly", short_code: "Dly" },
    "defensive": { label: "Defensive", short_code: "Dfn" },
    "diffuse" : { label: "Diffuse", short_code: "Dfs" },
    "disruptive" : { label: "Disruptive", short_code: "Dsr" },
    "expendable" : { label: "Expendable", short_code: "Exp" },
    "fire_linked" : { label: "Fire-Linked", short_code: "FrL" },
    "focused" : { label: "Focused", short_code: "Fcs" },
    "guided" : { label: "Guided", short_code: "Gid" },
    "incapacitating" : { label: "Incapacitating", short_code: "Inc" },
    "kinetic" : { label: "Kinetic", short_code: "Knt" },
    "modulating" : { label: "Modulating", short_code: "Mdl" },
    "non_piercing" : { label: "Non-piercing", short_code: "NPr" },
    "piercing_1" : { label: "Piercing-1", short_code: "Pr1" },
    "piercing_2" : { label: "Piercing-2", short_code: "Pr2" },
    "proximity" : { label: "Proximity", short_code: "Prx" },
    "repeating" : { label: "Repeating", short_code: "Rpt" },
    "scatter" : { label: "Scatter", short_code: "Sct" },
    "slow" : { label: "Slow", short_code: "Slw" },
    "telescopic" : { label: "Telescopic", short_code: "Tls" },
    "volatile" : { label: "Volatile", short_code: "Vlt" },
}

export const shipSystemsConfigs = {
    "anti-fighter-batteries": { 
        label: "Anti-Fighter Batteries", 
        tech: "shields",
        type: "trait", 
        su: "shield_factor", 
        orat: false,
        drat: "*1.2"
    },
    "aux-services": { 
        label: "Auxilliary Services", 
        tech: "n/a",
        type: "trait", 
        su: "capacity * 50", 
        orat: false,
        drat: false
    },
    "boosters": { 
        label: "Boosters", 
        tech: "engines",
        type: "munition", 
        su: "engine_factor * 0.5", 
        orat: 0,
        drat: false
    },
    "carrier": { 
        label: "Carrier", 
        tech: "fighter",
        type: "trait", 
        su: "flight_count * 50", 
        orat: "flight_count * 25",
        drat: "flight_count * 10"
    },
    "launch-tubes": { 
        label: "Launch Tubes", 
        tech: "fighter",
        type: "trait", 
        su: "flight_count * 10", 
        orat: "flight_count * 50",
        drat: false
    },
    "cloaking": { 
        label: "Cloaking", 
        tech: "shields",
        type: "trait", 
        su: "shield_factor * 3", 
        orat: false,
        drat: "*2.0"
    },
    "countermeasures": { 
        label: "Countermeasures", 
        tech: "shields",
        type: "equipment", 
        su: "shield_factor * 2",
        orat: false,
        drat: "*1.5"
    },
    "fire-control": { 
        label: "Fire Control", 
        tech: "weapons",
        type: "equipment", 
        su: "*1.3", 
        orat: "*1.3",
        drat: false
    },
    "flares": { 
        label: "Flares", 
        tech: "weapons",
        type: "munitions", 
        su: 5, 
        orat: "(engine_rating + 10) * 0.5",
        drat: false
    },
    "hyperdrive": { 
        label: "Hyperdrive", 
        tech: "engines",
        type: "equipment", 
        su: "engine_factor", 
        orat: false,
        drat: "*1.2"
    },
    "ionized-hull": { 
        label: "Ionized Hull", 
        tech: "shields",
        type: "trait", 
        su: "shield_factor * 2", 
        orat: false,
        drat: "*1.5"
    },
    "long-range-sensors": { 
        label: "Long Range Sensors", 
        tech: "weapons",
        type: "equipment", 
        su: 0.5, 
        orat: 0.5,
        drat: false
    },
    "marines": { 
        label: "Marines", 
        tech: "weapons",
        type: "munition", 
        su: 10, 
        orat: "(engine_rating + 5) * 2",
        drat: 1
    },
    "mines": { 
        label: "Mines", 
        tech: "fighter",
        type: "munition", 
        su: 5, 
        orat: 25,
        drat: 1
    },
    "overthrusters": { 
        label: "Overthrusters", 
        tech: "engines",
        type: "equipment", 
        su: "engine_factor", 
        orat: 0,
        drat: "*1.3"
    },
    "probes": { 
        label: "Probes", 
        tech: "fighter",
        type: "munition", 
        su: 5, 
        orat: "engine_rating + 6",
        drat: false
    },
    "shockwave": { 
        label: "Shockwave", 
        tech: "shields",
        type: "trait", 
        su: "shield_rating * 100", 
        orat: "shield_rating * (engine_rating + 3) * 33",
        drat: false
    },
    "shuttlecraft": { 
        label: "Shuttlecraft", 
        tech: "fighter",
        type: "munition", 
        su: 10, 
        orat: 50,
        drat: 2
    },
    "solar-sails": { 
        label: "Solar Sails", 
        tech: "n/a",
        type: "trait", 
        su: false, 
        orat: false,
        drat: false
    },
    "stealth": { 
        label: "Stealth", 
        tech: "shields",
        type: "equipment", 
        su: "shield_factor", 
        orat: false,
        drat: "*1.2"
    },
    "stutter-drive": { 
        label: "Stutter Drive", 
        tech: "engines",
        type: "equipment", 
        su: "engine_factor * engine_rating * 0.5", 
        orat: 0.5,
        drat: false
    },
    "tractor-beam": { 
        label: "Tractor Beam", 
        tech: "weapons",
        type: "equipment", 
        su: 3, 
        orat: "(engine_rating + 1) * 3",
        drat: false
    },
}


export function techLevelModifier(techLevel) {
    switch(techLevel) {
        case -2: return 2;
        case -1: return 1.4;
        case 1: return 0.7;
        case 2: return 0.5;
        default: return 1;
    }
}
