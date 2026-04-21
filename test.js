process.on('uncaughtException', err => require('fs').writeFileSync('clean-error.txt', err.stack));
require('./server/index.js');
