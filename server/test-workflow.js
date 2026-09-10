const { canTransition } = require('./src/services/workflowService');

console.log("--- Valid Transitions ---");
console.log("draft -> pending:", canTransition('draft', 'pending') === true ? 'PASS' : 'FAIL');
console.log("pending -> approved:", canTransition('pending', 'approved') === true ? 'PASS' : 'FAIL');
console.log("pending -> rejected:", canTransition('pending', 'rejected') === true ? 'PASS' : 'FAIL');
console.log("rejected -> pending:", canTransition('rejected', 'pending') === true ? 'PASS' : 'FAIL');

console.log("\n--- Invalid Transitions ---");
console.log("draft -> approved:", canTransition('draft', 'approved') === false ? 'PASS' : 'FAIL');
console.log("draft -> rejected:", canTransition('draft', 'rejected') === false ? 'PASS' : 'FAIL');
console.log("pending -> pending:", canTransition('pending', 'pending') === false ? 'PASS' : 'FAIL');
console.log("approved -> pending:", canTransition('approved', 'pending') === false ? 'PASS' : 'FAIL');
console.log("approved -> rejected:", canTransition('approved', 'rejected') === false ? 'PASS' : 'FAIL');
console.log("approved -> draft:", canTransition('approved', 'draft') === false ? 'PASS' : 'FAIL');
console.log("rejected -> approved:", canTransition('rejected', 'approved') === false ? 'PASS' : 'FAIL');
console.log("rejected -> rejected:", canTransition('rejected', 'rejected') === false ? 'PASS' : 'FAIL');
