
const DEFAULT_MIDI_ASSIGNMENTS = {'mode':'chromatic', 'offset':36, 'vertoffset':12, 'scale':'Chromatic', 'drumoffset':0, 'split':false}


isShift = false;

loadAPI(1);

host.defineController("Livid Instruments", "GuitarWing", "1.0", "afc64750-aad5-11e3-a5e2-0800200c9a66");
var PRODUCT = "0C"; //BRAIN="01", OHM64="02", BLOCK="03", CODE="04", MCD="05", MCP="06", OHMRGB="07", CNTRLR="08", BRAIN2="09", ENLIGHTEN="0A", ALIAS8="0B", BASE="0C", BRAINJR="0D"
var LIVIDRESPONSE = "F0 7E ?? 06 02 00 01 61 01 00 "+PRODUCT+" 00 ?? ?? ?? ?? F7";
host.defineSysexDiscovery("F0 7E 7F 06 01 F7", LIVIDRESPONSE);
host.defineMidiPorts(1, 1);
host.addDeviceNameBasedDiscoveryPair(["GuitarWing"], ["GuitarWing"]);
host.addDeviceNameBasedDiscoveryPair(["GuitarWing MIDI 1"], ["GuitarWing MIDI 1"]);
host.addDeviceNameBasedDiscoveryPair(["GuitarWing Base_Controls"], ["GuitarWing Base_Controls"]);

for ( var m = 1; m < 9; m++)
{
	host.addDeviceNameBasedDiscoveryPair(["MIDIIN" + m + " (GuitarWing)"], ["MIDIIN" + m + " (GuitarWing)"]);
}

const PADS = [36, 37, 38, 39, 4];
const BUTTONS = [40, 41, 42, 43, 44, 45, 46, 47, 48, 49];
const SLIDERS = [1, 2, 3];
const ACCELS = [5, 6, 7];

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

var DEBUG = true;		//post() doesn't work without this
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
	
	post('GuitarWing script loading ------------------------------------------------');

	//setup our basic callback functions for MIDI reception
	host.getMidiInPort(0).setMidiCallback(onMidi);
	host.getMidiInPort(0).setSysexCallback(onSysex);
	
	//define global stuff
	initialize_noteInput();     //here we define the port and channel we want to listen to
	initialize_prototypes();	//this initializes the processes that our framework uses for communication
	initialize_surface();       //any controlsurface specific init calls should be placed in this function


	setup_controls();		//here we define all our controls by assigning their corresponding MIDI event filters
	//setup_lcd();			//any textual feedback going to the controlsurface should be set up here
	resetAll();				//turn off everything on the controlsurface

	//the following calls create js subordinates to the Java functions we're hooking into
	setup_session();
	setup_mixer();
	setup_device();
	setup_transport();
	//setup_instrument_control();
	setup_usermodes();
	setup_tasks();

	//setup_modes();			//define the differnet modes we'll be using, and assign controls to its functionality
	setup_notifications();	//define notifications that will be called when certain functionality is triggered
	setup_fixed_controls();	//any control assignments that aren't mode-dependent should be initialized here

	setup_listeners();		//use this to set up any mode-independent global listeners
	setupTests();

	LOCAL_OFF();
	//MainModes.change_mode(0, true);
	post('GuitarWing script loaded! ------------------------------------------------');
	notifier.show_message('GuitarWing Script version ' + VERSION +' loaded.');
}

function initialize_noteInput()
{
	noteInput = host.getMidiInPort(0).createNoteInput("GuitarWing", "80????", "90????", "D0????", "E0????");
	noteInput.setShouldConsumeEvents(false);

}

function initialize_surface()
{

}

function setup_controls()
{
	script['faders'] = [];
	script['fader_buttons'] = [];
	for (var i = 0;i < 3; i++)
	{
		faders[i] = new Slider(SLIDERS[i], 'Fader_'+i);
		fader_buttons[i] = new Button(SLIDERS[i], 'Fader_Button_'+i);
	}
	script['pads'] = [];
	script['pad_CCs'] = [];
	for (var i = 0;i < 5; i++)
	{
		pads[i] = new Button(PADS[i], 'Pad_'+i);
		pad_CCs[i] = new Slider(PADS[i], 'Pad_CC_'+i);
	}		
	script['buttons'] = [];
	for ( var i = 0; i< 10; i++)
	{
		buttons[i] = new Button(BUTTONS[i], 'Button_'+i);
	}
	script['accels'] = [];
	for (var i = 0; i < 3; i++)
	{
		accels[i] = new Slider(ACCELS[i], 'Accel_'+i);
	}
	post('setup_controls successful');
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
	transport = new TransportComponent('Transport');
}

function setup_instrument_control()
{
	instrument = new AdaptiveInstrumentComponent('Instrument', {'drum':[4, 4, 0, 0], 'keys':[8, 2, 0, 2], 'drumseq':[4, 4, 4, 0], 'keysseq':[8, 2, 0, 0]}, lcd);
}

function setup_notifications()
{
	notifier = new NotificationDisplayComponent();
}

function setup_tasks()
{
	tasks = new TaskServer(script, 100);
}

function setup_modes()
{
	
	//Page 0:  Send Control and Instrument throughput
	mainPage = new Page('mainPage');
	clipPage.enter_mode = function()
	{
		post('mainPage entered');

		clipPage.set_shift_button(function_buttons[0]);
		clipPage.active = true;
	}
	clipPage.exit_mode = function()
	{
		clipPage.active = false;
		post('mainPage exited');
	}
	clipPage.update_mode = function()
	{
		post('mainPage updated');
		if(clipPage._shifted)
		{
		}
		else
		{
			clipPage.enter_mode();
		}
	}
	script["MainModes"] = new PageStack(1, "Main Modes");
	MainModes.add_mode(0, mainPage);
	MainModes.set_mode_buttons([]);
}

function setup_usermodes()
{
	user1Input = host.getMidiInPort(0).createNoteInput("GuitarWingUser1", "80????", "90????", "D0????", "E0????");
	userbank1 = new UserBankComponent('UserBank1', 4, user1Input);
	user1Input.setShouldConsumeEvents(false);
}

function setup_fixed_controls()
{
	device.set_macro_controls([faders[0], faders[1], faders[2], accels[2], fader_buttons[0], fader_buttons[1], fader_buttons[2], pads[4]]);
	for(var i=0;i<4;i++)
	{
		pads[i].set_translation(36+i);
		userbank1.set_control(i, buttons[2+i]);
	}
	for(var i=0;i<2;i++)
	{
		userbank1.set_control(4+i, accels[i]);
	}
	mixer._selectedstrip._clip_navigator.set_inc_dec_buttons(buttons[0], buttons[1]);
	transport._stop.set_control(buttons[6]);
	transport._loop.set_control(buttons[7]);
	transport._rewind.set_control(buttons[8]);
	transport._record.set_control(buttons[9]);
	userbank1.set_enabled(true);
}

function setup_listeners()
{

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
		post('NOTE: ' + status + ' ' + data1 + ' ' + data2);
		NOTE_OBJECTS[data1].receive(data2);
	}
}

function onSysex(data)
{
	//printSysex(data);
}

function setupTests()
{

}



