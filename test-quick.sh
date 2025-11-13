#!/bin/bash
WALLET="0x6313D7948D3491096Ffe00Dea2D246d588b4D4FC"
echo "Testing wallet: $WALLET"
echo ""
node -e "
const { exec } = require('child_process');
exec('npx ts-node -e \"' +
  'import(\\"./src/features/ethBenchmark.js\\").then(m => m.analyzeEthBenchmark(\\"'$WALLET'\\")); ' +
  'import(\\"./src/features/portfolioATH.js\\").then(m => m.analyzePortfolioATH(\\"'$WALLET'\\")); ' +
  '\"', (error, stdout, stderr) => {
  if (error) console.error(error);
  console.log(stdout);
});
"
