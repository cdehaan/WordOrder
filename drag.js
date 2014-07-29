var textXML;
var wordBoxDivArray = new Array();
var blanksSpanArray = new Array();
var blanksFloatDivArray = new Array();
var currentWordLocationArray = new Array(); // The location of [the word box #i (index)] is what is stored there.
// +100 means in a blank
// currentWordLocationArray[1] = 102  => word 1 is in blank 2 (0 indexed)

var locations = {
	staticStartX : -1, // touch start X
	staticStartY : -1, // touch start Y
	currentPageX : -1, // touch drag X
	currentPageY : -1  // touch drag Y
}

var statusFlags = {  
	stretchUpRatio : 1,
	numberOfWords : -1,    // number of words, and blanks, in the phrase
	currentWord : null,      // if a word is dragged or tapped, it's value goes here
	touchHasMoved : false, // Used to distinguish taps and drags
	selectedWord : false,  // A word box was tapped, the rest of the screen is dim
	selectedBlank : false  // A blank was tapped, awaiting a word
}

function init() {
	statusFlags.stretchUpRatio = $(window).height() / $(window).width();
	textXML = loadTests();
	makeWordBoxes();
	setupPhraseArea();
	arrangeWords();
	repositionWordDivs(true);
	window.addEventListener("orientationchange", orientationChangeFunction, false);
	window.scrollTo(0,0);
}

function onTouchWordStart(e) {
	e.preventDefault();
	statusFlags.currentWord = e.currentTarget;
  locations.staticStartX = e.targetTouches[0].pageX;
  locations.staticStartY = e.targetTouches[0].pageY;
  locations.currentPageX = e.targetTouches[0].pageX;
  locations.currentPageY = e.targetTouches[0].pageY;
	statusFlags.touchHasMoved = false;
}

function onTouchWordMove(e) {
	e.preventDefault();
	e.currentTarget.style.left = parseInt(e.currentTarget.style.left) + e.targetTouches[0].pageX - locations.currentPageX + "px";
	e.currentTarget.style.top = parseInt(e.currentTarget.style.top) + e.targetTouches[0].pageY - locations.currentPageY + "px";
  locations.currentPageX = e.targetTouches[0].pageX;
  locations.currentPageY = e.targetTouches[0].pageY;
	statusFlags.touchHasMoved = true;

	// cancels tapping a word into place, since now we're dragging
	e.currentTarget.style.zIndex="0";
	document.getElementById("rootDiv").style.visibility = "hidden";	
	for (var i=0; i < statusFlags.numberOfWords; i++) blanksFloatDivArray[i].style.visibility = "hidden";
	statusFlags.selectedWord = false;
	// cancels tapping a word into place, since now we're dragging
}

