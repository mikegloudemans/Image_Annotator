// jQuery for Tabs
$(function() {
	$("#tabs").tabs();
});

// Initialization
window.addEventListener('load',initialize,false);

function initialize() {
	document.getElementById('I_local').addEventListener('change',I_reader,false);
}

// Objects-------------------------------------
function Cell(mx,my,dx,dy,annot) {
	this.mx = mx;	// Mother's X-Coordinate
	this.my = my;	// Mother's Y-Coordinate
	this.dx = dx;	// Daughter's X-Coordinate
	this.dy = dy;	// Daughter's Y-Coordinate
	this.annot = annot;	// Annotations
}

// Implementing HashTable Class in Javascript
function HashTable(obj) {
    this.length = 0;
    this.items = {};
    for (var p in obj) {
        if (obj.hasOwnProperty(p)) {
            this.items[p] = obj[p];
            this.length++;
        }
    }

    this.setItem = function(key, value) {
        var previous = undefined;
        if (this.hasItem(key)) {
            previous = this.items[key];
        }
        else {
            this.length++;
        }
        this.items[key] = value;
        return previous;
    }

    this.getItem = function(key) {
        return this.hasItem(key) ? this.items[key] : undefined;
    }

    this.hasItem = function(key) {
        return this.items.hasOwnProperty(key);
    }
   
    this.removeItem = function(key) {
        if (this.hasItem(key)) {
            previous = this.items[key];
            this.length--;
            delete this.items[key];
            return previous;
        }
        else {
            return undefined;
        }
    }

    this.keys = function() {
        var keys = [];
        for (var k in this.items) {
            if (this.hasItem(k)) {
                keys.push(k);
            }
        }
        return keys;
    }

    this.values = function() {
        var values = [];
        for (var k in this.items) {
            if (this.hasItem(k)) {
                values.push(this.items[k]);
            }
        }
        return values;
    }

    this.each = function(fn) {
        for (var k in this.items) {
            if (this.hasItem(k)) {
                fn(k, this.items[k]);
            }
        }
    }

    this.clear = function() {
        this.items = {}
        this.length = 0;
    }
}
// ---------------------------------------------
// Overall Global Variables
var cell_data = new HashTable(); // Cell ID -> Cell
var cell_ID = 1;

// --------------------------------------------
// Inputs 
// --------------------------------------------

// --------------------------------------------
// Phase One 
// --------------------------------------------

// Phase One Global Variables -------------------
var inMarkedMode = true; 

var P1_posX,P1_poxY;
var P1_cacheX,P1_cacheY;
var P1_clkTimerID = null;
var P1_clkTimerRunning = false;
var P1_inLinkedMode = false;

// P1 Canvas Dimensions
var canv_w = 760;
var canv_h = 560;

// Images Themselves
var main_img = 0;
var main_mark_img = 0;
var ref1_img = 0;
var ref2_img = 0;
var ref3_img = 0;

// --------------------------------------------------------------------------------------
// --------------------------------------------------------------------------------------
// CONTROLLER FUNCTIONALITY
// --------------------------------------------------------------------------------------
// --------------------------------------------------------------------------------------

// Global Variables ---------------------------
var INPUT_FILE;
var main_line;
var ref1_line;
var ref2_line;
var ref3_line;
var categories;

// --------------------------------------------
// Inputs -------------------------------------
// --------------------------------------------

function I_reader() {	
	// Disable All File Input Mechanisms
	document.getElementById('I_local').disabled = true;
	document.getElementById('I_remote').disabled = true;
	document.getElementById('I_remote_btn').disabled = true;

	// Read File (Local for now)
	var files = document.getElementById('I_local').files;
	if (!files.length) {
		alert('Please select a file');
		return;
	}
	
	var file = files[0];
	var reader = new FileReader();
	
	// Using onloadend, so must check the readyState
	 reader.onloadend = function(evt) {
      if (evt.target.readyState == FileReader.DONE) {
		INPUT_FILE = evt.target.result;
      }
    };
	
	var blob = file.slice(0,file.size);
	reader.readAsBinaryString(blob);
	parseYAML();
}

