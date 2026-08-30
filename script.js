const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let groundY = window.innerHeight * 0.55;

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    groundY = canvas.height * 0.55;

    if(player){
        player.groundY = groundY - player.height;
        if (!player.isJumping) {
            player.y=player.groundY;
        }
    }
    if(obstacle){
        obstacle.y =groundY - obstacle.height;
    }
}

const bgLayers =[
    {img: new Image(),src:'assests/bg/layer1_sky.png',speedFactor:0.02,x:0},
    { img: new Image(), src: 'assets/clouds/clouds.png',    speedFactor: 0.05, x: 0 },
    { img: new Image(), src: 'assets/bg/layer2_far.png',    speedFactor: 0.10, x: 0 },
    { img: new Image(), src: 'assets/bg/layer3_mid.png',    speedFactor: 0.20, x: 0 },
    { img: new Image(), src: 'assets/bg/layer4_near.png',   speedFactor: 0.35, x: 0 },
    { img: new Image(), src: 'assets/bg/layer5_front.png',  speedFactor: 0.55, x: 0 },

];
bgLayers.forEach(layer => {layer.img.src =layer.src;});

const obstacleImg1 =new Image();
obstacleImg1.src = 'obsticale1.png';
const obstacleImg2 = new Image();
obstacleImg2.src = 'obisticale2-with-animation.gif';

const obstacleImages = [obstacleImg1, obstacleImg2];
let currentObstacleImg = obstacleImg1;


const walkFrames = [];
for (let i = 0; i <= 11; i++) {
    const img = new Image();
    const frameNum = String(i).padStart(3, '0');
    img.src = `Robot_Asset_Pack/Animations/Walk/Walk_${frameNum}.png`;
    walkFrames.push(img);
}


const jumpFrames = [];
for (let i = 0; i <= 11; i++) {
    const img = new Image();
    const frameNum = String(i).padStart(3, '0');
    img.src = `Robot_Asset_Pack/Animations/Jump/Jump_${frameNum}.png`;
    jumpFrames.push(img);
}

let score = 0;
let level = 1;
let obstaclesCleared = 0;
let isGameStarted = false;
let isPaused =false;
let isSlowMo = false;
let timerInterval;

let animFrameIndex=0;
let animTimer =0;

let questionsNeeded=1;
let currentAnswer =0;

let player={
    x:120,
    y:0,
    width:90,
    height:95,
    groundY:0,
    isJumping:false,
    jumpSpeed:0
};

let obstacle ={
    x: window.innerWidth,
    y:0,
    width:65,
    height:70,
    speed:6,
    triggered:false
};

const GRAVITY=0.8;
const INITIAL_JUMP_SPEED=-15;

resizeCanvas();
window.addEventListener('resize',resizeCanvas);

const bgMusic=document.getElementById('bg-music');
const quizSound = document.getElementById('quiz-sound');
const gameOverSound=document.getElementById('game-over-sound');

function playQuizSound(){
    if (quizSound) {
        quizSound.currentTime = 0;
        quizSound.play().catch(() => {});
    }


}

function playGameOverSound(){
    if (gameOverSound){
        gameOverSound.currentTime=0;
        gameOverSound.play().catch(()=> {});
    }
}

function startBgMusic() {
    if (bgMusic) {
        bgMusic.volume = 0.3;
        bgMusic.play().catch(() => {});
    }
}

function stopBgMusic(){
    if (bgMusic){
        bgMusic.pause();
        bgMusic.currentTime=0;
    }
}

function startGame(){
    document.getElementById('start-screen').style.display = 'none';
    isGameStarted=true;
    startBgMusic();
    update();
}

