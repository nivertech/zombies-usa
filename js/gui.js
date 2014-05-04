function GUI(elem) {
    this.mapHmax = 900;
    this.mapWmax = 1500;
    this.mapH = this.mapHmax;
    this.mapW = this.mapWmax;
    this.elem = elem;

    this.W;
    this.H;
    this.map;
    this.mapcopy;
    this.overlay;
    this.uielem = [];
    this.showcontrols = true;
}

GUI.prototype = {
    bind: function(fnMethod){
        var obj = this;
             
        return (function(){
            return (fnMethod.apply(obj, arguments));
        });
    },

    init: function(sim){
        this.sim = sim;
        this.canvas = document.getElementById(this.elem);
        this.ctx = this.canvas.getContext('2d');
        this.ctx.mouse = { x: 0, y: 0, clicked: false, down: false };
        this.redraw = true;

        this.offscreen = document.createElement('canvas');
        this.offscreen.id = "offscreen_canvas";
        this.offscreen.width = this.mapWmax;
        this.offscreen.height = this.mapHmax;
        this.offscreen.style.zIndex = 8;
        this.offscreen.style.display = 'none';
        document.body.appendChild(this.offscreen);

        this.ctxoff = this.offscreen.getContext('2d');

        // add even listeners for the mouse
        this.canvas.addEventListener("mousemove", this.bind(
            function(e) {
                this.ctx.mouse.x = e.offsetX;
                this.ctx.mouse.y = e.offsetY;
                this.ctx.mouse.clicked = (e.which == 1 && !this.ctx.mouse.down);
                this.ctx.mouse.down = (e.which == 1);
            }
        ));

        this.canvas.addEventListener("mousedown", this.bind(
            function(e) {
                this.ctx.mouse.clicked = !this.ctx.mouse.down;
                this.ctx.mouse.down = true;
            }
        ));

        this.canvas.addEventListener("mouseup", this.bind(
            function(e) {
                this.ctx.mouse.down = false;
                this.ctx.mouse.clicked = false;
            }
        ));

        window.onresize = this.bind(
            function(event) {this.set_canvas_size(); }
        );

        this.set_canvas_size();

        this.check_control = new CheckBox("Show controls", 20, 20);
        this.check_control.checked = this.showcontrols;
        this.check_control.handler = this.bind(function() {
            this.showcontrols = !this.showcontrols;
             
            for (var i=0; i<this.uielem.length; i++)
                this.uielem[i].hidden = !this.showcontrols;
        });

        var left = 20;
        var width = 150;
        var button_width = 100;
        var button_height = 30;
        var alertButton = new Button("Reset", left+width/2 - button_width/2 , 150, button_width, button_height);
        var slidera = new Slider("Alpha", left+50, 90, 90, 0, 3);
        var sliderm = new Slider("Mu", left+50, 115, 90, 1, 500);
        alertButton.handler = this.bind(function (){ });
        slidera.handler = this.bind(function (val){ this.sim.alpha = val; });
        sliderm.handler = this.bind(function (val){ this.sim.mu =  1./(val*this.sim.alpha); });
    
        slidera.value = this.sim.alpha;
        sliderm.value = 75;

        this.uielem.push(alertButton);
        this.uielem.push(slidera);
        this.uielem.push(sliderm);

        for (var i=0; i<this.uielem.length; i++)
            this.uielem[i].hidden = !this.showcontrols;

        this.map = new Image();
        this.map.onload = (this.bind(
            function() {
                this.ctxoff.drawImage(this.map, 0, 0 );
                this.mapcopy = this.ctxoff.getImageData(0, 0, this.map.width, this.map.height);
                this.overlay = this.ctxoff.getImageData(0, 0, this.map.width, this.map.height);
                this.draw_map();
                this.draw();
            }));
        this.map.src = 'dat/js-usa.png';
    },

    set_canvas_size: function(){
        this.W = window.innerWidth;
        this.H = window.innerHeight;
        this.canvas.width  = this.W;
        this.canvas.height = this.H;
        this.mapH = Math.floor(Math.min(this.H, this.mapHmax, 0.6*this.W));
        this.mapW = Math.floor(Math.min(this.W, this.mapWmax, this.mapH/0.6));
    },

    clear: function() {
        this.ctx.fillStyle = 'rgba(0,0,0,1)';
        this.ctx.clearRect(0, 0, this.W, this.H);
        this.ctx.fillRect(0, 0, this.W, this.H);
    },

    draw_overlay: function(){
        this.ctxoff.putImageData(this.overlay, 0, 0);
        this.ctx.drawImage(this.offscreen, 0, 0, this.mapWmax, this.mapHmax,
                (this.W-this.mapW)/2, (this.H-this.mapH)/2, this.mapW, this.mapH);
    },

    draw_map: function() {
        this.ctx.drawImage(this.map, 0, 0, this.mapWmax, this.mapHmax,
                (this.W-this.mapW)/2, (this.H-this.mapH)/2, this.mapW, this.mapH);
    },

    draw_timing: function(sim){
        if (sim){
            this.ctx.font = '24px sans-serif';
            this.ctx.fillStyle='rgba(255,255,255,0.8)';
            this.ctx.fillText(toFixed(sim.time*2,4) + " hours", 20, 50);
            //this.ctx.fillText(toFixed(sim.fps,4), 20, 80);
        }
    },

    draw: function() {
        if (this.redraw){
            if (this.ctx.mouse.down){
                var x = this.ctx.mouse.x;
                var y = this.ctx.mouse.y;
                x = Math.floor((x - (this.W-this.mapW)/2)*this.mapWmax/this.mapW);
                y = Math.floor(this.mapHmax - (y - (this.H-this.mapH)/2)*this.mapHmax/this.mapH);
                if (x > 0 && x < this.mapWmax && y > 0 && y < this.mapHmax)
                    this.clicked = {'x':x, 'y':y};
            }
            else
                this.clicked = null;

            this.clear();
            this.update_ui();

            this.draw_map();
            this.draw_overlay();
            this.draw_ui();
            this.draw_timing(this.sim);
            registerAnimationRequest(this.bind(function(){this.draw()}));
        }
    },
    
    update_ui: function(){
        this.check_control.update(this.ctx);
        for (var i=0; i<this.uielem.length; i++)
            this.uielem[i].update(this.ctx);
    },
    
    draw_ui: function(){
        this.check_control.draw(this.ctx);
        for (var i=0; i<this.uielem.length; i++)
            this.uielem[i].draw(this.ctx);
    },

    modify_site: function(site){
        var i = site.x;
        var j = this.mapHmax-site.y;
        var ind = 4*(i+j*this.map.width);
        this.overlay.data[ind+0] = Math.floor(this.mapcopy.data[ind]*(site.N-site.R)/site.N);
        this.overlay.data[ind+1] = 0;
        this.overlay.data[ind+2] = 0;
        this.overlay.data[ind+3] = Math.floor(255*site.Z/site.N*100);
    },
}

// http://paulirish.com/2011/requestanimationframe-for-smart-animating/
window.registerAnimationRequest = window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||  window.oRequestAnimationFrame ||
    window.msRequestAnimationFrame || function(callback) { window.setTimeout( callback, 32); };

