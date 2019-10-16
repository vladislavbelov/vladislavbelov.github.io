/*
 * Copyright 2019 Vladislav Belov
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this 
 * software and associated documentation files (the "Software"), to deal in the Software 
 * without restriction, including without limitation the rights to use, copy, modify, merge, 
 * publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons 
 * to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies 
 * or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, 
 * INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR 
 * PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE 
 * FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, 
 * ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 */

function Arguments2DWatcher(callback) {
    this.callback = callback;
    this.previousInputValue = undefined;
    this.args = [];
    let input = document.getElementById('arguments-2d');
    let self = this;
    input.addEventListener('input', function() { self.onInputChange(); });
    input.addEventListener('propertychange', function() { self.onInputChange(); });
    input.addEventListener('keyup', function() { self.onInputChange(); });
    this.parseArguments();
}

Arguments2DWatcher.prototype.getArguments = function() {
    return this.args;
};

Arguments2DWatcher.prototype.parseArguments = function(str) {
    let input = document.getElementById('arguments-2d');
    if (!input)
        return;
    let newArguments = [];
    for (let item of input.value.split(',')) {
        let value = parseFloat(item.trim());
        // We don't want to try analyze the wrong input.
        // So use last valid arguments.
        if (isNaN(value))
            return;
        if (value > 1.0)
            value = 1.0;
        if (value < 0.0)
            value = 0.0;
        newArguments.push(value);
    }
    this.args = newArguments;
};

Arguments2DWatcher.prototype.onInputChange = function() {
    let input = document.getElementById('arguments-2d');
    if (!input)
        return;
    let currentInputValue = input.value;
    if (currentInputValue == this.previousInputValue)
        return;
    this.previousInputValue = currentInputValue;
    this.parseArguments();
    this.callback();
};

function Interpolation2D(data) {
    let self = this;
    this.dpi = this.getWindowDPI();
    this.segmentSize = 100;
    this.padding = this.segmentSize / 2;
    this.data = data;
    this.argumentsWatcher = new Arguments2DWatcher(function() { self.layout(); });

    let div = document.createElement('div');
    div.classList = 'interpolation';
    let title = document.createElement('h3');
    title.innerHTML = this.data.name;
    div.appendChild(title);
    let tex = document.createElement('span');
    tex.classList = 'tex';
    var options = MathJax.getMetricsFor(tex);
    MathJax.tex2chtmlPromise(this.data.tex, options).then(function(node) {
        tex.appendChild(node);
        MathJax.startup.document.clear();
        MathJax.startup.document.updateDocument();
    }).catch(function (err) {
        console.log(err.message);
    });
    div.appendChild(tex);
    this.canvas = document.createElement('canvas');
    this.canvas.style['border'] = '1px solid #d0d0d0';
    div.appendChild(this.canvas);
    document.getElementById('interpolation-2d').appendChild(div);
    this.context = this.canvas.getContext('2d', { alpha: false });
    this.layout();
    window.addEventListener('resize', function() { self.onWindowResize(); });
}

Interpolation2D.prototype.getWindowDPI = function() {
    return window.devicePixelRatio || 1.0;
}

Interpolation2D.prototype.onWindowResize = function() {
    if (this.dpi == this.getWindowDPI())
        return;
    this.dpi = this.getWindowDPI();
    this.layout();
};

Interpolation2D.prototype.layout = function() {
    let args = this.argumentsWatcher.getArguments();
    let segmentCount = Math.max(1, args.length - 1);
    let canvasWidth = this.padding * 2 + this.segmentSize * segmentCount;
    let canvasHeight = this.padding * 2 + this.segmentSize;
    if (this.canvas.style.width != canvasWidth) {
        this.canvas.style.width = canvasWidth + 'px';
        this.canvas.width = canvasWidth * this.dpi;
    }
    if (this.canvas.style.height != canvasHeight) {
        this.canvas.style.height = canvasHeight + 'px';
        this.canvas.height = canvasHeight * this.dpi;
    }
    this.context.resetTransform();
    this.context.scale(this.dpi, this.dpi);
    this.draw();
};

Interpolation2D.prototype.draw = function() {
    let ctx = this.context;
    let width = this.canvas.width;
    let height = this.canvas.height;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);

    this.drawGrid();
    this.drawFunction();
};

