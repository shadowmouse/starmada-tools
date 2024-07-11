import { evaluate } from "mathjs";

const roundToPrecision = (value, precision) => {
    return Math.round(value * Math.pow(10, precision)) / Math.pow(10, precision);
}

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

export const validateHullSize = (hullSize) => { 
    if(hullSize < 1) { throw new Error('Ship hull size must be greater than 0'); }
    if(hullSize > 24) { throw new Error('Ship hull size mus be 35 or less')}
    return hullSize; 
}

export function calculateDesignAttributes (hullSize, engineRating, batteries, systems, techLevels) {
    let spaceUnits = shipSpaceUnits(hullSize);
    let baseEngineFactor = engineFactor(hullSize);
    let baseEngineSpaceUnits = baseEngineFactor * engineRating;
    let weaponSpaceUnits = shipWeaponsSUTotal(batteries, systems, (typeof techLevels == "object" ? (techLevels?.weapons || 0) : techLevels))
    let systemsSpaceUnits = shipSystemsSUTotal(systems, hullSize, baseEngineFactor, engineRating, weaponSpaceUnits)

    let effectiveEngineRatingMultiplier = 1;
    let effectiveEngineRatingAdditions = Object.keys(systems).reduce((ratingSum, systemKey) => {
        let system = shipSystemsConfigs[systemKey];
        if(system.erm !== false) {
            if(`${system.erm}`.startsWith("*")) {  
                effectiveEngineRatingMultiplier *= evaluate(`${system.erm}`.slice(1), { system_count: systems[systemKey] });
                return ratingSum; 
            }
            let systemEngineRatingAddition = evaluate(`${system.erm}`, { system_count: systems[systemKey], engine_rating: engineRating });
            return ratingSum + systemEngineRatingAddition;
        }
        return ratingSum;
    }, 0)

    let factors = { 
        engine_factor: baseEngineFactor,
        engine_rating: engineRating,
        hull_size: hullSize, 
        fighter_tech_level: (typeof techLevels == "object" ? (techLevels?.fighter || 0) : techLevels),
        defense_tech_level: (typeof techLevels == "object" ? (techLevels?.defense || 0) : techLevels),
        weapon_tech_level: (typeof techLevels == "object" ? (techLevels?.weapon || 0) : techLevels),
        engine_tech_level: (typeof techLevels == "object" ? (techLevels?.engine || 0) : techLevels)
    };

    let effectiveEngineRating = (engineRating + effectiveEngineRatingAdditions) * effectiveEngineRatingMultiplier;

    let shipORATValue = shipORATTotal(batteries, systems, {...factors, effective_engine_rating: effectiveEngineRating });
    let shipDRATValue = shipDRAT(systems, factors);

    let effectiveHullSizeMultiplier = 1;
    let effectiveHullSizeAdditions = Object.keys(systems).reduce((ratingSum, systemKey) => {
        let system = shipSystemsConfigs[systemKey];
        if(system.hsm !== false) {
            if(`${system.hsm}`.startsWith("*")) {  
                effectiveHullSizeMultiplier *= evaluate(`${system.hsm}`, { system_count: systems[systemKey], hull_size: hullSize })
                return ratingSum; 
            }
            let systemHullSizeAddition = evaluate(`${system.hsm}`,  { hull_size: hullSize, drat: shipDRATValue, system_count: systems[systemKey], engine_rating: engineRating });
            return ratingSum + systemHullSizeAddition;
        }
        return ratingSum;
        
    }, 0)

    let effectiveHullSize = (hullSize + effectiveHullSizeAdditions) * effectiveHullSizeMultiplier;

    let shipCombatRating = combatRating(shipORATValue, shipDRATValue, effectiveHullSize);

    let attributes = {
        max_su: spaceUnits,
        engines_su: baseEngineSpaceUnits,
        weapons_su: weaponSpaceUnits,
        systems_su: systemsSpaceUnits,
        factors: factors,
        orat: shipORATValue,
        drat: shipDRATValue,
        combat_value: shipCombatRating,
        hull_size: hullSize,
        effective_hull_size: effectiveHullSize,
        effective_engine_rating: effectiveEngineRating
    }

    return attributes;
}

