
const DEFAULT_MIDI_ASSIGNMENTS = {'mode':'chromatic', 'offset':36, 'vertoffset':12, 'scale':'Chromatic', 'drumoffset':0, 'split':false}


isShift = false;

loadAPI(1);

host.defineController("Livid Instruments", "Code", "1.0", "a6fa8320-bab1-11e3-a5e2-0800200c9a66");
var PRODUCT = "04"; //BRAIN="01", OHM64="02", BLOCK="03", CODE="04", MCD="05", MCP="06", OHMRGB="07", CNTRLR="08", BRAIN2="09", ENLIGHTEN="0A", ALIAS8="0B", BASE="0C", BRAINJR="0D"
var LIVIDRESPONSE = "F0 7E ?? 06 02 00 01 61 01 00 "+PRODUCT+" 00 ?? ?? ?? ?? F7";
host.defineSysexDiscovery("F0 7E 7F 06 01 F7", LIVIDRESPONSE);
host.defineMidiPorts(1, 1);
host.addDeviceNameBasedDiscoveryPair(["Code"], ["Code"]);
host.addDeviceNameBasedDiscoveryPair(["Code MIDI 1"], ["Code MIDI 1"]);
host.addDeviceNameBasedDiscoveryPair(["Code Controls"], ["Code Controls"]);

for ( var m = 1; m < 9; m++)
{
	host.addDeviceNameBasedDiscoveryPair(["MIDIIN" + m + " (Code)"], ["MIDIIN" + m + " (Code)"]);
}


const ENCS = [1, 5, 9, 13, 17, 21, 25, 29, 2, 6, 10, 14, 18, 22, 26, 30, 3, 7, 11, 15, 19, 23, 27, 31, 4, 8, 12, 16, 20, 24, 28, 32];
const ENC_BUTTONS = [1, 5, 9, 13, 17, 21, 25, 29, 2, 6, 10, 14, 18, 22, 26, 30, 3, 7, 11, 15, 19, 23, 27, 31, 4, 8, 12, 16, 20, 24, 28, 32];
const SIDE_BUTTONS = [33,34,35,36,37];
const BTM_BUTTONS = [38,39,40,41,42,43,44,45];
//const ENC_RING = [33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64];
const CTLCOUNT = 77;

var LOCAL_OFF = function()
{
	sendChannelController(15, 122, 64);
}

var script = this;

var DEBUG = true;		//post() doesn't work without this
var VERSION = '1.0';
var VERBOSE = false;

load("Prototypes.js");

colors = {OFF : 0, WHITE : 127, CYAN : 127, MAGENTA : 127, RED : 127, BLUE : 127, YELLOW : 127, GREEN : 127};


function CodeEncoder(identifier, name)
{
	Control.call( this, identifier, name );
	this._type = CC_TYPE;
	register_control(this);
}

CodeEncoder.prototype = new Control();

CodeEncoder.prototype.constructor = CodeEncoder;

CodeEncoder.prototype._send = function(value)
{
	sendChannelController(this._channel, this._id, value);
	sendChannelController(this._channel, this._id+32, value);
}


function init()
{

	////////////////////////////////////////////////////////////////////////////////
	// Everything here is taken from the BW script, just leaving it for reference //
	application = host.createApplicationSection();
	cursorDevice = host.createCursorDeviceSection(8);
	cursorTrack = host.createCursorTrackSection(8, 8);
	masterTrack = host.createMasterTrackSection(0);
	transport = host.createTransportSection();
	trackBank = host.createTrackBankSection(8, 8, 4);
	////////////////////////////////////////////////////////////////////////////////
	
	post('Code script loading ------------------------------------------------');

	//setup our basic callback functions for MIDI reception
	host.getMidiInPort(0).setMidiCallback(onMidi);
	host.getMidiInPort(0).setSysexCallback(onSysex);
	
	//define global stuff
	initialize_noteInput();     //here we define the port and channel we want to listen to
	initialize_prototypes();    //this initializes the processes that our framework uses for communication
	initialize_surface();       //any controlsurface specific init calls should be placed in this function


	setup_controls();           //here we define all our controls by assigning their corresponding MIDI event filters
	resetAll();                 //turn off everything on the controlsurface

	//the following calls create js subordinates to the Java functions we're hooking into
	setup_session();
	setup_mixer();
	setup_device();
	setup_transport();
	setup_sequencer();
	//setup_instrument_control();
	//setup_usermodes();
	setup_tasks();

	setup_modes();            //define the differnet modes we'll be using, and assign controls to its functionality
	setup_notifications();      //define notifications that will be called when certain functionality is triggered
	setup_fixed_controls();     //any control assignments that aren't mode-dependent should be initialized here

	setup_listeners();          //use this to set up any mode-independent global listeners
	setupTests();               //use this block to set up any diagnostic routines

	LOCAL_OFF();
	MainModes.change_mode(0, true);     //select the initial mode
	post('Code script loaded! ------------------------------------------------');
	notifier.show_message('Code Script version ' + VERSION +' loaded.');
}

