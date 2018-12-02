const {
  map,
  transform,
  pick,
  pickBy,
  includes,
  filter,
  reduce,
  isArray,
  shuffle,
  sample,
  some,
  findKey,
  get,
  size,
  forEach,
  mapValues,
} = require('lodash');
const fs = require('fs');
const path = require('path');
const { prompt, Separator } = require('inquirer');
const termSize = require('term-size');

const persons = require('../data/persons.json');

const command = `draw`;
const desc = "Let's draw";

const builder = yargs =>
  yargs.options({
    year: {
      alias: 'y',
      desc: 'Year',
      type: 'number',
      default: new Date().getFullYear(),
      demandOption: true,
    },
  });

const ask = async options => {
  const { answer } = await prompt([{ ...options, name: 'answer' }]);

  return answer || null;
};

const confirm = message =>
  ask({
    name: 'continue',
    type: 'confirm',
    message,
  });

const isExcluded = ({ exclude = null }, name) => {
  if (!isArray(exclude)) {
    return false;
  }

  return some(exclude, item => {
    const reg = new RegExp(item);

    return reg.test(name);
  });
};

const getAvailablePersons = (person, selectedPersons, linkedPersons) =>
  reduce(
    selectedPersons,
    (acc, current) => {
      if (person.name === current.name) {
        return acc;
      }

      if (person.kids !== current.kids) {
        return acc;
      }

      if (isExcluded(person, current.name)) {
        return acc;
      }

      if (some(linkedPersons, ['name', current.name])) {
        return acc;
      }

      if (findKey(linkedPersons, ['name', person.name]) === current.name) {
        return acc;
      }

      return [...acc, current];
    },
    [],
  );

const shake = names => {
  const selectedPersons = shuffle(filter(persons, ({ name }) => includes(names, name)));

  const linkedPersons = {};

  forEach(selectedPersons, person => {
    const availablePersons = getAvailablePersons(person, selectedPersons, linkedPersons);
    const remain = size(selectedPersons) - size(linkedPersons);

    let chosenPerson;

    if (remain === 2 && size(availablePersons) === 2) {
      if (linkedPersons[availablePersons[0].name]) {
        chosenPerson = availablePersons[1];
      } else {
        chosenPerson = availablePersons[0];
      }
    } else {
      chosenPerson = sample(availablePersons);
    }

    linkedPersons[person.name] = chosenPerson;

    // console.log(
    //   person.name,
    //   person.kids ? '(kids)' : '',
    //   '=>',
    //   get(chosenPerson, 'name'),
    //   get(chosenPerson, 'kids') ? '(kids)' : '',
    //   remain,
    //   size(availablePersons),
    // );
  });

  return linkedPersons;
};

const handler = async ({ year }) => {
  const { rows } = termSize();

  const participants = await ask({
    type: 'checkbox',
    message: 'Select the participants',
    choices: map(persons, ({ name, kids }) => ({
      value: name,
      name: `${name}${kids ? ' (kid)' : ''}`,
      checked: true,
    })),
    pageSize: Math.max(10, rows - 10),
    validate: input => {
      if (input.length < 3) {
        return 'You must choose 3 persons at least';
      }

      return true;
    },
  });

  // if (!confirm(`Are you ready to random draw with these ${participants.length} persons?`)) {
  //   return;
  // }

  const mapping = mapValues(shake(participants), ({ name }) => name);

  fs.writeFileSync(
    path.join(__dirname, `../data/draws/${year}.json`),
    JSON.stringify(mapping, null, 2),
  );
};

module.exports = {
  command,
  desc,
  builder,
  handler,
};