export function shipSpaceUnits(hullSize) { return hullSize * 100; }

export function engineFactor(hullSize) { return (hullSize * (hullSize + 50)) / 10; }
export function engineSpaceUnits(hullSize, engineRating) { return Math.ceil(engineFactor(hullSize) * engineRating); }
export function effectiveEngineRating(base_engine_rating, systems  = {}, customConfigs = {}) {
    let effectiveEngineRating = base_engine_rating;
    Object.keys(systems).map((systemKey) => {
        let systemConfig = {...customConfigs, ...shipSystemsConfigs}[systemKey];
        let systemCount = systems[systemKey];
        if(typeof systemConfig.erm == "number") { effectiveEngineRating += (systemConfig.erm * systemCount); }
        if(typeof systemConfig.erm == "string") { 
            effectiveEngineRating += evaluate(systemConfig.erm, { engine_rating: base_engine_rating, system_count: system_count }); 
        }
    })
    return effectiveEngineRating;
}


export function weaponRelativeBandWeight(range, prevRange) {
    return (range * (range + 4)) - (prevRange * (prevRange + 4))
}

export function weaponBandStrength(weight, rate_of_fire, accuracy, damage) {
   return weight * rate_of_fire * (7 - accuracy) * damage;
}

export function weaponBaseStrength(bands) {
    let sorted_bands = bands.sort((a, b) => a.range - b.range);
    let relative_band_weights = sorted_bands.map((band, index, source) => {
        let prevBand = source[index - 1];
        let prevRange = 0;
        if(prevBand !== undefined) { prevRange = prevBand?.range || 0; }
        let range = band.range;
        return weaponRelativeBandWeight(range, prevRange);
    })

    let band_strengths = relative_band_weights.map((weight, index) => {
        let band = sorted_bands[index];
        return weaponBandStrength(weight, band.rate_of_fire, band.accuracy, band.damage); // weight * band.rate_of_fire * (7 - band.accuracy) * band.damage;
    })

    return band_strengths.reduce((sum, value) => sum + value, 0);
}

export function weaponBaseSpaceUnitsFromConfig(config = { bands: [{
    range: 1,
    rate_of_fire: 1,
    accuracy: 2,
    damage: 1
}], traits: [] }) {
    
    let weaponStrength = weaponBaseStrength(config.bands);
    
    let traitMultiplier = config.traits.reduce((tv, traitKey) => {
        return tv * weaponTraitConfigs[traitKey].multiplier;
    }, 1)
    
    let modifiedStrength = weaponStrength * traitMultiplier;
    
    let sorted_bands = config.bands.sort((a, b) => a.range - b.range);
    let maxRange = sorted_bands[sorted_bands.length - 1].range;
    let baseSpaceRequirements = modifiedStrength * 0.10 / (maxRange + 4);
    return parseFloat(baseSpaceRequirements.toFixed(2));
}


export function weaponBankSpaceUnits(weaponBSU, weaponCount, arcCount, munition_count = 0) {
    let munition_count_factors = [1, 0.3, 0.4, 0.5, 0.6];
    return parseFloat(((((weaponBSU * weaponCount * (arcCount + 2)) * munition_count_factors[munition_count]) * 10) / 10).toFixed(2)); 
}

