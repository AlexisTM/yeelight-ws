const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 3030, clientTracking: true });
const YeeDevice = require('yeelight-platform').Device;
const attributes_names = ['name', 'active_mode', 'power', 'bright', 'ct', 'bg_power', 'bg_hue', 'bg_rgb', 'bg_sat', 'bg_ct'];

var lights = [];

function addLight(name, ip) {
  let light = {
    name: name,
    device: new YeeDevice({host: ip, port: 55443,
    attributes: attributes_names, id: lights.length+1})
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

addLight("living", "192.168.178.32");
addLight("dining", "192.168.178.33");

wss.on('connection', function connection(ws) {
  ws.on('message', function incoming(message) {
    console.log(message)
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

