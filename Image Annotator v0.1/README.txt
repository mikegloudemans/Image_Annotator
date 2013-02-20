Author: Nikhil Saxena
Date: February 12, 2013
Email: nsax91@gmail.com

=====================
Image Annotator v0.1
=====================

Necessary Files and Libraries:
	- index.html
	- demo_styles.css
	- demo_code.js
	- js-yaml.min.js
	
Instructions:
	1) Launch index.html (currently only tested in Firefox).
	2) Specify the input JSON YAML file.
			- A template is included in example.yml
			- A useful JSON YAML validator and converter can be found here: http://yaml-online-parser.appspot.com/
	3) Mark the main image in the Marking Phase.
			- Simply click to designate a mother cell.
			- Hold down the click for at least one second (or until the image frame turns green) to designate a mother cell that has a daughter. The next click will designate a daughter cell. 
	4) Once finished with marking the cells, go to the annotation phase, where the user can cycle both through the z-stack and through the previously marked cells. 
	5) Click "Save Cell Info" to save the current cell's annotations.
	6) When done, click "DONE", and the annotation results are shown in the "Output" Tab.