function initialize_noteInput()
{
	//we need to tell Bitwig to forward events from the actual MIDI port we're connected to
	noteInput = host.getMidiInPort(0).createNoteInput("Code", "80????", "90????", "D0????", "E0????");
	noteInput.setShouldConsumeEvents(false);

}

function initialize_surface()
{
	//Any configuration messages that need to be sent to the control surface should go here
}

function setup_controls()
{
	//Assign our control objects to their corresponding MIDI ids.
	//Each control is an instanceof Notifier object, and capable of notifiying multiple other objects
	//when a message is received by the script matching its id.
	script['encs'] = [];
	script['enc_buttons'] = [];
	for (var i = 0;i < 32; i++)
	{
		encs[i] = new CodeEncoder(ENCS[i], 'Encoder_'+i);
		enc_buttons[i] = new Button(ENC_BUTTONS[i], 'Encoder_Button_'+i);
	}
	script['grid'] = new Grid(8, 4, 'Grid');
	script['seqgrid'] = new Grid(8, 2, 'Grid');
	for ( var i = 0; i< 8; i++)
	{
		for (var j = 0; j< 4; j++)
		{
			var number = i + (j*8);
			grid.add_control(i, j, enc_buttons[number]);
		}
		for (var j = 0; j< 4; j++)
		{
			var number = i + (j*8);
			seqgrid.add_control(i, j, enc_buttons[number]);
		}
	}
	script['sidebuttons'] = [];
	for (var i = 0;i < 4; i++)
	{
		sidebuttons[i] = new Button(SIDE_BUTTONS[i], 'sideButton_'+i);
	}
	script['lividbutton'] = new Button(SIDE_BUTTONS[4], 'LividButton');	
	script['bottombuttons'] = [];
	for (var i = 0;i < 8; i++)
	{
		bottombuttons[i] = new Button(BTM_BUTTONS[i], 'bottomButton_'+i);
	}	
	post('setup_controls successful');
}

function setup_session()
{
	//setup a session manager object, and pass it the javaObject we defined in init()
	session = new SessionComponent('Session', 8, 4, trackBank);
}

function setup_mixer()
{
	//setup a mixer object, and pass it some Java dependencies we created in init()\
	//We define it with a name, the number of tracks, the number of returns
	mixer = new MixerComponent('Mixer', 8, 8, trackBank, undefined, cursorTrack, masterTrack);
	for(var i = 0;i<8;i++)
	{
		mixer.channelstrip(i).createChannelDeviceComponent(8);
		mixer.channelstrip(i)._select.onValue = 127;
	}

}

function setup_device()
{
	//setup a device object, and pass it the javaObject that we created in init()
	//we define it with the number of parameters/macros, with a maximum number of 8 per DeviceComponent (this is BW limitation).
	device = new DeviceComponent('Device', 8, cursorDevice);
}

function setup_transport()
{
	//create a transport object
	transport = new TransportComponent('Transport');
}

function setup_instrument_control()
{
	//setup an adaptive instrument comprised of a sequencer object and several note transposition objects...this is tricky stuff.
	//in trying to be as adaptive as possible, things get pretty complicated.  The components that make up the adpative instrument 
	//can be accessed independently without nearly as much fuss, but the AdaptiveInstrument is neccessary to link the two together.
	//Have a look at the Prototypes for more information.
	instrument = new AdaptiveInstrumentComponent('Instrument', {'drum':[4, 4, 0, 0], 'keys':[8, 2, 0, 2], 'drumseq':[4, 4, 4, 0], 'keysseq':[8, 2, 0, 0]}, lcd);
}

function setup_sequencer()
{
	funstep = new FunSequencerComponent('Fun', 16);
}

