const fs = require('fs');
const path = require('path');
const { prompt } = require('inquirer');
const { format } = require('prettier');
const _ = require('lodash');
const persons = require('../data/persons.json');

const command = `register`;
const desc = 'Register a person';

const confirm = async message =>
  (
    await prompt({
      name: 'ok',
      type: 'confirm',
      message,
    })
  ).ok;

const getAvailableId = baseId => {
  let counter = 2;
  while (_.find(persons, ['id', `${baseId}${counter}`])) {
    counter += 1;
  }

  return `${baseId}${counter}`;
};

const handler = async () => {
  const questions = [
    {
      name: 'firstname',
      message: 'Prénom',
    },
    {
      name: 'lastname',
      message: 'Nom',
    },
    {
      name: 'kids',
      message: 'Enfant',
      type: 'confirm',
      default: false,
    },
  ];

  const { firstname, lastname, kids } = await prompt(questions);

  let id = _.kebabCase(`${firstname} ${lastname}`);

  if (_.find(persons, ['id', id])) {
    if (!confirm(`${firstname} ${lastname} is already registered. Do you want to continue`)) {
      return;
    }

    id = getAvailableId(id);
  }

  persons.push({
    id,
    firstname,
    lastname,
    kids,
    exclude: [],
  });

  const sortedPersons = _.sortBy(persons, ['id']);
  const filepath = path.join(__dirname, '../data/persons.json');

  let content = JSON.stringify(sortedPersons, '  ', 2);
  content = format(content, { parser: 'json' });

  fs.writeFileSync(filepath, content);
};

module.exports = {
  command,
  desc,
  handler,
};
