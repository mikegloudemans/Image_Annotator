// ========================================
// Initializing Bootstrap

// Show Tabs
$('#myTab a[href="#Overview"]').tab('show'); 
$('#myTab a[href="#Input"]').tab('show');
$('#myTab a[href="#Marking_Phase"]').tab('show');
$('#myTab a[href="#Annotation_Phase"]').tab('show');
$('#myTab a[href="#Output"]').tab('show');


// ========================================
// Initializing Page Functionality

window.addEventListener('load',initialize,false);

function initialize() {
	document.getElementById('I_local').addEventListener('change',I_reader,false);
}

// ========================================
// Global Variables - Parameters
var P1_canv_w = 760;
var P1_canv_h = 560;
var P2_main_canv_w = 525;
var P2_main_canv_h = 400;
var P2_ref_canv_w = 525;
var P2_ref_canv_h = 190;


// ========================================
// Javascript Object Declarations

function Cell(mx,my,dx,dy,annot) {
	this.mx = mx; // Mother's X-Coordinate
	this.my = my; // Mother's Y-Coordinate
	this.dx = dx; // Daughter's X-Coordinate
	this.dy = dy; // Daughter's Y-Coordinate
	this.annot = annot; // Annotations
}

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

// ========================================
// Global Variables - Under the Hood

// Input
var INPUT_FILE;
var main_line,main_title,main_color;
var ref1_line,ref1_title,ref1_color;
var ref2_line,ref2_title,ref2_color;
var ref3_line,ref3_title,ref3_color;
var categories;

// Marking Phase - Phase One
var zero_state = false; 
js_clear_flag = false; 

// Annotation Phase - Phase Two
var P2_ref1_img_local = new Array();
var P2_ref2_img_local = new Array();
var P2_ref3_img_local = new Array();

var P2_ref1_z = 0;
var P2_ref2_z = 0;
var P2_ref3_z = 0;

var ref1_img = 0;
var ref2_img = 0;
var ref3_img = 0; 

// Output



// Data Storage
CELL_DATA = new HashTable(); // Cell ID -> Cell Object


// Saved Information
var main_img;


// ========================================
// Useful Functions

function isNumber(n) {
	return !isNaN(parseFloat(n)) && isFinite(n);
}

function colorImage(img_px,red,green,blue) {	
	// Check to Make Sure Color is Numeric
	if (!isNumber(red) || !isNumber(green) || !isNumber(blue)) {
		return img_px; 
	}
	
	// Enforce Strict 0-255 Range by Thresholding Input
	if (red < 0) {red = 0;}
	if (green < 0) {green = 0;}
	if (blue < 0) {blue = 0;}	
	if (red > 255) {red = 255;}
	if (green > 255) {green = 255;}
	if (blue > 255) {blue = 255;}		
	
	// Convert to Grayscale First
	var d = img_px.data;
	
	for (var i = 0; i<d.length; i+=4) {
		var r = d[i];
		var g = d[i+1];
		var b = d[i+2];
		
		var v = 0.2126*r + 0.7152*g + 0.0722*b;
		
		d[i] = v/255 * red;
		d[i+1] = v/255 * green;
		d[i+2] = v/255 * blue;		
	}
	
	img_px.data = d;		
	return img_px;
}

// ========================================
// Input

function I_reader(e) {
	// Disable Inputs
	document.getElementById('I_local').disabled = true;
	
	// Read Local YAML File
	readFile(this.files[0], function(e){
		INPUT_FILE = e.target.result;
		parseYAML();	
	});
}

function readFile(file,callback) {
	var reader = new FileReader();
	reader.onload = callback;
	reader.readAsText(file);
}

function parseYAML() {
	// Parse YAML
	var YAMLfile = jsyaml.load(INPUT_FILE);	
	
	// Load Image Paths
	main_line = YAMLfile.images.main.path;
	ref1_line = YAMLfile.images.ref1.path;
	ref2_line = YAMLfile.images.ref2.path;
	ref3_line = YAMLfile.images.ref3.path;		
	
	// Load Image Titles
	main_title = YAMLfile.images.main.title;
	ref1_title = YAMLfile.images.ref1.title;
	ref2_title = YAMLfile.images.ref2.title;
	ref3_title = YAMLfile.images.ref3.title;	
	
	// Load Image Colors
	main_color = YAMLfile.images.main.color;
	ref1_color = YAMLfile.images.ref1.color;
	ref2_color = YAMLfile.images.ref2.color;
	ref3_color = YAMLfile.images.ref3.color;
	
	// Load Categories
	categories = YAMLfile.categories;
	
	// Initialize Marking Phase and Annotation Phase
	initialize_P1();
	initialize_P2();
}

