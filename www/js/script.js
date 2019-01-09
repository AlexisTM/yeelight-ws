var ws = {};
var app = {};
var test = {};
var hue = {};
function addToListByName(value) {
  let index = app.lights.findIndex(function(element, b) {
    return element.name == value.name;
  });
  if(index >= 0) {
    let light = Object.assign({}, app.lights[index], value);
    Vue.set(app.lights, index, light);
    //Vue.set(app.lights, index, tmp);
  } else {
    value.isSelected = false;
    app.lights.push(value);
  }
}

function selectLight(el) {
  let index = app.lights.findIndex(function(value){
    return value.name == el.textContent;
  });
  if(index >= 0) {
    app.lights[index].isSelected = !app.lights[index].isSelected;
  }
}

window.onload = function() {
  app = new Vue({
    el: '#app',
    data: {
      lights: []
    }
  });

  var ws = new RobustWebSocket("ws://127.0.0.1:3030");
  ws.addEventListener('message', function(event) {
    console.log('we got: ' + event.data)
    let msg = JSON.parse(event.data);
    if(msg.topic == "heartbeat") {
      msg.data.elem = msg.data.name.replace(/ /g,"_");
      addToListByName(msg.data);
    }
  });

  var hue = new Huebee('.color-input', {
    saturations: 1,
    hues: 15,
    shades: 15
  });
};
