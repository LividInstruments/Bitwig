
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
host.addDeviceNameBasedDiscoveryPair(["Base8 MIDI 1"], ["Base8 MIDI 1"]);

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
	masterTrack = host.createMasterTrackSection(0);
	transport = host.createTransportSection();
	trackBank = host.createTrackBankSection(8, 4, 4);
	////////////////////////////////////////////////////////////////////////////////
	
	post('BASE8 script loading ------------------------------------------------');

	host.getMidiInPort(0).setMidiCallback(onMidi);
	host.getMidiInPort(0).setSysexCallback(onSysex);
	initialize_noteInput();
	initialize_prototypes();
	initialize_surface();
	setup_controls();
	setup_lcd();
	resetAll();
	setup_session();
	setup_mixer();
	setup_device();
	setup_transport();
	setup_instrument_control();
	setup_usermodes();
	//setup_tasks();
	setup_modes();
	setup_fixed_controls();
	setup_listeners();
	setupTests();

	LOCAL_OFF();
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
	script['faderbank'] = new Grid(8, 0, 'Faders');
	for (var i = 0;i < 9; i++)
	{
		faders[i] = new Slider(SLIDERS[i], 'Fader_'+i);
		faderbank.add_control(i, 0, faders[i]);
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
			grid.add_control(i, j, buttons[i][j]);
		}
	}
	post('setup_controls successful');
}

function setup_lcd()
{
	lcd = new DisplaySection('LCD', 2, 34, _base_translations, 42);
}

function setup_session()
{
	session = new SessionComponent('Session', 8, 4, trackBank);
}

function setup_mixer()
{
	mixer = new MixerComponent('Mixer', 8, 4, trackBank, undefined, cursorTrack, masterTrack);
}

function setup_device()
{
	device = new DeviceComponent('Device', 8, cursorDevice);
}

function setup_transport()
{
	transport = new TransportComponent();
}

function setup_instrument_control()
{
	instrument = new AdaptiveInstrumentComponent('Instrument', {'drum':[4, 4, 0, 0], 'keys':[8, 2, 0, 2], 'drumseq':[4, 4, 4, 0], 'keysseq':[8, 2, 0, 0]}, lcd);
}

function setup_tasks()
{
	tasks = new TaskServer(script, 100);
}