// ========================================
// Phase One - Marking Phase

function initialize_P1() {
	// Get Canvas Handles
	var P1_ctx = document.getElementById('P1_canv_img').getContext('2d');
	var P2_main = document.getElementById('P2_m').getContext('2d');
	
	// Get Image
	P1_img = new Image();
	P1_img.src = main_line;
	
	P1_img.onload = function() {
		// Clear Any Stray Marks
		P1_clearAll();
	
		// Draw Image on P1		
		P1_ctx.drawImage(P1_img,0,0);
		
		// Color Image on P1
		var P1_img_px = P1_ctx.getImageData(0,0,P1_canv_w,P1_canv_h);
		P1_img_px = colorImage(P1_img_px,main_color[0],main_color[1],main_color[2]);
		P1_ctx.putImageData(P1_img_px,0,0);
		
		// Draw Image on P2 Main
		P2_main.drawImage(P1_img,0,0);
		var P2_main_px = P2_main.getImageData(0,0,P2_main_canv_w,P2_main_canv_h);
		
		// Color Image on P2 Main
		P2_main_px = colorImage(P2_main_px,main_color[0],main_color[1],main_color[2]);
		P2_main.putImageData(P2_main_px,0,0);		
		
		// Save Image
		main_img = P1_ctx;
	}
}

function P1_clearAll() {
	// Send Clear Flag to PDE
	js_clear_flag = true; 	
	
	// Update P2 Front-End
	// document.getElementById('P2_cell_id').value = 0;
}

function P1_updateCount() {
	// Update Mother Count on P1 Front-End
	document.getElementById("P1_mother").innerHTML = "Mother Cell Count: " + CELL_DATA.length;
	
	// Update Daughter Count on P1 Front-End
	var count = 0;
	for (var i = 0; i<CELL_DATA.length; i++) {
		if (CELL_DATA.getItem(i).dx != -1) {count++;};	
	}
	document.getElementById("P1_daughter").innerHTML = "Daughter Cell Count: " + count;
	
	// Update P2 Front-End	
	document.getElementById('P2_cell_tot').value = CELL_DATA.length;
	
	// if (document.getElementById('P2_cell_id').value == 0) {
		// return;
	// }
	
	document.getElementById('P2_cell_id').value = 1;
	
	// Update Main Panel
	P2_update_main();
	
	// Update Annotations
	// P2_update_cat();
	
	// Update Reference Panels
	P2_update_ref1();
	P2_update_ref2();
	P2_update_ref3();
}

// ========================================
// Phase Two - Annotation Phase

function initialize_P2() {
	// Display Crosshair on All P2 Images
	P2_display_plus();
	
	// Set up Categories
	P2_setup_categories();
	
	// Set up Reference Image Titles
	P2_display_ref_titles();
	
	// Set up Reference Images
	P2_setup_ref1();	
	P2_setup_ref2();
	P2_setup_ref3();
	
	// Set up Z-Counts
	P2_setup_z_counts();
}

function P2_display_plus() {
	// Mark P2 Main
	var canv = document.getElementById('P2_m_plus').getContext('2d');	
	canv.font = "bold 25px sans-serif";
	canv.fillStyle = "rgba(255,255,0,0.5)";
	canv.fillText("+",252,197);
	
	// Mark P2 Ref 1
	canv = document.getElementById('P2_r1_plus').getContext('2d');	
	canv.font = "bold 25px sans-serif";
	canv.fillStyle = "rgba(255,255,0,0.5)";
	canv.fillText("+",252,92);
	
	// Mark P2 Ref 2
	canv = document.getElementById('P2_r2_plus').getContext('2d');	
	canv.font = "bold 25px sans-serif";
	canv.fillStyle = "rgba(255,255,0,0.5)";
	canv.fillText("+",252,92);
	
	// Mark P2 Ref 3
	canv = document.getElementById('P2_r3_plus').getContext('2d');	
	canv.font = "bold 25px sans-serif";
	canv.fillStyle = "rgba(255,255,0,0.5)";
	canv.fillText("+",252,92);
}

