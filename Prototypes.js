// 0613 amounra : http://www.aumhaa.com  

const NOTE_TYPE = 'NOTE_TYPE';
const CC_TYPE = 'CC_TYPE';
const NONE_TYPE = 'NONE_TYPE';
const CHANNEL = 0;
const NONE = 'NONE';

const colors = {OFF : 0, WHITE : 1, CYAN : 5, MAGENTA : 9, RED : 17, BLUE : 33, YELLOW : 65, GREEN : 127};

NOTE_OBJECTS = new Array(128);
CC_OBJECTS = new Array(128);

//var noteInput = {'setNoteKeyMap':function(){}};
var noteInput = {'setKeyTranslationTable':function(){}};
var midiBuffer = {NONE_TYPE:{},CC_TYPE:{},NOTE_TYPE:{}}; 
var midiNoteBuffer = {};
var midiCCBuffer = {};

var recalculate_translation_map = true;

var Note_Translation_Table = [];
for (var i=0;i<128;i++) {Note_Translation_Table[i] = -1}

//this function initializes all the prototype core processes.  It should be called during init().
function initialize_prototypes()
{
	registerControlDicts();
 	host.scheduleTask(flush, null, 100);
}

function extend(destination, source)
{
	for (var k in source) 
	{
		if (source.hasOwnProperty(k))
		{
			destination[k] = source[k];
		}
	}
	return destination; 
}
	
//simple utility function to flatten incoming arguments to a function
function arrayfromargs(args)
{
	return Array.prototype.slice.call(args, 0);
}

//use this for debug messages instead of println, it can be turned off with DEBUG flag.
function post()
{
	println('> '+arrayfromargs(arguments).join(' '));
}

//we need to use this when adding notifier targets or listeners so that the proper context is maintained.
//it isn't necessary for certain prototype targets, but won't hurt either.  If something doesn't work, try this.
function wrap_callback(obj, func)
{
	var callback = function(control)
	{
		func.apply(obj, [control]);
	}
	return callback;
}

//this is called at init to initialize all control definitions
function registerControlDicts()
{
	NOTE_OBJECTS = new Array(128);
	for (var i=0;i<128;i++){NOTE_OBJECTS[i] = new Control(i, 'None');}
	CC_OBJECTS = new Array(128);
	for (var i=0;i<128;i++){CC_OBJECTS[i] = new Control(i, 'None');}
}

//this is called whenever a control object is created, and basically maintains a list of all NOTE_TYPES and CC_TYPES that sever as lookup tables for MIDI input.
function register_control(control)
{
	if (control._type == NOTE_TYPE)
	{
		NOTE_OBJECTS[control._id] = control;
	}
	else if(control._type == CC_TYPE)
	{
		CC_OBJECTS[control._id] = control;
	}
}

function flush()
{
	for(var type in midiBuffer)
	{
		var buf = midiBuffer[type];
		for(var index in buf)
		{
			var Event = buf[index];
			Event[0]._send(Event[1]);
		}
	}
	midiBuffer = {NONE_TYPE:{},CC_TYPE:{},NOTE_TYPE:{}}; 
	if(recalculate_translation_map)
	{
		//post('Note_Translation_Table:', Note_Translation_Table);
		noteInput.setKeyTranslationTable(Note_Translation_Table);
		recalculate_translation_map = false;
	}
}

//this sends reset() to all controls that are defined with register_control()
function resetAll()
{
	for (var index in CC_OBJECTS)
	{
		CC_OBJECTS[index].reset();
	}
	for (var index in NOTE_OBJECTS)
	{
		NOTE_OBJECTS[index].reset();
	}
}

/////////////////////////////////////////////////////////////////////////
//This is the root object to be used for all controls, or objects that 
//will serve as notifiers to other objects.  It maintains a list of listeners as well as a
//"target_stack" that can be used to push/pop targets to be notified when its value changes 
//(only the first target in the stack is notified).  Notifier is "subclassed" by many other prototypes.

function Notifier(name)
{
	var self = this;
	this._name = name;
	this._value = -1;
	this._listeners = [];
	this._target_heap = [];
	this._self = function(){return self;}
}

Notifier.prototype.get_target = function(){return this._target_heap[0];}

Notifier.prototype.set_target = function(target)
{
	if (target)
	{
		if (target in this._target_heap)
		{
			//post('target was present for' + this._name, 'placing at front');
			this._target_heap.unshift(this._target_heap.splice(this._target_heap.indexOf(target), 1));
		}
		else
		{
			this._target_heap.unshift(target);
			//post('target added to heap for ' + this._name);
		}
	}
	else
	{
		this.remove_target();
	}
}

Notifier.prototype.remove_target = function(target)
{
	if (target)
	{
		for(item in this._target_heap)
		{
			if(target == this._target_heap[item])
			{
				this._target_heap.splice(item, 1);
				break;
			}
		}
	}
	else
	{
		this._target_heap.shift();
	}
}

Notifier.prototype.clear_targets = function()
{
	this._target_heap = [];
}

Notifier.prototype.add_listener = function(callback)
{
	if(!(callback in this._listeners))
	{
		this._listeners.unshift(callback);
	}
}

Notifier.prototype.remove_listener = function(callback)
{
	if(callback in this._listeners){this._listeners.slice(this._listeners.indexOf(callback), 1);}
}

Notifier.prototype.notify = function(obj)
{
	if(!obj)
	{
		obj = this;
	}
	//post('notify', this._name, obj._name);
	if(this._target_heap[0])
	{
		var cb = this._target_heap[0];
		try
		{
			cb[0].call(cb[1], obj);
		}
		catch(err)
		{
			post('target callback exception:', err);
			post('-> for', this._name,' : ',cb);
		}
	}
	for (var i in this._listeners)
	{
		var cb = this._listeners[i];
		try
		{
			cb[0].call(cb[1], obj);
		}
		catch(err)
		{
			post('listener callback exception:', err);
			post('-> for', this._name,' : ',cb);
		}
	}
}

