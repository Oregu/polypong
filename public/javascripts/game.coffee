window.Game = class Game

  constructor: ->
    # Vars
    @up_pressed = false
    @down_pressed = false
    @y_position = 10
    @side = 0
    @enemy_side = 1

    # Constants
    @canvas_width = 780
    @canvas_height = 440
    @racket_height = 55
    @racket_width = 10

    @dy = 5

    @key_left  = 37
    @key_up    = 38
    @key_right = 39
    @key_down  = 40
    @key_space = 32

    @players_start_pos = [[10, 80], [760, @canvas_height - 80 - @racket_height]]
    @players_colors = ['rgb(255,255,255)', 'rgb(255,255,255)']
    @players_states = [0, 0]


  # Drawing functions

  drawRacket: (x, y, color) ->
    @ctx.fillStyle = color
    @ctx.fillRect x, y, @racket_width, @racket_height

  drawBall: (x, y) ->
    @ctx.fillStyle = "rgb(200, 200, 200)"
    @ctx.fillRect x, y, 8, 8

  drawBoard: ->
    @processInputs()
    @ctx.clearRect 0, 0, @canvas_width, @canvas_height
    @ctx.fillStyle = "rgb(200, 200, 200)"
    @ctx.fillRect 389, 5, 1, 430
    @drawRacket @players_start_pos[@side][0], @y_position, @players_colors[@side]
    @drawRacket @players_start_pos[@enemy_side][0], @players_start_pos[@enemy_side][1], @players_colors[@enemy_side]
    @drawBall 100, 100
    this.sendState()


  # Keyboard functions

  keyboardDown: (evt) ->
    switch evt.which
      when @key_down then @down_pressed = true; @up_pressed = false
      when @key_up   then @up_pressed = true; @down_pressed = false

  keyboardUp: (evt) ->
    switch evt.which
      when @key_down  then @down_pressed = false
      when @key_up    then @up_pressed = false
      when @key_space then @startRound()

  processInputs: ->
    if @up_pressed
      @y_position -= @dy
      @players_states[@side] = -1
    else if @down_pressed
      @y_position += @dy
      @players_states[@side] = 1
    else
      @players_states[@side] = 0
    console.log @players_states[@side]

  sendState: ->
    @socket.emit 'state', {state: @players_states[@side]}


  # Game control functions

  startGame: ->
    canvas = document.getElementById('game_board_canvas')
    @ctx = canvas.getContext '2d'
    @drawBoard()
    self = @
    setInterval (-> self.drawBoard()), 500

  start: (socket) ->
    self = @
    @socket = socket

    socket.on 'connect', ->
      console.log "Socket opened, Master!"

    socket.on 'state', (data) ->
      console.log "Whoa, he moved"

    socket.on 'joined', (side) ->
      self.side = side
      self.enemy_side = if side == 0 then 1 else 0
      self.y_position = self.players_start_pos[self.side][1]
      # Can't move while not joined
      $(window).on 'keydown', (e) -> self.keyboardDown e
      $(window).on 'keyup', (e) -> self.keyboardUp e

    socket.on 'busy', (data) ->

    socket.emit 'join'



    @startGame()
