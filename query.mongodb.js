// MongoDB Playground
// 1. Make sure the 'MongoDB for VS Code' extension is installed.
// 2. Connect to MongoDB using the connection string: mongodb://localhost:27017
// 3. Click the 'Run' button (Play icon) at the top-right of this file to execute the queries.

// Select the database to use.
use('evoting');

// 1. View all Candidates
console.log("--- Candidates List ---");
const candidates = db.getCollection('candidates').find({});
printjson(candidates);

// 2. View all Casted Votes (Audit Logs)
console.log("--- Casted Votes (Audit Logs) ---");
const votes = db.getCollection('voteaudits').find({});
printjson(votes);
