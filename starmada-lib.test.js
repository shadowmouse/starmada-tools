import {
    validateHullSize,
    shipSpaceUnits,
    engineFactor,
    engineSpaceUnits,
    effectiveEngineRating,
    weaponBankSpaceUnits,
    weaponBaseSpaceUnitsFromConfig,
    weaponRelativeBandWeight,
    weaponBandStrength,
    weaponBaseStrength,
    shipORATTotal,
    shipDRAT,
    calculateDesignAttributes,
    weaponTraitConfigs,
    fuelBunkerage
} from "../starmada-lib.js"

let testShip = {
    "faction": "",
    "class": "SYCAMORE",
    "type": "Heavy Cruiser",
    "id": "",
    "name": "",
    "size": 8,
    "screens": 0,
    "engines": 5,
    "shields": 0,
    "relative_tech_level": 0,
    "batteries": [
        {
            "banks": {
                "AB": 2
            },
            "lossLimit": 1,
            "config": {
                "name": "Class-5b Fusion Torpedo",
                "traits": [
                    "catastrophic"
                ],
                "bands": [
                    {
                        "range": 5,
                        "rate_of_fire": 1,
                        "accuracy": 3,
                        "damage": 1
                    },
                    {
                        "range": 10,
                        "rate_of_fire": 1,
                        "accuracy": 4,
                        "damage": 1
                    },
                    {
                        "range": 15,
                        "rate_of_fire": 1,
                        "accuracy": 5,
                        "damage": 1
                    }
                ],
                "munition_count": 0
            },
            "id": "battery_8aede50c2eb7f6a911ec8d77b15d02f91d1f6736"
        },
        {
            "banks": {
                "ABC": 2,
                "ABD": 2
            },
            "lossLimit": 2,
            "config": {
                "name": "Class-5b Shock Cannon",
                "traits": [],
                "bands": [
                    {
                        "range": "5",
                        "rate_of_fire": 1,
                        "accuracy": 3,
                        "damage": 3
                    },
                    {
                        "range": 10,
                        "rate_of_fire": 1,
                        "accuracy": 4,
                        "damage": 2
                    },
                    {
                        "range": 15,
                        "rate_of_fire": 1,
                        "accuracy": 5,
                        "damage": 1
                    }
                ],
                "munition_count": 0
            },
            "id": "battery_3bf8bf096dc60278ba31edfd9e15bc3848b9200b"
        },
        {
            "banks": {
                "ABCDEF": 3
            },
            "lossLimit": 2,
            "config": {
                "name": "Class-2a Laser Cannon",
                "traits": [
                    "accurate"
                ],
                "bands": [
                    {
                        "range": "2",
                        "rate_of_fire": 1,
                        "accuracy": 2,
                        "damage": 1
                    },
                    {
                        "range": 4,
                        "rate_of_fire": 1,
                        "accuracy": 3,
                        "damage": 1
                    },
                    {
                        "range": 6,
                        "rate_of_fire": 1,
                        "accuracy": 4,
                        "damage": 1
                    }
                ],
                "munition_count": 0
            },
            "id": "battery_27a54036d06801fcfec8e0769232334ec148e9fd"
        }
    ],
    "systems": {
        "screen-forward": 2,
        "screen-starboard": 2,
        "screen-port": 2,
        "screen-aft": 2,
        "anti-fighter-batteries": 1,
        "hyperdrive": 1,
        "marines": 3
    }
}

test('adds 1 + 2 to equal 3', () => {
    expect(1 + 2).toBe(3);
});

test('Hull Size Validation - Valid Size', () => {
    expect(validateHullSize(10)).toBe(10);
})

test('Hull Size Validation - Invalid Size - Low', () => {
    expect(() => validateHullSize(0)).toThrow();
})

test('Hull Size Validation - Invalid Size - High', () => {
    expect(() => validateHullSize(50)).toThrow();
})

test("Hull Size Space Units", () => {
    expect(shipSpaceUnits(10)).toBe(1000)
    expect(shipSpaceUnits(20)).toBe(2000)
    expect(shipSpaceUnits(30)).toBe(3000)
    expect(shipSpaceUnits(35)).toBe(3500)
    expect(shipSpaceUnits(10.5)).toBe(1050)
})

test("Engine Factor", () => {
    expect(engineFactor(5)).toBe(27.5)
    expect(engineFactor(10)).toBe(60)
    expect(engineFactor(20)).toBe(140)
    expect(engineFactor(8)).toBe(46.4)
    expect(engineFactor(8, 2)).toBe(46.4 / 2)
    expect(engineFactor(8, -2)).toBe(46.4 * 2)
})