function parseYAML() {
	// Alert User
	alert('File Successfully Loaded!');
	
	// TODO: "File loading.." modal pop-up; dismiss when loaded
	
	// Parse YAML
	var YAMLfile = jsyaml.load(INPUT_FILE);	
	
	/*
	main_line = "168_dic_1.jpg";
	ref1_line = "168_dic_1.jpg,168_blue_1.jpg,168_green_1.jpg";
	ref2_line = "168_dic_1.jpg,168_green_1.jpg";
	ref3_line = "168_dic_1.jpg,168_blue_1.jpg,168_green_1.jpg";
	*/
	
	main_line = YAMLfile.images.main;
	ref1_line = YAMLfile.images.ref1;
	ref2_line = YAMLfile.images.ref2;
	ref3_line = YAMLfile.images.ref3;
	
	// Set Up Phase 1
	Handlers_P1();
	
	// Parse Categories
	categories = YAMLfile.categories;
	
	// Set Up Phase 2
	display_plus();
	setup_P2();
	setup_P2_ref();
}

function I_remote_handler() {
	// TODO: fix this
	return;
}

// --------------------------------------------
// Phase One ----------------------------------
// --------------------------------------------

// Phase One Global Variables -----------------
P1_mark_r = 6; 

// Phase One Event Handlers ---------------------
function Handlers_P1() {
	P1_canv_img = document.getElementById('P1_canv_img');
	P1_canv_mark = document.getElementById('P1_canv_mark');
	
	P1_canv_mark.addEventListener('mousedown',P1_clkDown,false);
	P1_canv_mark.addEventListener('mouseup',P1_clkUp,false);
	
	P1_ctx = P1_canv_img.getContext('2d');
	P1_mark_ctx = P1_canv_mark.getContext('2d');
	
	// Draw Image on Canvas
	P1_img = new Image();
	P1_img.src = main_line;
	
	P1_img.onload = function() {
		// Draw Image on P2
		document.getElementById('P2_m').getContext('2d').drawImage(P1_img,0,0);
	
		// Draw Image on P1
		P1_ctx.drawImage(P1_img,5,5);
		
		// Draw Frame
		P1_createFrame(false);	

		// Save Image
		main_img = P1_ctx;
		main_mark_img = P1_mark_ctx;
	}
}

function P1_clkDown() {
	if (!inMarkedMode) {
		return;
	}

	// Start Click Timer
	P1_clkTimerID = window.setTimeout(P1_alertLinked,1000);
	P1_clkTimerRunning = true; 
	
	// Save Starting Time if Not in Linked Mode
	if (!P1_inLinkedMode) {
		P1_clkStart = new Date();
	}
}

function P1_clkUp(e) {
	if (!inMarkedMode) {
		return;
	}

	// Get Mouse Position	
	P1_posX = e.layerX - this.offsetLeft;
	P1_posY = e.layerY - this.offsetTop;
	
	// Stop Clock Timer if Running
	if (P1_clkTimerRunning) {
		P1_clkTimerRunning = false;
		clearTimeout(P1_clkTimerID);
	}
	
	// Make Appropriate Mark and Link
	P1_markAndLink();
}

function update_P1_count() {	
	// Update P1 Front End
	var txt = "Cell Count: ".concat(cell_data.length);
	document.getElementById('P1_cell_count').innerHTML = txt;
	
	// Update P2 Front End
	var P2_cell_max = document.getElementById('P2_cell_tot');
	P2_cell_max.value = cell_data.length;
}

// Phase One Functionality ---------------------
function P1_alertLinked() {
	// Alert User that Now in Linked Mode
	// Make Frame Green
	P1_createFrame(true);
}

function P1_createFrame(drawLinked) {
	// Make Frame
	P1_mark_ctx.lineWidth = "5";
	P1_mark_ctx.beginPath();
	P1_mark_ctx.moveTo(0,0);
	P1_mark_ctx.lineTo(P1_img.width+10,0);
	P1_mark_ctx.lineTo(P1_img.width+10,P1_img.height+10);
	P1_mark_ctx.lineTo(0,P1_img.height+10);
	P1_mark_ctx.lineTo(0,0);
	
	if (drawLinked) {
		P1_mark_ctx.strokeStyle = "green";
	}
	else {
		P1_mark_ctx.strokeStyle = "blue";
	}
	P1_mark_ctx.stroke();
	P1_mark_ctx.lineWidth = "1";
}

