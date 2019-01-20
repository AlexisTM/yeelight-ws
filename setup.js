const redis = require('redis');
const client = redis.createClient({ host: '192.168.178.23' });
const md5 = require('md5');
var inquirer = require('inquirer');

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
    client.get('users/' + username + ':mmd5', console.log)
    client.get('users/' + username + ':roles', console.log)
    client.quit()
  });
