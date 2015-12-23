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

var PRODUCTID = "11"; //BRAIN="01", OHM64="02", BLOCK="03", CODE="04", MCD="05", MCP="06", OHMRGB="07", CNTRLR="08", BRAIN2="09", ENLIGHTEN="0A", ALIAS8="0B", BASE="0C", BRAINJR="0D"
const FADER_COLORS = [96, 124, 108, 120, 116, 100, 104, 112]
const DEFAULT_MIDI_ASSIGNMENTS = {'mode':'chromatic', 'offset':36, 'vertoffset':12, 'scale':'Chromatic', 'drumoffset':0, 'split':false}
const LAYERSPLASH = [63, 69, 70, 65]
const USERBUTTONMODE = "F0 00 01 61 "+PRODUCTID+" 42 01 01 01 01 01 01 01 01 01 01 01 01 01 01 01 01 01 01 01 01 01 01 01 01 01 01 01 01 01 01 01 01 F7";
const MIDIBUTTONMODE = "F0 00 01 61 "+PRODUCTID+" 42 03 03 03 03 03 03 03 03 03 03 03 03 03 03 03 03 03 03 03 03 03 03 03 03 03 03 03 03 03 03 03 03 F7";
const LIVEBUTTONMODE = "F0 00 01 61 "+PRODUCTID+" 42 05 05 05 05 05 05 05 05 05 05 05 05 05 05 05 05 05 05 05 05 05 05 05 05 05 05 05 05 05 05 05 05 F7";
const SPLITBUTTONMODEDRUMS = "F0 00 01 61 "+PRODUCTID+" 42 01 01 01 01 05 05 05 05 01 01 01 01 05 05 05 05 01 01 01 01 05 05 05 05 01 01 01 01 05 05 05 05 F7";
const SPLITBUTTONMODEKEYS = "F0 00 01 61 "+PRODUCTID+" 42 01 01 01 01 01 01 01 01 01 01 01 01 01 01 01 01 05 05 05 05 05 05 05 05 05 05 05 05 05 05 05 05F7";
const STREAMINGON = "F0 00 01 61 "+PRODUCTID+" 42 7F F7";
const STREAMINGOFF = "F0 00 01 61 "+PRODUCTID+" 42 00 F7";
const LINKFUNCBUTTONS = "F0 00 01 61 "+PRODUCTID+" 44 01 F7";
const DISABLECAPFADERNOTES = "F0 00 01 61 "+PRODUCTID+" 3C 00 00 00 00 00 00 00 00 00 F7";
//const QUERYSURFACE = 'F0 7E 7F 06 01 F7';

isShift = false;

loadAPI(1);

host.defineController("Livid Instruments", "BASEII", "1.0", "afdf52d0-32b7-11e4-8c21-0800200c9a66"); 
var LIVIDRESPONSE = "F0 7E ?? 06 02 00 01 61 01 00 "+PRODUCTID+" 00 ?? ?? ?? ?? F7";
host.defineSysexDiscovery("F0 7E 7F 06 01 F7", LIVIDRESPONSE);
host.defineMidiPorts(1, 1);
host.addDeviceNameBasedDiscoveryPair(["Base2"], ["Base2"]);
host.addDeviceNameBasedDiscoveryPair(["Base2 MIDI 1"], ["Base2 MIDI 1"]);
host.addDeviceNameBasedDiscoveryPair(["Base2 Base_Controls"], ["Base2 Base_Controls"]);

for ( var m = 1; m < 9; m++)
{
	host.addDeviceNameBasedDiscoveryPair(["MIDIIN" + m + " (Base8)"], ["MIDIIN" + m + " (Base8)"]);
}

const TOUCHRUNNERS = [68, 69, 70, 71, 72, 73, 73, 74, 75];
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

var DEBUG = false;		//post() doesn't work without this
var VERSION = '1.0';
var VERBOSE = false;

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
	
	post('BASE script loading ------------------------------------------------');

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
	setup_tasks();
	setup_modes();
	setup_notifications();
	setup_usermodes();
	setup_fixed_controls();
	setup_listeners();
	setupTests();

	LOCAL_OFF();
	MainModes.change_mode(0, true);
	post('BASE script loaded! ------------------------------------------------');
	notifier.show_message('Base Script version ' + VERSION +' loaded.');
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
	script['runnerbank'] = new Grid(8, 0, 'Runners');
	script['touch_runners'] = [];
	for (var i = 0;i < 8; i++)
	{
		touch_runners[i] = new Button(TOUCHRUNNERS[i], 'TouchRunners_'+i);
		runnerbank.add_control(i, 0, touch_runners[i]);
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
	session.set_verbose(VERBOSE);
}