Interpolation2D.prototype.drawGrid = function() {
    let ctx = this.context;
    let width = this.canvas.width / this.dpi;
    let height = this.canvas.height / this.dpi;
    let shift = 0.0;

    ctx.lineWidth = 1;
    ctx.strokeStyle = '#d0d0d0';
    ctx.setLineDash([5, 3]);
    ctx.beginPath();
    for (let x = this.segmentSize / 4.0; x < width; x += this.segmentSize / 4.0) {
        ctx.moveTo(x + shift, 0 + shift);
        ctx.lineTo(x + shift, height + shift);
    }
    for (let y = height - this.segmentSize / 4.0; y > 0; y -= this.segmentSize / 4.0) {
        ctx.moveTo(0 + shift, y + shift);
        ctx.lineTo(width + shift, y + shift);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.strokeStyle = '#c0c0c0';
    ctx.beginPath();
    for (let x = this.padding + this.segmentSize; x < width; x += this.segmentSize) {
        ctx.moveTo(x + shift, 0 + shift);
        ctx.lineTo(x + shift, height + shift);
    }
    for (let y = height - this.padding - this.segmentSize; y > 0; y -= this.segmentSize) {
        ctx.moveTo(0 + shift, y + shift);
        ctx.lineTo(width + shift, y + shift);
    }
    ctx.stroke();

    ctx.lineWidth = 2;
    ctx.strokeStyle = '#000000';
    ctx.beginPath();
    ctx.moveTo(0, height - this.padding);
    ctx.lineTo(width, height - this.padding);
    ctx.moveTo(this.padding, 0);
    ctx.lineTo(this.padding, height);
    ctx.stroke();
    ctx.lineWidth = 1;

    const fontSize = 12;
    ctx.font = fontSize + 'px monospace';
    ctx.fillStyle = '#a0a0a0';
    ctx.strokeStyle = '#a0a0a0';
    for (let x = this.padding; x < width; x += this.segmentSize) {
        let value = (x - this.padding) / this.segmentSize;
        ctx.fillText(value.toFixed(0), x + shift + fontSize / 2.0, height - this.padding + fontSize + shift);
    }
    for (let y = height - this.padding - this.segmentSize; y > 0; y -= this.segmentSize) {
        let value = (height - y - this.padding) / this.segmentSize;
        ctx.fillText(
            value.toFixed(0),
            this.padding + shift + fontSize / 2.0,
            y + fontSize + shift);
    }
};

Interpolation2D.prototype.drawFunction = function() {
    let ctx = this.context;
    let width = this.canvas.width / this.dpi;
    let height = this.canvas.height / this.dpi;
    let shift = 0.0;

    let args = this.argumentsWatcher.getArguments();
    if (args.length == 0) {
        return;
    }

    let points = [];
    for (let canvasX = this.padding; canvasX < width - this.padding; ++canvasX) {
        let realX = (canvasX - this.padding) / this.segmentSize;
        let x = realX % 1.0;
        let index = realX - x;
        if (index < 0) {
            continue;
        }
        if (index >= args.length - 1) {
            break;
        }
        let y = this.data.function(args, index, x);
        points.push({ 'x': realX, 'y': y });
    }

    if (points.length == 0) {
        return;
    }

    ctx.lineWidth = 2;
    ctx.strokeStyle = '#f07050';
    ctx.beginPath();
    ctx.moveTo(
        points[0].x * this.segmentSize + this.padding,
        height - points[0].y * this.segmentSize - this.padding);
    for (let i = 1; i < points.length; ++i) {
        ctx.lineTo(
            points[i].x * this.segmentSize + this.padding,
            height - points[i].y * this.segmentSize - this.padding);
    }
    ctx.stroke();
    ctx.lineWidth = 1;
};

Interpolation2D.prototype.random = function(min, max) {
    return Math.floor(min + Math.random() * (max + 1 - min));
}

function NearestInterpolation(y0, y1, x) {
    return x > 0.5 ? y1 : y0;
}

function LinearInterpolation(y0, y1, x) {
    return y0 * (1.0 - x) + y1 * x;
}

function CosineInterpolation(y0, y1, x) {
    return LinearInterpolation(y0, y1, -Math.cos(Math.PI * x) / 2.0 + 0.5);
}

window.onload = function() {
    MathJax.texReset();
    new Interpolation2D({
        'name': 'Nearest',
        'tex': '\\begin{equation*}\\begin{cases}y_0, x \\in [0, 0.5)\\\\ y_1, x \\in [0.5, 1.0]\\end{cases}\\end{equation*}',
        'function': function(values, index, x) {
            return NearestInterpolation(values[index], values[index + 1], x);
        }
    });
    new Interpolation2D({
        'name': 'Linear',
        'tex': 'y0 \\cdot (1 - x) + y1 \\cdot x',
        'function': function(values, index, x) {
            return LinearInterpolation(values[index], values[index + 1], x);
        }
    });
    new Interpolation2D({
        'name': 'Cosine',
        'tex': 'Linear\(y0, y1, -\\frac{-\\pi \\cdot x}{2} + 0.5\)',
        'function': function(values, index, x) {
            return CosineInterpolation(values[index], values[index + 1], x);
        }
    });
};
