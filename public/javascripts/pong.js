(function() {
  var GameCore;

  GameCore = (function() {
    function GameCore() {
      this.canvasWidth = 780;
      this.canvasHeight = 440;
      this.xOffset = 20;
      this.racketHeight = 55;
      this.racketWidth = 10;
      this.ballSize = 8;
      this.racketV = 0.15;
      this.dirUp = -1;
      this.dirIdle = 0;
      this.dirDown = 1;
      this.gs = [
        {
          pos: 10,
          dir: this.dirIdle,
          updates: []
        }, {
          pos: 10,
          dir: this.dirIdle,
          updates: []
        }
      ];
      this.maxBallV = 0.4;
      this.initBallV = 0.2;
      this.minBallV = 0.1;
      this.speedUp = 0.9;
      this.ball = {
        x: this.canvasWidth / 2 - this.ballSize / 2,
        y: this.canvasHeight / 2 - this.ballSize / 2,
        angle: (20 + Math.random() * 50) * Math.PI / 180,
        v: 0.2,
        t: 0
      };
      this.updateTime = null;
      this.dt = 20;
      this.lastProcessedSeq = -1;
    }

    GameCore.prototype.time = function() {
      return new Date().getTime();
    };

    GameCore.prototype.moveRacket = function(dir, dirUpdates, pos, currentTime, beforeTime) {
      var upd, _i, _len;
      for (_i = 0, _len = dirUpdates.length; _i < _len; _i++) {
        upd = dirUpdates[_i];
        if (upd.t <= beforeTime || upd.t > currentTime) {
          continue;
        }
        pos = this.moveRacketBit(pos, dir, upd.t - beforeTime);
        beforeTime = upd.t;
        dir = upd.dir;
        this.lastProcessedSeq = upd.seq;
      }
      return this.moveRacketBit(pos, dir, currentTime - beforeTime);
    };

    GameCore.prototype.moveRacketBit = function(pos, dir, dt) {
      var newPos;
      newPos = dir === this.dirUp ? pos - this.racketV * dt : dir === this.dirDown ? pos + this.racketV * dt : pos;
      if (newPos < 0) {
        newPos = 0;
      }
      if (newPos > this.canvasHeight - this.racketHeight) {
        newPos = this.canvasHeight - this.racketHeight;
      }
      return newPos;
    };

    GameCore.prototype.moveBall = function(ballUpdates, currentTime, dt) {
      var b, ball, beforeTime, found, _i;
      beforeTime = currentTime - dt;
      for (_i = ballUpdates.length - 1; _i >= 0; _i += -1) {
        b = ballUpdates[_i];
        ball = b;
        if (beforeTime <= b.t && b.t <= currentTime) {
          found = true;
          break;
        }
      }
      if (!found) {
        ball = ballUpdates[ballUpdates.length - 1];
      }
      return this.moveBallBit(ball, currentTime - ball.t);
    };

    GameCore.prototype.moveBallBit = function(ball, dt) {
      var ds;
      ds = ball.v * dt;
      ball.x += ds * Math.cos(ball.angle);
      ball.y += ds * Math.sin(ball.angle);
      ball.t += dt;
      return this.checkBallCollision(ball);
    };

    GameCore.prototype.checkBallCollision = function(ball) {
      if (ball.y < 0) {
        ball.y = 0;
        ball.angle = -ball.angle;
      } else if (ball.y > this.canvasHeight - this.ballSize) {
        ball.y = this.canvasHeight - this.ballSize;
        ball.angle = -ball.angle;
      } else if (ball.x <= this.xOffset) {
        if (ball.y >= this.gs[0].pos && ball.y <= this.gs[0].pos + this.racketHeight - this.ballSize) {
          ball.x = this.xOffset;
          ball.angle = Math.PI - ball.angle;
          ball.v = ball.v * (this.speedUp + Math.abs(ball.y - this.gs[0].pos + this.racketHeight / 2) / (this.gs[0].pos + this.racketHeight / 2));
          if (ball.v >= this.maxBallV) {
            ball.v = this.maxBallV;
          } else if (ball.v <= this.minBallV) {
            ball.v = this.minBallV;
          } else {
            ball.v = ball.v * (this.speedUp + Math.abs(ball.y - this.gs[0].pos + this.racketHeight / 2) / (this.gs[0].pos + this.racketHeight / 2));
          }
        }
      } else if (ball.x >= this.canvasWidth - this.xOffset - this.ballSize) {
        if (ball.y >= this.gs[1].pos && ball.y <= this.gs[1].pos + this.racketHeight - this.ballSize) {
          ball.x = this.canvasWidth - this.xOffset - this.ballSize;
          ball.angle = Math.PI - ball.angle;
          ball.v = ball.v * (this.speedUp + Math.abs(ball.y - this.gs[0].pos + this.racketHeight / 2) / (this.gs[0].pos + this.racketHeight / 2));
          if (ball.v >= this.maxBallV) {
            ball.v = this.maxBallV;
          } else if (ball.v <= this.minBallV) {
            ball.v = this.minBallV;
          }
        }
      }
      return ball;
    };

    return GameCore;

  })();

  if (typeof module === 'undefined') {
    window.GameCore = GameCore;
  } else {
    module.exports = GameCore;
  }

}).call(this);

