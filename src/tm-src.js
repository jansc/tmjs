/*jslint browser: true, devel: true, onevar: true, undef: true,
  nomen: false, eqeqeq: true, plusplus: true, bitwise: true,
  regexp: true, newcap: true, immed: true */
/*global  window*/ 

var TM, TopicMapSystemFactory;

/**
 * @namespace Global namespace that holds all Topic Maps related objects.
 * @author Jan Schreiber <jans@ravn.no>
 * @copyright 2010 Jan Schreiber <http://purl.org/net/jans>
 * Date: 
 */
TM = (function () {
    var Version, Hash, Locator, EventType, TopicMemImpl, AssociationMemImpl,
        ScopedMemImpl, ConstructMemImpl, TypedMemImpl, ReifiableMemImpl,
        DatatypeAwareMemImpl, TopicMapMemImpl, RoleMemImpl, NameMemImpl,
        VariantMemImpl, OccurrenceMemImpl, TopicMapSystemMemImpl,
        IndexMemImpl, TypeInstanceIndexMemImpl, SameTopicMapHelper;

    Version = '@VERSION';

    // -----------------------------------------------------------------------
    // Our swiss army knife for mixin of functions
    // See http://javascript.crockford.com/inheritance.html
    Function.prototype.swiss = function (parnt) {
        var i, name;
        for (i = 1; i < arguments.length; i += 1) {
            name = arguments[i];
            this.prototype[name] = parnt.prototype[name];
        }
        return this;
    };

    // -----------------------------------------------------------------------
    // Simple hash table for lookup tables
    Hash = function () {
        this.hash = {};
        this.length = 0;
    };

    // Simple hash implementation
    Hash.prototype = {
        get: function (key) {
           return this.hash[key];
        },

        contains: function (key) {
             return this.get(key) !== undefined;
        },

        put: function (key, val) {
            if (!this.hash[key]) {
                this.length += 1;
            }
            this.hash[key] = val;
            return val;
        },

        remove: function (key) {
            delete this.hash[key];
            this.length -= 1;
            return this;
        },

        keys: function () {
            var ret = [], key;
            for (key in this.hash) {
                if (this.hash.hasOwnProperty(key)) {
                    ret.push(key);
                }
            }
            return ret;
        },

        values: function () {
            var ret = [], key;
            for (key in this.hash) {
                if (this.hash.hasOwnProperty(key)) {
                    ret.push(this.hash[key]);
                }
            }
            return ret;
        },

        empty: function () {
            this.hash = {};
            this.length = 0;
        },

        size: function () {
            return this.length;
        }
    };

    // -----------------------------------------------------------------------
    // Internal event handling system
    EventType = {};
    EventType.ADD_ASSOCIATION = 1;
    EventType.ADD_NAME = 2;
    EventType.ADD_OCCURRENCE = 3;
    EventType.ADD_ROLE = 4;
    EventType.ADD_TOPIC = 5;
    EventType.ADD_TYPE = 6;
    EventType.REMOVE_ASSOCIATION = 7;
    EventType.REMOVE_NAME = 8;
    EventType.REMOVE_OCCURRENCE = 9;
    EventType.REMOVE_ROLE = 10;
    EventType.REMOVE_TOPIC = 11;
    EventType.SET_TYPE = 12;

    // -----------------------------------------------------------------------
    // TODO: The locator functions need some more work. Implement resolve()
    // and toExternalForm()
    Locator = function (parnt, iri) {
        this.parnt = parnt;
        this.iri = iri;
    };

    Locator.prototype.getReference = function () {
        return this.iri;
    };

    Locator.prototype.equals = function (other) {
        return (this.iri === other.getReference());
    };


    // -----------------------------------------------------------------------
    /**
     * @class Represents a Topic Maps construct.
     */
    ConstructMemImpl = function () {};

    /** 
     * Adds an item identifier.
     * @param {Locator} itemIdentifier The item identifier to add.
     * @throws {ModelConstraintException} If the itemidentifier is null.
     * @throws {IdentityConstraintException} If another Topic Maps construct with
     *         the same item identifier exists.
     */
    ConstructMemImpl.prototype.addItemIdentifier = function (itemIdentifier) {
        var existing;
        if (itemIdentifier === null) {
            throw {name: 'ModelConstraintException',
            message: 'addItemIdentifier(null) is illegal'};
        }
        existing = this.getTopicMap()._ii2construct.get(itemIdentifier.getReference());
        if (existing) {
            throw {name: 'IdentityConstraintException',
                message: 'Topic Maps constructs with the same item identifier '+
                        'are not allowed',
                reporter: this,
                existing: existing,
                locator: itemIdentifier};
        }
        this.itemIdentifiers.push(itemIdentifier);
        this.getTopicMap()._ii2construct.put(itemIdentifier.getReference(), this);
    };

    /**
    * Returns true if the other object is equal to this one.
    */
    ConstructMemImpl.prototype.equals = function (other) {
        return (this.id === other.id);
    };
    
    /** Returns the identifier of this construct. */
    ConstructMemImpl.prototype.getId = function () {
        return this.id;
    };
    
    /** Returns the item identifiers of this Topic Maps construct. */
    ConstructMemImpl.prototype.getItemIdentifiers = function () {
        return this.itemIdentifiers;
    };
    
    /** Returns the parent of this construct. */
    ConstructMemImpl.prototype.getParent = function () {
        return this.parnt;
    };
    
    /** Returns the TopicMap instance to which this Topic Maps construct belongs. */
    ConstructMemImpl.prototype.getTopicMap = function () {
        throw {name: 'NotImplemented', message: 'getTopicMap() not implemented'};
    };
    
    // Returns the hash code value.
    // TODO: Is this needed?
    ConstructMemImpl.prototype.hashCode = function () {
        throw {name: 'NotImplemented', message: 'hashCode() not implemented'};
    };
    
    /** Deletes this construct from its parent container. */
    ConstructMemImpl.prototype.remove = function () {
        throw {name: 'NotImplemented', message: 'remove() not implemented'};
    };
    
    /** Removes an item identifier. */
    ConstructMemImpl.prototype.removeItemIdentifier = function (itemIdentifier) {
        for (var i=0; i<this.itemIdentifiers.length; i+=1) {
            if (this.itemIdentifiers[i].getReference() ===
                    itemIdentifier.getReference()) {
                this.itemIdentifiers.splice(i, 1);
                break;
            }
        }
        this.getTopicMap()._ii2construct.remove(itemIdentifier.getReference());
    };
    
    /** Return true if the construct is a TopicMap-object */
    ConstructMemImpl.prototype.isTopicMap = function() {
        return false;
    };
    
    /** Return true if the construct is a Topic-object */
    ConstructMemImpl.prototype.isTopic = function() {
        return false;
    };
    
    /** Return true if the construct is an Association-object */
    ConstructMemImpl.prototype.isAssociation = function() {
        return false;
    };
    
    /** Return true if the construct is a Role-object */
    ConstructMemImpl.prototype.isRole = function() {
        return false;
    };
    
    /** Return true if the construct is a Name-object */
    ConstructMemImpl.prototype.isName = function() {
        return false;
    };
    
    /** Return true if the construct is an Occurrence-object */
    ConstructMemImpl.prototype.isOccurrence = function() {
        return false;
    };
    
    /** Return true if the construct is a Variant-object */
    ConstructMemImpl.prototype.isVariant = function() {
        return false;
    };
    
    // --------------------------------------------------------------------------
    TypedMemImpl = function () {};
    
    // Returns the type of this construct.
    TypedMemImpl.prototype.getType = function () {
        return this.type;
    };
    
    // Sets the type of this construct.
    TypedMemImpl.prototype.setType = function (type) {
        if (type === null) { throw {name: 'ModelConstraintException',
            message: 'Topic.getRolesPlayed cannot be called without type'}; }
        SameTopicMapHelper.assertBelongsTo(this.getTopicMap(), type);
        this.getTopicMap().setTypeEvent.fire(this, {old: this.type, type: type});
        this.type = type;
    };
    
    // --------------------------------------------------------------------------
    /**
    * @class Indicates that a statement (Topic Maps construct) has a scope.
    * Associations, Occurrences, Names, and Variants are scoped.
    */
    ScopedMemImpl = function () {};
    
    /** Adds a topic to the scope. */
    ScopedMemImpl.prototype.addTheme = function (theme) {
        if (theme === null) { throw {name: 'ModelConstraintException',
            message: 'addTheme(null) is illegal'}; }
        // Check if theme is part of the scope
        for (var i=0; i<this.scope.length; i+=1) {
            if (this.scope[i] === theme) {
                return false;
            }
        }
        SameTopicMapHelper.assertBelongsTo(this.getTopicMap(), theme);
        this.scope.push(theme);
        return true;
    };
    
    /** Returns the topics which define the scope. */
    ScopedMemImpl.prototype.getScope = function () {
        return this.scope;
    };
    
    /** Removes a topic from the scope. */
    ScopedMemImpl.prototype.removeTheme = function (theme) {
        for (var i=0; i<this.scope.length; i+=1) {
            if (this.scope[i] === theme) {
                this.scope.splice(i, 1);
                break;
            }
        }
    };
    
    
    // --------------------------------------------------------------------------
    /**
    * @class Indicates that a ConstructMemImpl is reifiable. Every Topic Maps
    * construct that is not a Topic is reifiable.
    */
    ReifiableMemImpl = function () {};
    
    /** Returns the reifier of this construct. */
    ReifiableMemImpl.prototype.getReifier = function () {
        return this.reifier;
    };
    
    /** Sets the reifier of the construct. */
    ReifiableMemImpl.prototype.setReifier = function (reifier) {
        if (reifier && reifier.getReified() !== null) {
            throw {name: 'ModelConstraintException',
                message: 'Reifies already another construct'};
        }
        SameTopicMapHelper.assertBelongsTo(this.getTopicMap(), reifier);
        if (this.reifier) {
            this.reifier._setReified(null);
        }
        if (reifier) {
            reifier._setReified(this);
        }
        this.reifier = reifier;
    };
    
    // --------------------------------------------------------------------------
    /**
    * @class Common base interface for Occurrences and Variants.
    * Inherits ScopedMemImpl, ReifiableMemImpl
    */
    DatatypeAwareMemImpl = function () {};
    
    /** Returns the BigDecimal representation of the value. */
    DatatypeAwareMemImpl.prototype.decimalValue = function () {
    };
    
    /** Returns the float representation of the value. */
    DatatypeAwareMemImpl.prototype.floatValue = function () {
        var ret = parseFloat(this.value);
        if (isNaN(ret)) {
            throw {name: 'NumberFormatException',
                message: '"'+this.value+'" is not a float'};
        }
        return ret;
    };
    
    /** Returns the Locator identifying the datatype of the value. */
    DatatypeAwareMemImpl.prototype.getDatatype = function () {
        return this.datatype;
    };
    
    /** Returns the lexical representation of the value. */
    DatatypeAwareMemImpl.prototype.getValue = function () {
        if (typeof this.value === 'object' && this.value instanceof Locator) {
            return this.value.getReference();
        }
        return this.value.toString();
    };
    
    /** Returns the BigInteger representation of the value. */
    DatatypeAwareMemImpl.prototype.integerValue = function () {
        var ret = parseInt(this.value, 10);
        if (isNaN(ret)) {
            throw {name: 'NumberFormatException',
                message: '"'+this.value+'" is not an integer'};
        }
        return ret;
    };
    
    /** Returns the Locator representation of the value. */
    DatatypeAwareMemImpl.prototype.locatorValue = function () {
        if (!(typeof this.value === 'object' && this.value instanceof Locator)) {
            throw {name: 'ModelConstraintException',
                message: '"'+this.value+'" is not a locator'};
        }
        return this.value;
    };
    
    /** Returns the long representation of the value. */
    DatatypeAwareMemImpl.prototype.longValue = function () {
    };
    
    /** Sets the value and the datatype. */
    DatatypeAwareMemImpl.prototype.setValue = function (value, datatype) {
        var tm = this.getTopicMap();
        if (datatype === null) {
            throw {name: 'ModelConstraintException', message: 'Invalid datatype'};
        }
        if (value === null) {
            throw {name: 'ModelConstraintException', message: 'Invalid value'};
        }
        this.value = value;
        this.datatype = datatype ||
            this.getTopicMap().createLocator('http://www.w3.org/2001/XMLSchema#string');
        if (datatype && datatype.getReference() ===
            'http://www.w3.org/2001/XMLSchema#anyURI') {
            this.value = tm.createLocator(value);
        }
        if (!datatype) {
            if (typeof value === 'number') {
                this.datatype = tm.createLocator('http://www.w3.org/2001/XMLSchema#integer');
            }
        }
        if (typeof value === 'object' && value instanceof Locator) {
            this.datatype = tm.createLocator('http://www.w3.org/2001/XMLSchema#anyURI');
        }
    };
    
    // --------------------------------------------------------------------------
    /**
    * Constructs a new Topic Map System Factoy. The constructor should not be
    * called directly. Use the {TM.TopicMapSystemFactory.newInstance} instead.
    * @class Represents a Topic Maps construct.
    */
    TopicMapSystemFactory = function() {
        this.properties = {};
        this.features = {};
    };
    
    /**
    * Returns the particular feature requested for in the underlying implementation
    * of TopicMapSystem.
    */
    TopicMapSystemFactory.prototype.getFeature = function (featureName) {
        return this.features;
    };
    
    /**
    * Gets the value of a property in the underlying implementation of
    * TopicMapSystem.
    */
    TopicMapSystemFactory.prototype.getProperty = function (propertyName) {
        return this.properties[propertyName];
    };
    
    // Returns if the particular feature is supported by the TopicMapSystem.
    TopicMapSystemFactory.prototype.hasFeature = function (featureName) {
        return false;
    };
    
    /**
    * Obtain a new instance of a TopicMapSystemFactory.
    * @static
    * @returns {TopicMapSystemFactory}
    */
    TopicMapSystemFactory.newInstance = function () {
        return new TopicMapSystemFactory();
    };
    
    // Creates a new TopicMapSystem instance using the currently configured
    // factory parameters.
    TopicMapSystemFactory.prototype.newTopicMapSystem = function () {
        var backend = this.properties['com.semanticheadache.tmjs.backend'] || 'memory'; 
        if (backend === 'memory') {
            //return new TopicMapSystem();
            return new TopicMapSystemMemImpl();
        }
    };
    
    // Sets a particular feature in the underlying implementation of TopicMapSystem.
    TopicMapSystemFactory.prototype.setFeature = function (featureName, enable) {
        this.features[featureName] = enable;
    };
    
    // Sets a property in the underlying implementation of TopicMapSystem.
    TopicMapSystemFactory.prototype.setProperty = function (propertyName, value) {
        this.property[propertyName] = value;
    };
    
    /**
    * Creates a new instance of TopicMamSystemMemImpl.
    * @class Implementation of the TopicMapSystem interface.
    */
    TopicMapSystemMemImpl = function () {
        this.topicmaps = {};
    };
    
    TopicMapSystemMemImpl.prototype.createTopicMap = function (locator) {
        if (this.topicmaps[locator.getReference()]) {
            throw {name: 'TopicMapExistsException',
                message: 'A topic map under the same IRI already exists'};
        }
        var tm = new TopicMapMemImpl(this, locator);
        this.topicmaps[locator.getReference()] = tm;
        return tm;
    };
    
    TopicMapSystemMemImpl.prototype.getLocators = function () {
        var locators = [], key;
        for (key in this.topicmaps) {
            if (this.topicmaps.hasOwnProperty(key)) {
                locators.push(this.createLocator(key));
            }
        }
        return locators;
    };
    
    TopicMapSystemMemImpl.prototype.getTopicMap = function (locator) {
        var tm;
        if (locator instanceof Locator) {
            tm = this.topicmaps[locator.getReference()];
        } else {
            tm = this.topicmaps[locator];
        }
        if (!tm) { return null; }
        return tm;
    };
    
    /**
    * @param {String} iri
    */
    TopicMapSystemMemImpl.prototype.createLocator = function (iri) {
        return new Locator(this, iri);
    };
    
    TopicMapSystemMemImpl.prototype.getFeature = function (featureName) {
        return false;
    };
    
    TopicMapSystemMemImpl.prototype._removeTopicMap = function(tm) {
        var key;
        for (key in this.topicmaps) {
            if (this.topicmaps.hasOwnProperty(key) &&
                key === tm.locator.getReference()) {
                delete this.topicmaps[key];
            }
        }
    };
    
    TopicMapSystemMemImpl.prototype.close = function () {
        this.toipcmaps = null; // release references
    };
    
    TopicMapMemImpl = function (tms, locator) {
        this.topicmapsystem = tms;
        this.itemIdentifiers = [];
        this.locator = locator;
        this.topics = [];
        this.associations = [];
        this._constructId = 1;
        this._si2topic = new Hash(); // Index for subject identifiers
        this._sl2topic = new Hash(); // Index for subject locators
        this._ii2construct = new Hash(); // Index for item identifiers
        this._id2construct = new Hash(); // Index for object ids

        // The topic map object always get the id 0
        this.id = 0;
        this._id2construct.put(this.id, this);

        this.reifier = null;
        this.handlers = [];

        // Our own event handling mechanism
        var EventHandler = function (eventtype) {
            this.eventtype = eventtype;
            this.handlers = [];
        };
        EventHandler.prototype = {
            registerHandler: function (handler) {
               this.handlers.push(handler);
            },
            removeHandler: function (handler) {
                for (var i = 0; i<this.handlers.length; i+=1) {
                    if (handler.toString() ===
                        this.handlers[i].toString()) {
                        this.handlers.splice(i, 1);
                    }
                }
            },
            fire: function (source, obj) {
                obj = obj || {};
                for (var i = 0; i<this.handlers.length; i+=1) {
                    this.handlers[i](this.eventtype, source, obj);
                }
            }
        };
        this.addAssociationEvent = new EventHandler(EventType.ADD_ASSOCIATION); 
        this.addNameEvent = new EventHandler(EventType.ADD_NAME); 
        this.addOccurrenceEvent = new EventHandler(EventType.ADD_OCCURRENCE); 
        this.addRoleEvent = new EventHandler(EventType.ADD_ROLE); 
        this.addTopicEvent = new EventHandler(EventType.ADD_TOPIC); 
        this.addTypeEvent = new EventHandler(EventType.ADD_TYPE); 
        this.removeAssociationEvent = new EventHandler(EventType.REMOVE_ASSOCIATION);
        this.removeNameEvent = new EventHandler(EventType.REMOVE_NAME);
        this.removeOccurrenceEvent = new EventHandler(EventType.REMOVE_OCCURRENCE);
        this.removeRoleEvent = new EventHandler(EventType.REMOVE_ROLE);
        this.removeTopicEvent = new EventHandler(EventType.REMOVE_TOPIC);
        this.setTypeEvent = new EventHandler(EventType.SET_TYPE);
    };

    TopicMapMemImpl.prototype.register_event_handler = function(type, handler) {
        switch (type) {
            case EventType.ADD_ASSOCIATION:
                this.addAssociationEvent.registerHandler(handler); break;
            case EventType.ADD_NAME:
                this.addNameEvent.registerHandler(handler); break;
            case EventType.ADD_OCCURRENCE:
                this.addOccurrenceEvent.registerHandler(handler); break;
            case EventType.ADD_ROLE:
                this.addRoleEvent.registerHandler(handler); break;
            case EventType.ADD_TOPIC:
                this.addTopicEvent.registerHandler(handler); break;
            case EventType.ADD_TYPE:
                this.addTypeEvent.registerHandler(handler); break;
            case EventType.REMOVE_ASSOCIATION:
                this.removeAssociationEvent.registerHandler(handler); break;
            case EventType.REMOVE_NAME:
                this.removeNameEvent.registerHandler(handler); break;
            case EventType.REMOVE_OCCURRENCE:
                this.removeOccurrenceEvent.registerHandler(handler); break;
            case EventType.REMOVE_ROLE:
                this.removeRoleEvent.registerHandler(handler); break;
            case EventType.REMOVE_TOPIC:
                this.removeTopicEvent.registerHandler(handler); break;
            case EventType.SET_TYPE:
                this.setTypeEvent.registerHandler(handler); break;
        }
    };

    TopicMapMemImpl.swiss(ReifiableMemImpl, 'getReifier', 'setReifier');
    TopicMapMemImpl.swiss(ConstructMemImpl, 'addItemIdentifier', 'getItemIdentifiers',
        'removeItemIdentifier', 'isTopic', 'isAssociation', 'isRole',
        'isOccurrence', 'isName', 'isVariant', 'isTopicMap');
    
    TopicMapMemImpl.prototype.isTopicMap = function() {
        return true;
    };
    
    TopicMapMemImpl.prototype._getConstructId = function () {
        this._constructId = this._constructId + 1;
        return this._constructId;
    };
    
    TopicMapMemImpl.prototype.remove = function() {
        this.topicmapsystem._removeTopicMap(this);
        this.topicmapsystem = null;
        this.itemIdentifiers = null;
        this.locator = null;
        this.topics = null;
        this.associations = null;
        this._si2topic = null;
        this._sl2topic = null;
        this._ii2construct = null;
        this._id2construct = null;
        this.reifier = null;
        this.id = null;
    };
    
    TopicMapMemImpl.prototype.createAssociation = function (type, scope) {
        var a, i;
        if (type === null) {
            throw {name: 'ModelConstraintException',
                message: 'Creating an association with type == null is not allowed'};
        } 
        if (scope === null) {
            throw {name: 'ModelConstraintException',
                messge: 'Creating an association with scope == null is not allowed'};
        }
        SameTopicMapHelper.assertBelongsTo(this, type);
        SameTopicMapHelper.assertBelongsTo(this, scope);
    
        a = new AssociationMemImpl(this);
        this.associations.push(a);
        if (type) {
            a.setType(type);
        }
        if (scope && typeof scope === 'object') {
            if (scope instanceof Array) {
                for (i=0; i<scope.length; i+=1) {
                    a.addTheme(scope[i]);
                }
            } else if (scope instanceof TopicMemImpl) {
                a.addTheme(scope[i]);
            }
        }
        this.addAssociationEvent.fire(a);
        return a;
    };
    
    TopicMapMemImpl.prototype.createLocator = function (iri) {
        return new Locator(this, iri);
    };
    
    TopicMapMemImpl.prototype._createEmptyTopic = function () {
        var t = new TopicMemImpl(this);
        this.addTopicEvent.fire(t);
        this.topics.push(t);
        return t;
    };
    
    TopicMapMemImpl.prototype.createTopic = function () {
        var t = this._createEmptyTopic();
        t.addItemIdentifier(this.createLocator('urn:x-tmjs:'+t.getId()));
        return t;
    };
    
    TopicMapMemImpl.prototype.createTopicByItemIdentifier = function (itemIdentifier) {
        if (!itemIdentifier) { throw {name: 'ModelConstraintException',
            message: 'createTopicByItemIdentifier() needs an item identifier'}; }
        var t = this.getConstructByItemIdentifier(itemIdentifier);
        if (t) {
            return t;
        }
        t = this._createEmptyTopic();
        t.addItemIdentifier(itemIdentifier);
        return t;
    };
    
    TopicMapMemImpl.prototype.createTopicBySubjectIdentifier = function (subjectIdentifier) {
        if (!subjectIdentifier) { throw {name: 'ModelConstraintException',
            message: 'createTopicBySubjectIdentifier() needs a subject identifier'}; }
        var t = this.getTopicBySubjectIdentifier(subjectIdentifier);
        if (t) {
            return t;
        }
        t = this._createEmptyTopic();
        t.addSubjectIdentifier(subjectIdentifier);
        return t;
    };
    
    TopicMapMemImpl.prototype.createTopicBySubjectLocator = function (subjectLocator) {
        if (!subjectLocator) { throw {name: 'ModelConstraintException',
            message: 'createTopicBySubjectLocator() needs a subject locator'}; }
        var t = this.getTopicBySubjectLocator(subjectLocator);
        if (t) {
            return t;
        }
        t = this._createEmptyTopic();
        t.addSubjectLocator(subjectLocator);
        return t;
    };
    
    TopicMapMemImpl.prototype.getAssociations = function () {
        return this.associations;
    };
    
    TopicMapMemImpl.prototype.getConstructById = function (id) {
        if (id === null) { throw {name: 'ModelConstraintException',
                message: 'getConstructById(null) is illegal'}; }
        var ret = this._id2construct.get(id);
        if (!ret) { return null; }
        return ret;
    };
    
    TopicMapMemImpl.prototype.getConstructByItemIdentifier = function (itemIdentifier) {
        if (itemIdentifier === null) { throw {name: 'ModelConstraintException',
                message: 'getConstructByItemIdentifier(null) is illegal'}; }
        var ret = this._ii2construct.get(itemIdentifier.getReference());
        if (!ret) { return null; }
        return ret;
    };
    
    TopicMapMemImpl.prototype.getIndex = function (className) {
        var index;
        if (className === 'TypeInstanceIndex') {
            index = new TypeInstanceIndexMemImpl(this);
            return index;
        }
        throw {name: 'UnsupportedOperationException', 
            message: 'getIndex ist not (yet) supported'};
    };
    
    TopicMapMemImpl.prototype.getParent = function () {
        return null;
    };
    
    TopicMapMemImpl.prototype.getTopicBySubjectIdentifier = function (subjectIdentifier) {
        var res = this._si2topic.get(subjectIdentifier.getReference());
        if (res) {
            return res;
        }
        return null; // Make sure that the result is not undefined
    };
    
    TopicMapMemImpl.prototype.getTopicBySubjectLocator = function (subjectLocator) {
        var res = this._sl2topic.get(subjectLocator.getReference());
        if (res) {
            return res;
        }
        return null; // Make sure that the result is not undefined
    };
    
    TopicMapMemImpl.prototype.getTopics = function () {
        return this.topics;
    };
    
    TopicMapMemImpl.prototype.mergeIn = function (topicmap) {
        // TODO implement!
        throw {name: 'NotImplemented', message: 'TopicMap.mergeIn() not implemented'};
    };
    
    TopicMapMemImpl.prototype.equals = function (topicmap) {
        return this.locator.equals(topicmap.locator);
    };
    
    TopicMapMemImpl.prototype.getId = function () {
        return this.id;
    };
    
    TopicMapMemImpl.prototype.getTopicMap = function () {
        return this;
    };
    
    // Remove item identifiers
    TopicMapMemImpl.prototype._removeConstruct = function (construct) {
        var iis = construct.getItemIdentifiers(), i;
        for (i=0; i<iis.length; i+=1) {
            this._ii2construct.remove(iis[i].getReference());
        }
    };
    
    TopicMapMemImpl.prototype._removeTopic = function (topic) {
        var i, sis = topic.getSubjectIdentifiers(),
            slos = topic.getSubjectLocators();
        // remove subject identifiers from TopicMapMemImpl._si2topic
        for (i=0; i<sis.length; i+=1) {
            this._si2topic.remove(sis[i].getReference());
        }
        // remove subject locators from TopicMapMemImpl._sl2topic
        for (i=0; i<slos.length; i+=1) {
            this._sl2topic.remove(slos[i].getReference());
        }
        this._removeConstruct(topic);
        // remove topic from TopicMapMemImpl.topics
        for (i=0; i<this.topics.length; i+=1) {
            if (topic.id === this.topics[i].id) {
                this.topics.splice(i, 1);
                break;
            }
        }
    };
    
    TopicMapMemImpl.prototype._removeAssociation = function (association) {
        var i, iis;
        // remove association from TopicMapMemImpl.associations
        for (i=0; i<this.associations.length; i+=1) {
            if (association.id === this.associations[i].id) {
                this.associations.splice(i, 1);
                break;
            }
        }
        this._removeConstruct(association);
        // remove association from TopicMapMemImpl.associations
        for (i=0; i<this.associations.length; i+=1) {
            if (association.id === this.associations[i].id) {
                this.associations.splice(i, 1);
                break;
            }
        }
    };
    
    TopicMapMemImpl.prototype._removeRole = function (role) {
        this._removeConstruct(role);
    };
    
    TopicMapMemImpl.prototype._removeOccurrence = function (occ) {
        this._removeConstruct(occ);
    };
    
    TopicMapMemImpl.prototype._removeName = function (name) {
        this._removeConstruct(name);
    };
    
    TopicMapMemImpl.prototype._removeVariant = function (variant) {
        this._removeConstruct(variant);
    };
    
    // hashCode, remove
    
    // --------------------------------------------------------------------------
    
    TopicMemImpl = function (parnt) {
        this.subjectIdentifiers = [];
        this.subjectLocators = [];
        this.itemIdentifiers = [];
        this.parnt = parnt;
        this.id = parnt._getConstructId();
        this.getTopicMap()._id2construct.put(this.id, this);
        this.types = [];
        this.rolesPlayed = [];
        this.occurrences = [];
        this.names = [];
        this.reified = null;
    };
    
    TopicMemImpl.swiss(ConstructMemImpl, 'addItemIdentifier', 'equals', 'getId',
        'getItemIdentifiers', 'getParent', 'getTopicMap', 'hashCode', 'remove',
        'removeItemIdentifier', 'isTopic', 'isAssociation', 'isRole',
        'isOccurrence', 'isName', 'isVariant', 'isTopicMap');
    
    TopicMemImpl.prototype.isTopic = function() {
        return true;
    };
    
    TopicMemImpl.prototype.getTopicMap = function () {
        return this.parnt;
    };
    
    // Adds a subject identifier to this topic.
    TopicMemImpl.prototype.addSubjectIdentifier = function (subjectIdentifier) {
        if (!subjectIdentifier) { throw {name: 'ModelConstraintException',
            message: 'addSubjectIdentifier() needs subject identifier'}; }
        this.subjectIdentifiers.push(subjectIdentifier);
        this.parnt._si2topic.put(subjectIdentifier.getReference(), this);
    };
    
    // Adds a subject locator to this topic.
    TopicMemImpl.prototype.addSubjectLocator = function (subjectLocator) {
        if (!subjectLocator) { throw {name: 'ModelConstraintException',
            message: 'addSubjectLocator() needs subject locator'}; }
        this.subjectLocators.push(subjectLocator);
        this.parnt._sl2topic.put(subjectLocator.getReference(), this);
    };
    
    // Adds a type to this topic.
    TopicMemImpl.prototype.addType = function (type) {
        if (!type) { throw {name: 'ModelConstraintException',
            message: 'addType() needs type'}; }
        SameTopicMapHelper.assertBelongsTo(this.parnt, type);
        this.parnt.addTypeEvent.fire(this, {type: type});
        this.types.push(type);
    };
    
    // TODO: @type is optional In TMAPI 2.0
    // Creates a Name for this topic with the specified value, and scope.
    // Creates a Name for this topic with the specified type, value, and scope.
    TopicMemImpl.prototype.createName = function (value, type, scope) {
        var i, name;
        if (type) {
            SameTopicMapHelper.assertBelongsTo(this.parnt, type);
        }
        SameTopicMapHelper.assertBelongsTo(this.parnt, scope);
    
        name = new NameMemImpl(this, value, type, scope);
        this.names.push(name);
        return name;
    };
    
    // TODO: @datatype is optional in TMAPI, value may be string or locator.
    // Creates an Occurrence for this topic with the specified type, IRI value, and
    // scope.
    // createOccurrence(Topic type, java.lang.String value, Locator datatype,
    // java.util.Collection<Topic> scope) 
    // Creates an Occurrence for this topic with the specified type, string value,
    // and scope.
    TopicMemImpl.prototype.createOccurrence = function (type, value, datatype, scope) {
        var occ;
        SameTopicMapHelper.assertBelongsTo(this.parnt, type);
        SameTopicMapHelper.assertBelongsTo(this.parnt, scope);
    
        occ = new OccurrenceMemImpl(this, type, value);
        this.parnt.addOccurrenceEvent.fire(occ, {type: type, value: value});
        this.occurrences.push(occ);
        return occ;
    };
    
    // Returns the Names of this topic where the name type is type. type is optional.
    TopicMemImpl.prototype.getNames = function (type) {
        var ret = [], i;
        if (type === null) { throw {name: 'IllegalArgumentException',
                message: 'Topic.getOccurrences cannot be called without type'}; }
        for (i=0; i<this.names.length; i+=1) {
            if (type && this.names[i].getType().equals(type)) {
                ret.push(this.names[i]);
            } else if (!type) {
                ret.push(this.names[i]);
            }
        }
        return ret;
    };
    
    // Returns the Occurrences of this topic where the occurrence type is type. type
    // is optional.
    TopicMemImpl.prototype.getOccurrences = function (type) {
        var ret = [], i;
        if (type === null) { throw {name: 'IllegalArgumentException',
                message: 'Topic.getOccurrences cannot be called without type'}; }
        for (i=0; i<this.occurrences.length; i+=1) {
            if (type && this.occurrences[i].getType().equals(type)) {
                ret.push(this.occurrences[i]);
            } else if (!type) {
                ret.push(this.occurrences[i]);
            }
        }
        return ret;
    };
    
    TopicMemImpl.prototype._removeOccurrence = function (occ) {
        // remove this from TopicMapMemImpl.topics
        for (var i=0; i<this.occurrences.length; i+=1) {
            if (this.occurrences[i].equals(occ)) {
                this.occurrences.splice(i, 1);
                break;
            }
        }
        this.getTopicMap()._removeOccurrence(occ);
    };
    
    // Returns the ConstructMemImpl which is reified by this topic.
    TopicMemImpl.prototype.getReified = function (type) {
        return this.reified;
    };
    
    TopicMemImpl.prototype._setReified = function (reified) {
        this.reified = reified;
    };
    
    // Returns the roles played by this topic.
    // Returns the roles played by this topic where the role type is type.
    // assocType is optional
    TopicMemImpl.prototype.getRolesPlayed = function (type, assocType) {
        if (type === null) { throw {name: 'IllegalArgumentException',
                message: 'Topic.getRolesPlayed cannot be called without type'}; }
        if (assocType === null) { throw {name: 'IllegalArgumentException',
                message: 'Topic.getRolesPlayed cannot be called with assocType===null'}; }
        var ret = [], i;
        for (i=0; i<this.rolesPlayed.length; i+=1) {
            if (!type) {
                ret.push(this.rolesPlayed[i]);
            } else if (this.rolesPlayed[i].getType().equals(type)) {
                if (assocType &&
                    this.rolesPlayed[i].getParent().getType().equals(assocType) ||
                    !assocType) {
                    ret.push(this.rolesPlayed[i]);
                }
            }
        }
        return ret;
    };
    
    // @private Registers role as a role played
    TopicMemImpl.prototype.addRolePlayed = function (role) {
        this.rolesPlayed.push(role);
    };
    
    TopicMemImpl.prototype.removeRolePlayed = function (role) {
        for (var i=0; i<this.rolesPlayed.length; i+=1) {
            if (this.rolesPlayed[i].id === role.id) {
                this.rolesPlayed.splice(i, 1);
            }
        }
    };
    
    // Returns the subject identifiers assigned to this topic.
    TopicMemImpl.prototype.getSubjectIdentifiers = function () {
        return this.subjectIdentifiers;
    };
    
    // Returns the subject locators assigned to this topic.
    TopicMemImpl.prototype.getSubjectLocators = function () {
        return this.subjectLocators;
    };
    
    // Returns the types of which this topic is an instance of.
    TopicMemImpl.prototype.getTypes = function () {
        return this.types;
    };
    
    // Merges another topic into this topic.
    TopicMemImpl.prototype.mergeIn = function (other) {
        // TODO Implement!
        throw {name: 'NotImplemented', message: 'Topic.mergeIn() not implemented'};
    };
    
    // Removes this topic from the containing TopicMapMemImpl instance.
    TopicMemImpl.prototype.remove = function () {
        // TODO: Check if the topic is in use!
        var other;
        if (this.getReified()) {
            throw {name: 'TopicInUseException',
                message: '', reporter: this};
        }
        //if (this.getScopingTopic()) {
        //    throw {name: 'TopicInUseException',
        //        message: '', reporter: this};
        //}
        this.parnt._removeTopic(this);
        this.parnt._id2construct.remove(this.id);
        this.parnt.removeTopicEvent.fire(this);
        this.id = null;
    };
    
    // Removes a subject identifier from this topic.
    TopicMemImpl.prototype.removeSubjectIdentifier = function (subjectIdentifier) {
        for (var i=0; i<this.subjectIdentifiers.length; i+=1) {
            if (this.subjectIdentifiers[i].getReference() ===
                subjectIdentifier.getReference()) {
                this.subjectIdentifiers.splice(i, 1);
                break;
            }
        }
        this.parnt._sl2topic.remove(subjectIdentifier.getReference());
    };
    
    // Removes a subject locator from this topic.
    TopicMemImpl.prototype.removeSubjectLocator = function (subjectLocator) {
        for (var i=0; i<this.subjectLocators.length; i+=1) {
            if (this.subjectLocators[i].getReference() ===
                subjectLocator.getReference()) {
                this.subjectLocators.splice(i, 1);
                break;
            }
        }
        this.parnt._sl2topic.remove(subjectLocator.getReference());
    };
    
    // Removes a type from this topic.
    TopicMemImpl.prototype.removeType = function (type) {
        for (var i=0; i<this.types.length; i+=1) {
            if (this.types[i].equals(type)) {
                this.types.splice(i, 1);
                break;
            }
        }
    };
    
    TopicMemImpl.prototype._removeName = function(name) {
        for (var i=0; i<this.names.length; i+=1) {
            if (this.names[i].equals(name)) {
                this.names.splice(i, 1);
                break;
            }
        }
        this.getTopicMap()._removeName(name);
    };
    
    // --------------------------------------------------------------------------
    OccurrenceMemImpl = function (parnt, type, value) {
        this.itemIdentifiers = [];
        this.parnt = parnt;
        this.type = type;
        this.value = value;
        this.datatype = null;
        this.scope = [];
        this.reifier = null;
        this.id = this.getTopicMap()._getConstructId();
        this.getTopicMap()._id2construct.put(this.id, this);
    };
    
    // mergein TypedMemImpl, DatatypeAwareMemImpl, ReifiableMemImpl,
    // ScopedMemImpl, ConstructMemImpl
    OccurrenceMemImpl.swiss(TypedMemImpl, 'getType', 'setType');
    OccurrenceMemImpl.swiss(DatatypeAwareMemImpl, 'decimalValue', 'floatValue',
        'getDatatype', 'getValue', 'integerValue', 'locatorValue', 'longValue',
        'setValue');
    OccurrenceMemImpl.swiss(ReifiableMemImpl, 'getReifier', 'setReifier');
    OccurrenceMemImpl.swiss(ScopedMemImpl, 'addTheme', 'getScope', 'removeTheme');
    OccurrenceMemImpl.swiss(ConstructMemImpl, 'addItemIdentifier', 'equals', 'getId',
        'getItemIdentifiers', 'getParent', 'getTopicMap', 'hashCode', 'remove',
        'removeItemIdentifier', 'isTopic', 'isAssociation', 'isRole',
        'isOccurrence', 'isName', 'isVariant', 'isTopicMap');
    
    OccurrenceMemImpl.prototype.isOccurrence = function() {
        return true;
    };
    
    OccurrenceMemImpl.prototype.getTopicMap = function () {
        return this.parnt.getParent();
    };
    
    OccurrenceMemImpl.prototype.remove = function () {
        this.parnt.parnt.removeOccurrenceEvent.fire(this);
        this.parnt._removeOccurrence(this);
        this.id = null;
    };
    
    NameMemImpl = function (parnt, value, type, scope) {
        this.itemIdentifiers = [];
        this.parnt = parnt;
        this.value = value;
        this.type = type ||
            parnt.parnt.createTopicBySubjectIdentifier(
                parnt.parnt.createLocator('http://psi.topicmaps.org/iso13250/model/topic-name'));
        if (!scope) {
            this.scope = [];
        } else if (scope instanceof TopicMemImpl) {
                this.scope[0] = scope;
        } else if (scope instanceof Array) {
            this.scope = scope;
        }
        this.reifier = null;
        this.variants = [];
        this.id = this.getTopicMap()._getConstructId();
        this.getTopicMap()._id2construct.put(this.id, this);
        this.parnt.parnt.addNameEvent.fire(this, {type: this.type, value: value});
    };
    
    // mergein TypedMemImpl, DatatypeAwareMemImpl, ReifiableMemImpl, ScopedMemImpl,
    // ConstructMemImpl
    NameMemImpl.swiss(TypedMemImpl, 'getType', 'setType');
    NameMemImpl.swiss(ReifiableMemImpl, 'getReifier', 'setReifier');
    NameMemImpl.swiss(ScopedMemImpl, 'addTheme', 'getScope', 'removeTheme');
    NameMemImpl.swiss(ConstructMemImpl, 'addItemIdentifier', 'equals', 'getId',
        'getItemIdentifiers', 'getParent', 'getTopicMap', 'hashCode', 'remove',
        'removeItemIdentifier', 'isTopic', 'isAssociation', 'isRole',
        'isOccurrence', 'isName', 'isVariant', 'isTopicMap');
    
    NameMemImpl.prototype.isName = function() {
        return true;
    };
    
    NameMemImpl.prototype.getTopicMap = function () {
        return this.parnt.parnt;
    };
    
    NameMemImpl.prototype.createVariant = function (value, datatype, scope) {
        var variant = new VariantMemImpl(this, value, datatype, scope);
        this.variants.push(variant);
        return variant;
    };
    
    NameMemImpl.prototype.setValue = function(value) {
        if (!value) { throw {name: 'ModelConstraintException',
            message: 'Name.setValue(null) is not allowed'}; }
        this.value = value;
    };
    
    NameMemImpl.prototype.getValue = function(value) {
        return this.value;
    };
    
    NameMemImpl.prototype.remove = function () {
        this.parnt.parnt.removeNameEvent.fire(this);
        this.getParent()._removeName(this);
        this.id = null;
    };
    
    NameMemImpl.prototype._removeVariant = function (variant) {
        for (var i=0; i<this.variants.length; i+=1) {
            if (this.variants[i].equals(variant)) {
                this.variants.splice(i, 1);
                break;
            }
        }
        this.getTopicMap()._removeVariant(variant);
    };
    
    // FIXME: scope_or_datatype => datatype
    VariantMemImpl = function (parnt, value, scope_or_datatype, scope) {
        var scope_arr = scope || scope_or_datatype;
        if (value === null) { throw {name: 'ModelConstraintException',
            message: 'Creation of a variant with null value is not allowed'}; }
        if (scope_or_datatype === null && scope) {
            throw {name: 'ModelConstraintException',
            message: 'Creation of a variant with datatype == null is not allowed'}; }
        this.itemIdentifiers = [];
        this.parnt = parnt;
        if (scope_arr && scope_arr instanceof TopicMemImpl) {
            this.scope = [scope_arr];
        } else {
            this.scope = scope_arr;
        }
        if (this.scope === null) {
            throw {name: 'ModelConstraintException',
            message: 'Creation of a variant with a null scope is not allowed'};
        }
        if (this.scope.length <= this.getParent().getScope().length) {
            // check if the variants scope contains more scoping topics
            throw {name: 'ModelConstraintException',
            message: 'The variant would be in the same scope as the parent'};
        }
        if (typeof value === 'object' && value instanceof Locator) {
            this.datatype = this.getTopicMap().createLocator('http://www.w3.org/2001/XMLSchema#anyURI');
        } else {
            this.datatype = 
                this.getTopicMap().createLocator('http://www.w3.org/2001/XMLSchema#string');
        }
        if (scope && scope_or_datatype) {
            this.datatype = scope_or_datatype;
        }
        this.reifier = null;
        this.value = value;
        this.id = this.getTopicMap()._getConstructId();
        this.getTopicMap()._id2construct.put(this.id, this);
    };
    
    VariantMemImpl.swiss(ReifiableMemImpl, 'getReifier', 'setReifier');
    VariantMemImpl.swiss(ScopedMemImpl, 'addTheme', 'getScope', 'removeTheme');
    VariantMemImpl.swiss(ConstructMemImpl, 'addItemIdentifier', 'equals', 'getId',
        'getItemIdentifiers', 'getParent', 'getTopicMap', 'hashCode', 'remove',
        'removeItemIdentifier', 'isTopic', 'isAssociation', 'isRole',
        'isOccurrence', 'isName', 'isVariant', 'isTopicMap');
    VariantMemImpl.swiss(DatatypeAwareMemImpl, 'decimalValue', 'floatValue', 'getDatatype',
        'getValue', 'integerValue', 'locatorValue', 'longValue', 'setValue');
    
    VariantMemImpl.prototype.isVariant = function() {
        return true;
    };
    
    VariantMemImpl.prototype.getTopicMap = function () {
        return this.getParent().getParent().getParent();
    };
    
    VariantMemImpl.prototype.remove = function () {
        this.getParent()._removeVariant(this);
        this.id = null;
    };
    

    RoleMemImpl = function (parnt, type, player) {
        this.itemIdentifiers = [];
        this.parnt = parnt;
        this.type = type;
        this.player = player;
        this.id = this.getTopicMap()._getConstructId();
        this.reifier = null;
        this.getTopicMap()._id2construct.put(this.id, this);
    };
    
    RoleMemImpl.swiss(TypedMemImpl, 'getType', 'setType');
    RoleMemImpl.swiss(ReifiableMemImpl, 'getReifier', 'setReifier');
    RoleMemImpl.swiss(ConstructMemImpl, 'addItemIdentifier', 'equals', 'getId',
        'getItemIdentifiers', 'getParent', 'getTopicMap', 'hashCode', 'remove',
        'removeItemIdentifier', 'isTopic', 'isAssociation', 'isRole',
        'isOccurrence', 'isName', 'isVariant', 'isTopicMap');
    
    RoleMemImpl.prototype.isRole = function () {
        return true;
    };
    
    RoleMemImpl.prototype.getTopicMap = function () {
        return this.getParent().getParent();
    };
    
    RoleMemImpl.prototype.remove = function () {
        this.parnt.parnt.removeRoleEvent.fire(this);
        this.parnt._removeRole(this);
        this.itemIdentifiers = null;
        this.parnt = null;
        this.type = null;
        this.player = null;
        this.reifier = null;
        this.id = null;
    };
    
    RoleMemImpl.prototype.getPlayer = function () {
        return this.player;
    };
    
    RoleMemImpl.prototype.setPlayer = function (player) {
        if (!player) { throw {name: 'ModelConstraintException',
            message: 'player i Role.setPlayer cannot be null'}; }
        SameTopicMapHelper.assertBelongsTo(this.parnt.parnt, player);
        if (this.player.equals(player)) { return; }
        this.player.removeRolePlayed(this);
        player.addRolePlayed(this);
        this.player = player;
    };
    
    AssociationMemImpl = function (par) {
        this.itemIdentifiers = [];
        this.parnt = par;
        this.id = this.getTopicMap()._getConstructId();
        this.getTopicMap()._id2construct.put(this.id, this);
        this.roles = [];
        this.scope = [];
        this.type = null;
        this.reifier = null;
    };
    
    AssociationMemImpl.swiss(TypedMemImpl, 'getType', 'setType');
    AssociationMemImpl.swiss(ReifiableMemImpl, 'getReifier', 'setReifier');
    AssociationMemImpl.swiss(ScopedMemImpl, 'addTheme', 'getScope', 'removeTheme');
    AssociationMemImpl.swiss(ConstructMemImpl, 'addItemIdentifier', 'equals', 'getId',
        'getItemIdentifiers', 'getParent', 'getTopicMap', 'hashCode', 'remove',
        'removeItemIdentifier', 'isTopic', 'isAssociation', 'isRole',
        'isOccurrence', 'isName', 'isVariant', 'isTopicMap');
    
    AssociationMemImpl.prototype.isAssociation = function () {
        return true;
    };
    
    AssociationMemImpl.prototype.getTopicMap = function () {
        return this.parnt;
    };
    
    // Creates a new Role representing a role in this association.
    AssociationMemImpl.prototype.createRole = function (type, player) {
        if (!type) { throw {name: 'ModelConstraintException',
            message: 'type i Role.createPlayer cannot be null'}; }
        if (!player) { throw {name: 'ModelConstraintException',
            message: 'player i Role.createRole cannot be null'}; }
        SameTopicMapHelper.assertBelongsTo(this.parnt, type);
        SameTopicMapHelper.assertBelongsTo(this.parnt, player);
        var role = new RoleMemImpl(this, type, player);
        player.addRolePlayed(role);
        this.roles.push(role);
        this.parnt.addRoleEvent.fire(role, {type: type, player: player});
        return role;
    };
    
    AssociationMemImpl.prototype._removeRole = function (role) {
        for (var i=0; i<this.roles.length; i+=1) {
            if (role.id === this.roles[i].id) {
                this.roles.splice(i, 1);
                break;
            }
        }
        role.getPlayer().removeRolePlayed(role);
        this.getTopicMap()._removeRole(role);
    };
    
    AssociationMemImpl.prototype.remove = function () {
        this.parnt.removeAssociationEvent.fire(this);
        for (var i=0; i<this.roles.length; i+=1) {
            this.roles[i].remove();
        }
        this.id = null;
        this.roles = null;
        this.parnt._removeAssociation(this);
        this.getTopicMap()._ii2construct.remove(this.id);
        this.item_identifiers = null;
        this.scope = null;
        this.type = null;
        this.reifier = null;
    };
    
    // Returns the roles participating in this association.
    // Returns all roles with the specified type.
    AssociationMemImpl.prototype.getRoles = function (type) {
        if (type === null) { throw {name: 'IllegalArgumentException',
            message: 'Topic.getRolesPlayed cannot be called with type null'}; }
        if (!type) { return this.roles; }
        var ret = [], i; 
        for (i=0; i<this.roles.length; i+=1) {
            if (this.roles[i].getType().equals(type)) {
                ret.push(this.roles[i]);
            }
        }
        return ret;
    };

    // Returns the role types participating in this association.
    AssociationMemImpl.prototype.getRoleTypes = function () {
        // Create a hash with the object ids as keys to avoid duplicates
        var types = {}, typearr = [], i, t;
        for (i=0; i<this.roles.length; i+=1) {
            types[this.roles[i].getType().getId()] =
                this.roles[i].getType();
        }
        for (t in types) {
            if (types.hasOwnProperty(t)) {
                typearr.push(types[t]);
            }
        }
        return typearr;
    };

    // ------ ----------------------------------------------------------------
    /** @class */
    IndexMemImpl = function () {
        this.opened = false;
    };

    /** Close the index. */
    IndexMemImpl.prototype.close = function () {
        return;
    };

    /** 
    * Indicates whether the index is updated automatically. 
    * @returns {boolean}
    */
    IndexMemImpl.prototype.isAutoUpdated = function () {
        return true;
    };

    /** Indicates if the index is open.
    * @returns {boolean} true if index is already opened, false otherwise.
    */
    IndexMemImpl.prototype.isOpen = function () {
        return this.opened;
    };

    /**
    * Opens the index. This method must be invoked before using any other
    * method (aside from isOpen()) exported by this interface or derived
    * interfaces.
    */
    IndexMemImpl.prototype.open = function () {
        this.opened = true;
    };

    /** Synchronizes the index with data in the topic map. */
    IndexMemImpl.prototype.reindex = function () {
        return;
    };

    /**
    * Creates a new instance of TypeInstanceIndexMemImpl.
    * @class Implementation of the TypeInstanceIndex interface.
    */
    TypeInstanceIndexMemImpl = function (tm) {
        var eventHandler, that = this;
        this.tm = tm;
        // we use hash tables of hash tables for our index
        this.type2topics = new Hash();
        this.type2associations = new Hash();
        this.type2roles = new Hash();
        this.type2occurrences = new Hash();
        this.type2names = new Hash();
        this.type2variants = new Hash();
        this.opened = false;

        eventHandler = function (eventtype, source, obj) {
            var existing, untyped, types, type, i;
            switch (eventtype) {
                case EventType.ADD_ASSOCIATION:
                    break;
                case EventType.ADD_NAME:
                    existing = that.type2names.get(obj.type.getId());
                    if (typeof existing === 'undefined') {
                        existing = new Hash();
                    }
                    existing.put(source.getId(), source);
                    that.type2names.put(obj.type.getId(), existing);
                    break;
                case EventType.ADD_OCCURRENCE:
                    existing = that.type2occurrences.get(obj.type.getId());
                    if (typeof existing === 'undefined') {
                        existing = new Hash();
                    }
                    existing.put(source.getId(), source);
                    that.type2occurrences.put(obj.type.getId(), existing);
                    break;
                case EventType.ADD_ROLE:
                    existing = that.type2roles.get(obj.type.getId());
                    if (typeof existing === 'undefined') {
                        existing = new Hash();
                    }
                    existing.put(source.getId(), source);
                    that.type2roles.put(obj.type.getId(), existing);
                    break;
                case EventType.ADD_TOPIC:
                    existing = that.type2topics.get('null');
                    if (typeof existing === 'undefined') {
                        existing = new Hash();
                    }
                    existing.put(source.getId(), source);
                    that.type2topics.put('null', existing);
                    break;
                case EventType.ADD_TYPE:
                    // check if source exists with type null, remove it there
                    untyped = that.type2topics.get('null');
                    if (untyped && untyped.get(source.getId())) {
                        untyped.remove(source.getId());
                    }
                    
                    existing = that.type2topics.get(obj.type.getId());
                    if (typeof existing === 'undefined') {
                        existing = new Hash();
                    }
                    existing.put(source.getId(), source);
                    that.type2topics.put(obj.type.getId(), existing);
                    break;
                case EventType.REMOVE_ASSOCIATION:
                    type = source.getType();
                    existing = that.type2associations.get(type.getId());
                    for (i=0; i<existing.length; i+=1) {
                        if (existing[i].equals(source)) {
                            existing.splice(i, 1);
                            break;
                        }    
                    }
                    if (existing.length > 0) {
                        that.type2associations.put(type.getId(),
                                existing);
                    } else {
                        that.type2associations.remove(type.getId());
                    }
                    break;
                case EventType.REMOVE_NAME:
                    type = source.getType();
                    existing = that.type2names.get(type.getId());
                    existing.remove(source.getId());
                    if (existing.length > 0) {
                        that.type2names.put(type.getId(), existing);
                    } else {
                        that.type2names.remove(type.getId());
                    }
                    break;
                case EventType.REMOVE_OCCURRENCE:
                    type = source.getType();
                    existing = that.type2occurrences.get(type.getId());
                    existing.remove(source.getId());
                    if (existing.length > 0) {
                        that.type2occurrences.put(type.getId(), existing);
                    } else {
                        that.type2occurrences.remove(type.getId());
                    }
                    break;
                case EventType.REMOVE_ROLE:
                    type = source.getType();
                    existing = that.type2roles.get(type.getId());
                    existing.remove(source.getId());
                    if (existing.length > 0) {
                        that.type2roles.put(type.getId(), existing);
                    } else {
                        that.type2roles.remove(type.getId());
                    }
                    break;
                case EventType.REMOVE_TOPIC:
                    // two cases:
                    //  topic has types
                    types = source.getTypes();
                    for (i=0; i<types.length; i+=1) {
                        existing = that.type2topics.get(types[i].getId());
                        existing.remove(source.getId());
                        if (!existing.size()) {
                            that.type2topics.remove(types[i].getId());
                        }
                    }
                    // topic used as type 
                    that.type2topics.remove(source.getId());
                    that.type2associations.remove(source.getId());
                    that.type2roles.remove(source.getId());
                    that.type2occurrences.remove(source.getId());
                    that.type2variants.remove(source.getId());
                    break;
                case EventType.SET_TYPE:
                    if (source.isAssociation()) {
                        // remove source from type2associations(obj.old.getId());
                        if (obj.old) {
                            existing = that.type2associations.get(obj.old.getId());
                            for (i=0; i<existing.length; i+=1) {
                                if (existing[i].equals(source)) {
                                    existing.splice(i, 1);
                                    break;
                                }    
                            }
                            if (existing.length > 0) {
                                that.type2associations.put(obj.old.getId(),
                                        existing);
                            } else {
                                that.type2associations.remove(obj.old.getId());
                            }
                        }
                        existing = that.type2associations.get(obj.type.getId());
                        if (typeof existing === 'undefined') {
                            existing = [];
                        }
                        existing.push(source);
                        that.type2associations.put(obj.type.getId(), existing);
                    } else if (source.isName()) {
                        existing = that.type2names.get(obj.old.getId());
                        if (existing) {
                            existing.remove(source.getId());
                            if (existing.length > 0) {
                                that.type2names.put(obj.old.getId(), existing);
                            } else {
                                that.type2names.remove(obj.old.getId());
                            }
                        }
                        existing = that.type2names.get(obj.type.getId());
                        if (typeof existing === 'undefined') {
                            existing = new Hash();
                        }
                        existing.put(source.getId(), source);
                        that.type2names.put(obj.type.getId(), existing);
                    } else if (source.isOccurrence()) {
                        existing = that.type2occurrences.get(obj.old.getId());
                        if (existing) {
                            existing.remove(source.getId());
                            if (existing.length > 0) {
                                that.type2occurrences.put(obj.old.getId(), existing);
                            } else {
                                that.type2occurrences.remove(obj.old.getId());
                            }
                        }
                        existing = that.type2occurrences.get(obj.type.getId());
                        if (typeof existing === 'undefined') {
                            existing = new Hash();
                        }
                        existing.put(source.getId(), source);
                        that.type2occurrences.put(obj.type.getId(), existing);
                    } else if (source.isRole()) {
                        existing = that.type2roles.get(obj.old.getId());
                        if (existing) {
                            existing.remove(source.getId());
                            if (existing.length > 0) {
                                that.type2roles.put(obj.old.getId(), existing);
                            } else {
                                that.type2roles.remove(obj.old.getId());
                            }
                        }
                        existing = that.type2roles.get(obj.type.getId());
                        if (typeof existing === 'undefined') {
                            existing = new Hash();
                        }
                        existing.put(source.getId(), source);
                        that.type2roles.put(obj.type.getId(), existing);
                    }
                    break;
            }
        };
        //tm.addAssociationEvent.registerHandler(eventHandler);
        tm.addNameEvent.registerHandler(eventHandler);
        tm.addOccurrenceEvent.registerHandler(eventHandler);
        tm.addRoleEvent.registerHandler(eventHandler);
        tm.addTopicEvent.registerHandler(eventHandler);
        tm.addTypeEvent.registerHandler(eventHandler);
        tm.removeAssociationEvent.registerHandler(eventHandler);
        tm.removeNameEvent.registerHandler(eventHandler);
        tm.removeOccurrenceEvent.registerHandler(eventHandler);
        tm.removeRoleEvent.registerHandler(eventHandler);
        tm.removeTopicEvent.registerHandler(eventHandler);
        tm.setTypeEvent.registerHandler(eventHandler);
    };

    TypeInstanceIndexMemImpl.swiss(IndexMemImpl, 'close', 'isAutoUpdated',
        'isOpen', 'open', 'reindex');
          
    /**
    * Returns the associations in the topic map whose type property equals type.
    *
    * @param {TopicMemImpl} type
    * @returns {Array} A list of all associations in the topic map with the given type.
    */
    TypeInstanceIndexMemImpl.prototype.getAssociations = function (type) {
        var ret = this.type2associations.get(type.getId());
        if (!ret) { return []; }
        return ret;
    };

    /**
    * Returns the topics in the topic map used in the type property of Associations.
    *
    * @returns {Array} A list of all topics that are used as an association type.
    */
    TypeInstanceIndexMemImpl.prototype.getAssociationTypes = function () {
        var ret = [], keys = this.type2associations.keys(), i;
        for (i=0; i<keys.length; i+=1) {
            ret.push(this.tm.getConstructById(keys[i]));
        }
        return ret;
    };

    /**
    * Returns the topic names in the topic map whose type property equals type.
    *
    * @param {TopicMemImpl} type
    * @returns {Array}
    */
    TypeInstanceIndexMemImpl.prototype.getNames = function (type) {
        var ret = this.type2names.get(type.getId());
        if (!ret) { return []; }
        return ret.values();
    };

    /**
    * Returns the topics in the topic map used in the type property of Names.
    *
    * @returns {Array} An array of topic types. Note that the array contains
    * a reference to the actual topics, not copies of them.
    */
    TypeInstanceIndexMemImpl.prototype.getNameTypes = function () {
        var ret = [], keys = this.type2names.keys(), i;
        for (i=0; i<keys.length; i+=1) {
            ret.push(this.tm.getConstructById(keys[i]));
        }
        return ret;
    };

    /**
    * Returns the occurrences in the topic map whose type property equals type.
    *
    * @returns {Array}
    */
    TypeInstanceIndexMemImpl.prototype.getOccurrences = function (type) {
        var ret = this.type2occurrences.get(type.getId());
        if (!ret) { return []; }
        return ret.values();
    };

    /**
    * Returns the topics in the topic map used in the type property of
    * Occurrences.
    *
    * @returns {Array} An array of topic types. Note that the array contains
    * a reference to the actual topics, not copies of them.
    */
    TypeInstanceIndexMemImpl.prototype.getOccurrenceTypes = function () {
        var ret = [], keys = this.type2occurrences.keys(), i;
        for (i=0; i<keys.length; i+=1) {
            ret.push(this.tm.getConstructById(keys[i]));
        }
        return ret;
    };


    /**
    * Returns the roles in the topic map whose type property equals type.
    *
    * @returns {Array}
    */
    TypeInstanceIndexMemImpl.prototype.getRoles = function (type) {
        var ret = this.type2roles.get(type.getId());
        if (!ret) { return []; }
        return ret.values();
    };

    /**
    * Returns the topics in the topic map used in the type property of Roles.
    *
    * @returns {Array} An array of topic types. Note that the array contains
    * a reference to the actual topics, not copies of them.
    */
    TypeInstanceIndexMemImpl.prototype.getRoleTypes = function () {
        var ret = [], keys = this.type2roles.keys(), i;
        for (i=0; i<keys.length; i+=1) {
            ret.push(this.tm.getConstructById(keys[i]));
        }
        return ret;
    };

    /**
    * Returns the topics which are an instance of the specified type.
    */
    TypeInstanceIndexMemImpl.prototype.getTopics = function (type) {
        var ret = this.type2topics.get((type ? type.getId() : 'null'));
        if (!ret) { return []; }
        return ret.values();
    };

    /**
    * Returns the topics which are an instance of the specified types.
    * If matchall is true only topics that have all of the listed types
    * are returned.
    * @returns {Array} A list of Topic objects
    */
    TypeInstanceIndexMemImpl.prototype.getTopicsByTypes = function (types, matchall) {
        var instances, instance_keys, hash = new Hash(), i, j, ret, contains;
        for (i=0;i<types.length;i+=1) {
            instances = this.type2topics.get(types[i].getId());
            if (instances) {
                instance_keys = instances.keys();
                // we use a hash to store instances to avoid duplicates
                for (j=0; j<instance_keys.length; j+=1) {
                    hash.put(instances.get(instance_keys[j]).getId(),
                            instances.get(instance_keys[j]));
                }
            }
        }
        if (!matchall) {
            return hash.values();
        }
        // If matchall is true, we check all values for all types in {types}
        // It's a hack, but will do for now
        instances = hash.values();
        // Helper function: TODO: Should be available in the whole TM namespace
        contains = function (arr, elem) {
            for (var key in arr) {
                if (arr.hasOwnProperty(key)) {
                    if (arr[key].equals(elem)) { return true; }
                }
            }
            return false;
        };
        for (i=0; i<instances.length; i+=1) {
            for (j=0; j<types.length; j+=1) {
                if (!contains(instances[i].getTypes(), types[j])) {
                    instances.splice(i, 1);
                    i -= 1;
                    break;
                }
            }
        }
        return instances;
    };

    /**
    * Returns the topics in topic map which are used as type in an
    * "type-instance"-relationship.
    */
    TypeInstanceIndexMemImpl.prototype.getTopicTypes = function () {
        var ret = [], keys = this.type2topics.keys(), i;
        for (i=0; i<keys.length; i+=1) {
            if (keys[i] !== 'null') {
                ret.push(this.tm.getConstructById(keys[i]));
            }
        }
        return ret;
    };

    TypeInstanceIndexMemImpl.prototype.close = function () {
        this.type2topics.empty();
        this.type2associations.empty();
        this.type2roles.empty();
        this.type2occurrences.empty();
        this.type2variants.empty();
    };

    /**
    * @class Helper class that is used to check if constructs belong to
    * a given topic map.
    */
    SameTopicMapHelper = {
        /**
        * Checks if topic belongs to the topicmap 'topicmap'.
        * topic can be instance of Topic or an Array with topics.
        * topic map be null.
        * @static
        * @throws ModelConstraintException if the topic(s) don't
        * belong to the same topic map.
        * @returns false if the topic was null or true otherwise.
        */
        assertBelongsTo: function (topicmap, topic) {
            var i;
            if (!topic) { return false; }
            if (topic && topic instanceof TopicMemImpl &&
                    !topicmap.equals(topic.getTopicMap())) {
                throw {name: 'ModelConstraintException',
                    messge: 'scope topic belongs to different topic map'};
            }
            if (topic && topic instanceof Array) {
                for (i=0; i<topic.length; i+=1) {
                    if (!topicmap.equals(topic[i].getTopicMap())) {
                        throw {name: 'ModelConstraintException',
                            messge: 'scope topic belong to different topic maps'};
                    }
                }
            }
            return true;
        }
    };

    // Export objects into the TM namespace
    return {
        TopicMapSystemFactory: TopicMapSystemFactory
    };
}());

// Pollute the global namespace
TopicMapSystemFactory = TM.TopicMapSystemFactory; 