Notifier.prototype.notify = function(obj)
{
	if(!obj)
	{
		obj = this;
	}
	//post('notify', this._name, obj._name);
	if(this._target_heap[0])
	{
		var cb = this._target_heap[0];
		try
		{
			cb(obj);
		}
		catch(err)
		{
			post('target callback exception:', err);
			post('-> for', this._name,' : ',cb);
		}
	}
	for (var i in this._listeners)
	{
		var cb = this._listeners[i];
		try
		{
			cb(obj);
		}
		catch(err)
		{
			post('listener callback exception:', err);
			post('-> for', this._name,' : ',cb);
		}
	}
}

//////////////////////////////////////////////////////////////////////////
//A Notifier representing a physical control that can send and receive MIDI 

function Control(identifier, name)
{
	Notifier.call( this, name );
	var self = this;
	this._type = NONE_TYPE;
	this._id = identifier;
	this._channel = CHANNEL;
	this.receive = function(value)
	{
		self._value = value;
		self.notify();
	}
	this.receive_notifier = function(notification)
	{
		self.send(notification._value);
	}
}

Control.prototype = new Notifier();

Control.prototype.constructor = Control;

Control.prototype.identifier = function(){return this._id;}

Control.prototype._send = function(value){}//this should be overridden by subclass

Control.prototype.send = function(value)
{
	midiBuffer[this._type][this._id] = [this, value];
}

Control.prototype.reset = function()
{
	this.send(0);
}

//////////////////////////////////////////////////////////////////////////
//A NOTE_TYPE Control

function Button(identifier, name)
{
	Control.call( this, identifier, name );
	var this_button = this;
	this._type = NOTE_TYPE;
	this._onValue = 127;
	this._offValue = 0;
	this._translation = -1;
	register_control(this);
}

Button.prototype = new Control();

Button.prototype.constructor = Button;

Button.prototype.pressed = function()
{
	return this._value > 0;
}

Button.prototype._send = function(value)
{
	sendNoteOn(this._channel, this._id, value);
}

Button.prototype.turn_on = function()
{
	this.send(this._onValue);
}

Button.prototype.turn_off = function()
{
	this.send(this._offValue);
}

Button.prototype.set_on_off_values = function(onValue, offValue)
{
	this._onValue = onValue||127;
	this._offValue = offValue||0;
}

Button.prototype.set_translation = function(newID)
{
	//post(this._name, 'set translation', this._id, newID);
	this._translation = newID;
	Note_Translation_Table[this._id] = this._translation;
	recalculate_translation_map = true;
}

////////////////////////////////////////////////////////////////////////////
//A CC_Type Control 

function PadPressure(identifier, name)
{
	Control.call( this, identifier, name);
	this._type = CC_TYPE;
	register_control(this);
}

PadPressure.prototype = new Control();

PadPressure.prototype.constructor = PadPressure;

PadPressure.prototype.pressed = function()
{
	return this._value > 0;
}

////////////////////////////////////////////////////////////////////////////
//A CC_Type Control 

function Slider(identifier, name)
{
	Control.call( this, identifier, name );
	this._type = CC_TYPE;
	register_control(this);
}

Slider.prototype = new Control();

Slider.prototype.constructor = Slider;

Slider.prototype._send = function(value)
{
	sendChannelController(this._channel, this._id, value);
}

////////////////////////////////////////////////////////////////////////////
//Slider Control with extra capabilities for Livid hardware

function TouchFader(identifier, name)
{
	Slider.call( this, identifier, name );
	this._color = 0;
}

TouchFader.prototype = new Slider();

TouchFader.prototype.constructor = TouchFader;

TouchFader.prototype.set_color = function(color){}//not implemented

TouchFader.prototype.set_mode = function(mode){}//not implemented

////////////////////////////////////////////////////////////////////////////
//A notifier that collects a bank of Sliders

function FaderBank(width, name)
{
	Notifier.call( this, name );
	var self = this;
	this._name = name;
	this._faders = new Array(width);
	this.receive = function(fader){self.notify(fader);}
}

FaderBank.prototype = new Notifier();

FaderBank.prototype.constructor = FaderBank;

FaderBank.prototype.controls = function()
{
	return this._faders;
}

FaderBank.prototype.add_fader = function(x, fader)
{
	if(x < this._faders.length)
	{
		this._faders[x] = fader;
		fader._x = x;
		fader._y = 0;
		fader.coordinates = function()
		{
			return [fader._x, fader._y];
		}
		fader._faderbank = this;
		//fader.add_listener([this.receive,this]);
		fader.add_listener(this.receive);
	}
}

FaderBank.prototype.send = function(x, value)
{
	this._faders[x].send(value);
}

FaderBank.prototype.get_fader = function(x)
{
	if(this._faders[x])
	{
		return this._faders[x];
	}
}

FaderBank.prototype.reset = function()
{
	for (index in this._faders)
	{
		this._faders[index].reset();
	}
}

//FaderBank.prototype.receive = function(fader){this.notify(fader);}

////////////////////////////////////////////////////////////////////////////
//A notifier that collects a grid of buttons

function Grid(width, height, name)
{
	Notifier.call( this, name );
	var self = this;
	this.width = function(){return width}
	this.height = function(){return height}
	this._name = name;
	var contents = [];
	for(var i = 0; i < width; i++)
	{
		contents[i] = [];
		for(var j = 0; j < height; j++)
		{
			contents[i][j] = undefined;
		}
	}
	this._grid = contents;
	this.receive = function(button){self.notify(button);}
	/*this.notify = function(button)
	{
		if(this_grid._target_heap[0])
		{
			try
			{
				this_grid._target_heap[0](button);
			}
			catch(err)
			{
				post('callback generated exception:', err, 'for target of', this_grid._name,' : ',this_grid._target_heap[0]);
			}
		}
		for (var i in this._listeners)
		{
			this_grid._listeners[i](button);
		}
	}*/
}

Grid.prototype = new Notifier();

Grid.prototype.constructor = Grid;