function setup_notifications()
{
	//we use this block to setup onscreen notifications that will be triggered when defined parameters change.
	notifier = new NotificationDisplayComponent();

	notifier.add_subject(mixer._selectedstrip._track_name, 'Selected Track', undefined, 8, 'Main');
	notifier.add_subject(device._device_name, 'Device', undefined, 6, 'Device');
	notifier.add_subject(device._bank_name, 'Bank', undefined, 6, 'Device');
	for(var i=0;i<8;i++)
	{
		notifier.add_subject(device._parameter[i].displayed_name, 'Parameter', undefined, 5, 'Param_'+i);
		notifier.add_subject(device._parameter[i].displayed_value, 'Value', undefined, 5, 'Param_'+i);
		notifier.add_subject(device._macro[i], 'Macro : ' + i +  '  Value', undefined, 5);
		for(var j=0;j<6;j++)
		{
			notifier.add_subject(mixer.channelstrip(i)._send[j], ' Send ' + (j+1), undefined, 3);
		}
	}
	notifier.add_subject(MainModes, 'Mode', ['Mixer', 'Sends', 'Devices', 'ClassSeq'], 4);
	var notes = [];
	for(var i=0;i<128;i++)
	{
		notes[i] = Math.floor(i/10.66);
	}
	for(var i=0;i<16;i++)
	{
		notifier.add_subject(funstep._pitches[i], 'Pitch for step '+i, notes, 3, 'Pitch_'+i);
	}
	notifier.add_subject(funstep._scaleOffset, 'Scale', SCALENAMES, 4, 'Keys');
	var octaves = ['C -2', 'C -1', 'C 0', 'C 1', 'C 2', 'C 3', 'C 4', 'C 5', 'C 6', 'C 7'];
	notifier.add_subject(funstep.octave_offset_dial, 'Root Note', octaves, 3);
	notifier.add_subject(lividbutton, 'Encoder Clutch', ['off', 'on', 'on'], 2);
	for(var i=0;i<4;i++)
	{
		notifier.add_subject(sidebuttons[i], 'Shift', ['off', 'on', 'on'], 2);
	}
}

function setup_tasks()
{
	//setup a local task server that is called every 100ms.  We can use this to schedule or repeat events with 
	//multiple arguments
	tasks = new TaskServer(script, 100);
}