function setup_usermodes()
{
	user1Input = host.getMidiInPort(0).createNoteInput("BaseUser1", "80????", "90????", "D0????", "E0????");
	userbank1 = new UserBankComponent('UserBank1', 48, user1Input);
	user1Input.setShouldConsumeEvents(false);

	user2Input = host.getMidiInPort(0).createNoteInput("BaseUser2", "80????", "90????", "D0????", "E0????");
	userbank2 = new UserBankComponent('UserBank2', 48, user2Input);
	user2Input.setShouldConsumeEvents(false);

	user3Input = host.getMidiInPort(0).createNoteInput("BaseUser3", "80????", "90????", "D0????", "E0????");
	userbank3 = new UserBankComponent('UserBank3', 48, user3Input);
	user3Input.setShouldConsumeEvents(false);

	user4Input = host.getMidiInPort(0).createNoteInput("BaseUser4", "80????", "90????", "D0????", "E0????");
	userbank4 = new UserBankComponent('UserBank4', 48, user4Input);
	user4Input.setShouldConsumeEvents(false);
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

	instrumentControlsSub = new Page('ScalesControlsSub');
	instrumentControlsSub.enter_mode = function()
	{
		//instrument._splitMode.set_control(touch_buttons[0]);
		transport._overdub.set_control(touch_buttons[1]);
		instrument.set_vert_offset_buttons(touch_buttons[3], touch_buttons[2]);
		instrument.set_scale_offset_buttons(touch_buttons[5], touch_buttons[4]);
		instrument.set_note_offset_buttons(touch_buttons[7], touch_buttons[6]);
		instrument.update();
	}
	instrumentControlsSub.exit_mode = function()
	{
		instrument.set_vert_offset_buttons();
		instrument.set_scale_offset_buttons();
		instrument.set_note_offset_buttons();
		//instrument._splitMode.set_control();
		transport._overdub.set_control();
	}

	altClipLaunchSub = new Page('AltClipLaunchSub');
	altClipLaunchSub._last_pressed;
	altClipLaunchSub._alt = function(obj)
	{
		if(obj._value)
		{
			tasks.addTask(altClipLaunchSub.Alt, [obj], 3, false, 'AltClipLaunchSub');
		}
		else if(obj == altClipLaunchSub._last_pressed)
		{
			altClipLaunchSub._last_pressed = undefined;
			clipLaunch.exit_mode();
			MainModes.current_page().enter_mode();
		}
	}
	altClipLaunchSub.Alt = function(obj)
	{
		if(obj._value)
		{
			altClipLaunchSub._last_pressed = obj;
			MainModes.current_page().exit_mode();
			clipLaunch.enter_mode();
		}
	}
	altClipLaunchSub.enter_mode = function()
	{
		for(var i=0;i<8;i++)
		{
			touch_buttons[i].add_listener(altClipLaunchSub._alt)
		}
	}
	altClipLaunchSub.exit_mode = function()
	{
		if(!altClipLaunchSub._last_pressed)
		{
			for(var i=0;i<8;i++)
			{
				touch_buttons[i].remove_listener(altClipLaunchSub._alt)
			}
		}
	}

	clipLaunch = new Page('ClipLaunch');
	clipLaunch.enter_mode = function()
	{
		volumeFadersSub.enter_mode();
		sendSysex(LIVEBUTTONMODE);
		sendSysex('F0 00 01 61 0C 3D 07 07 07 07 07 07 07 07 02 F7');
		grid.reset();
		faderbank.reset();
		session.assign_grid(grid);
		session.set_nav_buttons(function_buttons[4], function_buttons[5], function_buttons[6], function_buttons[7]);
	}
	clipLaunch.exit_mode = function()
	{
		session.assign_grid();
		session.set_nav_buttons();
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
		session.set_nav_buttons(function_buttons[4], function_buttons[5], function_buttons[6], function_buttons[7]);
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
		session.set_nav_buttons();
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
			session.assign_grid();
			volumeFadersSub.enter_mode();
		}
		else
		{
			volumeFadersSub.exit_mode();
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
		grid.reset();
		faderbank.reset();
		if(track_type_name._value=='Instrument')
		{
			altClipLaunchSub.enter_mode();
			sendSysex(LIVEBUTTONMODE);
			instrument._splitMode._value = 0;	
			instrument.assign_grid(grid);
			instrument._stepsequencer.set_nav_buttons(function_buttons[4], function_buttons[5], function_buttons[6], function_buttons[7]);
		}
		else
		{
			sendSysex(LIVEBUTTONMODE);
			session.assign_grid(grid);
			session.set_nav_buttons(function_buttons[4], function_buttons[5], function_buttons[6], function_buttons[7]);
		}
		for(var i=0;i<4;i++)
		{
			mixer.selectedstrip()._send[i].set_control(faders[i]);
			mixer.returnstrip(i)._volume.set_control(faders[i+4]);
			//faders[i+4].reset();
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
		altClipLaunchSub.exit_mode();
		session.assign_grid();
		instrument.set_note_offset_buttons();
		instrument.set_scale_offset_buttons();
		instrument.set_vert_offset_buttons();
		instrument.assign_grid();
		instrument._stepsequencer.set_nav_buttons();
		session.set_nav_buttons();
		for(var i=0;i<4;i++)
		{
			mixer.selectedstrip()._send[i].set_control();
			mixer.returnstrip(i)._volume.set_control();
		}
		sendPage.set_shift_button();
		sendPage.active = false;
		post('sendPage exited');
	}
	sendPage.update_mode = function()
	{
		post('sendPage shift');
		grid.reset();
		faderbank.reset();
		if(sendPage._shifted)
		{
			instrument._shift._value = 1;
			altClipLaunchSub.exit_mode();
			for(var i=0;i<4;i++)
			{
				mixer.selectedstrip()._send[i].set_control();
				mixer.returnstrip(i)._volume.set_control();
			}
			for(var i=0;i<8;i++)
			{
				mixer.channelstrip(i)._select.set_control();
			}
			session.assign_grid();
			volumeFadersSub.enter_mode();
			if(track_type_name._value=='Instrument')
			{
				instrumentControlsSub.enter_mode();
			}
			var selected_component = track_type_name == 'Instrument' ?  instrument._stepsequencer : session;
			selected_component.set_nav_buttons(function_buttons[4], function_buttons[5], function_buttons[6], function_buttons[7]);
		}
		else
		{
			volumeFadersSub.exit_mode();
			instrument._shift._value = 0;
			instrumentControlsSub.exit_mode();
			instrument._stepsequencer.set_nav_buttons();
			session.set_nav_buttons();
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
		if(track_type_name._value=='Instrument')
		{
			altClipLaunchSub.enter_mode();
			sendSysex(LIVEBUTTONMODE);	
			instrument._splitMode._value = 0;
			instrument.assign_grid(grid);
		}
		else
		{
			sendSysex(LIVEBUTTONMODE);
			session.assign_grid(grid);
		}
		for(var i=0;i<8;i++)
		{
			device._parameter[i].set_control(faders[i]);
			mixer.channelstrip(i)._select.set_control(touch_buttons[i]);
		}
		device.set_nav_buttons(function_buttons[4], function_buttons[5], function_buttons[6], function_buttons[7]);
		devicePage.set_shift_button(function_buttons[2]);
		devicePage.active = true;
	}
	devicePage.exit_mode = function()
	{
		altClipLaunchSub.exit_mode();
		session.assign_grid();
		device.set_nav_buttons();
		instrument.set_note_offset_buttons();
		instrument.set_scale_offset_buttons();
		instrument.set_vert_offset_buttons();
		instrument.assign_grid();
		session.set_nav_buttons();
		for(var i=0;i<8;i++)
		{
			device._parameter[i].set_control();
			mixer.channelstrip(i)._select.set_control();
		}
		device.set_nav_buttons();
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
			instrument._shift._value = 1;
			altClipLaunchSub.exit_mode();
			device.set_nav_buttons();
			session.assign_grid();
			if(track_type_name._value=='Instrument')
			{
				instrumentControlsSub.enter_mode();	
				for(var i=0;i<8;i++)
				{
					mixer.channelstrip(i)._select.set_control();
				}
				instrument.set_nav_buttons(function_buttons[4], function_buttons[5], function_buttons[6], function_buttons[7]);
			}
			else
			{
				volumeFadersSub.enter_mode();
				session.set_nav_buttons(function_buttons[4], function_buttons[5], function_buttons[6], function_buttons[7]);
			}
		}
		else
		{
			//volumeFadersSub.exit_mode();
			instrument._shift._value = 0;
			instrumentControlsSub.exit_mode();
			instrument._stepsequencer.set_nav_buttons();
			volumeFadersSub.exit_mode();
			session.set_nav_buttons();
			devicePage.enter_mode();
		}
	}

	//Page 3:  Instrument and Sequencer
	seqPage = new Page('DevicePage');
	seqPage.enter_mode = function()
	{
		post('seqPage entered');
		sendSysex('F0 00 01 61 0C 3D 06 06 06 06 06 06 06 06 02 F7');
		grid.reset();
		faderbank.reset();
		if(track_type_name._value=='Instrument')
		{
			altClipLaunchSub.enter_mode();
			sendSysex(LIVEBUTTONMODE);	
			instrument._splitMode._value = 1;
			instrument._stepsequencer._follow.set_control(function_buttons[4]);
			instrument._stepsequencer._flip.set_control(function_buttons[5]);
			instrument._stepsequencer._accent.set_control(faders[0]);
			instrument.assign_grid(grid);
		}
		else
		{
			sendSysex(LIVEBUTTONMODE);
			session.assign_grid(grid);
		}
		for(var i=0;i<8;i++)
		{
			mixer.channelstrip(i)._select.set_control(touch_buttons[i]);
		}
		seqPage.set_shift_button(function_buttons[3]);
		seqPage.active = true;
	}
	seqPage.exit_mode = function()
	{
		altClipLaunchSub.exit_mode();
		session.assign_grid();
		instrument.set_note_offset_buttons();
		instrument.set_scale_offset_buttons();
		instrument.set_vert_offset_buttons();
		instrument._stepsequencer._follow.set_control();
		instrument._stepsequencer._flip.set_control();
		instrument._stepsequencer.set_nav_buttons();
		instrument.assign_grid();
		session.set_nav_buttons();
		for(var i=0;i<8;i++)
		{
			device._parameter[i].set_control();
			mixer.channelstrip(i)._select.set_control();
		}
		seqPage.set_shift_button();
		seqPage.active = false;
		post('devicePage exited');
	}
	seqPage.update_mode = function()
	{
		post('devicePage updated');
		grid.reset();
		faderbank.reset();
		if(seqPage._shifted)
		{
			instrument._shift._value = 1;
			altClipLaunchSub.exit_mode();
			session.assign_grid();
			if(track_type_name._value=='Instrument')
			{
				for(var i=0;i<8;i++)
				{
					mixer.channelstrip(i)._select.set_control();
				}
				instrumentControlsSub.enter_mode();
				instrument._stepsequencer._shuffleEnabled.set_control(touch_buttons[0]);
			}
			else
			{
				volumeFadersSub.enter_mode();
			}
		}
		else
		{
			instrument._shift._value = 0;
			instrumentControlsSub.exit_mode();
			instrument._stepsequencer.set_nav_buttons();
			session.set_nav_buttons();
			seqPage.enter_mode();
		}
	}

	userPage1 = new Page('UserPage1');
	userPage1.enter_mode = function()
	{
		post('userPage1 entered');
		for(var i=0;i<8;i++)
		{
			userbank1.set_control(i, faders[i]);
		}
		userbank1.set_enabled(true);
		grid.reset();
	}
	userPage1.exit_mode = function()
	{
		post('userPage1 exited');
		userbank1.set_enabled(false);
		for(var i=0;i<8;i++)
		{
			userbank1.set_control(i);
		}
	}

	userPage2 = new Page('UserPage2');
	userPage2.enter_mode = function()
	{
		post('userPage2 entered');
		for(var i=0;i<8;i++)
		{
			userbank2.set_control(i, faders[i]);
		}
		userbank2.set_enabled(true);
		grid.reset();
	}
	userPage2.exit_mode = function()
	{
		post('userPage2 exited');
		userbank2.set_enabled(false);
		for(var i=0;i<8;i++)
		{
			userbank2.set_control(i);
		}
	}

	userPage3 = new Page('UserPage3');
	userPage3.enter_mode = function()
	{
		post('userPage3 entered');
		for(var i=0;i<8;i++)
		{
			userbank3.set_control(i, faders[i]);
		}
		userbank3.set_enabled(true);
		grid.reset();
	}
	userPage3.exit_mode = function()
	{
		post('userPage3 exited');
		userbank3.set_enabled(false);
		for(var i=0;i<8;i++)
		{
			userbank3.set_control(i);
		}
	}

	userPage4 = new Page('UserPage4');
	userPage4.enter_mode = function()
	{
		post('userPage4 entered');
		for(var i=0;i<8;i++)
		{
			userbank4.set_control(i, faders[i]);
		}
		userbank4.set_enabled(true);
		grid.reset();
	}
	userPage4.exit_mode = function()
	{
		post('userPage4 exited');
		userbank3.set_enabled(false);
		for(var i=0;i<8;i++)
		{
			userbank4.set_control(i);
		}
	}

	script["UserModes"] = new PageStack(4, "User Modes");
	UserModes.add_mode(0, userPage1);
	UserModes.add_mode(1, userPage2);
	UserModes.add_mode(2, userPage3);
	UserModes.add_mode(3, userPage4);
	UserModes.add_listener(function(obj){post('UserModes mode value:', obj._name);});

	//Page 5:  User Assignments
	userPage = new Page('UserPage');
	userPage.enter_mode = function()
	{
		sendSysex('F0 00 01 61 0C 3D 01 01 01 01 01 01 01 01 02 F7');
		UserModes.set_mode_buttons([function_buttons[4], function_buttons[5], function_buttons[6], function_buttons[7]]);
		UserModes.restore_mode();
	}
	userPage.exit_mode = function()
	{
		UserModes.current_page().exit_mode();
		UserModes.set_mode_buttons();
	}
	
	
	script["MainModes"] = new PageStack(4, "Main Modes");
	MainModes.add_mode(0, clipPage);
	MainModes.add_mode(1, sendPage);
	MainModes.add_mode(2, devicePage);
	MainModes.add_mode(3, seqPage);
	MainModes.set_mode_buttons([function_buttons[0], function_buttons[1], function_buttons[2], function_buttons[3]]);
	MainModes.add_listener(display_mode);

	function_buttons[0].set_on_off_values(colors.WHITE);
	function_buttons[1].set_on_off_values(colors.CYAN);
	function_buttons[2].set_on_off_values(colors.BLUE);
	function_buttons[3].set_on_off_values(colors.RED);
	function_buttons[4].set_on_off_values(colors.WHITE);
	function_buttons[5].set_on_off_values(colors.WHITE);
	function_buttons[6].set_on_off_values(colors.WHITE);
	function_buttons[7].set_on_off_values(colors.WHITE);
}

function setup_fixed_controls()
{
	mixer._masterstrip._volume.set_control(faders[8]);
}

function setup_listeners()
{
	selected_track = new Parameter('selected_track_listener', {javaObj:cursorTrack, monitor:'addIsSelectedObserver'});
	selected_track.add_listener(on_selected_track_changed);
	
	primary_instrument = new Parameter('primary_instrument_listener');
	cursorTrack.getPrimaryInstrument().addNameObserver(10, 'None', primary_instrument.receive);
	primary_instrument.add_listener(on_primary_instrument_name_changed);

	track_type_name = new Parameter('track_type_name_listener');
	cursorTrack.addTrackTypeObserver(20, 'None', track_type_name.receive);
	track_type_name.add_listener(on_track_type_name_changed);

	track_type = new Parameter('track_type_listener', {javaObj:cursorTrack.getCanHoldNoteData(), monitor:'addValueObserver'});
	track_type.add_listener(on_track_type_changed);

	selected_track_selected_clipslot = new Parameter('selected_track_selected_clipslot_listener', {javaObj:cursorTrack.getClipLauncher(), monitor:'addIsPlayingObserver'});
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

//this reports "Instrument" or "Audio" depending on the type of track selected
function on_track_type_name_changed(type_name)
{
	var page = MainModes.current_page();
	if((page == sendPage)||(page == devicePage)||(page == seqPage))
	{
		page.refresh_mode();
	}
}

function detect_new_instrument()
{
	var ins = cursorTrack.getPrimaryInstrument();
	post(ins);
}

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


const MODE_CHARS = ['L', 'S', 'D', 'Y'];

function display_mode()
{
	char1 = MODE_CHARS[MainModes.current_mode()];

	char2 = '-'
	/*if self.shift_pressed():
		char2 = str(self._layer + 1)
	elif self.select_pressed():
		char2 = 'S'
	elif self._layer is 3:
		char2 = str(self._user_mode_selector._mode_index+1)*/
	lcd._send(char1+''+char2);
}


function setupTests()
{
	//function_buttons[0].add_listener(poster);
	//trackBank.getTrack(0).getMute().addValueObserver(tester);
	//cursorTrack.addNameObserver(10, 'None', tester);
	//tasks.addTask(tester, ['peakaboo'], true);
	
}



