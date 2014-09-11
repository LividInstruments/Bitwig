
//const QUERYSURFACE = 'F0 7E 7F 06 01 F7';

isShift = false;

loadAPI(1);
 
host.defineController("Livid Instruments", "DS1", "1.0", "af6e34a0-2cdc-11e4-8c21-0800200c9a66");

var PRODUCT = "10"; //BRAIN="01", OHM64="02", BLOCK="03", CODE="04", MCD="05", MCP="06", OHMRGB="07", CNTRLR="08", BRAIN2="09", ENLIGHTEN="0A", ALIAS8="0B", BASE="0C", BRAINJR="0D", DS1="10", BASEII="11"

var LIVIDRESPONSE = "F0 7E ?? 06 02 00 01 61 01 00 "+PRODUCT+" 00 ?? ?? ?? ?? F7";
                     //F0 7E 00 06 02 00 01 61 01 00 10          00 05 00 01 00 F7
host.defineSysexDiscovery("F0 7E 7F 06 01 F7", LIVIDRESPONSE);
host.defineMidiPorts(1, 1);
host.addDeviceNameBasedDiscoveryPair(["DS1"], ["DS1"]);
//host.addDeviceNameBasedDiscoveryPair(["Daemon Input 0"], ["Daemon Output 0"]);
host.addDeviceNameBasedDiscoveryPair(["DS1 DS1Controls"], ["DS1 DS1Controls"]);


var RELATIVEENCODER = "F0 00 01 61 "+PRODUCT+" 11 02 F7"; //puts top right encoder in relative mode, others in absolute
var ENCODERSPEED = "F0 00 01 61 "+PRODUCT+" 11 00 00 01 00 02 00 03 00 04 00 05 00 06 00 07 00 08 00 09 00 0A 00 0B 00 0C 00 0D 00 0E 00 0F 00 10 00 11 00 12 00 13 00 14 00 15 00 16 00 17 00 18 00 7F 01 1A 00 7F 01 7F 01 FF";

for ( var m = 1; m < 9; m++)
{
	host.addDeviceNameBasedDiscoveryPair(["Controls" + m + " (DS1)"], ["Controls" + m + " (DS1)"]);
}


const BUTTONS = [0, 2, 4, 6, 8, 10, 12, 14, 1, 3, 5, 7, 9, 11, 13, 15];
const GRID = [[16, 19, 22],
			[17, 20, 23],
			[18, 21, 24]];
const FADERS = [41, 42, 43, 44, 45, 46, 47, 48];
const MASTER = 49;
const DIALS = [[1, 2, 3, 4, 5],
				[6, 7, 8, 9, 10],
				[11, 12, 13, 14, 15],
				[16, 17, 18, 19, 20],
				[21, 22, 23, 24, 25],
				[26, 27, 28, 29, 30],
				[31, 32, 33, 34, 35],
				[36, 37, 38, 39, 40]];
const ENCODERS = [96, 97, 98, 99];
const ENCODER_BUTTONS = [25, 26, 27, 28];
const SIDE_DIALS = [50, 51, 52, 53];

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
var ds1_channel = 0;
var VERSION = '1.0';
var VERBOSE = false;

load("Prototypes.js");

function init()
{

	////////////////////////////////////////////////////////////////////////////////
	application = host.createApplication();
	cursorDevice = host.createCursorDevice();
	cursorTrack = host.createCursorTrack(6, 1);
	masterTrack = host.createMasterTrack(8);
	transport = host.createTransport();
	trackBank = host.createMainTrackBank(8, 6, 1);
	returnBank = host.createEffectTrackBank(6, 1);
	////////////////////////////////////////////////////////////////////////////////
	
	post('DS1 script loading ------------------------------------------------');

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
	setup_tasks();
	setup_modes();
	setup_notifications();
	//setup_listeners();
	//setupTests();

	LOCAL_OFF();
	//sendSysex('F0 00 01 61 '+PRODUCT+' 16 01 F7');
	MainModes.change_mode(0, true);
	post('DS1 script loaded! ------------------------------------------------');
	//notifier.show_message('DS1 Script version ' + VERSION +' loaded.');
}

