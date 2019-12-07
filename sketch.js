// Global variable to store the classifier
let classifier;

// Teachable Machine model URL:
let soundModel = 'https://teachablemachine.withgoogle.com/models/82Y5yAEQ/model.json';

let apple;

function preload() {
  // Load the model
  classifier = ml5.soundClassifier(soundModel, {invokeCallbackOnNoiseAndUnknown: true, overlapFactor: 0.4});
  // bgImage = loadImage("bg.jpg");
  // bgImage.resize(width, height);
  apple = loadImage("https://cdn.icon-icons.com/icons2/16/PNG/256/fruit_apple_food_1815.png");
  apple.resize(17, 17)
}

let snake;
let currentDirection;
let fieldSize, paintSize, offset;
let foodLocation;
let N;
let bgImage, scoreDiv, directionDiv;
let stars;

let actionQueue;
let mode;

function Point(x, y) {
	this.x = x;
	this.y = y;
}

function setup() {
  var cnv = createCanvas(400, 400);

  var x = (windowWidth - width) / 2;
  var y = (windowHeight - height) / 2;
  cnv.position(x, y);

  directionDiv = document.getElementById("direction");

  scoreDiv = document.getElementById("score");
  scoreDiv.style.left = x + width + 40;
  scoreDiv.style.top = y;

  rectMode(CENTER);

  fieldSize = 20;
  paintSize = 17; 
  offset = fieldSize / 2;
  N = int(width / fieldSize);

  // vectors ordered counterclockwise from right
  // note that y-positive is screen-down
  directionVectors = [new Point(1, 0),
  						new Point(0, -1),
  						new Point(-1, 0),
  						new Point(0, 1)];

  mode = 'load';

  initializeGame();

  frameRate(5);
  drawFood();
  drawSnake();

  classifier.classify(gotResult);
}

function draw() {
  if (mode == 'load') {
  	  background(0, 40, 0);
  } else if (mode == 'play') {
  	  // update game state
	  executeAction();
	  moveSnake();
      
      // draw
	  background(0, 40, 0);
	  drawFood();
	  drawSnake();
  } else if (mode == 'victory') {
  	  frameRate(30);
  	  if (frameCount % 30 == 0) {
  	  	addStar();
  	  }

      // draw
	  background(0, 40, 0);
	  drawFood();
	  drawSnake();
	  for (let s of stars) {
	  	if (s.radius < 2*width) {
		  	s.radius += 2;
		  	s.draw();
		}
	  }
  }
}

function initializeGame() {
  frameRate(5);
  snake = [new Point(10, 10)]
  currentDirection = 0;	 // start moving to the right
  actionQueue = [];
  generateFood();
  updateScore();
  stars = [];
}

function addStar() {
	stars.push(new Star());
}

function Star() {
	this.centerX = int(width * Math.random());
	this.centerY = int(height * Math.random());
	this.radius = 5 + 40 * Math.random();
	let rnd = Math.random();
	this.color = color(int(rnd * 255), int(rnd * 255), int((1. - rnd) * 255));

	this.draw = function () {
		noStroke();
		fill(this.color);

		// construct the star
		beginShape();
		for (let i=0; i < 6; i++) {
			vertex(int(this.centerX + this.radius * Math.cos(i * PI / 3)), int(this.centerY + this.radius * Math.sin(i * PI / 3)));
			vertex(int(this.centerX + 0.3 * this.radius * Math.cos((i + 0.5) * PI / 3)), int(this.centerY + 0.3 * this.radius * Math.sin((i + 0.5) * PI / 3)));
		}
		endShape();
	}

}

function updateScore() {
	scoreDiv.innerHTML = snake.length;
	if (snake.length > 23) {
		mode = 'victory';
	}
}

function drawFood() {
  noStroke();
  fill(255, 50, 50);
  //rect(fieldSize * foodLocation.x + offset, fieldSize * foodLocation.y + offset, paintSize, paintSize);
  image(apple, fieldSize * foodLocation.x + offset - 10, fieldSize * foodLocation.y + offset - 13, fieldSize+2, fieldSize+2);
}

function drawSnake() {
  noStroke();
  fill(0, 100, 0);
  for (let p of snake) {
  	rect(fieldSize * p.x + offset, fieldSize * p.y + offset, paintSize, paintSize)
  }
}

function moveSnake() {
	var candidate = new Point((snake[0].x + directionVectors[currentDirection].x) % N, (snake[0].y + directionVectors[currentDirection].y) % N);
	if (candidate.x < 0) {
		candidate.x = candidate.x + N;
	}
	if (candidate.y < 0) {
		candidate.y = candidate.y + N;
	}

	if (isInSnake(candidate)) {  // the snake bit itself! 
		initializeGame();  // start over
	} else {
		snake.unshift(candidate);  // insert new point (new position of head) at index 0

		// if by adding the new point it ate the food, generate new food
		// and DON'T remove the last point
		if ((snake[0].x == foodLocation.x) && (snake[0].y == foodLocation.y)) {
			generateFood();
			updateScore();
		} else {  // otherwise, just remove the last snake point (old tail position)
		    snake.pop();
		}
	}
}

function generateFood() {
	// pick a random point on the grid that is not on the snake
	do {
  		foodLocation = new Point(int(random(width) / fieldSize), int(random(height) / fieldSize));
  	} while (isInSnake(foodLocation));
}

function keyPressed() {
	if (keyCode === RIGHT_ARROW) {
		actionQueue.push(0);
	} else if (keyCode === UP_ARROW) {
		actionQueue.push(1);
	} else if (keyCode === LEFT_ARROW) {
		actionQueue.push(2);
	} else if (keyCode === DOWN_ARROW) {
		actionQueue.push(3);
	}
}

function executeAction() {
  if (actionQueue.length > 0) {
	if ((actionQueue[0] === 0) && (currentDirection != 2)) {
		currentDirection = 0;
	} else if ((actionQueue[0] === 1) && (currentDirection != 3)) {
		currentDirection = 1;
	} else if ((actionQueue[0] === 2) && (currentDirection != 0)) {
		currentDirection = 2;
	} else if ((actionQueue[0] === 3) && (currentDirection != 1)) {
		currentDirection = 3;
	}
	actionQueue.shift();
  }
}

function isInSnake(p) {
	var result = false;
	for (let i=0; i < snake.length; i++) {
		if ((snake[i].x == p.x) && (snake[i].y == p.y)) {
			result = true;
			break;
		}
	}
	return result;
}

function gotResult(error, results){
	let maxCon = 0.;
	let maxIndex = 0;

	for (let i=0; i<results.length; i++) {
		if (results[i].confidence > maxCon) {
			maxCon = results[i].confidence;
			maxIndex = i;
		}
	}

	// threshold probability for not being noise
	let threshold = 0.98;
	if ((maxIndex > 0) && (maxCon < threshold)) {
		maxIndex = 0;
	}

	if (results[maxIndex].label == "RIGHT") {
		actionQueue.push(0);
	} else if (results[maxIndex].label == "UP") {
		actionQueue.push(1);
	} else if (results[maxIndex].label == "LEFT") {
		actionQueue.push(2);
	} else if (results[maxIndex].label == "DOWN") {
		actionQueue.push(3);
	}

	directionDiv.innerHTML = results[maxIndex].label;

	if (mode == 'load') {
		mode = 'play';
	}
}