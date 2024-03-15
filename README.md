# grade-server
Server to connect sub-tracker and grade-fetcher

## What problem does this solve?
Currently grade-fetcher runs on a set interval. This means customers can't immediately get their grades and often have to wait at least an hour. 
This time is usually higher because impatient customers spam the system which ends up breaking the grader-fetcher script altogether. 
The goal of this repo is to host a server on a Raspberry Pi that is able to talk to the shopify website. 
Once this is achieved, the sub-tracker will be able to send some data to the server, run the grade-fetcher script, and return a success code to 
the website which will load the data from the git repo. This should decrease the time it takes for the customers.

## Overview
* server receives submission number, order number, and customer id
* if the customer has been blocked for spamming the server
  * return "you've been blocked for spam! email to get unblocked"
* run the grade-fetcher v2 script
* return error or success message to requester

# Technical Details
## GET vs POST
Using a POST request because GET requests append data to the URL where POST requests sends data through the request body (more secure)

## Port Forwarding
The Nodejs server and port forwarding number should match. Make sure you aren't using a reserved port

https://en.wikipedia.org/wiki/List_of_TCP_and_UDP_port_numbers

## Proxy?
Maybe look into using a proxy instead of exposing the server

## Setup
* sudo nano /etc/systemd/system/my-node-app.service
```
[Unit]
Description=My Node.js Application
After=network.target

[Service]
ExecStart=/usr/bin/node /path/to/your/node/app.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
WorkingDirectory=/path/to/your/node/app
User=yourusername
Group=yourgroupname

[Install]
WantedBy=multi-user.target
```
* sudo systemctl daemon-reload
* sudo systemctl start my-node-app
* sudo systemctl enable my-node-app
* sudo systemctl status my-node-app