function initialize_noteInput()
{
	noteInput = host.getMidiInPort(0).createNoteInput("DS1", "8?????", "9?????", "D?????", "E?????");
	noteInput.setShouldConsumeEvents(false);

}

function initialize_surface()
{
	//we need to put the encoder in relative mode:
	sendSysex(RELATIVEENCODER);
	sendSysex(ENCODERSPEED);
	//that doesn't seem to work, so we'll do this for good measure....
	//sendChannelController(15, 97, 80); //top right relative
	//sendChannelController(15, 96, 64); //top left abs
	//sendChannelController(15, 98, 64); //bottom left abs
	//sendChannelController(15, 99, 64); //bottom right abs
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
	script['master_fader'] = new Slider(MASTER, 'Master_Fader');
	script['buttons'] = [];
	script['session_grid'] = new Grid(8, 1, 'SessionGrid');
	for (var i = 0;i < 16; i++)
	{
		buttons[i] = new Button(BUTTONS[i],  'Button_'+i);
	}
	for (var i = 0;i < 8; i++)
	{
		session_grid.add_control(i, 0, buttons[i])
	}
	script['grid_buttons'] = [];
	script['grid'] = new Grid(3, 3, 'Grid');
	for ( var i = 0; i< 3; i++)
	{
		grid_buttons[i] = [];
		for (var j = 0; j< 3; j++)
		{
			grid_buttons[i][j] = new Button(GRID[j][i], 'Grid_Button_'+i+'_'+j);
			grid.add_control(i, j, grid_buttons[i][j]);
		}
	}
	script['dials'] = [];
	for (var i = 0; i < 8; i++)
	{
		dials[i] = [];
		for (var j = 0; j < 5; j++)
		{
			dials[i][j] = new Slider(DIALS[i][j], 'Knob_'+i+'_'+j);
		}
	}
	script['encoders'] = [];
	script['encoder_buttons'] = [];
	script['side_dials'] = [];
	for (var i = 0; i < 4; i++)
	{
		encoders[i] = new Encoder(ENCODERS[i], 'Encoder_'+i);
		encoder_buttons[i] = new Button(ENCODER_BUTTONS[i], 'Encoder_Button_'+i);
		side_dials[i] = new Encoder(SIDE_DIALS[i], 'Side_Dial_'+i);
	}
	post('setup_controls successful');
}

function setup_session()
{
	session = new SessionComponent('Session', 8, 1, trackBank);
	session._slot_select._onValue = colors.WHITE;
	//session._indication_depends_on_grid_assignment = false;
	session.set_indication(true);
	session.set_verbose(VERBOSE);

	session._bank_knob = new RangedParameter(session._name + '_Bank_Knob', {range:127});
	session._bank_knob_nav = function(obj)
	{
		post('bank_knob_nav', obj._value);
		obj._value==1 ? session._trackBank.scrollTracksDown() : obj._value == 127 ? session._trackBank.scrollTracksUp() : {};
		var control = session._bank_knob._control;
		//sendChannelController(0, 42, 64);
	}
	session._bank_knob.add_listener(session._bank_knob_nav);
	//session._bank_knob.set_control(encoder);

	session._select_knob = new RangedParameter(session._name + '_Select_Knob', {range:127});
	session._select_knob_nav = function(obj)
	{
		post('select_knob_nav', obj._value);
		obj._value==1 ? session._cursorTrack.selectNext() : obj._value==127 ? session._cursorTrack.selectPrevious() : {};
		var control = session._select_knob._control;
		//sendChannelController(0, 42, 64);
	}
	session._select_knob.add_listener(session._select_knob_nav);
	
}

