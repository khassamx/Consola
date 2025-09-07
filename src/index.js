const readline = require('readline');
const qrcode = require('qrcode-terminal');
const fs = require('fs');

const width = 70;
const height = 20;

// Halcón frames para animación
const halconFrames = [
  `  __🦅__ `,
  ` <(🦅 )> `,
  `  ~~🦅~~ `,
  ` <( 🦅)> `
];

// Variables de estado
let pos = 0;
let frameIndex = 0;
let verticalPos = 8;
let direction = 1;
let zigzag = 0;
let zigzagDirection = 1;

// Nubes y estrellas en diferentes capas
let cloudLayer1 = Array.from({ length: width }, () => Math.random() < 0.12 ? '☁️' : ' ');
let cloudLayer2 = Array.from({ length: width }, () => Math.random() < 0.08 ? '☁️' : ' ');
let starsLayer = Array.from({ length: width }, () => Math.random() < 0.05 ? '✨' : ' ');

// Variables para estrellas fugaces y meteoritos
let shootingStar = null;
let meteor = null;

// Mensaje parpadeante
const welcomeFrames = ["🌟 BIENVENIDO A MICHIBOT 🌟", "✨ QUE EMPIECE LA AVENTURA ✨", "                              "];
let cycle = 0;

let qrCodeData = null;
let botIsReady = false;

// Configuración del readline para capturar la entrada
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function drawFrame() {
  console.clear();

  // Mensaje parpadeante
  console.log(welcomeFrames[cycle % welcomeFrames.length] + "\n");

  // Mover nubes y estrellas a diferentes velocidades
  cloudLayer1.unshift(cloudLayer1.pop());
  cloudLayer2.push(cloudLayer2.shift());
  starsLayer.unshift(starsLayer.pop());

  // Movimiento horizontal y zigzag del halcón
  pos++;
  if (pos > width + halconFrames[0].length) {
    pos = -halconFrames[0].length;
  }
  zigzag += zigzagDirection;
  if (zigzag >= 3 || zigzag <= -3) {
    zigzagDirection *= -1;
  }

  // Movimiento vertical del halcón
  verticalPos += direction;
  if (verticalPos >= height - 5 || verticalPos <= 2) {
    direction *= -1;
  }

  // Generar estrella fugaz o meteorito
  if (Math.random() < 0.01 && !shootingStar) {
    shootingStar = { x: width - 1, y: Math.floor(Math.random() * (height - 5)) + 2 };
  }
  if (Math.random() < 0.005 && !meteor) {
    meteor = { x: width - 1, y: Math.floor(Math.random() * (height - 5)) + 2 };
  }

  // Dibujar el cielo y las capas
  for (let y = 0; y < height; y++) {
    let line = Array(width).fill(' ');

    // Estrellas
    if (y > 1 && y < height / 1.5) {
      starsLayer.forEach((star, x) => {
        if (star === '✨') line[x] = '✨';
      });
    }
    
    // Nubes de la capa 2 (las que están más atrás)
    if (y === Math.floor(height / 2)) {
      cloudLayer2.forEach((cloud, x) => {
        if (cloud === '☁️') line[x] = '☁️';
      });
    }

    // Dibujar el halcón si está detrás de las nubes (simulación de profundidad)
    if (y === verticalPos && y > Math.floor(height / 4)) {
      const halcon = halconFrames[frameIndex];
      for (let i = 0; i < halcon.length; i++) {
        if (pos + i >= 0 && pos + i < width) {
          if (line[pos + i] !== '☁️') {
             line[pos + i] = halcon[i];
          }
        }
      }
    }
    
    // Nubes de la capa 1 (las que están más adelante)
    if (y === Math.floor(height / 4)) {
      cloudLayer1.forEach((cloud, x) => {
        if (cloud === '☁️') line[x] = '☁️';
      });
    }

    // Dibujar el halcón si está delante de las nubes
    if (y === verticalPos && y <= Math.floor(height / 4)) {
      const halcon = halconFrames[frameIndex];
      for (let i = 0; i < halcon.length; i++) {
        if (pos + i >= 0 && pos + i < width) {
           line[pos + i] = halcon[i];
        }
      }
    }

    // Dibujar estrellas fugaces
    if (shootingStar && y === shootingStar.y) {
      if (shootingStar.x >= 0 && shootingStar.x < width) {
        line[shootingStar.x] = '💫';
        if (shootingStar.x + 1 < width) line[shootingStar.x + 1] = '✨';
      }
      shootingStar.x--;
    }
    if (shootingStar && shootingStar.x < 0) {
      shootingStar = null;
    }

    // Dibujar meteoritos
    if (meteor && y === meteor.y) {
      if (meteor.x >= 0 && meteor.x < width) {
        line[meteor.x] = '☄️';
        if (meteor.x + 1 < width) line[meteor.x + 1] = '🔥';
      }
      meteor.x -= 2;
    }
    if (meteor && meteor.x < 0) {
      meteor = null;
    }

    console.log(line.join('').padEnd(width, ' '));
  }
  
  // Suelo
  console.log('_'.repeat(width));

  // Espacio para QR o mensaje fijo
  console.log("\n".repeat(2));
  if (qrCodeData) {
      console.log("📌 Escanea este QR con tu WhatsApp:");
      qrcode.generate(qrCodeData, { small: true });
  } else if (botIsReady) {
      console.log("✅ Bot listo. Esperando nuevos mensajes...");
  } else {
      console.log("⏳ Esperando el código QR...");
  }
  
  // Actualizar frame del halcón
  frameIndex = (frameIndex + 1) % halconFrames.length;
  cycle++;
}

// Configuración de la animación
const interval = setInterval(drawFrame, 120);

// Funcionalidad del bot
async function startBot() {
    // Aquí iría tu lógica de Baileys, similar a la que hemos trabajado
    // Reemplaza esto con tu código de conexión real
    console.log('Bot iniciado (simulación). Esperando el código QR...');
    
    // Simular que Baileys genera un QR
    setTimeout(() => {
        const dummyQr = "https://wa.me/qr/EXAMPLE_QR_CODE_DATA";
        qrCodeData = dummyQr;
        
        // Simular que el usuario escanea el QR
        setTimeout(() => {
            qrCodeData = null; // El QR desaparece
            botIsReady = true;
            console.log("\n✅ ¡Código QR escaneado con éxito! Bot conectado.");
        }, 10000); // 10 segundos para simular el escaneo
    }, 5000); // El QR se genera después de 5 segundos
}

// Inicia la animación y el bot
startBot();