function onTouchWordEnd(e) {
	e.preventDefault();
	var elementX = -1;
	var elementY = -1;
	var elementClimb;

	// a word was dragged //
	if (statusFlags.touchHasMoved) {
		// Search for a blank that was filled
		for (var i=0; i < statusFlags.numberOfWords; i++) {
			elementClimb = blanksSpanArray[i]; // each blank space
			for (elementX=0, elementY=0; elementClimb != null; elementX += elementClimb.offsetLeft, elementY += elementClimb.offsetTop, elementClimb = elementClimb.offsetParent);
			if (locations.currentPageX > elementX && locations.currentPageX < elementX  + blanksSpanArray[i].offsetWidth && locations.currentPageY > elementY && locations.currentPageY < elementY + blanksSpanArray[i].offsetHeight) { // released over a blank
				// The blank we dropped on is i

			  // Check for and move out an existing word before dropping in a new one //
			  for (var j=0; j < statusFlags.numberOfWords; j++) {
				  if (currentWordLocationArray[j]==100+i) {
						wordBoxDivArray[j].style.visibility = "visible";
						wordBoxDivArray[j].innerText = blanksSpanArray[i].innerText;
						wordBoxDivArray[j].style.left = locations.staticStartX - ($(e.currentTarget).innerWidth()  /2);
						wordBoxDivArray[j].style.top  = locations.staticStartY - ($(e.currentTarget).innerHeight() /2);
						currentWordLocationArray[j] = 0;
					}
				}
			  // Check for and move out an existing word before dropping in a new one //

				blanksSpanArray[i].innerText = e.currentTarget.innerText;
				e.currentTarget.style.visibility = "hidden";
				positionFloatingBlanks();
				currentWordLocationArray[parseInt(e.currentTarget.name)] = 100+i;
				return; // word is put in place, don't want to risk doing anything else to it now
			}
		}
		repositionWordDivs(false);
	}
	// a word was dragged //
	
	// a word was tapped //	
	else if (!statusFlags.selectedWord) { // no word is selected now, so highlight a word
		e.currentTarget.style.zIndex="10";
		document.getElementById("rootDiv").style.visibility = "visible";
		var aWordIsInThisBlank;
		for (var i=0; i < statusFlags.numberOfWords; i++) { // i - each blank
			aWordIsInThisBlank = false;
			for (var j=0; j < statusFlags.numberOfWords; j++) { // j - each word
				if (currentWordLocationArray[j] == 100+i) aWordIsInThisBlank = true;
			}
			if (!aWordIsInThisBlank) blanksFloatDivArray[i].style.visibility = "visible";
		}
		statusFlags.selectedWord = true;
	} // no word is selected now, so highlight a word
	
	else if (e.currentTarget.innerText == statusFlags.currentWord.innerText) { // tapped the same word twice
		e.currentTarget.style.zIndex="0";
		document.getElementById("rootDiv").style.visibility = "hidden";	
		for (var i = 0; i < statusFlags.numberOfWords; i++) blanksFloatDivArray[i].style.visibility = "hidden";
		statusFlags.selectedWord = false;
	} // tapped the same word twice
	
	else { // a word is selected - This might never fire?
		for (var i=0; i < statusFlags.numberOfWords; i++) { // for each blank
			elementClimb = blanksSpanArray[i]; // each blank space
			for (elementX=0, elementY=0; elementClimb != null; elementX += elementClimb.offsetLeft, elementY += elementClimb.offsetTop, elementClimb = elementClimb.offsetParent);
			if (locations.currentPageX > elementX
			 && locations.currentPageX < elementX  + blanksSpanArray[i].offsetWidth
			 && locations.currentPageY > elementY
			 && locations.currentPageY < elementY + blanksSpanArray[i].offsetHeight) { // tapped a blank
				blanksSpanArray[i].innerText = e.currentTarget.innerText;
				e.currentTarget.style.visibility = "hidden";
				document.getElementById("rootDiv").style.visibility = "hidden";
				for (var j=0; j < statusFlags.numberOfWords; j++) blanksFloatDivArray[j].style.visibility = "hidden";
				positionFloatingBlanks();
			}
		}
	} // a word is selected - This might never fire?
	// a word was tapped //	

} // onTouchWordEnd


function onTouchBlankStart(e) {
	e.preventDefault();
	statusFlags.currentWord = null;
	e.currentTarget.innerHTML = "[&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;]";
	positionFloatingBlanks();
	for (var i=0; i < statusFlags.numberOfWords; i++) {
		if (parseInt(currentWordLocationArray[i]) == parseInt(e.currentTarget.name) +100 ) {
			currentWordLocationArray[i] = 0;
			statusFlags.currentWord = wordBoxDivArray[i];
			statusFlags.currentWord.style.visibility = "visible";
			statusFlags.currentWord.style.left = (e.targetTouches[0].pageX - $(statusFlags.currentWord).innerWidth() /2) + "px";
			statusFlags.currentWord.style.top  = (e.targetTouches[0].pageY - $(statusFlags.currentWord).innerHeight()/2) + "px";
		} // if we found which word is in the blank
	}
  locations.currentPageX = e.targetTouches[0].pageX;
  locations.currentPageY = e.targetTouches[0].pageY;
}

function onTouchBlankMove(e) {
	e.preventDefault();
	if (statusFlags.currentWord == null) {
		// Maybe nothing is good, when you drag from an empty blank
	} // this blank is empty

	// this blank has a word //
	else {
		statusFlags.currentWord.style.left = (parseInt(statusFlags.currentWord.style.left) + e.targetTouches[0].pageX - locations.currentPageX) + "px";
		statusFlags.currentWord.style.top  = (parseInt(statusFlags.currentWord.style.top)  + e.targetTouches[0].pageY - locations.currentPageY) + "px";
		//statusFlags.currentWord.name // this is the word's index
		//e.currentTarget.name // this is the blank's index
	} // this blank has a word

  locations.currentPageX = e.targetTouches[0].pageX;
  locations.currentPageY = e.targetTouches[0].pageY;
}

function onTouchBlankEnd(e) {
	e.preventDefault();
	repositionWordDivs();
}

