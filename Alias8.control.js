

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

host.defineController("Livid Instruments", "Alias8", "1.0", "41bcd930-7719-11e3-981f-0800200c9a66");
var PRODUCT = "0B"; //BRAIN="01", OHM64="02", BLOCK="03", CODE="04", MCD="05", MCP="06", OHMRGB="07", CNTRLR="08", BRAIN2="09", ENLIGHTEN="0A", ALIAS8="0B", BASE="0C", BRAINJR="0D"
var LIVIDRESPONSE = "F0 7E ?? 06 02 00 01 61 01 00 "+PRODUCT+" 0 ?? ?? ?? ?? F7";
host.defineSysexDiscovery("F0 7E 7F 06 01 F7", LIVIDRESPONSE);
host.defineMidiPorts(1, 1);
host.addDeviceNameBasedDiscoveryPair(["A8a"], ["A8a"]);
host.addDeviceNameBasedDiscoveryPair(["Alias_8A A8aControls"], ["Alias_8A A8aControls"]);

for ( var m = 1; m < 9; m++)
{
	host.addDeviceNameBasedDiscoveryPair(["Controls" + m + " (A8a)"], ["Controls" + m + " (A8a)"]);
}
const PADS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
const KNOBS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
const BUTTONS = [65, 73, 66, 74, 67, 75, 68, 76] ;
const FADERS = [17, 18, 19, 20, 21, 22, 23, 24, 25];
const ENCODER = 42;

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
var current_channel = 0;

load("Prototypes.js");

function init()
{

	////////////////////////////////////////////////////////////////////////////////
	application = host.createApplication();
	cursorDevice = host.createCursorDeviceSection(8);
	cursorTrack = host.createCursorTrack(5, 4);
	masterTrack = host.createMasterTrack(8);
	//transport = host.createTransport();
	trackBank = host.createMainTrackBank(8, 2, 8);
	returnBank = host.createEffectTrackBank(4, 8);
	////////////////////////////////////////////////////////////////////////////////
	
	post('OhmRGB script loading ------------------------------------------------');

	host.getMidiInPort(0).setMidiCallback(onMidi);
	host.getMidiInPort(0).setSysexCallback(onSysex);
	initialize_noteInput();
	initialize_prototypes();
	initialize_surface();
	setup_controls();
	//resetAll();
	setup_session();
	setup_mixer();
	setup_device();
	setup_transport();
	setup_instrument_control();
	setup_tasks();
	setup_modes();
	//setup_fixed_controls();
	setup_listeners();
	setupTests();

	//LOCAL_OFF();
	MainModes.change_mode(0, true);
	post('OhmRGB script loaded! ------------------------------------------------');
}

function initialize_noteInput()
{
	noteInput = host.getMidiInPort(0).createNoteInput("Alias8Instrument", "81????", "82????", "83????", "90????", "91????", "92????", "93????","D0????", "E0????");
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
	for (var i = 0;i < 9; i++)
	{
		faders[i] = new Slider(FADERS[i], 'Fader_'+i);
		faderbank.add_control(i, 0, faders[i]);
	}
	script['pads'] = [];
	for (var i = 0;i < 16; i++)
	{
		pads[i] = new Button(PADS[i],  'Pad_'+i);
	}
	script['grid'] = new Grid(8, 2, 'Grid');
	for ( var i = 0; i< 8; i++)
	{
		for (var j = 0; j< 2; j++)
		{
			var number = i + (j*8);
			if(number!=15)
			{
				grid.add_control(i, j, pads[number]);
			}
		}
	}
	script['knobs'] = [];
	for (var i = 0; i < 16; i++)
	{
		knobs[i] = new Slider(KNOBS[i], 'Knob_'+i);
	}
	script['encoder'] = new Encoder(ENCODER, 'Encoder');
	post('setup_controls successful');
}

function setup_lcd()
{
	lcd = new DisplaySection('LCD', 2, 34, _base_translations, 42);
}

function setup_session()
{
	session = new SessionComponent('Session', 8, 2, trackBank);
	session._slot_select._onValue = colors.WHITE;
}

function setup_mixer()
{
	mixer = new MixerComponent('Mixer', 8, 4);
}

function setup_device()
{
	device = new DeviceComponent('Device', 8, cursorDevice);
	device._mode.set_value(1);
}

function setup_transport()
{
	transport = new TransportComponent('Transport', host.createTransport());
}

