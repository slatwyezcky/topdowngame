// canvas initialization

const canvas = document.querySelector("canvas");
canvas.height = 900;
canvas.width = 1600;
const canvasContext = canvas.getContext("2d");

// Game Handler Class

class Game {
  constructor(width, height, collisionsMap) {
    this.width = width;
    this.height = height;
    this.refreshRate = 0;
    this.gameSpeed = 3;
    this.input = new InputHandler(this);
    this.background = new StaticBackground(this);
    this.boundaries = new Boundaries(this, collisionsMap);
    this.foreground = new Foreground(this);
    this.player = new Player(this);
    this.UI = new UI(this);
    this.enemies = [];
    this.enemiesVanished = [];
    this.movables = [];
    this.gameScore = 0;
  }

  update() {
    this.movables = [
      this.background,
      this.foreground,
      ...this.boundaries.boundaries,
      ...this.enemies,
      ...this.enemiesVanished,
    ];

    // frame rate and classes updates
    if (this.refreshRate > 7) {
      this.refreshRate = 0;
      this.player.update();
      this.enemies.forEach((enemy) => enemy.update());
      this.enemiesVanished.forEach((enemy) => enemy.update());
    } else this.refreshRate++;
    // add and update Enemies
    if (this.enemies.length < 5) this.addEnemy();

    this.player.checkCollision();
    this.enemies.forEach((enemy) => enemy.checkCollision());
    this.player.checkAttackMode();

    this.enemies = this.enemies.filter(
      (enemy) => enemy.markedForDeletion === false
    );
    this.enemiesVanished = this.enemiesVanished.filter(
      (enemy) => enemy.markedForDeletion === false
    );

    // movement
    if (
      this.input.keys.includes("ArrowLeft") &&
      this.input.lastKey === "ArrowLeft" &&
      this.player.moving
    )
      this.movables.forEach((movable) => (movable.x += this.gameSpeed));
    if (
      this.input.keys.includes("ArrowRight") &&
      this.input.lastKey === "ArrowRight" &&
      this.player.moving
    )
      this.movables.forEach((movable) => (movable.x -= this.gameSpeed));
    if (
      this.input.keys.includes("ArrowUp") &&
      this.input.lastKey === "ArrowUp" &&
      this.player.moving
    )
      this.movables.forEach((movable) => (movable.y += this.gameSpeed));
    if (
      this.input.keys.includes("ArrowDown") &&
      this.input.lastKey === "ArrowDown" &&
      this.player.moving
    )
      this.movables.forEach((movable) => (movable.y -= this.gameSpeed));
  }

  addEnemy() {
    this.enemies.push(
      new Enemy(
        this,
        this.background.x + Math.random() * 1600 + 1200,
        this.background.y + Math.random() * 1600 + 1200
      )
    );
    console.log(this.enemies);
  }

  draw(context) {
    this.background.draw(context);
    this.boundaries.draw(context);
    this.player.draw(context);
    this.enemies.forEach((enemy) => enemy.draw(context));
    this.enemiesVanished.forEach((enemy) => enemy.draw(context));
    this.foreground.draw(context);
    this.UI.draw(context);
  }
}

class Background {
  constructor(game) {
    this.game = game;
    this.image = new Image();

    this.x = -1668 + this.game.width / 2;
    this.y = -1824 + this.game.height / 2;
  }

  draw(context) {
    context.drawImage(this.image, this.x, this.y);
  }
}

class StaticBackground extends Background {
  constructor(game) {
    super(game);
    this.image.src = "/topdowngame/assets/img/gamebackground.png";
  }
}

class Foreground extends Background {
  constructor(game) {
    super(game);
    this.image.src = "/topdowngame/assets/img/foreground.png";
  }
}

class Boundary {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 48;
    this.height = 48;
  }

  draw(context) {
    context.fillStyle = "rgba(255,0,0,0)";
    context.fillRect(this.x, this.y, this.width, this.height);
  }
}

