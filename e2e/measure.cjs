const http = require('http');

function measure(url, count = 5) {
  return new Promise((resolve) => {
    const times = [];
    let completed = 0;

    const doOne = (i) => {
      const start = Date.now();
      const req = http.get(url, (res) => {
        // consume response
        res.on('data', () => {});
        res.on('end', () => {
          const ms = Date.now() - start;
          times.push(ms);
          completed++;
          if (completed < count) doOne(completed);
          else resolve(times);
        });
      });
      req.on('error', (err) => {
        const ms = Date.now() - start;
        times.push(ms);
        completed++;
        if (completed < count) doOne(completed);
        else resolve(times);
      });
    };

    doOne(0);
  });
}

(async () => {
  const root = 'http://localhost:3000/';
  const ride1 = 'http://localhost:3000/api/rides/1';

  console.log('Measuring', root);
  const t1 = await measure(root, 5);
  console.log('samples:', t1);
  console.log('avg:', (t1.reduce((a,b)=>a+b,0)/t1.length).toFixed(2),'ms');

  console.log('Measuring', ride1);
  const t2 = await measure(ride1, 5);
  console.log('samples:', t2);
  console.log('avg:', (t2.reduce((a,b)=>a+b,0)/t2.length).toFixed(2),'ms');

  process.exit(0);
})();
