const fs = require('fs');
const path = require('path');

// Icon sizes required for PWA
const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Read the SVG files
const iconFullSvg = fs.readFileSync('icon-full.svg', 'utf8');
const iconSimpleSvg = fs.readFileSync('icon-simple.svg', 'utf8');

// Create HTML file that will help generate icons using canvas
const htmlTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PWA Icon Generator</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            padding: 20px;
            background: #f5f5f5;
        }
        .generator {
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        .icon-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
            gap: 15px;
            margin-top: 20px;
        }
        .icon-item {
            text-align: center;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 4px;
            background: #f9f9f9;
        }
        .icon-preview {
            margin-bottom: 10px;
        }
        button {
            background: #2d5016;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            margin: 5px;
        }
        button:hover {
            background: #3d6020;
        }
        .status {
            margin-top: 10px;
            padding: 10px;
            border-radius: 4px;
            background: #e8f5e8;
            color: #2d5016;
        }
        canvas {
            border: 1px solid #ddd;
        }
        .download-all {
            background: #1976d2;
            font-size: 16px;
            padding: 12px 24px;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="generator">
        <h1>PWA Icon Generator</h1>
        <p>Generate PNG icons from SVG for PWA manifest</p>
        
        <button class="download-all" onclick="generateAllIcons()">Generate All PWA Icons</button>
        
        <div id="status" class="status" style="display: none;"></div>
        
        <div class="icon-grid" id="iconGrid"></div>
    </div>

    <script>
        const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512];
        
        // SVG content
        const iconFullSvg = \`${iconFullSvg}\`;
        const iconSimpleSvg = \`${iconSimpleSvg}\`;
        
        function showStatus(message, isError = false) {
            const status = document.getElementById('status');
            status.textContent = message;
            status.style.display = 'block';
            status.style.background = isError ? '#ffe8e8' : '#e8f5e8';
            status.style.color = isError ? '#d32f2f' : '#2d5016';
        }
        
        function createCanvas(size) {
            const canvas = document.createElement('canvas');
            canvas.width = size;
            canvas.height = size;
            return canvas;
        }
        
        function svgToCanvas(svgString, size) {
            return new Promise((resolve, reject) => {
                const canvas = createCanvas(size);
                const ctx = canvas.getContext('2d');
                
                // Create blob from SVG
                const blob = new Blob([svgString], { type: 'image/svg+xml' });
                const url = URL.createObjectURL(blob);
                
                const img = new Image();
                img.onload = () => {
                    // Fill background
                    ctx.fillStyle = '#2d5016';
                    ctx.fillRect(0, 0, size, size);
                    
                    // Draw SVG
                    ctx.drawImage(img, 0, 0, size, size);
                    URL.revokeObjectURL(url);
                    resolve(canvas);
                };
                img.onerror = reject;
                img.src = url;
            });
        }
        
        function downloadCanvas(canvas, filename) {
            const link = document.createElement('a');
            link.download = filename;
            link.href = canvas.toDataURL('image/png');
            link.click();
        }
        
        async function generateIcon(size) {
            try {
                // Use detailed SVG for larger icons, simple for smaller ones
                const svgToUse = size >= 128 ? iconFullSvg : iconSimpleSvg;
                const canvas = await svgToCanvas(svgToUse, size);
                
                // Add to grid
                const iconGrid = document.getElementById('iconGrid');
                const iconItem = document.createElement('div');
                iconItem.className = 'icon-item';
                iconItem.innerHTML = \`
                    <div class="icon-preview">
                        <canvas width="\${Math.min(size, 64)}" height="\${Math.min(size, 64)}"></canvas>
                    </div>
                    <div>\${size}x\${size}</div>
                    <button onclick="downloadIcon(\${size})">Download</button>
                \`;
                
                // Draw preview (scaled down)
                const previewCanvas = iconItem.querySelector('canvas');
                const previewCtx = previewCanvas.getContext('2d');
                const previewSize = Math.min(size, 64);
                previewCtx.drawImage(canvas, 0, 0, previewSize, previewSize);
                
                iconGrid.appendChild(iconItem);
                
                // Store canvas for download
                window[\`canvas_\${size}\`] = canvas;
                
                return canvas;
            } catch (error) {
                console.error(\`Error generating \${size}x\${size} icon:\`, error);
                throw error;
            }
        }
        
        function downloadIcon(size) {
            const canvas = window[\`canvas_\${size}\`];
            if (canvas) {
                downloadCanvas(canvas, \`icon-\${size}x\${size}.png\`);
            }
        }
        
        async function generateAllIcons() {
            showStatus('Generating icons...');
            const iconGrid = document.getElementById('iconGrid');
            iconGrid.innerHTML = '';
            
            try {
                for (let i = 0; i < iconSizes.length; i++) {
                    const size = iconSizes[i];
                    showStatus(\`Generating \${size}x\${size} icon... (\${i + 1}/\${iconSizes.length})\`);
                    await generateIcon(size);
                    
                    // Small delay to prevent UI blocking
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
                
                showStatus('All icons generated successfully! Click individual download buttons or use "Download All" below.');
                
                // Add download all button
                const downloadAllBtn = document.createElement('button');
                downloadAllBtn.textContent = 'Download All Icons as ZIP';
                downloadAllBtn.className = 'download-all';
                downloadAllBtn.onclick = downloadAllAsZip;
                iconGrid.appendChild(downloadAllBtn);
                
            } catch (error) {
                showStatus('Error generating icons: ' + error.message, true);
            }
        }
        
        async function downloadAllAsZip() {
            // For now, download individually
            showStatus('Downloading all icons individually...');
            for (const size of iconSizes) {
                downloadIcon(size);
                await new Promise(resolve => setTimeout(resolve, 200));
            }
            showStatus('All icons downloaded!');
        }
        
        // Auto-generate on load
        window.onload = () => {
            setTimeout(generateAllIcons, 500);
        };
    </script>
</body>
</html>
`;

// Write the HTML file
fs.writeFileSync('icon-generator-auto.html', htmlTemplate);

console.log('Icon generator created! Open icon-generator-auto.html in a browser to generate icons.');
console.log('Required icons for PWA:');
iconSizes.forEach(size => {
    console.log(`- icon-${size}x${size}.png`);
});