class Boundaries {
  constructor(game, collisionsMap) {
    this.game = game;
    this.collisionsMap = collisionsMap;
    this.boundaries = [];

    this.collisionsMap.forEach((row, i) => {
      row.forEach((symbol, j) => {
        if (symbol === 1025) {
          this.boundaries.push(
            new Boundary(
              j * 48 - 1668 + this.game.width / 2,
              i * 48 - 1824 + this.game.height / 2
            )
          );
        }
      });
    });
  }

  draw(context) {
    this.boundaries.forEach((boundary) => {
      boundary.draw(context);
    });
  }
}

class Player {
  constructor(game) {
    this.game = game;
    this.image = new Image();
    this.image.src = "/topdowngame/assets/img/player.png";
    this.spriteWidth = 48;
    this.spriteHeight = 48;
    this.width = 96;
    this.height = 96;
    this.x = this.game.width / 2 - this.width / 2;
    this.y = this.game.height / 2 - this.height / 2;
    this.frameX = 0;
    this.frameY = 2;
    this.maxFrameX = 5;
    this.attack = false;
    this.moving = true;
    this.collisionAlert = false;
  }

  update() {
    if (this.frameX < this.maxFrameX) this.frameX++;
    else this.frameX = 0;
    // moving and standing animation
    switch (this.game.input.lastKey) {
      case "ArrowUp":
        this.game.input.keys.length === 0 || (!this.moving && !this.attack)
          ? (this.frameY = 4)
          : (this.frameY = 7);
        break;
      case "ArrowDown":
        this.game.input.keys.length === 0 || (!this.moving && !this.attack)
          ? (this.frameY = 2)
          : (this.frameY = 5);
        break;
      case "ArrowLeft":
        this.game.input.keys.length === 0 || (!this.moving && !this.attack)
          ? (this.frameY = 0)
          : (this.frameY = 1);
        break;
      case "ArrowRight":
        this.game.input.keys.length === 0 || (!this.moving && !this.attack)
          ? (this.frameY = 3)
          : (this.frameY = 6);
        break;
    }
    // attack animation

    if (this.game.input.keys.includes("Control")) {
      this.maxFrameX = 3;
      switch (this.game.input.lastKey) {
        case "ArrowUp":
          this.frameY = 11;
          break;
        case "ArrowDown":
          this.frameY = 8;
          break;
        case "ArrowLeft":
          this.frameY = 10;
          break;
        case "ArrowRight":
          this.frameY = 9;
          break;
      }
    }
  }

  draw(context) {
    context.drawImage(
      this.image,
      this.frameX * this.spriteWidth,
      this.frameY * this.spriteHeight,
      this.spriteWidth,
      this.spriteHeight,
      this.x,
      this.y,
      this.width,
      this.height
    );
    // context.strokeRect(this.x, this.y, this.width, this.height);
    // context.beginPath();
    // context.arc(
    //   this.x + this.width / 2,
    //   this.y + this.height / 1.5,
    //   20,
    //   0,
    //   360
    // );
    // context.stroke();
  }

  checkAttackMode() {
    if (this.game.input.keys.includes("Control") && this.attack === false)
      this.frameX = 0;

    if (this.game.input.keys.includes("Control")) {
      this.attack = true;
      this.moving = false;
    }
  }

