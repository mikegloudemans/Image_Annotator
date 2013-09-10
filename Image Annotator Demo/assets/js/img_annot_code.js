// ========================================
// Initializing Page Functionality

window.addEventListener('load',initialize,false);

function initialize() {
	document.getElementById('I_local').addEventListener('change',I_reader,false);
}

function noEnterZoom(e) {
	// Prevents a page reload from occurring when the user presses
	// Enter in the zoom text box.
	
    e = e || window.event;
    var key = e.keyCode || e.charCode;
	if (key == 13)
	{
		if (input_loaded)
		{
			P2_zoom_changed();
		}
		return false;
	}
    else {return true;}
}

function noEnter(e) {
	// Ignores Enter press in text box.
	e = e || window.event;
    var key = e.keyCode || e.charCode;
	return key !== 13;
}

$(document).ready(function() {
	// Add event handlers for buttons
	$('#btn_start').click(function()	{
		$('#myLeftTabs a[href="#Marking_Phase"]').tab('show');
	});
	
	$('#P1_btn_continue').click(function()	{
		$('#myLeftTabs a[href="#Annotation_Phase"]').tab('show');
	});

	$('#P2_btn_done').click(function()	{
		$('#myLeftTabs a[href="#Output"]').tab('show');				
		bootbox.alert("Annotations Successfully Completed!", function() {
			output_make_charts();
		});			
	});
	
	$(".right-tab").click(function()
	{
		$(".left-tab").removeClass("active");
	});
	
	$(".left-tab").click(function()
	{
		$(".right-tab").removeClass("active");
	});
	// Initialize tooltips
	$('#P1_help').tooltip();
	$('#P1_btn_clear').tooltip();
	$('#P1_btn_continue').tooltip();
	$('#P2_btn_done').tooltip();		
});

// ========================================
// Global Variables - Parameters
var P1_canv_w = 760;
var P1_canv_h = 560;
var P2_main_canv_w = 400;
var P2_main_canv_h = 296;
var P2_ref_canv_w = P2_main_canv_w;
var P2_ref_canv_h = P2_main_canv_h;

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

input_loaded = false; 

// Marking Phase - Phase One
var zero_state = false; 
js_clear_flag = false; 

var img_orig_width = 0;
var img_orig_height = 0;

var cell_ID = 0;
var cell_MAX = 0; 

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

var x_zoom = 1.5;
var y_zoom = 1.5;

var main_scaled = false;
var ref1_scaled = false; 
var ref2_scaled = false; 
var ref3_scaled = false; 

var ref1_hasSlider = false; 
var ref2_hasSlider = false; 
var ref3_hasSlider = false; 

var slider_update = false; 

// Output
var huge_output_array = new Array();
var d_output_array = new Array();

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

function getExtension(filename) {	
	return filename.split('.').pop();
}

// ========================================
// Input

function show_nonYAML_failure() {
	// If files failed to load, create an alert explaining
	// the failure to the user.
	var html_text = '<div class="alert fade in" id="loading_failure"><button type="button" class="close" data-dismiss="alert">&times;</button><strong>Whoops!</strong> The file you specified is not in the YAML format. Select a different file.</div>';
	var alert_box = document.getElementById('alerts');
	alert_box.innerHTML = html_text + alert_box.innerHTML;
	
	// Re-enable the input box so the user can try again.
	document.getElementById('I_local').disabled = false;
}

function show_nonJPG_failure() {
	// If files failed to load, create an alert explaining
	// the failure to the user.
	var html_text = '<div class="alert fade in" id="loading_failure"><button type="button" class="close" data-dismiss="alert">&times;</button><strong>Whoops!</strong> One of your image files doesn\'t seem to be in JPG format. Make sure you\'ve formatted your YAML file correctly.</div>';
	var alert_box = document.getElementById('alerts');
	alert_box.innerHTML = html_text + alert_box.innerHTML;
	
	// Re-enable the input box so the user can try again.
	document.getElementById('I_local').disabled = false;
}

function improper_YAML_failure()
{
	// Catch a failure when the YAML file is
	// improperly formatted.
	
	var html_text = '<div class="alert fade in" id="loading_failure"><button type="button" class="close" data-dismiss="alert">&times;</button><strong>Whoops!</strong> Your YAML file didn\'t parse correctly. Verify that all formatting is correct, and then try again.</div>';
	var alert_box = document.getElementById('alerts');
	alert_box.innerHTML = html_text + alert_box.innerHTML;
	
	// Re-enable the input box so the user can try again.
	document.getElementById('I_local').disabled = false;
}

function show_loading_success() {
	var html_text = '<div class="alert alert-success fade in" id="loading_success"><button type="button" class="close" data-dismiss="alert">&times;</button>File loaded successfully.</div>';
	var alert_box = document.getElementById('alerts');
	alert_box.innerHTML = html_text + alert_box.innerHTML;
}