Grid.prototype.controls = function()
{
	var buttons = [];
	for(var x in this._grid)
	{
		for(var y in this._grid[x])
		{
			buttons.push(this._grid[x][y]);
		}
	}
	return buttons;
}

Grid.prototype.add_button = function(x, y, button)
{
	if(x < this._grid.length)
	{
		if(y < this._grid[x].length)
		{
			this._grid[x][y] = button;
			button._x = x;
			button._y = y;
			button.coordinates = function()
			{
				return [button._x, button._y];
			}
			button._grid = this;
			button.set_target(this.receive);
		}
	}
}

Grid.prototype.send = function(x, y, value)
{
	this._grid[x][y].send(value);
}

Grid.prototype.get_button = function(x, y)
{
	var button = undefined;
	if(this._grid[x])
	{
		if(this._grid[x][y])
		{
			button = this._grid[x][y];
		}
	}
	return button;
}

Grid.prototype.reset = function()
{
	var buttons = this.controls();
	for (index in buttons)
	{
		buttons[index].reset();
	}
}

/////////////////////////////////////////////////////////////////////////////
//Mode is a notifier that automatically updates buttons when its state changes

function Mode(number_of_modes, name)
{
	Notifier.call( this, name);
	var self = this;
	this._value = 0;
	this._mode_callbacks = new Array(number_of_modes);
	this.mode_buttons = [];
	this.mode_value = function(button)
	{
		if(button.pressed())
		{
			self.change_mode(self.mode_buttons.indexOf(button));
		}
	}
}

Mode.prototype = new Notifier();

Mode.prototype.constructor = Mode;

/*Mode.prototype.mode_value = function(button)
{
	if(button.pressed())
	{
		this.change_mode(this.mode_buttons.indexOf(button));
	}
}*/

Mode.prototype.change_mode = function(value, force)
{
	if (value < (this._mode_callbacks.length))
	{
		if((this._value != value)||(force))
		{
			this._value = value;
			this.update();
		}
	}
}

Mode.prototype.update = function()
{
	var callback = this._mode_callbacks[this._value];
	if(callback)
	{
		try
		{
			callback();
		}
		catch(err)
		{
			post('callback error:', err, 'for mode index', this._value,'for', this._name, 'mode component');
		}
	}
	for(var i in this.mode_buttons)
	{
		if (i == this._value)
		{
			this.mode_buttons[i].turn_on();
		}
		else
		{
			this.mode_buttons[i].turn_off();
		}
	}
}
		
Mode.prototype.add_mode = function(mode, callback)
{
	if (mode < this._mode_callbacks.length)
	{
		this._mode_callbacks[mode] = callback;
	}
}

Mode.prototype.set_mode_buttons = function(buttons)
{
	if (((buttons.length == this._mode_callbacks.length)||(buttons == undefined))&&(buttons != this.mode_buttons))
	{
		for (var i in this.mode_buttons)
		{
			this.mode_buttons[i].remove_target(this.mode_value);
		}
		if(!buttons)
		{
			buttons = [];
		}
		this.mode_buttons = [];
		for (var i in buttons)
		{
			this.mode_buttons.push(buttons[i]);
			buttons[i].set_target(this.mode_value);
		}
		//post('mode buttons length: ' + this._name + ' ' + this.mode_buttons.length)
	}
}

/////////////////////////////////////////////////////////////////////////////
//Parameter is a notifier that automatically updates its listeners when its state changes

function ParameterHolder(name, args)
{
	Notifier.call( this, name );
	var self = this;
	this._parameter = undefined;
	this._value = 0;
	for (var i in args)
	{
		this[i] = args[i];
	}
	this.receive = function(value)
	{
		self._value = value;
		self.notify();
	}
}

ParameterHolder.prototype = new Notifier();

ParameterHolder.prototype.constructor = ParameterHolder;

/////////////////////////////////////////////////////////////////////////////
//PageStack is a Mode subclass that handles entering/leaving pages automatically

function PageStack(number_of_modes, name)
{
	Mode.call( this, number_of_modes, name);
	this._pages = new Array(number_of_modes);
}

PageStack.prototype = new Mode();

PageStack.prototype.constructor = PageStack;

PageStack.prototype.add_mode = function(mode, page)
{
	if ((page instanceof Page) && (mode < this._mode_callbacks.length))
	{
		this._pages[mode] = page;
	}
	else
	{
		post('Invalid add_mode assignment for', this._name, mode, ':', page);
	}
}

PageStack.prototype.change_mode = function(value, force)
{
	if (value < (this._mode_callbacks.length))
	{
		if((this._value != value)||(force))
		{
			this._pages[this._value].exit_mode();
			this._value = value;
			this._pages[this._value].enter_mode();
			this.update();
		}
	}
}

/////////////////////////////////////////////////////////////////////////////
//Page holds a controls dict that can hash a control to an internal function

function Page(name)
{
	var self = this;
	this._name = name;
	this._this = this;
	this._controls = {};
	this.active = false;
	this._shifted = false;
	this.controlInput = function(control){self.control_input(control);}
	this._shiftValue = function(obj)
	{
		var new_shift = false;
		if(obj)
		{
			new_shift = obj._value > 0;
		}
		if(new_shift != self._shifted)
		{
			self._shifted = new_shift;
			self.update_mode();
		}
	}
}

Page.prototype.enter_mode = function()
{
	post(this._name, ' entered!');
}

Page.prototype.exit_mode = function()
{
	post(this._name, ' exited!');
}

Page.prototype.update_mode = function()
{
	post(this._name, ' updated!');
}

Page.prototype.set_shift_button = function(button)
{
	if ((button != this._shift_button)&&(button instanceof(Notifier) || !button))
	{
		if(this._shift_button)
		{
			this._shift_button.remove_target(this._shiftValue);
		}
		this._shift_button = button;
		if(this._shift_button)
		{
			this._shift_button.set_target(this._shiftValue);
		}
	}
}