function P1_markAndLink() {
	// Make Appropriately Colored Mark
	if (P1_inLinkedMode) {
		// Connect Mother to Daughter
		P1_mark_ctx.beginPath();
		P1_mark_ctx.moveTo(P1_cacheX,P1_cacheY);
		P1_mark_ctx.lineTo(P1_posX,P1_posY);
		P1_mark_ctx.fillStyle = 'rgb(50,10,10)';
		P1_mark_ctx.stroke();
		
		// Re-Draw Mother And Daughter Marks
		P1_mark_ctx.fillStyle = 'rgb(0,0,100)';
		P1_drawMark(P1_cacheX,P1_cacheY);
		P1_mark_ctx.fillStyle = 'rgb(0,100,0)';
		P1_drawMark(P1_posX,P1_posY);
		
		// Switch to Normal Mode
		P1_inLinkedMode = false;
		P1_createFrame(false);
		
		// Create Cell Object
		var curr_cell = new Cell();
		curr_cell.mx = P1_cacheX;
		curr_cell.my = P1_cacheY;
		curr_cell.dx = P1_posX;
		curr_cell.dy = P1_posY;

		// Store in Cell Hash
		cell_data.setItem(cell_ID,curr_cell);
		cell_ID++;		
		
		// Update Front End
		update_P1_count();
	}
	else {
		// Get Time of Click
		P1_clkEnd = new Date();
		P1_clkTime = P1_clkEnd - P1_clkStart;		
		
		/*
		var pixel = P1_mark_ctx.getImageData(P1_posX,P1_posY,1,1);		
		var rgb = pixel.data;
		if (rgb[0] == 0 && rgb[1] == 0 && rgb[2] == 100) {
			// Delete from Cell HashMap
		
			// Delete Link if Any

		
			// Undo Mark			
			P1_mark_ctx.clearRect(P1_posX-2*P1_mark_r,P1_posY-2*P1_mark_r,4*P1_mark_r,4*P1_mark_r);
		}
		else {
			// Make Blue Mark
			P1_mark_ctx.fillStyle = 'rgb(0,0,100)';
			P1_drawMark(P1_posX,P1_posY);		
		}
		*/
		
		// Make Blue Mark
		P1_mark_ctx.fillStyle = 'rgb(0,0,100)';
		P1_drawMark(P1_posX,P1_posY);			
		
		if (P1_clkTime > 1000) {
			// Save Marked Region
			P1_cacheX = P1_posX;
			P1_cacheY = P1_posY;
			
			// Enter Linked Mode
			P1_inLinkedMode = true; 
		}
		else {
			// Create Cell Object
			var curr_cell = new Cell();
			curr_cell.mx = P1_posX;
			curr_cell.my = P1_posY;
			curr_cell.dx = -1;
			curr_cell.dy = -1;
			
			// Store in Cell Hash
			cell_data.setItem(cell_ID,curr_cell);
			cell_ID++;
			
			// Update Front End
			update_P1_count();			
		}
	}
}

function P1_drawMark(x,y) {
	P1_mark_ctx.beginPath();
	P1_mark_ctx.arc(x,y,P1_mark_r,0,2*Math.PI);
	P1_mark_ctx.fill();
}

// --------------------------------------------
// Phase Two
// --------------------------------------------

// Phase Two Global Variables ------------------
var cat_array = new Array();
var P2_main_canv_w = 525;
var P2_main_canv_h = 400;
var P2_ref_canv_w = 525;
var P2_ref_canv_h = 190;

var ref1_img_local = new Array();
var ref2_img_local = new Array();
var ref3_img_local = new Array();

var P2_ref1_z = 0;
var P2_ref2_z = 0;
var P2_ref3_z = 0;

// Phase Two Functionality ---------------------
function display_plus() {		
	// Mark P3 Main
	canv = document.getElementById('P2_m_plus').getContext('2d');	
	canv.font = "bold 35px sans-serif";
	canv.strokeStyle = "blue";
	canv.strokeText("+",250,200);
	
	// Mark P3 Ref 1
	canv = document.getElementById('P2_r1_plus').getContext('2d');	
	canv.font = "bold 35px sans-serif";
	canv.strokeStyle = "blue";
	canv.strokeText("+",250,95);
	
	// Mark P3 Ref 2
	canv = document.getElementById('P2_r2_plus').getContext('2d');	
	canv.font = "bold 35px sans-serif";
	canv.strokeStyle = "blue";
	canv.strokeText("+",250,95);
	
	// Mark P3 Ref 3
	canv = document.getElementById('P2_r3_plus').getContext('2d');	
	canv.font = "bold 35px sans-serif";
	canv.strokeStyle = "blue";
	canv.strokeText("+",250,95);
}