function I_reader(e) {
	// Disable Inputs
	document.getElementById('I_local').disabled = true;	
	
	if ((getExtension(this.files[0].name) != 'yml') && (getExtension(this.files[0].name) != 'yaml'))
	{
		show_nonYAML_failure();
		return;
	}
	
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
	try
	{
		var YAMLfile = jsyaml.load(INPUT_FILE);	
	}
	catch(err)
	{
		improper_YAML_failure();
		return;
	}
	
	// Load Image Paths
	main_line = YAMLfile.images.main.path;
	ref1_line = YAMLfile.images.ref1.path;
	ref2_line = YAMLfile.images.ref2.path;
	ref3_line = YAMLfile.images.ref3.path;	
	
	// Check to verify that all images specified are JPGs.
	for(var i = 0; i < main_line.length; i++)
	{		
		if ((getExtension(main_line[i]) != 'jpg') && (getExtension(this.files[0]) != 'jpeg'))
		{
			show_nonJPG_failure();
			return;
		}
	}
	
	for(var i = 0; i < ref1_line.length; i++)
	{
		if (!((getExtension(ref1_line[i]) == 'jpg') || (getExtension(ref1_line[i]) == 'jpeg')))
		{
			show_nonJPG_failure();
			return;
		}
	}
	
	for(var i = 0; i < ref2_line.length; i++)
	{
		if (!((getExtension(ref2_line[i]) == 'jpg') || (getExtension(ref2_line[i]) == 'jpeg')))
		{
			show_nonJPG_failure();
			return;
		}
	}
	
	for(var i = 0; i < ref3_line.length; i++)
	{
		if (!((getExtension(ref3_line[i]) == 'jpg') || (getExtension(ref3_line[i]) == 'jpeg')))
		{
			show_nonJPG_failure();
			return;
		}
	}
	
	show_loading_success();
	
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
	
	// File Completely Loaded
	input_loaded = true; 
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
	
		// Save Original Width and Height
		img_orig_width = P1_img.width;
		img_orig_height = P1_img.height;
	
		// Draw Image on P1		
		P1_ctx.drawImage(P1_img,0,0,P1_canv_w,P1_canv_h);
		
		// Color Image on P1
		var P1_img_px = P1_ctx.getImageData(0,0,P1_canv_w,P1_canv_h);
		P1_img_px = colorImage(P1_img_px,main_color[0],main_color[1],main_color[2]);
		P1_ctx.putImageData(P1_img_px,0,0);
		
		// Draw Image on P2 Main
		P2_main.drawImage(P1_img,0,0,P1_canv_w,P1_canv_h);
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
}

function P1_updateCount() {
	// Update Mother Count on P1 Front-End
	document.getElementById("P1_mother").innerHTML = CELL_DATA.length;
	
	// Update Daughter Count on P1 Front-End
	var count = 0;
	for (var i = 0; i<CELL_DATA.length; i++) {
		if (CELL_DATA.getItem(i).dx != -1) {count++;};	
	}
	document.getElementById("P1_daughter").innerHTML = count;
	
	// Update P2 Front-End	
	cell_MAX = CELL_DATA.length;
	cell_ID = 1;
	
	P2_showValues();
	
	// Update Main Panel
	P2_update_main();
	
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
	
	// Enable controls
	document.getElementById('P2_cell_prev').disabled = false;
	document.getElementById('P2_cell_next').disabled = false;	
	document.getElementById('P2_btn_decrease_z').disabled = false;
	document.getElementById('P2_btn_increase_z').disabled = false;
	
	// Set up Z-images
	P2_update_z_images();
	
	// Set up Sliders
	P2_setup_sliders();
}

function P2_setup_sliders() {		
	// Check if Sliders are Needed
	if (P2_ref1_img_local.length > 1) {ref1_hasSlider = true;}
	if (P2_ref2_img_local.length > 1) {ref2_hasSlider = true;}
	if (P2_ref3_img_local.length > 1) {ref3_hasSlider = true;}

	// Initialize Sliders
	if (ref1_hasSlider) {
		$("#P2_ref1_slider").slider({
			orientation: "vertical",
			range: "min",
			min: 1,
			max: P2_ref1_img_local.length,
			value: 1,
			step: 1,
		});

		$("#P2_ref1_slider").on("slidechange", function(event,ui) {
			if (!slider_update) {
				P2_update_z_from_slider();
			}
		});
	}
	
	if (ref2_hasSlider) {
		$("#P2_ref2_slider").slider({
			orientation: "vertical",
			range: "min",
			min: 1,
			max: P2_ref2_img_local.length,
			value: 1,
			step: 1,
		});
		
		$("#P2_ref2_slider").on("slidechange", function(event,ui) {
			if (!slider_update) {
				P2_update_z_from_slider();
			}
		});
	}
	
	if (ref3_hasSlider) {
		$("#P2_ref3_slider").slider({
			orientation: "vertical",
			range: "min",
			min: 1,
			max: P2_ref3_img_local.length,
			value: 1,
			step: 1,
		});			
		
		$("#P2_ref3_slider").on("slidechange", function(event,ui) {
			if (!slider_update) {
				P2_update_z_from_slider();
			}
		});
	}
}

function P2_update_z_from_slider() {	
	if (ref1_hasSlider) {
		P2_ref1_z = $("#P2_ref1_slider").slider("value")-1; 	
	}
	
	if (ref2_hasSlider) {
		P2_ref2_z = $("#P2_ref2_slider").slider("value")-1; 	
	}
	
	if (ref3_hasSlider) {
		P2_ref3_z = $("#P2_ref3_slider").slider("value")-1; 	
	}
	
	P2_update_z_images();
	P2_showValues();
}
	
