const { map, includes, filter, shuffle, sample, findKey, size, forEach } = require('lodash');
const fs = require('fs');
const path = require('path');
const { prompt } = require('inquirer');
const termSize = require('term-size');

const persons = require('../data/persons');
const draws = require('../data/draws');

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

const getAvailablePersons = (person, participants, mapping) =>
  filter(
    participants,
    participant => {
      if (person.id === participant.id) {
        return false;
      }

      if (person.kids !== participant.kids) {
        return false;
      }

      if (person.exclude.includes(participant.id)) {
        return false;
      }

      if (Object.values(mapping).includes(participant.id)) {
        return false;
      }

      if (findKey(mapping, id => id === person.id) === participant.id) {
        return false;
      }

      return true;
    },
    [],
  );

const shake = participants => {
  const mapping = {};

  forEach(participants, person => {
    const availablePersons = getAvailablePersons(person, participants, mapping);
    const remain = size(participants) - size(mapping);

    let chosenPerson;

    if (remain === 2 && size(availablePersons) === 2) {
      if (mapping[availablePersons[0].id]) {
        [, chosenPerson] = availablePersons;
      } else {
        [chosenPerson] = availablePersons;
      }
    } else {
      chosenPerson = sample(availablePersons);
    }

    mapping[person.id] = chosenPerson.id;
  });

  return mapping;
};

const resolveExclude = (participants, year) => {
  return participants.map(person => {
    let { exclude = [] } = person;

    // Exclude same family members
    exclude = exclude.concat(map(filter(persons, ['lastname', person.lastname]), 'id'));

    // Exclude persons for whom he has already prayed it the two past year
    for (let i = 1; i <= 2; i += 1) {
      const pastYear = year - i;

      if (!draws[pastYear]) {
        break;
      }

      const draw = draws[pastYear];

      if (draw[person.id]) {
        exclude.push(draw[person.id]);
      }
    }

    return {
      ...person,
      exclude,
    };
  });
};

const handler = async ({ year }) => {
  const { rows } = termSize();

  let participants = await ask({
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

  participants = filter(persons, ({ id }) => includes(participants, id));
  participants = resolveExclude(participants, year);
  participants = shuffle(participants);

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
