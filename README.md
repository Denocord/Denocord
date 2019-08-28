# Dencord

A (WIP) Discord API library for the Deno JS runtime.
As Deno does not support SSL yet, use the Proxy script in ./bin/proxyWS.js (node.js) to proxy the websocket.

The library is currently in a very minimal state in which it only connects to the Gateway and listens for dispatch events.
