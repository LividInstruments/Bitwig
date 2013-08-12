
const _base_translations =	{'0': 0,
						'1': 1,
						'2': 2,
						'3': 3,
						'4': 4,
						'5': 5,
						'6': 6,
						'7': 7,
						'8': 8,
						'9': 9,
						'A': 10,
						'B': 11,
						'C': 12,
						'D': 13,
						'E': 14,
						'F': 15,
						'G': 16,
						'H': 17,
						'I': 18,
						'J': 19,
						'K': 20,
						'L': 21,
						'M': 22,
						'N': 23,
						'O': 24,
						'P': 25,
						'Q': 26,
						'R': 27,
						'S': 28,
						'T': 29,
						'U': 30,
						'V': 31,
						'W': 32,
						'X': 33,
						'Y': 34,
						'Z': 35,
						'a': 10,
						'b': 11,
						'c': 12,
						'd': 13,
						'e': 14,
						'f': 15,
						'g': 16,
						'h': 17,
						'i': 18,
						'j': 19,
						'k': 20,
						'l': 21,
						'm': 22,
						'n': 23,
						'o': 24,
						'p': 25,
						'q': 26,
						'r': 27,
						's': 28,
						't': 29,
						'u': 30,
						'v': 31,
						'w': 32,
						'x': 33,
						'y': 34,
						'z': 35,
						'_': 39, 
						'-': 42};


const FADER_COLORS = [96, 124, 108, 120, 116, 100, 104, 112]
const DEFAULT_MIDI_ASSIGNMENTS = {'mode':'chromatic', 'offset':36, 'vertoffset':12, 'scale':'Chromatic', 'drumoffset':0, 'split':false}
const LAYERSPLASH = [63, 69, 70, 65]
const USERBUTTONMODE = 'F0 00 01 61 0C 42 01 01 01 01 01 01 01 01 01 01 01 01 01 01 01 01 01 01 01 01 01 01 01 01 01 01 01 01 01 01 01 01 F7';
const MIDIBUTTONMODE = 'F0 00 01 61 0C 42 03 03 03 03 03 03 03 03 03 03 03 03 03 03 03 03 03 03 03 03 03 03 03 03 03 03 03 03 03 03 03 03 F7';
const LIVEBUTTONMODE = 'F0 00 01 61 0C 42 05 05 05 05 05 05 05 05 05 05 05 05 05 05 05 05 05 05 05 05 05 05 05 05 05 05 05 05 05 05 05 05 F7';
const SPLITBUTTONMODE = 'F0 00 01 61 0C 42 03 03 03 03 05 05 05 05 03 03 03 03 05 05 05 05 03 03 03 03 05 05 05 05 03 03 03 03 05 05 05 05 F7';
const STREAMINGON = 'F0 00 01 61 0C 42 7F F7';
const STREAMINGOFF = 'F0 00 01 61 0C 42 00 F7';
const LINKFUNCBUTTONS = 'F0 00 01 61 0C 44 01 F7';
const DISABLECAPFADERNOTES = 'F0 00 01 61 0C 3C 00 00 00 00 00 00 00 00 00 F7';
//const QUERYSURFACE = 'F0 7E 7F 06 01 F7';

isShift = false;

loadAPI(1);

//host.defineController("Livid Instruments", "BASE", "1.0", "aa7a2670-9d2c-11e2-9e96-0800200c9a66");
host.defineController("Livid Instruments", "BASE8", "1.0", "ba4ceb20-ca25-11e2-8b8b-0800200c9a66");
var PRODUCT = "0C"; //BRAIN="01", OHM64="02", BLOCK="03", CODE="04", MCD="05", MCP="06", OHMRGB="07", CNTRLR="08", BRAIN2="09", ENLIGHTEN="0A", ALIAS8="0B", BASE="0C", BRAINJR="0D"
var LIVIDRESPONSE = "F0 7E ?? 06 02 00 01 61 01 00 "+PRODUCT+" 0 ?? ?? ?? ?? F7";
host.defineSysexDiscovery("F0 7E 7F 06 01 F7", "F0 7E ?? 06 02 00 01 61 01 00 0C 00 ?? ?? ?? ?? F7");
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
var session;

var DEBUG = true;		//post() doesn't work without this


load("Prototypes.js");

