# yeelight-ws
This is an example of a web-based Yeelight control system handled with a websocket. It allows to control all the lights in your house simultaneously, including the JIAYOUE 650 background light. 

This is a project is about testing the capabilities of different libraries and is not for users.

Note that I am not a graphic designer.

> This is running on a Raspberry Pi Zero

Starring:
- As the backend
  - [ws](https://www.npmjs.com/package/ws) - Websocket library
  - [express](https://www.npmjs.com/package/express) - Minimalist web framwork for node
  - [yeelight-platform](https://github.com/AlexisTM/yeelight-platform) based on [sahilchaddha's yeelight-platfom](https://github.com/sahilchaddha/yeelight-platform) - The yeelight communication library. 
  - [redis](https://github.com/NodeRedis/node_redis) - Real time database for logins, tokens, and flows
- As the frontend
  - [VueJS](https://vuejs.org) - Javascript framework
  - [colorjoe](https://github.com/bebraw/colorjoe) - Color picker
  - [RobustWs](https://github.com/appuri/robust-websocket) - Reconnecting websocket
  - [Bootstrap] 4.x - I'm not a graphic designer CSS library

## Install

```bash
git clone http://github.com/AlexisTM/yeelight-ws
cd yeelight-ws
npm install
node index.js
```

Add your light IPs into the index.js. This can be replaced by the discovery service.

```js
addLight("living", "192.168.178.32", "ceiling4");
```

## Redis db

**Template** 

```javascript
users/[username]:mmd5 = md5(md5(password)) // stores md5(md5(password))
users/[username]:token-[token] = [token] // stores the valid tokens, they expire currently after 10 days, the data 
```

**Setup a user**

```bash
node setup.js
#? Username:  AlexisTM
#? Password:  [hidden]
#? Roles:  admin, user
```

## Install and autoboot on a Raspberry Pi

SSH with the user pi and install it the same way as on a desktop.

```bash
git clone http://github.com/AlexisTM/yeelight-ws
cd yeelight-ws
npm install
```

Enable the autoboot by creating the follwoing file `/etc/systemd/system/yeelight.service`

```bash
#
# Service file for systems with systemd to run Yeelight websocket control
#

[Unit]
Description=Yeelight
After=network.target

[Service]
Type=simple
user=pi
WorkingDirectory=/home/pi/yeelight-ws
ExecStart=/usr/bin/node /home/pi/yeelight-ws/index.js
SendSIGKILL=no

[Install]
WantedBy=multi-user.target
```

Finally, start and enable the service.

```bash
sudo systemctl start yeelight
sudo systemctl status yeelight # ensure the service works
sudo systemctl enable yeelight
```

### Quickview

![Quickview](/www/img/onphone.png)
