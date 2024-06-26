const canvas = document.getElementById("stkr-area");
const ctx = canvas.getContext("2d");
const speed = 2;

let width;
let height;
let mouseX = 0;
let mouseY = 0;
let hue = 0;
let ballRadius = 20;
let gameEnded = false;
let gameDuration = 60;
let startTime;  //秒数カウント用

//データ保存処理
let ebimoney;
let firebaseData;
window.addEventListener('DOMContentLoaded',async()=>{//データベースからの読み込み
    await new Promise((resolve)=>setTimeout(resolve,500));//500msの遅延を意図的に.ログインまでの時間を稼ぐ
    firebaseData = await window.load();
    ebimoney = firebaseData.count;
})

//最大値から最小値までの数字をランダムに取得する関数
function getRandomInt(min, max) {
   return Math.floor(Math.random() * (max - min + 1)) + min;
}

const enemyImage = new Image();
enemyImage.src = 'imagefolder/敵えびA.png';

const rectangleImage = new Image();
rectangleImage.src = 'imagefolder/syokubutu_maruta2.png';

const ballImage = new Image();
ballImage.src = 'imagefolder/mushi_mijinko.png';

//障害物の座標と角度を取得
class Enemy {
   constructor(x, y, angle) {
      this.x = x;
      this.y = y;
      this.dx = speed * Math.cos(angle);
      this.dy = speed * Math.sin(angle);
      this.radius = 50;
      this.rotation = 0;
   }

   //障害物を描画する
   draw() {
      ctx.save();

      this.y += this.dy;
      this.x += this.dx;

      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);

      //ctx.beginPath();
      //ボールの座標、半径、描画する始まり、内角
      // ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      // ctx.fillStyle = "#047613";
      // ctx.fill();
      // ctx.closePath();

      ctx.drawImage(enemyImage, - this.radius, - this.radius, this.radius * 2, this.radius * 2);

      ctx.restore();
      this.rotation += 0.1;
   }
}

//障害物に長方形を追加
class Rectangle {
   constructor(x, y, width, height, dy) {
      this.x = x;
      this.y = y;
      this.width = width;
      this.height = height;
      this.dy = dy;
   }

   //正方形を描写する
   draw() {
      ctx.save();
      this.y += this.dy;
      ctx.drawImage(rectangleImage, this.x, this.y, this.width, this.height);

      //ctx.fillStye = 'black';
      //ctx.fillRect(this.x, this.y, this.width, this.height);
      ctx.restore();
   }
}

const enemies = [];
const rectangles = [];

function enemy1() {  //下からくるボール
   let x = canvas.width / 5 * getRandomInt(0, 5);
   let y = canvas.height;
   let angle = Math.PI + Math.random() * Math.PI;
   //座標と移動するときの角度をpush
   enemies.push(new Enemy(x, y, angle));
}

function enemy2() {  //上からくるボール
   let x = canvas.width / 5 * getRandomInt(0, 5);
   let y = 0;
   let angle = Math.random() * Math.PI;
   enemies.push(new Enemy(x, y, angle));
}

function enemy3() {  //左からくるボール
   let x = 0;
   let y = canvas.height / 5 * getRandomInt(0, 5);
   let angle = (Math.random() < 0.5)
      ? (Math.random() * (Math.PI / 2))  //0~90度を出力
      : (3 * Math.PI / 2 + Math.random() * (Math.PI / 2));  //270~360度を出力
   enemies.push(new Enemy(x, y, angle));
}

function enemy4() {  //右からくるボール
   let x = canvas.width;
   let y = canvas.height / 5 * getRandomInt(0, 5);

   let angle = (Math.random() * Math.PI / 2) + (Math.random() * 3 * Math.PI / 2);

   enemies.push(new Enemy(x, y, angle));
}

function drawBall() {//ボールを描画
   ctx.save();
   //描画実行
   ctx.translate(mouseX, mouseY);
   ctx.drawImage(ballImage, -ballRadius, -ballRadius, ballRadius * 2, ballRadius * 2);
   ctx.restore();
};

//1〜4の数字をランダムに出力して周りから障害物が飛んでくるようにする
function spawnEnemy() {
   let i = getRandomInt(1, 4);
   switch (i) {
      case 1:
         enemy1();
         break;
      case 2:
         enemy2();
         break;
      case 3:
         enemy3();
         break;
      case 4:
         enemy4();
         break;
   }
}

//丸太の生成
function spawnRectangle() {
   let width = 100;
   let height = 500;
   let x = Math.random() * (canvas.width - width);
   let y = -height;
   let dy = speed;
   rectangles.push(new Rectangle(x, y, width, height, dy));
}

//当たり判定
function checkCollision() {
   for (let enemy of enemies) {
      const dx = enemy.x - mouseX;
      const dy = enemy.y - mouseY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      //ゲームオーバー時の処理
      if (distance < enemy.radius + ballRadius) {
         alert("えびにたべられてしまった");
         location.href = 'stageselect.html';
         gameEnded = true;
         return true;
      }
   }
   //return false;

   for (let rect of rectangles) {
      if (rect.x < mouseX + ballRadius &&
         rect.x + rect.width > mouseX - ballRadius &&
         rect.y < mouseY + ballRadius &&
         rect.y + rect.height > mouseY - ballRadius) {
         alert("えびにたべられてしまった");
         location.href = 'stageselect.html';
         gameEnded = true;
         return true;
      }
   }
}

function updateTimer() {
   const timerElement = document.getElementById('timer');
   const elapasedTime = (Date.now() - startTime) / 1000;
   const remainingTime = Math.max(0, gameDuration - elapasedTime);
   timerElement.textContent = `残り時間: ${remainingTime.toFixed(1)}秒`;

   if (remainingTime <= 0) {
      gameClear();
   }
}

//アニメーション
function updataCanvas() {
   ctx.clearRect(0, 0, canvas.width, canvas.height);
   enemies.forEach(enemy => enemy.draw());
   rectangles.forEach(rect => rect.draw());
   drawBall();
   updateTimer();  //残り時間の更新
}

//障害物を繰り返し処理
function gameLoop() {
   if (!gameEnded) {
      updataCanvas();
      if (!checkCollision()) {  //衝突が検出されなかった場合のみループさせる
         requestAnimationFrame(gameLoop);
      }
   }
}

//マウス座標の更新
function getMousePosition(e) {
   let rect = e.target.getBoundingClientRect();
   mouseX = Math.floor(e.clientX - rect.left);
   mouseY = Math.floor(e.clientY - rect.top);

};

function initializeBall() {
   if (!canvas && !canvas.getContext) {
      return false;
   }

   width = ctx.canvas.width;
   height = ctx.canvas.height;

   //ボールの初期化位置は中心
   mouseX = width / 2;
   mouseY = height / 2;

   canvas.addEventListener('mousemove', getMousePosition, false);

};

function setCanvasSize() {
   canvas.width = document.documentElement.clientWidth;
   canvas.height = document.documentElement.clientHeight
      - canvas.getBoundingClientRect().top;
}

//ステージクリア処理
function gameClear() {
   if (!gameEnded) {
      alert("えびまよかいひに成功した\n100000えびまよを手に入れた");
      ebimoney += 150000;
      window.save(ebimoney,firebaseData.clickValue);//えびまよのデータを保存
      location.href = 'stageselect.html';
      gameEnded = true;
   }
}

setCanvasSize();
canvas.addEventListener('resize', setCanvasSize, false);
initializeBall();
startTime = Date.now();
gameLoop();

//えびが出現する時間
setInterval(spawnEnemy, 200);

//丸太が出現する時間
setInterval(spawnRectangle,20000);