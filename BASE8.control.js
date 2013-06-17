
isShift = false;

loadAPI(1);

//host.defineController("Livid Instruments", "BASE", "1.0", "aa7a2670-9d2c-11e2-9e96-0800200c9a66");
host.defineController("Livid Instruments", "BASE8", "1.0", "ba4ceb20-ca25-11e2-8b8b-0800200c9a66");
var PRODUCT = "0C"; //BRAIN="01", OHM64="02", BLOCK="03", CODE="04", MCD="05", MCP="06", OHMRGB="07", CNTRLR="08", BRAIN2="09", ENLIGHTEN="0A", ALIAS8="0B", BASE="0C", BRAINJR="0D"
var LIVIDRESPONSE = "F0 7E ?? 06 02 00 01 61 01 00 "+PRODUCT+" 0 ?? ?? ?? ?? F7";
host.defineSysexDiscovery("F0 7E 7F 06 01 F7", "F0 7E ?? 06 02 00 01 61 01 00 0C 00 ?? ?? ?? ?? F7");
host.defineMidiPorts(1, 1);
host.defineMidiPorts(1, 1);
host.addDeviceNameBasedDiscoveryPair(["Base8"], ["Base8"]);

for ( var m = 1; m < 9; m++)
{
	host.addDeviceNameBasedDiscoveryPair(["MIDIIN" + m + " (Base8)"], ["MIDIIN" + m + " (Base8)"]);
}


const TOUCHBUTTONS = [10, 11, 12, 13, 14, 15, 16, 17, 18];
const FUNCTIONBUTTONS = [18, 19, 20, 21, 22, 23, 24, 25];
const GRIDBUTTONS = [60, 61, 62, 63, 64, 65, 66, 67, 52, 53, 54, 55, 56, 57, 58, 59, 44, 45, 46, 47, 48, 49, 50, 51, 36, 37, 38, 39, 40, 41, 42, 43];
const SLIDERS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

var color =
{
	OFF : 0,
	WHITE : 1,
	CYAN : 5,
	MAGENTA : 9,
	RED : 17,
	BLUE : 33,
	YELLOW : 65,
	GREEN : 127
};

var LOCAL_OFF = function()
{
	sendChannelController(15, 122, 64);
}

var script = this;

var DEBUG = true;

var isPlaying = initArray(false, 32);
var isQueued = initArray(false, 32);
var isRecording = initArray(false, 32);
var hasContent = initArray(false, 32);
var clipArm = initArray(false, 8);

var isSelected = initArray(false, 8);
var isMute = initArray(false, 8);
var isSolo = initArray(false, 8);
var isArm = initArray(false, 8);
var isShift = false;

load("Prototypes.js");

