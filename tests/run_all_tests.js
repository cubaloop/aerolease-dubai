const { runUnitTests } = require('./unit_tests');
const { runPropertyTests } = require('./property_based_tests');

console.log('====================================================');
console.log('   AEROLEASE: EXTENSIVE TEST SUITE RUNNER           ');
console.log('====================================================\n');

try {
  runUnitTests();
  runPropertyTests();
  console.log('\n  ✓ ALL AEROLEASE TESTS PASSED 100%\n');
  process.exit(0);
} catch (err) {
  console.error('\n  ✗ TEST SUITE FAILED:', err);
  process.exit(1);
}
