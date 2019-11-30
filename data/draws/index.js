const fs = require('fs');
const path = require('path');

const files = fs.readdirSync(__dirname);

const draws = {};
files.forEach(filename => {
  const matches = /^([0-9]{4})\.json$/.exec(filename);

  if (!matches) {
    return;
  }

  const [, year] = matches;
  draws[year] = JSON.parse(fs.readFileSync(path.join(__dirname, filename)));
});

module.exports = draws;
