

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

host.defineController("Livid Instruments", "Cntrl_r", "1.0", "ff03a658-ec0e-4334-8fc7-e5bcffe28c5d");
var PRODUCT = "08"; //BRAIN="01", OHM64="02", BLOCK="03", CODE="04", MCD="05", MCP="06", OHMRGB="07", CNTRLR="08", BRAIN2="09", ENLIGHTEN="0A", ALIAS8="0B", BASE="0C", BRAINJR="0D"
var LIVIDRESPONSE = "F0 7E ?? 06 02 00 01 61 01 00 "+PRODUCT+" 0 ?? ?? ?? ?? F7";
host.defineSysexDiscovery("F0 7E 7F 06 01 F7", LIVIDRESPONSE);
host.defineMidiPorts(1, 1);
host.addDeviceNameBasedDiscoveryPair(["Cntrl_r"], ["Cntrl_r"]);
host.addDeviceNameBasedDiscoveryPair(["Cntrl_r Controls"], ["Cntrl_r Controls"]);

for ( var m = 1; m < 9; m++)
{
	host.addDeviceNameBasedDiscoveryPair(["Controls" + m + " (Cntrl_r)"], ["Controls" + m + " (Cntrl_r)"]);
}


const PADS = [0, 4, 8, 12, 1, 5, 9, 13, 2, 6, 10, 14, 3, 7, 11, 15];
const KEYS = [16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47];
const KNOBS_L = [1, 5, 9, 13, 2, 6, 10, 14, 3, 7, 11, 15];
const KNOBS_R = [17, 21, 25, 29, 18, 22, 26, 30, 19, 23, 27, 31];
const ENCODERS = [48, 51, 54, 57, 49, 52, 55, 58, 50, 53, 56, 59];
const FADERS = [4, 8, 12, 16, 20, 24, 28, 32];

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

var DEBUG = true;	//post() doesn't work without this


load("Prototypes.js");

function init()
{

	////////////////////////////////////////////////////////////////////////////////
	application = host.createApplication();
	cursorDevice = host.createCursorDeviceSection(8);
	drumgrid = cursorDevice.createDrumPadGrid(4, 4);
	cursorTrack = host.createCursorTrack(4, 8);
	masterTrack = host.createMasterTrack(0);
	//transport = host.createTransport();
	trackBank = host.createTrackBank(8, 4, 4);
	////////////////////////////////////////////////////////////////////////////////
	
	post('CNTRLR script loading ------------------------------------------------');

	host.getMidiInPort(0).setMidiCallback(onMidi);
	host.getMidiInPort(0).setSysexCallback(onSysex);
	initialize_noteInput();
	initialize_prototypes();
	initialize_surface();
	setup_controls();
	setup_session();
	setup_mixer();
	setup_device();
	setup_transport();
	setup_groove();
	setup_instrument_control();
	setup_tasks();
	setup_modes();
	setup_listeners();
	setupTests();
	//LOCAL_OFF();
	MainModes.change_mode(0, true);
	post('CNTRLR script loaded! ------------------------------------------------');
}

function initialize_noteInput()
{
	noteInput = host.getMidiInPort(0).createNoteInput("CNTRLRInstrument", "80????", "90????", "D0????", "E0????");
	noteInput.setShouldConsumeEvents(false);

}

function initialize_surface()
{
	//sendSysex(LINKFUNCBUTTONS);
	//sendSysex(DISABLECAPFADERNOTES);
}

function setup_controls()
{
	script['faders'] = [];
	script['faderbank'] = new Grid(8, 0, 'Faders');
	for (var i = 0;i < 8; i++)
	{
		faders[i] = new Slider(FADERS[i], 'Fader_'+i);
		faderbank.add_control(i, 0, faders[i]);
	}
	script['pads'] = [];
	for (var i = 0;i < 16; i++)
	{
		pads[i] = new Button(PADS[i], 'Pad_'+i);
	}
	script['grid'] = new Grid(4, 4, 'Grid');
	for ( var i = 0; i< 4; i++)
	{
		for (var j = 0; j< 4; j++)
		{
			var number = i + (j*4);
			grid.add_control(i, j, pads[number]);
		}
	}
	script['keys'] = [];
	for (var i = 0;i < 32; i++)
	{
		keys[i] = new Button(KEYS[i], 'Keys_'+i);
	}
	script['keygrid'] = new Grid(16, 2, 'Keygrid');
	for ( var i = 0; i< 16; i++)
	{
		for (var j = 0; j< 2; j++)
		{
			var number = i + (j*16)	;
			keygrid.add_control(i, j, keys[number]);
		}
	}
	script['encoder_buttons'] = [];
	script['encoders'] = [];
	for (var i = 0; i < 12; i++)
	{
		encoder_buttons[i] = new Button(ENCODERS[i], 'Encoder_button_'+i);
		encoders[i] = new Encoder(ENCODERS[i], 'Encoder_'+i);
	}
	script['left_knobs'] = [];
	for (var i = 0; i < 12; i++)
	{
		left_knobs[i] = new Slider(KNOBS_L[i], 'Left_Knob_'+i);
	}
	script['right_knobs'] = [];
	for (var i = 0; i < 12; i++)
	{
		right_knobs[i] = new Slider(KNOBS_R[i], 'Right_Knob_'+i);
	}
	post('setup_controls successful');
}

