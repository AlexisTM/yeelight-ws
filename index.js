const express = require('express');
const app = express()
const port = 3000
const WebSocket = require('ws');
const redis = require("redis");
const md5 = require('md5');
const TokenGenerator = require('uuid-token-generator');
const tokgen = new TokenGenerator();
const YeeDevice = require('yeelight-platform').Device;
const YeeConstants = require('yeelight-platform').Constants;
const config = require('./config');
const cookieParser = require('./lib/cookie');
const attributes_names = ['name', 'active_mode', 'power', 'bright', 'ct', 'bg_power', 'bg_hue', 'bg_rgb', 'bg_sat', 'bg_ct'];

const client = redis.createClient({ host: config.redis.ip });

function verifyClient(info, done) {
  let cookie = cookieParser(info.req.headers.cookie);
  check_token(cookie.username, cookie.token, (success, data) => {
    done(success);
  });
}

const wss = new WebSocket.Server({ 
  port: 3030, 
  verifyClient:verifyClient, 
  clientTracking: true
});

var lights = [];

// Users: alexis, vorleak, test:test
// client.keys('users/alexis', console.log)
// users/alexis:tokens_hey

const SECS_IN_A_DAY = 86400;

function addLight(ip, model=undefined) {
  let light = {
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

for (let {ip, type} of config.lights) {
  console.log("Adding the light", type, "at", ip);
  addLight(ip, type);
}

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
        res.send(token);
        client.set('users/' + username + ':token-'+token, token, 'EX', 10*86400);
      } else {
        res.status(403).send('FAIL');
      };
      res.end();
    });
  } else {
    res.status(403).send('FAIL');
  }
});

app.get("/check_token", function(req, res){
  const {username, token} = req.query;
  check_token(username, token, (result, data) => {
    if(result) {
      res.send('OK');
    } else {
      res.status(403).send('FAIL');
    }
  });
});

function check_token(username, token, callback) {
  if(username && token) {
    client.get('users/' + username + ':token-'+token, function(err, data) {
        callback(data != null, data);
    });
  } else {
    callback(false, null);
  }
}

app.listen(port,  () => console.log(`Example app listening on port ${port}!`));