function init()
{
	registerControlDicts();

	host.getMidiInPort(0).setMidiCallback(onMidi);
	host.getMidiInPort(0).setSysexCallback(onSysex);

	// //////////////////////////////////////////////////////////////////////*Host*/
	application = host.createApplicationSection();
	cursorDevice = host.createCursorDeviceSection(8);
	cursorTrack = host.createCursorTrackSection(3, 8);
	cursorClip = host.createCursorClipSection(128, 1);
	groove = host.createGrooveSection();
	masterTrack = host.createMasterTrackSection(0);
	transport = host.createTransportSection();
	//clipGrid = host.createTrackBankSection(8, 0, 4);
	trackBank = host.createTrackBankSection(8, 4, 4);
	mixer = host.createMixerSection("MIX", 0);
	arranger = host.createArrangerSection(0);
	primaryInstrument = cursorTrack.getPrimaryInstrument();
	
	post('BASE8 script loading ------------------------------------------------');
	setup_controls();
	resetAll();
	setup_modes();

	track_volumes = new Array(8);
	track_pans = new Array(8);
	for ( var t = 0; t < 8; t++)
	{
		var track = trackBank.getTrack(t);

 		var clipLauncher = track.getClipLauncher();
		clipLauncher.addHasContentObserver(clipPage.stateBuffer(t, hasContent));
		clipLauncher.addIsPlayingObserver(clipPage.stateBuffer(t, isPlaying));
		clipLauncher.addIsQueuedObserver(clipPage.stateBuffer(t, isQueued));
		clipLauncher.addIsRecordingObserver(clipPage.stateBuffer(t, isRecording));

		var param = track.getVolume();
		track_volumes[t] = new ParameterHolder('Volume_'+t, {'_index':t, '_parameter':param});
		track_volumes[t]._parameter.addValueObserver(128, track_volumes[t].receive);

		/*var param = track.getPan();
		track_pans[t] = new ParameterHolder('Pan_'+t, {'_index':t, '_parameter':param});
		track_pans[t]._parameter.addValueObserver(128, track_pans[t].receive);*/

		//track.addIsSelectedObserver(tracksPage.selectBuffer(i, isSelected));
		//track.getMute().addValueObserver(tracksPage.muteBuffer(i, isMute));
		//track.getSolo().addValueObserver(tracksPage.soloBuffer(i, isSolo));
		//track.getArm().addValueObserver(tracksPage.armBuffer(i, isArm));
	}
	//cursorClip = host.createCursorClipSection(32, 1);
	//cursorClip.addStepDataObserver(seqPage.onStepExists);
	//cursorClip.addPlayingStepObserver(seqPage.onStepPlay);
	LOCAL_OFF();
 	host.scheduleTask(updateDisplay, null, 100);
	MainModes.change_mode(0, true);
	post('BASE8 script loaded! ------------------------------------------------');
}


function setup_controls()
{
	script['faders'] = [];
	script['faderbank'] = new FaderBank(8, 'Faders');
	for (var i = 0;i < 9; i++)
	{
		faders[i] = new Slider(SLIDERS[i], 'Fader_'+i);
		faderbank.add_fader(i, faders[i]);
	}
	script['touch_buttons'] = [];
	for (var i = 0;i < 8; i++)
	{
		touch_buttons[i] = new Button(TOUCHBUTTONS[i], 'TouchButton_'+i);
	}	
	script['function_buttons'] = [];
	for (var i = 0;i < 8; i++)
	{
		function_buttons[i] = new Button(FUNCTIONBUTTONS[i], 'FunctionButton_'+i);
	}	
	script['buttons'] = [];
	script['buttons_CC'] = [];
	script['grid'] = new Grid(8, 4, 'Grid');
	for ( var i = 0; i< 8; i++)
	{
		buttons[i] = [];
		buttons_CC[i] = [];
		for (var j = 0; j< 4; j++)
		{
			var number = i + (j*8);
			buttons[i][j] = new Button(GRIDBUTTONS[number], 'Grid_'+i+'_'+j);
			buttons_CC[i][j] = new PadPressure(GRIDBUTTONS[number], 'PadPressure_'+i+'_'+j);
			grid.add_button(i, j, buttons[i][j]);
		}
	}
	println('setup_controls successful');
}