export function shipWeaponsSUTotal (batteries, weapons_tech_level) {
    let shipWeaponsSUTotal = batteries.reduce((weaponsTotal, battery) => {
        let weaponBaseSU = weaponBaseSpaceUnitsFromConfig({ ...battery.config });
        let batterySUTotal = Object.keys(battery.banks).reduce((batteryTotal, bankKey) => {
            let bankSize = battery.banks[bankKey];
            let bankArcCount = bankKey.split("").filter((arcKey) => !["Z", "Y"].includes(`${arcKey}`.toLocaleUpperCase())).length;
            let bankSpaceUnits = weaponBankSpaceUnits(weaponBaseSU, bankSize, bankArcCount, battery.config.munition_count)
            return batteryTotal + bankSpaceUnits;
        }, 0);
        console.log("SWSU - ", batterySUTotal);
        return weaponsTotal + batterySUTotal;
    }, 0)
    return shipWeaponsSUTotal;
}

export function shipORATTotal (batteries, systems, shipFactors, addonSystems = {}) {
    let batteriesORAT = batteries.reduce((shipORAT, battery) => {
        let wbsu = weaponBaseSpaceUnitsFromConfig(battery.config)
        let maxRange = 0;
        let batterySpaceUnits = Object.keys(battery.banks).reduce((batterySize, bankKey) => {
            let range = battery.config.bands.at(-1).range;
            if(range > maxRange) { maxRange = range; }
            let bankArcCount = bankKey.split("").filter((arcKey) => !["Z", "Y"].includes(`${arcKey}`.toLocaleUpperCase())).length;
            return batterySize + weaponBankSpaceUnits(wbsu, battery.banks[bankKey], bankArcCount, battery.config.munition_count)
        }, 0)
        console.log("BSU - ", battery.config.name, wbsu, batterySpaceUnits, battery.config)
        let batteryORAT = (batterySpaceUnits * (shipFactors.effective_engine_rating + maxRange)) * 0.1;
        return shipORAT + batteryORAT;
    }, 0)


    let shipTraitsORAT = Object.keys(systems).reduce((traitOratSum, systemKey) => {
        let traitConfig = { ...addonSystems, ...shipSystemsConfigs }[systemKey];
        let systemCount = systems[systemKey];
        if(typeof traitConfig.orat === "string") { 
            traitOratSum += evaluate(traitConfig.orat, { ...shipFactors, 
                flight_count: systemCount, 
                capacity: systemCount, 
                system_count: systemCount, 
                weapons_orat: batteriesORAT
            }) 
        }
        if(typeof traitConfig.orat === "number") { 
            traitOratSum += traitConfig.orat; }
        return traitOratSum;
    }, 0)
    
    return batteriesORAT + shipTraitsORAT;
}

export function shipSystemsSUTotal (systems, hull_size, engine_factor, engine_rating, ship_weapons_space, addonSystems = {}) { 
    let systemsSUMultiplier = 1;
    let shipSystemSU = Object.keys(systems).reduce((systemsTotal, systemKey) => {
        let systemConfig = { ...addonSystems, ...shipSystemsConfigs }[systemKey];
        let systemCount = systems[systemKey];
        let factors = { hull_size: hull_size, system_count: systemCount, engine_factor: engine_factor, engine_rating: engine_rating, weapons_su: ship_weapons_space };
        if(systemConfig.su !== false) { 
            if(`${systemConfig.su}`.startsWith("*")) { 
                systemsSUMultiplier *= parseFloat(`${systemConfig.su}`.slice(1))
                return systemsTotal;
            }
            let systemSU = evaluate(`${systemConfig.su}`, factors);
            return systemsTotal + systemSU; 
        }
        return systemsTotal;
    }, 0)
    return shipSystemSU * systemsSUMultiplier; 
}

export function weaponBankORAT(bankSU, engineRating, maxRange) {
    return bankSU * (engineRating + maxRange) / maxRange;
}

export function combatRating(orat, drat, effective_hull_size) { 
    return Math.ceil(Math.sqrt(orat * drat * effective_hull_size)); 
}