function P2_showValues() { 	
	if (cell_MAX == 0) {
		$('#P2_cell_status').html("0 / " + cell_MAX);
	}
	else {
		$('#P2_cell_status').html(cell_ID + " / " + cell_MAX);
	}
	
	$('#P2_z1').html(P2_ref1_z+1 + " / " + P2_ref1_img_local.length);
	$('#P2_z2').html(P2_ref2_z+1 + " / " + P2_ref2_img_local.length);
	$('#P2_z3').html(P2_ref3_z+1 + " / " + P2_ref3_img_local.length);
	
	$('#P2_zoom').val(Math.round(100*x_zoom));
}

function P2_display_plus() {
	// Mark P2 Main
	var canv = document.getElementById('P2_m_plus').getContext('2d');	
	canv.font = "bold 25px sans-serif";
	canv.fillStyle = "rgba(255,255,0,0.5)";
	canv.fillText("+",(P2_main_canv_w/2)-4,(P2_main_canv_h/2)+13);
	
	// Mark P2 Ref 1
	canv = document.getElementById('P2_r1_plus').getContext('2d');	
	canv.font = "bold 25px sans-serif";
	canv.fillStyle = "rgba(255,255,0,0.5)";
	canv.fillText("+",(P2_main_canv_w/2)-4,(P2_main_canv_h/2)+13);
	
	// Mark P2 Ref 2
	canv = document.getElementById('P2_r2_plus').getContext('2d');	
	canv.font = "bold 25px sans-serif";
	canv.fillStyle = "rgba(255,255,0,0.5)";
	canv.fillText("+",(P2_main_canv_w/2)-4,(P2_main_canv_h/2)+13);
	
	// Mark P2 Ref 3
	canv = document.getElementById('P2_r3_plus').getContext('2d');	
	canv.font = "bold 25px sans-serif";
	canv.fillStyle = "rgba(255,255,0,0.5)";
	canv.fillText("+",(P2_main_canv_w/2)-4,(P2_main_canv_h/2)+13);
}

function P2_setup_categories() {
	// Set Up Categories
	P2_txt = document.getElementById('P2_cat');

	for (i in categories) {
		var cat_name = i;
		var cats = categories[cat_name];
		
		P2_txt.innerHTML += '<div id="div_' + cat_name.replace(/ /g, "_") + '" class="cat_div"></div>';
		
		newDiv = document.getElementById('div_' + cat_name.replace(/ /g, "_"));
		var cats = categories[cat_name];		
		
		if (cats.length == 2) {						
			// Radio Button			
			var label_name = "P2_cat_box_label_" + i.replace(/ /g,"_");
			var element_name_left = "P2_cat_box_left_" + i.replace(/ /g,"_");
			var element_name_right = "P2_cat_box_right_" + i.replace(/ /g,"_");
			var radio_HTML = '<label id = "'+label_name+'">'+cat_name+'</label>';
			radio_HTML += '<div class="btn_group" data-toggle="buttons-radio">';
			radio_HTML += '<button type="button" id="'+element_name_right+'" class="btn">'+cats[1]+'</button>';
			radio_HTML += '<button type="button" id="'+element_name_left+'" class="btn active">'+cats[0]+'</button>';		
			radio_HTML += '</div>';
			newDiv.innerHTML += radio_HTML;
			
			label_name = "#" + label_name;
			element_name_left = "#" + element_name_left;
			element_name_right = "#" + element_name_right;
			
			$(label_name).css("float", "left");
			$(label_name).css("padding-left", "3px");
			$(label_name).css("margin-right", "10px");
			$(label_name).css("padding-top","10px");
			
			$(element_name_left).css("float", "right");
			$(element_name_left).css("margin-top","4px");
			
			$(element_name_right).css("float", "right");			
			$(element_name_right).css("margin-top","4px");
		}
		else if (cats.length > 2) {
			// Drop Down Menu Needed
			var menu_html = '<label id = "P2_cat_box_label_'+i.replace(/ /g,"_")+'">'+cat_name+'</label><select id="P2_cat_box_'+i.replace(/ /g,"_")+'">';
			var label_name = "#P2_cat_box_label_" + i.replace(/ /g,"_");
			
			for (var j = 0; j < cats.length; j++) {					
				menu_html += '<option value='+cats[j]+'>'+cats[j]+'</option>';				
			}
			menu_html += '</select>';
			
			// Add to HTML of Page
			newDiv.innerHTML += menu_html;
			
			var element_name = "#P2_cat_box_" + i.replace(/ /g,"_");
			
			$(label_name).css("float", "left");
			$(label_name).css("margin-right", "10px");
			$(label_name).css("padding-left", "3px");
			$(label_name).css("padding-top", "10px");
			$(label_name).css("width", "100px");

			$(element_name).css("float", "right");
			$(element_name).css("margin-top", "5px");
			$(element_name).css("width", "150px");
		}		
		else {
			var label_name = 'P2_cat_box_label_'+i.replace(/ /g,"_");
			var menu_html = '<label id = "' + label_name + '">'+cat_name+'</label>';
			newDiv.innerHTML += menu_html;

			// Blank Text Box


			var element_name = 'P2_cat_box_'+i.replace(/ /g,"_");
			newDiv.innerHTML += '<input type="text" class="input-small" onkeypress="return noEnter(event)" id="'+element_name+'">';


			label_name = "#" + label_name;
			element_name = "#" + element_name;


			$(label_name).css("float", "left");
			$(label_name).css("padding-left", "3px");
			$(label_name).css("padding-top", "10px");
			$(label_name).css("margin-right", "10px");
			$(label_name).css("width", "100px");
			$(element_name).css("float", "right");
			$(element_name).css("margin-top", "5px");


			$(element_name).css("width", "135px");
		}		
		
		P2_txt.innerHTML += '<div style="clear:both;"></div>';
	}
}