function onTouchFloatingBlankStart(e) {
	e.preventDefault();
	currentWordLocationArray[parseInt(statusFlags.currentWord.name)] = parseInt(e.currentTarget.name) + 100;
	blanksSpanArray[parseInt(e.currentTarget.name)].innerText = statusFlags.currentWord.innerText;
	for (var i = 0; i < statusFlags.numberOfWords; i++) blanksFloatDivArray[i].style.visibility = "hidden";
	statusFlags.currentWord.style.left = (e.targetTouches[0].pageX - $(statusFlags.currentWord).innerWidth() /2) + "px";
	statusFlags.currentWord.style.top  = (e.targetTouches[0].pageY - $(statusFlags.currentWord).innerHeight()/2) + "px";
	statusFlags.currentWord.style.zIndex="0";
	statusFlags.currentWord.style.visibility = "hidden";
	document.getElementById("rootDiv").style.visibility = "hidden";
	positionFloatingBlanks();
}

function loadTests() {
	var xmlDoc;
	parser = new DOMParser();
	xmlhttp = new XMLHttpRequest();
	//xmlhttp.open("GET","phraseTests.xml",false); // Only works in the same domain
	xmlhttp.open("GET","http://truematchbox.com/drag/dataSender.php",false);
	xmlhttp.send();
	if (xmlhttp.responseXML != null) 	xmlDoc = xmlhttp.responseXML; 
	else xmlDoc = parser.parseFromString(xmlhttp.responseText,"text/xml");
	statusFlags.numberOfWords = xmlDoc.getElementsByTagName("test")[0].getElementsByTagName("word").length;
	return xmlDoc;
}

function makeWordBoxes() {
	for (var i=0; i < statusFlags.numberOfWords; i++) {
		wordBoxDivArray[i] = document.createElement('div');
		wordBoxDivArray[i].className = "wordDiv"; 
		wordBoxDivArray[i].name = i;
		wordBoxDivArray[i].innerHTML = textXML.getElementsByTagName("test")[0].getElementsByTagName("word")[i].childNodes[0].nodeValue;
		wordBoxDivArray[i].addEventListener( 'touchstart', onTouchWordStart, false);
		wordBoxDivArray[i].addEventListener( 'touchmove',  onTouchWordMove,  false);
		wordBoxDivArray[i].addEventListener( 'touchend',   onTouchWordEnd,   false);
		document.body.appendChild(wordBoxDivArray[i]);
		currentWordLocationArray[i] = i;
	}
	shuffle(currentWordLocationArray);
}

function arrangeWords() {
	var previousWord = null;
  for (var i = 0; i < statusFlags.numberOfWords; i++) { // each space

		for (j = 0; j < statusFlags.numberOfWords; j++) { // each word
		  if (currentWordLocationArray[j] == i) { // this is the next word I want to add to the list of possible words
				if (previousWord == null) { // this is the first word we're adding
					wordBoxDivArray[j].style.top = ($("#answerSpaceDiv").innerHeight() + 40) +"px";
					wordBoxDivArray[j].style.left = "20px";
					previousWord = wordBoxDivArray[j];
				}
				else { // it goes after another word

					// It needs to go on a new line, no horizontal space
					if (parseInt(previousWord.style.left) + $(previousWord).innerWidth() + $(wordBoxDivArray[j]).innerWidth() + 40 > $("#rootDiv").innerWidth()) {
						wordBoxDivArray[j].style.top = (parseInt(previousWord.style.top) + $(previousWord).innerHeight() + 20)+ "px";
						wordBoxDivArray[j].style.left = "20px";
					}
					
					// It can fit on the current line
					else {
						wordBoxDivArray[j].style.left = (parseInt(previousWord.style.left) + $(previousWord).innerWidth() + 20) + "px";
						wordBoxDivArray[j].style.top = parseInt(previousWord.style.top) + "px";
					}

					previousWord = wordBoxDivArray[j];
				} // This isn't the first word we added
			} // We found a word to add
		} // Looking at all the words we might want to add into the space
	} // Looking at all the spaces to put words in
}

function setupPhraseArea() {
	document.getElementById("answerSpaceDiv").innerHTML = textXML.getElementsByTagName("test")[0].getElementsByTagName("setPhrase")[0].childNodes[0].nodeValue;
	for (var i=0; i < statusFlags.numberOfWords; i++) {
		document.getElementById("answerSpaceDiv").innerHTML = document.getElementById("answerSpaceDiv").innerHTML.replace("[ ]","&nbsp;<span class='blankSpan' name='" + i + "' id='blankSpan" + i + "'>[&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;]</span>&nbsp;");
	}
	for (var i=0; i < statusFlags.numberOfWords; i++) {
		blanksSpanArray[i] = document.getElementById("blankSpan" + i);
		blanksSpanArray[i].name = i;
		blanksSpanArray[i].addEventListener( 'touchstart', onTouchBlankStart, false);
		blanksSpanArray[i].addEventListener( 'touchmove',  onTouchBlankMove,  false);
		blanksSpanArray[i].addEventListener( 'touchend',   onTouchBlankEnd,   false);

		blanksFloatDivArray[i] = document.createElement('div');
		blanksFloatDivArray[i].className = "floatingBlankDiv"; 
		blanksFloatDivArray[i].id = "floatingBlankDiv" + i;
		blanksFloatDivArray[i].name = i;
		document.body.appendChild(blanksFloatDivArray[i]);
		blanksFloatDivArray[i].addEventListener( 'touchstart', onTouchFloatingBlankStart, false);		
	}
	positionFloatingBlanks();
}