export function shipDRAT(systems, addonSystems = {}) { 
    let screenDRATMultiplier = 0;
    let shipDRATValue = Object.keys(systems).reduce((shipDRAT, systemKey) => {
        let systemConfig = { ...addonSystems, ...shipSystemsConfigs }[systemKey];
        let systemCount = systems[systemKey];
        if(systemKey.includes("screen")) {
            let screenDirectionalDRATValues = {
                "forward" : [0.33, 0.5, 0.67, 1],
                "port" : [0.25, 0.38, 0.50, 0.75],
                "starboard" : [0.25, 0.38, 0.50, 0.75],
                "aft" : [0.17, 0.24, 0.33, 0.5]
            }
            let direction = systemKey.split("-")[1];
            screenDRATMultiplier += screenDirectionalDRATValues[direction][systemCount];
            return shipDRAT;
        }
        if(typeof systemConfig.drat == "string") { 
            return evaluate(`${systemConfig.drat}`, { system_count: systemCount, drat: shipDRAT }); 
        }
        return shipDRAT;
    }, 1)
    return Math.round((shipDRATValue * screenDRATMultiplier) * 100) / 100; 
}

export const weaponTraitConfigs = {
    "accurate" : { multiplier: 1.2, label: "Accurate", short_code: "Acr", prohibited: [] },
    "bursting" : { multiplier: 2, label: "Bursting", short_code: "Bst", prohibited: [] },
    "catastrophic" : { multiplier: 3.5, label: "Catastrophic" , short_code: "Cts", prohibited: ["volatile"] },
    "chain-fire" : { multiplier: 1.5, label: "Chain Fire" , short_code: "Cfr", prohibited: ["salvo-fire"] },
    "crushing" : { multiplier: 3, label: "Crushing" , short_code: "Crsh", prohibited: [] },
    "cutting" : { multiplier: 1.4, label: "Cutting" , short_code: "Ctg", prohibited: ["sweeping"] }, 
    "defensive" : { multiplier: 1, label: "Defensive" , short_code: "Dfs", prohibited: ["seeker"] },
    "disruptive" : { multiplier: 2, label: "Disruptive" , short_code: "Dis", prohibited: [""] },
    "enveloping" : { multiplier: 1.2, label: "Enveloping" , short_code: "Env", prohibited: [] },
    "fusillade-1" : { multiplier: 1.5, label: "Fusillade" , short_code: "Fl1", prohibited: ["overload", "overload-2", "overload-3"] },
    "fusillade-2" : { multiplier: 2, label: "Fusillade 2" , short_code: "Fl2", prohibited: ["overload", "overload-2", "overload-3"] },
    "fusillade-3" : { multiplier: 3, label: "Fusillade 3" , short_code: "Fl3", prohibited: ["overload", "overload-2", "overload-3"] },
    "impact" : { multiplier: 1.33, label: "Impact" , short_code: "Imp1", prohibited: [] },
    "impact2" : { multiplier: 1.67, label: "Impact 2" , short_code: "Imp2", prohibited: [] },
    "impact2" : { multiplier: 2.33, label: "Impact 3" , short_code: "Imp3", prohibited: [] },
    "incapacitating" : { multiplier: 0.7, label: "Incapacitating" , short_code: "Inc", prohibited: [] },
    "non-phasing" : { multiplier: 0.8, label: "Non-Phasing" , short_code: "Nph", prohibited: ["phasing", "phasing-2", "phasing-3"] },
    "non-piercing" : { multiplier: 0.77, label: "Non-Phasing" , short_code: "Nph", prohibited: ["piercing-auto", "piercing-4", "piercing-6", "resonant", "semi-piercing"] },
    "overload" : { multiplier: 1.5, label: "Overload" , short_code: "Ol1", prohibited: ["fusillade-1", "fusillade-2", "fusillade-3"] },
    "overload-2" : { multiplier: 2, label: "Overload 2" , short_code: "Ol2", prohibited: ["fusillade-1", "fusillade-2", "fusillade-3"] },
    "overload-3" : { multiplier: 3, label: "Overload 3" , short_code: "COl3", prohibited: ["fusillade-1", "fusillade-2", "fusillade-3"] },
    "phasing" : { multiplier: 1.27, label: "Phasing" , short_code: "Ph1", prohibited: ["non-phasing"] },
    "phasing-2" : { multiplier: 1.53, label: "Phasing 2" , short_code: "Ph2", prohibited: ["non-phasing"] },
    "phasing-3" : { multiplier: 1.8, label: "Phasing 3" , short_code: "Ph3", prohibited: ["non-phasing"] },
    "piercing-auto" : { multiplier: 1.67, label: "Piercing Auto" , short_code: "PrA", prohibited: ["resonant", "semi-piercing", "non-piercing"] },
    "piercing-4" : { multiplier: 1.33, label: "Piercing 4" , short_code: "Pr4", prohibited: ["resonant", "semi-piercing", "non-piercing"] },
    "piercing-6" : { multiplier: 1.13, label: "Piercing 5" , short_code: "Pr5", prohibited: ["resonant", "semi-piercing", "non-piercing"] },
    "pinpoint" : { multiplier: 1.5, label: "Pinpoint" , short_code: "Pin", prohibited: [] },
    "proximity" : { multiplier: 2, label: "Proximity" , short_code: "Prx", prohibited: [] },
    "repeating-4" : { multiplier: 2, label: "Repeating-4" , short_code: "Rp4", prohibited: ["chain-fire", "retargeting", "salvo-fire"] },
    "repeating-5" : { multiplier: 1.5, label: "Repeating-5" , short_code: "Rp5", prohibited: ["chain-fire", "retargeting", "salvo-fire"] },
    "repeating-6" : { multiplier: 1.2, label: "Repeating-6" , short_code: "Rp6", prohibited: ["chain-fire", "retargeting", "salvo-fire"] },
    "resonant" : { multiplier: 1.33, label: "Resonant" , short_code: "Res", prohibited: ["piercing", "semi-piercing", "non-piercing"] },
    "retargeting" : { multiplier: 1.5, label: "Retargeting" , short_code: "Rtg", prohibited: ["repeating", "chain-fire", "salvo-fire"] },
    "restricted" : { multiplier: 1, label: "Restricted" , short_code: "Rs1", prohibited: [] },
    "restricted-2" : { multiplier: 1, label: "Restricted 2" , short_code: "Rs2", prohibited: [] },
    "restricted-3" : { multiplier: 1, label: "Restricted 3" , short_code: "Rs3", prohibited: [] },
    "salvo-fire" : { multiplier: 1, label: "Salvo Fire" , short_code: "Sal", prohibited: ["chain-fire", "repeating", "retargeting"] },
    "seeking" : { multiplier: 0.6, label: "Seeking" , short_code: "Skr", prohibited: ["defensive", "sustained"] },
    "semi-piercing" : { multiplier: 1.33, label: "Semi-Piercing" , short_code: "Sep", prohibited: ["piercing", "resonant", "non-piercing"] },
    "slow" : { multiplier: 0.7, label: "Slow" , short_code: "Sl1", prohibited: ["sustained"] },
    "slow-2" : { multiplier: 0.5, label: "Slow 2" , short_code: "Sl2", prohibited: ["sustained"] },
    "sustained" : { multiplier: 1.3, label: "Sustained" , short_code: "Sus", prohibited: ["seeker", "slow"] },
    "sweeping" : { multiplier: 1.4, label: "Sweeping" , short_code: "Swp", prohibited: ["cutting"] },
    "volatile" : { multiplier: 3.5, label: "Volatile" , short_code: "Vol", prohibited: ["catastrophic"] },
}