function P2_display_ref_titles() {
	document.getElementById('P2_main_label').innerHTML = main_title;
	document.getElementById('P2_ref1_label').innerHTML = ref1_title;
	document.getElementById('P2_ref2_label').innerHTML = ref2_title;
	document.getElementById('P2_ref3_label').innerHTML = ref3_title;
	
	document.getElementById('P2_z1_label').innerHTML = ref1_title;
	document.getElementById('P2_z2_label').innerHTML = ref2_title;
	document.getElementById('P2_z3_label').innerHTML = ref3_title;
}

function P2_less_zoom() {
	if(!input_loaded)
	{
		return;
	}
	// Reset Previous Zoom
	P2_reset_zoom();
	
	x_zoom -= 0.1;
	y_zoom -= 0.1;
	
	if (x_zoom < 0.1) {x_zoom = 0.1;}
	if (y_zoom < 0.1) {y_zoom = 0.1;}
	
	// Re-Zoom All Images	
	P2_showValues();
	P2_update_main();
	P2_update_ref1();
	P2_update_ref2();
	P2_update_ref3();
}

function P2_more_zoom() {

	if(!input_loaded)
	{
		return;
	}
	// Reset Previous Zoom
	P2_reset_zoom();

	x_zoom += 0.1;
	y_zoom += 0.1;
	
	if (x_zoom > 10) {x_zoom = 10;}
	if (y_zoom > 10) {y_zoom = 10;}
	
	// Re-Zoom All Images	
	P2_showValues();
	P2_update_main();
	P2_update_ref1();
	P2_update_ref2();
	P2_update_ref3();
}

function P2_zoom_changed() {
	// Reset Previous Zoom
	P2_reset_zoom();

	x_zoom = $('#P2_zoom').val()/100;
	y_zoom = $('#P2_zoom').val()/100;
	
	if (x_zoom < 0.1) {x_zoom = 0.1;}
	if (y_zoom < 0.1) {y_zoom = 0.1;}
	
	if (x_zoom > 10) {x_zoom = 10;}
	if (y_zoom > 10) {y_zoom = 10;}
	
	// Re-Zoom All Images	
	P2_showValues();
	P2_update_main();
	P2_update_ref1();
	P2_update_ref2();
	P2_update_ref3();
}

function P2_reset_zoom() {	
	main_scaled = false; 
	ref1_scaled = false; 
	ref2_scaled = false; 
	ref3_scaled = false; 	
	
	// Reset P2 Main Zoom
	var img_canvas = document.getElementById('P2_m').getContext('2d');
	img_canvas.clearRect(0,0,P2_main_canv_w,P2_main_canv_h);
	img_canvas.scale(1/x_zoom,1/y_zoom);
	
	// Reset P2 Ref1 Zoom
	img_canvas = document.getElementById('P2_r1').getContext('2d');
	img_canvas.clearRect(0,0,P2_ref_canv_w,P2_ref_canv_h);
	img_canvas.scale(1/x_zoom,1/y_zoom);
	
	// Reset P2 Ref2 Zoom
	img_canvas = document.getElementById('P2_r2').getContext('2d');
	img_canvas.clearRect(0,0,P2_ref_canv_w,P2_ref_canv_h);
	img_canvas.scale(1/x_zoom,1/y_zoom);
	
	// Reset P2 Ref3 Zoom
	img_canvas = document.getElementById('P2_r3').getContext('2d');
	img_canvas.clearRect(0,0,P2_ref_canv_w,P2_ref_canv_h);
	img_canvas.scale(1/x_zoom,1/y_zoom);
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
	P2_ref1_img_local[0].onload = P2_draw_ref1;
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
	
	P2_ref2_img_local[0].onload = P2_draw_ref2;	
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
	P2_ref3_img_local[0].onload = P2_draw_ref3;	
}

function P2_update_z_images() {	
	// Update Z-Index Value Being Shown
	document.getElementById('P2_z1').value = P2_ref1_z+1 + "/" + P2_ref1_img_local.length;
	document.getElementById('P2_z2').value = P2_ref2_z+1 + "/" + P2_ref2_img_local.length;
	document.getElementById('P2_z3').value = P2_ref3_z+1 + "/" + P2_ref3_img_local.length;
	
	// Signify Beginning of Update (done to prevent infinite function calls)
	slider_update = true;
	
	if (ref1_hasSlider) {
		$("#P2_ref1_slider").slider("value",P2_ref1_z+1);
	}
	
	if (ref2_hasSlider) {
		$("#P2_ref2_slider").slider("value",P2_ref2_z+1);		
	}
	
	if (ref3_hasSlider) {
		$("#P2_ref3_slider").slider("value",P2_ref3_z+1);
	}	
	
	// Update slider_update to Signify End of Update
	slider_update = false; 
	
	// Draw all reference images
	P2_draw_ref1();
	P2_draw_ref2();
	P2_draw_ref3();
}