Page.prototype.control_input = function(control)
{
	post('Page: ', this._name, 'recieved control input ', control._name);
	if(control in this._controls)
	{
		this._controls[control](control);
	}
}

Page.prototype.register_control = function(control, target)
{
	if (control instanceof Grid)
	{
		var grid_controls = control.controls();
		for(index in grid_controls)
		{
			this._controls[grid_controls[index]] = target;
		}
		post('grid added to ', this._name, 's control dict');
	}
	else if(control instanceof FaderBank)
	{
		post('faderbank found......');
		var faderbank_controls = control.controls();
		for(index in faderbank_controls)
		{
			this._controls[faderbank_controls[index]] = target;
		}
		post('faderbank added to ', this._name, 's control dict');
	}
	else if(control instanceof Control)
	{
		this._controls[control] = target;
		post('control: ', control._name, ' added to ', this._name, 's control dict');
	}
}

/////////////////////////////////////////////////////////////////////////////
//Storage objects contained in ClipLaunchComponent

function ClipSlotComponent(name, clipLauncher)
{
	ParameterHolder.call( this, name )
	var self = this;
	this._name = name;
	this._clipLauncher = clipLauncher;
	this._session = clipLauncher._session;
	this.hasContent = false;
	this.isPlaying = false;
	this.isQeued = false;
	this.isRecording = false;
}

ClipSlotComponent.prototype = new ParameterHolder();

ClipSlotComponent.prototype.constructor = ClipSlotComponent;

ClipSlotComponent.prototype.update = function()
{
	this._value = this.isRecording ? this._session.colors().isRecordingColor :
		this.isPlaying ? this._session.colors().isPlayingColor : 
		this.isQueued ? this._session.colors().isQueuedColor :
		this.hasContent ? this._session.colors().hasContentColor : 
		this._session.colors().isEmptyColor;
	this.notify();
}

/////////////////////////////////////////////////////////////////////////////
//Clip controller for each track contained in SessionComponent

function ClipLaunchComponent(name, height, clipLauncher, session)
{
	Notifier.call( this, name )
	var self = this;
	this._name = name;
	this._session = session;
	this._clipLauncher = clipLauncher;
	this._clipslots = new Array(height);
	this.launch = function(clipslot){clipLauncher.launch(clipslot);}
	this._hasContentListener = function(clipslot, value)
	{
		var clipslot = 	self._clipslots[clipslot];
		clipslot.hasContent = value;
		clipslot.update();
	}
	this._isPlayingListener = function(clipslot, value)
	{
		var clipslot = 	self._clipslots[clipslot];
		clipslot.isPlaying = value;
		clipslot.update();
	}
	this._isQueuedListener = function(clipslot, value)
	{
		var clipslot = 	self._clipslots[clipslot];
		clipslot.isQueued = value;
		clipslot.update();
	}
	this._isRecordingListener = function(clipslot, value)
	{
		var clipslot = 	self._clipslots[clipslot];
		clipslot.isRecording = value;
		clipslot.update();
	}
	for (var c = 0; c < height; c++)
	{
		this._clipslots[c] = new ClipSlotComponent(this._name + '_ClipSlot_' + c, this);
		this._clipLauncher.addHasContentObserver(this._hasContentListener);
		this._clipLauncher.addIsPlayingObserver(this._isPlayingListener);
		this._clipLauncher.addIsQueuedObserver(this._isQueuedListener);
		this._clipLauncher.addIsRecordingObserver(this._isRecordingListener);
	}
}

ClipLaunchComponent.prototype = new Notifier();

ClipLaunchComponent.prototype.constructor = ClipLaunchComponent;

ClipLaunchComponent.prototype.get_clipslot = function(slot)
{
	return this._clipslots[slot];
}

/////////////////////////////////////////////////////////////////////////////
//Component containing tracks and scenes, assignable to grid

function SessionComponent(name, width, height, trackBank, _colors)
{
	var this_session = this;
	this._name = name;
	this._grid = undefined;
	this._colors = _colors||{'hasContentColor': colors.WHITE, 
					'isPlayingColor':colors.GREEN, 
					'isQueuedColor' : colors.YELLOW,
					'isRecordingColor' : colors.RED,
					'isEmptyColor' : colors.OFF,
					'navColor' : colors.BLUE};
	this._trackBank = trackBank;
	this._tracks = [];
	this.width = function(){return width}
	this.height = function(){return height}
	for (var t = 0; t < width; t++)
	{
		var track = trackBank.getTrack(t);
		this._tracks[t] = new ClipLaunchComponent(this._name + '_ClipLauncher_' + t, height, track.getClipLauncher(), this);
	}
	this.receive_grid = function(button){if(button.pressed()){this_session._tracks[button._x].launch(button._y);}}
	
	this._navUp = new GenericParameterComponent(this._name + '_NavUp', 0, this._trackBank, 'scrollScenesUp', 'addCanScrollScenesUpObserver', this._colors.navColor);
	this._navDn = new GenericParameterComponent(this._name + '_NavDown', 1, this._trackBank, 'scrollScenesDown', 'addCanScrollScenesDownObserver', this._colors.navColor);
	this._navLt = new GenericParameterComponent(this._name + '_NavLeft', 2, this._trackBank, 'scrollTracksDown', 'addCanScrollTracksDownObserver', this._colors.navColor);
	this._navRt = new GenericParameterComponent(this._name + '_NavRight', 3, this._trackBank, 'scrollTracksUp', 'addCanScrollTracksUpObserver', this._colors.navColor);

}

//SessionComponent.prototype = new SessionComponent();

SessionComponent.prototype.assign_grid = function(new_grid)
{
	if(this._grid!=undefined)
	{
		this._grid.remove_target(this.receive_grid);
	}
	if ((new_grid instanceof Grid) && (new_grid.width() == this.width()) && (new_grid.height() == this.height()))
	{
		this._grid = new_grid;
		this._grid.set_target(this.receive_grid);
		for (var track in this._tracks)
		{
			for(var slot in this._tracks[track]._clipslots)
			{
				var clipslot = this._tracks[track]._clipslots[slot];
				var button = this._grid.get_button(track, slot);
				clipslot.set_target(button.receive_notifier);
				clipslot.update();
			}
		}
	}
}

