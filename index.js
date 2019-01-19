const express = require('express');
const app = express()
const port = 3000
const WebSocket = require('ws');
const redis = require("redis");
const client = redis.createClient({ host: '192.168.178.23' });
const md5 = require('md5');
const TokenGenerator = require('uuid-token-generator');
const tokgen = new TokenGenerator();

function verifyClient(info, done) {
  console.log(info);
  done(true);
}

const wss = new WebSocket.Server({ port: 3030, verifyClient:verifyClient, clientTracking: true });
const YeeDevice = require('yeelight-platform').Device;
const YeeConstants = require('yeelight-platform').Constants;
const attributes_names = ['name', 'active_mode', 'power', 'bright', 'ct', 'bg_power', 'bg_hue', 'bg_rgb', 'bg_sat', 'bg_ct'];

var lights = [];

// Users: alexis, vorleak, test:test
// client.keys('users/alexis', console.log)
// users/alexis:tokens_hey

const SECS_IN_A_DAY = 86400;

function addLight(name, ip, model=undefined) {
  let light = {
    name: name,
    device: new YeeDevice({
      host: ip, 
      port: 55443,
      attributes: attributes_names, 
      id: lights.length+1,
      model: model 
    })
  }
  lights.push(light);
}

function send(topic, data) {
  let msg = {
    "topic": topic, 
    "data": data
  };
  for(c of wss.clients) {
    c.send(JSON.stringify(msg));
  }
}

// Could be fetch via discovery service.
addLight("living", "192.168.178.32", "ceiling4");
addLight("dining", "192.168.178.33", "ceiling4");

wss.on('connection', function connection(ws) {
  ws.on('message', function incoming(message) {
    try {
      let msg = JSON.parse(message);
      let targets = lights.filter(light => msg.lights.indexOf(light.device.attributes.name) >= 0);
      if (msg.topic == "hsv") {
        for (const target of targets) {
          if(target.device.model == "ceiling4") {
            target.device.sendCommand('bg_set_hsv', msg.data)
          } else {
            target.device.sendCommand('set_hsv', msg.data)
          }
        }
      } else {
        if(YeeConstants.methods.indexOf(msg.topic) < 0) {
          console.log("What to do with this?", msg);
          return;
        }
        for (const target of targets) {
          console.log("Sending a raw message");
          target.device.sendCommand(msg.topic, msg.data)
        }
      }
    } catch (error) {
      console.error(error);
    }
  });
  for(light of lights) {
    if(light.device.attributes.name != null)
      send("heartbeat", light.device.attributes);
  }
});

for(let light of lights) {
  light.device.connect();
  light.device.on('update', (attrs, light) => {
    for(c of wss.clients) {
      send("heartbeat", attrs);
    }
  });
}

app.use(express.static('www'));
app.get("/login", function(req, res){
  const {username, password} = req.query;
  console.log(username, password)
  if(username && password) {
    client.get('users/' + username + ':mmd5', function(err, data) {
      if(data == md5(password)) {
        let token = tokgen.generate();
        client.set('users/' + username + ':token', token, 'EX', 10*86400);
        res.send(token);
      }
    });
  } else {

  }
});
app.listen(port,  () => console.log(`Example app listening on port ${port}!`));