function setup_modes()
{
	//We can define multiple pages containing different control assignments.  Each page has an enter, update, and exit call.
	//When entering a mode, enter_mode() is called.  Update_mode should be called when a shift key is pressed.
	//When leaving the current mode, exit_mode() is called.  

	clipLaunch = new Page('ClipLaunch');
	clipLaunch.enter_mode = function()
	{
		post('cliplaunch enter mode');
		grid.reset();
		session.assign_grid(grid);
	}
	clipLaunch.exit_mode = function()
	{
		post('cliplaunch begin exit mode...');
		session.assign_grid();
		post('cliplaunch exit mode');
	}

	trackControl = new Page('TrackControl');
	trackControl.enter_mode = function()
	{
		post('trackControl enter mode');
		grid.reset();
		for(var i=0;i<8;i++)
		{
			mixer.channelstrip(i)._arm.set_control(enc_buttons[i]);
			mixer.channelstrip(i)._solo.set_control(enc_buttons[i+8]);
			mixer.channelstrip(i)._mute.set_control(enc_buttons[i+16]);
			mixer.channelstrip(i)._stop.set_control(enc_buttons[i+24]);
		}
	}
	trackControl.exit_mode = function()
	{
		for(var i=0;i<8;i++)
		{
			mixer.channelstrip(i)._stop.set_control();
			mixer.channelstrip(i)._solo.set_control();
			mixer.channelstrip(i)._arm.set_control();
			mixer.channelstrip(i)._mute.set_control();
		}
		post('trackControl exit mode');
	}

	//Page 0:  Basic Mixer Control
	mixerPage = new Page('mixerPage');
	mixerPage.enter_mode = function()
	{
		post('mixerPage entered');
		for(var i=0;i<8;i++)
		{
			mixer.channelstrip(i)._select.set_control(bottombuttons[i]);
			mixer.channelstrip(i)._send[0].set_control(encs[i]);
			mixer.channelstrip(i)._send[1].set_control(encs[i+8]);
			mixer.channelstrip(i)._pan.set_control(encs[i+16]);
			mixer.channelstrip(i)._volume.set_control(encs[i+24]);
		}
		clipLaunch.enter_mode();
		mixerPage.set_shift_button(sidebuttons[0]);
		mixerPage._shift_button.send(127);
		mixerPage.active = true;
	}
	mixerPage.exit_mode = function()
	{
		for(var i=0;i<8;i++)
		{
			mixer.channelstrip(i)._select.set_control();
			mixer.channelstrip(i)._send[0].set_control();
			mixer.channelstrip(i)._send[1].set_control();
			mixer.channelstrip(i)._pan.set_control();
			mixer.channelstrip(i)._volume.set_control();
		}
		session.set_nav_buttons();
		trackControl.exit_mode();
		clipLaunch.exit_mode();
		session.display_pane(false);
		mixerPage.active = false;
		mixerPage.set_shift_button();
		post('mixerPage exited');
	}
	mixerPage.update_mode = function()
	{
		post('mixerPage updated');
		if(mixerPage._shifted)
		{
			clipLaunch.exit_mode();
			session.display_pane(true);
			for(var i=0;i<8;i++)
			{
				mixer.channelstrip(i)._select.set_control();
			}
			trackControl.enter_mode();
			session.set_nav_buttons(bottombuttons[6], bottombuttons[7], bottombuttons[5], bottombuttons[4]);
			mixerPage._shift_button.send(64);
		}
		else
		{
			trackControl.exit_mode();
			session.set_nav_buttons();
			mixerPage.enter_mode();
		}
	}

	//Page 1:  Send Control for 4 sends
	sendPage = new Page('sendPage');
	sendPage.enter_mode = function()
	{
		post('sendPage entered');
		for(var i=0;i<8;i++)
		{
			mixer.channelstrip(i)._select.set_control(bottombuttons[i]);
			mixer.channelstrip(i)._send[0].set_control(encs[i]);
			mixer.channelstrip(i)._send[1].set_control(encs[i+8]);
			mixer.channelstrip(i)._send[2].set_control(encs[i+16]);
			mixer.channelstrip(i)._send[3].set_control(encs[i+24]);
		}
		clipLaunch.enter_mode();
		sendPage.active = true;
		sendPage.set_shift_button(sidebuttons[1]);
		sendPage._shift_button.send(127);
	}
	sendPage.exit_mode = function()
	{
		for(var i=0;i<8;i++)
		{
			mixer.channelstrip(i)._select.set_control();
			mixer.channelstrip(i)._send[0].set_control();
			mixer.channelstrip(i)._send[1].set_control();
			mixer.channelstrip(i)._send[2].set_control();
			mixer.channelstrip(i)._send[3].set_control();
		}
		session.set_nav_buttons();
		clipLaunch.exit_mode();
		trackControl.exit_mode();
		sendPage.active = false;
		sendPage.set_shift_button();
		post('sendPage exited');
	}
	sendPage.update_mode = function()
	{
		post('sendPage updated');
		if(sendPage._shifted)
		{
			clipLaunch.exit_mode();
			trackControl.enter_mode();
			session.display_pane(true);
			for(var i=0;i<8;i++)
			{
				mixer.channelstrip(i)._select.set_control();
				mixer.channelstrip(i)._send[0].set_control();
				mixer.channelstrip(i)._send[1].set_control();
				mixer.channelstrip(i)._send[2].set_control();
				mixer.channelstrip(i)._send[3].set_control();
				mixer.channelstrip(i)._send[4].set_control(encs[i]);
				mixer.channelstrip(i)._send[5].set_control(encs[i+8]);
				mixer.channelstrip(i)._send[6].set_control(encs[i+16]);
				mixer.channelstrip(i)._send[7].set_control(encs[i+24]);
			}
			session.set_nav_buttons(bottombuttons[6], bottombuttons[7], bottombuttons[5], bottombuttons[4]);
			sendPage._shift_button.send(64);
		}
		else
		{
			for(var i=0;i<8;i++)
			{
				mixer.channelstrip(i)._send[4].set_control();
				mixer.channelstrip(i)._send[5].set_control();
				mixer.channelstrip(i)._send[6].set_control();
				mixer.channelstrip(i)._send[7].set_control();
			}
			session.set_nav_buttons();
			trackControl.exit_mode();
			sendPage.enter_mode();
		}
	}

	//Page 2:  Device Control for up to 4 Devices
	devicePage = new Page('devicePage');
	devicePage.enter_mode = function()
	{
		post('devicePage entered');
		for(var i=0;i<8;i++)
		{
			mixer.channelstrip(i)._select.set_control(bottombuttons[i]);
			mixer.channelstrip(i)._device._enabled.set_control(enc_buttons[i]);
			mixer.channelstrip(i)._device._macro[0].set_control(encs[i]);
			mixer.channelstrip(i)._device._macro[1].set_control(encs[i+8]);
			mixer.channelstrip(i)._device._macro[2].set_control(encs[i+16]);
			mixer.channelstrip(i)._device._macro[3].set_control(encs[i+24]);
		}
		devicePage.set_shift_button(sidebuttons[2]);
		devicePage._shift_button.send(127);
		devicePage.active = true;
	}
	devicePage.exit_mode = function()
	{
		for(var i=0;i<8;i++)
		{
			mixer.channelstrip(i)._device._enabled.set_control();
			mixer.channelstrip(i)._select.set_control();
			for(var j=0;j<8;j++)
			{
				mixer.channelstrip(i)._device._macro[j].set_control();
			}
		}
		
		devicePage.set_shift_button();
		devicePage.active = false;
		post('devicePage exited');
	}
	devicePage.update_mode = function()
	{
		post('devicePage updated');
		if(devicePage._shifted)
		{
			session.display_pane(true);
			session.set_nav_buttons(bottombuttons[6], bottombuttons[7], bottombuttons[5], bottombuttons[4]);
			for(var i=0;i<8;i++)
			{
				mixer.channelstrip(i)._device._macro[0].set_control();
				mixer.channelstrip(i)._device._macro[1].set_control();
				mixer.channelstrip(i)._device._macro[2].set_control();
				mixer.channelstrip(i)._device._macro[3].set_control();
				mixer.channelstrip(i)._device._macro[4].set_control(encs[i]);
				mixer.channelstrip(i)._device._macro[5].set_control(encs[i+8]);
				mixer.channelstrip(i)._device._macro[6].set_control(encs[i+16]);
				mixer.channelstrip(i)._device._macro[7].set_control(encs[i+24]);
			}
			devicePage._shift_button.send(64);
		}
		else
		{
			session.display_pane(false);
			for(var i=0;i<8;i++)
			{
				mixer.channelstrip(i)._device._macro[4].set_control();
				mixer.channelstrip(i)._device._macro[5].set_control();
				mixer.channelstrip(i)._device._macro[6].set_control();
				mixer.channelstrip(i)._device._macro[7].set_control();
			}
			devicePage.enter_mode();
		}
	}

	//Page 3:  Classeq Page
	classeqPage = new Page('classeqPage');
	classeqPage.enter_mode = function()
	{
		post('classeqPage entered');
		for(var i=0;i<8;i++)
		{
			mixer.channelstrip(i)._select.set_control(bottombuttons[i]);
		}
		funstep.assign_grid(seqgrid);
		funstep.assign_knobs(encs.slice(0,16));
		device._enabled.set_control(enc_buttons[16]);
		device.set_macro_controls([encs[16], encs[17], encs[18], encs[19], encs[24], encs[25], encs[26], encs[27]]);
		mixer._selectedstrip._send[0].set_control(encs[20]);
		mixer._selectedstrip._send[1].set_control(encs[21]);
		mixer._selectedstrip._send[2].set_control(encs[22]);
		mixer._selectedstrip._send[3].set_control(encs[28]);
		mixer._selectedstrip._send[4].set_control(encs[29]);
		mixer._selectedstrip._send[5].set_control(encs[30]);
		mixer._selectedstrip._volume.set_control(encs[31]);
		funstep.octave_offset_dial.set_control(encs[23]);
		classeqPage.set_shift_button(sidebuttons[3]);
		classeqPage._shift_button.send(127);
		classeqPage.active = true;
	}
	classeqPage.exit_mode = function()
	{
		for(var i=0;i<8;i++)
		{
			mixer.channelstrip(i)._select.set_control();
		}
		funstep.assign_grid();
		funstep.assign_knobs();
		device.set_macro_controls();
		device._enabled.set_control();
		mixer._selectedstrip._send[0].set_control();
		mixer._selectedstrip._send[1].set_control();
		mixer._selectedstrip._send[2].set_control();
		mixer._selectedstrip._send[3].set_control();
		mixer._selectedstrip._send[4].set_control();
		mixer._selectedstrip._send[5].set_control();
		mixer._selectedstrip._volume.set_control();
		funstep.octave_offset_dial.set_control();
		funstep._scaleOffset.set_control();
		classeqPage.set_shift_button();
		classeqPage.active = false;
		post('classeqPage exited');
	}
	classeqPage.update_mode = function()
	{
		post('classeqPage updated');
		if(classeqPage._shifted)
		{
			for(var i=0;i<8;i++)
			{
				mixer.channelstrip(i)._select.set_control();
			}
			funstep._add_note.set_control(bottombuttons[0]);
			funstep.octave_offset_dial.set_control();
			funstep._scaleOffset.set_control(encs[23]);
			mixer.selectedstrip()._stop.set_control(bottombuttons[1]);
			mixer.selectedstrip()._volume.set_control();
			mixer.selectedstrip()._pan.set_control(encs[31]);
			session._record_clip.set_control(bottombuttons[2]);
			session._create_clip.set_control(bottombuttons[3]);
			session._track_up.set_control(bottombuttons[5]);
			session._track_down.set_control(bottombuttons[4]);
			session._slot_select.set_inc_dec_buttons(bottombuttons[6], bottombuttons[7]);
		}
		else
		{
			funstep._add_note.set_control();
			funstep._scaleOffset.set_control();
			mixer.selectedstrip()._stop.set_control();
			mixer.selectedstrip()._pan.set_control();
			session._record_clip.set_control();
			session._create_clip.set_control();
			session._track_up.set_control();
			session._track_down.set_control();
			session._slot_select.set_inc_dec_buttons();
			classeqPage.enter_mode();
		}
	}



	//Now that we've created a page, we can create a PageStack to contain it.
	script["MainModes"] = new PageStack(4, "Main Modes");
	MainModes.add_mode(0, mixerPage);
	MainModes.add_mode(1, sendPage);
	MainModes.add_mode(2, devicePage);
	MainModes.add_mode(3, classeqPage);
	
	//You can statically set controls to change modes by invoking set_mode_buttons()
	MainModes.set_mode_buttons([sidebuttons[0], sidebuttons[1], sidebuttons[2], sidebuttons[3]]);
}

