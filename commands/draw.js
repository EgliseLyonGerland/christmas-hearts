const {
  map,
  includes,
  filter,
  reduce,
  isArray,
  shuffle,
  sample,
  some,
  findKey,
  size,
  forEach,
} = require('lodash');
const fs = require('fs');
const path = require('path');
const { prompt } = require('inquirer');
const termSize = require('term-size');

const persons = require('../data/persons');

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

const isExcluded = ({ lastname, exclude = null }, current) => {
  if (lastname === current.lastname) {
    return true;
  }

  if (!isArray(exclude)) {
    return false;
  }

  return some(exclude, item => item === current.id);
};

const getAvailablePersons = (person, selectedPersons, linkedPersons) =>
  reduce(
    selectedPersons,
    (acc, current) => {
      if (person.id === current.id) {
        return acc;
      }

      if (person.kids !== current.kids) {
        return acc;
      }

      if (isExcluded(person, current)) {
        return acc;
      }

      if (some(linkedPersons, ['id', current.id])) {
        return acc;
      }

      if (findKey(linkedPersons, ['id', person.id]) === current.id) {
        return acc;
      }

      return [...acc, current];
    },
    [],
  );

const shake = ids => {
  const selectedPersons = shuffle(filter(persons, ({ id }) => includes(ids, id)));

  const linkedPersons = {};

  forEach(selectedPersons, person => {
    const availablePersons = getAvailablePersons(person, selectedPersons, linkedPersons);
    const remain = size(selectedPersons) - size(linkedPersons);

    let chosenPerson;

    if (remain === 2 && size(availablePersons) === 2) {
      if (linkedPersons[availablePersons[0].id]) {
        [, chosenPerson] = availablePersons;
      } else {
        [chosenPerson] = availablePersons;
      }
    } else {
      chosenPerson = sample(availablePersons);
    }

    linkedPersons[person.id] = chosenPerson.id;
  });

  return linkedPersons;
};

const handler = async ({ year }) => {
  const { rows } = termSize();

  const participants = await ask({
    type: 'checkbox',
    message: 'Select the participants',
    choices: map(persons, ({ id, fullname, kids }) => ({
      value: id,
      name: `${fullname}${kids ? ' (kid)' : ''}`,
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

  if (!(await confirm(`Are you ready to random draw with these ${participants.length} persons?`))) {
    return;
  }

  const mapping = shake(participants);

  fs.writeFileSync(
    path.join(__dirname, `../data/draws/${year}.json`),
    `${JSON.stringify(mapping, null, 2)}\n`,
  );
};

module.exports = {
  command,
  desc,
  builder,
  handler,
};