function positionFloatingBlanks() {
	for (var i=0; i < statusFlags.numberOfWords; i++) {
		elementClimb = blanksSpanArray[i]; // each blank space
		for (elementX=0, elementY=0; elementClimb != null; elementX += elementClimb.offsetLeft, elementY += elementClimb.offsetTop, elementClimb = elementClimb.offsetParent);
		blanksFloatDivArray[i].style.top  = (elementY+1) + "px";
		blanksFloatDivArray[i].style.left = (elementX+1) + "px";
		blanksFloatDivArray[i].style.height = $(blanksSpanArray[i]).innerHeight();
		blanksFloatDivArray[i].style.width  = $(blanksSpanArray[i]).innerWidth()-1;
	}
}

function repositionWordDivs(runAtInit) {
	for (var i=0; i < statusFlags.numberOfWords; i++) {
		var rightLimit = $("#rootDiv").innerWidth() - $(wordBoxDivArray[i]).innerWidth() /2;
		var lowerLimit = $("#rootDiv").innerHeight()- $(wordBoxDivArray[i]).innerHeight() - 2;
		if (parseInt(wordBoxDivArray[i].style.left) < 0) wordBoxDivArray[i].style.left = ((-1) * $(wordBoxDivArray[i]).innerWidth()  /2) + "px";
		if (parseInt(wordBoxDivArray[i].style.top)  < 0) wordBoxDivArray[i].style.top  = ((-1) * $(wordBoxDivArray[i]).innerHeight() /2) + "px";
		if (parseInt(wordBoxDivArray[i].style.left) > rightLimit) wordBoxDivArray[i].style.left = rightLimit + "px";
		if (parseInt(wordBoxDivArray[i].style.top)  > lowerLimit) wordBoxDivArray[i].style.top  = lowerLimit + "px";
	}
}

function shuffle(array) {
  var currentIndex = array.length
    , temporaryValue
    , randomIndex
    ;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

function OLDorientationChangeFunction(event) {
	var elementClimb;
//	alert(window.orientation); // degrees
//	alert($("#rootDiv").innerWidth());
//	alert(parseInt(wordBoxDivArray[1].style.top));
//	alert($("#rootDiv").innerWidth());
//	alert($(wordBoxDivArray[1]).innerHeight());
	for (var i=0; i < statusFlags.numberOfWords; i++) {
		elementClimb = wordBoxDivArray[i]; // each word box
		for (elementX=0, elementY=0; elementClimb != null; elementX += elementClimb.offsetLeft, elementY += elementClimb.offsetTop, elementClimb = elementClimb.offsetParent);
		//alert("Compare " + parseInt(wordBoxDivArray[i].style.top) + " to " + ($("#rootDiv").innerWidth() - wordBoxDivArray[i].innerHeight()));
		if (elementX > $("#rootDiv").innerWidth() - $(wordBoxDivArray[i]).innerWidth()) {
			wordBoxDivArray[i].style.left = $("#rootDiv").innerWidth() - $(wordBoxDivArray[i]).innerWidth() + "px";
		} // a word was too far right
		if (elementY > $("#rootDiv").innerHeight() - $(wordBoxDivArray[i]).innerHeight()) {
			wordBoxDivArray[i].style.top = $("#rootDiv").innerHeight() - $(wordBoxDivArray[i]).innerHeight() + "px";
		} // a word was too low
	} // check each word, maybe it went off the screen
}

function orientationChangeFunction(event) {
	var elementClimb;
	var tempRatio = statusFlags.stretchUpRatio;
	if (window.orientation == 90 || window.orientation == 270) tempRatio = 1/tempRatio;
	for (var i=0; i < statusFlags.numberOfWords; i++) {
		elementClimb = wordBoxDivArray[i]; // each word box
		for (elementX=0, elementY=0; elementClimb != null; elementX += elementClimb.offsetLeft, elementY += elementClimb.offsetTop, elementClimb = elementClimb.offsetParent);
		wordBoxDivArray[i].style.left = parseInt(wordBoxDivArray[i].style.left) / tempRatio;
		wordBoxDivArray[i].style.top  = parseInt(wordBoxDivArray[i].style.top)  * tempRatio;
	} // check each word, maybe it went off the screen
}
