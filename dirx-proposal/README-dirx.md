# README for dirx

My ssd-dirx.json is an example JSON export file for a Starmada (2024) SSD. It is not intended to be backwards compatible with previous versions of Starmada.

The ssd-dirx.json file is currently a work in progress and not ready for public comment just yet; this spec will be open for discussion once completed. I will also build out a json schema file before discussion occurs as it will communicate more than an example JSON export file can.

Here are a few points to consider when reviewing the JSON:

- The type field is for the type of data the json represents
- The version field allows us to adjust based on rules changes in the future
- The ship field is for tracking data unique to a specific ship vs the ship class it belongs to
  - This includes tracking damage, which means this SSD can be used for both creating new ship classes as well as by utilities that want to track damage
- The ship_class field
- I have chosen to use snake-case for the field names as I find it easier to read over camelCase (which may be a bit non-ideomatic)
- I have an optional `calc` object for storing calculated values for expediency in the import->display process. The file can be read in and immediately used for display after import when all the calculated fields are provided, and then the client can re-calculate the calculated fields to be sure they are accurate, and mark the `validated` field `true`. This is purely an optimization which is why it is optional
- I prefer arcs be listed explicitly in an object for ease of validation and clarity on valid arcs (@doresh has already stated preference to use an array); of course this is open to discussion but figured I'd start with my preference ;)
- The fields `screens_or_` and `_or_screens` is the same field, called `screens`, but showing two different value shapes based on whether the screens are omni-screens (a single int value) or regular screens (separate defensive arcs); of course, this will go away once the json-schema file is created as the schema file will define all possible value shapes
- I plan to provide support in this json file for all optional rules

# TODO

- [ ] represent all optional rules
- [ ] create the json schema for this file
