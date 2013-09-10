// Processing Code for Image Canvas -----
/* @pjs transparent="true"; */

// Canvas Parameters
int canv_w = 760;
int canv_h = 560;

// Data Storage
ArrayList mother_x;
ArrayList mother_y; 
ArrayList daughter_x;
ArrayList daughter_y;

// Mark Parameters
int mark_d = 10; 
int shown_x, shown_y;

// Mark Color
int mark_red = 0;
int mark_green = 0;
int mark_blue = 255;

// Daughter Color
int daughter_red = 0;
int daughter_green = 255;
int daughter_blue = 0;

// Mouse Logic
boolean show_mark = false; 	
boolean make_mark = false; 	
boolean linked_mode = false;	
boolean motherClicked = false; 
boolean daughterClicked = false; 
boolean delete_daughter = false; 

int cell_id_clicked;
int cell_to_replace;
int down_x,down_y;
int drag_tol = 10;

// Deleted Cell Index
int delete_cell_index = -1;

void send_data_to_js() {
	// Save All Data
	var SAVED_DATA = new HashTable();
	SAVED_DATA = CELL_DATA;

	// Clear All Data
	CELL_DATA.clear();	
	
	delete_cell_index = -1;
	
	// Saved Mark Data
	for (int i = 0; i<mother_x.size(); i++) {
		int cell_id = i;
		var curr_cell = new Cell();
		
		if ((delete_cell_index == -1) || (i < delete_cell_index)) {
			curr_cell.mx = mother_x.get(i);
			curr_cell.my = mother_y.get(i);
			curr_cell.dx = daughter_x.get(i);
			curr_cell.dy = daughter_y.get(i);			
		}		
		
		CELL_DATA.setItem(i,curr_cell);
	}
	
	delete_cell_index = -1;
	
	// Update Front-End
	P1_updateCount();
	P2_update_cat();
}

void setup() {
	// Establish Canvas
	size(canv_w,canv_h);
	
	// Initialize Data Structures
	mother_x = new ArrayList();
	mother_y = new ArrayList();	
	daughter_x = new ArrayList();
	daughter_y = new ArrayList();
}

void draw() {
	background(0,0,0,0);
	
	// If Not Loaded, Do Nothing
	if (!input_loaded) {
		mother_x.clear();
		mother_y.clear();		
		daughter_x.clear();
		daughter_y.clear();
		return;
	}

	// Clear if Needed
	if (js_clear_flag) {
		// Clear Data Structures
		mother_x.clear();
		mother_y.clear();		
		daughter_x.clear();
		daughter_y.clear();
		
		// Reset Flag
		js_clear_flag = false; 	
		
		// Update JS Data Structures
		send_data_to_js();
	}
	
	// Show Mark Moving
	if (show_mark) {
		if (linked_mode) {
			// Draw line to daughter cell
			line(mother_x.get(cell_id_clicked),mother_y.get(cell_id_clicked),shown_x,shown_y);
			// Show Daughter Cell
			fill(daughter_red,daughter_green,daughter_blue);			
		}
		else {	
			// Show Mother Cell
			fill(mark_red,mark_green,mark_blue);		
		}
		
		ellipse(shown_x,shown_y,mark_d,mark_d);	
	}
	
	// Add to Data Structures
	if (make_mark) {	
		make_mark = false; 
	
		if (linked_mode) {
			// Change Daughter Cell of Most Recent Mother
			daughter_x.set(cell_id_clicked,mouseX);
			daughter_y.set(cell_id_clicked,mouseY);
			
			linked_mode = false; 
		}
		else {
			// Save Mother Cell
			mother_x.add(mouseX);
			mother_y.add(mouseY);	

			// Initially Assume No Daughter
			daughter_x.add(-1);
			daughter_y.add(-1);
		}

		// Update JS Data Structure
		send_data_to_js();
	}
	
	// Draw all Marks
	for (int i = 0; i<mother_x.size(); i++) {
		// Get Mother Cells
		int m_x = mother_x.get(i);
		int m_y = mother_y.get(i);
		
		// Get Daughter Cells
		int d_x = daughter_x.get(i);
		int d_y = daughter_y.get(i);
		
		// Draw Daughter
		if (d_x != -1)
		{
			// Don't draw the daughter cell if a new one with the same
			// mother is being placed.
			if (!((show_mark && motherClicked)
				&& (i == cell_id_clicked)))
			{
				// Don't draw cell if it's about to be replaced.
				if (cell_to_replace == i)
				{
					continue;
				}
			
				// Draw Line
				line(m_x,m_y,d_x,d_y);
				
				// Draw Cell Mark
				if (!show_mark && daughterClicked && (i == cell_id_clicked))
				{
					// If the cell is about to be deleted, 
					// display it in red.
					fill(255,0,0);
				}
				else
				{
					fill(daughter_red,daughter_green,daughter_blue);
					
				}
				ellipse(d_x,d_y,mark_d,mark_d);	
			}				
		}
		
		// Draw Mother
		if (!show_mark && motherClicked && (i == cell_id_clicked))
		{
			// Don't draw cell if it's about to be replaced.
			// If the cell is about to be deleted, display it in red.
			fill(255,0,0);
		}	
		else
		{
			fill(mark_red,mark_green,mark_blue);
		}
		
		// Only draw cell if it's not about to be replaced.
		if (cell_to_replace != i)
		{
			ellipse(m_x,m_y,mark_d,mark_d);
		}

	}	
}

