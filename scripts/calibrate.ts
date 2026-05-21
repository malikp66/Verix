import fs from 'fs';
import path from 'path';
import { calculateThreatScore } from '../lib/threatEngine';

interface TestCase {
  id: string;
  text: string;
  expected_risk: 'SAFE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
}

// Basic URL extraction matching route.ts
function extractUrls(text: string): string[] {
  const urlRegex = /(?:https?:\/\/)?(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g;
  const matches = text.match(urlRegex) || [];
  return matches.map(url => {
    let cleanUrl = url.trim();
    if (cleanUrl.endsWith('.')) cleanUrl = cleanUrl.slice(0, -1);
    if (!cleanUrl.startsWith('http')) cleanUrl = `http://${cleanUrl}`;
    return cleanUrl;
  });
}

function isMalicious(risk: string) {
  return risk === 'HIGH' || risk === 'CRITICAL' || risk === 'MEDIUM';
}

async function runCalibration() {
  console.log("=========================================");
  console.log("🔬 VERIX THREAT ENGINE CALIBRATION 🔬");
  console.log("=========================================\n");

  const datasetPath = path.join(__dirname, 'dataset.json');
  const dataset: TestCase[] = JSON.parse(fs.readFileSync(datasetPath, 'utf-8'));

  let correct = 0;
  let falsePositives = 0; // Expected SAFE, got MALICIOUS
  let falseNegatives = 0; // Expected MALICIOUS, got SAFE
  let total = dataset.length;

  for (const testCase of dataset) {
    const urls = extractUrls(testCase.text);
    
    // For fast baseline calibration, we run without live OSINT (pure heuristics)
    // To test full pipeline, one would inject mock OSINT or real API calls here.
    const result = calculateThreatScore(testCase.text, urls, {});
    
    const expectedMalicious = isMalicious(testCase.expected_risk);
    const actualMalicious = isMalicious(result.riskLevel);

    const isMatch = expectedMalicious === actualMalicious;
    
    if (isMatch) {
      correct++;
      console.log(`✅ [${testCase.id}] PASS | Score: ${result.score} (${result.riskLevel})`);
    } else {
      if (actualMalicious) falsePositives++;
      if (expectedMalicious) falseNegatives++;
      
      console.log(`❌ [${testCase.id}] FAIL | Expected: ${testCase.expected_risk}, Got: ${result.riskLevel} (Score: ${result.score})`);
      console.log(`   Text: "${testCase.text}"`);
      console.log(`   Triggers: ${result.triggers.join(', ')}`);
    }
  }

  const accuracy = ((correct / total) * 100).toFixed(1);
  
  console.log("\n=========================================");
  console.log("📊 CALIBRATION RESULTS 📊");
  console.log("=========================================");
  console.log(`Total Test Cases : ${total}`);
  console.log(`Accuracy         : ${accuracy}%`);
  console.log(`False Positives  : ${falsePositives} (Safe marked as threat)`);
  console.log(`False Negatives  : ${falseNegatives} (Threat missed entirely)`);
  console.log("=========================================\n");

  if (falseNegatives > 0) {
    console.log("⚠️ WARNING: False negatives detected. Engine heuristics need tuning for these cases.");
  }
}

runCalibration().catch(console.error);