test("Engine Space Units Factor", () => {
    expect(engineSpaceUnits(8, 5)).toBe(232)
    expect(engineSpaceUnits(8, 5)).toBe(232)
    expect(engineSpaceUnits(8, 5, -2)).toBe(232 * 2)
    expect(engineSpaceUnits(8, 5, 2)).toBe(232 / 2)
})

test("Weapon Relative Band Weight", () => {
    // Class 5b Fusion Torpedo
    expect(weaponRelativeBandWeight(5, 0)).toBe(45)
    expect(weaponRelativeBandWeight(10, 5)).toBe(95)
    expect(weaponRelativeBandWeight(15, 10)).toBe(145)
})

test("Weapon Band Strengths", () => {
    // Class 5b Fusion Torpedo
    expect(weaponBandStrength(45, 1, 3, 1)).toBe(180)
    expect(weaponBandStrength(95, 1, 4, 1)).toBe(285)
    expect(weaponBandStrength(145, 1, 5, 1)).toBe(290)
})

test("Weapon Band Strength", () => {
    // Class 5b Fusion Torpedo
    expect(weaponBandStrength(45, 1, 3, 1)).toBe(180)
    expect(weaponBandStrength(95, 1, 4, 1)).toBe(285)
    expect(weaponBandStrength(145, 1, 5, 1)).toBe(290)
})

test("Weapon Base Strength", () => {
    // Class 5b Fusion Torpedo
    expect(weaponBaseStrength([{
        range: 5,
        rate_of_fire: 1,
        accuracy: 3,
        damage: 1
    },{
        range: 10,
        rate_of_fire: 1,
        accuracy: 4,
        damage: 1
    },{
        range: 15,
        rate_of_fire: 1,
        accuracy: 5,
        damage: 1
    }])).toBe(755)
})



test("Weapon Base Space Requirements (BSR) - 5b FT", () => {
    // Class 5b Fusion Torpedo
    expect(weaponBaseSpaceUnitsFromConfig({
        bands: [{
            range: 5,
            rate_of_fire: 1,
            accuracy: 3,
            damage: 1
        },{
            range: 10,
            rate_of_fire: 1,
            accuracy: 4,
            damage: 1
        },{
            range: 15,
            rate_of_fire: 1,
            accuracy: 5,
            damage: 1
        }],
        traits: ["catastrophic"]
    })).toBe(13.91)
})

test("Weapon Base Space Requirements (BSR) - 5b FT - Tech Level Modified", () => {
    // Class 5b Fusion Torpedo
    expect(weaponBaseSpaceUnitsFromConfig({
        bands: [{
            range: 5,
            rate_of_fire: 1,
            accuracy: 3,
            damage: 1
        },{
            range: 10,
            rate_of_fire: 1,
            accuracy: 4,
            damage: 1
        },{
            range: 15,
            rate_of_fire: 1,
            accuracy: 5,
            damage: 1
        }],
        traits: ["catastrophic"]
    }, -2)).toBe(13.91 * 2)

    expect(weaponBaseSpaceUnitsFromConfig({
        bands: [{
            range: 5,
            rate_of_fire: 1,
            accuracy: 3,
            damage: 1
        },{
            range: 10,
            rate_of_fire: 1,
            accuracy: 4,
            damage: 1
        },{
            range: 15,
            rate_of_fire: 1,
            accuracy: 5,
            damage: 1
        }],
        traits: ["catastrophic"]
    }, -1)).toBeCloseTo(13.91 * 1.4, 1)

    expect(weaponBaseSpaceUnitsFromConfig({
        bands: [{
            range: 5,
            rate_of_fire: 1,
            accuracy: 3,
            damage: 1
        },{
            range: 10,
            rate_of_fire: 1,
            accuracy: 4,
            damage: 1
        },{
            range: 15,
            rate_of_fire: 1,
            accuracy: 5,
            damage: 1
        }],
        traits: ["catastrophic"]
    }, 0)).toBe(13.91 * 1)

    expect(weaponBaseSpaceUnitsFromConfig({
        bands: [{
            range: 5,
            rate_of_fire: 1,
            accuracy: 3,
            damage: 1
        },{
            range: 10,
            rate_of_fire: 1,
            accuracy: 4,
            damage: 1
        },{
            range: 15,
            rate_of_fire: 1,
            accuracy: 5,
            damage: 1
        }],
        traits: ["catastrophic"]
    }, 1)).toBeCloseTo(13.91 * 0.7, 2)

    expect(weaponBaseSpaceUnitsFromConfig({
        bands: [{
            range: 5,
            rate_of_fire: 1,
            accuracy: 3,
            damage: 1
        },{
            range: 10,
            rate_of_fire: 1,
            accuracy: 4,
            damage: 1
        },{
            range: 15,
            rate_of_fire: 1,
            accuracy: 5,
            damage: 1
        }],
        traits: ["catastrophic"]
    }, 2)).toBeCloseTo(13.91 * 0.5, 2)
})

