// Use strict mode if available.
"use strict";

/**
 * Report messages of minor importance to the user.
 *
 * A #StatusBar is usually placed along the bottom of an application's main #Window. It may provide a regular
 * commentary of the application's status, or may be used to simply output a message when the status changes.
 *
 * Status bars maintain a stack of messages. The message at the top of the each bar's stack is the one that will
 * currently be displayed.
 *
 * Any messages added to a status bar's stack must specify a context id that is used to uniquely identify the source
 * of a message. This context id can be generated by #getContextId(), given a context description. Note that messages
 * are stored in a stack, and when choosing which message to display, the stack structure is adhered to, regardless of
 * the context identifier of a message.
 *
 * One could say that a status bar maintains one stack of messages for display purposes, but allows multiple message
 * producers to maintain sub-stacks of the messages they produced (via context ids).
 */
Class.define('StatusBar', {
    extend: 'Box',
    
    /*
     * Private methods; initializing.
     */
    
    initialize: function()
    {
        StatusBar.base.initialize.call(this);
        
        // Set spacing.
        this.setSpacing(2);
        
        // Set members.
        this.label         = new Label({visible: true, 'h-align': 0, 'margin-left': 2}); // TODO: Ellipsize, fetch via read-only property?
        this.contexts      = [{description: 'default'}];
        this.messages      = [];
        this.nextMessageId = 1;
        
        // Add label.
        this.add(this.label);
    },
    
    getHtml: function()
    {
        return '<div class="x-widget x-box x-status-bar x-body x-shadow-in" />';
    },
    
    getPreferredSize: function()
    {
        var prefSize = StatusBar.base.getPreferredSize.call(this);
        
        prefSize.minimum.height = Math.max(prefSize.minimum.height, 17); // TODO: Constant.
        
        return prefSize;
    },
    
    checkContextId: function(contextId)
    {
        contextId = contextId || 0;
        if (!this.contexts[contextId])
            throw new Error('Given context id is unknown.');
        
        return contextId;
    },
    
    updateLabel: function()
    {
        var length = this.messages.length;
        if (!length)
        {
            this.label.setText('');
            return;
        }
        
        this.label.setText(this.messages[length - 1].text);
    },
    
    /*
     * Properties.
     */
    
    properties: {
        /**
         * The shadow type of the bar. Will be applied to the whole bar. If only a part of the
         * bar needs a shadow, insert a #Frame into the bar.
         *
         * @type ShadowType
         * @see Frame
         */
        'shadow-type': {
            write: function(shadowType)
            {
                this.el.replaceClass('x-shadow-' + this.shadowType, 'x-shadow-' + shadowType);
                
                this.shadowType = shadowType;
            },
            read: true,
            defaultValue: ShadowType.IN
        }
    },
    
    /*
     * Actions.
     */
    
    actions: {
        /**
         * Returns a new context identifier, given a description of the actual context.
         * Note that the description is not shown in the UI.
         *
         * @param string description Description of the context.
         *
         * @return int An identifier of the context, to be used by the other actions.
         */
        getContextId: function(description)
        {
            for (var i = this.contexts.length - 1; i >= 0; --i)
            {
                if (this.contexts[i].description === description)
                    return i;
            }
            
            this.contexts.push({description: description});
            
            return this.contexts.length - 1;
        },
        /**
         * Pushes a new message onto a status bar's stack.
         *
         * @param string text      Text to be pushed on the stack.
         * @param int    contextId Context id. See #getContextId().
         *
         * @return int The id of the message. Can be used as an identifier for #remove().
         */
        push: function(text, contextId)
        {
            // Check context id.
            contextId = this.checkContextId(contextId);
            
            // Push message.
            this.messages.push({text: text, contextId: contextId, id: this.nextMessageId});
            ++this.nextMessageId;
            
            // Update label.
            this.updateLabel();
            
            return this.nextMessageId - 1;
        },
        /**
         * Removes the first message from the status bar's stack with the given context id.
         *
         * @param int contextId Context id. See #getContextId().
         */
        pop: function(contextId)
        {
            // Check context id.
            contextId = this.checkContextId(contextId);
            
            // Pop message.
            for (var i = this.messages.length - 1; i >= 0; --i)
            {
                if (this.messages[i].contextId === contextId)
                {
                    this.messages.splice(i, 1);
                    
                    // Update label.
                    this.updateLabel();
                    
                    return;
                }
            }
        },
        /**
         * Forces the removal of a message from a status bar's stack.
         * The exact context id and message id must be specified.
         *
         * @param int contextId Context id of the message to be removed. See #getContextId().
         * @param int messageId Message id to be removed. See #push().
         */
        remove: function(contextId, messageId)
        {
            // Check context id.
            contextId = this.checkContextId(contextId);
            
            // Remove message.
            for (var i = this.messages.length - 1; i >= 0; --i)
            {
                var msg = this.messages[i];
                
                if ((msg.id === messageId) && (msg.contextId === contextId))
                {
                    this.messages.splice(i, 1);
                    
                    // Update label.
                    this.updateLabel();
                    
                    return;
                }
            }
        },
        /**
         * Forces the removal of all messages from a status bar's stack with the exact context id.
         *
         * @param int contextId Context id to remove messages of. See #getContextId().
         */
        removeAll: function(contextId)
        {
            // Check context id.
            contextId = this.checkContextId(contextId);
            
            // Remove messages with given context id.
            for (var i = this.messages.length - 1; i >= 0; --i)
            {
                if (this.messages[i].contextId === contextId)
                {
                    this.messages.splice(i, 1);
                }
            }
            
            // Update label.
            this.updateLabel();
        }
    }
});