function setup_lcd()
{
	lcd = new DisplaySection('LCD', 2, 34, _base_translations, 42);
}

function setup_session()
{
	session = new SessionComponent('Session', 4, 4, trackBank);
}

function setup_mixer()
{
	mixer = new MixerComponent('Mixer', 4, 3, trackBank, undefined, cursorTrack, masterTrack);
	mixer.returnstrip(0).createEQDeviceComponent();
	mixer.returnstrip(1).createEQDeviceComponent();
	mixer.returnstrip(2).createEQDeviceComponent();
	mixer._masterstrip.createEQDeviceComponent();
}

function setup_device()
{
	device = new DeviceComponent('Device', 8, cursorDevice);
}

function setup_transport()
{
	transport = new TransportComponent('Transport', host.createTransport());
}

function setup_groove()
{
	groove = new GrooveComponent();
}

function setup_instrument_control()
{
	instrument = new AdaptiveInstrumentComponent('Instrument', {'drum':[4, 4, 0, 0], 'keys':[4, 4, 0, 0], 'drumseq':[16, 1, 0, 0], 'keysseq':[16, 1, 0, 0]});
	instrument._drums._noteOffset._increment = 16;
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
	script['seq_grid'] = new Grid(16, 1, 'Seq_Grid');
	script['session_grid'] = new Grid(4, 4, 'SessionGrid');

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
			buttons[i].add_listener(altClipLaunchSub._alt)
		}
	}
	altClipLaunchSub.exit_mode = function()
	{
		if(!altClipLaunchSub._last_pressed)
		{
			for(var i=0;i<8;i++)
			{
				buttons[i].remove_listener(altClipLaunchSub._alt)
			}
		}
	}

	clipLaunch = new Page('ClipLaunch');
	clipLaunch.enter_mode = function()
	{
		post('cliplaunch enter mode');
		grid.reset();
		session.assign_grid(grid);
	}
	clipLaunch.exit_mode = function()
	{
		session.assign_grid();
	}

	//Page 0:  Send Control and Instrument throughput
	clipPage = new Page('ClipPage');
	clipPage.enter_mode = function()
	{
		post('clipPage entered');
		//grid.reset();
		//faderbank.reset();
		session_grid.sub_grid(grid, 0, 4, 0, 4);
		session.assign_grid(session_grid);
		session.set_nav_buttons(keys[24], keys[25], keys[27], keys[26]);
		device.set_nav_buttons(encoder_buttons[9], encoder_buttons[8], encoder_buttons[11], encoder_buttons[10]);
		device._enabled.set_control(encoder_buttons[4]);
		device._mode.set_control(encoder_buttons[5]);
		//device.set_shared_controls([encoders[4], encoders[5], encoders[6], encoders[7], encoders[8], encoders[9], encoders[10], encoders[11]]);
		device.set_shared_controls(encoders.slice(4, 12));
		groove._accentAmount.set_control(encoders[0]);
		groove._shuffleAmount.set_control(encoders[1]);
		groove._accentPhase.set_control(encoders[3]);
		groove._accentRate.set_control(encoders[2]);
		groove._enabled.set_control(encoder_buttons[3]);
		transport._overdub.set_control(encoder_buttons[6]);
		transport._autowrite.set_control(encoder_buttons[7]);
		for(var i=0;i<4;i++)
		{
			mixer.channelstrip(i)._volume.set_control(faders[i]);
			mixer.channelstrip(i)._select.set_control(keys[i+20]);
			mixer.channelstrip(i)._solo.set_control(keys[i]);
			mixer.channelstrip(i)._arm.set_control(keys[i+8]);
			mixer.channelstrip(i)._mute.set_control(keys[i+16]);
			mixer.channelstrip(i)._stop.set_control(keys[i+4]);
			mixer.channelstrip(i)._send[0].set_control(left_knobs[i]);
			mixer.channelstrip(i)._send[1].set_control(left_knobs[i+4]);
			mixer.channelstrip(i)._send[2].set_control(left_knobs[i+8]);
		}
		for(var i=0;i<3;i++)
		{
			mixer.returnstrip(i)._volume.set_control(faders[i+4]);
			mixer.returnstrip(i)._device.set_controls(right_knobs[i], right_knobs[i+4], right_knobs[i+8]);
			mixer.returnstrip(i)._select.set_control(keys[12+i]);
		}
		mixer._masterstrip._volume.set_control(faders[7]);
		mixer._masterstrip._device.set_controls(right_knobs[3], right_knobs[7], right_knobs[11]);
		mixer._masterstrip._select.set_control(keys[15]);
		transport._play.set_control(keys[28]);
		transport._stop.set_control(keys[29]);
		instrument._stepsequencer._flip.set_control(keys[30]);
		clipPage.active = true;
		clipPage.set_shift_button(keys[31]);
		MainModes.mode_toggle.set_control(keys[30]);
		//keys[31].notify();
	}
	clipPage.exit_mode = function()
	{
		MainModes.mode_toggle.set_control();
		session.assign_grid();
		session.set_nav_buttons();
		device.set_nav_buttons();
		device._enabled.set_control();
		device._mode.set_control();
		device.set_shared_controls();
		groove._accentAmount.set_control();
		groove._shuffleAmount.set_control();
		groove._accentPhase.set_control();
		groove._accentRate.set_control();
		groove._enabled.set_control();
		transport._overdub.set_control();
		transport._autowrite.set_control();
		for(var i=0;i<4;i++)
		{
			mixer.channelstrip(i)._volume.set_control();
			mixer.channelstrip(i)._select.set_control();
			mixer.channelstrip(i)._solo.set_control();
			mixer.channelstrip(i)._arm.set_control();
			mixer.channelstrip(i)._mute.set_control();
			mixer.channelstrip(i)._stop.set_control();
			mixer.channelstrip(i)._send[0].set_control();
			mixer.channelstrip(i)._send[1].set_control();
			mixer.channelstrip(i)._send[2].set_control();
		}
		for(var i=0;i<3;i++)
		{
			mixer.returnstrip(i)._volume.set_control();
			mixer.returnstrip(i)._device.set_controls();
			mixer.returnstrip(i)._select.set_control();
		}
		mixer._masterstrip._volume.set_control();
		mixer._masterstrip._device.set_controls();
		mixer._masterstrip._select.set_control();
		transport._play.set_control();
		transport._record.set_control();
		transport._stop.set_control();
		//session_grid.clear_buttons();
		instrument._stepsequencer._flip.set_control();
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
			var i=7;do{
				encoders[i+4].reset();
			}while(i--);
			groove._accentAmount.set_control();
			groove._shuffleAmount.set_control();
			groove._accentPhase.set_control();
			groove._accentRate.set_control();
			device.set_shared_controls();
			instrument._stepsequencer._flip.set_control();
			MainModes.mode_toggle.set_control(keys[30]);
			transport._record.set_control(keys[28]);
			session.assign_grid();
			//session._zoom.assign_grid(grid);
		}
		else
		{
			MainModes.mode_toggle.set_control();
			//session._zoom.assign_grid();
			clipPage.enter_mode();
		}
	}

	//Page 1:  Sequencer
	sequencerPage = new Page('Sequencer');
	sequencerPage.enter_mode = function()
	{
		post('sequencerPage entered');
		device.set_nav_buttons(encoder_buttons[9], encoder_buttons[8], encoder_buttons[11], encoder_buttons[10]);
		device._enabled.set_control(encoder_buttons[4]);
		device._mode.set_control(encoder_buttons[5]);
		device.set_shared_controls(encoders.slice(4, 12));
		groove._accentAmount.set_control(encoders[0]);
		groove._shuffleAmount.set_control(encoders[1]);
		groove._accentPhase.set_control(encoders[3]);
		groove._accentRate.set_control(encoders[2]);
		groove._enabled.set_control(encoder_buttons[3]);
		transport._overdub.set_control(encoder_buttons[6]);
		transport._autowrite.set_control(encoder_buttons[7]);
		transport._play.set_control(keys[28]);
		transport._stop.set_control(keys[29]);
		for(var i=0;i<4;i++)
		{
			mixer.channelstrip(i)._volume.set_control(faders[i]);
			mixer.channelstrip(i)._send[0].set_control(left_knobs[i]);
			mixer.channelstrip(i)._send[1].set_control(left_knobs[i+4]);
			mixer.channelstrip(i)._send[2].set_control(left_knobs[i+8]);
			mixer.channelstrip(i)._select.set_control(keys[i+20]);
			mixer.channelstrip(i)._mute.set_control(keys[i+16]);
		}
		for(var i=0;i<3;i++)
		{
			mixer.returnstrip(i)._volume.set_control(faders[i+4]);
			mixer.returnstrip(i)._device.set_controls(right_knobs[i], right_knobs[i+4], right_knobs[i+8]);
		}
		mixer._masterstrip._volume.set_control(faders[7]);
		mixer._masterstrip._device.set_controls(right_knobs[3], right_knobs[7], right_knobs[11]);
		instrument.set_scale_offset_buttons(keys[27], keys[26]);
		instrument.set_note_offset_buttons(keys[25], keys[24]);
		seq_grid.sub_grid(keygrid, 0, 16, 0, 1);
		instrument.assign_explicit_grids(grid, grid, seq_grid, seq_grid);
		sequencerPage.active = true;
		sequencerPage.set_shift_button(keys[31]);
		MainModes.mode_toggle.set_control(keys[30]);
	}
	sequencerPage.exit_mode = function()
	{
		MainModes.mode_toggle.set_control();
		device.set_nav_buttons();
		device._enabled.set_control();
		device._mode.set_control();
		device.set_shared_controls();
		groove._accentAmount.set_control();
		groove._shuffleAmount.set_control();
		groove._accentPhase.set_control();
		groove._accentRate.set_control();
		groove._enabled.set_control();
		for(var i=0;i<4;i++)
		{
			mixer.channelstrip(i)._volume.set_control();
			mixer.channelstrip(i)._send[0].set_control();
			mixer.channelstrip(i)._send[1].set_control();
			mixer.channelstrip(i)._send[2].set_control();
		}
		for(var i=0;i<3;i++)
		{
			mixer.returnstrip(i)._volume.set_control();
			mixer.returnstrip(i)._device.set_controls();
		}
		mixer._masterstrip._volume.set_control();
		mixer._masterstrip._device.set_controls();
		instrument._stepsequencer._flip.set_control();
		instrument._stepsequencer._follow.set_control();
		instrument._quantization.set_controls();
		instrument._stepsequencer._triplet.set_control();
		instrument.assign_explicit_grids();
		sequencerPage.set_shift_button();
		sequencerPage.active = false;
		post('sequencerPage exited');
	}
	sequencerPage.update_mode = function()
	{
		post('sequencerPage updated');
		grid.reset();
		if(sequencerPage._shifted)
		{
			groove._accentAmount.set_control();
			groove._shuffleAmount.set_control();
			groove._accentPhase.set_control();
			groove._accentRate.set_control();
			device.set_shared_controls();
			var i=7;do{
				encoders[i+4].reset();
			}while(i--);
			for(var i=0;i<4;i++)
			{
				mixer.channelstrip(i)._select.set_control();
				mixer.channelstrip(i)._mute.set_control();
			}
			transport._play.set_control();
			transport._stop.set_control();
			session._slot_select.set_inc_dec_buttons(keys[29], keys[28]);
			instrument._stepsequencer._flip.set_control(keys[30]);
			instrument._stepsequencer._follow.set_control(keys[23]);
			instrument._quantization.set_controls([keys[16], keys[17], keys[18], keys[19], keys[20], keys[21]]);
			instrument._stepsequencer._triplet.set_control(keys[22]);
			instrument._shift._value = true;
			instrument.update();
		}
		else
		{
			instrument._stepsequencer._flip.set_control();
			instrument._stepsequencer._follow.set_control();
			instrument._quantization.set_controls();
			instrument._stepsequencer._triplet.set_control();
			instrument._shift._value = false;
			sequencerPage.enter_mode();
		}
	}
	script["MainModes"] = new PageStack(2, "Main Modes");
	MainModes.add_mode(0, clipPage);
	MainModes.add_mode(1, sequencerPage);

}

function setup_fixed_controls()
{
	mixer._masterstrip._volume.set_control(faders[7]);
}

function setup_listeners()
{
	track_type_name = new Parameter('track_type_name_listener');
	cursorTrack.addTrackTypeObserver(20, 'None', track_type_name.receive);
	track_type_name.add_listener(on_track_type_name_changed);

	track_type = new Parameter('track_type_listener', {javaObj:cursorTrack.getCanHoldNoteData(), monitor:'addValueObserver'});

	selected_track_selected_clipslot = new Parameter('selected_track_selected_clipslot_listener', {javaObj:cursorTrack.getClipLauncher(), monitor:'addIsPlayingObserver'});
	selected_track_selected_clipslot.add_listener(on_selected_track_selected_clipslot_changed);

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
	if(page == sequencerPage)
	{
		page.refresh_mode();
	}
}

function exit()
{
	//resetAll();
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

function display_mode(){}

function setupTests()
{
	
}