export const shipSystemsConfigs = {
    "action-points": {
        label: "Action Points", 
        tech: "misc",
        type: "equipment",
        su: "system_count * (hull_size * 2)",
        orat: false,
        drat: "drat * (1+(0.05 * system_count))",
        erm: false,
        hsm: false,
    },
    "anti-fighter-batteries": { 
        label: "Anti-Fighter Batteries", 
        tech: "weapons",
        type: "equipment", 
        su: "system_count * hull_size * 5", 
        orat: false,
        drat: "drat * 1.2",
        erm: false,
        hsm: false,
    },
    "area-defense": { 
        label: "Area Defense", 
        tech: "weapons",
        type: "equipment", 
        su: "system_count * hull_size * 3", 
        orat: false,
        drat: "drat * 1.1",
        erm: false,
        hsm: false,
    },
    "armored": { 
        label: "Armored", 
        tech: "defenses",
        type: "trait", 
        su: "system_count * hull_size * 7", 
        orat: false,
        drat: false,
        hsm: "hull_size * 0.3",
        erm: false
    },
    "auto-repair": { 
        label: "Auto-Repair System", 
        tech: "defenses",
        type: "equipment", 
        su: "system_count * hull_size * 5", 
        orat: false,
        drat: "drat * ( 1 + ( 0.2 * system_count ) )",
        erm: false,
        hsm: false,
    },
    "aux-services": { 
        label: "Auxilliary Services", 
        tech: "n/a",
        type: "equipment", 
        su: "system_count * 25", 
        orat: false,
        drat: false,
        erm: false,
        hsm: false,
    },
    "boosters": { 
        label: "Boosters", 
        tech: "engines",
        type: "munition", 
        su: "system_count * engine_factor * 0.25", 
        orat: false,
        drat: false,
        hsm: false,
        erm: "0.25"
    },
    "carrier": { 
        label: "Carrier", 
        tech: "fighter",
        type: "equipment", 
        su: "system_count * 100", 
        orat: "125",
        drat: false,
        erm: false,
        hsm: "(system_count * (5 / drat))",
    },

    "carrier-with-tubes": { 
        label: "Carrier (Lnch Tubes)", 
        tech: "fighter",
        type: "trait", 
        su: "system_count * 120", 
        orat: "125 * 1.2",
        drat: false,
        erm: false,
        hsm: "(system_count * (5 / drat))",
    },

    "cloaking": { 
        label: "Cloaking Device", 
        tech: "defenses",
        type: "equipment", 
        su: "system_count * hull_size * 20", 
        orat: false,
        drat: "drat * 1.7",
        erm: false,
        hsm: false,
    },
    "countermeasures": { 
        label: "Countermeasures", 
        tech: "defenses",
        type: "equipment", 
        su: "system_count * hull_size * 10",
        orat: false,
        drat: "drat * 1.5",
        erm: false,
        hsm: false,
    },
    "decoys": { 
        label: "Decoys", 
        tech: "defenses",
        type: "equipment", 
        su: "system_count * hull_size * 3",
        orat: false,
        drat: "drat * (1 + ( system_count * 0.15 ) )",
        erm: false,
        hsm: false,
    },
    "enhanced-fire-control": { 
        label: "Enhanced Fire Control", 
        tech: "weapons",
        type: "equipment", 
        su: "system_count * weapons_su * 1.3", 
        orat: "system_count * weapons_orat * 1.3",
        drat: false,
        erm: false,
        hsm: false,
    },
    "flares": { 
        label: "Flares", 
        tech: "defenses",
        type: "munitions", 
        su: "system_count * 10", 
        orat: "system_count * (effective_engine_rating + 10)",
        drat: false,
        erm: false,
        hsm: false,
    },
    // NOT SUPPORTED
    // "fuel": { 
    //     label: "Fuel", 
    //     tech: "misc",
    //     type: "munitions", 
    //     su: "system_count * 10", 
    //     orat: "(effective_engine_rating + 10) * 0.5",
    //     drat: false,
    //     erm: false,
    //     hsm: false,
    // },
    "hyperdrive": { 
        label: "Hyperdrive", 
        tech: "engines",
        type: "equipment", 
        su: "system_count * hull_size * 5", 
        orat: false,
        drat: "drat * 1.2",
        erm: false,
        hsm: false,
    },
    "immobile": { 
        label: "Immobile", 
        tech: "engines",
        type: "trait", 
        su: false, 
        orat: false,
        drat:false,
        erm: false,
        hsm: false,
    },
    // "inverted-defenses" : {
        // NOT SUPPORTED
    // },
    "long-range-sensors": { 
        label: "Long Range Sensors", 
        tech: "weapons",
        type: "equipment", 
        su: "system_count * weapons_su * 1.5", 
        orat: "system_count * weapons_orat * 1.5",
        drat: false,
        erm: false,
        hsm: false,
    },
    "marines": { 
        label: "Marines", 
        tech: "weapons",
        type: "munition", 
        su: "system_count * 10", 
        orat: "system_count * (effective_engine_rating + 5)",
        drat: 1,
        erm: false,
        hsm: false,
    },
    "mines": { 
        label: "Mines", 
        tech: "fighter",
        type: "munition", 
        su: "system_count * 20", 
        orat: "system_count * 25",
        drat: false,
        erm: false,
        hsm: "(system_count * (1 / drat))",
    },
    "pivot-a": { 
        label: "Pivot A", 
        tech: "misc",
        type: "trait", 
        su: "*1.2", 
        orat: false,
        drat: false,
        erm: "*1.1",
        hsm: false,
    },
    "pivot-b": { 
        label: "Pivot B", 
        tech: "misc",
        type: "trait", 
        su: "*1.1", 
        orat: false,
        drat: false,
        erm: "*1.1",
        hsm: false,
    },
    "pivot-c": { 
        label: "Pivot C", 
        tech: "misc",
        type: "trait", 
        su: "*1.0", 
        orat: false,
        drat: false,
        erm: "*1.0",
        hsm: false,
    },
    "pivot-d": { 
        label: "Pivot D", 
        tech: "misc",
        type: "trait", 
        su: "*0.9", 
        orat: false,
        drat: false,
        erm: "*0.9",
        hsm: false,
    },
    "pivot-e": { 
        label: "Pivot E", 
        tech: "misc",
        type: "trait", 
        su: "*0.8", 
        orat: "",
        drat: false,
        erm: "*0.8",
        hsm: false,
    },
    "point-defenese-system": { 
        label: "Point Defense Sytem", 
        tech: "defenses",
        type: "equipment", 
        su: "system_count * 25", 
        orat: "system_count * (effective_engine_rating + 3) * 2",
        drat: false,
        erm: false,
        hsm: false,
    },
    "probes": { 
        label: "Probes", 
        tech: "weapons",
        type: "munition", 
        su: "system_count * 5", 
        orat: "system_count * (effective_engine_rating + 6) * 0.5",
        drat: false,
        erm: false,
        hsm: false,
    },
    "regenerating": { 
        label: "Regenerating", 
        tech: "defenses",
        type: "trait", 
        su: 5, 
        orat: false,
        drat: "drat * 2.0",
        erm: false,
        hsm: false,
    },
    "screen-forward": { 
        label: "Forward Screens", 
        tech: "defenses",
        type: "equipment", 
        su: "system_count * hull_size * 3.3", 
        orat: false,
        drat: false,
        erm: false,
        hsm: false,
    },
    "screen-port": { 
        label: "Port Screens", 
        tech: "defenses",
        type: "equipment", 
        su: "system_count * hull_size * 2.5", 
        orat: false,
        drat: false,
        erm: false,
        hsm: false,
    },
    "screen-starboard": { 
        label: "Starboard Screens", 
        tech: "defenses",
        type: "equipment", 
        su: "system_count * hull_size * 2.5", 
        orat: false,
        drat: false,
        erm: false,
        hsm: false,
    },
    "screen-aft": { 
        label: "Aft Screens", 
        tech: "defenses",
        type: "equipment", 
        su: "system_count * hull_size * 1.7", 
        orat: false,
        drat: false,
        erm: false,
        hsm: false,
    },
    "omni-shield": { 
        label: "Omni-Shields", 
        tech: "defenses",
        type: "munition", 
        su: "system_count * 15", 
        orat: false,
        drat: false,
        erm: false,
        hsm: "0.75",
    },
    "shield-forward": { 
        label: "Forward Shields", 
        tech: "defenses",
        type: "munition", 
        su: "system_count * 10", 
        orat: false,
        drat: false,
        erm: false,
        hsm: "0.67",
    },
    "shield-port": { 
        label: "Port Shields", 
        tech: "defenses",
        type: "munition", 
        su: "system_count * 10", 
        orat: false,
        drat: false,
        erm: false,
        hsm: "0.50",
    },
    "shield-starboard": { 
        label: "Starboard Shields", 
        tech: "defenses",
        type: "munition", 
        su: "system_count * 10", 
        orat: false,
        drat: false,
        erm: false,
        hsm: "0.50",
    },
    "shield-aft": { 
        label: "Aft Shields", 
        tech: "defenses",
        type: "munition", 
        su: "system_count * 10", 
        orat: false,
        drat: false,
        erm: false,
        hsm: "0.33",
    },
    "shld-regenerator": { 
        label: "Shield Regenerator", 
        tech: "defenses",
        type: "equipment", 
        su: "system_count * 40", 
        orat: false,
        drat: false,
        erm: false,
        hsm: "1.5",
    },
    "shockwave": { 
        label: "Shockwave", 
        tech: "defenses",
        type: "equipment", 
        su: "system_count * hull_size * 15", 
        orat: "system_count * hull_size * (effective_engine_rating + 3) * 1.5",
        drat: false,
        erm: false,
        hsm: false,
    },
    "shuttlecraft": { 
        label: "Shuttlecraft", 
        tech: "fighter",
        type: "munition", 
        su: "system_count * 15", 
        orat: "system_count * 10",
        drat: "drat / 2",
        erm: false,
        hsm: "(system_count * (2 / drat))",
    },
    "stealth": { 
        label: "Stealth", 
        tech: "defenses",
        type: "equipment", 
        su: "system_count * hull_size * 10", 
        orat: false,
        drat: "drat * 1.5",
        erm: false,
        hsm: false,
    },
    "stutter-drive": { 
        label: "Stutter Drive", 
        tech: "engines",
        type: "equipment", 
        su: "system_count * engine_factor * engine_rating * 0.5", 
        orat: 0.5,
        drat: false,
        erm: "engine_rating * 0.5",
        hsm: false,
    },
}

