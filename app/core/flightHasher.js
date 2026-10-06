const crypto = require('crypto');

/**
 * Standardize and canonically stringify an object for cryptographic reproducibility.
 * Filters prototype keys to prevent prototype pollution.
 */
function canonicalStringify(obj) {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return '[' + obj.map(canonicalStringify).join(',') + ']';
  }
  const keys = Object.getOwnPropertyNames(obj).filter(
    k => k !== '__proto__' && k !== 'constructor' && k !== 'prototype'
  ).sort();
  return '{' + keys.map(k => JSON.stringify(k) + ':' + canonicalStringify(obj[k])).join(',') + '}';
}

function sha256(data) {
  return crypto.createHash('sha256').update(data, 'utf8').digest('hex');
}

/**
 * Compute cryptographic hash of a flight manifest
 */
function hashFlightManifest(flight) {
  const canonical = canonicalStringify({
    flightNumber: flight.flightNumber,
    tailNumber: flight.tailNumber,
    aircraftModel: flight.aircraftModel,
    originIcao: flight.originIcao,
    destinationIcao: flight.destinationIcao,
    scheduledDeparture: flight.scheduledDeparture,
    scheduledArrival: flight.scheduledArrival,
    gcaaAocNumber: flight.gcaaAocNumber,
    totalSeats: flight.totalSeats,
    seatPriceAed: flight.seatPriceAed
  });
  return sha256(canonical);
}

/**
 * Hash ADS-B Transponder Telemetry Ping
 */
function hashAdsbPing(ping) {
  const canonical = canonicalStringify({
    flightNumber: ping.flightNumber,
    timestamp: ping.timestamp,
    altitudeFeet: Math.round(ping.altitudeFeet),
    groundSpeedKnots: Math.round(ping.groundSpeedKnots),
    lat: Number(ping.lat.toFixed(4)),
    lon: Number(ping.lon.toFixed(4)),
    squawkCode: ping.squawkCode
  });
  return sha256(canonical);
}

module.exports = {
  canonicalStringify,
  sha256,
  hashFlightManifest,
  hashAdsbPing
};
