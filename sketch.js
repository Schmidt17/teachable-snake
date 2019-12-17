// Global variable to store the classifier
let classifier;

// Teachable Machine model URL:
// let soundModel = 'https://teachablemachine.withgoogle.com/models/82Y5yAEQ/model.json';
// let soundModel = 'https://teachablemachine.withgoogle.com/models/ZOeMc4-H/model.json';  // LEFT RIGHT UP DOWN

let apple, headImg;


function preload() {
  // Read the model url from the GET parameters
  let modelURL = window.location.search.substr(1);
  if (modelURL.length > 0) {
  	if (modelURL.charAt(modelURL.length - 1) != '/') {
		modelURL += "/";
	}
	modelURL += "model.json";
  } else {
  	modelURL = 'https://teachablemachine.withgoogle.com/models/ZOeMc4-H/model.json';  // LEFT RIGHT UP DOWN
  }
  classifier = ml5.soundClassifier(modelURL, {invokeCallbackOnNoiseAndUnknown: true, overlapFactor: 0.9});
  
  apple = loadImage("apple.png");
  headImg = loadImage("head.png");
  apple.resize(17, 17)
}

let snake;
let currentDirection;
let fieldSize, paintSize, headSize, offset;
let foodLocation;
let N;
let scoreDiv, directionDiv, initDiv;
let stars;

let actionQueue;
let mode;

function Point(x, y) {
	this.x = x;
	this.y = y;
}

function setup() {
  var cnv = createCanvas(800, 800);

  var x = (windowWidth - width) / 2;
  var y = (windowHeight - height) / 2;
  cnv.position(x, y);

  // directionDiv = document.getElementById("direction");
  initDiv = document.getElementById("init");
  initDiv.style.left = int(x + width/2 - initDiv.scrollWidth/2) + "px";
  initDiv.style.top = int(y + height/2 - initDiv.scrollHeight/2) + "px";
  initDiv.style.visibility = 'visible';

  scoreDiv = document.getElementById("score");
  scoreDiv.style.left = int(x + width + 40) + "px";
  scoreDiv.style.top = int(y) + "px";
  scoreDiv.style.visibility = 'visible';

  rectMode(CENTER);

  fieldSize = int(width / 20);
  paintSize = fieldSize - 3; 
  headSize = fieldSize + 5;
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
  if ((mode == 'load') || (mode == 'pause')) {
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
		  	s.radius += 3;
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
  image(apple, fieldSize * foodLocation.x + offset - fieldSize/2 + 2, fieldSize * foodLocation.y + offset - fieldSize/2 - 1, fieldSize - 1, fieldSize - 1);
}

function drawSnake() {
  noStroke();
  fill(0, 100, 0);
  for (let i=1; i < snake.length; i++) {
  	rect(fieldSize * snake[i].x + offset, fieldSize * snake[i].y + offset, paintSize, paintSize)
  }

  // draw head as image
  // draw it last so it is on top of the segments
  // image(headImg, fieldSize * snake[0].x + offset - 10, fieldSize * snake[0].y + offset - 13, fieldSize+2, fieldSize+2);
  image(headImg, fieldSize * snake[0].x + offset - int(2 * headSize / 5), fieldSize * snake[0].y + offset - int(headSize / 2), fieldSize+5, fieldSize+5);
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
	} else if (keyCode === 80) {  // key 'p'
		if (mode == "play") {
			mode = "pause";
		} else if (mode == "pause") {
			mode = "play";
		}
	} else if (keyCode === 171) {  // key '+'
		frameRate(frameRate() + 1);
	} else if (keyCode === 173) {  // key '-'
		frameRate(frameRate() - 1);
	} else if (keyCode === 48) {  // key '0'
		frameRate(5);
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
	if (error) {
		console.log(error);
	} else {
		// threshold probability for not being noise
		let threshold = 0.6;
		if (!((results[0].label != "_background_noise_") && (results[0].confidence < threshold))) {
			
			if (results[0].label == "RIGHT") {
				actionQueue.push(0);
			} else if (results[0].label == "UP") {
				actionQueue.push(1);
			} else if (results[0].label == "LEFT") {
				actionQueue.push(2);
			} else if (results[0].label == "DOWN") {
				actionQueue.push(3);
			}
		}

		// directionDiv.innerHTML = results[maxIndex].label;
	}

	if (mode == 'load') {
		initDiv.style.visibility = 'hidden';
		mode = 'play';
	}
}