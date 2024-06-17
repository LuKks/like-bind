const net = require('net')
const dgram = require('dgram')

const servers = new Map()

module.exports = {
  free: { tcp, udp },
  listen,
  connect,
  close
}

async function tcp (port, opts) {
  try {
    return await freePortTCP(port || 0)
  } catch (err) {
    if (opts && opts.any === false) {
      throw err
    }

    return await freePortTCP(0)
  }
}

async function udp (port, opts) {
  try {
    return await freePortUDP(port || 0)
  } catch (err) {
    if (opts && opts.any === false) {
      throw err
    }

    return await freePortUDP(0)
  }
}

async function freePortTCP (port) {
  const server = net.createServer()
  await listen(server, port)

  const addr = server.address()
  await close(server)

  return addr.port
}

async function freePortUDP (port) {
  const socket = dgram.createSocket('udp4')
  await listen(socket, port)

  const addr = socket.address()
  await close(socket)

  return addr.port
}

function listen (server, port, address, cb) {
  return new Promise((resolve, reject) => {
    server.on('listening', done)
    server.on('error', done)

    if (server.listen) {
      server.on('connection', onconnection)
      server.on('close', onclose)

      server.listen(port, address, cb)
    } else {
      server.bind(port, address, cb)
    }

    function done (err) {
      server.removeListener('listening', done)
      server.removeListener('error', done)

      if (err) {
        servers.delete(server)

        reject(err)
      } else {
        resolve()
      }
    }

    function onconnection (socket) {
      let connections = servers.get(server)

      if (!connections) {
        connections = new Set()
        servers.set(server, connections)
      }

      connections.add(socket)
      socket.on('close', () => connections.delete(socket))
    }

    function onclose () {
      servers.delete(server)
    }
  })
}

function connect (socket, port, address, cb) {
  return new Promise((resolve, reject) => {
    const closing = new Promise(resolve => socket.on('close', resolve))

    socket.on('connect', done)
    socket.on('error', done)

    socket.connect(port, address, cb)

    return closing

    function done (err) {
      socket.removeListener('connect', done)
      socket.removeListener('error', done)

      if (err) reject(err)
      else resolve()
    }
  })
}

function close (server, opts) {
  return new Promise((resolve, reject) => {
    let waiting = 1
    let error = null

    if (server.close) {
      server.close(onclose)
    } else {
      const socket = server

      socket.on('close', onclose)
      socket.destroy()
    }

    if (opts && opts.force) {
      const connections = servers.get(server)

      if (connections) {
        for (const socket of connections) {
          waiting++

          socket.on('close', onclose)
          socket.destroy()
        }
      }
    }

    function onclose (err) {
      if (error === null && err) {
        error = err
      }

      if (--waiting === 0) {
        if (error) reject(error)
        else resolve()
      }
    }
  })
}