SessionComponent.prototype.colors = function()
{
	return this._colors;
}

SessionComponent.prototype.set_navigation_buttons = function(upBtn, dnBtn, ltBtn, rtBtn){}

/////////////////////////////////////////////////////////////////////////////
//Component containing tracks from trackbank and their corresponding ChannelStrips

function MixerComponent(name, num_channels, num_returns, trackBank, cursorTrack, masterTrack, _colors)
{
	var self = this;
	this._name = name;
	this._trackBank = trackBank;
	this._cursorTrack = cursorTrack;
	this._masterTrack = masterTrack;
	this._channelstrips = [];
	for (var cs = 0;cs < num_channels; cs++)
	{
		this._channelstrips[cs] = new ChannelStripComponent(this._name + '_ChannelStrip_' + cs, cs, trackBank.getTrack(cs), num_returns, _colors);
	}
	this._selectedstrip = new ChannelStripComponent(this._name + '_SelectedStrip', -1, this._cursorTrack, num_returns, _colors);
	this._masterstrip = new ChannelStripComponent(this._name + '_MasterStrip', -2, this._masterTrack, 0, _colors);
}

MixerComponent.prototype.channelstrip = function(num)
{
	if(num < this._channelstrips.length)
	{
		return this._channelstrips[num];
	}
}

MixerComponent.prototype.returnstrip = function(num)
{
	if(num < this._returnstrips)
	{
		return this._returnstrips[num];
	}
}

MixerComponent.prototype.selectedstrip = function()
{
	return this._selectedstrip;
}

MixerComponent.prototype.assign_volume_controls = function(controls)
{
	if((controls instanceof(FaderBank))&&(controls.controls().length == this._channelstrips.length))
	{
		for (var i in this._channelstrips)
		{
			this._channelstrips[i]._volume.set_control(controls.get_fader(i));
		}
	}
	else
	{
		for (var i in this._channelstrips)
		{
			this._channelstrips[i]._volume.set_control();
		}
	}
}

MixerComponent.prototype.assign_return_controls = function(controls){}

MixerComponent.prototype.set_return_control = function(num, controls){}

/////////////////////////////////////////////////////////////////////////////
//Component containing tracks from trackbank and their corresponding controls, values

function ChannelStripComponent(name, num, track, num_sends, _colors)
{
	var self = this;
	this._name = name;
	this._num = num;
	this._num_sends = num_sends;
	this._track = track;

	this._colors = _colors||{'muteColor': colors.YELLOW, 
					'soloColor':colors.CYAN, 
					'armColor' : colors.RED,
					'selectColor' : colors.WHITE};

	this._volume = new RangedParameterComponent(this._name + '_Volume', 0, this._track.getVolume(), 128);

	this._mute = new ToggledParameterComponent(this._name + '_Mute', 0, this._track.getMute(), 'toggle', 'addValueObserver', this._colors.muteColor);

	this._solo = new ToggledParameterComponent(this._name + '_Solo', 0, this._track.getSolo(), 'toggle', 'addValueObserver', this._colors.soloColor);

	this._arm = new ToggledParameterComponent(this._name + '_Arm', 0, this._track.getArm(), 'toggle', 'addValueObserver', this._colors.armColor);

	this._select = new GenericParameterComponent(this._name + '_Select', 0, self._track, 'select', 'addIsSelectedObserver', this._colors.selectColor);
	this._select._Callback = function(obj){if(obj._value){self._track.select();}}

	this._stop = new ParameterComponent(this._name + '_Stop', 0, self._track);
	this._stop._Callback = function(obj){if(obj._value){self._track.stop();}}

	this._send = [];
	for(var i=0;i<num_sends;i++)
	{
		this._send[i] = new RangedParameterComponent(this._name + '_Send_' + i, i, this._track.getSend(i), 128);
	}

	this.updateControls = function()
	{
		//post('vals:', self._volumeValue, self._muteValue, self._soloValue, self._armValue);
		self.volumeListener(self._volumeValue);
		self.muteListener(self._muteValue);
		self.soloListener(self._soloValue);
		self.armListener(self._armValue);
	}


}

/////////////////////////////////////////////////////////////////////////////
//Base class for a parameter object

function ParameterComponent(name, num, Obj, action, monitor, onValue, offValue)
{
	var self = this;
	this._name = name;
	this._num = num;
	this._onValue = onValue||127;
	this._offValue = offValue||0;
	this._control;
	this._Value = 0;
	this._Listener = function(value)
	{
		self._Value = value;
		if(self._control)
		{
			if(value)
			{
				self._control.send(self._onValue);
			}
			else
			{
				self._control.send(self._offValue);
			}
		}
	}
	this._Callback = function(obj){self._Listener(obj._value)}
	this.set_control = function(control)
	{
		if (control instanceof(Notifier) || !control)
		{
			if(self._control)
			{
				self._control.remove_target(self._Callback);
			}
			self._control = control;
			if(self._control)
			{
				self._control.set_target(self._Callback);
				self._Listener(self._Value);
			}
		}
	}	
}

/////////////////////////////////////////////////////////////////////////////
//Base class for BitWig java container

function ParameterComponent(name, num, javaObj)
{
	//ParameterComponent.call( this, name, num )
	var self = this;
	this._name = name;
	this._num = num;
	this._control;
	this._Obj = javaObj;
	this._Value = 0;
	this._Listener = function(value){}
	this._Callback = function(obj){if(obj._value){self._Obj.set(obj._value);}}
	this.set_control = function(control)
	{
		if (control instanceof(Notifier) || !control)
		{
			if(self._control)
			{
				self._control.remove_target(self._Callback);
			}
			self._control = control;
			if(self._control)
			{
				self._control.set_target(self._Callback);
				self._Listener(self._Value);
			}
		}
	}	
}