function setup_mixer()
{
	mixer = new MixerComponent('Mixer', 8, 4, trackBank, undefined, cursorTrack, masterTrack);
	mixer.set_verbose(VERBOSE);

}

function setup_device()
{
	device = new DeviceComponent('Device', 8, cursorDevice);
	device._enabled._onValue = colors.GREEN;
	device.set_verbose(VERBOSE);
}

function setup_transport()
{
	transport = new TransportComponent('Transport');
	transport.set_verbose(VERBOSE);
}

function setup_instrument_control()
{
	instrument = new AdaptiveInstrumentComponent('Instrument', {'drum':[4, 4, 0, 0], 'keys':[8, 2, 0, 2], 'drumseq':[4, 4, 4, 0], 'keysseq':[8, 2, 0, 0]}, lcd);
	instrument._splitMode.set_value(0);
	instrument._select.set_value(0);
	instrument._drums._noteOffset._increment = 4;
	instrument.set_verbose(VERBOSE);
}

function setup_notifications()
{
	notifier = new NotificationDisplayComponent();
	notifier.add_subject(MainModes, 'Mode', ['ClipPage', 'SendPage', 'DevicePage', 'SeqPage'], 9);
	notifier.add_subject(instrument._stepsequencer._flip, 'Flip Mode', undefined, 4);
	notifier.add_subject(instrument._keys._noteOffset, 'Root Note', NOTENAMES, 4, 'Keys');
	notifier.add_subject(instrument._drums._noteOffset, 'Root Note', NOTENAMES, 4, 'Drums');

	notifier.add_subject(instrument._keys._scaleOffset, 'Scale', SCALENAMES, 4, 'Keys');
	notifier.add_subject(instrument._keys._vertOffset, 'Vertical Offset', undefined, 4, 'Keys');
	notifier.add_subject(device._device_name, 'Device', undefined, 6, 'Device');
	notifier.add_subject(device._bank_name, 'Bank', undefined, 6, 'Device');
	for(var i=0;i<8;i++)
	{
		notifier.add_subject(device._parameter[i].displayed_name, 'Parameter', undefined, 5, 'Param_'+i);
		notifier.add_subject(device._parameter[i].displayed_value, 'Value', undefined, 5, 'Param_'+i);
		notifier.add_subject(device._macro[i], 'Macro : ' + i +  '  Value', undefined, 5);
	}
	notifier.add_subject(mixer._selectedstrip._track_name, 'Selected Track', undefined, 8, 'Main');
	notifier.add_subject(session._trackOffset, 'Track', undefined, 3, 'Nav');
	notifier.add_subject(session._sceneOffset, 'Scene', undefined, 3, 'Nav');
}

function setup_tasks()
{
	tasks = new TaskServer(script, 100);
}