test("Weapon Base Space Requirements (BSR) - 5b SC", () => {
    // Class 5b Fusion Torpedo
    expect(weaponBaseSpaceUnitsFromConfig({
        bands: [{
            range: 5,
            rate_of_fire: 1,
            accuracy: 3,
            damage: 3
        },{
            range: 10,
            rate_of_fire: 1,
            accuracy: 4,
            damage: 2
        },{
            range: 15,
            rate_of_fire: 1,
            accuracy: 5,
            damage: 1
        }],
        traits: []
    })).toBe(7.37)
})

test("Weapon Base Space Requirements (BSR) - 2a LC", () => {
    // Class 5b Fusion Torpedo
    expect(weaponBaseSpaceUnitsFromConfig({
        bands: [{
            "range": 2,
            "rate_of_fire": 1,
            "accuracy": 2,
            "damage": 1
        },
        {
            "range": 4,
            "rate_of_fire": 1,
            "accuracy": 3,
            "damage": 1
        },
        {
            "range": 6,
            "rate_of_fire": 1,
            "accuracy": 4,
            "damage": 1
        }],
        traits: ["accurate"]
    })).toBe(2.69)
})


test("Weapon Base Space Requirements (BSR) - 5a Generic", () => {
    // Class 5b Fusion Torpedo
    let singleBand = {
        range: 5,
        rate_of_fire: 1,
        accuracy: 2,
        damage: 1
    }
    expect(weaponRelativeBandWeight(singleBand.range, 0)).toBe(45)
    expect(weaponBandStrength(weaponRelativeBandWeight(singleBand.range, 0), singleBand.rate_of_fire, singleBand.accuracy, singleBand.damage)).toBe(225)

    expect(weaponBaseSpaceUnitsFromConfig({
        bands: [singleBand],
        traits: []
    })).toBe(2.5)
})

test("Weapon Base Space Requirements (BSR) - 5a Generic - Single Trait", () => {
    // Class 5b Fusion Torpedo
    let singleBand = {
        range: 5,
        rate_of_fire: 1,
        accuracy: 2,
        damage: 1
    }
    expect(weaponRelativeBandWeight(singleBand.range, 0)).toBe(45)
    expect(weaponBandStrength(weaponRelativeBandWeight(singleBand.range, 0), singleBand.rate_of_fire, singleBand.accuracy, singleBand.damage)).toBe(225)

    Object.keys(weaponTraitConfigs).forEach(systemKey => {
        let system = weaponTraitConfigs[systemKey];
        let wbsu = weaponBaseSpaceUnitsFromConfig({
            bands: [singleBand],
            traits: [systemKey]
        })
        expect(wbsu).toBeCloseTo(parseFloat((2.5 * system.multiplier).toFixed(2)), 1);
    })
})

test("Weapon Base Space Requirements (BSR) - 5a Generic - Multi-Trait", () => {
    // Class 5b Fusion Torpedo
    let singleBand = {
        range: 5,
        rate_of_fire: 1,
        accuracy: 2,
        damage: 1
    }
    expect(weaponRelativeBandWeight(singleBand.range, 0)).toBe(45)
    expect(weaponBandStrength(weaponRelativeBandWeight(singleBand.range, 0), singleBand.rate_of_fire, singleBand.accuracy, singleBand.damage)).toBe(225)

    expect(weaponBaseSpaceUnitsFromConfig({ bands: [singleBand],
        traits: ["accurate", "bursting"]
    })).toBe(6)

    expect(weaponBaseSpaceUnitsFromConfig({ bands: [singleBand],
        traits: ["accurate", "bursting"]
    })).toBe(6)

    expect(weaponBaseSpaceUnitsFromConfig({ bands: [singleBand],
        traits: ["accurate", "phasing-3"]
    })).toBe(2.5 * 1.2 * 1.8)

    expect(weaponBaseSpaceUnitsFromConfig({ bands: [singleBand],
        traits: ["accurate", "phasing-3", "retargeting"]
    })).toBeCloseTo(2.5 * 1.2 * 1.8 * 1.5, 1)
})