function P2_draw_ref1() {
	// Draw ref1 on invisible canvas

	ref1_img.drawImage(P2_ref1_img_local[P2_ref1_z],0,0,P1_canv_w,P1_canv_h);


	
	// Color Ref1 on Invisible Canvas
	var img_px = ref1_img.getImageData(0,0,P1_canv_w,P1_canv_h);
	img_px = colorImage(img_px,ref1_color[0],ref1_color[1],ref1_color[2]);
	ref1_img.putImageData(img_px,0,0);
	
	// Draw Ref1 onto Reference Canvas
	ref1_canv = document.getElementById('P2_r1').getContext('2d');
	ref1_canv.drawImage(P2_ref1_img_local[P2_ref1_z],0,0,P2_ref_canv_w,P2_ref_canv_h);	

	P2_update_ref1();	
	
}

function P2_draw_ref2() {
	// Draw ref2 on invisible canvas
	ref2_img.drawImage(P2_ref2_img_local[P2_ref2_z],0,0,P1_canv_w,P1_canv_h);

	// Color Ref2 on Invisible Canvas
	img_px = ref2_img.getImageData(0,0,P1_canv_w,P1_canv_h);
	img_px = colorImage(img_px,ref2_color[0],ref2_color[1],ref2_color[2]);
	ref2_img.putImageData(img_px,0,0);	

	// Draw Ref2 onto Reference Canvas
	ref2_canv = document.getElementById('P2_r2').getContext('2d');
	ref2_canv.drawImage(P2_ref2_img_local[P2_ref2_z],0,0,P2_ref_canv_w,P2_ref_canv_h);	
	
	P2_update_ref2();
	
}

function P2_draw_ref3() {
	// Draw ref3 on invisible canvas
	ref3_img.drawImage(P2_ref3_img_local[P2_ref3_z],0,0,P1_canv_w,P1_canv_h);

	// Color Ref3 on Invisible Canvas
	img_px = ref3_img.getImageData(0,0,P1_canv_w,P1_canv_h);
	img_px = colorImage(img_px,ref3_color[0],ref3_color[1],ref3_color[2]);
	ref3_img.putImageData(img_px,0,0);

	// Draw Ref3 onto Reference Canvas
	ref3_canv = document.getElementById('P2_r3').getContext('2d');
	ref3_canv.drawImage(P2_ref3_img_local[P2_ref3_z],0,0,P2_ref_canv_w,P2_ref_canv_h);	

	P2_update_ref3();
}

function P2_decrease_z() {
	if (P2_ref1_z > 0) {P2_ref1_z--;}
	if (P2_ref2_z > 0) {P2_ref2_z--;}
	if (P2_ref3_z > 0) {P2_ref3_z--;}
	
	// Update Front-End
	P2_showValues();	
	P2_update_z_images();	
}

function P2_increase_z() {
	if (P2_ref1_z < P2_ref1_img_local.length-1) {P2_ref1_z++;}
	if (P2_ref2_z < P2_ref2_img_local.length-1) {P2_ref2_z++;}
	if (P2_ref3_z < P2_ref3_img_local.length-1) {P2_ref3_z++;}
	
	// Update Front-End
	P2_showValues();	
	P2_update_z_images();
}

