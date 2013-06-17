// 0613 amounra : http://www.aumhaa.com  

const NOTE_TYPE = 'NOTE_TYPE';
const CC_TYPE = 'CC_TYPE';
const NONE_TYPE = 'NONE_TYPE';
const CHANNEL = 0;

NOTE_OBJECTS = new Array(128);
CC_OBJECTS = new Array(128);
	
//simple utility function to flatten incoming arguments to a function
function arraytoargs(args)
{
	return Array.prototype.slice.call(args, 0);
}

//use this for debug messages instead of println, it can be turned off with DEBUG flag.
function post()
{
	println(arraytoargs(arguments).join(' '));
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
//This is the baseline object to be used for all controls, or objects that 
//will serve as notifiers to other objects.  It maintains a list of listeners as well as a
//"target_stack" that can be used to push/pop targets to be notified when its value changes 
//(only the first target in the stack is notified).  Notifier is "subclassed" by many other prototypes.

function Notifier(name)
{
	var that = this;
	this._name = name;
	this._value = -1;
	this._listeners = [];
	this._target_heap = [];
}

Notifier.prototype.target = function(){return this._target_heap[0];}

Notifier.prototype.set_target = function(target)
{
	if (target)
	{
		if (target in this._target_heap)
		{
			post('target was present for' + this._name, 'placing at front');
			this._target_heap.unshift(this._target_heap.splice(this._target_heap.indexOf(target), 1));
		}
		else
		{
			this._target_heap.unshift(target);
			post('target added to heap for ' + this._name);
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
		if (target in this._target_heap)
		{
			this._target_heap.splice(this._target_heap.indexOf(target), 1);
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
	//post('adding callback:', callback, 'to:', this._name);
	if(!(callback in this._listeners))
	{
		this._listeners.unshift(callback);
	}
}

Notifier.prototype.remove_listener = function(callback)
{
	if(callback in self._listeners){self._listeners.slice(self._listeners.indexOf(callback), 1);}
}

Notifier.prototype.notify = function()
{
	if(this._target_heap[0])
	{
		try
		{
			this._target_heap[0](this);
		}
		catch(err)
		{
			post('callback generated exception:', err, 'for', this._name,' : ',this._target_heap[0]);
		}
	}
	for (var i in this._listeners)
	{
		this._listeners[i](this);
	}
}

//////////////////////////////////////////////////////////////////////////
//A Notifier representing a physical control that can send and receive MIDI 

function Control(identifier, name)
{
	Notifier.call( this, name );
	this._type = NONE_TYPE;
	this._id = identifier;
	this._channel = CHANNEL;
}

Control.prototype = new Notifier();

Control.prototype.constructor = Control;

Control.prototype.identifier = function(){return this._id;}

Control.prototype.receive = function(value)
{
	this._value = value;
	this._pressed = value > 0;
	this.notify();
}

Control.prototype.send = function(value)
{
	//post('sending ' + this._name + ' value of ' + value, 'but no control assignment has been made');
	sendNoteOn(0, this._id, value);
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
	this._type = NOTE_TYPE;
	this._pressed = false;
	this._on_value = 127;
	this._off_value = 0;
	//this._target_heap = [ function(button){post('no target, receive', button._x, button._y, button._id, button._value);}];
	register_control(this);
}

Button.prototype = new Control();

Button.prototype.constructor = Button;

Button.prototype.send = function(value)
{
	sendNoteOn(this._channel, this._id, value);
}

Button.prototype.turn_on = function()
{
	this.send(this._on_value);
}

Button.prototype.turn_off = function()
{
	this.send(this._off_value);
}

////////////////////////////////////////////////////////////////////////////
//A CC_Type Control 

function PadPressure(identifier, name)
{
	Control.call( this, identifier, name);
	this._type = CC_TYPE;
	this._pressed = false;
	register_control(this);
}

PadPressure.prototype = new Control();

PadPressure.prototype.constructor = PadPressure;

PadPressure.prototype.send = function(value){}

////////////////////////////////////////////////////////////////////////////
//A CC_Type Control 

function Slider(identifier, name)
{
	Control.call( this, identifier, name );
	this._type = CC_TYPE;
	this._pressed = false;
	//this._target_heap = [ function(slider){post('no target, receive slider', slider._name, slider._id, slider._value);}];
	register_control(this);
}

Slider.prototype = new Control();

Slider.prototype.constructor = Slider;

Slider.prototype.send = function(value)
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

TouchFader.prototype.set_color = function(){}

TouchFader.prototype.set_mode = function(){}

////////////////////////////////////////////////////////////////////////////
//A notifier that collects a bank of Sliders

function FaderBank(width, name)
{
	Notifier.call( this, name );
	var faderbank = this;
	this._name = name;
	this._faders = new Array(width);
	this.receive = function(fader){faderbank.notify(fader);}
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
		fader.add_listener(this.receive);
	}
}

FaderBank.prototype.send = function(x, value)
{
	this._faders[x].send(value);
}

FaderBank.prototype.notify = function(fader)
{
	if(this._target_heap[0])
	{
		try
		{
			this._target_heap[0](fader);
		}
		catch(err)
		{
			post('callback generated exception:', err, 'for target of', this._name,' : ',this._target_heap[0]);
		}
	}
	for (var i in this._listeners)
	{
		this._listeners[i](fader);
	}
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

////////////////////////////////////////////////////////////////////////////
//A notifier that collects a grid of buttons

function Grid(width, height, name)
{
	Notifier.call( this, name );
	var grid = this;
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
	this._grid = contents.slice(0);
	this.receive = function(button){grid.notify(button);}
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
			//button.add_listener(wrap_callback(this, this.receive));
			button.add_listener(this.receive);
		}
	}
}

Grid.prototype.send = function(x, y, value)
{
	this._grid[x][y].send(value);
}

Grid.prototype.notify = function(button)
{
	if(this._target_heap[0])
	{
		try
		{
			this._target_heap[0](button);
		}
		catch(err)
		{
			post('callback generated exception:', err, 'for target of', this._name,' : ',this._target_heap[0]);
		}
	}
	for (var i in this._listeners)
	{
		this._listeners[i](button);
	}
}

Grid.prototype.get_button = function(x, y)
{
	if(this._grid[x])
	{
		if(this._grid[x][y])
		{
			return this._grid[x][y];
		}
	}
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
	this._value = 0;
	this._mode_callbacks = new Array(number_of_modes);
	this.mode_buttons = [];
}

Mode.prototype = new Notifier();

Mode.prototype.constructor = Mode;

Mode.prototype.mode_value = function(button)
{
	if(button._pressed)
	{
		this.change_mode(this.mode_buttons.indexOf(button));
	}
}

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
	try
	{
		callback();
	}
	catch(err)
	{
		post('no callback for mode ' + this._value + ' for ' + this._name + ' mode component');
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
			post('nothere');
			this.mode_buttons[i].remove_target(this.mode_value);
		}
		if (buttons == undefined)
		{
			buttons = [];
		}
		this.mode_buttons = [];
		for (var i in buttons)
		{
			this.mode_buttons.push(buttons[i]);
			buttons[i].set_target(wrap_callback(this, this.mode_value));
		}
		post('mode buttons length: ' + this._name + ' ' + this.mode_buttons.length)
	}
}

/////////////////////////////////////////////////////////////////////////////
//Parameter is a notifier that automatically updates its listeners when its state changes

function ParameterHolder(name, args)
{
	Notifier.call(this, name);
	var parameter = this;
	this._parameter = undefined;
	this._value = 0;
	for (var i in args)
	{
		this[i] = args[i];
	}
	this.receive = function(value)
	{
		//post('parameter receive:', parameter._name, value);
		parameter._value = parseInt(value);
		parameter.notify();
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
	var page = this;
	this._name = name;
	this._this = this;
	this._controls = {};
	this.active = false;
	this.controlInput = function(button){page.control_input(button);}
}

Page.prototype.enter_mode = function()
{
	post(this._name, ' entered!');
}

Page.prototype.exit_mode = function()
{
	post(this._name, ' entered!');
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