function P2_setup_categories() {
	// Set Up Categories
	P2_txt = document.getElementById('P2_cat');

	for (i in categories) {
		var cat_name = i;
		var cats = categories[cat_name];		
		
		if (cats.length == 2) {						
			// Checkbox Needed
			P2_txt.innerHTML += '<label class="checkbox">'+cat_name+'<input type="checkbox" id="P2_cat_box_'+i+'"></label>';				
		}
		else if (cats.length > 2) {
			// Drop Down Menu Needed
			var menu_html = '<label>'+cat_name+'</label><select id="P2_cat_box_'+i+'">';
			
			for (var j = 0; j < cats.length; j++) {					
				menu_html += '<option value='+cats[j]+'>'+cats[j]+'</option>';				
			}
			menu_html += '</select>';
			
			// Add to HTML of Page
			P2_txt.innerHTML += menu_html;			
		}		
		else {
			P2_txt.innerHTML += cat_name;
		
			// Blank Text Box
			P2_txt.innerHTML += '<input type="text" class="input-small" id="P2_cat_box_'+i+'">';
		}		
		
		P2_txt.innerHTML += '<br>';
	}
}

function P2_display_ref_titles() {
	document.getElementById('P2_m_title').innerHTML = main_title;
	document.getElementById('P2_r1_title').innerHTML = ref1_title;
	document.getElementById('P2_r2_title').innerHTML = ref2_title;
	document.getElementById('P2_r3_title').innerHTML = ref3_title;
}

function P2_setup_ref1() {	
	// Initialize Access to Canvas
	ref1_img = document.getElementById('p1_c1').getContext('2d');
	
	// Get Array from YAML
	var ref1_files = ref1_line;
	
	// Set Up All Images in Z-Stack
	for (var i = 0; i < ref1_files.length; i++) {
		P2_ref1_img_local[i] = new Image();		
		P2_ref1_img_local[i].src = ref1_files[i];
	}
}

function P2_setup_ref2() {
	// Initialize Access to Canvas
	ref2_img = document.getElementById('p1_c2').getContext('2d');
	
	// Get Array from YAML
	var ref2_files = ref2_line;
	
	// Set Up All Images in Z-Stack
	for (var i = 0; i < ref2_files.length; i++) {
		P2_ref2_img_local[i] = new Image();
		P2_ref2_img_local[i].src = ref2_files[i];
	}	
}

function P2_setup_ref3() {
	// Initialize Access to Canvas
	ref3_img = document.getElementById('p1_c3').getContext('2d');
	
	// Get Array from YAML
	var ref3_files = ref3_line;
	
	// Set Up All Images in Z-Stack
	for (var i = 0; i < ref3_files.length; i++) {
		P2_ref3_img_local[i] = new Image();
		P2_ref3_img_local[i].src = ref3_files[i];
	}
}

function P2_setup_z_counts() {
	// Initialize Z-Index Counts
	document.getElementById('P2_z1_max').value = P2_ref1_img_local.length;
	document.getElementById('P2_z2_max').value = P2_ref2_img_local.length;
	document.getElementById('P2_z3_max').value = P2_ref3_img_local.length;	
	
	// Show Images
	P2_update_z_images();
}