function setup_P2() {	
	setup_P2_cats();
	setup_P2_main();
}

function setup_P2_main() {
	// TODO: Fix This
	//return; 
}

function setup_P2_cats() {
	// Set Up Categories
	P2_txt = document.getElementById('P2_cat');

	for (i in categories) {
		var cat_name = i;
		var cats = categories[cat_name];
		
		P2_txt.innerHTML += cat_name; 
		
		if (cats.length == 2) {
			// Checkbox Needed
			P2_txt.innerHTML += '<input type="checkbox" id="P2_cat_box_'+i+'">';		
		}
		else if (cats.length > 2) {
			// Drop Down Menu Needed
			var menu_html = '<select id="P2_cat_box_'+i+'">';
			
			for (var j = 0; j < cats.length; j++) {
				menu_html += '<option value='+cats[j]+'>'+cats[j]+'</option>';
			}
			
			menu_html += '</select>';
			
			// Add to HTML of Page
			P2_txt.innerHTML += menu_html;
		}
		else {
			// Blank Text Box
			P2_txt.innerHTML += '<input type="text" id="P2_cat_box_'+i+'">';
		}		
		
		P2_txt.innerHTML += '<br>';
	}	
}

function setup_P2_ref() {
	setup_P2_ref1();
	setup_P2_ref2();
	setup_P2_ref3();
	setup_P2_Zcounts();	
}

function setup_P2_ref1() {
	// Set Up Ref1 ------
	
	// Access Canvas
	ref1_img = document.getElementById('p1_c1').getContext('2d');
	
	// Get Array from YAML
	var ref1_files = ref1_line;
	
	// Set Up All Images in Z-Stack
	for (var i = 0; i < ref1_files.length; i++) {
		ref1_img_local[i] = new Image();		
		ref1_img_local[i].src = ref1_files[i];
	}
}	

function setup_P2_ref2() {
	// Set Up Ref2 ------
	
	// Access Canvas
	ref2_img = document.getElementById('p1_c2').getContext('2d');
	
	// Get Array from YAML
	var ref2_files = ref2_line;
	
	// Set Up All Images in Z-Stack
	for (var i = 0; i < ref2_files.length; i++) {
		ref2_img_local[i] = new Image();
		ref2_img_local[i].src = ref2_files[i];
	}	
}

function setup_P2_ref3() {
	// Set Up Ref3 ------
	
	// Access Canvas
	ref3_img = document.getElementById('p1_c3').getContext('2d');
	
	// Get Array from YAML
	var ref3_files = ref3_line;
	
	// Set Up All Images in Z-Stack
	for (var i = 0; i < ref3_files.length; i++) {
		ref3_img_local[i] = new Image();
		ref3_img_local[i].src = ref3_files[i];
	}
}

function setup_P2_Zcounts() {	
	// Initialize Z-Index Counts
	document.getElementById('P2_z1_max').value = ref1_img_local.length;
	document.getElementById('P2_z2_max').value = ref2_img_local.length;
	document.getElementById('P2_z3_max').value = ref3_img_local.length;
	
	// Show Images
	P2_update_z_images();
}

function P2_update_z_images() {
	// Update Z-Index Value Being Shown
	document.getElementById('P2_z1').value = P2_ref1_z+1;
	document.getElementById('P2_z2').value = P2_ref2_z+1;
	document.getElementById('P2_z3').value = P2_ref3_z+1;

	// Draw All Images onto Invisible Canvas
	ref1_img.drawImage(ref1_img_local[P2_ref1_z],0,0);
	ref2_img.drawImage(ref2_img_local[P2_ref2_z],0,0);
	ref3_img.drawImage(ref3_img_local[P2_ref3_z],0,0);
	
	// Draw onto Reference Canvases
	ref1_canv = document.getElementById('P2_r1').getContext('2d');
	ref1_canv.drawImage(ref1_img_local[P2_ref1_z],0,0);	
	
	ref2_canv = document.getElementById('P2_r2').getContext('2d');
	ref2_canv.drawImage(ref2_img_local[P2_ref2_z],0,0);	
	
	ref3_canv = document.getElementById('P2_r3').getContext('2d');
	ref3_canv.drawImage(ref3_img_local[P2_ref3_z],0,0);	
	
	// Update to Find Selected Cell
	update_ref1();
	update_ref2();
	update_ref3();
}

