import React from 'react';
import { StyleSheet, View, SafeAreaView, StatusBar, Platform } from 'react-native';
import { WebView } from 'react-native-webview';

export default function App() {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <style>
            :root { --accent: #A020F0; }
            body { 
                margin: 0; 
                background: #121212; 
                display: flex; 
                flex-direction: column; 
                height: 100vh; 
                color: white; 
                font-family: sans-serif; 
                overflow: hidden; 
                touch-action: none; 
            }
            /* Score area at top */
            #header {
                height: 60px;
                display: flex;
                align-items: center;
                justify-content: center;
                background: #121212;
            }
            canvas { 
                background: #000; 
                touch-action: none; 
                flex-grow: 1; /* Makes canvas fill available space */
                width: 100vw;
                border-top: 2px solid var(--accent);
            }
            #editor-panel { 
                position: absolute; right: -280px; top: 0; width: 240px; height: 100%; 
                background: rgba(15, 15, 15, 0.98); border-left: 3px solid var(--accent); 
                padding: 15px; transition: 0.3s; pointer-events: all; z-index: 100; overflow-y: auto;
            }
            #editor-panel.open { right: 0; }
            .control-group { margin-bottom: 15px; border-bottom: 1px solid #333; padding-bottom: 10px; }
            input[type="color"] { width: 100%; height: 35px; border: none; }
            
            /* Customize button moved up slightly so it is not blocked by bottom bars */
            #edit-btn {
                position: absolute; 
                bottom: 30px; 
                right: 20px; 
                padding: 12px 20px; 
                background: var(--accent); 
                border: none; 
                color: white; 
                font-weight: bold; 
                border-radius: 50px; 
                z-index: 101;
                box-shadow: 0 4px 10px rgba(0,0,0,0.5);
            }
            .icon-btn { padding: 8px; background: #333; border: 1px solid #555; color: white; border-radius: 4px; margin-right: 5px; }
            .active { background: var(--accent); }
        </style>
    </head>
    <body>
        <div id="header">
            <h2 id="scoreDisp" style="margin:0; opacity:0; color: #FFD700;">Score: 0</h2>
        </div>
        <canvas id="gameCanvas"></canvas>
        <button id="edit-btn">🎨 EDIT</button>

        <div id="editor-panel">
            <h3 style="color:var(--accent)">EDITOR</h3>
            <div class="control-group">
                <label>ICON</label><br/><br/>
                <button class="icon-btn active" id="b1" onclick="setIcon('square','b1')">SQ</button>
                <button class="icon-btn" id="b2" onclick="setIcon('cat','b2')">CAT</button>
                <button class="icon-btn" id="b3" onclick="setIcon('star','b3')">STAR</button>
            </div>
            <div class="control-group"><label>Player Color</label><input type="color" id="cP" value="#A020F0"></div>
            <div class="control-group"><label>Enemy Color</label><input type="color" id="cE" value="#FF3333"></div>
            <div class="control-group"><label>Background</label><input type="color" id="cBG" value="#000000"></div>
            <button onclick="toggleEditor()" style="width:100%; padding:15px; background:#333; color:white; border:none; border-radius:5px;">BACK</button>
        </div>

        <script>
            const canvas = document.getElementById('gameCanvas');
            const ctx = canvas.getContext('2d');
            const scoreDisp = document.getElementById('scoreDisp');
            const editor = document.getElementById('editor-panel');
            const cpP = document.getElementById('cP'), cpE = document.getElementById('cE'), cpBG = document.getElementById('cBG');

            // Handle resize for mobile rotation
            function resize() {
                canvas.width = window.innerWidth;
                canvas.height = canvas.offsetHeight;
            }
            window.addEventListener('resize', resize);
            resize();

            let gameState = 'TITLE', player, enemies = [], score = 0, targetPos, isMoving = false, currentIcon = 'square';

            function toggleEditor() { 
                editor.classList.toggle('open'); 
                document.documentElement.style.setProperty('--accent', cpP.value);
            }
            document.getElementById('edit-btn').onclick = (e) => { e.stopPropagation(); toggleEditor(); };
            
            function setIcon(t, id) { 
                currentIcon = t; 
                document.querySelectorAll('.icon-btn').forEach(b => b.classList.remove('active'));
                document.getElementById(id).classList.add('active');
            }

            function init() {
                player = { x: canvas.width/2 - 20, y: canvas.height/2 - 20, size: 40 };
                enemies = []; score = 0; scoreDisp.style.opacity = 1;
                targetPos = { x: player.x, y: player.y };
            }

            canvas.addEventListener('pointerdown', (e) => {
                if(editor.classList.contains('open')) return;
                if(gameState === 'TITLE') { init(); gameState = 'PLAYING'; }
                isMoving = true; move(e);
            });
            canvas.addEventListener('pointermove', (e) => { if(isMoving) move(e); });
            canvas.addEventListener('pointerup', () => isMoving = false);

            function move(e) {
                const rect = canvas.getBoundingClientRect();
                targetPos.x = (e.clientX - rect.left) - player.size/2;
                targetPos.y = (e.clientY - rect.top) - player.size/2;
            }

            function draw() {
                ctx.fillStyle = cpBG.value; ctx.fillRect(0,0,canvas.width,canvas.height);
                
                if(gameState === 'TITLE') {
                    ctx.fillStyle = cpP.value; ctx.font = "bold 40px sans-serif"; ctx.textAlign = "center";
                    ctx.fillText("SQUARE DASH", canvas.width/2, canvas.height/2);
                    ctx.font = "18px sans-serif"; ctx.fillStyle = "white";
                    ctx.fillText("TAP SCREEN TO START", canvas.width/2, canvas.height/2 + 50);
                } else {
                    player.x += (targetPos.x - player.x) * 0.2;
                    player.y += (targetPos.y - player.y) * 0.2;
                    
                    // Draw Player Icon
                    ctx.fillStyle = cpP.value;
                    ctx.fillRect(player.x, player.y, player.size, player.size);
                    
                    // Icon Cutouts
                    if(currentIcon !== 'square') {
                        ctx.fillStyle = cpBG.value;
                        ctx.beginPath();
                        if(currentIcon === 'cat') {
                           ctx.moveTo(player.x + 8, player.y + 16);
                           ctx.lineTo(player.x + 8, player.y + 4);
                           ctx.lineTo(player.x + 16, player.y + 12);
                           ctx.lineTo(player.x + 24, player.y + 12);
                           ctx.lineTo(player.x + 32, player.y + 4);
                           ctx.lineTo(player.x + 32, player.y + 16);
                           ctx.quadraticCurveTo(player.x+36, player.y+32, player.x+20, player.y+36);
                           ctx.quadraticCurveTo(player.x+4, player.y+32, player.x+8, player.y+16);
                        } else if(currentIcon === 'star') {
                            for(let i=0; i<5; i++) {
                                ctx.lineTo(player.x + 20 + Math.cos((18+i*72)/180*Math.PI)*16, player.y + 20 - Math.sin((18+i*72)/180*Math.PI)*16);
                                ctx.lineTo(player.x + 20 + Math.cos((54+i*72)/180*Math.PI)*8, player.y + 20 - Math.sin((54+i*72)/180*Math.PI)*8);
                            }
                        }
                        ctx.closePath(); ctx.fill();
                    }
                    
                    if(Math.random() < 0.05) {
                        const side = Math.random();
                        let ex = side < 0.5 ? -20 : canvas.width + 20, ey = Math.random() * canvas.height;
                        const angle = Math.atan2(player.y - ey, player.x - ex);
                        enemies.push({x:ex, y:ey, vx:Math.cos(angle)*4, vy:Math.sin(angle)*4});
                    }

                    ctx.fillStyle = cpE.value;
                    enemies.forEach((e, i) => {
                        e.x += e.vx; e.y += e.vy;
                        ctx.fillRect(e.x, e.y, 15, 15);
                        if(player.x < e.x+15 && player.x+player.size > e.x && player.y < e.y+15 && player.y+player.size > e.y) {
                            gameState = 'TITLE'; scoreDisp.style.opacity = 0;
                        }
                        if(e.x < -50 || e.x > canvas.width + 50) { enemies.splice(i,1); score++; scoreDisp.innerText = "Score: " + score; }
                    });
                }
                requestAnimationFrame(draw);
            }
            draw();
        </script>
    </body>
    </html>
  `;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />
      <View style={styles.container}>
        <WebView 
          originWhitelist={['*']}
          source={{ html: htmlContent }}
          style={styles.webview}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          scalesPageToFit={false}
          scrollEnabled={false}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#121212',
    // Adds padding for the camera notch on Android/iOS
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
    backgroundColor: '#121212',
  },
});