function update(){
    if (!isGameStarted) return;

    if (!isPaused) {
        const  moveSpeed = isSlowMo ? obstacle.speed * 0.1 : obstacle.speed;
        const currentGravity = isSlowMo ? 0.05 : GRAVITY ;
        const jumpDelta = isSlowMo ? player.jumpSpeed * 0.1 : player.jumpSpeed;

        animTimer += isSlowMo ? 0.1 : 0.4;
        if (animTimer >= 1){
            animFrameIndex = (animFrameIndex + 1) % 12;
            animTimer= 0;
        } 

        obstacle.x -= moveSpeed;
        bgLayers.forEach(layer => {
            layer.x -= moveSpeed * layer.speedFactor;
        });

 const totalJumpFrames = Math.abs((2 * INITIAL_JUMP_SPEED) / GRAVITY);
        const jumpDistance = totalJumpFrames * obstacle.speed;
        const triggerDistance = player.x + (jumpDistance * 0.65);

        if (obstacle.x <= triggerDistance && !obstacle.triggered) {
            obstacle.triggered = true;
            startQuizSequence();
        }

      
        if (obstacle.x < -obstacle.width) {
            obstacle.x = canvas.width;
            obstacle.triggered = false;
            const randomIndex = Math.floor(Math.random() * obstacleImages.length);
            currentObstacleImg = obstacleImages[randomIndex];
        }

        if (player.isJumping) {
            player.y += jumpDelta;
            player.jumpSpeed += currentGravity;

            if (isSlowMo && player.jumpSpeed >= -2 && currentQuestionIndex < questionsNeeded) {
                showNextQuestion();
            }

            if (player.y >= player.groundY) {
                player.y = player.groundY;
                player.isJumping = false;
            }
        }
    }

    draw();
    requestAnimationFrame(update);
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    
    ctx.fillStyle = '#1a1a3a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    bgLayers.forEach(layer => {
        const img = layer.img;
        if (!(img.complete && img.naturalWidth !== 0)) return;

    
        const drawH = groundY;
        const drawW = img.naturalWidth * (drawH / img.naturalHeight);

     
        let x = layer.x % drawW;
        if (x > 0) x -= drawW;

        for (let dx = x; dx < canvas.width; dx += drawW) {
            ctx.drawImage(img, dx, 0, drawW, drawH);
        }
    });

    
    ctx.fillStyle = '#16213e';
    ctx.fillRect(0, groundY, canvas.width, canvas.height - groundY);
    ctx.fillStyle = '#4ecca3';
    ctx.fillRect(0, groundY, canvas.width, 5);


    const currentArray = player.isJumping ? jumpFrames : walkFrames;
    const currentFrame = currentArray[animFrameIndex];

    if (currentFrame && currentFrame.complete && currentFrame.naturalWidth !== 0) {
        ctx.drawImage(currentFrame, player.x, player.y, player.width, player.height);
    } else {
        ctx.fillStyle = '#4ecca3';
        ctx.fillRect(player.x, player.y, player.width, player.height);
    }

  
    if (currentObstacleImg.complete && currentObstacleImg.naturalWidth !== 0) {
        ctx.drawImage(currentObstacleImg, obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    } else {
        ctx.fillStyle = '#e94560';
        ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    }
}

function startQuizSequence() {
    currentQuestionIndex = 0;
    questionsNeeded = Math.min(level, 5); 
    isPaused = true;
    showNextQuestion();
}


function getTimeForLevel() {
    const time = Math.round(7 - (level - 1) * 0.5);
    return Math.max(time, 3);
}

function showNextQuestion() {
    playQuizSound();
    currentQuestionIndex++;
    document.getElementById('quiz-step').innerText = `Question ${currentQuestionIndex} of ${questionsNeeded}`;

    const maxNum = 10 * level;
    let num1 = Math.floor(Math.random() * maxNum) + 1;
    let num2 = Math.floor(Math.random() * maxNum) + 1;
    
    const operations = ['+', '-'];
    if (level >= 2) operations.push('*');
    const op = operations[Math.floor(Math.random() * operations.length)];

    if (op === '+') {
        currentAnswer = num1 + num2;
    } else if (op === '-') {
        if (num1 < num2) [num1, num2] = [num2, num1];
        currentAnswer = num1 - num2;
    } else {
        currentAnswer = num1 * num2;
    }

    document.getElementById('question').innerText = `${num1} ${op} ${num2} = ?`;
    
    const optionsDiv = document.getElementById('options');
    optionsDiv.innerHTML = '';
    
    let wrong1 = currentAnswer + Math.floor(Math.random() * 3) + 1;
    let wrong2 = Math.max(0, currentAnswer - (Math.floor(Math.random() * 3) + 1));
    let answers = [currentAnswer, wrong1, wrong2].sort(() => Math.random() - 0.5);

    answers.forEach(ans => {
        const btn = document.createElement('button');
        btn.innerText = ans;
        btn.onclick = () => checkAnswer(ans);
        optionsDiv.appendChild(btn);
    });

    document.getElementById('quiz-box').style.display = 'block';

    let timeLeft = getTimeForLevel();
    document.getElementById('timer').innerText = timeLeft;
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timeLeft--;
        document.getElementById('timer').innerText = timeLeft;
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            gameOver();
        }
    }, 1000);
}

function checkAnswer(selected) {
    clearInterval(timerInterval);

    if (selected === currentAnswer) {
        document.getElementById('quiz-box').style.display = 'none';

        if (currentQuestionIndex === 1) {
            isPaused = false;
            player.isJumping = true;
            player.jumpSpeed = INITIAL_JUMP_SPEED;

            if (questionsNeeded > 1) {
                isSlowMo = true;
            } else {
                completeObstacle();
            }
        } else if (currentQuestionIndex < questionsNeeded) {
            isSlowMo = true;
        } else {
            isSlowMo = false;
            completeObstacle();
        }
    } else {
        gameOver();
    }
}

function completeObstacle() {
    score += 10 * level;
    obstaclesCleared++;


    obstacle.speed += 0.15;

    if (obstaclesCleared % 5 === 0) {
        level++;
        obstacle.speed += 1; 
    }

    document.getElementById('score').innerText = score;
    document.getElementById('level').innerText = level;
    document.getElementById('cleared').innerText = obstaclesCleared;
}

function gameOver() {
    clearInterval(timerInterval);
    isGameStarted = false;
    isPaused = true;

    stopBgMusic();
    playGameOverSound();

    document.getElementById('quiz-box').style.display = 'none';
    document.getElementById('final-score').innerText = score;
    document.getElementById('final-level').innerText = level;
    document.getElementById('game-over-screen').style.display = 'block';
}