import { calculateSRS } from "../src/lib/srs";

function testSRS() {
    console.log("Testing SRS Algorithm...");

    // Test Case 1: New card, Quality 5 (Easy)
    // calculateSRS(quality, repetitions, easeFactor, interval)
    let result = calculateSRS(5, 0, 250, 0);
    console.log("New Card (Q=5):", result);
    if (result.interval !== 1 || result.repetitions !== 1) console.error("FAIL: New Card Q=5");

    // Test Case 2: New card, Quality 3 (Hard)
    result = calculateSRS(3, 0, 250, 0);
    console.log("New Card (Q=3):", result);
    if (result.interval !== 1 || result.repetitions !== 1) console.error("FAIL: New Card Q=3");

    // Test Case 3: Second review, Quality 4 (Good)
    result = calculateSRS(4, 1, 250, 1);
    console.log("2nd Review (Q=4):", result);
    if (result.interval !== 6 || result.repetitions !== 2) console.error("FAIL: 2nd Review Q=4");

    // Test Case 4: Third review, Quality 5 (Easy)
    // Interval = 6 * 2.5 = 15
    result = calculateSRS(5, 2, 250, 6);
    console.log("3rd Review (Q=5):", result);
    if (result.interval !== 15 || result.repetitions !== 3) console.error("FAIL: 3rd Review Q=5");

    // Test Case 5: Fail (Quality < 3)
    result = calculateSRS(2, 3, 260, 15);
    console.log("Fail (Q=2):", result);
    if (result.interval !== 1 || result.repetitions !== 0) console.error("FAIL: Fail Q=2");

    console.log("SRS Verification Complete.");
}

testSRS();
