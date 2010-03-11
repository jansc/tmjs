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
    var Version, Hash, Locator, Topic, Association, Scoped, Construct, Typed,
        Reifiable, DatatypeAware, TopicMap, Role, Name, Variant,
        Occurrence, TopicMapSystemMemImpl, Index, TypeInstanceIndex,
        SameTopicMapHelper;

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
             this.hash[key] = val;
            return val;
        },

        remove: function (key) {
            delete this.hash[key];
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

        empty: function () {
            this.hash = {};
        }
    };
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
    Construct = function () {};

    /** 
     * Adds an item identifier.
     * @param {Locator} itemIdentifier The item identifier to add.
     * @throws {ModelConstraintException} If the itemidentifier is null.
     * @throws {IdentityConstraintException} If another Topic Maps construct with
     *         the same item identifier exists.
     */
    Construct.prototype.addItemIdentifier = function (itemIdentifier) {
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
    Construct.prototype.equals = function (other) {
        return (this.id === other.id);
    };
    
    /** Returns the identifier of this construct. */
    Construct.prototype.getId = function () {
        return this.id;
    };
    
    /** Returns the item identifiers of this Topic Maps construct. */
    Construct.prototype.getItemIdentifiers = function () {
        return this.itemIdentifiers;
    };
    
    /** Returns the parent of this construct. */
    Construct.prototype.getParent = function () {
        return this.parnt;
    };
    
    /** Returns the TopicMap instance to which this Topic Maps construct belongs. */
    Construct.prototype.getTopicMap = function () {
        throw {name: 'NotImplemented', message: 'getTopicMap() not implemented'};
    };
    
    // Returns the hash code value.
    // TODO: Is this needed?
    Construct.prototype.hashCode = function () {
        throw {name: 'NotImplemented', message: 'hashCode() not implemented'};
    };
    
    /** Deletes this construct from its parent container. */
    Construct.prototype.remove = function () {
        throw {name: 'NotImplemented', message: 'remove() not implemented'};
    };
    
    /** Removes an item identifier. */
    Construct.prototype.removeItemIdentifier = function (itemIdentifier) {
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
    Construct.prototype.isTopicMap = function() {
        return false;
    };
    
    /** Return true if the construct is a Topic-object */
    Construct.prototype.isTopic = function() {
        return false;
    };
    
    /** Return true if the construct is an Association-object */
    Construct.prototype.isAssociation = function() {
        return false;
    };
    
    /** Return true if the construct is a Role-object */
    Construct.prototype.isRole = function() {
        return false;
    };
    
    /** Return true if the construct is a Name-object */
    Construct.prototype.isName = function() {
        return false;
    };
    
    /** Return true if the construct is an Occurrence-object */
    Construct.prototype.isOccurrence = function() {
        return false;
    };
    
    /** Return true if the construct is a Variant-object */
    Construct.prototype.isVariant = function() {
        return false;
    };
    
    // --------------------------------------------------------------------------
    Typed = function () {};
    
    // Returns the type of this construct.
    Typed.prototype.getType = function () {
        return this.type;
    };
    
    // Sets the type of this construct.
    Typed.prototype.setType = function (type) {
        if (type === null) { throw {name: 'ModelConstraintException',
            message: 'Topic.getRolesPlayed cannot be called without type'}; }
        SameTopicMapHelper.assertBelongsTo(this.getTopicMap(), type);
        this.type = type;
    };
    
    // --------------------------------------------------------------------------
    /**
    * @class Indicates that a statement (Topic Maps construct) has a scope.
    * Associations, Occurrences, Names, and Variants are scoped.
    */
    Scoped = function () {};
    
    /** Adds a topic to the scope. */
    Scoped.prototype.addTheme = function (theme) {
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
    Scoped.prototype.getScope = function () {
        return this.scope;
    };
    
    /** Removes a topic from the scope. */
    Scoped.prototype.removeTheme = function (theme) {
        for (var i=0; i<this.scope.length; i+=1) {
            if (this.scope[i] === theme) {
                this.scope.splice(i, 1);
                break;
            }
        }
    };
    
    
    // --------------------------------------------------------------------------
    /**
    * @class Indicates that a Construct is reifiable. Every Topic Maps
    * construct that is not a Topic is reifiable.
    */
    Reifiable = function () {};
    
    /** Returns the reifier of this construct. */
    Reifiable.prototype.getReifier = function () {
        return this.reifier;
    };
    
    /** Sets the reifier of the construct. */
    Reifiable.prototype.setReifier = function (reifier) {
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
    * Inherits Scoped, Reifiable
    */
    DatatypeAware = function () {};
    
    /** Returns the BigDecimal representation of the value. */
    DatatypeAware.prototype.decimalValue = function () {
    };
    
    /** Returns the float representation of the value. */
    DatatypeAware.prototype.floatValue = function () {
        var ret = parseFloat(this.value);
        if (isNaN(ret)) {
            throw {name: 'NumberFormatException',
                message: '"'+this.value+'" is not a float'};
        }
        return ret;
    };
    
    /** Returns the Locator identifying the datatype of the value. */
    DatatypeAware.prototype.getDatatype = function () {
        return this.datatype;
    };
    
    /** Returns the lexical representation of the value. */
    DatatypeAware.prototype.getValue = function () {
        if (typeof this.value === 'object' && this.value instanceof Locator) {
            return this.value.getReference();
        }
        return this.value.toString();
    };
    
    /** Returns the BigInteger representation of the value. */
    DatatypeAware.prototype.integerValue = function () {
        var ret = parseInt(this.value, 10);
        if (isNaN(ret)) {
            throw {name: 'NumberFormatException',
                message: '"'+this.value+'" is not an integer'};
        }
        return ret;
    };
    
    /** Returns the Locator representation of the value. */
    DatatypeAware.prototype.locatorValue = function () {
        if (!(typeof this.value === 'object' && this.value instanceof Locator)) {
            throw {name: 'ModelConstraintException',
                message: '"'+this.value+'" is not a locator'};
        }
        return this.value;
    };
    
    /** Returns the long representation of the value. */
    DatatypeAware.prototype.longValue = function () {
    };
    
    /** Sets the value and the datatype. */
    DatatypeAware.prototype.setValue = function (value, datatype) {
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
    * Creates a new instance of TopicMamSystem.
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
        var tm = new TopicMap(this, locator);
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
    
    TopicMap = function (tms, locator) {
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
        this._id2construct.put(0, this);
        this.id = 0;
        this.reifier = null;
    };
    
    TopicMap.swiss(Reifiable, 'getReifier', 'setReifier');
    TopicMap.swiss(Construct, 'addItemIdentifier', 'getItemIdentifiers',
        'removeItemIdentifier', 'isTopic', 'isAssociation', 'isRole',
        'isOccurrence', 'isName', 'isVariant', 'isTopicMap');
    
    TopicMap.prototype.isTopicMap = function() {
        return true;
    };
    
    TopicMap.prototype._getConstructId = function () {
        this._constructId = this._constructId + 1;
        return this._constructId;
    };
    
    TopicMap.prototype.remove = function() {
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
    
    TopicMap.prototype.createAssociation = function (type, scope) {
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
    
        a = new Association(this);
        this.associations.push(a);
        if (type) {
            a.setType(type);
        }
        if (scope && typeof scope === 'object') {
            if (scope instanceof Array) {
                for (i=0; i<scope.length; i+=1) {
                    a.addTheme(scope[i]);
                }
            } else if (scope instanceof Topic) {
                a.addTheme(scope[i]);
            }
        }
        return a;
    };
    
    TopicMap.prototype.createLocator = function (iri) {
        return new Locator(this, iri);
    };
    
    TopicMap.prototype._createEmptyTopic = function () {
        var t = new Topic(this);
        this.topics.push(t);
        return t;
    };
    
    TopicMap.prototype.createTopic = function () {
        var t = this._createEmptyTopic();
        t.addItemIdentifier(this.createLocator('urn:x-tmjs:'+t.getId()));
        return t;
    };
    
    TopicMap.prototype.createTopicByItemIdentifier = function (itemIdentifier) {
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
    
    TopicMap.prototype.createTopicBySubjectIdentifier = function (subjectIdentifier) {
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
    
    TopicMap.prototype.createTopicBySubjectLocator = function (subjectLocator) {
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
    
    TopicMap.prototype.getAssociations = function () {
        return this.associations;
    };
    
    TopicMap.prototype.getConstructById = function (id) {
        if (id === null) { throw {name: 'ModelConstraintException',
                message: 'getConstructById(null) is illegal'}; }
        var ret = this._id2construct.get(id);
        if (!ret) { return null; }
        return ret;
    };
    
    TopicMap.prototype.getConstructByItemIdentifier = function (itemIdentifier) {
        if (itemIdentifier === null) { throw {name: 'ModelConstraintException',
                message: 'getConstructByItemIdentifier(null) is illegal'}; }
        var ret = this._ii2construct.get(itemIdentifier.getReference());
        if (!ret) { return null; }
        return ret;
    };
    
    TopicMap.prototype.getIndex = function (className) {
        throw {name: 'UnsupportedOperationException', 
            message: 'getIndex ist not (yet) supported'};
    };
    
    TopicMap.prototype.getParent = function () {
        return null;
    };
    
    TopicMap.prototype.getTopicBySubjectIdentifier = function (subjectIdentifier) {
        var res = this._si2topic.get(subjectIdentifier.getReference());
        if (res) {
            return res;
        }
        return null; // Make sure that the result is not undefined
    };
    
    TopicMap.prototype.getTopicBySubjectLocator = function (subjectLocator) {
        var res = this._sl2topic.get(subjectLocator.getReference());
        if (res) {
            return res;
        }
        return null; // Make sure that the result is not undefined
    };
    
    TopicMap.prototype.getTopics = function () {
        return this.topics;
    };
    
    TopicMap.prototype.mergeIn = function (topicmap) {
        // TODO implement!
        throw {name: 'NotImplemented', message: 'TopicMap.mergeIn() not implemented'};
    };
    
    TopicMap.prototype.equals = function (topicmap) {
        return this.locator.equals(topicmap.locator);
    };
    
    TopicMap.prototype.getId = function () {
        return this.id;
    };
    
    TopicMap.prototype.getTopicMap = function () {
        return this;
    };
    
    // Remove item identifiers
    TopicMap.prototype._removeConstruct = function (construct) {
        var iis = construct.getItemIdentifiers(), i;
        for (i=0; i<iis.length; i+=1) {
            this._ii2construct.remove(iis[i].getReference());
        }
    };
    
    TopicMap.prototype._removeTopic = function (topic) {
        var i, sis = topic.getSubjectIdentifiers(),
            slos = topic.getSubjectLocators();
        // remove subject identifiers from TopicMap._si2topic
        for (i=0; i<sis.length; i+=1) {
            this._si2topic.remove(sis[i].getReference());
        }
        // remove subject locators from TopicMap._sl2topic
        for (i=0; i<slos.length; i+=1) {
            this._sl2topic.remove(slos[i].getReference());
        }
        this._removeConstruct(topic);
        // remove topic from TopicMap.topics
        for (i=0; i<this.topics.length; i+=1) {
            if (topic.id === this.topics[i].id) {
                this.topics.splice(i, 1);
                break;
            }
        }
    };
    
    TopicMap.prototype._removeAssociation = function (association) {
        var i, iis;
        // remove association from TopicMap.associations
        for (i=0; i<this.associations.length; i+=1) {
            if (association.id === this.associations[i].id) {
                this.associations.splice(i, 1);
                break;
            }
        }
        this._removeConstruct(association);
        // remove association from TopicMap.associations
        for (i=0; i<this.associations.length; i+=1) {
            if (association.id === this.associations[i].id) {
                this.associations.splice(i, 1);
                break;
            }
        }
    };
    
    TopicMap.prototype._removeRole = function (role) {
        this._removeConstruct(role);
    };
    
    TopicMap.prototype._removeOccurrence = function (occ) {
        this._removeConstruct(occ);
    };
    
    TopicMap.prototype._removeName = function (name) {
        this._removeConstruct(name);
    };
    
    TopicMap.prototype._removeVariant = function (variant) {
        this._removeConstruct(variant);
    };
    
    // hashCode, remove
    
    // --------------------------------------------------------------------------
    
    Topic = function (parnt) {
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
    
    Topic.swiss(Construct, 'addItemIdentifier', 'equals', 'getId',
        'getItemIdentifiers', 'getParent', 'getTopicMap', 'hashCode', 'remove',
        'removeItemIdentifier', 'isTopic', 'isAssociation', 'isRole',
        'isOccurrence', 'isName', 'isVariant', 'isTopicMap');
    
    Topic.prototype.isTopic = function() {
        return true;
    };
    
    Topic.prototype.getTopicMap = function () {
        return this.parnt;
    };
    
    // Adds a subject identifier to this topic.
    Topic.prototype.addSubjectIdentifier = function (subjectIdentifier) {
        if (!subjectIdentifier) { throw {name: 'ModelConstraintException',
            message: 'addSubjectIdentifier() needs subject identifier'}; }
        this.subjectIdentifiers.push(subjectIdentifier);
        this.parnt._si2topic.put(subjectIdentifier.getReference(), this);
    };
    
    // Adds a subject locator to this topic.
    Topic.prototype.addSubjectLocator = function (subjectLocator) {
        if (!subjectLocator) { throw {name: 'ModelConstraintException',
            message: 'addSubjectLocator() needs subject locator'}; }
        this.subjectLocators.push(subjectLocator);
        this.parnt._sl2topic.put(subjectLocator.getReference(), this);
    };
    
    // Adds a type to this topic.
    Topic.prototype.addType = function (type) {
        if (!type) { throw {name: 'ModelConstraintException',
            message: 'addType() needs type'}; }
        SameTopicMapHelper.assertBelongsTo(this.parnt, type);
        this.types.push(type);
    };
    
    // TODO: @type is optional In TMAPI 2.0
    // Creates a Name for this topic with the specified value, and scope.
    // Creates a Name for this topic with the specified type, value, and scope.
    Topic.prototype.createName = function (type, value, scope) {
        var i, name;
        SameTopicMapHelper.assertBelongsTo(this.parnt, type);
        SameTopicMapHelper.assertBelongsTo(this.parnt, scope);
    
            name = new Name(this, type, value, scope);
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
    Topic.prototype.createOccurrence = function (type, value, datatype, scope) {
        var occ;
        SameTopicMapHelper.assertBelongsTo(this.parnt, type);
        SameTopicMapHelper.assertBelongsTo(this.parnt, scope);
    
        occ = new Occurrence(this, type, value);
        this.occurrences.push(occ);
        return occ;
    };
    
    // Returns the Names of this topic where the name type is type. type is optional.
    Topic.prototype.getNames = function (type) {
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
    Topic.prototype.getOccurrences = function (type) {
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
    
    Topic.prototype._removeOccurrence = function (occ) {
        // remove this from TopicMap.topics
        for (var i=0; i<this.occurrences.length; i+=1) {
            if (this.occurrences[i].equals(occ)) {
                this.occurrences.splice(i, 1);
                break;
            }
        }
        this.getTopicMap()._removeOccurrence(occ);
    };
    
    // Returns the Construct which is reified by this topic.
    Topic.prototype.getReified = function (type) {
        return this.reified;
    };
    
    Topic.prototype._setReified = function (reified) {
        this.reified = reified;
    };
    
    // Returns the roles played by this topic.
    // Returns the roles played by this topic where the role type is type.
    // assocType is optional
    Topic.prototype.getRolesPlayed = function (type, assocType) {
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
    Topic.prototype.addRolePlayed = function (role) {
        this.rolesPlayed.push(role);
    };
    
    Topic.prototype.removeRolePlayed = function (role) {
        for (var i=0; i<this.rolesPlayed.length; i+=1) {
            if (this.rolesPlayed[i].id === role.id) {
                this.rolesPlayed.splice(i, 1);
            }
        }
    };
    
    // Returns the subject identifiers assigned to this topic.
    Topic.prototype.getSubjectIdentifiers = function () {
        return this.subjectIdentifiers;
    };
    
    // Returns the subject locators assigned to this topic.
    Topic.prototype.getSubjectLocators = function () {
        return this.subjectLocators;
    };
    
    // Returns the types of which this topic is an instance of.
    Topic.prototype.getTypes = function () {
        return this.types;
    };
    
    // Merges another topic into this topic.
    Topic.prototype.mergeIn = function (other) {
        // TODO Implement!
        throw {name: 'NotImplemented', message: 'Topic.mergeIn() not implemented'};
    };
    
    // Removes this topic from the containing TopicMap instance.
    Topic.prototype.remove = function () {
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
        this.getTopicMap()._removeTopic(this);
        this.getTopicMap()._id2construct.remove(this.id);
        this.id = null;
    };
    
    // Removes a subject identifier from this topic.
    Topic.prototype.removeSubjectIdentifier = function (subjectIdentifier) {
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
    Topic.prototype.removeSubjectLocator = function (subjectLocator) {
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
    Topic.prototype.removeType = function (type) {
        for (var i=0; i<this.types.length; i+=1) {
            if (this.types[i].equals(type)) {
                this.types.splice(i, 1);
                break;
            }
        }
    };
    
    Topic.prototype._removeName = function(name) {
        for (var i=0; i<this.names.length; i+=1) {
            if (this.names[i].equals(name)) {
                this.names.splice(i, 1);
                break;
            }
        }
        this.getTopicMap()._removeName(name);
    };
    
    // --------------------------------------------------------------------------
    Occurrence = function (parnt, type, value) {
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
    
    // mergein Typed, DatatypeAware, Reifiable, Scoped, Construct
    Occurrence.swiss(Typed, 'getType', 'setType');
    Occurrence.swiss(DatatypeAware, 'decimalValue', 'floatValue',
        'getDatatype', 'getValue', 'integerValue', 'locatorValue', 'longValue',
        'setValue');
    Occurrence.swiss(Reifiable, 'getReifier', 'setReifier');
    Occurrence.swiss(Scoped, 'addTheme', 'getScope', 'removeTheme');
    Occurrence.swiss(Construct, 'addItemIdentifier', 'equals', 'getId',
        'getItemIdentifiers', 'getParent', 'getTopicMap', 'hashCode', 'remove',
        'removeItemIdentifier', 'isTopic', 'isAssociation', 'isRole',
        'isOccurrence', 'isName', 'isVariant', 'isTopicMap');
    
    Occurrence.prototype.isOccurrence = function() {
        return true;
    };
    
    Occurrence.prototype.getTopicMap = function () {
        return this.parnt.getParent();
    };
    
    Occurrence.prototype.remove = function () {
        this.parnt._removeOccurrence(this);
        this.id = null;
    };
    
    Name = function (parnt, type, value, scope) {
        this.itemIdentifiers = [];
        this.parnt = parnt;
        this.value = value;
        this.type = type || parnt.parnt.parnt.createLocator(
            'http://psi.topicmaps.org/iso13250/model/topic-name');
        if (!scope) {
            this.scope = [];
        } else if (scope instanceof Topic) {
                this.scope[0] = scope;
        } else if (scope instanceof Array) {
            this.scope = scope;
        }
        this.reifier = null;
        this.variants = [];
        this.id = this.getTopicMap()._getConstructId();
        this.getTopicMap()._id2construct.put(this.id, this);
    };
    
    // mergein Typed, DatatypeAware, Reifiable, Scoped, Construct
    Name.swiss(Typed, 'getType', 'setType');
    Name.swiss(Reifiable, 'getReifier', 'setReifier');
    Name.swiss(Scoped, 'addTheme', 'getScope', 'removeTheme');
    Name.swiss(Construct, 'addItemIdentifier', 'equals', 'getId',
        'getItemIdentifiers', 'getParent', 'getTopicMap', 'hashCode', 'remove',
        'removeItemIdentifier', 'isTopic', 'isAssociation', 'isRole',
        'isOccurrence', 'isName', 'isVariant', 'isTopicMap');
    
    Name.prototype.isName = function() {
        return true;
    };
    
    Name.prototype.getTopicMap = function () {
        return this.parnt.parnt;
    };
    
    Name.prototype.createVariant = function (value, datatype, scope) {
        var variant = new Variant(this, value, datatype, scope);
        this.variants.push(variant);
        return variant;
    };
    
    Name.prototype.setValue = function(value) {
        if (!value) { throw {name: 'ModelConstraintException',
            message: 'Name.setValue(null) is not allowed'}; }
        this.value = value;
    };
    
    Name.prototype.getValue = function(value) {
        return this.value;
    };
    
    Name.prototype.remove = function () {
        this.getParent()._removeName(this);
        this.id = null;
    };
    
    Name.prototype._removeVariant = function (variant) {
        for (var i=0; i<this.variants.length; i+=1) {
            if (this.variants[i].equals(variant)) {
                this.variants.splice(i, 1);
                break;
            }
        }
        this.getTopicMap()._removeVariant(variant);
    };
    
    // FIXME: scope_or_datatype => datatype
    Variant = function (parnt, value, scope_or_datatype, scope) {
        var scope_arr = scope || scope_or_datatype;
        if (value === null) { throw {name: 'ModelConstraintException',
            message: 'Creation of a variant with null value is not allowed'}; }
        if (scope_or_datatype === null && scope) {
            throw {name: 'ModelConstraintException',
            message: 'Creation of a variant with datatype == null is not allowed'}; }
        this.itemIdentifiers = [];
        this.parnt = parnt;
        if (scope_arr && scope_arr instanceof Topic) {
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
    
    Variant.swiss(Reifiable, 'getReifier', 'setReifier');
    Variant.swiss(Scoped, 'addTheme', 'getScope', 'removeTheme');
    Variant.swiss(Construct, 'addItemIdentifier', 'equals', 'getId',
        'getItemIdentifiers', 'getParent', 'getTopicMap', 'hashCode', 'remove',
        'removeItemIdentifier', 'isTopic', 'isAssociation', 'isRole',
        'isOccurrence', 'isName', 'isVariant', 'isTopicMap');
    Variant.swiss(DatatypeAware, 'decimalValue', 'floatValue', 'getDatatype',
        'getValue', 'integerValue', 'locatorValue', 'longValue', 'setValue');
    
    Variant.prototype.isVariant = function() {
        return true;
    };
    
    Variant.prototype.getTopicMap = function () {
        return this.getParent().getParent().getParent();
    };
    
    Variant.prototype.remove = function () {
        this.getParent()._removeVariant(this);
        this.id = null;
    };
    

    Role = function (parnt, type, player) {
        this.itemIdentifiers = [];
        this.parnt = parnt;
        this.type = type;
        this.player = player;
        this.id = this.getTopicMap()._getConstructId();
        this.reifier = null;
        this.getTopicMap()._id2construct.put(this.id, this);
    };
    
    Role.swiss(Typed, 'getType', 'setType');
    Role.swiss(Reifiable, 'getReifier', 'setReifier');
    Role.swiss(Construct, 'addItemIdentifier', 'equals', 'getId',
        'getItemIdentifiers', 'getParent', 'getTopicMap', 'hashCode', 'remove',
        'removeItemIdentifier', 'isTopic', 'isAssociation', 'isRole',
        'isOccurrence', 'isName', 'isVariant', 'isTopicMap');
    
    Role.prototype.isRole = function () {
        return true;
    };
    
    Role.prototype.getTopicMap = function () {
        return this.getParent().getParent();
    };
    
    Role.prototype.remove = function () {
        this.parnt._removeRole(this);
        this.itemIdentifiers = null;
        this.parnt = null;
        this.type = null;
        this.player = null;
        this.reifier = null;
        this.id = null;
    };
    
    Role.prototype.getPlayer = function () {
        return this.player;
    };
    
    Role.prototype.setPlayer = function (player) {
        if (!player) { throw {name: 'ModelConstraintException',
            message: 'player i Role.setPlayer cannot be null'}; }
        SameTopicMapHelper.assertBelongsTo(this.parnt.parnt, player);
        if (this.player.equals(player)) { return; }
        this.player.removeRolePlayed(this);
        player.addRolePlayed(this);
        this.player = player;
    };
    
    Association = function (par) {
        this.itemIdentifiers = [];
        this.parnt = par;
        this.id = this.getTopicMap()._getConstructId();
        this.getTopicMap()._id2construct.put(this.id, this);
        this.roles = [];
        this.scope = [];
        this.type = null;
        this.reifier = null;
    };
    
    Association.swiss(Typed, 'getType', 'setType');
    Association.swiss(Reifiable, 'getReifier', 'setReifier');
    Association.swiss(Scoped, 'addTheme', 'getScope', 'removeTheme');
    Association.swiss(Construct, 'addItemIdentifier', 'equals', 'getId',
        'getItemIdentifiers', 'getParent', 'getTopicMap', 'hashCode', 'remove',
        'removeItemIdentifier', 'isTopic', 'isAssociation', 'isRole',
        'isOccurrence', 'isName', 'isVariant', 'isTopicMap');
    
    Association.prototype.isAssociation = function () {
        return true;
    };
    
    Association.prototype.getTopicMap = function () {
        return this.parnt;
    };
    
    // Creates a new Role representing a role in this association.
    Association.prototype.createRole = function (type, player) {
        if (!type) { throw {name: 'ModelConstraintException',
            message: 'type i Role.createPlayer cannot be null'}; }
        if (!player) { throw {name: 'ModelConstraintException',
            message: 'player i Role.createRole cannot be null'}; }
        SameTopicMapHelper.assertBelongsTo(this.parnt, type);
        SameTopicMapHelper.assertBelongsTo(this.parnt, player);
        var role = new Role(this, type, player);
        player.addRolePlayed(role);
        this.roles.push(role);
        return role;
    };
    
    Association.prototype._removeRole = function (role) {
        for (var i=0; i<this.roles.length; i+=1) {
            if (role.id === this.roles[i].id) {
                this.roles.splice(i, 1);
                break;
            }
        }
        role.getPlayer().removeRolePlayed(role);
        this.getTopicMap()._removeRole(role);
    };
    
    Association.prototype.remove = function () {
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
    Association.prototype.getRoles = function (type) {
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
    Association.prototype.getRoleTypes = function () {
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
    Index = function () {};

    /** Close the index. */
    Index.prototype.close = function () {
    };

    /** 
    * Indicates whether the index is updated automatically. 
    * @returns {boolean}
    */
    Index.prototype.isAutoUpdated = function () {
    };

    /** Indicates if the index is open.
    * @returns {boolean} true if index is already opened, false otherwise.
    */
    Index.prototype.isOpen = function () {
    };

    /**
    * Opens the index. This method must be invoked before using any other
    * method (aside from isOpen()) exported by this interface or derived
    * interfaces.
    */
    Index.prototype.open = function () {
    };

    /** Synchronizes the index with data in the topic map. */
    Index.prototype.reindex = function () {
    };

    /**
    * Creates a new instance of TypeInstanceIndex.
    * @class Implementation of the TypeInstanceIndex interface.
    */
    TypeInstanceIndex = function () {
        this.type2topics = new Hash();
        this.type2associations = new Hash();
        this.type2roles = new Hash();
        this.type2occurrences = new Hash();
        this.type2variants = new Hash();
    };

    TypeInstanceIndex.swiss(Index, 'close', 'isAutoUpdated',
        'isOpen', 'open', 'reindex');
          
    /**
    * Returns the associations in the topic map whose type property equals type.
    *
    * @param {Topic} type
    * @returns {Array} A list of all associations in the topic map with the given type.
    */
    TypeInstanceIndex.prototype.getAssociations = function (type) {
        return this.type2associations[type.getId()];
    };

    /**
    * Returns the topics in the topic map used in the type property of Associations.
    *
    * @returns {Array} A list of all topics that are used as an association type.
    */
    TypeInstanceIndex.prototype.getAssociationTypes = function () {
        return this.type2associations.keys();
    };

    /**
    * Returns the topic names in the topic map whose type property equals type.
    *
    * @param {Topic} type
    * @returns {Array}
    */
    TypeInstanceIndex.prototype.getNames = function (type) {
        var ret = this.type2names.get(type.getId());
        if (ret) { return []; }
        return ret;
    };

    /**
    * Returns the topics in the topic map used in the type property of Names.
    *
    * @returns {Array} An array of topic types. Note that the array contains
    * a reference to the actual topics, not copies of them.
    */
    TypeInstanceIndex.prototype.getNameTypes = function () {
        return this.type2names.keys();
    };

    /**
    * Returns the occurrences in the topic map whose type property equals type.
    *
    * @returns {Array}
    */
    TypeInstanceIndex.prototype.getOccurrences = function (type) {
        var ret = this.type2occurrences.get(type.getId());
        if (!ret) { return []; }
        return ret;
    };

    /**
    * Returns the topics in the topic map used in the type property of
    * Occurrences.
    *
    * @returns {Array} An array of topic types. Note that the array contains
    * a reference to the actual topics, not copies of them.
    */
    TypeInstanceIndex.prototype.getOccurrenceTypes = function () {
        return this.type2occurrences.keys();
    };


    /**
    * Returns the roles in the topic map whose type property equals type.
    *
    * @returns {Array}
    */
    TypeInstanceIndex.prototype.getRoles = function (type) {
        var ret = this.type2roles.get(type.getId());
        if (!ret) { return []; }
        return ret;
    };

    /**
    * Returns the topics in the topic map used in the type property of Roles.
    *
    * @returns {Array} An array of topic types. Note that the array contains
    * a reference to the actual topics, not copies of them.
    */
    TypeInstanceIndex.prototype.getRoleTypes = function () {
        return this.type2roles.keys();
    };

    /**
    * Returns the topics which are an instance of the specified type.
    */
    TypeInstanceIndex.prototype.getTopics = function (type) {
        var ret = this.type2topics.get(type.getId());
        if (!ret) { return []; }
        return ret;
    };

    /**
    * Returns the topics in topic map which are used as type in an
    * "type-instance"-relationship.
    */
    TypeInstanceIndex.prototype.getTopicTypes = function () {
        return this.type2topics.keys();
    };

    TypeInstanceIndex.prototype.close = function () {
        this.type2topics.empty();
        this.type2associations.empty();
        this.type2roles.empty();
        this.type2occurrences.empty();
        this.type2variants.empty();
    };

    /* TODO: Implement the other variant of getTopics():
        java.util.Collection<Topic>    getTopics(Topic[] types, boolean matchAll) 
        Returns the topics in the topic map whose type property equals one of those types at least.
    */

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
            if (topic && topic instanceof Topic &&
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