function P2_decrease_z() {
	if (P2_ref1_z > 0) {P2_ref1_z--;}
	if (P2_ref2_z > 0) {P2_ref2_z--;}
	if (P2_ref3_z > 0) {P2_ref3_z--;}
	P2_update_z_images();
}

function P2_increase_z() {
	if (P2_ref1_z < ref1_img_local.length-1) {P2_ref1_z++;}
	if (P2_ref2_z < ref2_img_local.length-1) {P2_ref2_z++;}
	if (P2_ref3_z < ref3_img_local.length-1) {P2_ref3_z++;}
	P2_update_z_images();
}

function P2_fore_clk() {
	// Save Data
	var P2_cell_max = document.getElementById('P2_cell_tot');
	P2_cell_max.value = cell_data.length;
	
	var P2_cell_id = document.getElementById('P2_cell_id');
	P2_cell_id.value++;
	
	// Case with No Cells Marked
	if (cell_data.length == 0) {
		P2_cell_id.value = 0;
		P2_cell_max.value = 0; 
		return; 
	}
	
	if (P2_cell_id.value > cell_data.length) {
		P2_cell_id.value = 1; 
	}
	
	// Update Main Panel
	update_cell_zoom();
	
	// Update Annotations
	update_cat();
	
	// Update Reference Panels
	update_ref1();
	update_ref2();
	update_ref3();
}

function P2_back_clk() {
	// Save Data
	var P2_cell_max = document.getElementById('P2_cell_tot');
	P2_cell_max.value = cell_data.length;
	
	var P2_cell_id = document.getElementById('P2_cell_id');
	P2_cell_id.value--;
	
	// Case with No Cells Marked
	if (cell_data.length == 0) {
		P2_cell_id.value = 0;
		P2_cell_max.value = 0; 
		return; 
	}
	
	if (P2_cell_id.value < 1) {
		P2_cell_id.value = cell_data.length; 
		
		if (P2_cell_id.value < 1) {
			P2_cell_id.value = 1;
		}
	}
	
	// Update Main Panel
	update_cell_zoom();
	
	// Update Annotations
	update_cat();
	
	// Update Reference Panels
	update_ref1();
	update_ref2();
	update_ref3();

}

function update_cell_zoom() {	
	var index = document.getElementById('P2_cell_id').value;
	
	// Set Up Main Canvas
	var elem = document.getElementById('P2_m');
	var img_canvas = elem.getContext('2d');
	
	// Set Up Main Marking Canvas
	var elem_mark = document.getElementById('P2_m_mark');
	var mark_canvas = elem_mark.getContext('2d');
		
	// Get Cell
	var curr_cell = cell_data.getItem(index);
	
	// Math to Obtain Correct Coordinates
	var x_c = curr_cell.mx - Math.floor(P2_main_canv_w/2)+2;
	var y_c = curr_cell.my - Math.floor(P2_main_canv_h/2)+13;
	
	var x_a = x_c;	// Starting location in image canvas
	var y_a = y_c;	// Starting location in image canvas
	var x_s = 0;	// Starting x-location for drawing in canvas
	var y_s = 0;	// Starting y-location for drawing in canvas
	
	if (x_c < 0) {				
		x_s = -x_c;
		x_a = 0;
	}
	if (y_c < 0) { 
		y_s = -y_c;
		y_a = 0;
	}	
	
	if (x_c > canv_w) {
		x_c = canv_w;
		x_a = canv_w;
	}
	if (y_c > canv_h) {
		y_c = canv_h;
		y_a = canv_h;
	}
	
	// Clear Canvas
	img_canvas.clearRect(0,0,P2_main_canv_w,P2_main_canv_h);
	mark_canvas.clearRect(0,0,P2_main_canv_w,P2_main_canv_h);
		
	// Take Image from Relevant Regions from Marked Image
	var cell_img_info = main_img.getImageData(x_a,y_a,x_c+P2_main_canv_w,y_c+P2_main_canv_h);
	var mark_img_info = main_mark_img.getImageData(x_a,y_a,x_c+P2_main_canv_w,y_c+P2_main_canv_h);
	
	// Put it on P3 Main Canvas
	img_canvas.putImageData(cell_img_info,x_s,y_s); 
	mark_canvas.putImageData(mark_img_info,x_s,y_s); 
}