function setup_instrument_control()
{
	var KEYOFFSETS = [1, 4, 5, 12];
	var DRUMOFFSETS = [1, 4, 8, 16];

	instrument = new AdaptiveInstrumentComponent('Instrument', {'drum':[7, 1, 0, 1], 'keys':[7, 1, 0, 1], 'drumseq':[8, 1, 0, 0], 'keysseq':[8, 1, 0, 0]});

	//we're not using this, but it could easily be added back into the script.  you'd need to remove assignments for the intervalSelector.
	instrument._scaleSelector_callback = function(){instrument._keys._scaleOffset.set_value(instrument._scaleSelector._value);}
	instrument._scaleSelector = new RadioComponent(instrument._keys._name + '_scaleSelector', 0, 5, 0, instrument._scaleSelector_callback, colors.BLUE, colors.OFF);
	instrument._update_scaleSelector = function(){instrument._scaleSelector._value = instrument._keys._scaleSelector._value;}
	instrument._keys._scaleOffset.add_listener(instrument._update_scaleSelector);

	instrument._intervalSelector_callback = function()
	{
		instrument._keys._noteOffset._increment = KEYOFFSETS[instrument._intervalSelector._value];
		instrument._drums._noteOffset._increment = DRUMOFFSETS[instrument._intervalSelector._value];
	}
	instrument._intervalSelector = new RadioComponent(instrument._name + '_intervalSelector', 0, 4, 0, instrument._intervalSelector_callback, colors.MAGENTA, colors.OFF);


}

function setup_tasks()
{
	tasks = new TaskServer(script, 100);
}

function setup_usermodes()
{
	user1Input = host.getMidiInPort(0).createNoteInput("OhmRGBUser1", "80????", "90????", "D0????", "E0????");
	userbank1 = new UserBankComponent('UserBank1', 48, user1Input);
	user1Input.setShouldConsumeEvents(false);

	user2Input = host.getMidiInPort(0).createNoteInput("OhmRGBUser2", "80????", "90????", "D0????", "E0????");
	userbank2 = new UserBankComponent('UserBank2', 48, user2Input);
	user2Input.setShouldConsumeEvents(false);

	user3Input = host.getMidiInPort(0).createNoteInput("OhmRGBUser3", "80????", "90????", "D0????", "E0????");
	userbank3 = new UserBankComponent('UserBank3', 48, user3Input);
	user3Input.setShouldConsumeEvents(false);

	user4Input = host.getMidiInPort(0).createNoteInput("OhmRGBUser4", "80????", "90????", "D0????", "E0????");
	userbank4 = new UserBankComponent('UserBank4', 48, user4Input);
	user4Input.setShouldConsumeEvents(false);
}