/////////////////////////////////////////////////////////////////////////////
//Base class for BitWig java container

function GenericParameterComponent(name, num, javaObj, action, monitor, onValue, offValue)
{
	ParameterComponent.call( this, name, num, javaObj )
	var self = this;
	this._onValue = onValue||127;
	this._offValue = offValue||0;
	if(action){this._Callback = function(obj){if(obj._value){self._Obj[action]();}}}
	this._Listener = function(value)
	{
		self._Value = value;
		if(self._control)
		{
			if(value)
			{
				self._control.send(self._onValue);
			}
			else
			{
				self._control.send(self._offValue);
			}
		}
	}
	this.set_control = function(control)
	{
		if (control instanceof(Notifier) || !control)
		{
			if(self._control)
			{
				self._control.remove_target(self._Callback);
			}
			self._control = control;
			if(self._control)
			{
				self._control.set_target(self._Callback);
				self._Listener(self._Value);
			}
		}
	}	
	if(monitor){this._Obj[monitor](this._Listener);}
}

GenericParameterComponent.prototype = new ParameterComponent();

GenericParameterComponent.prototype.constructor = ParameterComponent;

GenericParameterComponent.prototype.set_on_off_colors = function(onValue, offValue)
{
	this._onValue = onValue;
	this._offValue = offValue;
}

/////////////////////////////////////////////////////////////////////////////
//Subclass of ParameterComponent that expects to contain RangedValues

function RangedParameterComponent(name, num, javaObj, range)
{
	ParameterComponent.call( this, name, num, javaObj )
	var self = this;
	this._Range = range||128;
	this._Callback = function(obj){if(obj._value!=undefined){self._Obj.set(obj._value, self._Range);}}
	this._Listener = function(value)
	{
		self._Value = value;
		if(self._control)
		{
			self._control.send(value);
		}
	}
	this.set_control = function(control)
	{
		if (control instanceof(Notifier) || !control)
		{
			if(self._control)
			{
				self._control.remove_target(self._Callback);
			}
			self._control = control;
			if(self._control)
			{
				self._control.set_target(self._Callback);
				self._Listener(self._Value);
			}
		}
	}
	javaObj.addValueObserver(this._Range, this._Listener);
}

RangedParameterComponent.prototype = new ParameterComponent();

RangedParameterComponent.prototype.constructor = ParameterComponent;

/////////////////////////////////////////////////////////////////////////////
//Subclass of ParameterComponent that expects to contain Bool values

function ToggledParameterComponent(name, num, javaObj, action, monitor, onValue, offValue )
{
	GenericParameterComponent.call( this, name, num, javaObj, action, monitor, onValue, offValue )
	var self = this;
	this._Callback = function(obj){if(obj._value){self._Obj[action]();}}
}

ToggledParameterComponent.prototype = new ParameterComponent();

ToggledParameterComponent.prototype.constructor = ParameterComponent;

/////////////////////////////////////////////////////////////////////////////
//Component containing controls for currently controlled cursorDevice

function DeviceComponent(name, size, cursorDevice)
{
	var self = this;
	this._name = name;
	this._size = size;
	this._cursorDevice = cursorDevice;
	this._parameter = [];
	for(var i=0;i<size;i++)
	{
		this._parameter[i] = new RangedParameterComponent(this._name + '_Parameter_' + i, i, this._cursorDevice.getParameter(i), 128);
	}
	this._navUp = new GenericParameterComponent(this._name + '_NavUp', 0, this._cursorDevice, 'nextParameterPage');
	this._navDn = new GenericParameterComponent(this._name + '_NavDown', 1, this._cursorDevice, 'previousParameterPage');
	this._navLt = new GenericParameterComponent(this._name + '_NavLeft', 2, this._cursorDevice, 'selectNext');
	this._navRt = new GenericParameterComponent(this._name + '_NavRight', 3, this._cursorDevice, 'selectPrevious');

	
}

/////////////////////////////////////////////////////////////////////////////
//Overlay interface to host.scheduleTask that allows singlerun tasks and removable repeated tasks
const _NOTENAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']
var NOTENAMES = [];
for(var i=0;i<128;i++)
{
	NOTENAMES[i]=(_NOTENAMES[i%12] + ' ' + Math.floor(i/12));
}

const WHITEKEYS = {0:0, 2:2, 4:4, 5:5, 7:7, 9:9, 11:11, 12:12};
const NOTES = [24, 25, 26, 27, 28, 29, 30, 31, 16, 17, 18, 19, 20, 21, 22, 23, 8, 9, 10, 11, 12, 13, 14, 15, 0, 1, 2, 3, 4, 5, 6, 7];
const DRUMNOTES = [12, 13, 14, 15, 28, 29, 30, 31, 8, 9, 10, 11, 24, 25, 26, 27, 4, 5, 6, 7, 20, 21, 22, 23, 0, 1, 2, 3, 16, 17, 18, 19];
const SCALENOTES = [36, 38, 40, 41, 43, 45, 47, 48, 24, 26, 28, 29, 31, 33, 35, 36, 12, 14, 16, 17, 19, 21, 23, 24, 0, 2, 4, 5, 7, 9, 11, 12];
const KEYCOLORS = [colors.BLUE, colors.CYAN, colors.MAGENTA, colors.RED];
const SCALES = 	{'Mod':[0,1,2,3,4,5,6,7,8,9,10,11],
			'Session':[0,1,2,3,4,5,6,7,8,9,10,11],
			'Auto':[0,1,2,3,4,5,6,7,8,9,10,11],
			'Chromatic':[0,1,2,3,4,5,6,7,8,9,10,11],
			'DrumPad':[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15],
			'Major':[0,2,4,5,7,9,11],
			'Minor':[0,2,3,5,7,8,10],
			'Dorian':[0,2,3,5,7,9,10],
			'Mixolydian':[0,2,4,5,7,9,10],
			'Lydian':[0,2,4,6,7,9,11],
			'Phrygian':[0,1,3,5,7,8,10],
			'Locrian':[0,1,3,4,7,8,10],
			'Diminished':[0,1,3,4,6,7,9,10],
			'Whole-half':[0,2,3,5,6,8,9,11],
			'Whole Tone':[0,2,4,6,8,10],
			'Minor Blues':[0,3,5,6,7,10],
			'Minor Pentatonic':[0,3,5,7,10],
			'Major Pentatonic':[0,2,4,7,9],
			'Harmonic Minor':[0,2,3,5,7,8,11],
			'Melodic Minor':[0,2,3,5,7,9,11],
			'Dominant Sus':[0,2,5,7,9,10],
			'Super Locrian':[0,1,3,4,6,8,10],
			'Neopolitan Minor':[0,1,3,5,7,8,11],
			'Neopolitan Major':[0,1,3,5,7,9,11],
			'Enigmatic Minor':[0,1,3,6,7,10,11],
			'Enigmatic':[0,1,4,6,8,10,11],
			'Composite':[0,1,4,6,7,8,11],
			'Bebop Locrian':[0,2,3,5,6,8,10,11],
			'Bebop Dominant':[0,2,4,5,7,9,10,11],
			'Bebop Major':[0,2,4,5,7,8,9,11],
			'Bhairav':[0,1,4,5,7,8,11],
			'Hungarian Minor':[0,2,3,6,7,8,11],
			'Minor Gypsy':[0,1,4,5,7,8,10],
			'Persian':[0,1,4,5,6,8,11],
			'Hirojoshi':[0,2,3,7,8],
			'In-Sen':[0,1,5,7,10],
			'Iwato':[0,1,5,6,10],
			'Kumoi':[0,2,3,7,9],
			'Pelog':[0,1,3,4,7,8],
			'Spanish':[0,1,3,4,5,6,8,10]}

