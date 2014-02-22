


const DEFAULT_MIDI_ASSIGNMENTS = {'mode':'chromatic', 'offset':36, 'vertoffset':12, 'scale':'Chromatic', 'drumoffset':0, 'split':false}

//const QUERYSURFACE = 'F0 7E 7F 06 01 F7';

isShift = false;

loadAPI(1);

host.defineController("Livid Instruments", "Alias8", "1.0", "41bcd930-7719-11e3-981f-0800200c9a66");
var PRODUCT = "0B"; //BRAIN="01", OHM64="02", BLOCK="03", CODE="04", MCD="05", MCP="06", OHMRGB="07", CNTRLR="08", BRAIN2="09", ENLIGHTEN="0A", ALIAS8="0B", BASE="0C", BRAINJR="0D"
var LIVIDRESPONSE = "F0 7E ?? 06 02 00 01 61 01 00 "+PRODUCT+" 00 ?? ?? ?? ?? F7";
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
var alias_channel = 0;
var VERSION = '1.0';
var VERBOSE = false;

load("Prototypes.js");

function init()
{

	////////////////////////////////////////////////////////////////////////////////
	application = host.createApplication();
	cursorDevice = host.createCursorDevice();
	//cursorDevice2 = host.createCursorDevice();
	cursorTrack = host.createCursorTrack(6, 2);
	masterTrack = host.createMasterTrack(8);
	//transport = host.createTransport();
	trackBank = host.createMainTrackBank(8, 6, 2);
	returnBank = host.createEffectTrackBank(6, 2);
	////////////////////////////////////////////////////////////////////////////////
	
	post('Alias8 script loading ------------------------------------------------');

	host.getMidiInPort(0).setMidiCallback(onMidi);
	host.getMidiInPort(0).setSysexCallback(onSysex);
	initialize_noteInput();
	initialize_prototypes();
	initialize_surface();
	setup_controls();
	resetAll();
	setup_session();
	setup_mixer();
	setup_device();
	setup_transport();
	setup_instrument_control();
	setup_tasks();
	setup_modes();
	setup_notifications();
	setup_listeners();
	setupTests();

	//LOCAL_OFF();
	//sendSysex('F0 00 01 61 0B 16 01 F7');
	MainModes.change_mode(0, true);
	post('Alias8 script loaded! ------------------------------------------------');
	notifier.show_message('Alias8 Script version ' + VERSION +' loaded.');
}

