const persons = require('./persons.json');

module.exports = persons.map(person => ({
  ...person,
  fullname: `${person.firstname} ${person.lastname}`,
}));