const SCALEABBREVS = {'Mod':'E3', 'Session':'-S','Auto':'-A','Chromatic':'12','DrumPad':'-D','Major':'M-','Minor':'m-','Dorian':'II','Mixolydian':'V',
			'Lydian':'IV','Phrygian':'IH','Locrian':'VH','Diminished':'d-','Whole-half':'Wh','Whole Tone':'WT','Minor Blues':'mB',
			'Minor Pentatonic':'mP','Major Pentatonic':'MP','Harmonic Minor':'mH','Melodic Minor':'mM','Dominant Sus':'D+','Super Locrian':'SL',
			'Neopolitan Minor':'mN','Neopolitan Major':'MN','Enigmatic Minor':'mE','Enigmatic':'ME','Composite':'Cp','Bebop Locrian':'lB',
			'Bebop Dominant':'DB','Bebop Major':'MB','Bhairav':'Bv','Hungarian Minor':'mH','Minor Gypsy':'mG','Persian':'Pr',
			'Hirojoshi':'Hr','In-Sen':'IS','Iwato':'Iw','Kumoi':'Km','Pelog':'Pg','Spanish':'Sp'}

var SCALENAMES = [];
var i = 0;
for (var name in SCALES){SCALENAMES[i] = name;i++};

function ScalesComponent(name)
{
	var self = this;
	this._name = name;
	this._split = false;
	this._grid;
	this._update = function()
	{
		post('vert:', self._vertOffset._value, 'note:', self._noteOffset._value, ':', NOTENAMES[self._noteOffset._value], 'scale', SCALENAMES[self._scaleOffset._value]);
		if(self._grid != undefined)
		{
			var offset = self._noteOffset._value;
			var vertoffset = self._vertOffset._value;
			var scale = SCALENAMES[self._scaleOffset._value];
			var split = self._split;
			var scale_len = SCALES[scale].length;
			for(var column=0;column<self._grid.width();column++)
			{
				for(var row=0;row<self._grid.height();row++)
				{
					var note_pos = column + (Math.abs(3-row))*parseInt(vertoffset);
					var note = offset + SCALES[scale][note_pos%scale_len] + (12*Math.floor(note_pos/scale_len));
					var button = self._grid.get_button(column, row)
					button.set_translation(note%127);
					button.scale_color = KEYCOLORS[((note%12) in WHITEKEYS) + (((note_pos%scale_len)==0)*2)];
					//post('note', note, note%12, 'a:', ((note%12) in WHITEKEYS), NOTENAMES[note],  'b:', (((note_pos%scale_len)==0)*2));
					button.send(button.scale_color);
				}
			}
		}
	}
	this._vertOffset = new OffsetComponent('Vertical_Offset', 0, 119, 4, this._update, colors.MAGENTA);
	this._noteOffset = new OffsetComponent('Note_Offset', 0, 119, 36, this._update, colors.WHITE);
	this._scaleOffset = new OffsetComponent('Scale_Offset', 0, SCALES.length, 5, this._update, colors.BLUE);
}

//ScalesComponent.prototype = new ScalesComponent();

ScalesComponent.prototype.set_grid = function(grid)
{
	if(this._grid != undefined)
	{
		for(var column=0;column<this._grid.width();column++)
		{
			for(var row=0;row<this._grid.height();row++)
			{
				this._grid.get_button(column, row).set_translation(-1);
			}
		}
	}
	this._grid = grid;
	this._update();
}

/////////////////////////////////////////////////////////////////////////////
//Notifier that uses two buttons to change an offset value

function OffsetComponent(name, minimum, maximum, initial, callback, onValue, offValue)
{
	Notifier.call(this, name)
	var self = this;
	this._min = minimum||0;
	this._max = maximum||127;
	this._value = initial||0;
	this._incButton;
	this._decButton;
	this._onValue = onValue||127;
	this._offValue = offValue||0;
	this._displayValues = [this._onValue, this._offValue];
	this.incCallback = function(obj)
	{
		if((obj._value>0)&&(self._value<self._max))
		{
			self._value++;
			self._update_buttons();
			self.notify();
		}
	}
	this.decCallback = function(obj)
	{
		if((obj._value>0)&&(self._value>self._min))
		{
			self._value--;
			self._update_buttons();
			self.notify();
		}
	}
	this._update_buttons = function()
	{
		if(self._incButton)
		{
			if(self._value<self._max)
			{
				self._incButton.send(self._onValue);
			}
			else
			{
				self._incButton.send(self._offValue);
			}
		}
		if(self._decButton)
		{
			if(self._value>self._min)
			{
				self._decButton.send(self._onValue);
			}
			else
			{
				self._decButton.send(self._offValue);
			}
		}
	}
	if(callback!=undefined)
	{
		this.set_target(callback);
	}
}