  checkCollision() {
    const collision = (player, object) => {
      return (
        player.x + player.width > object.x &&
        player.x < object.x + object.width &&
        player.y < object.y + object.height &&
        player.y + player.height > object.y
      );
    };
    const collisionObjects = [
      ...this.game.boundaries.boundaries,
      ...this.game.enemies,
    ];
    this.moving = true;

    for (i = 0; i < collisionObjects.length; i++) {
      // check collision while moving up
      const boundary = collisionObjects[i];
      if (
        this.game.input.keys.includes("ArrowUp") &&
        collision(
          {
            ...this,
            width: this.width - 60,
            height: this.height - 70,
            x: this.x + 30,
            y: this.y + 60,
          },
          { ...boundary, y: boundary.y + 3 }
        )
      ) {
        this.moving = false;
        break;
      }

      if (
        this.game.input.keys.includes("ArrowDown") &&
        collision(
          {
            ...this,
            width: this.width - 60,
            height: this.height - 70,
            x: this.x + 30,
            y: this.y + 60,
          },
          { ...boundary, y: boundary.y - 3 }
        )
      ) {
        this.moving = false;
        break;
      }

      if (
        this.game.input.keys.includes("ArrowRight") &&
        collision(
          {
            ...this,
            width: this.width - 60,
            height: this.height - 70,
            x: this.x + 30,
            y: this.y + 60,
          },
          { ...boundary, x: boundary.x - 3 }
        )
      ) {
        this.moving = false;
        break;
      }

      if (
        this.game.input.keys.includes("ArrowLeft") &&
        collision(
          {
            ...this,
            width: this.width - 60,
            height: this.height - 70,
            x: this.x + 30,
            y: this.y + 60,
          },
          { ...boundary, x: boundary.x + 3 }
        )
      ) {
        this.moving = false;
        break;
      }
    }
  }
}

class Enemy {
  constructor(game, x, y) {
    this.game = game;
    this.frameX = 0;
    this.maxFrameX = 5;
    this.frameY = 1;
    this.image = new Image();
    this.image.src = "/topdowngame/assets/img/slime.png";
    this.spriteWidth = 32;
    this.spriteHeight = 32;
    this.width = 64;
    this.height = 64;
    this.x = x;
    this.y = y;
    this.refreshRate = 0;
    this.moving = false;
    this.movingRight = false;
    this.movingLeft = false;
    this.movingTimer = 0;
    this.movingInterval = Math.random() * 15 + 15;
    this.markedForDeletion = false;
  }

  update() {
    if (this.frameX < this.maxFrameX) this.frameX++;
    else this.frameX = 0;

    if (this.movingTimer < this.movingInterval) {
      this.movingTimer++;
    } else {
      this.movingTimer = 0;
      this.moving = !this.moving;
      if (this.moving)
        this.movingRight === true
          ? ((this.movingRight = false), (this.movingLeft = true))
          : ((this.movingRight = true), (this.movingLeft = false));

      if (!this.moving) {
        switch (this.frameY) {
          case 2:
            this.frameY = 6;
            this.maxFrameX = 5;
            break;
          case 7:
            this.frameY = 1;
            this.maxFrameX = 5;
            break;
        }
      }
    }

    if (this.moving && this.movingRight) {
      this.x += this.game.gameSpeed;
      this.frameY = 2;
      this.maxFrameX = 6;
    }

    if (this.moving && this.movingLeft) {
      this.x -= this.game.gameSpeed;
      this.frameY = 7;
      this.maxFrameX = 6;
    }
  }

  checkCollision() {
    const collision = (player, enemy) => {
      return (
        Math.sqrt(
          Math.pow(player.x + player.width / 2 - enemy.x - enemy.width / 2, 2) +
            Math.pow(
              player.y + player.height / 1.5 - enemy.y - enemy.height / 2,
              2
            )
        ) < 70
      );
    };

    this.game.player.collisionAlert = false;

    this.game.enemies.forEach((enemy) => {
      if (collision(this.game.player, enemy)) {
        this.game.player.collisionAlert = true;

        if (
          this.game.input.lastKey === "ArrowUp" &&
          this.game.input.keys.includes("Control") &&
          this.game.player.y +
            this.game.player.height / 2 -
            enemy.y -
            enemy.height / 2 <
            60
        ) {
          enemy.markedForDeletion = true;
          this.game.enemiesVanished.push(new EnemyVanish(enemy, this.game));
        }

        if (
          this.game.input.lastKey === "ArrowDown" &&
          this.game.input.keys.includes("Control") &&
          enemy.y +
            enemy.height / 2 -
            this.game.player.y -
            this.game.player.height / 2 <
            80
        ) {
          enemy.markedForDeletion = true;
          this.game.enemiesVanished.push(new EnemyVanish(enemy, this.game));
        }

        if (
          this.game.input.lastKey === "ArrowLeft" &&
          this.game.input.keys.includes("Control") &&
          this.game.player.x +
            this.game.player.width / 2 -
            enemy.x -
            enemy.width / 2 <
            60
        ) {
          enemy.markedForDeletion = true;
          this.game.enemiesVanished.push(new EnemyVanish(enemy, this.game));
        }

        if (
          this.game.input.lastKey === "ArrowRight" &&
          this.game.input.keys.includes("Control") &&
          enemy.x +
            enemy.width / 2 -
            this.game.player.x -
            this.game.player.width / 2 <
            60
        ) {
          enemy.markedForDeletion = true;
          this.game.enemiesVanished.push(new EnemyVanish(enemy, this.game));
        }
      }
    });

    if (this.game.player.collisionAlert) {
      this.moving = false;
    }
  }