function setup_modes()
{
	drum_sub = new Grid(4, 4, 'DrumSub');
	keys_sub = new Grid(8, 2, 'KeysSub');
	drum_page_sub = new Grid(4, 2, 'DrumPageSub');
	keys_page_sub = new Grid(8, 1, 'KeysPageSub');
	session_sub = new Grid(7, 4, 'SessionHoldSub');

	channelControlsSub = new Page('channelControlsSub');
	channelControlsSub.enter_mode = function()
	{
		post('channelControlsSub entered');
		sendSysex(LIVEBUTTONMODE);
		for(var i=0;i<8;i++)
		{
			mixer.channelstrip(i)._mute.set_control(grid.get_button(i, 0));
			mixer.channelstrip(i)._solo.set_control(grid.get_button(i, 1));
			mixer.channelstrip(i)._arm.set_control(grid.get_button(i, 2));
			mixer.channelstrip(i)._stop.set_control(grid.get_button(i, 3));
		}
		channelControlsSub.active = true;
	}
	channelControlsSub.exit_mode = function()
	{
		post('channelControlsSub exit');
		for(var i=0;i<8;i++)
		{
			mixer.channelstrip(i)._mute.set_control();
			mixer.channelstrip(i)._solo.set_control();
			mixer.channelstrip(i)._arm.set_control();
			mixer.channelstrip(i)._stop.set_control();
		}
		channelControlsSub.active = false;
	}

	volumeFadersSub = new Page('VolumeFadersSub');
	volumeFadersSub.enter_mode = function()
	{
		post('volumeFadersSub entered');
		sendSysex('F0 00 01 61 '+PRODUCTID+' 3D 07 07 07 07 07 07 07 07 02 F7');
		faderbank.reset();
		for(var i=0;i<8;i++)
		{
			mixer.channelstrip(i)._volume.set_control(faders[i]);
		}
		volumeFadersSub.active = true;
	}
	volumeFadersSub.exit_mode = function()
	{
		post('volumeFadersSub exit');
		for(var i=0;i<8;i++)
		{
			mixer.channelstrip(i)._volume.set_control();
		}
		volumeFadersSub.active = false;
	}

	instrumentControlsSub = new Page('ScalesControlsSub');
	instrumentControlsSub.enter_mode = function()
	{
		sendSysex('F0 00 01 61 '+PRODUCTID+' 3D 07 07 07 07 07 07 07 07 02 F7');
		for(var i=0;i<8;i++)
		{
			mixer.channelstrip(i)._volume.set_control(faders[i]);
		}
		transport._overdub.set_control(touch_buttons[0]);
		instrument.set_vert_offset_buttons(touch_buttons[3], touch_buttons[2]);
		instrument.set_scale_offset_buttons(touch_buttons[5], touch_buttons[4]);
		instrument.set_note_offset_buttons(touch_buttons[7], touch_buttons[6]);
		instrument.update();
	}
	instrumentControlsSub.exit_mode = function()
	{
		for(var i=0;i<8;i++)
		{
			mixer.channelstrip(i)._volume.set_control();
		}
		instrument.set_vert_offset_buttons();
		instrument.set_scale_offset_buttons();
		instrument.set_note_offset_buttons();
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
		sendSysex('F0 00 01 61 '+PRODUCTID+' 3D 07 07 07 07 07 07 07 07 02 F7');
		grid.reset();
		faderbank.reset();
		session_sub.sub_grid(grid, 0, 7, 0, 4);
		session.assign_grid(session_sub);
		session._scene_launch.set_controls(buttons[7]);
		session.set_nav_buttons(function_buttons[4], function_buttons[5], function_buttons[7], function_buttons[6]);
	}
	clipLaunch.exit_mode = function()
	{
		volumeFadersSub.exit_mode();
		session.assign_grid();
		session._scene_launch.set_controls();
		session.set_nav_buttons();
		session_sub.clear_buttons();
	}
			
	
	//Page 0:  Send Control and Instrument throughput
	clipPage = new Page('ClipPage');
	clipPage.enter_mode = function()
	{
		post('clipPage entered');
		sendSysex('F0 00 01 61 '+PRODUCTID+' 3D 07 07 07 07 07 07 07 07 02 F7');
		sendSysex(LIVEBUTTONMODE);
		altClipLaunchSub.enter_mode();
		grid.reset();
		faderbank.reset();
		touch_runners[0].reset();
		touch_runners[1].reset();
		session.assign_grid(grid);
		session.set_nav_buttons(function_buttons[4], function_buttons[5], function_buttons[7], function_buttons[6]);
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
		altClipLaunchSub.exit_mode();
		post('clipPage exited');
	}
	clipPage.update_mode = function()
	{
		post('clipPage updated');
		grid.reset();
		altClipLaunchSub.exit_mode();
		if(clipPage._shifted)
		{
			session.assign_grid();
			volumeFadersSub.enter_mode();
			channelControlsSub.enter_mode();
		}
		else
		{
			volumeFadersSub.exit_mode();
			channelControlsSub.exit_mode();
			clipPage.enter_mode();
		}
	}

	//Page 1:  Send and Return Controls
	sendPage = new Page('SendPage');
	sendPage.enter_mode = function()
	{
		post('sendPage entered');
		sendSysex('F0 00 01 61 '+PRODUCTID+' 3D 05 05 05 05 04 04 04 04 02 F7');
		grid.reset();
		faderbank.reset();
		altClipLaunchSub.enter_mode();
		if(track_type_name._value=='Instrument')
		{
			sendSysex(USERBUTTONMODE);
			instrument.assign_grid(grid);
		}
		else
		{
			sendSysex(LIVEBUTTONMODE);
			session.assign_grid(grid);
		}
		for(var i=0;i<4;i++)
		{
			mixer.selectedstrip()._send[i].set_control(faders[i]);
			mixer.returnstrip(i)._volume.set_control(faders[i+4]);
		}
		for(var i=0;i<8;i++)
		{
			mixer.channelstrip(i)._select.set_control(touch_buttons[i]);
		}
		transport._overdub.set_control(touch_runners[0]);
		transport._clipautowrite.set_control(touch_runners[1]);
		//device._enabled.set_control(touch_runners[1]);
		session._record_clip.set_control(function_buttons[4]);
		session._create_clip.set_control(function_buttons[5]);
		session._slot_select.set_inc_dec_buttons(function_buttons[7], function_buttons[6]);
		sendPage.set_shift_button(function_buttons[1]);
		sendPage.active = true;
	}
	sendPage.exit_mode = function()
	{
		altClipLaunchSub.exit_mode();
		session.assign_grid();
		session._record_clip.set_control();
		session._create_clip.set_control();
		session._slot_select.set_inc_dec_buttons();
		//instrument._stepsequencer.set_nav_buttons();
		instrument.assign_grid();
		for(var i=0;i<4;i++)
		{
			mixer.selectedstrip()._send[i].set_control();
			mixer.returnstrip(i)._volume.set_control();
		}
		transport._overdub.set_control();
		transport._clipautowrite.set_control();
		device._enabled.set_control();
		sendPage.set_shift_button();
		sendPage.active = false;
		post('sendPage exited');
	}
	sendPage.update_mode = function()
	{
		post('sendPage shift');
		grid.reset();
		faderbank.reset();
		touch_runners[0].reset();
		touch_runners[1].reset();
		if(sendPage._shifted)
		{
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
			instrument.assign_grid();
			session.assign_grid();
			if(track_type_name._value=='Instrument')
			{
				instrumentControlsSub.enter_mode();
				instrument.assign_grid(grid);
			}
			else
			{
				volumeFadersSub.enter_mode();
				channelControlsSub.enter_mode();
			}
			//device._enabled.set_control(touch_buttons[1]);
			transport._clipautowrite.set_control(touch_buttons[1]);
		}
		else
		{
			//device._enabled.set_control();
			transport._clipautowrite.set_control();
			volumeFadersSub.exit_mode();
			channelControlsSub.exit_mode();
			instrumentControlsSub.exit_mode();
			sendPage.enter_mode();
		}
	}

	//Page 2:  Device Control and Mod control
	devicePage = new Page('DevicePage');
	devicePage.enter_mode = function()
	{
		post('devicePage entered');
		sendSysex('F0 00 01 61 '+PRODUCTID+' 3D 06 06 06 06 06 06 06 06 02 F7');
		grid.reset();
		faderbank.reset();
		altClipLaunchSub.enter_mode();
		if(track_type_name._value=='Instrument')
		{
			sendSysex(USERBUTTONMODE);
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
		transport._overdub.set_control(touch_runners[0]);
		device._enabled.set_control(touch_runners[1]);
		device.set_shared_controls(faders.slice(0, 8));
		device._mode.set_value(0);
		session._record_clip.set_control(function_buttons[4]);
		session._create_clip.set_control(function_buttons[5]);
		session._slot_select.set_inc_dec_buttons(function_buttons[7], function_buttons[6]);	
		devicePage.set_shift_button(function_buttons[2]);
		devicePage.active = true;
	}
	devicePage.exit_mode = function()
	{
		transport._overdub.set_control();
		device._enabled.set_control();
		altClipLaunchSub.exit_mode();
		session.assign_grid();
		session._record_clip.set_control();
		session._create_clip.set_control();
		session._slot_select.set_inc_dec_buttons();
		instrument.assign_grid();
		for(var i=0;i<8;i++)
		{
			mixer.channelstrip(i)._select.set_control();
		}
		transport._overdub.set_control();
		device._enabled.set_control();
		device.set_shared_controls();
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
		touch_runners[0].reset();
		touch_runners[1].reset();
		if(devicePage._shifted)
		{
			altClipLaunchSub.exit_mode();
			device.set_nav_buttons(function_buttons[5], function_buttons[4], function_buttons[7], function_buttons[6]);
			device._enabled.set_control(touch_buttons[1]);
			session.assign_grid();
			if(track_type_name._value=='Instrument')
			{
				instrumentControlsSub.enter_mode();	
				for(var i=0;i<8;i++)
				{
					mixer.channelstrip(i)._select.set_control();
					instrument.assign_grid(grid);
				}
			}
			else
			{
				volumeFadersSub.enter_mode();
				channelControlsSub.enter_mode();
			}
		}
		else
		{
			device.set_nav_buttons();
			device._enabled.set_control();
			instrumentControlsSub.exit_mode();
			volumeFadersSub.exit_mode();
			channelControlsSub.exit_mode();
			devicePage.enter_mode();
		}
	}

	//Page 3:  Instrument and Sequencer
	seqPage = new Page('DevicePage');
	seqPage.enter_mode = function()
	{
		post('seqPage entered');
		sendSysex('F0 00 01 61 '+PRODUCTID+' 3D 03 03 03 03 03 03 03 03 02 F7');
		sendSysex(MIDIBUTTONMODE);
		grid.reset();
		faderbank.reset();
		device.set_shared_controls(faders.slice(0, 8));
		device._mode.set_value(1);
		device._enabled.set_control(touch_runners[1]);
		transport._overdub.set_control(touch_runners[0]);
		session._record_clip.set_control(function_buttons[4]);
		session._create_clip.set_control(function_buttons[5]);
		session._slot_select.set_inc_dec_buttons(function_buttons[7], function_buttons[6]);
		altClipLaunchSub.enter_mode();
		if(track_type_name._value=='Instrument')
		{
			instrument._primary_instrument._value == 'DrumMachine' ? sendSysex(SPLITBUTTONMODEDRUMS) : sendSysex(SPLITBUTTONMODEKEYS);	
			//instrument._splitMode.set_value(1);  //this is causing issues 
			//instrument._stepsequencer._accent.set_control(faders[0]);
			instrument._splitMode._value = 1;
			instrument._select.set_value(1);
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
		instrument._select.set_value(0);
		instrument.assign_explicit_grids();
		instrument.assign_grid();
		instrument._splitMode._value = 0;
		//instrument._splitMode.set_value(0);  //this is causing issues
		session.set_nav_buttons();
		session._slot_select.set_inc_dec_buttons();
		for(var i=0;i<8;i++)
		{
			mixer.channelstrip(i)._select.set_control();
		}
		transport._overdub.set_control();
		device._enabled.set_control();
		device.set_shared_controls();
		device._enabled.set_control();
		transport._overdub.set_control();
		seqPage.set_shift_button();
		seqPage.active = false;
		post('devicePage exited');
	}
	seqPage.update_mode = function()
	{
		post('devicePage updated');
		grid.reset();
		faderbank.reset();
		touch_runners[0].reset();
		touch_runners[1].reset();
		if(seqPage._shifted)
		{
			instrument._shift._value = 1;
			//instrument._select.set_value(1);
			altClipLaunchSub.exit_mode();
			session.assign_grid();
			instrument.assign_grid();
			instrument._stepsequencer._follow.set_control(function_buttons[4]);
			instrument._stepsequencer._flip.set_control(function_buttons[5]);
			instrument._select_only.set_value(1);
			device.set_nav_buttons(undefined, undefined, function_buttons[7], function_buttons[6]);
			device._enabled.set_control(touch_buttons[1]);
			if(track_type_name._value=='Instrument')
			{
				for(var i=0;i<8;i++)
				{
					mixer.channelstrip(i)._select.set_control();
				}
				instrumentControlsSub.enter_mode();
				if(instrument._primary_instrument._value == 'DrumMachine')
				{
					instrument._quantization.set_controls([buttons[4][2], buttons[5][2], buttons[6][2], buttons[7][2], buttons[4][3], buttons[5][3], buttons[6][3]]);
					instrument._stepsequencer._triplet.set_control(buttons[7][3]);
				}
				else
				{
					instrument._quantization.set_controls([buttons[0][1], buttons[1][1], buttons[2][1], buttons[3][1], buttons[4][1], buttons[5][1], buttons[6][1]]);
					instrument._stepsequencer._triplet.set_control(buttons[7][1]);
				}
				drum_sub.sub_grid(grid, 0, 4, 0, 4);
				keys_sub.sub_grid(grid, 0, 8, 2, 4);
				drum_page_sub.sub_grid(grid, 4, 8, 0, 2);
				keys_page_sub.sub_grid(grid, 0, 8, 0, 1);
				instrument.assign_explicit_grids(drum_sub, keys_sub, drum_page_sub, keys_page_sub);
				//instrument._select.set_value(0);
			}
			else
			{
				volumeFadersSub.enter_mode();
				channelControlsSub.enter_mode();
			}
		}
		else
		{
			instrument._shift._value = 0;
			instrument._select_only.set_value(0);
			instrumentControlsSub.exit_mode();
			instrument.assign_explicit_grids();
			drum_sub.clear_buttons();
			keys_sub.clear_buttons();
			drum_page_sub.clear_buttons();
			keys_page_sub.clear_buttons();
			instrument._quantization.set_controls();
			instrument._stepsequencer._triplet.set_control();
			volumeFadersSub.exit_mode();
			channelControlsSub.exit_mode();
			device.set_nav_buttons();
			device._enabled.set_control();
			seqPage.enter_mode();
		}
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
	function_buttons[3].set_on_off_values(colors.GREEN);
	function_buttons[4].set_on_off_values(colors.WHITE);
	function_buttons[5].set_on_off_values(colors.WHITE);
	function_buttons[6].set_on_off_values(colors.WHITE);
	function_buttons[7].set_on_off_values(colors.WHITE);
}

function setup_usermodes()
{
	/*user1Input = host.getMidiInPort(0).createNoteInput("BaseUser1", "80????", "90????", "D0????", "E0????");
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
		sendSysex('F0 00 01 61 '+PRODUCTID+' 3D 01 01 01 01 01 01 01 01 02 F7');
		UserModes.set_mode_buttons([function_buttons[4], function_buttons[5], function_buttons[6], function_buttons[7]]);
		UserModes.restore_mode();
	}
	userPage.exit_mode = function()
	{
		UserModes.current_page().exit_mode();
		UserModes.set_mode_buttons();
	}
	*/

}

function setup_fixed_controls()
{
	mixer._masterstrip._volume.set_control(faders[8]);
}

function setup_listeners()
{
	track_type_name = new Parameter('track_type_name_listener');
	cursorTrack.addTrackTypeObserver(20, 'None', track_type_name.receive);
	track_type_name.add_listener(on_track_type_name_changed);

	track_type = new Parameter('track_type_listener', {javaObj:cursorTrack.getCanHoldNoteData(), monitor:'addValueObserver'});

	selected_track_selected_clipslot = new Parameter('selected_track_selected_clipslot_listener', {javaObj:cursorTrack.getClipLauncher(), monitor:'addIsPlayingObserver'});
	selected_track_selected_clipslot.add_listener(on_selected_track_selected_clipslot_changed);

	//scene_offset = new Parameter('scene_offset', {javaObj:trackBank});
	//trackBank.addSceneScrollPositionObserver(onSceneOffsetChanged, 1);

}

function onSceneOffsetChanged(i)
{
	post('onSceneOffsetChanged', i);
}

function on_selected_track_selected_clipslot_changed(obj)
{
	//post('on_selected_track_selected_clipslot_changed:', obj._value);
	//cursorTrack.getClipLauncher().select(obj._value);
}

//this reports "Instrument" or "Audio" depending on the type of track selected
function on_track_type_name_changed(type_name)
{
	var page = MainModes.current_page();
	if((page == sendPage)||(page == devicePage)||(page == seqPage))
	{
		page.refresh_mode();
	}
	tasks.addTask(session.select_playing_clip, [], 1, false, 'select_playing_clip');
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
	//printSysex(data);
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
	//testEnumSetting = new Setting('testEnumSetting', 'enum', {category:'testCategory', options:['off', 'on', 'inBetween'], initialValue:'no value'});
	//testNumberSetting = new Setting('testNumberSetting', 'number', {category:'testCategory', minValue:0, maxValue:127, stepResolution:8, unit:'blahs', initialValue:0});
	//testSignalSetting = new Setting('testSignalSetting', 'signal', {category:'testCategory', action:'sendSignal'});
	//testStringSetting = new Setting('testStringSetting', 'string', {category:'testCategory', numChars:8, initialText:'no value'});
}

function setup_socket()
{
	theSocket = createRemoteConnection('remote', 7400);
	send_hello();
}

function send_hello()
{
	host.sendDatagramPacket('remote', 7400, '/blessed/is/the/data')
}


