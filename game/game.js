(function() {
  var Game, GameCore, cookie, timers,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  GameCore = require('./game.core');

  cookie = require('cookie');

  timers = require('timers');

  module.exports = Game = (function(_super) {
    __extends(Game, _super);

    function Game() {
      var initPos;
      Game.__super__.constructor.call(this);
      this.gamers = {};
      initPos = this.canvasHeight / 2 - 40;
      this.gs = [
        {
          pos: initPos - this.racketHeight,
          dir: this.dirIdle,
          updates: [],
          lastSeq: -1
        }, {
          pos: initPos + this.racketHeight,
          dir: this.dirIdle,
          updates: [],
          lastSeq: -1
        }
      ];
      this.ballResetOffset = 50;
      this.scores = [0, 0];
      this.count = 0;
      this.inDaLoop = false;
    }

    Game.prototype.addGamer = function(sid, socket, side) {
      this.gamers[sid] = {
        socket: socket,
        updates: [],
        side: side,
        pos: this.gs[side].pos
      };
      return this.sendJoined(sid);
    };

    Game.prototype.sendJoined = function(sid) {
      return this.gamers[sid].socket.emit('joined', {
        side: this.gamers[sid].side,
        t: this.time()
      });
    };

    Game.prototype.sendMove = function(sid) {
      var g;
      g = this.gamers[sid];
      this.gs[g.side].updates = g.updates;
      return g.socket.emit('move', {
        gamers: this.gs,
        ball: this.ball
      });
    };

    Game.prototype.sendMoveAll = function() {
      var sid, _results;
      _results = [];
      for (sid in this.gamers) {
        _results.push(this.sendMove(sid));
      }
      return _results;
    };

    Game.prototype.sendScore = function(sid) {
      return this.gamers[sid].socket.emit('score', {
        scores: this.scores
      });
    };

    Game.prototype.sendScoreAll = function() {
      var sid, _results;
      _results = [];
      for (sid in this.gamers) {
        _results.push(this.sendScore(sid));
      }
      return _results;
    };

    Game.prototype.updateState = function(sid, dir, seq) {
      return this.gamers[sid].updates.push({
        dir: dir,
        seq: seq,
        t: this.time()
      });
    };

    Game.prototype.placeBall = function(side) {
      this.ball.y = this.gs[side].pos + this.racketHeight / 2 - this.ballSize / 2;
      if (side === 0) {
        this.ball.x = this.ballResetOffset;
        this.ball.angle = Math.asin((this.gs[1].pos - this.gs[0].pos) / (this.canvasWidth - 2 * this.xOffset));
      } else {
        this.ball.x = this.canvasWidth - this.ballResetOffset - this.ballSize;
        this.ball.angle = Math.PI + Math.asin((this.gs[1].pos - this.gs[0].pos) / (this.canvasWidth - 2 * this.xOffset));
      }
      return this.ball.v = this.initBallV;
    };

    Game.prototype.moveRackets = function(currentTime) {
      var gamer, lastUpdate, sid, _ref, _results;
      _ref = this.gamers;
      _results = [];
      for (sid in _ref) {
        gamer = _ref[sid];
        gamer.pos = this.moveRacket(gamer.dir, gamer.updates, gamer.pos, currentTime, this.updateTime);
        this.gs[gamer.side].pos = gamer.pos;
        if (gamer.updates.length) {
          lastUpdate = gamer.updates[gamer.updates.length - 1];
          gamer.dir = lastUpdate.dir;
          this.gs[gamer.side].lastSeq = lastUpdate.seq;
        }
        gamer.updates = [];
        _results.push(this.gs[gamer.side].updates = []);
      }
      return _results;
    };

    Game.prototype.checkScoreUpdate = function() {
      var side;
      if (this.ball.x < 0 || this.ball.x > this.canvasWidth - this.ballSize) {
        side = -1;
        if (this.ball.x < 0) {
          this.scores[1] += 1;
          side = 0;
        }
        if (this.ball.x > this.canvasWidth - this.ballSize) {
          this.scores[0] += 1;
          side = 1;
        }
        this.placeBall(side);
        return this.sendScoreAll();
      }
    };

    Game.prototype.startLoop = function() {
      if (this.inDaLoop) {
        return;
      }
      this.gameLoop = timers.setInterval((function(_this) {
        return function() {
          return _this.gameStep();
        };
      })(this), this.dt);
      return this.inDaLoop = true;
    };

    Game.prototype.endLoop = function() {
      if (!this.inDaLoop) {
        return;
      }
      timers.clearInterval(this.gameLoop);
      this.inDaLoop = false;
      return this.scores = [0, 0];
    };

    Game.prototype.gameStep = function() {
      var time;
      time = this.time();
      this.moveRackets(time);
      this.ball.t = this.updateTime;
      this.ball = this.moveBall([this.ball], time, time - this.updateTime);
      this.ball.t = time;
      this.checkScoreUpdate();
      this.sendMoveAll();
      return this.updateTime = time;
    };

    Game.prototype.oneQuitted = function(sidQuit) {
      var gamer, sid, _ref, _results;
      delete this.gamers[sidQuit];
      _ref = this.gamers;
      _results = [];
      for (sid in _ref) {
        gamer = _ref[sid];
        if (sidQuit !== sid) {
          _results.push(gamer.socket.emit('quit', sid));
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    };

    Game.prototype.connect = function(socket) {
      var sid;
      sid = cookie.parse(socket.handshake.headers.cookie)['connect.sid'];
      console.log("Have a connection: " + sid + " (socket id: " + socket.id + ")");
      socket.on('join', (function(_this) {
        return function(data) {
          if (sid in _this.gamers) {
            _this.sendJoined(sid);
            _this.sendMove(sid);
            return;
          }
          if (_this.count === 2) {
            socket.emit('busy');
            return;
          }
          console.log("I can has join: " + sid);
          _this.addGamer(sid, socket, _this.count);
          _this.count++;
          if (_this.count > 0) {
            _this.startLoop();
          }
          _this.sendMove(sid);
          return _this.sendScore(sid);
        };
      })(this));
      socket.on('state', (function(_this) {
        return function(data) {
          return _this.updateState(sid, data.dir, data.seq);
        };
      })(this));
      return socket.on('disconnect', (function(_this) {
        return function() {
          if (!(sid in _this.gamers && _this.gamers[sid].socket.id === socket.id)) {
            return;
          }
          console.log("Disconnecting: " + sid);
          _this.oneQuitted(sid);
          _this.count--;
          if (_this.count === 0) {
            return _this.endLoop();
          }
        };
      })(this));
    };

    return Game;

  })(GameCore);

}).call(this);
