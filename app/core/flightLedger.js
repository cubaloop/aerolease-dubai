const crypto = require('crypto');
const { sha256, canonicalStringify, hashFlightManifest } = require('./flightHasher');

function hashLeaf(leafData) {
  return sha256(canonicalStringify(leafData));
}

class MerkleTree {
  constructor(leaves) {
    this.leaves = leaves.map(l => (typeof l === 'string' ? l : hashLeaf(l)));
    this.layers = [];
    this.build();
  }

  build() {
    let current = [...this.leaves];
    if (current.length === 0) {
      this.layers = [['0000000000000000000000000000000000000000000000000000000000000000']];
      return;
    }
    this.layers.push(current);
    while (current.length > 1) {
      const next = [];
      for (let i = 0; i < current.length; i += 2) {
        if (i + 1 < current.length) {
          const combined = current[i] < current[i + 1]
            ? current[i] + current[i + 1]
            : current[i + 1] + current[i];
          next.push(sha256(combined));
        } else {
          next.push(current[i]);
        }
      }
      this.layers.push(next);
      current = next;
    }
  }

  getRoot() {
    return this.layers[this.layers.length - 1][0];
  }

  getProof(leafIndex) {
    if (leafIndex < 0 || leafIndex >= this.leaves.length) {
      throw new Error('Index out of bounds');
    }
    const proof = [];
    let index = leafIndex;
    for (let layerIndex = 0; layerIndex < this.layers.length - 1; layerIndex++) {
      const layer = this.layers[layerIndex];
      const isRightNode = index % 2 === 1;
      const pairIndex = isRightNode ? index - 1 : index + 1;
      if (pairIndex < layer.length) {
        proof.push({
          position: isRightNode ? 'left' : 'right',
          hash: layer[pairIndex]
        });
      }
      index = Math.floor(index / 2);
    }
    return proof;
  }

  static verifyProof(leafHash, proof, root) {
    let currentHash = leafHash;
    for (const p of proof) {
      const combined = p.position === 'left'
        ? p.hash + currentHash
        : currentHash + p.hash;
      const sorted = p.position === 'left'
        ? (p.hash < currentHash ? p.hash + currentHash : currentHash + p.hash)
        : (currentHash < p.hash ? currentHash + p.hash : p.hash + currentHash);
      currentHash = sha256(sorted);
    }
    return currentHash === root;
  }
}

class FlightRegistry {
  constructor() {
    this.flights = new Map();
    this.boardingPasses = [];
  }

  registerFlight(flight) {
    if (!flight.flightNumber) {
      throw new Error('Missing flightNumber');
    }
    const manifestHash = hashFlightManifest(flight);
    const record = {
      ...flight,
      manifestHash,
      status: 'SCHEDULED',
      bookedSeats: 0,
      createdAt: new Date().toISOString()
    };
    this.flights.set(flight.flightNumber, record);
    return record;
  }

  bookSeat(flightNumber, passengerName, seatNumber) {
    const flight = this.flights.get(flightNumber);
    if (!flight) {
      throw new Error('Flight not found: ' + flightNumber);
    }
    if (flight.bookedSeats >= flight.totalSeats) {
      throw new Error('Flight is fully booked');
    }

    flight.bookedSeats++;
    const passPayload = {
      passId: 'BP-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
      flightNumber,
      tailNumber: flight.tailNumber,
      passengerName,
      seatNumber,
      issuedAt: new Date().toISOString()
    };
    const passHash = sha256(canonicalStringify(passPayload));
    const boardingPass = {
      ...passPayload,
      passHash
    };
    this.boardingPasses.push(boardingPass);
    return boardingPass;
  }

  getMerkleRoot() {
    const leaves = Array.from(this.flights.values()).map(f => hashLeaf({
      flightNumber: f.flightNumber,
      manifestHash: f.manifestHash,
      status: f.status,
      bookedSeats: f.bookedSeats
    }));
    const tree = new MerkleTree(leaves);
    return tree.getRoot();
  }

  getAllFlights() {
    return Array.from(this.flights.values());
  }

  getAllBoardingPasses() {
    return [...this.boardingPasses];
  }
}

module.exports = {
  MerkleTree,
  FlightRegistry,
  hashLeaf
};
