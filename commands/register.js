const fs = require('fs');
const path = require('path');
const { prompt } = require('inquirer');
const { format } = require('prettier');
const _ = require('lodash');
const persons = require('../data/persons.json');

const command = `register`;
const desc = 'Register a person';

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

  persons.push({
    id: _.kebabCase(`${firstname} ${lastname}`),
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