function setup_modes()
{
	//Page 0: Clip control and Volume Faders.
	clipPage = new Page('ClipPage');
	clipPage.grid = grid;
	clipPage.faders = faderbank;
	clipPage.enter_mode = function()
	{
		post('clipPage entered');
		clipPage.faders.set_target(wrap_callback(clipPage, clipPage.receive_faders));
		clipPage.grid.set_target(wrap_callback(clipPage, clipPage.receive_grid));
		for(var i in track_volumes)
		{
			track_volumes[i].set_target(wrap_callback(clipPage, clipPage.receive_volume));
		}
		clipPage.active = true;
		clipPage.update_grid();
		clipPage.update_faders();
	}
	clipPage.receive_grid = function(button)
	{
		post('clipPage grid in', button._name);
		trackBank.getTrack(button._x).getClipLauncher().launch(button._y);
	}
	clipPage.send_grid = function(track, scene, value)
	{
		if(clipPage.active)
		{
			clipPage.grid.send(track, scene, value);
		}
	}
	clipPage.stateBuffer = function(track, clipstate)
	{
		return function(scene, value)
		{	
			var index = track * 4 + scene;
			clipstate[index] = value;
			var state = isRecording[index] ? color.RED : isPlaying[index] ? color.GREEN : isQueued[index] ? color.YELLOW : hasContent[index] ? color.WHITE : color.OFF;
			clipPage.send_grid(track, scene, state);
		};
	}
	clipPage.update_grid = function()
	{
		for(var x = 0; x < 8; x ++)
		{
			for(var y = 0; y < 4; y++)
			{
				var index = x * 4 + y;
				var state = isRecording[index] ? color.RED : isPlaying[index] ? color.GREEN : isQueued[index] ? color.YELLOW : hasContent[index] ? color.WHITE : color.OFF;
				clipPage.send_grid(x, y, state);
			}
		}
	}
	clipPage.update_faders = function()
	{
		for(var i in track_volumes)
		{
			track_volumes[i].notify();
		}
	}
	clipPage.receive_faders = function(fader)
	{
		trackBank.getTrack(fader._x).getVolume().set(fader._value, 128);
		//post('clipPage received fader', fader._name, fader._value);
	}
	clipPage.receive_volume = function(param)
	{
		//post(this._name, 'received volume from BW:', param._index, param._value);
		if(clipPage.active)
		{
			clipPage.faders.send(param._index, param._value);
		}
	}
	clipPage.exit_mode = function()
	{
		clipPage.active = false;
		post('clipPage exited');
	}
	//clipPage.register_control(grid, wrap_callback(clipPage, clipPage.receive_grid));
	//clipPage.register_control(faders, wrap_callback(clipPage, clipPage.receive_faders));




	//Page 1:  Send Control and Instrument throughput
	sendPage = new Page('SendPage');
	sendPage.grid = grid;
	sendPage.faders = faderbank;
	sendPage.enter_mode = function()
	{
		post('sendPage entered');
		sendPage.grid.reset();
		sendPage.faders.reset();
		sendPage.faders.set_target(sendPage.controlInput);
		sendPage.active = true;
	}
	sendPage.exit_mode = function()
	{
		sendPage.active = false;
		post('sendPage exited');
	}
	sendPage.receive_faders = function(fader)
	{
		post('sendPage received fader', fader._name, fader._value);
	}
	sendPage.register_control(sendPage.faders, wrap_callback(sendPage, sendPage.receive_faders));


	//Page 2:  Device Control and Mod control
	devicePage = new Page('DevicePage');

	//Page 3:  Step Sequencing
	seqPage = new Page('SequencerPage');


	script["MainModes"] = new PageStack(4, "Main Modes");
	MainModes.add_mode(0, clipPage);
	MainModes.add_mode(1, sendPage);
	MainModes.add_mode(2, devicePage);
	MainModes.add_mode(3, seqPage);
	MainModes.set_mode_buttons([function_buttons[0], function_buttons[1], function_buttons[2], function_buttons[3]]);

}

function updateDisplay(){}

function exit()
{
	resetAll();
}

function onMidi(status, data1, data2)
{
	 //printMidi(status, data1, data2);
	if (isChannelController(status)&& MIDIChannel(status) == 0)
	{
		//post('CC: ' + status + ' ' + data1 + ' ' + data2);
		CC_OBJECTS[data1].receive(data2);
	}
	else if (isNoteOn(status) && MIDIChannel(status) == 0)
	{
		//post('NOTE: ' + status + ' ' + data1 + ' ' + data2);
		NOTE_OBJECTS[data1].receive(data2);
	}
}

function onSysex(data)
{
	printSysex(data);
}