  draw(context) {
    context.drawImage(
      this.image,
      this.frameX * this.spriteWidth,
      this.frameY * this.spriteHeight,
      this.spriteWidth,
      this.spriteHeight,
      this.x,
      this.y,
      this.width,
      this.height
    );
    // context.beginPath();
    // context.arc(this.x + this.width / 2, this.y + this.height / 2, 15, 0, 360);
    // context.stroke();
    // context.strokeRect(this.x, this.y, this.width, this.height);
  }
}

class EnemyVanish {
  constructor(enemy, game) {
    this.enemy = enemy;
    this.game = game;
    this.frameX = 0;
    this.maxFrameX = 4;
    this.frameY = 4;
    this.image = new Image();
    this.image.src = "/topdowngame/assets/img/slime.png";
    this.spriteWidth = 32;
    this.spriteHeight = 32;
    this.x = this.enemy.x;
    this.y = this.enemy.y;
    this.width = 64;
    this.height = 64;
    this.markedForDeletion = false;
  }
  update() {
    if (this.enemy.movingLeft) this.frameY = 9;
    if (this.frameX < this.maxFrameX) {
      this.frameX++;
    } else {
      this.markedForDeletion = true;
      this.game.gameScore++;
    }
  }

  draw(context) {
    context.drawImage(
      this.image,
      this.frameX * this.spriteWidth,
      this.frameY * this.spriteHeight,
      this.spriteWidth,
      this.spriteHeight,
      this.x,
      this.y,
      this.width,
      this.height
    );
  }
}

class InputHandler {
  constructor(game) {
    this.game = game;
    this.keys = [];
    this.lastKey = "";

    window.addEventListener("keydown", (e) => {
      if (
        (e.key === "ArrowUp" ||
          e.key === "ArrowDown" ||
          e.key === "ArrowLeft" ||
          e.key === "ArrowRight" ||
          e.key === "Control") &&
        this.keys.indexOf(e.key) === -1
      ) {
        this.keys.push(e.key);
      }
      if (
        e.key === "ArrowUp" ||
        e.key === "ArrowDown" ||
        e.key === "ArrowLeft" ||
        e.key === "ArrowRight"
      ) {
        this.lastKey = e.key;
      }
    });

    window.addEventListener("keyup", (e) => {
      if (
        e.key === "ArrowUp" ||
        e.key === "ArrowDown" ||
        e.key === "ArrowLeft" ||
        e.key === "ArrowRight" ||
        e.key === "Control"
      )
        this.keys.splice(this.keys.indexOf(e.key), 1);
    });
  }
}

class UI {
  constructor(game) {
    this.game = game;
  }

  draw(context) {
    context.font = "bold 48px Silkscreen";
    context.textAlign = "left";
    context.fillStyle = "brown";
    context.fillText("Score: " + this.game.gameScore, 20, 50);
  }
}

const game = new Game(canvas.width, canvas.height, collisionsMap);

function animate() {
  canvasContext.clearRect(0, 0, canvas.width, canvas.height);
  game.update();
  game.draw(canvasContext);
  requestAnimationFrame(animate);
}

animate();
