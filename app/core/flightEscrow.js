const { sha256, canonicalStringify } = require('./flightHasher');

/**
 * Escrow Stages for VIP Private Jet Charter:
 * 1. PLEDGED: Passenger funds locked in smart escrow.
 * 2. CLEARED_BY_GCAA: Flight plan approved & ramp slot assigned (20% released).
 * 3. TAKEOFF_VERIFIED: ADS-B transponder altitude verified (30% released).
 * 4. TOUCHDOWN_COMPLETE: Safe landing wheel-stop confirmed (final 50% released).
 * 5. CANCELLED_REFUNDED: 100% returned to passenger if operator cancels.
 */
class FlightEscrow {
  constructor(charterId, totalAmountAed, totalSeats = 1) {
    if (totalAmountAed <= 0) {
      throw new Error('Escrow amount must be positive');
    }
    this.charterId = charterId;
    this.initialTotalAed = totalAmountAed;
    this.totalSeats = totalSeats;
    this.heldInEscrow = totalAmountAed;
    this.disbursedToOperator = 0;
    this.refundedToPassengers = 0;
    this.stage = 'PLEDGED';
    this.history = [];
    this.recordHistory('ESCROW_PLEDGED', { amount: totalAmountAed });
  }

  recordHistory(action, details = {}) {
    const entry = {
      action,
      stage: this.stage,
      heldInEscrow: this.heldInEscrow,
      disbursedToOperator: this.disbursedToOperator,
      refundedToPassengers: this.refundedToPassengers,
      timestamp: new Date().toISOString(),
      ...details
    };
    entry.entryHash = sha256(canonicalStringify(entry));
    this.history.push(entry);
    return entry;
  }

  verifyConservation() {
    const currentSum = parseFloat((this.heldInEscrow + this.disbursedToOperator + this.refundedToPassengers).toFixed(2));
    const targetSum = parseFloat(this.initialTotalAed.toFixed(2));
    if (Math.abs(currentSum - targetSum) > 0.001) {
      throw new Error(`VIOLATION: Conservation of funds failed. Current sum: ${currentSum}, Initial: ${targetSum}`);
    }
    return true;
  }

  releaseMilestone1_Clearance() {
    if (this.stage !== 'PLEDGED') {
      throw new Error(`Cannot release Milestone 1 from stage ${this.stage}`);
    }
    const releaseAmount = parseFloat((this.initialTotalAed * 0.20).toFixed(2));
    this.heldInEscrow = parseFloat((this.heldInEscrow - releaseAmount).toFixed(2));
    this.disbursedToOperator = parseFloat((this.disbursedToOperator + releaseAmount).toFixed(2));
    this.stage = 'CLEARED_BY_GCAA';
    this.verifyConservation();
    return this.recordHistory('MILESTONE_1_GCAA_CLEARED', { released: releaseAmount });
  }

  releaseMilestone2_Takeoff(adsbPing) {
    if (this.stage !== 'CLEARED_BY_GCAA') {
      throw new Error(`Cannot release Milestone 2 from stage ${this.stage}`);
    }
    if (!adsbPing || adsbPing.altitudeFeet < 3000) {
      throw new Error('Takeoff verification failed: ADS-B altitude below threshold');
    }
    const releaseAmount = parseFloat((this.initialTotalAed * 0.30).toFixed(2));
    this.heldInEscrow = parseFloat((this.heldInEscrow - releaseAmount).toFixed(2));
    this.disbursedToOperator = parseFloat((this.disbursedToOperator + releaseAmount).toFixed(2));
    this.stage = 'TAKEOFF_VERIFIED';
    this.verifyConservation();
    return this.recordHistory('MILESTONE_2_TAKEOFF', { released: releaseAmount, adsbPing });
  }

  releaseMilestone3_Touchdown(landingReceipt) {
    if (this.stage !== 'TAKEOFF_VERIFIED') {
      throw new Error(`Cannot release Milestone 3 from stage ${this.stage}`);
    }
    const releaseAmount = this.heldInEscrow; // Release remaining funds
    this.disbursedToOperator = parseFloat((this.disbursedToOperator + releaseAmount).toFixed(2));
    this.heldInEscrow = 0;
    this.stage = 'TOUCHDOWN_COMPLETE';
    this.verifyConservation();
    return this.recordHistory('MILESTONE_3_TOUCHDOWN', { released: releaseAmount, landingReceipt });
  }

  cancelFlight(reason = 'Operator Cancellation') {
    if (this.stage === 'TOUCHDOWN_COMPLETE') {
      throw new Error('Cannot cancel a completed flight');
    }
    const refundAmount = this.heldInEscrow;
    this.refundedToPassengers = parseFloat((this.refundedToPassengers + refundAmount).toFixed(2));
    this.heldInEscrow = 0;
    this.stage = 'CANCELLED_REFUNDED';
    this.verifyConservation();
    return this.recordHistory('FLIGHT_CANCELLED', { refundAmount, reason });
  }

  getProofSummary() {
    this.verifyConservation();
    return {
      charterId: this.charterId,
      stage: this.stage,
      initialTotalAed: this.initialTotalAed,
      heldInEscrow: this.heldInEscrow,
      disbursedToOperator: this.disbursedToOperator,
      refundedToPassengers: this.refundedToPassengers,
      isConserved: true,
      lastHash: this.history[this.history.length - 1].entryHash
    };
  }
}

module.exports = { FlightEscrow };