test("Weapon Bank Space Units", () => {
    let wbsu = weaponBankSpaceUnits(3.9, 2, 2, 0)
    expect(wbsu).toBe(31.2)
})

test("Weapon Bank Space Units - Limited Ammo", () => {
    let wbsu = weaponBankSpaceUnits(14, 3, 4, 2)
    expect(wbsu).toBe(100.8)
})

test("DRAT Calculation Test - Non Screen Systems - Single Systems", () => {
    expect(shipDRAT({ "anti-fighter-batteries": 1 }, {})).toBe(1.2)
    expect(shipDRAT({ "area-defense": 1 }, {})).toBe(1.1)
    expect(shipDRAT({ "auto-repair": 1 }, {})).toBe(1.2)
    expect(shipDRAT({ "auto-repair": 5 }, {})).toBe(2)
    expect(shipDRAT({ "cloaking": 1 }, {})).toBe(2)
    expect(shipDRAT({ "cloaking": 2 }, {})).toBe(2)
    expect(shipDRAT({ "countermeasures": 1 }, {})).toBe(1.5)
    expect(shipDRAT({ "decoys": 1 }, {})).toBe(1.15)
    expect(shipDRAT({ "decoys": 2 }, {})).toBe(1.30)
    expect(shipDRAT({ "decoys": 4 }, {})).toBe(1.60)
    expect(shipDRAT({ "hyperdrive": 2 }, {})).toBe(1.2)
    expect(shipDRAT({ "stealth": 2 }, {})).toBe(1.5)
})

test("DRAT Calculation Test - Non Screen Systems - Composite Systems", () => {
    expect(shipDRAT({ 
        "anti-fighter-batteries": 1,
        "area-defense": 1
    }, {})).toBe(1.32)

    expect(shipDRAT({ 
        "anti-fighter-batteries": 5,
        "decoys": 5
    }, {})).toBe(2.1)
})

test("DRAT Calculation Test - No System", () => {
    expect(shipDRAT({ 
        "anti-fighter-batteries": 1,
        "area-defense": 1
    }, {})).toBe(1.32)

    expect(shipDRAT({ 
        "anti-fighter-batteries": 5,
        "decoys": 5
    }, {})).toBe(2.1)
})

test("DRAT Calculation Test - Screens + Omni Shields", () => {
    expect(shipDRAT({ 
        "screen-forward": 1
    }, {})).toBe(0.5)

    expect(shipDRAT({ 
        "screen-forward": 1,
        "screen-aft": 1,
        "screen-port": 1,
        "screen-starboard": 1
    }, {})).toBe(1.5)

    expect(shipDRAT({ 
        "anti-fighter-batteries": 5,
        "decoys": 5,
        "screen-forward": 1,
        "screen-aft": 1,
        "screen-port": 1,
        "screen-starboard": 1
    }, {})).toBe(3.15)

    expect(shipDRAT({ 
        "omni-shield": 1
    }, {})).toBe(1)

    expect(shipDRAT({ 
        "omni-screen": 1
    }, {})).toBe(1.5)
})

test("Ship ORAT/Factors Calculation Test - Empty Ship", () => {
    let batteries = []
    let systems = {}
    let hullSize = 3;
    let engineRating = 5;
    let shipFactors = calculateDesignAttributes(hullSize, engineRating, batteries, systems)
    expect(shipFactors.max_su).toBe(300)
    expect(shipFactors.engines_su).toBe(80)
    expect(shipFactors.weapons_su).toBe(0)
    expect(shipFactors.systems_su).toBe(0)
    expect(shipFactors.orat).toBe(0.00)
    expect(shipFactors.drat).toBe(1.00)
    expect(shipFactors.combat_value).toBe(0.00)
    expect(shipFactors.hull_size).toBe(3)
    expect(shipFactors.effective_hull_size).toBe(3)
    expect(shipFactors.effective_engine_rating).toBe(5)
    expect(shipORATTotal(batteries, systems, shipFactors)).toBe(0)
})