(function() {
  var clearRequestInterval, requestAnimFrame, requestInterval;

  requestAnimFrame = (function() {
    return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame || function(callback, element) {
      return window.setTimeout(callback, 1000 / 60);
    };
  })();

  requestInterval = function(fn, delay) {
    var handle, loopy, start;
    if (!window.requestAnimationFrame && !window.webkitRequestAnimationFrame && !(window.mozRequestAnimationFrame && window.mozCancelRequestAnimationFrame) && !window.oRequestAnimationFrame && !window.msRequestAnimationFrame) {
      return window.setInterval(fn, delay);
    }
    start = new Date().getTime();
    handle = new Object();
    loopy = function() {
      var current, delta;
      current = new Date().getTime();
      delta = current - start;
      if (delta >= delay) {
        start = new Date().getTime();
        fn.call();
      }
      return handle.value = requestAnimFrame(loopy);
    };
    handle.value = requestAnimFrame(loopy);
    return handle;
  };

  clearRequestInterval = function(handle) {
    if (window.cancelAnimationFrame) {
      return window.cancelAnimationFrame(handle.value);
    } else if (window.webkitCancelAnimationFrame) {
      return window.webkitCancelAnimationFrame(handle.value);
    } else if (window.webkitCancelRequestAnimationFrame) {
      return window.webkitCancelRequestAnimationFrame(handle.value);
    } else if (window.mozCancelRequestAnimationFrame) {
      return window.mozCancelRequestAnimationFrame(handle.value);
    } else if (window.oCancelRequestAnimationFrame) {
      return window.oCancelRequestAnimationFrame(handle.value);
    } else if (window.msCancelRequestAnimationFrame) {
      return window.msCancelRequestAnimationFrame(handle.value);
    } else {
      return clearInterval(handle);
    }
  };

  window.requestAnimFrame = requestAnimFrame;

  window.requestInterval = requestInterval;

  window.clearRequestInterval = clearRequestInterval;

}).call(this);

