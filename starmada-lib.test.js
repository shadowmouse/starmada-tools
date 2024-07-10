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
} from "starmada-lib.js"

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
})

test("Engine Space Units Factor", () => {
    expect(engineSpaceUnits(8, 5)).toBe(232)
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
            range: 2,
            rate_of_fire: 1,
            accuracy: 2,
            damage: 3
        },{
            range: 4,
            rate_of_fire: 1,
            accuracy: 3,
            damage: 2
        },{
            range: 6,
            rate_of_fire: 1,
            accuracy: 4,
            damage: 1
        }],
        traits: ["accurate"]
    })).toBe(5.09)
})

test("Weapon Bank Space Units", () => {
    let wbsu = weaponBankSpaceUnits(3.9, 2, 2, 0)
    expect(wbsu).toBe(31.2)
})

test("Weapon Bank Space Units - Limited Ammo", () => {
    let wbsu = weaponBankSpaceUnits(14, 3, 4, 2)
    expect(wbsu).toBe(100.8)
})

