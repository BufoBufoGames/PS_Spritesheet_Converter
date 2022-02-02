// ----------------------------------------------------------------
// filename: PuzzleScript_Spritesheet_Converter.js
// project:  PuzzleScript Spritesheet Converter
// author:   Nathan Dobby
// created:  2022-01-21
// ----------------------------------------------------------------

var spritesheetLoaded = false;
var pageLoaded = false;
var convertSpritesheetRequested = false;

var fileInput = null;
var spriteDimensions = null;
var processingStatusText = null;
var displayDiv = null;
var spriteNameText = null;
var convertButton = null;
var outputTextbox = null;
var copyButton = null;
var errorText = null;

var spritesheetImage = null;
var processingCanvas = null;

var onError = function() { spritesheetLoadedCallback(false); }
var onLoad = function() { spritesheetLoadedCallback(true); }

// Load callbacks
window.onload = pageLoadedCallback;

function isEverythingLoaded()
{
	return ((spritesheetLoaded == true) && (pageLoaded == true));
}

function spritesheetLoadedCallback(loadResult)
{
	if (loadResult == true)
	{
		spritesheetLoaded = true;
		
		processingStatusText.textContent = "Spritesheet Loaded!";
		
		displayDiv.style.backgroundImage = "url('" + spritesheetImage.src + "')";
		
		attemptConvertSpritesheet();
	}
	else
	{
		alert("Failed loading resources.");
	}
}

function fileSelected()
{
	processingStatusText.textContent = "";
	displayDiv.style.backgroundImage = "";
	
	// If a file has been selected, load it!
	if (fileInput.files.length > 0)
	{
		processingStatusText.textContent = "Loading file...";
		
		let spritesheetFile = fileInput.files[0];
		
		if (!spritesheetFile.type)
		{
			processingStatusText.textContent = "Error: The File.type property does not appear to be supported on this browser.";
			return;
		}
		
		if (!spritesheetFile.type.match("image.*"))
		{
			processingStatusText.textContent = "Error: The selected file does not appear to be an image."
			return;
		}
		
		spritesheetImage = new Image();
		spritesheetImage.onerror = onError;
		spritesheetImage.onload = onLoad;
		spritesheetImage.src = URL.createObjectURL(spritesheetFile);
	}
}

function pageLoadedCallback()
{
	pageLoaded = true;
	
	// Cache page elements
	fileInput = document.getElementById('fileInput');
	spriteDimensions = document.getElementById('spriteDimensions');
	processingStatusText = document.getElementById('processingStatus');
	displayDiv = document.getElementById('displayDiv');
	spriteNameText = document.getElementById('spriteNameText');
	convertButton = document.getElementById('convertButton');
	outputTextbox = document.getElementById('outputText');
	copyButton = document.getElementById('copyButton');
	errorText = document.getElementById('errorText');
	
	// Create canvas
	processingCanvas = document.createElement('canvas');
	processingCanvas.width = 256;
	processingCanvas.height = 256;
	
	// Set event handlers
	fileInput.addEventListener('change', fileSelected);
	convertButton.onclick = onConvertButtonClicked;
	copyButton.onclick = onCopyButtonClicked;
	
	attemptConvertSpritesheet();
}

// On submit button pressed, generate gif
function attemptConvertSpritesheet()
{
	if (convertSpritesheetRequested == true)
	{
		if (isEverythingLoaded())
		{
			convertSpritesheetRequested = false;
			
			convertSpritesheet();
		}
	}
}

function onConvertButtonClicked()
{
	convertSpritesheetRequested = true;
	
	attemptConvertSpritesheet();
}

function onCopyButtonClicked()
{
	outputTextbox.focus();
	outputTextbox.select();
	
	try
	{
		var successful = document.execCommand('copy');
		
		if (successful)
		{
			processingStatusText.textContent = "Successfully copied data.";
		}
		else
		{
			processingStatusText.textContent = "Copy failed!";
		}
	}
	catch (err)
	{
		processingStatusText.textContent = "Copy failed!";
	}
}