(function() {
  var Game,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  window.Game = Game = (function(_super) {
    __extends(Game, _super);

    function Game() {
      Game.__super__.constructor.call(this);
      this.loopHandle;
      this.upPressed = false;
      this.downPressed = false;
      this.dir = this.dirIdle;
      this.side = 0;
      this.enemySide = 1;
      this.dirUpdates = [];
      this.seq = -1;
      this.pos = null;
      this.ballUpdates = [];
      this.timeDiff = null;
      this.ghost = null;
      Game.debug = false;
      this.keyLeft = 37;
      this.keyUp = 38;
      this.keyRight = 39;
      this.keyDown = 40;
      this.keySpace = 32;
      this.startPos = [[10, 80], [760, this.canvasHeight - 80 - this.racketHeight]];
      this.racketColor = '#fff';
    }

    Game.prototype.drawRacket = function(x, y, color) {
      this.ctx.fillStyle = color;
      return this.ctx.fillRect(x, y, this.racketWidth, this.racketHeight);
    };

    Game.prototype.drawBall = function(ball, color) {
      this.ctx.fillStyle = color;
      return this.ctx.fillRect(ball.x, ball.y, this.ballSize, this.ballSize);
    };

    Game.prototype.drawBoard = function() {
      this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
      this.ctx.fillStyle = 'rgb(200,200,200)';
      this.ctx.fillRect(389, 5, 1, 430);
      this.drawRacket(this.startPos[this.side][0], this.gs[this.side].pos, this.racketColor);
      this.drawRacket(this.startPos[this.enemySide][0], this.gs[this.enemySide].pos, this.racketColor);
      this.drawBall(this.ball, 'rgb(200,200,200)');
      if (Game.debug && (this.ghost != null)) {
        return this.drawBall(this.ghost, 'rgb(0,200,0)');
      }
    };

    Game.prototype.gameLoop = function() {
      this.updateState();
      return this.drawBoard();
    };

    Game.prototype.updateState = function() {
      var dt, enemy, me, serverTime, time;
      time = this.time();
      dt = time - this.updateTime;
      if (this.timeDiff != null) {
        serverTime = time - this.timeDiff;
        if (this.ballUpdates.length) {
          this.ball = this.moveBall(this.ballUpdates, serverTime, dt);
        }
      } else {
        this.ball.t = this.updateTime;
        this.ball = this.moveBall([this.ball], time, dt);
      }
      enemy = this.gs[this.enemySide];
      enemy.pos = this.moveRacket(enemy.dir, enemy.updates, enemy.pos, time, this.updateTime);
      me = this.gs[this.side];
      this.pos = this.moveRacket(this.dir, this.dirUpdates, this.pos, time, this.updateTime);
      me.pos = this.pos;
      if (this.dirUpdates.length) {
        this.dir = this.dirUpdates[this.dirUpdates.length - 1].dir;
      }
      return this.updateTime = time;
    };

    Game.prototype.keyboardDown = function(evt) {
      switch (evt.which) {
        case this.keyDown:
          this.downPressed = true;
          this.upPressed = false;
          return this.sendState(this.dirDown);
        case this.keyUp:
          this.upPressed = true;
          this.downPressed = false;
          return this.sendState(this.dirUp);
      }
    };

    Game.prototype.keyboardUp = function(evt) {
      switch (evt.which) {
        case this.keyDown:
          this.downPressed = false;
          if (!this.upPressed) {
            return this.sendState(this.dirIdle);
          }
          break;
        case this.keyUp:
          this.upPressed = false;
          if (!this.downPressed) {
            return this.sendState(this.dirIdle);
          }
      }
    };

    Game.prototype.sendState = function(dir) {
      this.dirUpdates.push({
        dir: dir,
        seq: ++this.seq,
        t: this.time()
      });
      return this.socket.emit('state', {
        dir: dir,
        side: this.side,
        seq: this.seq
      });
    };

    Game.prototype.updateScore = function(scores) {
      var ind, scr, _i, _len, _results;
      _results = [];
      for (ind = _i = 0, _len = scores.length; _i < _len; ind = ++_i) {
        scr = scores[ind];
        _results.push($('#score_' + ind).text(scr));
      }
      return _results;
    };

    Game.prototype.startGame = function() {
      var canvas;
      canvas = document.getElementById('game_board_canvas');
      this.ctx = canvas.getContext('2d');
      this.updateTime = this.time();
      return this.loopHandle = requestInterval(((function(_this) {
        return function() {
          return _this.gameLoop();
        };
      })(this)), this.dt);
    };

    Game.prototype.stopGame = function() {
      $(window).off('keydown');
      $(window).off('keyup');
      return clearRequestInterval(this.loopHandle);
    };

    Game.prototype.seq2index = function(seq) {
      var ind, upd, _i, _len, _ref;
      _ref = this.dirUpdates;
      for (ind = _i = 0, _len = _ref.length; _i < _len; ind = ++_i) {
        upd = _ref[ind];
        if (upd.seq === seq) {
          return ind;
        }
      }
      return -1;
    };

    Game.prototype.time2index = function(keepTime) {
      var b, indFromEnd, _i, _ref;
      indFromEnd = -1;
      _ref = this.ballUpdates;
      for (_i = _ref.length - 1; _i >= 0; _i += -1) {
        b = _ref[_i];
        if (b.t < keepTime) {
          break;
        }
        indFromEnd += 1;
      }
      return this.ballUpdates.length - 2 - indFromEnd;
    };

    Game.prototype.start = function(socket) {
      this.socket = socket;
      socket.on('connect', (function(_this) {
        return function() {
          return console.log("Socket opened, Master!");
        };
      })(this));
      socket.on('joined', (function(_this) {
        return function(data) {
          _this.timeDiff = _this.time() - data.t + 100;
          _this.side = data.side;
          _this.enemySide = _this.side === 0 ? 1 : 0;
          _this.ballUpdates = [];
          _this.dirUpdates = [];
          $(window).on('keydown', function(e) {
            return _this.keyboardDown(e);
          });
          return $(window).on('keyup', function(e) {
            return _this.keyboardUp(e);
          });
        };
      })(this));
      socket.on('move', (function(_this) {
        return function(data) {
          var howmany;
          _this.gs = data.gamers;
          howmany = 1 + _this.time2index(_this.time() - _this.timeDiff - 1000);
          _this.ballUpdates.splice(0, howmany);
          _this.ballUpdates.push(data.ball);
          _this.ghost = data.ball;
          if (_this.pos == null) {
            _this.pos = _this.gs[_this.side].pos;
          }
          if (_this.gs[_this.side].lastSeq <= _this.lastProcessedSeq) {
            howmany = 1 + _this.seq2index(_this.gs[_this.side].lastSeq);
            return _this.dirUpdates.splice(0, howmany);
          }
        };
      })(this));
      socket.on('score', (function(_this) {
        return function(data) {
          return _this.updateScore(data.scores);
        };
      })(this));
      socket.on('busy', (function(_this) {
        return function(data) {};
      })(this));
      socket.on('disconnect', (function(_this) {
        return function() {
          console.log('Server disconnect');
          return _this.stopGame();
        };
      })(this));
      socket.emit('join');
      return this.startGame();
    };

    return Game;

  })(GameCore);

}).call(this);