export const standardWeaponTypes = {
    "amb": { baseName: "Anti-Matter Beam", traits: ["bursting"] },
    "clstrmsl": { baseName: "Cluster Missile", traits: ["volatile"] },
    "distruptor": { baseName: "Distruptor", traits: ["disruptive"] },
    "energylance": { baseName: "Energy Lance", traits: [], accuracy_taper: "invert" },
    "fusiontorp": { baseName: "Fusion Torpedo", traits: ["catastrophic"] },
    "ioncannon": { baseName: "Ion Cannon", traits: ["incapacitating", "phasing-3"] },
    "lasercannon": { baseName: "Laser Cannon", traits: ["accurate"] },
    "massdriver": { baseName: "Mass Driver", traits: ["crushing", "semi-piercing"] },
    "needlebeam": { baseName: "Needlebeam", traits: ["cutting", "pinpoint"] },
    "phasecannon": { baseName: "Phase Cannon", traits: ["phasing-1"] },
    "pulselaser": { baseName: "Pulse Laser", traits: ["repeating-5"] },
    "shockcannon": { baseName: "Shock Cannon", traits: [], damage_taper: "normal" },
}

export const standardAccuracyValues = {
    "a": [2,3,4],
    "b": [3,4,5],
    "c": [4,5,6],
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
