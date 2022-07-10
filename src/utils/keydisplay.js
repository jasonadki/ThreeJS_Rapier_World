"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KeyDisplay = exports.DIRECTIONS = exports.SHIFT = exports.D = exports.S = exports.A = exports.W = void 0;
exports.W = 'w';
exports.A = 'a';
exports.S = 's';
exports.D = 'd';
exports.SHIFT = 'shift';
exports.DIRECTIONS = [exports.W, exports.A, exports.S, exports.D];
var KeyDisplay = /** @class */ (function () {
    function KeyDisplay() {
        this.map = new Map();
        var w = document.createElement("div");
        var a = document.createElement("div");
        var s = document.createElement("div");
        var d = document.createElement("div");
        var shift = document.createElement("div");
        this.map.set(exports.W, w);
        this.map.set(exports.A, a);
        this.map.set(exports.S, s);
        this.map.set(exports.D, d);
        this.map.set(exports.SHIFT, shift);
        this.map.forEach(function (v, k) {
            v.style.color = 'blue';
            v.style.fontSize = '50px';
            v.style.fontWeight = '800';
            v.style.position = 'absolute';
            v.textContent = k;
        });
        this.updatePosition();
        this.map.forEach(function (v, _) {
            document.body.append(v);
        });
    }
    KeyDisplay.prototype.updatePosition = function () {
        this.map.get(exports.W).style.top = "".concat(window.innerHeight - 150, "px");
        this.map.get(exports.A).style.top = "".concat(window.innerHeight - 100, "px");
        this.map.get(exports.S).style.top = "".concat(window.innerHeight - 100, "px");
        this.map.get(exports.D).style.top = "".concat(window.innerHeight - 100, "px");
        this.map.get(exports.SHIFT).style.top = "".concat(window.innerHeight - 100, "px");
        this.map.get(exports.W).style.left = "".concat(300, "px");
        this.map.get(exports.A).style.left = "".concat(200, "px");
        this.map.get(exports.S).style.left = "".concat(300, "px");
        this.map.get(exports.D).style.left = "".concat(400, "px");
        this.map.get(exports.SHIFT).style.left = "".concat(50, "px");
    };
    KeyDisplay.prototype.down = function (key) {
        if (this.map.get(key.toLowerCase())) {
            this.map.get(key.toLowerCase()).style.color = 'red';
        }
    };
    KeyDisplay.prototype.up = function (key) {
        if (this.map.get(key.toLowerCase())) {
            this.map.get(key.toLowerCase()).style.color = 'blue';
        }
    };
    return KeyDisplay;
}());
exports.KeyDisplay = KeyDisplay;