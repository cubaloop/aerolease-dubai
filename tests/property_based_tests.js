const fc = require('fast-check');
const assert = require('assert');
const {
  canonicalStringify,
  sha256,
  FlightEscrow,
  MerkleTree,
  FlightRegistry,
  hashLeaf
} = require('../app/core');

function runPropertyTests() {
  console.log('--- RUNNING AEROLEASE PROPERTY-BASED TESTS (5,000 INVARIANTS) ---');

  // Property 1: Conservation of Funds across all flight states (2,500 runs)
  console.log('Testing Property 1: Flight Escrow Conservation Invariant...');
  fc.assert(
    fc.property(
      fc.double({ min: 1000, max: 2000000, noNaN: true }),
      fc.integer({ min: 1, max: 16 }),
      fc.boolean(), // whether to complete or cancel
      (totalAmount, seats, doComplete) => {
        const roundedAmount = parseFloat(totalAmount.toFixed(2));
        const escrow = new FlightEscrow('CHARTER-' + Math.random().toString(36), roundedAmount, seats);
        assert.strictEqual(escrow.verifyConservation(), true);

        // Milestone 1
        escrow.releaseMilestone1_Clearance();
        assert.strictEqual(escrow.verifyConservation(), true);

        if (doComplete) {
          // Milestone 2
          escrow.releaseMilestone2_Takeoff({
            altitudeFeet: 35000,
            groundSpeedKnots: 490,
            lat: 25.1,
            lon: 55.3,
            squawkCode: '1200'
          });
          assert.strictEqual(escrow.verifyConservation(), true);

          // Milestone 3
          escrow.releaseMilestone3_Touchdown({ touchdown: true });
          assert.strictEqual(escrow.verifyConservation(), true);
          assert.strictEqual(escrow.heldInEscrow, 0);
          assert.strictEqual(escrow.disbursedToOperator, roundedAmount);
        } else {
          // Cancel
          escrow.cancelFlight('Passenger Weather Disruption');
          assert.strictEqual(escrow.verifyConservation(), true);
          assert.strictEqual(escrow.heldInEscrow, 0);
          assert.strictEqual(escrow.refundedToPassengers > 0, true);
        }

        const summary = escrow.getProofSummary();
        assert.strictEqual(summary.isConserved, true);
        return true;
      }
    ),
    { numRuns: 2500 }
  );
  console.log('  ✓ Property 1 PASSED (2,500 runs)');

  // Property 2: Merkle Tree Proof Soundness & Anti-Tampering (2,500 runs)
  console.log('Testing Property 2: Flight Manifest Merkle Inclusion & Tamper Resistance...');
  fc.assert(
    fc.property(
      fc.array(
        fc.record({
          flightNo: fc.string({ minLength: 4, maxLength: 8 }),
          tailNo: fc.constantFrom('A6-VIP', 'A6-DXB', 'A6-AUH', 'A6-MAK'),
          paxCount: fc.integer({ min: 1, max: 14 })
        }),
        { minLength: 1, maxLength: 20 }
      ),
      fc.integer({ min: 0, max: 19 }),
      (flights, targetIdx) => {
        const leafIndex = targetIdx % flights.length;
        const leaves = flights.map(f => hashLeaf(f));
        const tree = new MerkleTree(leaves);
        const root = tree.getRoot();

        // Legitimate proof
        const proof = tree.getProof(leafIndex);
        const isValid = MerkleTree.verifyProof(leaves[leafIndex], proof, root);
        assert.strictEqual(isValid, true);

        // Tampered leaf
        const tamperedLeaf = sha256('TAMPERED_MANIFEST_' + leafIndex);
        const isTamperedValid = MerkleTree.verifyProof(tamperedLeaf, proof, root);
        assert.strictEqual(isTamperedValid, false);
        return true;
      }
    ),
    { numRuns: 2500 }
  );
  console.log('  ✓ Property 2 PASSED (2,500 runs)');

  console.log('\n--- ALL 5,000 AEROLEASE PROPERTY-BASED TESTS PASSED WITH 100% SUCCESS ---');
  return true;
}

if (require.main === module) {
  runPropertyTests();
}

module.exports = { runPropertyTests };