function init()
{

	////////////////////////////////////////////////////////////////////////////////
	// Everything here is taken from the BW script, just leaving it for reference //
	application = host.createApplicationSection();
	cursorDevice = host.createCursorDeviceSection(8);
	cursorTrack = host.createCursorTrackSection(4, 8);
	//cursorClip = host.createCursorClipSection(128, 1);
	//groove = host.createGrooveSection();
	masterTrack = host.createMasterTrackSection(0);
	//transport = host.createTransportSection();
	//clipGrid = host.createTrackBankSection(8, 0, 4);
	trackBank = host.createTrackBankSection(8, 4, 4);
	//_mixer = host.createMixerSection("MIX", 0);
	//arranger = host.createArrangerSection(0);
	//primaryInstrument = cursorTrack.getPrimaryInstrument();
	////////////////////////////////////////////////////////////////////////////////
	
	post('BASE8 script loading ------------------------------------------------');

	host.getMidiInPort(0).setMidiCallback(onMidi);
	host.getMidiInPort(0).setSysexCallback(onSysex);
	initialize_noteInput();
	initialize_prototypes();
	initialize_surface();
	setup_controls();
	resetAll();
	setupTests();
	setup_session();
	setup_mixer();
	setup_device();
	setup_sequencer();
	setup_scales();
	setup_tasks();
	setup_modes();
	setup_fixed_controls();
	setup_listeners();

	LOCAL_OFF();
 	host.scheduleTask(updateDisplay, null, 100);
	MainModes.change_mode(0, true);
	post('BASE8 script loaded! ------------------------------------------------');
}

function initialize_noteInput()
{
	noteInput = host.getMidiInPort(0).createNoteInput("BaseInstrument", "80????", "90????", "D0????", "E0????");
	noteInput.setShouldConsumeEvents(false);
}

function initialize_surface()
{
	sendSysex(LINKFUNCBUTTONS);
	sendSysex(DISABLECAPFADERNOTES);
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
	post('setup_controls successful');
}

function setup_session()
{
	session = new SessionComponent('Session', 8, 4, trackBank);
}

function setup_mixer()
{
	mixer = new MixerComponent('Mixer', 8, 4, trackBank, cursorTrack, masterTrack);
}

function setup_device()
{
	device = new DeviceComponent('Device', 8, cursorDevice);
}

function setup_sequencer()
{
	sequencer = new StepSequencerComponent('Sequencer', 8, 4);
}

function setup_scales()
{
	scales = new ScalesComponent('Scales', sequencer);
}

function setup_tasks()
{
	tasks = new TaskServer(script, 100);
}

