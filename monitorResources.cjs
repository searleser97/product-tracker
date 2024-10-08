const { spawnSync} = require('child_process');
const fs = require('fs');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

(async () => {
  // write output of top command to a file every 15 seconds
  let i = 0;
  while (true) {
    const { stdout } = spawnSync('top', ['-b', '-n', '1']);
    const filename = `top_${i}.txt`;
    fs.writeFileSync(filename, stdout);
    i++;
    console.log(`top command output written to file ${filename}`);
    await sleep(90000);
  }
})();