function P2_update_z_images() {
	// Update Z-Index Value Being Shown
	document.getElementById('P2_z1').value = P2_ref1_z+1;
	document.getElementById('P2_z2').value = P2_ref2_z+1;
	document.getElementById('P2_z3').value = P2_ref3_z+1;

	// Draw All Images onto Invisible Canvas
	ref1_img.drawImage(P2_ref1_img_local[P2_ref1_z],0,0);
	ref2_img.drawImage(P2_ref2_img_local[P2_ref2_z],0,0);
	ref3_img.drawImage(P2_ref3_img_local[P2_ref3_z],0,0);
	
	// Color Ref1 on Invisible Canvas
	var img_px = ref1_img.getImageData(0,0,P1_canv_w,P1_canv_h);
	img_px = colorImage(img_px,ref1_color[0],ref1_color[1],ref1_color[2]);
	ref1_img.putImageData(img_px,0,0);
	
	// Color Ref2 on Invisible Canvas
	img_px = ref2_img.getImageData(0,0,P1_canv_w,P1_canv_h);
	img_px = colorImage(img_px,ref2_color[0],ref2_color[1],ref2_color[2]);
	ref2_img.putImageData(img_px,0,0);	
	
	// Color Ref3 on Invisible Canvas
	img_px = ref3_img.getImageData(0,0,P1_canv_w,P1_canv_h);
	img_px = colorImage(img_px,ref3_color[0],ref3_color[1],ref3_color[2]);
	ref3_img.putImageData(img_px,0,0);
	
	// Draw Ref1 onto Reference Canvas
	ref1_canv = document.getElementById('P2_r1').getContext('2d');
	ref1_canv.drawImage(P2_ref1_img_local[P2_ref1_z],0,0);	
	
	// Draw Ref2 onto Reference Canvas
	ref2_canv = document.getElementById('P2_r2').getContext('2d');
	ref2_canv.drawImage(P2_ref2_img_local[P2_ref2_z],0,0);	
	
	// Draw Ref3 onto Reference Canvas
	ref3_canv = document.getElementById('P2_r3').getContext('2d');
	ref3_canv.drawImage(P2_ref3_img_local[P2_ref3_z],0,0);	
	
	// Update to Find Selected Cell
	P2_update_ref1();
	P2_update_ref2();
	P2_update_ref3();
}

function P2_decrease_z() {
	if (P2_ref1_z > 0) {P2_ref1_z--;}
	if (P2_ref2_z > 0) {P2_ref2_z--;}
	if (P2_ref3_z > 0) {P2_ref3_z--;}

	P2_update_z_images();
}

function P2_increase_z() {
	if (P2_ref1_z < P2_ref1_img_local.length-1) {P2_ref1_z++;}
	if (P2_ref2_z < P2_ref2_img_local.length-1) {P2_ref2_z++;}
	if (P2_ref3_z < P2_ref3_img_local.length-1) {P2_ref3_z++;}
	
	P2_update_z_images();
}

function P2_fore_clk() {
	// Save Annotations
	P2_save_cat();	
	
	// Save Data
	var P2_cell_max = document.getElementById('P2_cell_tot');
	P2_cell_max.value = CELL_DATA.length;
	
	var P2_cell_id = document.getElementById('P2_cell_id');
	P2_cell_id.value++;
	
	// Case with No Cells Marked
	if (CELL_DATA.length == 0) {
		P2_cell_id.value = 0;
		P2_cell_max.value = 0; 
		return; 
	}
	
	if (P2_cell_id.value > CELL_DATA.length) {
		P2_cell_id.value = 1; 
	}	
	
	// Update Main Panel
	P2_update_main();
	
	// Update Annotations
	P2_update_cat();
	
	// Update Reference Panels
	P2_update_ref1();
	P2_update_ref2();
	P2_update_ref3();
}

function P2_back_clk() {	
	// Save Annotations
	P2_save_cat();

	// Save Data
	var P2_cell_max = document.getElementById('P2_cell_tot');
	P2_cell_max.value = CELL_DATA.length;
	
	var P2_cell_id = document.getElementById('P2_cell_id');
	P2_cell_id.value--;
	
	// Case with No Cells Marked
	if (CELL_DATA.length == 0) {
		P2_cell_id.value = 0;
		P2_cell_max.value = 0; 
		return; 
	}
	
	if (P2_cell_id.value < 1) {
		P2_cell_id.value = CELL_DATA.length; 		
	}
	
	// Update Main Panel
	P2_update_main();
	
	// Update Annotations
	P2_update_cat();
	
	// Update Reference Panels
	P2_update_ref1();
	P2_update_ref2();
	P2_update_ref3();
}