function setup_modes()
{
	
	volumeFadersSub = new Page('VolumeFadersSub');
	volumeFadersSub.enter_mode = function()
	{
		post('volumeFadersSub entered');
		sendSysex('F0 00 01 61 0C 3D 07 07 07 07 07 07 07 07 02 F7');
		faderbank.reset();
		for(var i=0;i<8;i++)
		{
			mixer.channelstrip(i)._volume.set_control(faders[i]);
			mixer.channelstrip(i)._mute.set_control(grid.get_button(i, 0));
			mixer.channelstrip(i)._solo.set_control(grid.get_button(i, 1));
			mixer.channelstrip(i)._arm.set_control(grid.get_button(i, 2));
			mixer.channelstrip(i)._stop.set_control(grid.get_button(i, 3));
		}
		volumeFadersSub.active = true;
	}
	volumeFadersSub.exit_mode = function()
	{
		post('volumeFadersSub exit');
		for(var i=0;i<8;i++)
		{
			mixer.channelstrip(i)._volume.set_control();
			mixer.channelstrip(i)._mute.set_control();
			mixer.channelstrip(i)._solo.set_control();
			mixer.channelstrip(i)._arm.set_control();
			mixer.channelstrip(i)._stop.set_control();
		}
		volumeFadersSub.active = false;
	}


		
	//Page 0:  Send Control and Instrument throughput
	clipPage = new Page('ClipPage');
	clipPage.enter_mode = function()
	{
		post('clipPage entered');
		sendSysex(LIVEBUTTONMODE);
		sendSysex('F0 00 01 61 0C 3D 07 07 07 07 07 07 07 07 02 F7');
		grid.reset();
		faderbank.reset();
		session.assign_grid(grid);
		session._navUp.set_control(function_buttons[4]);
		session._navDn.set_control(function_buttons[5]);
		session._navLt.set_control(function_buttons[6]);
		session._navRt.set_control(function_buttons[7]);
		for(var i=0;i<8;i++)
		{
			mixer.channelstrip(i)._volume.set_control(faders[i]);
			mixer.channelstrip(i)._select.set_control(touch_buttons[i]);
		}
		clipPage.set_shift_button(function_buttons[0]);
		clipPage.active = true;
	}
	clipPage.exit_mode = function()
	{
		session.assign_grid();
		session._navUp.set_control();
		session._navDn.set_control();
		session._navLt.set_control();
		session._navRt.set_control();
		for(var i=0;i<8;i++)
		{
			mixer.channelstrip(i)._volume.set_control();
			mixer.channelstrip(i)._select.set_control();
		}
		clipPage.set_shift_button();
		clipPage.active = false;
		post('clipPage exited');
	}
	clipPage.update_mode = function()
	{
		post('clipPage updated');
		grid.reset();
		if(clipPage._shifted)
		{
			session.assign_grid(null);
			for(var i=0;i<8;i++)
			{
				mixer.channelstrip(i)._mute.set_control(grid.get_button(i, 0));
				mixer.channelstrip(i)._solo.set_control(grid.get_button(i, 1));
				mixer.channelstrip(i)._arm.set_control(grid.get_button(i, 2));
				mixer.channelstrip(i)._stop.set_control(grid.get_button(i, 3));
			}
		}
		else
		{
			for(var i=0;i<8;i++)
			{
				mixer.channelstrip(i)._mute.set_control();
				mixer.channelstrip(i)._solo.set_control();
				mixer.channelstrip(i)._arm.set_control();
				mixer.channelstrip(i)._stop.set_control();
			}
			clipPage.enter_mode();
		}
	}

	//Page 1:  Send and Return Controls
	sendPage = new Page('SendPage');
	sendPage.enter_mode = function()
	{
		post('sendPage entered');
		sendSysex(LIVEBUTTONMODE);
		sendSysex('F0 00 01 61 0C 3D 05 05 05 05 04 04 04 04 02 F7');
		//grid.reset();
		//faderbank.reset();
		session.assign_grid(grid);
		session._navUp.set_control(function_buttons[4]);
		session._navDn.set_control(function_buttons[5]);
		session._navLt.set_control(function_buttons[6]);
		session._navRt.set_control(function_buttons[7]);
		for(var i=0;i<4;i++)
		{
			mixer.selectedstrip()._send[i].set_control(faders[i]);
		}
		for(var i=0;i<8;i++)
		{
			mixer.channelstrip(i)._select.set_control(touch_buttons[i]);
		}
		sendPage.set_shift_button(function_buttons[1]);
		sendPage.active = true;
	}
	sendPage.exit_mode = function()
	{
		session.assign_grid(null);
		session._navUp.set_control();
		session._navDn.set_control();
		session._navLt.set_control();
		session._navRt.set_control();
		for(var i=0;i<4;i++)
		{
			mixer.selectedstrip()._send[i].set_control();
			//mixer.set_return_control(i);
		}
		sendPage.set_shift_button();
		sendPage.active = false;
		post('sendPage exited');
	}
	sendPage.update_mode = function()
	{
		grid.reset();
		faderbank.reset();
		post('sendPage shift');
		if(sendPage._shifted)
		{
			volumeFadersSub.enter_mode();
		}
		else
		{
			volumeFadersSub.exit_mode();	
			sendPage.enter_mode();
		}
	}

	//Page 2:  Device Control and Mod control
	devicePage = new Page('DevicePage');
	devicePage.enter_mode = function()
	{
		post('devicePage entered');
		sendSysex('F0 00 01 61 0C 3D 06 06 06 06 06 06 06 06 02 F7');
		grid.reset();
		faderbank.reset();
		if(track_type._value)
		{
			sendSysex(LIVEBUTTONMODE);	
			devicePage.set_shift_button(function_buttons[3]);
			scales.assign_grid(grid);
		}
		else
		{
			sendSysex(LIVEBUTTONMODE);
			session.assign_grid(grid);
		}
		device._navUp.set_control(function_buttons[4]);
		device._navDn.set_control(function_buttons[5]);
		device._navLt.set_control(function_buttons[6]);
		device._navRt.set_control(function_buttons[7]);
		for(var i=0;i<8;i++)
		{
			device._parameter[i].set_control(faders[i]);
			mixer.channelstrip(i)._select.set_control(touch_buttons[i]);
		}
		devicePage.set_shift_button(function_buttons[2]);
		devicePage.active = true;
	}
	devicePage.exit_mode = function()
	{
		session.assign_grid();
		scales._scaleOffset.set_inc_dec_buttons();
		scales._vertOffset.set_inc_dec_buttons();
		scales.assign_grid();
		device._navUp.set_control();
		device._navDn.set_control();
		device._navLt.set_control();
		device._navRt.set_control();
		for(var i=0;i<8;i++)
		{
			device._parameter[i].set_control();
			mixer.channelstrip(i)._select.set_control();
		}
		devicePage.set_shift_button();
		devicePage.active = false;
		post('devicePage exited');
	}
	devicePage.update_mode = function()
	{
		post('devicePage updated');
		grid.reset();
		faderbank.reset();
		if(devicePage._shifted)
		{
			volumeFadersSub.enter_mode();
			for(var i=0;i<8;i++)
			{
				mixer.channelstrip(i)._select.set_control();
			}
			scales._vertOffset.set_inc_dec_buttons(touch_buttons[3], touch_buttons[2]);
			scales._scaleOffset.set_inc_dec_buttons(touch_buttons[5], touch_buttons[4]);
			scales._noteOffset.set_inc_dec_buttons(touch_buttons[7], touch_buttons[6]);
			scales._splitMode.set_control(touch_buttons[0]);
			scales.assign_grid()
		}
		else
		{
			scales._vertOffset.set_inc_dec_buttons();
			scales._scaleOffset.set_inc_dec_buttons();
			scales._noteOffset.set_inc_dec_buttons();
			scales._splitMode.set_control();
			volumeFadersSub.exit_mode();
			devicePage.enter_mode();
		}
	}


	//Page 3:  Step Sequencing
	seqPage = new Page('SequencerPage');
	seqPage.enter_mode = function()
	{
		post('seqPage entered');
		grid.reset();
		sequencer.key_offset.set_inc_dec_buttons(function_buttons[4], function_buttons[5]);
		sequencer.assign_grid(grid);
		
	}
	seqPage.exit_mode = function()
	{
		post('seqPage exited');
		sequencer.key_offset.set_inc_dec_buttons();
		sequencer.assign_grid();
		
	}

	
	script["MainModes"] = new PageStack(4, "Main Modes");
	MainModes.add_mode(0, clipPage);
	MainModes.add_mode(1, sendPage);
	MainModes.add_mode(2, devicePage);
	MainModes.add_mode(3, seqPage);
	MainModes.set_mode_buttons([function_buttons[0], function_buttons[1], function_buttons[2], function_buttons[3]]);

	function_buttons[0].set_on_off_values(colors.WHITE);
	function_buttons[1].set_on_off_values(colors.CYAN);
	function_buttons[2].set_on_off_values(colors.BLUE);
	function_buttons[3].set_on_off_values(colors.RED);
}

