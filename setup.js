const redis = require('redis');
const md5 = require('md5');
var inquirer = require('inquirer');

const config = require('./config');
const client = redis.createClient({ host: config.redis.ip });

inquirer
  .prompt([
    {
      'type': 'input', 
      'name': 'username',
      'message':  'Username: ',
    },
    {
      'type': 'password', 
      'name': 'password',
      'message':  'Password: ',
    },
    {
      'type': 'checkbox', 
      'name': 'roles',
      'message':  'Roles: ',
      'choices': [
        {'value': 'admin', 'checked': false},
        {'value': 'user', 'checked': true},
      ],
    },
  ])
  .then(answers => {
    let { username, password, roles } = answers;
    client.set('users/' + username + ':mmd5', md5(md5(password)))
    client.set('users/' + username + ':roles', JSON.stringify(roles))
    client.quit()
  });
