const { spawnSync} = require('child_process');
const fs = require('fs');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

(async () => {
  // write output of top command to a file every 15 seconds
  let i = 0;
  while (true) {
    const { stdout } = spawnSync('top', ['-b', '-n', '1']);
    fs.writeFileSync(`top_${i}.txt`, stdout);
    await sleep(5000);
  }
})();