# grade-server
Server to connect sub-tracker and grade-fetcher

## What problem does this solve?
Currently grade-fetcher runs on a set interval. This means customers can't immediately get their grades and often have to wait at least an hour. This time is usually higher because impatient customers spam the system which ends up breaking the grader-fetcher script altogether. The goal of this repo is to host a server on a Raspberry Pi that is able to talk to the shopify website. Once this is achieved, the sub-tracker will be able to send some data to the server, run the grade-fetcher script, and return a success code to the website which will load the data from the git repo. This should decrease the time it takes for the customers.