void mousePressed() {
	// If Not Loaded, Do Nothing
	if (!input_loaded) {		
		return;
	}

	show_mark = true; 
	cell_to_replace = -1;

	// Check if Clicking a Mother Cell
	motherClicked = false;
	for (int i = 0; i<mother_x.size(); i++) {
		double d_sq = pow(mouseX-mother_x.get(i),2) + pow(mouseY-mother_y.get(i),2);
		if (sqrt(d_sq) < mark_d/2) {
			motherClicked = true;
			show_mark = false;
			cell_id_clicked = i;
			
			down_x = mouseX;
			down_y = mouseY;
			
			break;
		}
	}

	// Check if Clicking a Daughter Cell
	daughterClicked = false;
	for (int i = 0; i<daughter_x.size(); i++) {
		double d_sq = pow(mouseX-daughter_x.get(i),2) + pow(mouseY-daughter_y.get(i),2);
		if (sqrt(d_sq) < mark_d/2) {
			daughterClicked = true;
			delete_daughter = true;
			show_mark = false;
			cell_id_clicked = i; 
			
			down_x = mouseX;
			down_y = mouseY;
			
			break;
		}	
	}
	
	
	shown_x = mouseX;
	shown_y = mouseY;
}

void mouseDragged() {
	// If Not Loaded, Do Nothing
	if (!input_loaded) {		
		return;
	}

	// Enter Linked Mode if Needed
	linked_mode = false; 
	
	// Check Tolerance on Mother Cell
	if (motherClicked) {
		double d_sq = pow(mouseX-down_x,2) + pow(mouseY-down_y,2);
		if (sqrt(d_sq) < drag_tol) {
			linked_mode = false;
			show_mark = false;
		}
		else {
			linked_mode = true;
			show_mark = true;
		}
		
	}	
	
	// Check Tolerance on Daughter Cell
	if (daughterClicked) {
		double d_sq = pow(mouseX-down_x,2) + pow(mouseY-down_y,2);
		if (sqrt(d_sq) < drag_tol) {
			delete_daughter = true; 
			show_mark = false;
		}
		else {
			delete_daughter = false; 
			show_mark = true;
		}		
	}
	
	// Figure out if the cell is about to be 
	// placed on top of an existing cell.
	
	cell_to_replace = -1;
	
	for (int i = 0; i < mother_x.size(); i++)
	{
		if (i == cell_id_clicked)
		{
			if (motherClicked)
			{
				// We don't need to replace the cell if it's the one
				// we just clicked on.
				continue;
			}
		}
		double d1_sq = pow(mouseX-mother_x.get(i),2) + pow(mouseY-mother_y.get(i),2);
		double d2_sq = pow(mouseX-daughter_x.get(i),2) + pow(mouseY-daughter_y.get(i),2);
		if (sqrt(d1_sq) < drag_tol)
		{
			cell_to_replace = i;
			break;
		}
		
		if (sqrt(d2_sq) < drag_tol)
		{
			// Don't replace daughter cell if it's the one that was
			// just clicked.
			if (daughterClicked && (i == cell_id_clicked))
			{
				continue;
			}
			cell_to_replace = i;
			break;
		}
	}

	// Save X and Y Coordinates
	shown_x = mouseX;
	shown_y = mouseY;	
}

void mouseReleased() {
	// If Not Loaded, Do Nothing
	if (!input_loaded) {		
		return;
	}

	// If Not in Linked Mode and Clicked Mother, Delete Cell	
	if (motherClicked && !linked_mode) {
		delete_cell_index = cell_id_clicked;
	
		mother_x.remove(cell_id_clicked);
		mother_y.remove(cell_id_clicked);
		
		daughter_x.remove(cell_id_clicked);
		daughter_y.remove(cell_id_clicked);
		
		motherClicked = false;
		
		show_mark = false;
		make_mark = false; 
		
		// Update JS Data Structures
		send_data_to_js();
		
		return;
	}

	// If Clicked Daughter, Delete Daughter
	
	if (daughterClicked && delete_daughter) {			
		daughter_x.set(cell_id_clicked,-1);
		daughter_y.set(cell_id_clicked,-1);
		
		daughterClicked = false;
		
		show_mark = false;
		make_mark = false;
	
		// Update JS Data Structures
		send_data_to_js();
	
		return; 		
	}
	
	// If replacing cell, remove that cell.
	
	if (cell_to_replace != -1)
	{		
		mother_x.remove(cell_to_replace);
		mother_y.remove(cell_to_replace);
		
		daughter_x.remove(cell_to_replace);
		daughter_y.remove(cell_to_replace);
		
		cell_to_replace = -1;
		cell_id_clicked -= 1;
		
		send_data_to_js();
	}
	
	// Make the Mark
	show_mark = false;
	make_mark = true;
	
	motherClicked = false;
	daughterClicked = false;
}