test("Ship ORAT/Factors Calculation Test - Hyperdrive Only", () => {
    let batteries = []
    let systems = {
        "hyperdrive": 1
    }
    let hullSize = 3;
    let engineRating = 5;
    let shipFactors = calculateDesignAttributes(hullSize, engineRating, batteries, systems)
    expect(shipFactors.max_su).toBe(300)
    expect(shipFactors.engines_su).toBe(80)
    expect(shipFactors.weapons_su).toBe(0)
    expect(shipFactors.systems_su).toBe(15)
    expect(shipFactors.orat).toBe(0.00)
    expect(shipFactors.drat).toBe(1.20)
    expect(shipFactors.combat_value).toBe(0.00)
    expect(shipFactors.hull_size).toBe(3)
    expect(shipFactors.effective_hull_size).toBe(3)
    expect(shipFactors.effective_engine_rating).toBe(5)
    expect(shipORATTotal(batteries, systems, shipFactors)).toBe(0)
})

test("Ship ORAT/Factors Calculation Test - Single Battery - No Munition Count", () => {
    let batteries = [{
        "banks": {
            "G": 1
        },
        "lossLimit": 1,
        "config": {
            "name": "Test Weapon - 5a",
            "traits": [],
            "bands": [
                {
                    "range": 2,
                    "rate_of_fire": 1,
                    "accuracy": 2,
                    "damage": 1
                },
                {
                    "range": 4,
                    "rate_of_fire": 1,
                    "accuracy": 3,
                    "damage": 1
                },
                {
                    "range": 6,
                    "rate_of_fire": 1,
                    "accuracy": 4,
                    "damage": 1
                }
            ],
            "munition_count": 0
        },
        "id": "battery_e0b0b65f0473da166d1c41045706a064409c2ce7"
    }]
    let systems = {}
    let hullSize = 3;
    let engineRating = 5;
    let shipFactors = calculateDesignAttributes(hullSize, engineRating, batteries, systems)
    expect(shipFactors.max_su).toBe(300)
    expect(shipFactors.engines_su).toBe(80)
    expect(shipFactors.weapons_su).toBe(6.72)
    expect(shipFactors.systems_su).toBe(0)
    expect(shipFactors.orat).toBe(7.392)
    expect(shipFactors.drat).toBe(1.00)
    expect(shipFactors.combat_value).toBe(5)
    expect(shipFactors.hull_size).toBe(3)
    expect(shipFactors.effective_hull_size).toBe(3)
    expect(shipFactors.effective_engine_rating).toBe(5)
    expect(shipORATTotal(batteries, systems, shipFactors)).toBe(shipFactors.orat)
})


test("Ship ORAT/Factors Calculation Test - Single Battery - Munition Count", () => {
    let batteries = [{
        "banks": {
            "G": 1
        },
        "lossLimit": 1,
        "config": {
            "name": "Test Weapon - 5a",
            "traits": [],
            "bands": [
                {
                    "range": 2,
                    "rate_of_fire": 1,
                    "accuracy": 2,
                    "damage": 1
                },
                {
                    "range": 4,
                    "rate_of_fire": 1,
                    "accuracy": 3,
                    "damage": 1
                },
                {
                    "range": 6,
                    "rate_of_fire": 1,
                    "accuracy": 4,
                    "damage": 1
                }
            ],
            "munition_count": 1
        },
        "id": "battery_e0b0b65f0473da166d1c41045706a064409c2ce7"
    }]
    let systems = {}
    let hullSize = 3;
    let engineRating = 5;
    let shipFactors = calculateDesignAttributes(hullSize, engineRating, batteries, systems)
    expect(shipFactors.max_su).toBe(300)
    expect(shipFactors.engines_su).toBe(80)
    expect(shipFactors.weapons_su).toBe(2.02)
    expect(shipFactors.systems_su).toBe(0)
    expect(shipFactors.orat).toBe(2.222)
    expect(shipFactors.drat).toBe(1.00)
    expect(shipFactors.combat_value).toBe(3)
    expect(shipFactors.hull_size).toBe(3)
    expect(shipFactors.effective_hull_size).toBe(3)
    expect(shipFactors.effective_engine_rating).toBe(5)
    expect(shipORATTotal(batteries, systems, shipFactors)).toBe(shipFactors.orat)
})

