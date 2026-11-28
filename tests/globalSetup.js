// Runs once before Jest starts its workers (they inherit this). Tests run
// in a fixed time zone that isn't UTC, so date tests mean the same thing on
// every machine, and catch code that ignores the phone's time zone (CI
// machines are in UTC, where that mistake would go unnoticed).
module.exports = async () => {
  process.env.TZ = 'America/Los_Angeles';
};