function P2_update_main() {
	var index = document.getElementById('P2_cell_id').value-1;
	
	// Set Up Main Canvas
	var elem = document.getElementById('P2_m');
	var img_canvas = elem.getContext('2d');
	
	// // Set Up Main Marking Canvas
	// var elem_mark = document.getElementById('P2_m_mark');
	// var mark_canvas = elem_mark.getContext('2d');
	
	// Get Cell
	var curr_cell = CELL_DATA.getItem(index);
	
	// Math to Obtain Correct Coordinates
	var x_c = Math.floor(P1_canv_w/2) - Math.floor(P2_main_canv_w/2)+2;
	var y_c = Math.floor(P1_canv_h/2) - Math.floor(P2_main_canv_h/2)+13;
	
	if (CELL_DATA.length > 0) {
		x_c = curr_cell.mx - Math.floor(P2_main_canv_w/2)+2;
		y_c = curr_cell.my - Math.floor(P2_main_canv_h/2)+13;
	}
	
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
	
	if (x_c > P1_canv_w) {
		x_c = P1_canv_w;
		x_a = P1_canv_w;
	}
	if (y_c > P1_canv_h) {
		y_c = P1_canv_h;
		y_a = P1_canv_h;
	}
	
	// Clear Canvas
	img_canvas.clearRect(0,0,P2_main_canv_w,P2_main_canv_h);
	
	// Take Image from Relevant Regions from Marked Image
	var cell_img_info = main_img.getImageData(x_a,y_a,x_c+P2_main_canv_w,y_c+P2_main_canv_h);

	// Put it on P2 Main Canvas
	img_canvas.putImageData(cell_img_info,x_s,y_s); 
}

function P2_update_ref1() {
	var index = document.getElementById('P2_cell_id').value-1;
	
	// Set Up Main Canvas
	var elem = document.getElementById('P2_r1');
	var img_canvas = elem.getContext('2d');
	
	// Get Cell
	var curr_cell = CELL_DATA.getItem(index);
	
	// Math to Obtain Correct Coordinates
	var x_c = Math.floor(P1_canv_w/2) - Math.floor(P2_ref_canv_w/2)+2;
	var y_c = Math.floor(P1_canv_h/2) - Math.floor(P2_ref_canv_h/2)+13;
	
	if (CELL_DATA.length > 0) {
		x_c = curr_cell.mx - Math.floor(P2_ref_canv_w/2)+2;
		y_c = curr_cell.my - Math.floor(P2_ref_canv_h/2)+13;
	}
	
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
	
	if (x_c > P1_canv_w) {
		x_c = P1_canv_w;
		x_a = P1_canv_w;
	}
	if (y_c > P1_canv_h) {
		y_c = P1_canv_h;
		y_a = P1_canv_h;
	}
	
	// Clear Canvas
	img_canvas.clearRect(0,0,P2_ref_canv_w,P2_ref_canv_h);	
	
	// Take Image from Relevant Regions from Marked Image
	var cell_img_info = ref1_img.getImageData(x_a,y_a,x_c+P2_ref_canv_w,y_c+P2_ref_canv_h);	
	
	// Put it on P2 Ref1 Canvas
	img_canvas.putImageData(cell_img_info,x_s,y_s); 
}

function P2_update_ref2() {
	var index = document.getElementById('P2_cell_id').value-1;
	
	// Set Up Main Canvas
	var elem = document.getElementById('P2_r2');
	var img_canvas = elem.getContext('2d');
	
	// Get Cell
	var curr_cell = CELL_DATA.getItem(index);
	
	// Math to Obtain Correct Coordinates
	var x_c = Math.floor(P1_canv_w/2) - Math.floor(P2_ref_canv_w/2)+2;
	var y_c = Math.floor(P1_canv_h/2) - Math.floor(P2_ref_canv_h/2)+13;
	
	if (CELL_DATA.length > 0) {
		x_c = curr_cell.mx - Math.floor(P2_ref_canv_w/2)+2;
		y_c = curr_cell.my - Math.floor(P2_ref_canv_h/2)+13;
	}
	
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
	
	if (x_c > P1_canv_w) {
		x_c = P1_canv_w;
		x_a = P1_canv_w;
	}
	if (y_c > P1_canv_h) {
		y_c = P1_canv_h;
		y_a = P1_canv_h;
	}
	
	// Clear Canvas
	img_canvas.clearRect(0,0,P2_ref_canv_w,P2_ref_canv_h);	
	
	// Take Image from Relevant Regions from Marked Image
	var cell_img_info = ref2_img.getImageData(x_a,y_a,x_c+P2_ref_canv_w,y_c+P2_ref_canv_h);	
	
	// Put it on P2 Ref1 Canvas
	img_canvas.putImageData(cell_img_info,x_s,y_s); 
}

