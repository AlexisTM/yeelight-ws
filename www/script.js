var ws = {};
var app = {};

function addToListByName(value, arr) {
  let index = arr.findIndex(function(element, b) {
    return element.name == value.name;
  });
  if(index >= 0) {
    arr[index] = value;
  } else {
    arr.push(value);
  }
}

window.onload = function() {
  app = new Vue({
    el: '#app',
    data: {
      lights: [],
    }
  });
  
  var ws = new RobustWebSocket("ws://127.0.0.1:3030");
  ws.addEventListener('message', function(event) {
    console.log('we got: ' + event.data)
    let msg = JSON.parse(event.data);
    if(msg.topic == "heartbeat") {
      addToListByName(msg.data, app.lights);
    }
  })
};
