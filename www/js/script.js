var ws = {};
var app = {};
var test = {}
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

function changeName() {
  console.log("Changing the name")
  return true;
}

function send(topic, data, lights=[]) {
  let msg = {
    "topic": topic,
    "data": data,
    "lights": lights
  };
  ws.send(JSON.stringify(msg));
}

function cmdLights(topic, data) {
  let lights = app.get_selected_names();
  console.log(data);
  send(topic, data, lights);
}

function lightToggle(state, mode=1) {
  cmdLights("set_power", [state, "smooth", 300, mode]);
}

function lightToggleBg(state, mode=1) {
  cmdLights("bg_set_power", [state, "smooth", 300, mode]);
}

function brightnessChange(evt) {
  console.log(parseInt(this.value))
  cmdLights("set_bright", [parseInt(this.value), "smooth", 300]);
}

function temperatureChange(evt) {
  console.log(parseInt(this.value))
  cmdLights("bg_set_ct_abx", [parseInt(this.value), "smooth", 300]);
  cmdLights("set_ct_abx", [parseInt(this.value), "smooth", 300]);
}

function parseIntExcess(val, min, max) {
  val = Math.round(parseFloat(val));
  if(val > max) val = max;
  if(val < min) val = min;
  return val;
}

window.onload = function() {
  app = new Vue({
    el: '#app',
    data: {
      lights: []
    },
    methods: {
      count_enabled: function(){
        return this.lights.reduce((a, v) => a+v.isSelected, 0);
      },
      get_selected: function(){
        return this.lights.filter(v => v.isSelected);
      },
      get_selected_names: function(){
        return this.get_selected().map(v => v.name);
      }
    },
  });

  ws = new RobustWebSocket("ws://" + document.location.hostname + ":3030");
  ws.addEventListener('message', function(event) {
    let msg = JSON.parse(event.data);
    if(msg.topic == "heartbeat") {
      msg.data.elem = msg.data.name.replace(/ /g,"_");
      addToListByName(msg.data);
    }
  });

  let bright = document.getElementById('brightness');
  bright.addEventListener('change', brightnessChange);
  let temp = document.getElementById('temperature');
  temp.addEventListener('change', temperatureChange);


  colorjoe.hsl('hslPicker', '#113c38').on("done", function(color){
    let hue = parseIntExcess(color.hue()*360, 0, 359);
    let sat = parseIntExcess(color.saturation()*100, 0, 100)
    cmdLights("hsv", [hue, sat, 'smooth', 300]);
  }).update();
};