test("Ship ORAT/Factors Calculation Test - Effective Hull Size", () => {
    let batteries = [{
        "banks": {
            "G": 1
        },
        "lossLimit": 1,
        "config": {
            "name": "Test Weapon - 5a",
            "traits": [],
            "bands": [
                {
                    "range": 2,
                    "rate_of_fire": 1,
                    "accuracy": 2,
                    "damage": 1
                },
                {
                    "range": 4,
                    "rate_of_fire": 1,
                    "accuracy": 3,
                    "damage": 1
                },
                {
                    "range": 6,
                    "rate_of_fire": 1,
                    "accuracy": 4,
                    "damage": 1
                }
            ],
            "munition_count": 1
        },
        "id": "battery_e0b0b65f0473da166d1c41045706a064409c2ce7"
    }]
    let systems = {
        "armored": 1
    }
    let hullSize = 3;
    let engineRating = 5;
    let shipFactors = calculateDesignAttributes(hullSize, engineRating, batteries, systems)
    expect(shipFactors.max_su).toBe(300)
    expect(shipFactors.engines_su).toBe(80)
    expect(shipFactors.weapons_su).toBe(2.02)
    expect(shipFactors.systems_su).toBe(parseFloat((3 * 7).toFixed(2)))
    expect(shipFactors.orat).toBe(2.222)
    expect(shipFactors.drat).toBe(1.00)
    expect(shipFactors.combat_value).toBe(3)
    expect(shipFactors.hull_size).toBe(3)
    expect(shipFactors.effective_hull_size).toBe(parseFloat((3 * 1.3).toFixed(2)))
    expect(shipFactors.effective_engine_rating).toBe(5)
    expect(shipORATTotal(batteries, systems, shipFactors)).toBe(shipFactors.orat)
})

test("Ship ORAT/Factors Calculation Test - Single Battery - Munition Count", () => {
    let batteries = [{
        "banks": {
            "G": 1
        },
        "lossLimit": 1,
        "config": {
            "name": "Test Weapon - 5a",
            "traits": [],
            "bands": [
                {
                    "range": 2,
                    "rate_of_fire": 1,
                    "accuracy": 2,
                    "damage": 1
                },
                {
                    "range": 4,
                    "rate_of_fire": 1,
                    "accuracy": 3,
                    "damage": 1
                },
                {
                    "range": 6,
                    "rate_of_fire": 1,
                    "accuracy": 4,
                    "damage": 1
                }
            ],
            "munition_count": 1
        },
        "id": "battery_e0b0b65f0473da166d1c41045706a064409c2ce7"
    }]
    let systems = {}
    let hullSize = 3;
    let engineRating = 5;
    let shipFactors = calculateDesignAttributes(hullSize, engineRating, batteries, systems, { engines: 2 })
    expect(shipFactors.max_su).toBe(300)
    expect(shipFactors.engines_su).toBe(40)
    expect(shipFactors.weapons_su).toBe(2.02)
    expect(shipFactors.systems_su).toBe(0)
    expect(shipFactors.orat).toBe(2.222)
    expect(shipFactors.drat).toBe(1.00)
    expect(shipFactors.combat_value).toBe(3)
    expect(shipFactors.hull_size).toBe(3)
    expect(shipFactors.effective_hull_size).toBe(3)
    expect(shipFactors.effective_engine_rating).toBe(5)
    expect(shipORATTotal(batteries, systems, shipFactors)).toBe(shipFactors.orat)
})

test("Ship ORAT/Factors Calculation Test - Single Battery - Munition Count - Tech Level Modified", () => {
    let batteries = [{
        "banks": {
            "G": 1
        },
        "lossLimit": 1,
        "config": {
            "name": "Test Weapon - 5a",
            "traits": [],
            "bands": [
                {
                    "range": 2,
                    "rate_of_fire": 1,
                    "accuracy": 2,
                    "damage": 1
                },
                {
                    "range": 4,
                    "rate_of_fire": 1,
                    "accuracy": 3,
                    "damage": 1
                },
                {
                    "range": 6,
                    "rate_of_fire": 1,
                    "accuracy": 4,
                    "damage": 1
                }
            ],
            "munition_count": 1
        },
        "id": "battery_e0b0b65f0473da166d1c41045706a064409c2ce7"
    }]
    let systems = {}
    let hullSize = 3;
    let engineRating = 5;
    let shipFactors = calculateDesignAttributes(hullSize, engineRating, batteries, systems, { weapons: 2 })
    expect(shipFactors.max_su).toBe(300)
    expect(shipFactors.engines_su).toBe(80)
    expect(shipFactors.weapons_su).toBe(2.02/2)
    expect(shipFactors.systems_su).toBe(0)
    expect(shipFactors.orat).toBe(2.222)
    expect(shipFactors.drat).toBe(1.00)
    expect(shipFactors.combat_value).toBe(3)
    expect(shipFactors.hull_size).toBe(3)
    expect(shipFactors.effective_hull_size).toBe(3)
    expect(shipFactors.effective_engine_rating).toBe(5)
    expect(shipORATTotal(batteries, systems, shipFactors)).toBe(shipFactors.orat)
})

