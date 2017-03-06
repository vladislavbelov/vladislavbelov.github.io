/*
 * Copyright 2017 Vladislav Belov
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

function GeoEngine() {
    this.version = "0.5.1";
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas = null;
    this.context = null;
}

window.onload = function() {
    var engine = new GeoEngine();
    engine.run();
}

GeoEngine.prototype.run = function() {
    var self = this;
    var elem = document.createElement('CANVAS');
    elem.id = 'geo-canvas';
    elem.width = this.width;
    elem.height = this.height;
    elem.innerHTML = 'Your browser doesn\'t support an interactive drawing.';
    elem.style = 'position: absolute; border: 0; left: 0; top: 0;';
    document.getElementsByTagName('BODY')[0].appendChild(elem);
    this.canvas = elem;
    this.context = elem.getContext('2d');
    this.context.clearRect(0, 0, this.width, this.height);
    this.context.font = '12px monospace';
    this.landColor = '#c0d0a0';
    this.waterColor = '#a0bac0';
    this.correctCityColor = '#30c010';
    this.incorrectCityColor = '#ff5030';
    this.previousFrame = Date.now();
    
    document.getElementsByTagName("HTML")[0].addEventListener("wheel", function(event) {
        return self.onwheel(event);
    });
    window.onresize = function(event) {
        return self.onresize(event);
    };
    window.onmousedown = function(event) {
        return self.onmousedown(event);
    };
    window.onmouseup = function(event) {
        return self.onmouseup(event);
    };
    window.onmousemove = function(event) {
        return self.onmousemove(event);
    };
    window.onmouseout = function(event) {
        return self.onmouseout(event);
    };
    window.onclick = function(event) {
        return self.onclick(event);
    };
    window.ondblclick = function(event) {
        return self.ondblclick(event);
    };
    
    // Ignore some events
    window.ondragstart = function(event) { return false; };
    window.onselectstart = function(event) { return false; };
    
    // Prepare data
    for (var i = 0; i < cities.length; ++i)
    {
        var position = this.toPlane(cities[i]);
        cities[i]['x'] = position['x'];
        cities[i]['y'] = position['y'];
    }
    for (var i = 0; i < lands.length; ++i)
    {
        for (var j = 0; j < lands[i].length; ++j)
        {
            lands[i][j] = {'lon': lands[i][j][0], 'lat': lands[i][j][1]};
            var position = this.toPlane(lands[i][j]);
            lands[i][j]['x'] = position['x'];
            lands[i][j]['y'] = position['y'];
        }
    }
    for (var i = 0; i < rivers.length; ++i)
    {
        for (var j = 0; j < rivers[i].length; ++j)
        {
            rivers[i][j] = {'lon': rivers[i][j][0], 'lat': rivers[i][j][1]};
            var position = this.toPlane(rivers[i][j]);
            rivers[i][j]['x'] = position['x'];
            rivers[i][j]['y'] = position['y'];
        }
    }
    for (var i = 0; i < waters.length; ++i)
    {
        for (var j = 0; j < waters[i].length; ++j)
        {
            waters[i][j] = {'lon': waters[i][j][0], 'lat': waters[i][j][1]};
            var position = this.toPlane(waters[i][j]);
            waters[i][j]['x'] = position['x'];
            waters[i][j]['y'] = position['y'];
        }
    }
    
    this.answers = new Array(cities.length);
    this.descriptions = ['Бывает...', 'Вы Мастер по городам!', 'Вы Эксперт по городам.', 'Вы Ученик по городам.', 'Вы Новичок по городам.', 'Вы спали на уроках географии.', 'Не ноль - уже хорошо.'];
    
    this.reset();
    this.onframe();
    
    console.log('GeoEngine v' + this.version + ' successfuly loaded.');
}

GeoEngine.prototype.reset = function() {
    this.answers.fill(0);
    this.correctAnswers = 0;
    this.finished = false;
    this.help = false;
    
    cities = this.shuffle(cities);
    
    this.scale = 1.0;
    this.shiftX = 0;
    this.shiftY = 0;
    this.mousePressed = false;
    this.mouseMoved = false;
    this.mousePosition = {'x': 0, 'y': 0};
    this.mouseDownPosition = {'x': 0, 'y': 0};
    this.mousePoint = {'x': 0, 'y': 0};
    this.selected = false;
    this.selectedPoint = {'x': 0.0, 'y': 0.0};
    this.selectedCity = 0;
    this.selectedPreviousCity = -1;
    this.selectedAll = 0;
    this.selectedCorrect = false;
    this.recenter = true;
}

GeoEngine.prototype.onresize = function(event) {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
}

GeoEngine.prototype.onwheel = function(event) {
    var newScale = this.scale;
    if (event.deltaY < 0) {
        newScale *= 1.1;
    } else if (event.deltaY > 0 && newScale > 1.0) {
        newScale /= 1.1;
    }
    var focusX = (this.width / 2.0 - this.shiftX) / this.scale;
    var focusY = (this.height - (this.height / 2.0 - this.shiftY)) / this.scale;
    this.shiftX += focusX * (this.scale - newScale);
    this.shiftY -= focusY * (this.scale - newScale);
    this.scale = newScale;
}

GeoEngine.prototype.onmousedown = function(event) {
    if (event.button == 0) {
        this.mouseDownPosition['x'] = event.clientX;
        this.mouseDownPosition['y'] = event.clientY;
        this.mousePosition['x'] = event.clientX;
        this.mousePosition['y'] = event.clientY;
        this.mousePressed = true;
        this.mouseMoved = false;
    }
    return false;
}

GeoEngine.prototype.onmouseup = function(event) {
    var equalPoints = this.mouseDownPosition['x'] == event.clientX && this.mouseDownPosition['y'] == event.clientY;
    if (event.button == 0 && !this.mouseMoved && equalPoints) {
        if (!this.finished) {
            this.selected = true;
        } else {
            if (this.height - event.clientY <= 32 + 32) {
                this.reset();
            }
            this.help = true;
        }
        this.selectedPoint['x'] = (event.clientX - this.shiftX) / this.scale;
        this.selectedPoint['y'] = (this.height - (event.clientY - this.shiftY)) / this.scale;
    }
    this.mousePressed = false;
    this.mouseMoved = false;
}

GeoEngine.prototype.onclick = function(event) {
    return false;
}

GeoEngine.prototype.ondblclick = function(event) {
    this.recenter = true;
    return false;
}

GeoEngine.prototype.onmousemove = function(event) {
    if (this.mousePressed) {
        var movementX = event.clientX - this.mousePosition['x'];
        var movementY = event.clientY - this.mousePosition['y'];
        this.shiftX += movementX;
        this.shiftY += movementY;
        this.mousePosition['x'] = event.clientX;
        this.mousePosition['y'] = event.clientY;
        if (movementX != 0 && movementY != 0) {
            this.mouseMoved = true;
        }
    }
    this.mousePoint['x'] = (event.clientX - this.shiftX) / this.scale;
    this.mousePoint['y'] = (this.height - (event.clientY - this.shiftY)) / this.scale;
    return false;
}

GeoEngine.prototype.onmouseout = function(event) {
    this.mousePressed = false;
}

GeoEngine.prototype.random = function(min, max) {
    return Math.floor(min + Math.random() * (max + 1 - min));
}

GeoEngine.prototype.toPlane = function(coords) {
    var R = 250.0;
    var lambda = coords['lon'] / 180.0 * Math.PI;
    var phi = coords['lat'] / 180.0 * Math.PI;
    return {'x': R * lambda, 'y': R * Math.log(Math.tan(Math.PI / 4.0 + phi / 2.0))};
}

GeoEngine.prototype.toSphere = function(coords) {
    // TODO: implement
}

GeoEngine.prototype.render = function() {
    this.context.clearRect(0, 0, this.width, this.height);
    var minX = 10000.0, maxX = -10000.0, minY = 10000.0, maxY = -10000.0;
    
    // Draw lands
    this.context.beginPath();
    this.context.strokeStyle = this.landColor;
    this.context.fillStyle = this.landColor;
    for (var i = 0; i < lands.length; ++i)
    {
        for (var j = 0; j < lands[i].length; ++j)
        {
            var x = this.scale * lands[i][j]['x'];
            var y = this.scale * lands[i][j]['y'];
            y = this.height - y;
            x += this.shiftX;
            y += this.shiftY;
            if (j == 0)
                this.context.moveTo(x, y);
            else
                this.context.lineTo(x, y);
            minX = Math.min(minX, x); maxX = Math.max(maxX, x);
            minY = Math.min(minY, y); maxY = Math.max(maxY, y);
        }
    }
    this.context.stroke();
    this.context.fill();
    this.context.closePath();
    
    // Draw rivers
    this.context.strokeStyle = this.waterColor;
    this.context.fillStyle = this.waterColor;
    this.context.beginPath();
    for (var i = 0; i < rivers.length; ++i)
    {
        
        for (var j = 0; j < rivers[i].length; ++j)
        {
            var x = this.scale * rivers[i][j]['x'];
            var y = this.scale * rivers[i][j]['y'];
            y = this.height - y;
            x += this.shiftX;
            y += this.shiftY;
            if (j == 0)
                this.context.moveTo(x, y);
            else
                this.context.lineTo(x, y);
            minX = Math.min(minX, x); maxX = Math.max(maxX, x);
            minY = Math.min(minY, y); maxY = Math.max(maxY, y);
        }
    }
    this.context.stroke();
    this.context.closePath();
    
    // Draw waters
    this.context.beginPath();
    for (var i = 0; i < waters.length; ++i)
    {
        for (var j = 0; j < waters[i].length; ++j)
        {
            var x = this.scale * waters[i][j]['x'];
            var y = this.scale * waters[i][j]['y'];
            y = this.height - y;
            x += this.shiftX;
            y += this.shiftY;
            if (j == 0)
                this.context.moveTo(x, y);
            else
                this.context.lineTo(x, y);
            minX = Math.min(minX, x); maxX = Math.max(maxX, x);
            minY = Math.min(minY, y); maxY = Math.max(maxY, y);
        }
    }
    this.context.fill();
    this.context.closePath();
    
    // Draw cities
    var r = 2.0;
    this.context.font = '16px monospace';
    for (var i = 0; i < cities.length; ++i)
    {
        var x = this.scale * cities[i]['x'];
        var y = this.scale * cities[i]['y'];
        y = this.height - y;
        x += this.shiftX;
        y += this.shiftY;
        
        if (!this.finished) {
            var dx = cities[i]['x'] - this.mousePoint['x'], dy = cities[i]['y'] - this.mousePoint['y'];
            var distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < 3.0) {
                this.context.strokeStyle = '#d0a010';
                this.context.fillStyle = '#d0a010';
            } else {
                this.context.strokeStyle = '#707070';
                this.context.fillStyle = '#707070';
            }
        } else {
            if (this.answers[i] == 1) {
                this.context.strokeStyle = this.correctCityColor;
                this.context.fillStyle = this.correctCityColor;
            } else if (this.answers[i] == 2) {
                this.context.strokeStyle = this.incorrectCityColor;
                this.context.fillStyle = this.incorrectCityColor;
            } else {
                this.context.strokeStyle = '#707070';
                this.context.fillStyle = '#707070';
            }
        }
        this.context.beginPath();
        this.context.arc(x, y, r, 0, 2.0 * Math.PI, false);
        this.context.closePath();
        this.context.fill();
        this.context.stroke();
        
        var dx = cities[i]['x'] - this.selectedPoint['x'], dy = cities[i]['y'] - this.selectedPoint['y'];
        var distance = Math.sqrt(dx * dx + dy * dy);
        if (this.finished && this.help && distance < 3.0) {
            this.context.fillText(cities[i]['name'], x + r * 3.0, y + 4);
        }
    }
    
    // Draw previous selection
    if (!this.finished && this.selectedPreviousCity != -1) {
        var city = cities[this.selectedPreviousCity];
        var x = this.scale * city['x'];
        var y = this.scale * city['y'];
        y = this.height - y;
        x += this.shiftX;
        y += this.shiftY;
        
        if (this.selectedCorrect) {
            this.context.strokeStyle = this.correctCityColor;
            this.context.fillStyle = this.correctCityColor;
        } else {
            this.context.strokeStyle = this.incorrectCityColor;
            this.context.fillStyle = this.incorrectCityColor;
        }
        this.context.beginPath();
        this.context.arc(x, y, r, 0, 2.0 * Math.PI, false);
        this.context.closePath();
        this.context.fill();
        this.context.stroke();
        
        this.context.beginPath();
        this.context.arc(x, y, r * 4.0, 0, 2.0 * Math.PI, false);
        this.context.closePath();
        this.context.stroke();
        this.context.beginPath();
        this.context.arc(x, y, r * 8.0, 0, 2.0 * Math.PI, false);
        this.context.closePath();
        this.context.stroke();
        
        this.context.font = '16px monospace';
        this.context.fillText(cities[this.selectedPreviousCity]['name'], x + r * 9.0, y + 4);
    }
    
    // Draw interface
    if (!this.finished && this.selected && this.selectedCity != -1) {
        var city = cities[this.selectedCity];
        var from = {'x': this.shiftX + this.scale * city['x'], 'y': this.shiftY + (this.height - this.scale * city['y'])};
        var to = {'x': this.shiftX + this.scale * this.selectedPoint['x'], 'y': this.shiftY + this.height  - this.scale * this.selectedPoint['y']};
        
        var dx = city['x'] - this.selectedPoint['x'], dy = city['y'] - this.selectedPoint['y'];
        var distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 3.0) {
            this.selectedCorrect = true;
            this.answers[this.selectedAll] = 1;
            ++this.correctAnswers;
        } else {
            this.selectedCorrect = false;
            this.answers[this.selectedAll] = 2;
        }
        
        this.selectedPreviousCity = this.selectedCity;
        ++this.selectedCity;
        ++this.selectedAll;
        this.selected = false;
        if (this.selectedAll == cities.length) {
            this.finished = true;
        }
    }
    
    if (!this.finished && this.selectedCity != -1) {
        this.context.font = '32px monospace';
        var text = cities[this.selectedCity]['name'] + ' (' + this.selectedAll + '/' + cities.length + ')';
        var size = this.context.measureText(text);
        
        this.context.fillStyle = '#00a0ff';
        this.context.fillRect((this.width - size.width - 32) / 2, 64, size.width + 32, 48);
        
        this.context.fillStyle = '#ffffff';
        this.context.fillText(text, (this.width - size.width) / 2, 64 + 32);
        
        this.context.font = '16px monospace';
        var text_task = 'Найдите город и нажмите на него.';
        var size_task = this.context.measureText(text_task);
        this.context.fillStyle = '#00a0ff';
        this.context.fillText(text_task, (this.width - size_task.width) / 2, 64 - 8);
    }
    
    if (this.finished) {
        this.context.font = '32px monospace';
        var text = 'Ваш результат ' + this.correctAnswers + ' из ' + cities.length;
        var size = this.context.measureText(text);
        
        var text_description;
        if (this.correctAnswers == cities.length)
            text_description = this.descriptions[1];
        else if (this.correctAnswers * 4 >= cities.length * 3)
            text_description = this.descriptions[2];
        else if (this.correctAnswers * 2 >= cities.length)
            text_description = this.descriptions[3];
        else if (this.correctAnswers * 10 >= cities.length)
            text_description = this.descriptions[4];
        else if (this.correctAnswers >= 10)
            text_description = this.descriptions[6];
        else if (this.correctAnswers > 0)
            text_description = this.descriptions[5];
        else
            text_description = this.descriptions[0];
        var size_description = this.context.measureText(text_description);
        
        this.context.fillStyle = '#00a0ff';
        this.context.fillRect((this.width - size.width - 32) / 2, 64, size.width + 32, 48);
        
        this.context.fillText(text_description, (this.width - size_description.width) / 2, 64 + 64 + 16);
        
        this.context.fillStyle = '#ffffff';
        this.context.fillText(text, (this.width - size.width) / 2, 64 + 32);
        
        this.context.font = '24px monospace';
        var text_reset = 'Попробовать снова';
        var size_reset = this.context.measureText(text_reset);
        this.context.fillStyle = '#00a0ff';
        this.context.fillText(text_reset, (this.width - size_reset.width) / 2, this.height - 32 - 16);
    } else {
        // Draw answers
        var px = 0, py = 0;
        for (var i = 0; i < this.answers.length; ++i)
        {
            if (this.answers[i] == 0) {
                this.context.strokeStyle = '#909090';
                this.context.fillStyle = '#909090';
            } else if (this.answers[i] == 1) {
                this.context.strokeStyle = '#50c050';
                this.context.fillStyle = '#50c050';
            } else if (this.answers[i] == 2) {
                this.context.strokeStyle = '#c05050';
                this.context.fillStyle = '#c05050';
            }
            this.context.beginPath();
            this.context.arc((this.width - 248) / 2.0 + px, 64 + 48 + 16 + py, 2.0, 0, 2.0 * Math.PI, false);
            this.context.closePath();
            this.context.fill();
            this.context.stroke();
            
            px += 10;
            if ((i + 1) % 26 == 0) {
                px = 0;
                py += 10;
            }
        }
    }
    
    if (this.recenter) {
        var centerX = (minX + maxX) / 2.0, centerY = (minY + maxY) / 2.0;
        this.shiftX -= centerX - this.width / 2.0;
        this.shiftY -= centerY - this.height / 2.0;
        this.recenter = false;
    }
    
    this.context.fillStyle = '#000000';
    var currentFrame = Date.now();
    this.context.font = '12px monospace';
    this.context.fillText('fdt: ' + (currentFrame - this.previousFrame) + 'ms', 10, 10 + 12 + 20);
    this.previousFrame = currentFrame;
}

GeoEngine.prototype.onframe = function() {
    var self = this;
    self.render();
    window.requestAnimationFrame(function() { self.onframe(); }, self.canvas);
}

GeoEngine.prototype.shuffle = function(array) {
    for (var index = 0, randomIndex, temporaryValue; index < array.length; ++index) {
        randomIndex = Math.floor(Math.random() * (index + 1));
        temporaryValue = array[index];
        array[index] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }
    return array;
}