function setup_modes()
{

	
	/*script['session_grid'] = new Grid(8, 5, 'SessionGrid');
	script['seq_zoom'] = new Grid(8, 2, 'KeysGrid');
	script['seq_grid'] = new Grid(8, 4, 'SequenceGrid');

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
			pads[i].add_listener(altClipLaunchSub._alt)
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
	*/

	top_sub = new Grid(8, 1, 'TopSub');
	bottom_sub = new Grid(7, 1, 'BottomSub');

	//Page 0:  Send Control and Instrument throughput
	clipPage = new Page('ClipPage');
	clipPage.enter_mode = function()
	{
		post('clipPage entered');
		grid.reset();
		for(var i=0;i<8;i++)
		{
			mixer.channelstrip(i)._volume.set_control(faders[i]);
			mixer.channelstrip(i)._select.set_control(pads[i]);
			mixer.channelstrip(i)._mute.set_control(pads[i+8]);
		}
		for(var i=0;i<4;i++)
		{
			mixer.selectedstrip()._send[i].set_control(knobs[i+8]);
			mixer.returnstrip(i)._volume.set_control(knobs[i+12]);
		}
		device.set_shared_controls(knobs.slice(0, 8));
		mixer._masterstrip._volume.set_control(faders[8]);
		clipPage.active = true;
	}
	clipPage.exit_mode = function()
	{
		for(var i=0;i<8;i++)
		{
			mixer.channelstrip(i)._volume.set_control();
			mixer.channelstrip(i)._select.set_control();
			mixer.channelstrip(i)._mute.set_control();
		}
		for(var i=0;i<4;i++)
		{
			mixer.selectedstrip()._send[i].set_control();
			mixer.returnstrip(i)._volume.set_control();
		}
		device.set_shared_controls();
		mixer._masterstrip._volume.set_control();
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
		}
		else
		{
			clipPage.enter_mode();
		}
	}

	//Page 1:  Basic Sequencer Control
	seqPage = new Page('seqPage');
	seqPage.enter_mode = function()
	{
		post('seqPage entered');
		grid.reset();
		for(var i=0;i<8;i++)
		{
			mixer.channelstrip(i)._volume.set_control(faders[i]);
		}
		instrument.assign_grid(grid);
		for(var i=0;i<4;i++)
		{
			mixer.selectedstrip()._send[i].set_control(knobs[i+8]);
			mixer.returnstrip(i)._volume.set_control(knobs[i+12]);
		}
		device.set_shared_controls(knobs.slice(0, 8));
		mixer._masterstrip._volume.set_control(faders[8]);
		seqPage.set_shift_button(pads[15]);
		seqPage.active = true;
	}
	seqPage.exit_mode = function()
	{
		for(var i=0;i<8;i++)
		{
			mixer.channelstrip(i)._volume.set_control();
		}
		for(var i=0;i<4;i++)
		{
			mixer.selectedstrip()._send[i].set_control();
			mixer.returnstrip(i)._volume.set_control();
		}
		device.set_shared_controls();
		mixer._masterstrip._volume.set_control();
		instrument.assign_grid();
		seqPage.set_shift_button();
		seqPage.active = false;
		post('seqPage exited');
	}
	seqPage.update_mode = function()
	{
		post('seqPage updated');
		grid.reset();
		if(seqPage._shifted)
		{
			instrument.assign_grid();
			transport._overdub.set_control(pads[0]);
			if(track_type_name._value=='Instrument')
			{
				instrument._keys._noteOffset.set_inc_dec_buttons(pads[7], pads[6]);
				instrument._keys._vertOffset.set_inc_dec_buttons(pads[3], pads[2]);
				instrument._keys._scaleOffset.set_inc_dec_buttons(pads[5], pads[4]);
			}
			else
			{
				instrument._drums._octaveOffset.set_inc_dec_buttons(pads[7], pads[6]);
			}
			instrument._stepsequencer._follow.set_control(pads[14]);
			session._slot_select.set_inc_dec_buttons(pads[13], pads[12]);
			instrument._quantization.set_controls([pads[8], pads[9], pads[10], pads[11]]);
			instrument.update();
		}
		else
		{
			transport._overdub.set_control();
			instrument._keys._noteOffset.set_inc_dec_buttons();
			instrument._keys._vertOffset.set_inc_dec_buttons();
			instrument._keys._scaleOffset.set_inc_dec_buttons();
			instrument._drums._octaveOffset.set_inc_dec_buttons();
			instrument._stepsequencer._follow.set_control();
			session._slot_select.set_inc_dec_buttons();
			instrument._quantization.set_controls();
			seqPage.enter_mode();
		}
	}
	
	script["MainModes"] = new PageStack(2, "Main Modes");
	MainModes.add_mode(0, clipPage);
	MainModes.add_mode(1, seqPage);

}

function change_channel(num)
{
	current_channel = num;
	for(var i in NOTE_OBJECTS)
	{
		NOTE_OBJECTS[i]._channel = num;
	}
	for(var i in CC_OBJECTS)
	{
		CC_OBJECTS[i]._channel = num;
	}
}

function setup_fixed_controls()
{
	//mixer._masterstrip._volume.set_control(faders[7]);
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
	/*if((page == sendPage)||(page == devicePage))
	{
		page.refresh_mode();
	}*/
}

function detect_new_instrument()
{
	var ins = cursorTrack.getPrimaryInstrument();
	post(ins);
}

function exit()
{
	//resetAll();
}

function onMidi(status, data1, data2)
{
	 //printMidi(status, data1, data2);
	if (isChannelController(status)&& MIDIChannel(status) == current_channel)
	{
		//post('CC: ' + status + ' ' + data1 + ' ' + data2);
		CC_OBJECTS[data1].receive(data2);
	}
	else if (isNoteOn(status) && MIDIChannel(status) == current_channel)
	{
		//post('NOTE: ' + status + ' ' + data1 + ' ' + data2);
		NOTE_OBJECTS[data1].receive(data2);
	}
}

function onSysex(data)
{
	if(data.slice(0, 12) == 'f00001610b71')
	{
		var new_mode = data[13];
		change_channel(new_mode);
		MainModes.change_mode(new_mode);
	}
	printSysex(data);
}

function display_mode(){}

function setupTests()
{
	//function_buttons[0].add_listener(poster);
	//trackBank.getTrack(0).getMute().addValueObserver(tester);
	//cursorTrack.addNameObserver(10, 'None', tester);
	//tasks.addTask(tester, ['peakaboo'], true);
	
}