test("Ship ORAT/Factors Calculation Test - Single Battery - Munition Count - Carrier", () => {
    let batteries = [{
        "banks": {
            "G": 1
        },
        "lossLimit": 1,
        "config": {
            "name": "Test Weapon - 5a",
            "traits": [],
            "bands": [
                {
                    "range": 2,
                    "rate_of_fire": 1,
                    "accuracy": 2,
                    "damage": 1
                },
                {
                    "range": 4,
                    "rate_of_fire": 1,
                    "accuracy": 3,
                    "damage": 1
                },
                {
                    "range": 6,
                    "rate_of_fire": 1,
                    "accuracy": 4,
                    "damage": 1
                }
            ],
            "munition_count": 1
        },
        "id": "battery_e0b0b65f0473da166d1c41045706a064409c2ce7"
    }]
    let systems = {
        "carrier": 1
    }
    let hullSize = 3;
    let engineRating = 5;
    let shipFactors = calculateDesignAttributes(hullSize, engineRating, batteries, systems, { weapons: 2 })
    expect(shipFactors.max_su).toBe(300)
    expect(shipFactors.engines_su).toBe(80)
    expect(shipFactors.weapons_su).toBe(2.02/2)
    expect(shipFactors.systems_su).toBe(100)
    expect(shipFactors.drat).toBe(1.00)
    expect(shipFactors.hull_size).toBe(3)
    expect(shipFactors.effective_engine_rating).toBe(5)
    expect(shipORATTotal(batteries, systems, shipFactors)).toBe(shipFactors.orat)
})

test("Ship ORAT/Factors Calculation Test - Single Battery - Munition Count - Carrier - Tech Level Modified", () => {
    let batteries = [{
        "banks": {
            "G": 1
        },
        "lossLimit": 1,
        "config": {
            "name": "Test Weapon - 5a",
            "traits": [],
            "bands": [
                {
                    "range": 2,
                    "rate_of_fire": 1,
                    "accuracy": 2,
                    "damage": 1
                },
                {
                    "range": 4,
                    "rate_of_fire": 1,
                    "accuracy": 3,
                    "damage": 1
                },
                {
                    "range": 6,
                    "rate_of_fire": 1,
                    "accuracy": 4,
                    "damage": 1
                }
            ],
            "munition_count": 1
        },
        "id": "battery_e0b0b65f0473da166d1c41045706a064409c2ce7"
    }]
    let systems = {
        "carrier": 1
    }
    let hullSize = 3;
    let engineRating = 5;
    let shipFactors = calculateDesignAttributes(hullSize, engineRating, batteries, systems, { fighters: 2 })
    expect(shipFactors.max_su).toBe(300)
    expect(shipFactors.engines_su).toBe(80)
    expect(shipFactors.weapons_su).toBe(2.02)
    expect(shipFactors.systems_su).toBe(50)
    expect(shipFactors.drat).toBe(1.00)
    expect(shipFactors.hull_size).toBe(3)
    expect(shipFactors.effective_engine_rating).toBe(5)
    expect(shipORATTotal(batteries, systems, shipFactors)).toBe(shipFactors.orat)
})

test("Ship ORAT/Factors Calculation Test - Defenses", () => {
    let batteries = [{
        "banks": {
            "G": 1
        },
        "lossLimit": 1,
        "config": {
            "name": "Test Weapon - 5a",
            "traits": [],
            "bands": [
                {
                    "range": 2,
                    "rate_of_fire": 1,
                    "accuracy": 2,
                    "damage": 1
                },
                {
                    "range": 4,
                    "rate_of_fire": 1,
                    "accuracy": 3,
                    "damage": 1
                },
                {
                    "range": 6,
                    "rate_of_fire": 1,
                    "accuracy": 4,
                    "damage": 1
                }
            ],
            "munition_count": 1
        },
        "id": "battery_e0b0b65f0473da166d1c41045706a064409c2ce7"
    }]
    let systems = {
        "armored": 1
    }
    let hullSize = 3;
    let engineRating = 5;
    let shipFactors = calculateDesignAttributes(hullSize, engineRating, batteries, systems, { defenses: 2 })
    expect(shipFactors.max_su).toBe(300)
    expect(shipFactors.engines_su).toBe(80)
    expect(shipFactors.weapons_su).toBe(2.02)
    expect(shipFactors.systems_su).toBe(parseFloat((3 * 7 / 2).toFixed(2)))
    expect(shipFactors.orat).toBe(2.222)
    expect(shipFactors.drat).toBe(1.00)
    expect(shipFactors.combat_value).toBe(3)
    expect(shipFactors.hull_size).toBe(3)
    expect(shipFactors.effective_hull_size).toBe(parseFloat((3 * 1.3).toFixed(2)))
    expect(shipFactors.effective_engine_rating).toBe(5)
    expect(shipORATTotal(batteries, systems, shipFactors)).toBe(shipFactors.orat)
})