function update_ref1() {
	var index = document.getElementById('P2_cell_id').value;
	
	// Set Up Main Canvas
	var elem = document.getElementById('P2_r1');
	var img_canvas = elem.getContext('2d');
	
	// Get Cell
	var curr_cell = cell_data.getItem(index);
	
	// Math to Obtain Correct Coordinates
	var x_c = curr_cell.mx - Math.floor(P2_ref_canv_w/2)+2;
	var y_c = curr_cell.my - Math.floor(P2_ref_canv_h/2)+13;
	
	var x_a = x_c;	// Starting location in image canvas
	var y_a = y_c;	// Starting location in image canvas
	var x_s = 0;	// Starting x-location for drawing in canvas
	var y_s = 0;	// Starting y-location for drawing in canvas
	
	if (x_c < 0) {				
		x_s = -x_c;
		x_a = 0;
	}
	if (y_c < 0) { 
		y_s = -y_c;
		y_a = 0;
	}	
	
	if (x_c > canv_w) {
		x_c = canv_w;
		x_a = canv_w;
	}
	if (y_c > canv_h) {
		y_c = canv_h;
		y_a = canv_h;
	}
	
	// Clear Canvas
	img_canvas.clearRect(0,0,P2_ref_canv_w,P2_ref_canv_h);	
	
	// Take Image from Relevant Regions from Marked Image
	var cell_img_info = ref1_img.getImageData(x_a,y_a,x_c+P2_ref_canv_w,y_c+P2_ref_canv_h);	
	
	// Put it on P2 Ref1 Canvas
	img_canvas.putImageData(cell_img_info,x_s,y_s); 
}

function update_ref2() {
	var index = document.getElementById('P2_cell_id').value;
	
	// Set Up Main Canvas
	var elem = document.getElementById('P2_r2');
	var img_canvas = elem.getContext('2d');
	
	// Get Cell
	var curr_cell = cell_data.getItem(index);
	
	// Math to Obtain Correct Coordinates
	var x_c = curr_cell.mx - Math.floor(P2_ref_canv_w/2)+2;
	var y_c = curr_cell.my - Math.floor(P2_ref_canv_h/2)+13;
	
	var x_a = x_c;	// Starting location in image canvas
	var y_a = y_c;	// Starting location in image canvas
	var x_s = 0;	// Starting x-location for drawing in canvas
	var y_s = 0;	// Starting y-location for drawing in canvas
	
	if (x_c < 0) {				
		x_s = -x_c;
		x_a = 0;
	}
	if (y_c < 0) { 
		y_s = -y_c;
		y_a = 0;
	}	
	
	if (x_c > canv_w) {
		x_c = canv_w;
		x_a = canv_w;
	}
	if (y_c > canv_h) {
		y_c = canv_h;
		y_a = canv_h;
	}
	
	// Clear Canvas
	img_canvas.clearRect(0,0,P2_ref_canv_w,P2_ref_canv_h);	
	
	// Take Image from Relevant Regions from Marked Image
	var cell_img_info = ref2_img.getImageData(x_a,y_a,x_c+P2_ref_canv_w,y_c+P2_ref_canv_h);	
	
	// Put it on P2 Ref1 Canvas
	img_canvas.putImageData(cell_img_info,x_s,y_s); 
}

function update_ref3() {
	var index = document.getElementById('P2_cell_id').value;
	
	// Set Up Main Canvas
	var elem = document.getElementById('P2_r3');
	var img_canvas = elem.getContext('2d');
	
	// Get Cell
	var curr_cell = cell_data.getItem(index);
	
	// Math to Obtain Correct Coordinates
	var x_c = curr_cell.mx - Math.floor(P2_ref_canv_w/2)+2;
	var y_c = curr_cell.my - Math.floor(P2_ref_canv_h/2)+13;
	
	var x_a = x_c;	// Starting location in image canvas
	var y_a = y_c;	// Starting location in image canvas
	var x_s = 0;	// Starting x-location for drawing in canvas
	var y_s = 0;	// Starting y-location for drawing in canvas
	
	if (x_c < 0) {				
		x_s = -x_c;
		x_a = 0;
	}
	if (y_c < 0) { 
		y_s = -y_c;
		y_a = 0;
	}	
	
	if (x_c > canv_w) {
		x_c = canv_w;
		x_a = canv_w;
	}
	if (y_c > canv_h) {
		y_c = canv_h;
		y_a = canv_h;
	}
	
	// Clear Canvas
	img_canvas.clearRect(0,0,P2_ref_canv_w,P2_ref_canv_h);	
	
	// Take Image from Relevant Regions from Marked Image
	var cell_img_info = ref3_img.getImageData(x_a,y_a,x_c+P2_ref_canv_w,y_c+P2_ref_canv_h);	
	
	// Put it on P2 Ref1 Canvas
	img_canvas.putImageData(cell_img_info,x_s,y_s); 
}

