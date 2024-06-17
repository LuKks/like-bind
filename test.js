const net = require('net')
const dgram = require('dgram')
const test = require('brittle')
const bind = require('./index.js')

test('tcp', async function (t) {
  const port1 = await bind.free.tcp()
  t.ok(port1 > 0)

  const port2 = await bind.free.tcp(12345)
  t.is(port2, 12345)

  const server = net.createServer()
  const closeServer = await bind.listen(server, port2)

  const port3 = await bind.free.tcp(12345)
  t.not(port3, 12345)
  t.ok(port3 > 0)

  try {
    await bind.free.tcp(12345, { any: false })
  } catch (err) {
    t.pass()
  }

  await closeServer()
})

test('udp', async function (t) {
  const port1 = await bind.free.udp()
  t.ok(port1 > 0)

  const port2 = await bind.free.udp(12345)
  t.is(port2, 12345)

  const socket = dgram.createSocket('udp4')
  const closeSocket = await bind.listen(socket, port2)

  const port3 = await bind.free.udp(12345)
  t.not(port3, 12345)
  t.ok(port3 > 0)

  try {
    await bind.free.udp(12345, { any: false })
  } catch (err) {
    t.pass()
  }

  await closeSocket()
})

test('listen server', async function (t) {
  const server = net.createServer()

  await bind.listen(server)
  t.ok(server.listening)

  await bind.close(server)
  t.absent(server.listening)
})

test('bind socket', async function (t) {
  const socket = dgram.createSocket('udp4')

  await bind.listen(socket)
  t.ok(socket.address())

  await bind.close(socket)
})

test('connect socket', async function (t) {
  const server = net.createServer()
  await bind.listen(server)

  const socket = new net.Socket()

  await bind.connect(socket, server.address().port)
  t.ok(socket.remoteAddress)

  await bind.close(socket)
  t.ok(socket.destroyed)

  await bind.close(server)
})

test('force close', async function (t) {
  const server = net.createServer()

  await bind.listen(server)
  t.ok(server.listening)

  const socket = new net.Socket()
  const socketClosing = new Promise(resolve => socket.on('close', resolve))

  await bind.connect(socket, server.address().port)
  t.ok(socket.remoteAddress)

  await bind.close(server, { force: true })
  t.absent(server.listening)

  await socketClosing
  t.ok(socket.destroyed)
})