function P2_update_ref3() {
	var index = document.getElementById('P2_cell_id').value-1;
	
	// Set Up Main Canvas
	var elem = document.getElementById('P2_r3');
	var img_canvas = elem.getContext('2d');
	
	// Get Cell
	var curr_cell = CELL_DATA.getItem(index);
	
	// Math to Obtain Correct Coordinates
	var x_c = Math.floor(P1_canv_w/2) - Math.floor(P2_ref_canv_w/2)+2;
	var y_c = Math.floor(P1_canv_h/2) - Math.floor(P2_ref_canv_h/2)+13;
	
	if (CELL_DATA.length > 0) {
		x_c = curr_cell.mx - Math.floor(P2_ref_canv_w/2)+2;
		y_c = curr_cell.my - Math.floor(P2_ref_canv_h/2)+13;
	}
	
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
	
	if (x_c > P1_canv_w) {
		x_c = P1_canv_w;
		x_a = P1_canv_w;
	}
	if (y_c > P1_canv_h) {
		y_c = P1_canv_h;
		y_a = P1_canv_h;
	}
	
	// Clear Canvas
	img_canvas.clearRect(0,0,P2_ref_canv_w,P2_ref_canv_h);	
	
	// Take Image from Relevant Regions from Marked Image
	var cell_img_info = ref3_img.getImageData(x_a,y_a,x_c+P2_ref_canv_w,y_c+P2_ref_canv_h);	
	
	// Put it on P2 Ref1 Canvas
	img_canvas.putImageData(cell_img_info,x_s,y_s); 
}

