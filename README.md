# tiny-bind

Async listen, connect, and close servers or sockets on ideal ports

```
npm i tiny-bind
```

## Usage

```js
const bind = require('tiny-bind')

const server = net.createServer()
const port = await bind.free.tcp(1337)
await bind.listen(server, port)

const socket = new net.Socket()
await bind.connect(socket, server.address().port)
await bind.close(socket)

await bind.close(server, { force: true })
```

```js
const socket = dgram.createSocket('udp4')
const port = await bind.free.udp(1337)

await bind.listen(socket, port)
// ...
await bind.close(socket)
```

## API

#### `const port = await bind.free.tcp(port[, options])`
#### `const port = await bind.free.udp(port[, options])`

Creates a temporary server or socket to check if the port is available.

By default, if `port` is already used then it returns a random one.

Available `options`

```js
{
  any: true // Disable to throw when the port is already used
}
```

#### `await bind.listen(serverOrSocket[, port, address, cb])`

Async listen a server or socket.

#### `await bind.connect(socket[, port, address, cb])`

Async connect to a server.

#### `await bind.close(serverOrSocket[, options])`

Async close a server or socket.

Available `options`

```js
{
  force: false // Only for servers, and you must have used `bind.listen(..)`
}
```

## License

MIT