function setup_usermodes()
{
	//setup a set of controls that will be sent through a User port to BW, where they can be User-mapped.
	user1Input = host.getMidiInPort(0).createNoteInput("CodeUser1", "80????", "90????", "D0????", "E0????");
	userbank1 = new UserBankComponent('UserBank1', CTLCOUNT, user1Input);
	user1Input.setShouldConsumeEvents(false);
}

function setup_fixed_controls()
{
	//this is a convenient block to assign control functions that won't change, even when changing modes.
	//device.set_macro_controls([]);
	/*for(var i=0;i<32;i++)
	{
		userbank1.set_control(i, encs[i]);
	}
	for(var i=0;i<32;i++)
	{
		userbank1.set_control(i+32, enc_buttons[i]);
	}
	for(var i=0;i<5;i++)
	{
		userbank1.set_control(i+37, sidebuttons[i]);
	}
	for(var i=0;i<8;i++)
	{
		userbank1.set_control(i+43, bottombuttons[i]);
	}*/
	//mixer._selectedstrip._clip_navigator.set_inc_dec_buttons(buttons[0], buttons[1]);
	//session._track_up.set_control(buttons[1]);
	//session._track_down.set_control(buttons[0]);
	//transport._stop.set_control(buttons[6]);
	//transport._loop.set_control(buttons[7]);
	//transport._rewind.set_control(buttons[8]);
	//transport._record.set_control(buttons[9]);
	//userbank1.set_enabled(true);
}

function setup_listeners()
{
	//here we can assign global listeners by creating new notifiers and adding listen methods to them.
	lividbutton.add_listener(on_lividbutton_value);
}

function on_lividbutton_value(obj)
{
	var enabled = obj._value == 0;
	for(var i in encs)
	{
		encs[i].set_enabled(enabled)
	}
	obj.send(obj._value);
	if(!obj.pressed())
	{
		MainModes.restore_mode();
	}
	
	//notifier.show_message('Encoder Clutch: ' + (obj.pressed() ? 'on' : 'off'));
}

function exit()
{
	//reset the controls and exit
	resetAll();
}

function onMidi(status, data1, data2)
{
	//this is a global callback setup in init(), we could concievably place it in Prototypes instead.
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
	//this is a global callback setup in init(), we could concievably place it in Prototypes instead.
	//printSysex(data);
}

function setupTests()
{

}



