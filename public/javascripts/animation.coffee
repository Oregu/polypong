requestAnimFrame = (() ->
  return window.requestAnimationFrame  or
    window.webkitRequestAnimationFrame or
    window.mozRequestAnimationFrame    or
    window.oRequestAnimationFrame      or
    window.msRequestAnimationFrame     or
    (callback, element) ->
      window.setTimeout(callback, 1000 / 60))()

requestInterval = (fn, delay) ->
  if!window.requestAnimationFrame and 
    !window.webkitRequestAnimationFrame and 
    !(window.mozRequestAnimationFrame and window.mozCancelRequestAnimationFrame) and
    !window.oRequestAnimationFrame and
    !window.msRequestAnimationFrame
      return window.setInterval(fn, delay)

  start = new Date().getTime()
  handle = new Object()

  loopy = () ->
    current = new Date().getTime()
    delta = current - start

    if delta >= delay
      start = new Date().getTime()
      fn.call()

    handle.value = requestAnimFrame loopy

  handle.value = requestAnimFrame loopy
  handle


window.requestAnimFrame = requestAnimFrame
window.requestInterval = requestInterval