OffsetComponent.prototype = new Notifier();

OffsetComponent.prototype.constructor = OffsetComponent;

OffsetComponent.prototype.set_inc_dec_buttons = function(incButton, decButton)
{
	if (incButton instanceof(Notifier) || !incButton)
	{
		if(this._incButton)
		{
			this._incButton.remove_target(this.incCallback)
		}
		this._incButton = incButton;
		if(this._incButton)
		{
			this._incButton.set_target(this.incCallback)
		}
	}
	if (decButton instanceof(Notifier) || !decButton)
	{
		if(this._decButton)
		{
			this._decButton.remove_target(this.decCallback)
		}
		this._decButton = decButton;
		if(this._decButton)
		{
			this._decButton.set_target(this.decCallback)
		}
	}
	this._update_buttons();
}


/////////////////////////////////////////////////////////////////////////////
//Component for step sequencing

function StepSequencerComponent(name, width, height, cursorClip)
{

	var SEQ_BUFFER_STEPS = 32;	
	var STEP_SIZE =
	{
		STEP_1_4 : 0,
		STEP_1_8 : 1,
		STEP_1_16 : 2,
		STEP_1_32 : 3
	};
	var velocities = [127, 100, 80, 50];
	this.velocityStep = 2;
	this.velocity = velocities[this.velocityStep];
	this._stepSet = initArray(false, SEQ_BUFFER_STEPS*128);
	this.detailMode = false;
	this.activeStep = 0;
	this.playingStep = -1;
	this.stepSize = STEP_SIZE.STEP_1_16;
	this.Colors = {'PlayingOn':colors.RED, 'PlayingOff':colors.MAGENTA, 'On':colors.YELLOW, 'Off':colors.OFF};
	var self = this;
	this._width = width;
	this._height = height;
	this._velocity = 100;
	this._shifted = false;

	this._cursorClip = cursorClip;
	if(!cursorClip){this._cursorClip = host.createCursorClipSection(SEQ_BUFFER_STEPS, 128);}


	this.receive_grid = function(button)
	{
		if(button.pressed())
		{
			var step = button._x + 8*button._y;  // + this.viewOffset();
			self._cursorClip.toggleStep(step, self.key_offset._value, self.velocity);
		}
	}
	this._onStepExists = function(column, row, state)
	{
		post('onStepExists', column, row, state);
		self._stepSet[column*128 + row] = state;
		self.update();
	}
	this._onStepPlay = function(step)
	{
		self.playingStep = step;
		self.update();
	}
	this._on_shift = function(){}
	this.update = function()
	{
		if(self._grid)
		{
			buttons = self._grid.controls();
			var size = buttons.length;
			var key = self.key_offset._value;
			for(var i=0;i<size;i++)
			{
				var button = buttons[i];
				var step = button._x + (button._y*8);
				//var isSet = self.hasAnyKey(index);
				var isSet = self._stepSet[step * 128 + key]
				var isPlaying = step == self.playingStep;
				var colour = isSet ?
					(isPlaying ? self.Colors.PlayingOn : self.Colors.On) :
					(isPlaying ? self.Colors.PlayingOff : self.Colors.Off);
				button.send(colour);
			}
		}
	}

	this._on_key_change = function(obj)
	{
		//self._cursorClip.scrollToKey(self.key_offset._value);
		self.update();
	}
	this.key_offset = new OffsetComponent('Key_Offset', 0, 127, 0, this._on_key_change, colors.BLUE);

	this._cursorClip.addStepDataObserver(this._onStepExists);
	this._cursorClip.addPlayingStepObserver(this._onStepPlay);
	//this._cursorClip.scrollToKey(this.key_offset._value);
}

StepSequencerComponent.prototype.assign_grid = function(new_grid)
{
	if(this._grid!=undefined)
	{
		this._grid.remove_target(this.receive_grid);
		this._grid = undefined;
	}
	if ((new_grid instanceof Grid) && (new_grid.width() == this._width) && (new_grid.height() == this._height))
	{
		this._grid = new_grid;
		this._grid.set_target(this.receive_grid);
		this.update();
	}
}

StepSequencerComponent.prototype.hasAnyKey = function(step)
{
	for(var i=0; i<128; i++)
	{
		if (this._stepSet[step * 128 + i])
		{
			return true;
		}
	}
	return false;
}

/////////////////////////////////////////////////////////////////////////////
//Overlay interface to host.scheduleTask that allows singlerun tasks and removable repeated tasks


function TaskServer(script, interval)
{
	var self = this;
	this._singleQeue = [];
	this._repeatQeue = [];
	var run = function()
	{
		for(var task in this._singleQeue)
		{
			script[task].call(script, this._singleQeue[task]);
			delete this._singleQeue[task];
		}
		for(var task in this._singleQeue)
		{
			script[task].call(script, this._repeatQeue[task]);
		}
	}
	host.scheduleTask(run, null, interval);
}

TaskServer.prototype.addSingleTask = function(callback, arguments)
{
	if(typeof(callback)==='function')
	{
		this._singleQeue.push([callback, arguments]);
	}
}

TaskServer.prototype.addRepeatTask = function(callback, arguments)
{
	if(typeof(callback)==='function')
	{
		this._repeatQeue.push([callback, arguments]);
	}
}

TaskServer.prototype.removeRepeatTask = function(callback, arguments)
{
	for(var i in this._repeatQeue)
	{
		if(this._repeatQeue[i]==[callback, arguments])
		{
			delete this._repeatQeue[i];
		}
	}
}

