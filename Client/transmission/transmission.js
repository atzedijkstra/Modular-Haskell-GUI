// Use strict mode if available.
"use strict";

Enum.define('MessageType', {
    ESTABLISH: 'establish',
    ACKNOWLEGDE: 'acknowledge',
    CREATE: 'create',
    ACTION: 'action',
    SIGNAL: 'signal',
    SET: 'set',
    KEEPALIVE: 'keepalive',
    CLOSE: 'close',
    ERROR: 'error'
});

Enum.define('TransmissionState', {
    CONNECTING: 1,
    CONNECTED: 2,
    ESTABLISHED: 3,
    CLOSED: 4
});

Singleton.define('Transmission', {
    initialize: function()
    {
        // Set our version.
        this.version = '1.0';
        
        // Set state and objects.
        this.state = TransmissionState.CONNECTING;
        
        this.singletons = {
            1: Application,
            2: Screen
        };
        
        this.objects = {};
        
        this.classes = {
            'AspectFrame': true,
            'Box': true,
            'Button': true,
            'CheckButton': true,
            'Entry': true,
            'Fixed': true,
            'Frame': true,
            'Image': true,
            'Label': true,
            'MainWindow': true,
            'Menu': true,
            'MenuBar': true,
            'MenuItem': true,
            'ProgressBar': true,
            'RadioButton': true,
            'Scale': true,
            'ScrollBar': true,
            'ScrolledWindow': true,
            'Separator': true,
            'SeparatorMenuItem': true,
            'Spinner': true,
            'StatusBar': true,
            'ToggleButton': true,
            'Window': true,
            
            'Adjustment': true,
            'RadioButtonGroup': true
        };
        
        console.log('Connecting to ' + window.location.hostname + ':' + 9000 + '.');
        
        // Create new connection.
        this.conn = new Connection(window.location.hostname, 9000);

        this.conn.connect('open', this.onConnectionOpen, this);
        this.conn.connect('close', this.onConnectionClose, this);
        this.conn.connect('data', this.onConnectionData, this);
    },
    
    /*
     * Message handlers.
     */
    
    handleMessage: function(message)
    {
        if (message instanceof Array)
        {
            message.forEach(this.handleMessage, this);
            return;
        }
        
        console.log('Handling message:');
        console.log(message);
        
        try
        {
            if (message instanceof Object)
            {
                // Call handler.
                var handler = this.messageHandlers[message.type];
                if (handler && handler.call(this, message))
                    return;
                
                // Handler did not succeed.
                this.closeReason = 'Message handler did not succeed, or unknown message.';
            }
        }
        catch (e)
        {
            // Set close reason.
            this.closeReason = e.message;
        }
        
        // Show close reason.
        console.log("Closing connection. Reason:\n" + this.closeReason);
        
        // Close connection.
        this.conn.close();
    },
    
    messageHandlers: (function()
        {
            var handlers = {};
            
            handlers[MessageType.ACKNOWLEGDE] = function(message)
            {
                console.log('Got a acknowledge message.');
                
                if (this.state === TransmissionState.CONNECTED)
                {
                    if (message.version >= this.version)
                    {
                        this.serverVersion = message.version;
                        this.state = TransmissionState.ESTABLISHED;
                        
                        console.log('Established connection.');
                        
                        return true;
                    }
                    else
                    {
                        throw new Error('Server its protocol version is lower than ours.');
                    }
                }
                
                throw new Error('Got an unexpected acknowledge messsage.');
            };
            
            handlers[MessageType.CREATE] = function(message)
            {
                console.log('Got a create message.');
                
                if (this.state !== TransmissionState.ESTABLISHED)
                    throw new Error('Got a create message, while connection not established.');
                
                var cls  = message['class'];
                var id   = message.id;
                
                if (!this.classes[cls])
                    throw new Error('Class \'' + cls + '\' is not allowed to be instanciated.');
                
                if (id < 1000)
                    throw new Error('Cannot instantiate a singleton.');
                
                if (this.objects[id])
                    throw new Error('Object with id ' + id + ' already exists.');
                
                var obj = this.objects[id] = Instance.create(cls);
                obj._id = id;
                
                // Register propert-change signal handler.
                obj.connect('property-changed', this.onObjectPropertyChange, this);
                
                return true;
            };
            
            handlers[MessageType.ACTION] = function(message)
            {
                console.log('Got an action message.');
                
                if (this.state !== TransmissionState.ESTABLISHED)
                    throw new Error('Got an action message, while connection not established.');
                
                var id   = message.id;
                var name = message.name;
                var args = message.args;
                
                var obj = this.getObjectById(id);
                
                if (!obj.hasAction(name))
                    throw new Error('Object does not have an action named \'' + name + '\'.');
                
                // Call action.
                obj.doAction(name, this.decodeArguments(args));
                
                return true;
            };
            
            handlers[MessageType.SET] = function(message)
            {
                console.log('Got a set message.');
                
                if (this.state !== TransmissionState.ESTABLISHED)
                    throw new Error('Got a set message, while connection not established.');
                
                var id    = message.id;
                var name  = message.name;
                var value = message.value;
                
                var obj = this.getObjectById(id);
                
                if (!obj.hasProperty(name))
                    throw new Error('Object does not have a property named \'' + name + '\'.');
                
                // Set property.
                obj.setProperty(name, value);
                
                return true;
            };
            
            handlers[MessageType.CLOSE] = function(message)
            {
                console.log('Got a close message.');
                
                throw new Error('Serverside closed connection.');
            };
            
            handlers[MessageType.ERROR] = function(message)
            {
                console.log('Got an error message.');
                
                throw new Error("A serverside error occurred:\n" + message.msg);
            };
            
            return handlers;
        })(),
    
    /*
     * Helper methods.
     */
    
    getObjectById: function(id)
    {
        if (id < 1000)
        {
            if (this.singletons[id])
                return this.singletons[id];
        }
        else
        {
            if (this.objects[id])
                return this.objects[id];
        }
        
        throw new Error('Object with id ' + id + ' could not be found.');
    },
    
    decodeArguments: function(args)
    {
        if (!(args instanceof Array))
            throw new Error('Arguments is not an array.');
        
        var result = [];
        var length = args.length;
        for (var i = 0; i < length; ++i)
        {
            result.push(this.decodeArgument(args[i]));
        }
        
        return result;
    },
    
    decodeArgument: function(arg)
    {
        if (arg instanceof Object)
        {
            // Decode array.
            if (arg instanceof Array)
                return this.decodeArguments(arg);
            
            // It's an object, get its corresponding object.
            return this.getObjectById(arg.id);
        }
        
        // A string, a number, a boolean or null.
        // Undefined and NaN is not part of JSON.
        return arg;
    },
    
    /*
     * Event handlers.
     */
    
    onConnectionOpen: function(conn)
    {
        console.log('Connection has been openened.');
        
        // Set state.
        this.state = TransmissionState.CONNECTED;
        
        // Send an establish message.
        conn.send({
            type: MessageType.ESTABLISH,
            version: this.version
        });
    },
    
    onConnectionData: function(conn, data)
    {
        console.log('Got some data:');
        console.log(data);
        
        this.handleMessage(data);
    },
    
    onConnectionClose: function(conn)
    {
        this.state = TransmissionState.CLOSED;
        
        console.log('Connection closed.');
    },
    
    onObjectPropertyChange: function(obj, name)
    {
        console.log('A property has changed: ' + name);
        
        var id    = obj._id;
        var value = obj.getProperty(name); // TODO: Give value with it?
        
        // Send a set message.
        conn.send({
            type: MessageType.SET,
            id: id,
            name: name,
            value: value
        });
    }
});

Transmission.initialize();