function intToHexPaddedUpper(val)
{
	return ("0" + (val.toString(16))).slice(-2).toUpperCase();
}

function convertSpritesheet()
{
	// Clear the output text area
	errorText.value = "";
	outputTextbox.value = "";
	
	var spriteDimension = spriteDimensions.value;
	
	var canvasContext = processingCanvas.getContext('2d');
	
	// Grab the list of sprite object names here
	var spriteNameArray = spriteNameText.value.split(/[\s,]+/);
	
	var outputText = "";
	var spriteIndex = -1;
	var spritesConverted = 0;
	
	var cellWidth = Math.floor(spritesheetImage.width / spriteDimension);
	var cellHeight = Math.floor(spritesheetImage.height / spriteDimension);
	
	for (let yCell = 0; yCell < cellHeight; yCell++)
	{
		for (let xCell = 0; xCell < cellWidth; xCell++)
		{
			let colourList = [];
			let colourText = "";
			let pixelText = "";
			
			canvasContext.clearRect(0, 0, processingCanvas.width, processingCanvas.height);
			
			// First draw the sprite for this cell
			canvasContext.drawImage(spritesheetImage, (xCell * spriteDimension), (yCell * spriteDimension), spriteDimension, spriteDimension, 0, 0, spriteDimension, spriteDimension);
			
			// Next grab the image data back out of the canvas
			let imageData = canvasContext.getImageData(0, 0, spriteDimension, spriteDimension);
			
			// Then iterate over each pixel, finding unique colours and building a colour index array
			for (let yPixel = 0; yPixel < spriteDimension; yPixel++)
			{
				for (let xPixel = 0; xPixel < spriteDimension; xPixel++)
				{
					let dataIndex = (((yPixel * spriteDimension) + xPixel) * 4);
					
					// Alpha is not supported in PuzzleScript, if the alpha value is 0, this pixel is blank
					if (imageData.data[dataIndex + 3] == 0)
					{
						pixelText += ".";
					}
					else
					{
						// Build a colour string for this pixel
						let pixelColour = "#" + intToHexPaddedUpper(imageData.data[dataIndex + 0])
												+ intToHexPaddedUpper(imageData.data[dataIndex + 1])
												+ intToHexPaddedUpper(imageData.data[dataIndex + 2]);
						
						let colourIndex = colourList.indexOf(pixelColour);
						
						// If the colour already exists in the array, use that index, otherwise add the colour
						if (colourIndex == -1)
						{
							colourIndex = (colourList.push(pixelColour) - 1);
						}
						
						pixelText += colourIndex.toString();
					}
				}
				
				pixelText += "\n";
			}
			
			// If the colour list is empty, this cell is empty, skip this sprite
			if (colourList.length == 0)
			{
				continue;
			}
			else
			{
				// If there is image data, increment the sprite index
				spriteIndex += 1;
				
				if (colourList.length > 10)
				{
					errorText.value += "ERROR! Sprite at coords x: " + (xCell * spriteDimension) + " y: " + (yCell * spriteDimension) + " could not be processed - Too many colours. Found " + colourList.length + " colours. Max colours is 10\n";
					
					continue;
				}
				
				spritesConverted += 1;
				
				// Build the colour list string
				for (let col = 0; col < colourList.length; col++)
				{
					if (col != 0)
					{
						colourText += " ";
					}
					
					colourText += colourList[col];
				}
				
				// Add the output to the textbox
				
				// Object name
				if (spriteNameArray.length > spriteIndex)
				{
					outputTextbox.value += spriteNameArray[spriteIndex] + "\n";
				}
				else
				{
					outputTextbox.value += "Sprite" + spriteIndex + "\n";
					
					errorText.value +=  "Warning! Insufficient object names provided. Only " + spriteNameArray.length + " names found. Object will use default name of: Sprite" + spriteIndex + "\n";
				}
				
				outputTextbox.value += colourText + "\n";
				outputTextbox.value += pixelText + "\n";
			}
		}
	}
	
	processingStatusText.textContent = "Spritesheet Converted! " + spritesConverted + " valid sprite(s) found.";
}