function setup_fixed_controls()
{
	mixer._masterstrip._volume.set_control(faders[8]);
}

function setup_listeners()
{
	selected_track = new ParameterHolder('selected_track_listener');
	cursorTrack.addIsSelectedObserver(selected_track.receive);
	selected_track.add_listener(on_selected_track_changed);
	
	primary_instrument = new ParameterHolder('primary_instrument_listener');
	cursorTrack.getPrimaryInstrument().addNameObserver(10, 'None', primary_instrument.receive);
	primary_instrument.add_listener(on_primary_instrument_name_changed);

	track_type = new ParameterHolder('track_type_listener');
	cursorTrack.getCanHoldNoteData().addValueObserver(track_type.receive);
	track_type.add_listener(on_track_type_changed);

	track_type_name = new ParameterHolder('track_type_name_listener');
	cursorTrack.addTrackTypeObserver(20, 'None', track_type_name.receive);
	track_type_name.add_listener(on_track_type_name_changed);

	selected_track_selected_clipslot = new ParameterHolder('selected_track_selected_clipslot_listener');
	cursorTrack.getClipLauncher().addIsPlayingObserver(selected_track_selected_clipslot.receive);
	selected_track_selected_clipslot.add_listener(on_selected_track_selected_clipslot_changed);
}

function on_selected_track_changed(obj)
{
	/*if(obj._value)
	{
		//post('onSelectedTrackChanged:', obj, obj._value);
		detect_new_instrument();
	}*/
	//cursorTrack.getClipLauncher()
	
}

function on_selected_track_selected_clipslot_changed(obj)
{
	post('on_selected_track_selected_clipslot_changed:', obj._value);
	cursorTrack.getClipLauncher().select(obj._value);
}

function on_primary_instrument_name_changed(new_name)
{
	post('on_primary_instrument_name_changed:', new_name._value);
}

function on_track_type_changed(is_midi)
{
	post('on_track_type_changed:', is_midi._value);
}

function on_track_type_name_changed(type_name)
{
	post('on_track_type_name_changed:', type_name._value);
}

function detect_new_instrument()
{
	var ins = cursorTrack.getPrimaryInstrument();
	post(ins);
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




function setupTests()
{
	//function_buttons[0].add_listener(poster);
	//trackBank.getTrack(0).getMute().addValueObserver(tester);
	//cursorTrack.addNameObserver(10, 'None', tester);
}

function poster(obj)
{
	post('poster', obj._name, obj._value);
}

function tester(value)
{
	post('tester', value);
}