test("Ship ORAT/Factors Calculation Test - Defenses - Shields", () => {
    let batteries = [{
        "banks": {
            "G": 1
        },
        "lossLimit": 1,
        "config": {
            "name": "Test Weapon - 5a",
            "traits": [],
            "bands": [
                {
                    "range": 2,
                    "rate_of_fire": 1,
                    "accuracy": 2,
                    "damage": 1
                },
                {
                    "range": 4,
                    "rate_of_fire": 1,
                    "accuracy": 3,
                    "damage": 1
                },
                {
                    "range": 6,
                    "rate_of_fire": 1,
                    "accuracy": 4,
                    "damage": 1
                }
            ],
            "munition_count": 1
        },
        "id": "battery_e0b0b65f0473da166d1c41045706a064409c2ce7"
    }]
    let systems = {
        "shield-forward": 2
    }
    let hullSize = 3;
    let engineRating = 5;
    let shipFactors = calculateDesignAttributes(hullSize, engineRating, batteries, systems, { defenses: 0 })
    expect(shipFactors.max_su).toBe(300)
    expect(shipFactors.engines_su).toBe(80)
    expect(shipFactors.weapons_su).toBe(2.02)
    expect(shipFactors.systems_su).toBe(20)
    expect(shipFactors.orat).toBe(2.222)
    expect(shipFactors.drat).toBe(1.00)
    expect(shipFactors.combat_value).toBe(3)
    expect(shipFactors.hull_size).toBe(3)
    expect(shipFactors.effective_hull_size).toBe(parseFloat((3 + 0.67).toFixed(2)))
    expect(shipFactors.effective_engine_rating).toBe(5)
    expect(shipORATTotal(batteries, systems, shipFactors)).toBe(shipFactors.orat)
})

test("Ship ORAT/Factors Calculation Test - Defenses - Shields", () => {
    let batteries = [{
        "banks": {
            "G": 1
        },
        "lossLimit": 1,
        "config": {
            "name": "Test Weapon - 5a",
            "traits": [],
            "bands": [
                {
                    "range": 2,
                    "rate_of_fire": 1,
                    "accuracy": 2,
                    "damage": 1
                },
                {
                    "range": 4,
                    "rate_of_fire": 1,
                    "accuracy": 3,
                    "damage": 1
                },
                {
                    "range": 6,
                    "rate_of_fire": 1,
                    "accuracy": 4,
                    "damage": 1
                }
            ],
            "munition_count": 1
        },
        "id": "battery_e0b0b65f0473da166d1c41045706a064409c2ce7"
    }]
    let systems = {
        "shield-forward": 2
    }
    let hullSize = 3;
    let engineRating = 5;
    let shipFactors = calculateDesignAttributes(hullSize, engineRating, batteries, systems, { defenses: 2 })
    expect(shipFactors.max_su).toBe(300)
    expect(shipFactors.engines_su).toBe(80)
    expect(shipFactors.weapons_su).toBe(2.02)
    expect(shipFactors.systems_su).toBe(10)
    expect(shipFactors.orat).toBe(2.222)
    expect(shipFactors.drat).toBe(1.00)
    expect(shipFactors.combat_value).toBe(3)
    expect(shipFactors.hull_size).toBe(3)
    expect(shipFactors.effective_hull_size).toBe(parseFloat((3 + 0.67).toFixed(2)))
    expect(shipFactors.effective_engine_rating).toBe(5)
    expect(shipORATTotal(batteries, systems, shipFactors)).toBe(shipFactors.orat)
})

test("Fuel Bunkerage Tests", () => {
    expect(fuelBunkerage(100, 5, 0)).toBe(12)
    expect(fuelBunkerage(100, 22, 0)).toBe(26)
    expect(fuelBunkerage(100, 23, 0)).toBe(26)
    expect(fuelBunkerage(100, 80, 0)).toBe(154)
    expect(fuelBunkerage(100, 80, 1)).toBe(193)
    expect(fuelBunkerage(100, 80, -1)).toBe(128)
})