function initialize_noteInput()
{
	noteInput = host.getMidiInPort(0).createNoteInput("Alias8Instrument", "8?????", "9?????", "D?????", "E?????");
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
	script['seq_grid'] = new Grid(8, 2, 'SeqGrid');
	for ( var i = 0; i< 8; i++)
	{
		for (var j = 0; j< 2; j++)
		{
			var number = i + (j*8);
			grid.add_control(i, j, pads[number]);
			if(number!=15)
			{
				seq_grid.add_control(i, j, pads[number]);
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

function setup_session()
{
	session = new SessionComponent('Session', 8, 2, trackBank);
	session._slot_select._onValue = colors.WHITE;
	session.set_verbose(VERBOSE);
	session._bank_knob = new RangedParameter(session._name + '_Bank_Knob', {range:128});
	session._knob_nav = function(obj)
	{
		if(obj._value > 64)
		{
			session._trackBank.scrollTracksDown();
		}
		else if(obj._value < 64)
		{
			session._trackBank.scrollTracksUp();
		}
		var control = session._bank_knob._control;
		sendChannelController(0, 42, 64);
	}
	session._bank_knob.add_listener(session._knob_nav);
	session._bank_knob.set_control(encoder);
	
}

function setup_mixer()
{
	mixer = new MixerComponent('Mixer', 8, 6, trackBank, returnBank, cursorTrack, masterTrack);
	mixer.returnstrip(0).createEQDeviceComponent();
	mixer.returnstrip(1).createEQDeviceComponent();
	mixer.set_verbose(VERBOSE);


}

function setup_device()
{
	device = new DeviceComponent('Device', 8, cursorDevice);
	device._mode.set_value(0);
	//device2 = new DeviceComponent('Device2', 8, cursorDevice2);
	//device2._mode.set_value(0);
	device.set_verbose(VERBOSE);
}

function setup_transport()
{
	transport = new TransportComponent('Transport', host.createTransport());
	transport.set_verbose(VERBOSE);
}

function setup_instrument_control()
{
	var KEYOFFSETS = [1, 4, 5, 12];
	var DRUMOFFSETS = [1, 4, 8, 16];

	instrument = new AdaptiveInstrumentComponent('Instrument', {'drum':[7, 1, 0, 1], 'keys':[7, 1, 0, 1], 'drumseq':[8, 1, 0, 0], 'keysseq':[8, 1, 0, 0]});
	instrument._drums._split_column = 8;
	instrument._drums._octaveOffset._increment = 8;

	funstep = new FunSequencerComponent('Fun', 16);


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

	
	instrument.set_verbose(VERBOSE);
}

function setup_notifications()
{
	notifier = new NotificationDisplayComponent();
	notifier.add_subject(mixer._selectedstrip._track_name, 'Selected Track', undefined, 8, 'Main');
	notifier.add_subject(device._device_name, 'Device', undefined, 6, 'Device');
	notifier.add_subject(device._bank_name, 'Bank', undefined, 6, 'Device');
	for(var i=0;i<8;i++)
	{
		notifier.add_subject(device._parameter[i].displayed_name, 'Parameter', undefined, 5, 'Param_'+i);
		notifier.add_subject(device._parameter[i].displayed_value, 'Value', undefined, 5, 'Param_'+i);
		notifier.add_subject(device._macro[i], 'Macro : ' + i +  '  Value', undefined, 5);
	}
	notifier.add_subject(instrument._stepsequencer._flip, 'Flip Mode', undefined, 4);
	notifier.add_subject(instrument._drums._octaveOffset, 'Root Note', NOTENAMES, 4, 'Drums');
	notifier.add_subject(instrument._keys._noteOffset, 'Root Note', NOTENAMES, 4, 'Keys');
	notifier.add_subject(instrument._keys._scaleOffset, 'Scale', SCALENAMES, 4, 'Keys');
	notifier.add_subject(instrument._keys._vertOffset, 'Vertical Offset', undefined, 4, 'Keys');
	notifier.add_subject(MainModes, 'Mode', ['Channel Mix', 'Clip', 'Track Mix', 'Sequence', 'Device', 'ClassSeq', 'Moment'], 9);
	var notes = [];
	for(var i=0;i<128;i++)
	{
		notes[i] = Math.floor(i/10.66);
	}
	for(var i=0;i<16;i++)
	{
		notifier.add_subject(funstep._pitches[i], 'Pitch for step '+i, notes, 3, 'Pitch_'+i);
	}
	notifier.add_subject(funstep.key_offset_dial, 'Root Note', NOTENAMES, 3);
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

	top_sub = new Grid(8, 1, 'TopSub');
	bottom_sub = new Grid(7, 1, 'BottomSub');
	session_sub = new Grid(6, 2, 'SessionSub');

	//Page 0:  Send Control, Mute and Solos
	chMixPage = new Page('ChannelMixPage');
	chMixPage.enter_mode = function()
	{
		post('chMixPage entered');
		grid.reset();
		for(var i=0;i<8;i++)
		{
			mixer.channelstrip(i)._volume.set_control(faders[i]);
			mixer.channelstrip(i)._solo.set_control(pads[i]);
			mixer.channelstrip(i)._mute.set_control(pads[i+8]);
			mixer.channelstrip(i)._send[0].set_control(knobs[i]);
			mixer.channelstrip(i)._send[1].set_control(knobs[i+8]);
		}
		mixer._masterstrip._volume.set_control(faders[8]);
		chMixPage.active = true;
	}
	chMixPage.exit_mode = function()
	{
		for(var i=0;i<8;i++)
		{
			mixer.channelstrip(i)._volume.set_control();
			mixer.channelstrip(i)._solo.set_control();
			mixer.channelstrip(i)._mute.set_control();
			mixer.channelstrip(i)._send[0].set_control();
			mixer.channelstrip(i)._send[1].set_control();
		}
		mixer._masterstrip._volume.set_control();
		chMixPage.set_shift_button();
		chMixPage.active = false;
		post('chMixPage exited');
	}
	chMixPage.update_mode = function()
	{
		post('chMixPage updated');
		grid.reset();
		if(chMixPage._shifted)
		{
		}
		else
		{
			chMixPage.enter_mode();
		}
	}

	//Page 1:  Clip Launching and Return Controls 
	clipPage = new Page('clipPage');
	clipPage.enter_mode = function() 
	{
		post('clipPage entered');
		grid.reset();
		session_sub.sub_grid(grid, 0, 6, 0, 2);
		session.assign_grid(session_sub);
		session.set_nav_buttons(pads[14], pads[15]);
		for(var i=0;i<6;i++)
		{
			mixer.channelstrip(i)._volume.set_control(faders[i]);
			mixer.channelstrip(i)._send[0].set_control(knobs[i]);
			mixer.channelstrip(i)._send[1].set_control(knobs[i+8]);
		}
		for(var i=0;i<2;i++)
		{
			mixer.returnstrip(i)._select.set_control(pads[i+6]);
			mixer.returnstrip(i)._volume.set_control(faders[i+6]);
			mixer.returnstrip(i)._device.set_controls(knobs[i+6], knobs[i+14]);
		}
		mixer._masterstrip._volume.set_control(faders[8]);
		clipPage.active = true;
	}
	clipPage.exit_mode = function()
	{
		session_sub.clear_buttons;
		session.assign_grid();
		session.set_nav_buttons();
		for(var i=0;i<6;i++)
		{
			mixer.channelstrip(i)._volume.set_control();
		}
		for(var i=0;i<2;i++)
		{
			mixer.returnstrip(i)._select.set_control();
			mixer.returnstrip(i)._volume.set_control();
		}
		mixer._masterstrip._volume.set_control();
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

	//Page 2:  Send Control and Instrument throughput
	curMixPage = new Page('currentMix');
	curMixPage.enter_mode = function()
	{
		post('curMixPage entered');
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
		curMixPage.active = true;
	}
	curMixPage.exit_mode = function()
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
		curMixPage.set_shift_button();
		curMixPage.active = false;
		post('curMixPage exited');
	}
	curMixPage.update_mode = function()
	{
		post('curMixPage updated');
		grid.reset();
		if(curMixPage._shifted)
		{
		}
		else
		{
			curMixPage.enter_mode();
		}
	}

	//Page 3:  Basic Sequencer Control
	seqPage = new Page('seqPage');
	seqPage.enter_mode = function()
	{
		post('seqPage entered');
		grid.reset();
		for(var i=0;i<8;i++)
		{
			mixer.channelstrip(i)._volume.set_control(faders[i]);
		}
		instrument.assign_grid(seq_grid);
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
			instrument._stepsequencer._follow.set_control(pads[14]);
			session._slot_select.set_inc_dec_buttons(pads[13], pads[12]);
			instrument._quantization.set_controls([pads[8], pads[9], pads[10], pads[11]]);
			instrument.update();
			if(instrument._primary_instrument._value == 'DrumMachine')
			{
				instrument._drums._octaveOffset.set_inc_dec_buttons(pads[7], pads[6]);
			}
			else
			{
				instrument._keys._noteOffset.set_inc_dec_buttons(pads[7], pads[6]);
				instrument._keys._vertOffset.set_inc_dec_buttons(pads[3], pads[2]);
				instrument._keys._scaleOffset.set_inc_dec_buttons(pads[5], pads[4]);
			}
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

	//Page 4:  Device control
	devPage = new Page('clipPage');
	devPage.enter_mode = function()
	{
		post('devPage entered');
		grid.reset();
		for(var i=0;i<8;i++)
		{
			mixer.channelstrip(i)._volume.set_control(faders[i]);
			mixer.channelstrip(i)._select.set_control(pads[i]);
		}
		device.set_macro_controls(knobs.slice(0, 8));
		device.set_parameter_controls(knobs.slice(8, 16));
		device.set_nav_buttons(pads[13], pads[12], pads[15], pads[14]);
		device._enabled.set_control(pads[11]);
		mixer._masterstrip._volume.set_control(faders[8]);
		devPage.active = true;
	}
	devPage.exit_mode = function()
	{
		for(var i=0;i<8;i++)
		{
			mixer.channelstrip(i)._volume.set_control();
			mixer.channelstrip(i)._select.set_control();
		}
		device.set_macro_controls();
		device.set_parameter_controls();
		device.set_nav_buttons();
		device._enabled.set_control();
		mixer._masterstrip._volume.set_control();
		devPage.set_shift_button();
		devPage.active = false;
		post('devPage exited');
	}
	devPage.update_mode = function()
	{
		post('devPage updated');
		grid.reset();
		if(devPage._shifted)
		{
		}
		else
		{
			devPage.enter_mode();
		}
	}

	//Page 5:  Sequencer with wacky knobs
	funPage = new Page('funPage');
	funPage.enter_mode = function()
	{
		post('funPage entered');
		grid.reset();
		//grid.add_control(7, 1, pads[15]);
		funstep.assign_grid(grid);
		funstep.assign_knobs(knobs);
		funstep.key_offset_dial.set_control(faders[8]);
		device.set_shared_controls(faders.slice(0, 8));
		funPage.active = true;
	}
	funPage.exit_mode = function()
	{
		funstep.assign_knobs();
		funstep.key_offset_dial.set_control();
		funstep.assign_grid();
		device.set_shared_controls();
		funPage.set_shift_button();
		funPage.active = false;
		post('funPage exited');
	}
	funPage.update_mode = function()
	{
		post('funPage updated');
		grid.reset();
		if(funPage._shifted)
		{
		}
		else
		{
			funPage.enter_mode();
		}
	}

	//Page 6:  Momentary Send Controls
	momPage = new Page('momPage');
	momPage.enter_mode = function()
	{
		post('momPage entered');
		
		grid.reset();
		for(var i=0;i<6;i++)
		{
			mixer.channelstrip(i)._volume.set_control(faders[i]);
			mixer.channelstrip(i)._select.set_control(pads[i]);
			mixer.channelstrip(i)._mute.set_control(pads[i+8]);
			mixer.channelstrip(i)._send[0].set_control(knobs[i]);
			mixer.channelstrip(i)._send[1].set_control(knobs[i+14]);
		}
		for(var i=0;i<2;i++)
		{
			mixer.returnstrip(i)._volume.set_control(faders[i+6]);
			mixer.returnstrip(i+2)._volume.set_control(knobs[i+6]);
			mixer.returnstrip(i+4)._volume.set_control(knobs[i+14]);
		}
		mixer.selectedstrip()._send[0].set_control(pads[6]);
		mixer.selectedstrip()._send[1].set_control(pads[7]);
		mixer.selectedstrip()._send[2].set_control(pads[14]);
		mixer.selectedstrip()._send[3].set_control(pads[15]);
		mixer._masterstrip._volume.set_control(faders[8]);
		momPage.active = true;
	}
	momPage.exit_mode = function()
	{
		for(var i=0;i<6;i++)
		{
			mixer.channelstrip(i)._volume.set_control();
			mixer.channelstrip(i)._select.set_control();
			mixer.channelstrip(i)._mute.set_control();
			mixer.channelstrip(i)._send[0].set_control();
			mixer.channelstrip(i)._send[1].set_control();
		}
		for(var i=0;i<2;i++)
		{
			mixer.returnstrip(i)._volume.set_control();
			mixer.returnstrip(i+2)._volume.set_control();
			mixer.returnstrip(i+4)._volume.set_control();
		}
		mixer.selectedstrip()._send[0].set_control();
		mixer.selectedstrip()._send[1].set_control();
		mixer.selectedstrip()._send[2].set_control();
		mixer.selectedstrip()._send[3].set_control();
		mixer._masterstrip._volume.set_control();
		momPage.set_shift_button();
		momPage.active = false;
		post('sendPage exited');
	}
	momPage.update_mode = function()
	{
		post('sendPage updated');
		grid.reset();
		if(momPage._shifted)
		{
		}
		else
		{
			momPage.enter_mode();
		}
	}

	script["MainModes"] = new PageStack(7, "Main Modes");

	MainModes.add_mode(0, chMixPage);
	MainModes.add_mode(1, clipPage);
	MainModes.add_mode(2, curMixPage);
	MainModes.add_mode(3, seqPage);
	MainModes.add_mode(4, devPage);
	MainModes.add_mode(5, funPage);
	MainModes.add_mode(6, momPage);

}

function change_channel(num)
{
	//post('channel is:', num);
	alias_channel = num;
	for(var i in NOTE_OBJECTS)
	{
		NOTE_OBJECTS[i]._channel = num;
	}
	for(var i in CC_OBJECTS)
	{
		CC_OBJECTS[i]._channel = num;
	}
	//the MasterFader doesn't change channels with the rest of the hardware on Alias, so we do this:
	//faders[8]._channel = 0;
	//register_control(faders[8]);
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
	//printMidi(status, data1, data2)
	if (isChannelController(status)) //&& MIDIChannel(status) == alias_channel)   //removing status check to include MasterFader
	{
		post('CC: ' + status + ' ' + data1 + ' ' + data2, CC_OBJECTS[data1]._name);
		CC_OBJECTS[data1].receive(data2);
	}
	else if (isNoteOn(status)) //&& MIDIChannel(status) == alias_channel)
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
		MainModes.notify();
	}
	//printSysex(data);
}

function display_mode(){}

function setupTests()
{
	//function_buttons[0].add_listener(poster);
	//trackBank.getTrack(0).getMute().addValueObserver(tester);
	//cursorTrack.addNameObserver(10, 'None', tester);
	//tasks.addTask(tester, ['peakaboo'], true);
	
}



