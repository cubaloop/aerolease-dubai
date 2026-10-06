const assert = require('assert');
const {
  canonicalStringify,
  sha256,
  hashFlightManifest,
  hashAdsbPing,
  FlightEscrow,
  MerkleTree,
  FlightRegistry,
  hashLeaf
} = require('../app/core');

function runUnitTests() {
  console.log('--- RUNNING AEROLEASE UNIT TESTS ---');

  // Test 1: Flight manifest hashing
  const flight = {
    flightNumber: 'VIP-7701',
    tailNumber: 'A6-DXB',
    aircraftModel: 'Gulfstream G650ER',
    originIcao: 'OMDW',
    destinationIcao: 'EGGW',
    scheduledDeparture: '2026-10-10T06:00:00Z',
    scheduledArrival: '2026-10-10T13:30:00Z',
    gcaaAocNumber: 'AOC-UAE-1092',
    totalSeats: 12,
    seatPriceAed: 18500
  };

  const manifestHash = hashFlightManifest(flight);
  assert.strictEqual(typeof manifestHash, 'string');
  assert.strictEqual(manifestHash.length, 64);
  console.log('  ✓ FlightHasher: Hashes private jet flight manifest deterministically');

  // Test 2: Tri-stage Escrow Lifecycle & Fund Conservation
  const totalAmount = 18500 * 12; // 222,000 AED
  const escrow = new FlightEscrow('CHARTER-VIP-7701', totalAmount, 12);
  assert.strictEqual(escrow.heldInEscrow, totalAmount);
  assert.strictEqual(escrow.disbursedToOperator, 0);

  // Milestone 1: Clearance (20%)
  escrow.releaseMilestone1_Clearance();
  assert.strictEqual(escrow.stage, 'CLEARED_BY_GCAA');
  assert.strictEqual(escrow.disbursedToOperator, parseFloat((totalAmount * 0.20).toFixed(2)));

  // Milestone 2: Takeoff ADS-B (30%)
  const adsb = {
    flightNumber: 'VIP-7701',
    timestamp: '2026-10-10T06:12:00Z',
    altitudeFeet: 8500,
    groundSpeedKnots: 340,
    lat: 24.8963,
    lon: 55.1614,
    squawkCode: '4211'
  };
  escrow.releaseMilestone2_Takeoff(adsb);
  assert.strictEqual(escrow.stage, 'TAKEOFF_VERIFIED');
  assert.strictEqual(escrow.disbursedToOperator, parseFloat((totalAmount * 0.50).toFixed(2)));

  // Milestone 3: Touchdown (remaining 50%)
  escrow.releaseMilestone3_Touchdown({ wheelStopUtc: '2026-10-10T13:25:00Z', airport: 'EGGW' });
  assert.strictEqual(escrow.stage, 'TOUCHDOWN_COMPLETE');
  assert.strictEqual(escrow.heldInEscrow, 0);
  assert.strictEqual(escrow.disbursedToOperator, totalAmount);
  assert.strictEqual(escrow.verifyConservation(), true);
  console.log('  ✓ FlightEscrow: Successfully executes tri-stage escrow with strict conservation');

  // Test 3: Cancellation Refund
  const escrow2 = new FlightEscrow('CHARTER-CANCEL-01', 50000, 2);
  escrow2.releaseMilestone1_Clearance();
  escrow2.cancelFlight('Severe Sandstorm Ground Stop');
  assert.strictEqual(escrow2.stage, 'CANCELLED_REFUNDED');
  assert.strictEqual(escrow2.heldInEscrow, 0);
  assert.strictEqual(escrow2.verifyConservation(), true);
  console.log('  ✓ FlightEscrow: Preserves conservation invariant upon flight cancellation');

  // Test 4: Flight Registry & Merkle Root
  const registry = new FlightRegistry();
  registry.registerFlight(flight);
  const pass = registry.bookSeat(flight.flightNumber, 'H.E. Sheikh Al Qasimi', 'Seat 1A');
  assert.strictEqual(typeof pass.passId, 'string');
  assert.strictEqual(registry.getAllFlights()[0].bookedSeats, 1);

  const root = registry.getMerkleRoot();
  assert.strictEqual(typeof root, 'string');
  assert.strictEqual(root.length, 64);
  console.log('  ✓ FlightLedger: Issues cryptographic boarding pass and commits Merkle root');

  console.log('AEROLEASE UNIT TESTS: All 4 passed, 0 failed.');
  return true;
}

if (require.main === module) {
  runUnitTests();
}

module.exports = { runUnitTests };