function P2_update_cat() {
	var index = document.getElementById('P2_cell_id').value-1;
	
	// Get Cell
	var curr_cell = CELL_DATA.getItem(index);
	
	// If already annotated, display annotations
	if (curr_cell.annot) {	
		var counter = 0;
		for (i in categories) {	
			var P2_cat = document.getElementById('P2_cat_box_'+i);
			
			var cat_name = i;
			var cats = categories[cat_name];
			
			if (cats.length == 2) {
				// Checkbox
				if (curr_cell.annot[counter] == cats[0]) {
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
	else {	// Else, Display Default Annotations
		counter = 0;	
		for (i in categories) {
			var P2_cat = document.getElementById('P2_cat_box_'+i);
			
			var cat_name = i;
			var cats = categories[cat_name];
			
			if (cats.length == 2) {
				// Checkbox
				P2_cat.checked = false;
			}
			else if (cats.length > 2) {
				// Drop Down Menu
				P2_cat.value = cats[0];
			}
			else {
				// Blank Text Box
				P2_cat.value = "";
			}
			
			counter++;	
		}
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
	var index = document.getElementById('P2_cell_id').value-1;
	
	// Get Cell and Save Annotations
	var curr_cell = CELL_DATA.getItem(index);
	curr_cell.annot = cat_data;
}

// ========================================
// Output

function send_output() {
	// Save Current Annotations
	P2_save_cat(); 

	// Print Header
	header_txt = document.getElementById('output_header');
	var cat_txt = "Output Header:"
	cat_txt += "<br>";
	cat_txt += "ID, Mother_X, Mother_Y, Daughter_X, Daughter_Y, Annotation List";
	cat_txt +=  "<br><br>";
	header_txt.innerHTML = cat_txt;
	
	// Print to Output Screen
	out_txt = document.getElementById('output_txt');
	out_txt.innerHTML = "Cell Information: <br>";
	
	// Print Cell Annotations
	for (var i = 0; i < CELL_DATA.length; i++) {	
		// Get Index and Corresponding Cell
		var curr_index = i; 
		var curr_cell = CELL_DATA.getItem(i);
		
		// If Current Cell Not Annotated Yet, Go to Next Iteration
		if (!curr_cell.annot) {
			continue; 
		}
		
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
	out_txt.innerHTML += "<br>";
	
	// Calculate and Show Summary
	out_summary();
}

function out_summary() {
	// Intermediate String
	var out_txt = "Annotation Summary: <br>";
	
	// Initialize
	var num_daughter = 0; 
	var num_annot = new Array(); 	
	var cells_annotated = 0; 
	
	// Set Up Category Template
	var max_choices = 0;
	var cat_choices = new Array();
	var cat_choice_counter = 0; 
	var cat_template = new Array();
	var cat_counter = 0; 
	var num_categories = 0;
	for (var i in categories) {
		var cat_name = i;
		var cats = categories[cat_name];
		
		// If Blank Text Box
		if (!cats) {continue;}
		
		// Else, Add to Template
		for (j = 0; j<cats.length; j++) {
			cat_template[cat_counter] = cats[j];
			cat_counter++;
		}
	
		// Determine Max Number of Choices and Number of Choices per Category
		max_choices = Math.max(max_choices,cats.length);
		cat_choices[cat_choice_counter] = cats.length;
		cat_choice_counter++;
		
		// Count Number of Categories
		num_categories++;
	}	
	
	// Set Up Annotation Conter
	var annot_counter = new Array();
	for (var i = 0; i<cat_template.length; i++) {
		annot_counter[i] = 0; 
	}
	
	// Get Values from Annotations
	for (var i = 0; i < CELL_DATA.length; i++) {	
		// Get Index and Corresponding Cell
		var curr_index = i; 		
		var curr_cell = CELL_DATA.getItem(curr_index); 
		
		// If Current Cell Not Annotated Yet, Go to Next Iteration
		if (!curr_cell.annot) {continue;}
		cells_annotated++;
		
		// Check if Cell Has Daughter
		if (curr_cell.dx != -1) {num_daughter++;}					
		
		// Check All Annotations		
		for (var j = 0; j<curr_cell.annot.length; j++) {		
			// Get Current Annotation Value
			var curr_ann = curr_cell.annot[j];			
		
			// Check Category Template and Update Annotation Counter
			for (var k = 0; k<cat_template.length; k++) {
				// If Annotation Found, Update the Counter				
				if (curr_ann == cat_template[k]) {
					annot_counter[k]++;					
					continue;
				}			
			}		
		}		
	}	
	
	// Calculate Percentages
	num_daughter = Math.floor(num_daughter*100/cells_annotated);
	out_txt += "With Daughter Cells: " + num_daughter + "% <br>";
	var no_daughter = 100-num_daughter;
	out_txt += "Without Daughter Cells: " + no_daughter + "% <br>";
	
	var curr_cat = 0; 
	var outer_vis_array = new Array();
	
	var first_array = new Array(max_choices+1);
	first_array[0] = 'Categories';
	for (var i = 1; i<max_choices+1; i++) {
		first_array[i] = '';
	}
	outer_vis_array[0] = first_array;
	
	var second_array = new Array(max_choices+1);
	second_array[0] = 'Daughter Cell';
	second_array[1] = num_daughter + "% Present";
	second_array[2] = no_daughter + "% Absent";
	for (var i = 3; i<max_choices+1; i++) {
		second_array[i] = '';
	}
	outer_vis_array[1] = second_array;
	
	var template_loc = 0;
	for (var c in categories) {
		var vis_array = new Array(max_choices+1);	
		for (var i = 0; i<max_choices+1; i++) {
			vis_array[i] = '';
		}
	
		for (var i = 0; i < cat_choices[curr_cat]; i++) {
			var temp_category = cat_template[template_loc];
			var temp_pct = Math.floor(annot_counter[template_loc]*100/cells_annotated);
		
			// Get Category
			out_txt += temp_category;
			out_txt += ": ";
			
			// Actual Calculation
			out_txt += temp_pct;
			out_txt += "% <br>";		
			
			vis_array[0] = c;
			vis_array[i+1] = temp_pct + "% " + temp_category;
			
			template_loc++;
		}			
		
		// Add to Visualization Tables
		outer_vis_array[curr_cat+2] = vis_array;
		
		// Increment Current Category
		curr_cat++;	
	}
	
	// Send to Table			
	var vis_data = google.visualization.arrayToDataTable(outer_vis_array);
	var vis_table = new google.visualization.Table(document.getElementById('output_table'));
	vis_table.draw(vis_data);
}