function setup_mixer()
{
	mixer = new MixerComponent('Mixer', 8, 4, trackBank, returnBank, cursorTrack, masterTrack);
	mixer._masterstrip.createChannelDeviceComponent(4);
	mixer.set_verbose(VERBOSE);
	
	for(var i=0;i<8;i++)
	{
		mixer.channelstrip(i).createChannelDeviceComponent(5);
	}

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

function setup_notifications()
{
	notifier = new NotificationDisplayComponent();
	notifier.add_subject(mixer._selectedstrip._track_name, 'Selected Track', undefined, 8, 'Main');
	//notifier.add_subject(device._device_name, 'Device', undefined, 6, 'Device');
	//notifier.add_subject(device._bank_name, 'Bank', undefined, 6, 'Device');
	for(var t=0;t<8;t++)
	{
		for(var i=0;i<5;i++)
		{
			//notifier.add_subject(mixer.channelstrip(t)._device._parameter[i].displayed_name, 'Parameter', undefined, 5, 'Param_'+i);
			//notifier.add_subject(mixer.channelstrip(t)._device._parameter[i].displayed_value, 'Value', undefined, 5, 'Param_'+i);
			notifier.add_subject(mixer.channelstrip(t)._device._macro[i], 'Macro : ' + i +  '  Value', undefined, 5);
		}
	}
	notifier.add_subject(MainModes, 'Mode', ['Mute/Solo', 'Select', 'ClipLaunch'], 3);
}

function setup_tasks()
{
	tasks = new TaskServer(script, 100);
}

function setup_usermodes()
{
	user1Input = host.getMidiInPort(0).createNoteInput("DS1User1", "80????", "90????", "D0????", "E0????");
	userbank1 = new UserBankComponent('UserBank1', 48, user1Input);
	user1Input.setShouldConsumeEvents(false);

	user2Input = host.getMidiInPort(0).createNoteInput("DS1User2", "80????", "90????", "D0????", "E0????");
	userbank2 = new UserBankComponent('UserBank2', 48, user2Input);
	user2Input.setShouldConsumeEvents(false);

	user3Input = host.getMidiInPort(0).createNoteInput("DS1User3", "80????", "90????", "D0????", "E0????");
	userbank3 = new UserBankComponent('UserBank3', 48, user3Input);
	user3Input.setShouldConsumeEvents(false);

	user4Input = host.getMidiInPort(0).createNoteInput("DS1User4", "80????", "90????", "D0????", "E0????");
	userbank4 = new UserBankComponent('UserBank4', 48, user4Input);
	user4Input.setShouldConsumeEvents(false);
}

function setup_modes()
{



	//Main Assignments for all pages
	staticPage = new Page('StaticPage');
	staticPage.enter_mode = function()
	{
		post('staticPage entered');
		for(var i=0;i<8;i++)
		{
			mixer.channelstrip(i)._volume.set_control(faders[i]);
			for(var j=0;j<5;j++)
			{
				mixer.channelstrip(i)._device._macro[j].set_control(dials[i][j]);
			}
		}
		mixer._masterstrip._volume.set_control(master_fader);
		mixer._masterstrip._device._macro[0].set_control(side_dials[0]);
		mixer._masterstrip._device._macro[1].set_control(side_dials[1]);
		mixer._masterstrip._device._macro[2].set_control(side_dials[2]);
		mixer._masterstrip._device._macro[3].set_control(side_dials[3]);
		transport._play.set_control(grid_buttons[0][0]);
		transport._stop.set_control(grid_buttons[1][0]);
		transport._record.set_control(grid_buttons[2][0]);
		transport._rewind.set_control(grid_buttons[1][2]);
		transport._loop.set_control(grid_buttons[2][1]);
		session._scene_launch.set_controls([grid_buttons[1][1]]);
		session._navUp.set_control(grid_buttons[0][1]);
		session._navDn.set_control(grid_buttons[0][2]);
		session._select_knob.set_control(encoders[1]);
		device.set_macro_controls([undefined, undefined, undefined, undefined, undefined, encoders[0], encoders[2], encoders[3]]);
		staticPage.set_shift_button(encoder_buttons[1]);
		staticPage.active = true;
	}
	staticPage.exit_mode = function()
	{
		for(var i=0;i<8;i++)
		{
			mixer.channelstrip(i)._volume.set_control();
			for(var j=0;j<5;j++)
			{
				mixer.channelstrip(i)._device._macro[j].set_control();
			}
		}
		mixer._masterstrip._volume.set_control();
		transport._play.set_control();
		transport._stop.set_control();
		transport._record.set_control();
		transport._rewind.set_control();
		transport._loop.set_control();
		session._scene_launch.set_controls();
		session._navUp.set_control();
		session._navDn.set_control();
		session._select_knob.set_control();
		device.set_macro_controls();
		staticPage.set_shift_button();
		staticPage.active = false;
		post('staticPage exited');
	}
	staticPage.update_mode = function()
	{
		post('staticPage updated');
		if(staticPage._shifted)
		{
			session._select_knob.set_control();
			session._bank_knob.set_control(encoders[1]);
		}
		else
		{
			session._bank_knob.set_control();
			staticPage.enter_mode();
		}
	}

	//Page 0: Mute and Solos
	mainPage = new Page('MainPage');
	mainPage.enter_mode = function()
	{
		post('chMixPage entered');
		grid_buttons[2][2]._send(color.WHITE)
		staticPage.enter_mode();
		for(var i=0;i<8;i++)
		{
			mixer.channelstrip(i)._solo.set_control(buttons[i]);
			mixer.channelstrip(i)._mute.set_control(buttons[i+8]);
		}
		mainPage.active = true;
	}
	mainPage.exit_mode = function()
	{
		staticPage.exit_mode();
		for(var i=0;i<8;i++)
		{
			mixer.channelstrip(i)._solo.set_control();
			mixer.channelstrip(i)._mute.set_control();
		}
		mainPage.set_shift_button();
		mainPage.active = false;
		post('mainPage exited');
	}
	mainPage.update_mode = function()
	{
		post('mainPage updated');
		if(mainPage._shifted)
		{
		}
		else
		{
			mainPage.enter_mode();
		}
	}

	//Page 1: Arm and Select
	selectPage = new Page('SelectPage');
	selectPage.enter_mode = function()
	{
		post('selectPage entered');
		grid_buttons[2][2]._send(color.MAGENTA)
		staticPage.enter_mode();
		for(var i=0;i<8;i++)
		{
			mixer.channelstrip(i)._arm.set_control(buttons[i]);
			mixer.channelstrip(i)._select.set_control(buttons[i+8]);
		}
		selectPage.active = true;
	}
	selectPage.exit_mode = function()
	{
		staticPage.exit_mode();
		for(var i=0;i<8;i++)
		{
			mixer.channelstrip(i)._arm.set_control();
			mixer.channelstrip(i)._select.set_control();
		}
		selectPage.set_shift_button();
		selectPage.active = false;
		post('selectPage exited');
	}
	selectPage.update_mode = function()
	{
		post('selectPage updated');
		if(selectPage._shifted)
		{
		}
		else
		{
			selectPage.enter_mode();
		}
	}

	//Page 2:  ClipFire and StopClips
	clipPage = new Page('clipPage');
	clipPage.enter_mode = function()
	{
		post('clipPage entered');
		grid_buttons[2][2]._send(color.RED)
		staticPage.enter_mode();
		session.assign_grid(session_grid);
		for(var i=0;i<8;i++)
		{
			mixer.channelstrip(i)._stop.set_control(buttons[i+8]);
		}
		clipPage.active = true;
	}
	clipPage.exit_mode = function()
	{
		staticPage.exit_mode();
		session.assign_grid();
		for(var i=0;i<8;i++)
		{
			mixer.channelstrip(i)._select.set_control();
		}
		clipPage.set_shift_button();
		clipPage.active = false;
		post('clipPage exited');
	}
	clipPage.update_mode = function()
	{
		post('clipPage updated');
		if(clipPage._shifted)
		{
		}
		else
		{
			clipPage.enter_mode();
		}
	}

	script["MainModes"] = new PageStack(3, "Main Modes");

	MainModes.add_mode(0, mainPage);
	MainModes.add_mode(1, selectPage);
	MainModes.add_mode(2, clipPage);
	MainModes.set_mode_cycle_button(grid_buttons[2][2]);

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
}

function setup_listeners()
{
	/*selected_track = new Parameter('selected_track_listener', {javaObj:cursorTrack, monitor:'addIsSelectedObserver'});
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
	*/

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
		//post('CC: ' + status + ' ' + data1 + ' ' + data2, CC_OBJECTS[data1]._name);
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
	/*if(data.slice(0, 12) == 'f00001610b71')
	{
		var new_mode = data[13];
		change_channel(new_mode);
		MainModes.change_mode(new_mode);
		MainModes.notify();
	}*/
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