function P2_fore_clk() {
	// Save Annotations
	P2_save_cat();	
	
	// Save Data
	cell_MAX = CELL_DATA.length;	
	cell_ID++;		
	
	// Case with No Cells Marked
	if (cell_MAX == 0) {
		cell_ID = 0;
		return; 
	}
	
	if (cell_ID > cell_MAX) {
		cell_ID = 1; 
	}	
	
	// Update Front-End
	P2_showValues();
	
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
	cell_MAX = CELL_DATA.length;	
	cell_ID--;
	
	// Case with No Cells Marked
	if (cell_MAX == 0) {
		cell_ID = 0;
		return; 
	}
	
	if (cell_ID < 1) {
		cell_ID = cell_MAX;	
	}
	
	// Update Front-End
	P2_showValues();
	
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
	var index = cell_ID-1;
	
	// Set Up Main Canvas
	var elem = document.getElementById('P2_m');
	var img_canvas = elem.getContext('2d');
	
	// Get Cell
	var curr_cell = CELL_DATA.getItem(index);
	
	// Math to Obtain Correct Coordinates
	var x_c = Math.floor(P1_canv_w/2) - Math.floor((1/x_zoom)*(P2_main_canv_w/2));
	var y_c = Math.floor(P1_canv_h/2) - Math.floor((1/y_zoom)*(P2_main_canv_h/2));
	
	if (CELL_DATA.length > 0) {
		x_c = curr_cell.mx - Math.floor((1/x_zoom)*(P2_main_canv_w/2));
		y_c = curr_cell.my - Math.floor((1/y_zoom)*(P2_main_canv_h/2));
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
	
	var x_f = x_c + Math.floor((1/x_zoom)*P2_main_canv_w);
	var y_f = y_c + Math.floor((1/y_zoom)*P2_main_canv_h);
	
	// Clear Canvas
	var c_w = Math.max(P2_main_canv_w,Math.floor(P2_main_canv_w*(1/x_zoom)));	
	var c_h = Math.max(P2_main_canv_h,Math.floor(P2_main_canv_h*(1/y_zoom)));	
	img_canvas.clearRect(0,0,c_w,c_w);

	// Take Image from Relevant Regions from Marked Image
	var cell_img_info = main_img.getImageData(x_a,y_a,x_f,y_f);
	
	// Put it on P2 Main Canvas and Zoom 	
	var imageData = cell_img_info;
	var newCanvas = $("<canvas>")
		.attr("width", imageData.width)
		.attr("height", imageData.height)[0];
	newCanvas.getContext("2d").putImageData(imageData, 0, 0);
	if (!main_scaled) {
		img_canvas.scale(x_zoom, y_zoom);
		main_scaled = true;
	}
	
	img_canvas.drawImage(newCanvas, x_s, y_s); 	
}

function P2_update_ref1() {
	var index = cell_ID-1;
	
	// Set Up Main Canvas
	var elem = document.getElementById('P2_r1');
	var img_canvas = elem.getContext('2d');
	
	// Get Cell
	var curr_cell = CELL_DATA.getItem(index);
	
	// Math to Obtain Correct Coordinates
	var x_c = Math.floor(P1_canv_w/2) - Math.floor((1/x_zoom)*(P2_ref_canv_w/2));
	var y_c = Math.floor(P1_canv_h/2) - Math.floor((1/y_zoom)*(P2_ref_canv_h/2));
	
	if (CELL_DATA.length > 0) {
		x_c = curr_cell.mx - Math.floor((1/x_zoom)*(P2_ref_canv_w/2));
		y_c = curr_cell.my - Math.floor((1/y_zoom)*(P2_ref_canv_h/2));
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
	
	var x_f = x_c + Math.floor((1/x_zoom)*P2_ref_canv_w);
	var y_f = y_c + Math.floor((1/y_zoom)*P2_ref_canv_h);
	
	// Clear Canvas
	var c_w = Math.max(P2_ref_canv_w,Math.floor(P2_ref_canv_w*(1/x_zoom)));	
	var c_h = Math.max(P2_ref_canv_h,Math.floor(P2_ref_canv_h*(1/y_zoom)));	
	img_canvas.clearRect(0,0,c_w,c_h);
	
	// Take Image from Relevant Regions from Marked Image
	var cell_img_info = ref1_img.getImageData(x_a,y_a,x_f,y_f);
	
	// // Put it on P2 Ref1 Canvas
	// img_canvas.putImageData(cell_img_info,x_s,y_s); 
	
	// Put it on P2 Ref1 Canvas and Zoom 	
	var imageData = cell_img_info;
	var newCanvas = $("<canvas>")
		.attr("width", imageData.width)
		.attr("height", imageData.height)[0];
	newCanvas.getContext("2d").putImageData(imageData, 0, 0);
	if (!ref1_scaled) {
		img_canvas.scale(x_zoom, y_zoom);
		ref1_scaled = true;
	}
	img_canvas.drawImage(newCanvas, x_s, y_s); 	
}

function P2_update_ref2() {
	var index = cell_ID-1;
	
	// Set Up Main Canvas
	var elem = document.getElementById('P2_r2');
	var img_canvas = elem.getContext('2d');
	
	// Get Cell
	var curr_cell = CELL_DATA.getItem(index);
	
	// Math to Obtain Correct Coordinates
	var x_c = Math.floor(P1_canv_w/2) - Math.floor((1/x_zoom)*(P2_ref_canv_w/2));
	var y_c = Math.floor(P1_canv_h/2) - Math.floor((1/y_zoom)*(P2_ref_canv_h/2));
	
	if (CELL_DATA.length > 0) {
		x_c = curr_cell.mx - Math.floor((1/x_zoom)*(P2_ref_canv_w/2));
		y_c = curr_cell.my - Math.floor((1/y_zoom)*(P2_ref_canv_h/2));
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
	
	var x_f = x_c + Math.floor((1/x_zoom)*P2_ref_canv_w);
	var y_f = y_c + Math.floor((1/y_zoom)*P2_ref_canv_h);
	
	// Clear Canvas
	var c_w = Math.max(P2_ref_canv_w,Math.floor(P2_ref_canv_w*(1/x_zoom)));	
	var c_h = Math.max(P2_ref_canv_h,Math.floor(P2_ref_canv_h*(1/y_zoom)));	
	img_canvas.clearRect(0,0,c_w,c_h);
	
	// Take Image from Relevant Regions from Marked Image
	var cell_img_info = ref2_img.getImageData(x_a,y_a,x_f,y_f);
	
	// // Put it on P2 Ref2 Canvas
	// img_canvas.putImageData(cell_img_info,x_s,y_s); 
	
	// Put it on P2 Ref2 Canvas and Zoom 	
	var imageData = cell_img_info;
	var newCanvas = $("<canvas>")
		.attr("width", imageData.width)
		.attr("height", imageData.height)[0];
	newCanvas.getContext("2d").putImageData(imageData, 0, 0);
	if (!ref2_scaled) {
		img_canvas.scale(x_zoom, y_zoom);
		ref2_scaled = true;
	}
	img_canvas.drawImage(newCanvas, x_s, y_s); 	
}

function P2_update_ref3() {
	var index = cell_ID-1;
	
	// Set Up Main Canvas
	var elem = document.getElementById('P2_r3');
	var img_canvas = elem.getContext('2d');
	
	// Get Cell
	var curr_cell = CELL_DATA.getItem(index);
	
	// Math to Obtain Correct Coordinates
	var x_c = Math.floor(P1_canv_w/2) - Math.floor((1/x_zoom)*(P2_ref_canv_w/2));
	var y_c = Math.floor(P1_canv_h/2) - Math.floor((1/y_zoom)*(P2_ref_canv_h/2));
	
	if (CELL_DATA.length > 0) {
		x_c = curr_cell.mx - Math.floor((1/x_zoom)*(P2_ref_canv_w/2));
		y_c = curr_cell.my - Math.floor((1/y_zoom)*(P2_ref_canv_h/2));
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
	
	var x_f = x_c + Math.floor((1/x_zoom)*P2_ref_canv_w);
	var y_f = y_c + Math.floor((1/y_zoom)*P2_ref_canv_h);
	
	// Clear Canvas
	var c_w = Math.max(P2_ref_canv_w,Math.floor(P2_ref_canv_w*(1/x_zoom)));	
	var c_h = Math.max(P2_ref_canv_h,Math.floor(P2_ref_canv_h*(1/y_zoom)));	
	img_canvas.clearRect(0,0,c_w,c_h);
	
	// Take Image from Relevant Regions from Marked Image
	var cell_img_info = ref3_img.getImageData(x_a,y_a,x_f,y_f);3
	
	// // Put it on P2 Ref3 Canvas
	// img_canvas.putImageData(cell_img_info,x_s,y_s); 
	
	// Put it on P2 Ref3 Canvas and Zoom 	
	var imageData = cell_img_info;
	var newCanvas = $("<canvas>")
		.attr("width", imageData.width)
		.attr("height", imageData.height)[0];
	newCanvas.getContext("2d").putImageData(imageData, 0, 0);
	if (!ref3_scaled) {
		img_canvas.scale(x_zoom, y_zoom);
		ref3_scaled = true;
	}
	img_canvas.drawImage(newCanvas, x_s, y_s); 
}

function P2_update_cat() {
	var index = cell_ID-1;
	
	// If No Cells, Show Default Annotations
	if (CELL_DATA.length == 0) {
		P2_show_default_annot();
		return;
	}
	
	// Get Cell
	var curr_cell = CELL_DATA.getItem(index);
	
	// If already annotated, display annotations
	if (curr_cell.annot) {	
		var counter = 0;
		for (i in categories) {	
			var P2_cat = document.getElementById('P2_cat_box_'+i.replace(/ /g,"_"));			
			var cat_name = i;
			var cats = categories[cat_name];
			
			if (cats.length == 2) {
				// Radio Button
				if (curr_cell.annot[counter] == cats[0]) {
					$('#P2_cat_box_left_'+i.replace(/ /g,"_")).attr("class","btn active");
					$('#P2_cat_box_right_'+i.replace(/ /g,"_")).attr("class","btn");		
				}
				else {
					$('#P2_cat_box_left_'+i.replace(/ /g,"_")).attr("class","btn");
					$('#P2_cat_box_right_'+i.replace(/ /g,"_")).attr("class","btn active");		
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
		P2_show_default_annot();
	}
}

function P2_show_default_annot() {
	var counter = 0;	
	for (i in categories) {
		var P2_cat = document.getElementById('P2_cat_box_'+i.replace(/ /g,"_"));
		var cat_name = i;
		var cats = categories[cat_name];
		
		if (cats.length == 2) {
			// Radio Buttons
			$('#P2_cat_box_left_'+i.replace(/ /g,"_")).attr("class","btn active");
			$('#P2_cat_box_right_'+i.replace(/ /g,"_")).attr("class","btn");			
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

function P2_save_cat() {
	var counter = 0; 
	var cat_data = new Array();
	for (i in categories) {	
		var P2_cat = document.getElementById('P2_cat_box_'+i.replace(/ /g,"_"));
		
		var cat_name = i;
		var cats = categories[cat_name];
		
		if (cats.length == 2) {
			// Radio Buttons
			if ($('#P2_cat_box_left_'+i.replace(/ /g,"_")).hasClass("btn active")) {
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
	var index = cell_ID-1;
	
	// Get Cell and Save Annotations
	var curr_cell = CELL_DATA.getItem(index);
	curr_cell.annot = cat_data;
}

// ========================================
// Output

function send_output() {
	// Save Current Annotations
	P2_save_cat(); 

	// Scale All X-Y Coordinates to Undo Image Re-sizing
	for (var i = 0; i<CELL_DATA.length; i++) {
		CELL_DATA.getItem(i).mx = Math.floor(CELL_DATA.getItem(i).mx * img_orig_width / P1_canv_w);
		CELL_DATA.getItem(i).my = Math.floor(CELL_DATA.getItem(i).my * img_orig_height / P1_canv_h);
	}
	
	// Print Header
	header_txt = document.getElementById('output_header');
	// var cat_txt = "Output Header:"
	// cat_txt += "<br>";
	var cat_txt = "ID, Mother_X, Mother_Y, Daughter_X, Daughter_Y, Annotation List";
	// cat_txt +=  "<br><br>";
	header_txt.innerHTML = cat_txt;
	
	// Print to Output Screen
	var out_txt = document.getElementById('output_txt');
	// out_txt.innerHTML = "Cell Information: <br>";
	out_txt.innerHTML = "";
	
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
		txt += curr_index+1;
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
	var out_txt = "<strong>Annotation Statistics:</strong> <br>";
	
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
	
	$('.incomplete_annotation').remove();
	
	if(cells_annotated !== CELL_DATA.length)
	{
		display_incomplete_warning();
	}
		
	// Calculate Percentages with Daughter Cells
	num_daughter = Math.round(num_daughter*100/cells_annotated);
	var no_daughter = 100-num_daughter;
	out_txt += "Daughter Cells: " + num_daughter + "% With, ";
	out_txt += no_daughter + "% Without <br>";
	
	// Calculate Cell Percentages
	var annot_pct = new Array();
	for (var i = 0; i<annot_counter.length; i++) {
		annot_pct[i] = Math.round(annot_counter[i]*100/cells_annotated);	
	}
	
	
	// Display Percentages
	var c_placeholder = 0;
	for (var c in categories) {
		var cat_name = c;
		var cats = categories[c];
		
		out_txt += cat_name + ': ';
		
		for (var i = 0; i<cats.length; i++) {
			out_txt += annot_pct[i] + '% ';
			out_txt += cat_template[c_placeholder+i];
		
			if (i != cats.length-1) {
				out_txt += ', ';
			}
			else {
				out_txt += '<br>';
			}
		}		
		
		c_placeholder += cats.length;
	}
	
	document.getElementById('output_txt').innerHTML += out_txt;		
	
	// Put In Format for Charts
	var placeholder = 0; 
	var cat_counter = 1;
	
	document.getElementById('output_charts').innerHTML = '';
	var c_txt = document.getElementById('output_charts').innerHTML;
	
	c_txt += '<div class="row">'
	c_txt += '<div id="chart_d" class="span3" style="height:250px; width:350px;"></div>';
	
	d_output_array = new Array();
	d_output_array[0] = ['With',num_daughter];
	d_output_array[1] = ['Without',no_daughter];
	
	for (var c in categories) {		
		cats = categories[c];
	
		var curr_choices = new Array();
		var curr_pct = new Array();
		var chart_data = new Array();
		
		for (var i = placeholder; i<placeholder+cats.length; i++) {
			var data_array = new Array();
			data_array[0] = cat_template[i];
			data_array[1] = annot_pct[i];
			
			chart_data[i-placeholder] = [data_array[0],data_array[1]];
		}
		
		placeholder += cats.length;		
		huge_output_array[cat_counter-1] = chart_data;
		
		// Update HTML
		c_txt += '<div id="chart_'+cat_counter+'" class="span3" style="height:250px; width:350px;"></div>';	
		cat_counter++;
	}	
	
	c_txt += '</div>';
	document.getElementById('output_charts').innerHTML = c_txt;	
}

function output_make_charts() {
	// Chart for Daughter
	var d_plot = jQuery.jqplot('chart_d',[d_output_array],
		{
			title : 'Daughter Cell',
			seriesDefaults: {
				renderer: jQuery.jqplot.PieRenderer, 
				rendererOptions: {				
					showDataLabels: true
				}
			}, 
			legend: { show:true, location: 'e' }
		}
	);	
	

	// Charts for Categories	
	var plot_array = new Array();
	var cat_titles = new Array();
	var counter = 0;
	for (var c in categories) {
		cat_titles[counter] = c;
		counter++;
	}
	
	for (var i = 0; i<huge_output_array.length; i++) {	
		var cat_counter = i+1;
		var chart_data = huge_output_array[i];
		plot_array[i] = jQuery.jqplot('chart_'+cat_counter,[chart_data],
			{
				title: cat_titles[i],
				seriesDefaults: {
					renderer: jQuery.jqplot.PieRenderer, 
					rendererOptions: {				
						showDataLabels: true
					}
				}, 
				legend: { show:true, location: 'e' }
			}
		);	
	}
}

function display_incomplete_warning()
{
	var html_text = '<div class="alert alert-warning fade in incomplete_annotation"><button type="button" class="close" data-dismiss="alert">&times;</button>NOTE: You didn\'t annotate all of your cells, so the following output summary contains data for only the cells you viewed.</div>';
	var alert_box = document.getElementById('summary_alerts');
	alert_box.innerHTML = html_text + alert_box.innerHTML;
	$('.incomplete_annotation').css("width","400px");
}
