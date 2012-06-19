// using "pageshow" jquery mobile event for doc ready since pageCreate() has a bug w/ select menus - https://github.com/jquery/jquery-mobile/issues/1055


function initWriter() {

	var canvas = $('#scoreCanvas')[0];
    var canvasOffset = $('#scoreCanvas').offset();
		
	var renderer = new Vex.Flow.Renderer(canvas, Vex.Flow.Renderer.Backends.CANVAS);
	
	var ctx = renderer.getContext();
	
	var stave, 
		formatter, 
		voice, 
		noteOffsetLeft, 
		tickIndex = 0, 
		noteIndex = 0, 
		numBeats = 4, 
		beatValue = 4,
        key = "C",
		cursorHeight = 150;
	
	// create notes array for storing music score in vexflow format
	var notes = new Array();
	addNote(60,'q');
	
	// click events
	canvas.addEventListener("click", scoreOnClick, false);

	// updates canvas offset position on resize event for canvas mouse clicks 
	$(window).bind( "throttledresize", setCanvasOffset );
	
	// functions
	
	function scoreOnClick(e) {
	
		// if notes exist enable canvas click event
		if (notes.length > 0) {
			
			// mouse event handler code from: http://diveintohtml5.org/canvas.html
			var x, y;

			if (e.pageX != undefined && e.pageY != undefined) {
				x = e.pageX;
				y = e.pageY;
			}
			else {
				x = e.clientX + document.body.scrollLeft +
						document.documentElement.scrollLeft;
				y = e.clientY + document.body.scrollTop +
						document.documentElement.scrollTop;
			}
			
			
			x -= canvasOffset.left;
			y-=  canvasOffset.top;
			
			findNote(x);
			
			ctx.clear();
			processStave();
			processNotes();
			highlightNote();
			drawStave();
			drawNotes();
		}
	}
	
	
	// finds note on the canvas based on x coordinate value and sets tickIndex and noteIndex accordingly
	function findNote(xcord) {

		if (formatter.tContexts.map[tickIndex] == undefined) {				
			tickIndex -= notes[notes.length-1].ticks;
		}
		
		var dif = canvas.width;
		
		// set tickIndex for note
		for (var note in formatter.tContexts.map){

			// skip bar notes in note array
			if (formatter.tContexts.map[note].maxTicks == 0) {
				continue;
			}
		
			if (Math.abs( noteOffsetLeft + formatter.tContexts.map[note].x + formatter.tContexts.map[tickIndex].width  - xcord) < dif) {
				dif = Math.abs( noteOffsetLeft + formatter.tContexts.map[note].x + formatter.tContexts.map[tickIndex].width - xcord);
				tickIndex = note;
			}
		}

/*
		// if user clicks for a new note (anything to the right of the last existing note)
		if ((noteOffsetLeft + formatter.tContexts.map[tickIndex].x + formatter.tContexts.map[tickIndex].width + 30 - xcord) < 0) {
			
			tickIndex = 0;
			
			for (var i=0; i <= notes.length-1; i++) {
				tickIndex += notes[i].ticks;
			}
			
			noteIndex = notes.length;
		}
*/
	
		// set noteIndex for 'notes' array based on tickIndex 'map' object
		var i = 0;
		
		for (var note in formatter.tContexts.map){
		
			if ( tickIndex == note) {
				noteIndex = i;
				break;
			}
			
			i++;
		}
	}
    
    function updateIndex(noteInd) {
    
        noteIndex = noteInd;
        tickIndex = 0;
			
        for (var i=0; i <= noteIndex-1; i++) {
            tickIndex += notes[i].ticks;
        }
    
    }
	
	
	function addNote(pitch, dur) {
    
        var key = "" + Vex.Flow.integerToNote(pitch%12) + "/" + Math.floor(pitch/12);
        var accidental = Vex.Flow.keyProperties.note_values[Vex.Flow.integerToNote(pitch%12)].accidental;
        if (!accidental)
            accidental = "none";
        
        var staveNoteObj = {keys: [key], duration: dur, accidental: accidental, stem_direction : pitch > 59 ? Vex.Flow.StaveNote.STEM_DOWN : Vex.Flow.StaveNote.STEM_UP};
		
		// update to work for editing notes but not adding notes
        
        var newNote;
        if (staveNoteObj.accidental == "none") {
            newNote = new Vex.Flow.StaveNote(staveNoteObj);
        } else {
            newNote = new Vex.Flow.StaveNote(staveNoteObj).addAccidental(0, new Vex.Flow.Accidental(accidental));
        }
        newNote.pitch = pitch;
		
			// edit existing note
			if (noteIndex <= notes.length-1) {
                notes.splice(noteIndex, 1, newNote);
			}
			// add new note
			else {
                // add new note to end of notes array
                notes.push(newNote);
                noteIndex = notes.length;
			}
				
			ctx.clear();
			processStave();
            processMeasures();
			processNotes();
			drawStave();
			drawNotes();
			
			if (noteIndex > notes.length-1) {
				// calculate note index for map array
				tickIndex = 0;
				
				for (var i=0; i <= notes.length-1; i++) {
				
					tickIndex += notes[i].ticks;
				}
			}
			
			highlightNote();
			
	}
	
	
	function deleteNote() {
		
		notes.splice(noteIndex, 1);
		
		ctx.clear();
		processStave();
		drawStave();
		if (notes.length > 0) {
			processNotes();
            processMeasures();
			drawNotes();
		}
 
		highlightNote();
		
	}
	
	function processStave() {

		var staveSize = 800;
		
		/*// set stave width
		if (notes.length < 6) {
			staveSize = 550;
		}
		else {
			// about 85 pixels per note
			staveSize = (notes.length+1) * 85;
		}*/
		
		stave = new Vex.Flow.Stave(10, 20, staveSize);

		stave.addClef("treble");
		
		// add time
		stave.addTimeSignature(numBeats + "/" + beatValue);
		
		// add key
		stave.addKeySignature(key);
		
		// calc offset for first note - accounts for pixels used by treble clef & time signature & key signature
		noteOffsetLeft = stave.start_x + stave.glyph_start_x;
	}
	
	
	function processNotes() {

		// add new measure if necessary
		processMeasures();
		
		// create a voice in 4/4
		voice = new Vex.Flow.Voice({
			num_beats: numBeats,
			beat_value: beatValue,
			resolution: Vex.Flow.RESOLUTION
		});
		
		// turn off tick counter
		voice.setStrict(false);
		
		// Add notes to voice
		voice.addTickables(notes);
    
		// Format and justify the notes
		//var voiceSize = notes.length * 85 - 50;
        var voiceSize = 800;
		
		formatter = new Vex.Flow.Formatter().joinVoices([voice]).format([voice], voiceSize);
	}

	
	function highlightNote() {
		
		ctx.fillStyle = "rgba(200,0,0,0.4)";
		
		// if notes exist
		if (notes.length > 0) {

			// when adding a new note vs. editing an existing note draw the cursor for next new note 
			//(the tickIndex will be undefined in map object for a new note)
			if (formatter.tContexts.map[tickIndex] == undefined) {
                if (noteIndex > 0) {
                    updateIndex(noteIndex-1);
                    highlightNote();
                }
				/*
                var tempIndex = tickIndex - notes[notes.length-1].ticks;
				
				ctx.fillRect(noteOffsetLeft + formatter.tContexts.map[tempIndex].x + 60, 10, 16.5, cursorHeight);
                */
			}
			else {
				ctx.fillRect(noteOffsetLeft + formatter.tContexts.map[tickIndex].x, 10, formatter.tContexts.map[tickIndex].width 
					+ formatter.tContexts.map[tickIndex].padding*2, cursorHeight);
			}
			
		}
		else {
			ctx.fillRect(noteOffsetLeft, 10, 16, cursorHeight);
		}
		
		ctx.fillStyle = "#000";
	}
	
	function processMeasures() {
		
		// sum ticks and add new measures when neccessary
		var sumTicks = 0;
		var totalTicksPerMeasure = 1024 * numBeats * beatValue;
		
		for ( var i = 0; i < notes.length; i++) {
		
			if (notes[i].duration == "b") {
				sumTicks = 0;
				continue;
			}
		
			if (sumTicks == totalTicksPerMeasure) {
				
                var bar = new Vex.Flow.BarNote();
                bar.isBar = true;
				notes.splice(i,0,bar);
				noteIndex++;
				sumTicks = 0;
			}
			
			sumTicks += notes[i].ticks;
		}
		
	}
	
	
	function drawStave() {
		stave.setContext(ctx).draw();
	}
	
	function drawNotes() {
		voice.draw(ctx, stave);
	}
	 
	function setCanvasOffset() {
		canvasOffset = $('#scoreCanvas').offset();
	}
    
    document.onkeydown = (function(key) {
        var key = window.event || key;
        //console.log(key.keyIdentifier)
        switch(key.keyIdentifier) {
        case "Left":
            scrollLeft();
        break;
        case "Up":
            changePitch(1);
        break;
        case "Right":
            scrollRight();
        break;
        case "Down":
            changePitch(-1);
        break;
        case "Enter":
            validateNote();
        break;
        case "U+0008": // Backspace
            if (notes.length > 1)
                deleteNote();
        break;
        case "U+0031":
            changeDuration('32');
        break;
        case "U+0032":
            changeDuration('16');
        break;
        case "U+0033":
            changeDuration('8');
        break;
        case "U+0034":
            changeDuration('q');
        break;
        case "U+0035":
            changeDuration('h');
        break;
        case "U+0036":
            changeDuration('w');
        break;
        }
    });

function scrollLeft() {
    if (noteIndex != 0) {
        if (notes[noteIndex].isTemp) {
            deleteNote();
        } else {
            updateIndex(noteIndex - 1);
            if (notes[noteIndex].isBar)
                scrollLeft();
        }
        ctx.clear();
        processStave();
        processMeasures();
        processNotes();
        drawStave();
        drawNotes();
        highlightNote();
    }
}

function scrollRight() {
    if (notes.length == 0) {
            // Create new temp note
            addNote(60,"8");
            updateIndex(0);
            notes[noteIndex].isTemp = true;
    }
    else if (!(notes[noteIndex].isTemp)) {
        if (noteIndex == notes.length-1) {
            // Create temp note
            updateIndex(noteIndex + 1);
            addNote(notes[noteIndex-1].pitch,notes[noteIndex-1].duration);
            notes[noteIndex].isTemp = true;
        } else {
            // Move forward
            updateIndex(noteIndex + 1);
        }
        if (notes[noteIndex].isBar) {
            if (noteIndex < notes.length)
                scrollRight();
            else
                scrollLeft();
        }
        ctx.clear();
        processStave();
        processMeasures();
        processNotes();
        drawStave();
        drawNotes();
        highlightNote();
    }
}

function changePitch(steps) {
    var newPitch = notes[noteIndex].pitch + steps;
    var newDur = notes[noteIndex].duration;
    var isTemp = notes[noteIndex].isTemp;
    addNote(newPitch,newDur);
    notes[noteIndex].isTemp = isTemp;
}

function changeDuration(newDur) {
    var newPitch = notes[noteIndex].pitch;
    var isTemp = notes[noteIndex].pitch;
    addNote(newPitch,newDur);
    notes[noteIndex].isTemp = isTemp;
    ctx.clear();
    processStave();
    processNotes();
    drawStave();
    drawNotes();
    highlightNote();
}

function validateNote() {
    notes[noteIndex].isTemp = false;
    scrollRight();
}


}