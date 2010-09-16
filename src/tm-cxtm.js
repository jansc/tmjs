/*jslint browser: true, devel: true, onevar: true, undef: true,
  nomen: false, eqeqeq: true, plusplus: true, bitwise: true,
  regexp: true, newcap: true, immed: true */
/*global TM*/ 

TM.CXTM = (function () {
    var WriterImpl, TypeInstanceAssociation, TypeInstanceRole;

    // Fake association object that represents type-instance relations as
    // associations.
    TypeInstanceAssociation = function (tm, type, instance) {
        var typeRole, instanceRole;
        this.tm = tm;
        this.type_player = type;
        this.instance_player = instance;
        this.id = 'fake-'+(TypeInstanceAssociation.max_id+1);
        TypeInstanceAssociation.max_id += 1;
        typeRole = tm.createTopicBySubjectIdentifier(
            tm.createLocator(TM.TMDM.TYPE));
        instanceRole = tm.createTopicBySubjectIdentifier(
            tm.createLocator(TM.TMDM.INSTANCE));
        this.roles = [
            new TypeInstanceRole(this, typeRole, this.type_player), 
            new TypeInstanceRole(this, instanceRole, this.instance_player) 
        ];
    };

    TypeInstanceAssociation.max_id = 0;

    TypeInstanceAssociation.prototype.getId = function () {
        return this.id;
    };

    TypeInstanceAssociation.prototype.getReifier = function () {
        return null;
    };

    TypeInstanceAssociation.prototype.getScope = function () {
        return [];
    };

    TypeInstanceAssociation.prototype.getItemIdentifiers = function () {
        return [];
    };

    TypeInstanceAssociation.prototype.equals = function (other) {
        return this.getId() === other.getId();
    };

    TypeInstanceAssociation.prototype.getType = function () {
        return this.tm.createTopicBySubjectIdentifier(
            this.tm.createLocator(TM.TMDM.TYPE_INSTANCE));
    };

    TypeInstanceAssociation.prototype.getRoles = function () {
        return this.roles;
    };

    TypeInstanceAssociation.prototype.remove = function () {
    };

    TypeInstanceRole = function (parent, type, player) {
        this.parent = parent;
        this.type = type;
        this.player = player;
        this.id = 'fake-'+(TypeInstanceAssociation.max_id + 1);
        TypeInstanceAssociation.max_id += 1;
    };

    TypeInstanceRole.prototype.getId = function () {
        return this.id;
    };

    TypeInstanceRole.prototype.equals = function (other) {
        return this.getId() === other.getId();
    };

    TypeInstanceRole.prototype.getScope = function () {
        return [];
    };

    TypeInstanceRole.prototype.getTopicMap = function () {
        return this.tm;
    };

    TypeInstanceRole.prototype.getPlayer = function () {
        return this.player;
    };

    TypeInstanceRole.prototype.getType = function () {
        return this.type;
    };

    TypeInstanceRole.prototype.getItemIdentifiers = function () {
        return [];
    };

    TypeInstanceRole.prototype.getReifier = function () {
        return null;
    };

    TypeInstanceRole.prototype.getParent = function () {
        return this.parent;
    };

    TypeInstanceRole.prototype.remove = function () {
    };


    WriterImpl = function (tm) {
        this.tm = tm;
        this.id2cxtmid = null;
        this.topic2roles = null;
    };

    WriterImpl.prototype.toString = function (tm) {
        var i, ret = [], items, sorted_items = [];
        this.id2cxtmid = new TM.Hash();
        this.topic2roles = new TM.Hash();
        tm.sanitize();
        this.buildIndex(tm);
        ret.push('<topicMap'+this.exportReifier(tm)+'>');
        this.exportItemIdentifiers(ret, tm);
        items = tm.getTopics();
        for (i=0; i<items.length; i+=1) {
            sorted_items.push(items[i]);
        }
        sorted_items.sort(WriterImpl.compareTopic); // Custom sort function
        for (i=0; i<sorted_items.length; i+=1) {
            this.exportTopic(ret, i+1, sorted_items[i]);
        }
        this.exportAssociations(ret, tm.getAssociations(), tm);
        ret.push('</topicMap>');
        this.id2cxtmid.empty();
        return ret.join('\n')+'\n';
    };

    WriterImpl.prototype.buildIndex = function (tm) {
        var tmp, arr = [], i, j, roles, types, tia, index;
        this.tiAssocs = [];

        index = tm.getIndex('TypeInstanceIndex');
        if (index.getTopicTypes().length > 0) {
            // TODO: Make these topics "fake" topics
            tm.createTopicBySubjectIdentifier(tm.createLocator(TM.TMDM.TYPE));
            tm.createTopicBySubjectIdentifier(tm.createLocator(TM.TMDM.INSTANCE));
            tm.createTopicBySubjectIdentifier(tm.createLocator(TM.TMDM.TYPE_INSTANCE));
        }

        tmp = tm.getTopics();
        for (i=0; i<tmp.length; i+=1) {
            arr.push(tmp[i]);
            types = tmp[i].getTypes();
            for (j=0; j<types.length; j+=1) {
                tia = new TypeInstanceAssociation(tm, types[j], tmp[i]);
                if (!this.topic2roles.contains(types[j].getId())) {
                    this.topic2roles.put(types[j].getId(), []);
                }
                this.topic2roles.get(types[j].getId()).push(tia.getRoles()[0]);
                if (!this.topic2roles.contains(tmp[i].getId())) {
                    this.topic2roles.put(tmp[i].getId(), []);
                }
                this.topic2roles.get(tmp[i].getId()).push(tia.getRoles()[1]);
                this.tiAssocs.push(tia);
            }
        }
        arr.sort(WriterImpl.compareTopic);
        for (i=0; i<arr.length; i+=1) {
            this.id2cxtmid.put(arr[i].getId(), (i+1));
        }
        arr = [];
        tmp = tm.getAssociations();
        for (i=0; i<tmp.length; i+=1) {
            arr.push(tmp[i]);
        }
        for (i=0; i<this.tiAssocs.length; i+=1) {
            arr.push(this.tiAssocs[i]);
        }
        arr.sort(WriterImpl.compareAssociation);
        for (i=0; i<arr.length; i+=1) {
            this.id2cxtmid.put(arr[i].getId(), (i+1));
            roles = arr[i].getRoles();
            roles.sort(WriterImpl.compareRole);
            for (j=0; j<roles.length; j+=1) {
                this.id2cxtmid.put(roles[j].getId(), (j+1));
            }
        }
    };

    WriterImpl.prototype.exportTopic = function (ret, id, topic) {
        var rolesPlayed, i, role, arr, fakeRoles;
        ret.push('<topic number="'+id+'">');
        this.exportIdentifiers(ret, 'subjectIdentifiers', topic.getSubjectIdentifiers());
        this.exportIdentifiers(ret, 'subjectLocators', topic.getSubjectLocators());
        this.exportItemIdentifiers(ret, topic);
        this.exportNames(ret, topic.getNames());
        this.exportOccurrences(ret, topic.getOccurrences());
        rolesPlayed = topic.getRolesPlayed();
        arr = [];
        for (i=0; i<rolesPlayed.length; i+=1) {
            arr.push(rolesPlayed[i]);
        }
        fakeRoles = this.topic2roles.get(topic.getId());
        if (fakeRoles) {
            for (i=0; i<fakeRoles.length; i+=1) {
                arr.push(fakeRoles[i]);
            }
        }
        arr.sort(WriterImpl.compareRole);
        for (i=0; i<arr.length; i+=1) {
            ret.push('<rolePlayed ref="association.'+
                    this.id2cxtmid.get(arr[i].getParent().getId())+
                    '.role.'+this.id2cxtmid.get(arr[i].getId())+'"></rolePlayed>');
        }
        ret.push('</topic>');
        return ret;
    };

    WriterImpl.prototype.exportAssociations = function (ret, associations, tm) {
        var i, arr = [], association;
        if (associations.length === 0 && this.tiAssocs.length === 0) {
            return;
        }
        for (i=0; i<associations.length; i +=1) {
            arr.push(associations[i]);
        }
        for (i=0; i<this.tiAssocs.length; i+=1) {
            arr.push(this.tiAssocs[i]);
        }
        arr.sort(WriterImpl.compareAssociation);
        for (i=0; i<arr.length; i+=1) {
            association = arr[i];
            ret.push('<association number="'+(i+1)+'"'+
                    this.exportReifier(association)+'>');
            ret.push('<type topicref="'+
                    this.id2cxtmid.get(association.getType().getId())+'"></type>');
            this.exportRoles(ret, association.getRoles());
            this.exportScope(ret, association.getScope());
            this.exportItemIdentifiers(ret, association);
            ret.push('</association>');
        }
    };

    WriterImpl.prototype.exportRoles = function (ret, roles) {
        var i, arr = [], role;
        if (roles.length === 0) {
            return;
        }
        for (i=0; i<roles.length; i +=1) {
            arr.push(roles[i]);
        }
        arr.sort(WriterImpl.compareRole);
        for (i=0; i<arr.length; i+=1) {
            role = arr[i];
            ret.push('<role number="'+(i+1)+'"'+this.exportReifier(role)+'>');
            ret.push('<player topicref="'+
                    this.id2cxtmid.get(role.getPlayer().getId())+
                    '"></player>');
            ret.push('<type topicref="'+
                    this.id2cxtmid.get(role.getType().getId())+'"></type>');
            this.exportItemIdentifiers(ret, role);
            ret.push('</role>');
        }

    };

    WriterImpl.prototype.exportScope = function (ret, scope) {
        var i, arr = [], scopingTopic;
        if (scope.length === 0) {
            return;
        }
        for (i=0; i<scope.length; i +=1) {
            arr.push(scope[i]);
        }
        arr.sort(WriterImpl.compareTopic);
        ret.push('<scope>');
        for (i=0; i<arr.length; i+=1) {
            scopingTopic = arr[i];
            ret.push('<scopingTopic topicref="'+
                    this.id2cxtmid.get(scopingTopic.getId())+
                    '"></scopingTopic>');
        }
        ret.push('</scope>');
    };

    WriterImpl.prototype.exportOccurrences = function (ret, occurrences) {
        var i, arr = [], occurrence;
        if (occurrences.length === 0) {
            return;
        }
        for (i=0; i<occurrences.length; i +=1) {
            arr.push(occurrences[i]);
        }
        arr.sort(WriterImpl.compareOccurrence);
        for (i=0; i<arr.length; i+=1) {
            occurrence = arr[i];
            ret.push('<occurrence'+
                    ' number="'+(i+1)+'"'+this.exportReifier(occurrence)+'>');
            ret.push('<value>'+occurrence.getValue()+
                    '</value>');
            ret.push('<datatype>'+occurrence.getDatatype().getReference()+
                    '</datatype>');
            ret.push('<type topicref="'+this.id2cxtmid.get(occurrence.getType().getId())+
                    '"></type>');
            this.exportScope(ret, occurrence.getScope());
            this.exportItemIdentifiers(ret, occurrence);
            ret.push('</occurrence>');
        }
    };

    WriterImpl.prototype.exportNames = function (ret, names) {
        var i, arr = [], name, value;
        if (names.length === 0) {
            return;
        }
        for (i=0; i<names.length; i +=1) {
            arr.push(names[i]);
        }
        arr.sort(WriterImpl.compareName);
        for (i=0; i<arr.length; i+=1) {
            name = arr[i];
            value = name.getValue();
            // FIXME Check that encoding is correct
            value = value.replace('&', '&amp;');
            value = value.replace('<', '&lt;');
            value = value.replace('>', '&gt;');
            ret.push('<name number="'+(i+1)+'"'+this.exportReifier(name)+'>');
            ret.push('<value>'+value+'</value>');
            ret.push('<type topicref="'+
                    this.id2cxtmid.get(name.getType().getId())+'"></type>');
            this.exportScope(ret, name.getScope());
            this.exportVariants(ret, name.getVariants());
            this.exportItemIdentifiers(ret, name);
            ret.push('</name>');
        }
    };

    WriterImpl.prototype.exportVariants = function (ret, variants) {
        var i, arr = [], variant;
        if (variants.length === 0) {
            return;
        }
        for (i=0; i<variants.length; i +=1) {
            arr.push(variants[i]);
        }
        arr.sort(WriterImpl.compareVariant);
        for (i=0; i<arr.length; i+=1) {
            variant = arr[i];
            ret.push('<variant number="'+(i+1)+
                    '"'+this.exportReifier(variant)+'>');
            ret.push('<value>'+variant.getValue()+'</value>');
            ret.push('<datatype>'+variant.getDatatype().getReference()+
                    '</datatype>');
            this.exportScope(ret, variant.getScope());
            this.exportItemIdentifiers(ret, variant);
            ret.push('</variant>');
        }
    };

    WriterImpl.prototype.exportReifier = function (construct) {
        var reifier;
        if ((reifier = construct.getReifier())) {
            return ' reifier="'+this.id2cxtmid.get(reifier.getId())+'"';
        }
        return '';
    };

    WriterImpl.prototype.exportItemIdentifiers = function (ret, construct) {
        this.exportIdentifiers(ret, 'itemIdentifiers',
            construct.getItemIdentifiers());
    };

    WriterImpl.prototype.exportIdentifiers = function (ret, name, iis) {
        var i, arr = [];
        if (iis.length === 0) {
            return;
        }
        ret.push('<'+name+'>');
        for (i=0; i<iis.length; i +=1) {
            arr.push(iis[i].getReference());
        }
        arr.sort();
        for (i=0; i<arr.length; i+=1) {
            ret.push('<locator>'+arr[i]+'</locator>');
        }
        ret.push('</'+name+'>');
    };

    // Function to assure the canonical sort order:
    /**
     * Canonical sort order:
     * 1. [type]
     * 2. [roles]
     * 3. [scope]
     * 4. [parent]
     */
    WriterImpl.compareAssociation = function (a, b) {
        if (a.equals(b)) {
            return 0;
        }
        return WriterImpl.compareType(a, b) ||
            WriterImpl.compareRoles(a, b) ||
            WriterImpl.compareScope(a, b);
    };

    /**
     * Canonical sort order:
     * 1. [subject identifiers]
     * 2. [subject locators]
     * 3. [item identifiers]
     */
    WriterImpl.compareTopic = function (a, b) {
        if (a === null && b !== null) {
            return -1;
        } else if (a !== null && b === null) {
            return 1;
        } else if (a.equals(b)) {
            return 0;
        }
        return WriterImpl.compareIdentifiers(a.getSubjectIdentifiers(),
            b.getSubjectIdentifiers()) ||
            WriterImpl.compareIdentifiers(a.getSubjectLocators(),
                b.getSubjectLocators()) ||
            WriterImpl.compareIdentifiers(a.getItemIdentifiers(),
                b.getItemIdentifiers());
    };

    /**
     * Canonical sort order:
     * 1. [value]
     * 2. [datatype]
     * 3. [type]
     * 4. [scope]
     * 5. [parent]
     */
    WriterImpl.compareOccurrence = function (a, b) {
        if (a.equals(b)) {
            return 0;
        }
        return WriterImpl.compareValue(a, b) ||
            WriterImpl.compareDatatype(a, b) ||
            WriterImpl.compareType(a, b) ||
            WriterImpl.compareScope(a, b);
    };

    /**
     * Canonical sort order:
     * 1. [value]
     * 2. [type]
     * 3. [scope]
     * 4. [parent]
     */
    WriterImpl.compareName = function (a, b) {
        if (a.equals(b)) {
            return 0;
        }
        return WriterImpl.compareValue(a, b) ||
            WriterImpl.compareType(a, b) ||
            WriterImpl.compareScope(a, b);
    };

    /**
     * Canonical sort order:
     * 1. [value]
     * 2. [datatype]
     * 3. [scope]
     * 4. [parent]
     */
    WriterImpl.compareVariant = function (a, b) {
        if (a.equals(b)) {
            return 0;
        }
        return WriterImpl.compareValue(a, b) ||
            WriterImpl.compareDatatype(a, b) ||
            WriterImpl.compareScope(a, b);
    };

    WriterImpl.compareValue = function (a, b) {
        return WriterImpl.compareString(a.getValue(), b.getValue());
    };

    WriterImpl.compareDatatype = function (a, b) {
        return WriterImpl.compareString(a.getDatatype().getReference(),
            b.getDatatype().getReference());
    };

    WriterImpl.compareType = function (a, b) {
        return WriterImpl.compareTopic(a.getType(), b.getType());
    };

    /**
     * Canonical sort order:
     * 1. [player]
     * 2. [type]
     * 3. [parent]
     */
    WriterImpl.compareRole = function (a, b) {
        if (a.equals(b)) {
            return 0;
        }
        return WriterImpl.comparePlayer(a, b) ||
            WriterImpl.compareType(a, b);
    };

    WriterImpl.comparePlayer = function (a, b) {
        return WriterImpl.compareTopic(a.getPlayer(), b.getPlayer());
    };

    WriterImpl.compareRoles = function (a, b) {
        var la, lb, sa, sb, ret, arrA = [], arrB = [], i;
        sa = a.getRoles();
        sb = b.getRoles();
        la = sa.length;
        lb = sb.length;
        ret = la - lb;
        if (ret === 0) {
            for (i=0; i<la; i+=1) {
                arrA.push(sa[i]);
                arrB.push(sb[i]);
            }
            arrA.sort(WriterImpl.compareRole);
            arrB.sort(WriterImpl.compareRole);
            for (i=0; i<la && ret === 0; i+=1) {
                ret = WriterImpl.compareRole(arrA[i], arrB[i]);
            }
        }
        return ret;
    };

    WriterImpl.compareScope = function (a, b) {
        var la, lb, sa, sb, ret, arrA = [], arrB = [], i;
        sa = a.getScope();
        sb = b.getScope();
        la = sa.length;
        lb = sb.length;
        ret = la - lb;
        if (ret === 0) {
            for (i=0; i<la; i+=1) {
                arrA.push(sa[i]);
                arrB.push(sb[i]);
            }
            arrA.sort(WriterImpl.compareTopic);
            arrB.sort(WriterImpl.compareTopic);
            for (i=0; i<la && ret === 0; i+=1) {
                ret = WriterImpl.compareTopic(arrA[i], arrB[i]);
            }
        }
        return ret;
    };

    WriterImpl.compareIdentifiers = function (a, b) {
        var la = a.length, lb = b.length, ret, arrA = [], arrB = [], i;
        ret = la - lb;
        if (ret === 0) {
            for (i=0; i<a.length; i+=1) {
                arrA.push(a[i].getReference()); // TODO normalize identifier
                arrB.push(b[i].getReference()); // TODO normalize identifier
            }
            arrA.sort();
            arrB.sort();
            for (i=0; i<a.length && ret === 0; i+=1) {
                ret = WriterImpl.compareString(arrA[i], arrB[i]);
            }
        }
        return ret;
    };

    WriterImpl.compareString = function (a, b) {
        if (a === b) {
            return 0;
        }
        return (a < b) ? -1 : 1; // TODO: Check
    };

    return {
        Writer: WriterImpl
    };
}());