function update_cat() {
	var index = document.getElementById('P2_cell_id').value;
	
	// Get Cell
	var curr_cell = cell_data.getItem(index);
	
	// If haven't annotated yet, don't display anything
	if (!curr_cell.annot) {
		return;	
	}
	
	// Else, display most recent annotations
	var counter = 0;
	for (i in categories) {	
		var P2_cat = document.getElementById('P2_cat_box_'+i);
		
		var cat_name = i;
		var cats = categories[cat_name];
		
		if (cats.length == 2) {
			// Checkbox
			if (curr_cell.annot[counter] == 1) {
				P2_cat.checked = true;
			}
			else {
				P2_cat.checked = false;
			}
		}
		else if (cats.length > 2) {
			// Drop Down Menu
			P2_cat.value = curr_cell.annot[counter];
		}
		else {			
			// Blank Text Box
			P2_cat.value = curr_cell.annot[counter];
		}		
		
		counter++;
	}
}

function P2_save_cat() {
	var counter = 0; 
	var cat_data = new Array();
	for (i in categories) {	
		var P2_cat = document.getElementById('P2_cat_box_'+i);
		
		var cat_name = i;
		var cats = categories[cat_name];
		
		if (cats.length == 2) {
			// Checkbox
			if (P2_cat.checked) {
				cat_data[counter] = cats[0];
			}
			else {
				cat_data[counter] = cats[1]; 
			}
		}
		else if (cats.length > 2) {
			// Drop Down Menu
			cat_data[counter] = P2_cat.value;
		}
		else {			
			// Blank Text Box
			cat_data[counter] = P2_cat.value;
		}		
		
		counter++;
	}
	
	// Get Index
	var index = document.getElementById('P2_cell_id').value;
	
	// Get Cell and Save Annotations
	var curr_cell = cell_data.getItem(index);
	curr_cell.annot = cat_data;
}

// ---------------------------------------------
// Output Functionality 
// ---------------------------------------------

// Output Functionality ------------------------
function send_output() {
	// Disable Everything
	inMarkedMode = false;
	document.getElementById('P2_cell_save').disabled = true;
	document.getElementById('P2_done').disabled = true;
	
	// Disable Categories
	for (i in categories) {
		document.getElementById('P2_cat_box_'+i).disabled = true;	
	}
	
	// Print Header
	header_txt = document.getElementById('output_header');
	var cat_txt = "Output Header:"
	cat_txt += "<br>";
	cat_txt += "ID, Mother_X, Mother_Y, Daughter_X, Daughter_Y, Annotation List";
	cat_txt +=  "<br><br>";
	header_txt.innerHTML += cat_txt;
	
	// Print to Output Screen
	out_txt = document.getElementById('output_txt');
	out_txt.innerHTML = "Cell Information: <br>";
	
	// Print Cell Annotations
	for (i = 1; i <= cell_data.length; i++) {
		// Get Index and Corresponding Cell
		var curr_index = i; 
		var curr_cell = cell_data.getItem(i);
		
		// Printing Output
		var txt = "Cell #";
		
		// Cell Index
		txt += curr_index;
		txt += ",";
		
		// Cell Mother Coordinates
		txt += curr_cell.mx;
		txt += ",";
		txt += curr_cell.my;
		txt += ",";
		
		// Cell Daughter Coordinates
		txt += curr_cell.dx;
		txt += ",";
		txt += curr_cell.dy;
		txt += ",";
		
		// Cell Annotations
		for (var j = 0; j < curr_cell.annot.length; j++) {
			if (j == curr_cell.annot.length-1) {
				txt += curr_cell.annot[j];
			}
			else {
				txt += curr_cell.annot[j];
				txt += ",";
			}
		}				
		txt += "<br>";
		out_txt.innerHTML += txt;
	}
}

















