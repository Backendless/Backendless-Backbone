(function() {

  var testSchemaName = 'testSchema';

  QUnit.module('Backbone.Collection', {

    afterEach: function(assert) {
      $.mockjax.clear();
    }

  });

  QUnit.test('on create without schemaName in options', function(assert) {
    var collection = new Backbone.Collection(null, {});

    assert.equal(collection.schemaName, undefined);
  });

  QUnit.test('on create should get schemaName from options', function(assert) {
    var collection = new Backbone.Collection(null, {schemaName: testSchemaName});

    assert.equal(collection.schemaName, testSchemaName);
  });

  QUnit.test('on create should get schemaName from model instance', function(assert) {
    var model = new Backbone.Model(null, {schemaName: testSchemaName});
    var collection = new Backbone.Collection([model]);

    assert.equal(collection.schemaName, testSchemaName);
  });

  QUnit.test('on create should get schemaName from model attrs', function(assert) {
    var modelAttrs = {___class: testSchemaName, prop: 'value'};
    var collection = new Backbone.Collection([modelAttrs]);

    assert.equal(collection.schemaName, testSchemaName);
  });

  QUnit.test('should have correct url', function(assert) {
    var collection = new Backbone.Collection(null, {schemaName: testSchemaName});

    assert.equal(_.result(collection, 'url'), this.BASE_DATA_URL + testSchemaName);
  });

  QUnit.test('get url params', function(assert) {
    var collection = new Backbone.Collection(null, {schemaName: testSchemaName});

    collection.properties = 'properties';
    collection.relations = ['relations1', 'relations2'];
    collection.relationsDepth = function() {return 10;};
    collection.sortingBy = null;
    collection.condition = 'condition';
    collection.offsetItems = 5;
    collection.itemsPerPage = 30;

    assert.deepEqual(collection.getUrlParams(), {
      loadRelations : [
        'relations1',
        'relations2'
      ],
      props         : 'properties',
      relationsDepth: 10,
      where         : 'condition',
      offset        : 5,
      pageSize      : 30
    });

    var params = collection.getUrlParams({
      relations     : '1234',
      sortingBy     : ['sort1', 'sort2'],
      relationsDepth: 0,
      offsetItems   : 100,
      itemsPerPage  : 100,
      myProp        : 'test'
    });

    assert.deepEqual(params, {
      loadRelations : '1234',
      props         : 'properties',
      where         : 'condition',
      offset        : 100,
      pageSize      : 100,
      relationsDepth: 0,
      'sortBy'      : [
        'sort1',
        'sort2'
      ]
    });
  });

  QUnit.test('describe schema', function(assert) {
    assert.expect(10);

    var env = this;
    var done = assert.async();
    var done2 = assert.async();
    var collection = new Backbone.Collection(null, {schemaName: testSchemaName});

    var schema = [
      {name: 'owner', required: false, type: 'RELATION'},
      {name: 'updated', required: false, type: 'DATETIME'},
      {name: 'created', required: false, type: 'DATETIME'}
    ];

    $.mockjax(function(requestSettings) {
      assert.equal(requestSettings.headers['application-type'], env.APPLICATION_TYPE);
      assert.equal(requestSettings.headers['application-id'], env.APPLICATION_ID);
      assert.equal(requestSettings.headers['secret-key'], env.APP_SECRET_KEY);
      assert.equal(requestSettings.headers['user-token'], env.USER_TOKEN);

      return {
        url         : env.BASE_DATA_URL + testSchemaName + '/properties',
        responseTime: env.MOCK_RESPONSE_TIME,
        responseText: schema
      };
    });

    this.loginUser();

    collection.describe({
      success: function() {
        assert.deepEqual(collection.schema, schema);
        done();
      }
    });

    collection.describe().done(function() {
      assert.deepEqual(collection.schema, schema);
      done2();
    });

    this.logoutUser();
  });

  QUnit.test('get model', function(assert) {
    var collection = new Backbone.Collection([{objectId: 'id1'}, {objectId: 'id2'}, {objectId: 'id3'}], {schemaName: testSchemaName});

    assert.deepEqual(collection.get('id2').toJSON(), {___class: testSchemaName, objectId: 'id2'});
    assert.equal(collection.at(1), collection.get('id2'));
    assert.equal(collection.at(2), collection.get(collection.at(2)));
    assert.equal(collection.at(0), collection.get({objectId: 'id1'}));
  });

  QUnit.test('parse response', function(assert) {
    var env = this;
    var done = assert.async();
    var collection = new Backbone.Collection(null, {schemaName: testSchemaName});

    this.loginUser();

    assert.expect(8);

    $.mockjax(function(requestSettings) {
      assert.equal(requestSettings.headers['application-type'], env.APPLICATION_TYPE);
      assert.equal(requestSettings.headers['application-id'], env.APPLICATION_ID);
      assert.equal(requestSettings.headers['secret-key'], env.APP_SECRET_KEY);
      assert.equal(requestSettings.headers['user-token'], env.USER_TOKEN);

      return {
        url         : env.BASE_DATA_URL + testSchemaName + '?offset=0&pageSize=10',
        responseTime: env.MOCK_RESPONSE_TIME,
        responseText: {
          offset      : 0,
          totalObjects: 200,
          data        : [
            {___class: testSchemaName, objectId: 'id1'},
            {___class: testSchemaName, objectId: 'id2'},
            {___class: testSchemaName, objectId: 'id3'},
            {___class: testSchemaName, objectId: 'id4'},
            {___class: testSchemaName, objectId: 'id5'},
            {___class: testSchemaName, objectId: 'id6'},
            {___class: testSchemaName, objectId: 'id7'},
            {___class: testSchemaName, objectId: 'id8'},
            {___class: testSchemaName, objectId: 'id9'},
            {___class: testSchemaName, objectId: 'id10'}
          ]
        }
      };
    });

    collection.on('sync', function() {
      assert.equal(collection.length, 10);
      assert.equal(collection.totalItems, 200);
      assert.equal(collection.totalObjects, undefined);

      assert.deepEqual(collection.toJSON(), [
        {___class: testSchemaName, objectId: 'id1'},
        {___class: testSchemaName, objectId: 'id2'},
        {___class: testSchemaName, objectId: 'id3'},
        {___class: testSchemaName, objectId: 'id4'},
        {___class: testSchemaName, objectId: 'id5'},
        {___class: testSchemaName, objectId: 'id6'},
        {___class: testSchemaName, objectId: 'id7'},
        {___class: testSchemaName, objectId: 'id8'},
        {___class: testSchemaName, objectId: 'id9'},
        {___class: testSchemaName, objectId: 'id10'}
      ]);

      done();
    });

    collection.fetch();

    this.logoutUser();
  });

  QUnit.test('fetch items when the instance has query params as functions', function(assert) {
    var done = assert.async();
    var Collection = Backbone.Collection.extend({
      schemaName    : testSchemaName,
      offsetItems   : function() {
        return 20;
      },
      itemsPerPage  : function() {
        return 50;
      },
      properties    : function() {
        return 'my-properties';
      },
      relations     : function() {
        return 'my-relations';
      },
      relationsDepth: function() {
        return 'my-relationsDepth';
      },
      sortingBy     : function() {
        return 'my-sortingBy';
      },
      condition     : function() {
        return 'my-condition';
      }
    });

    var collection = new Collection();

    assert.expect(1);

    $.mockjax({
      url         : this.BASE_DATA_URL + testSchemaName + '?' +
      'offset=20' +
      '&pageSize=50' +
      '&props=my-properties' +
      '&loadRelations=my-relations' +
      '&relationsDepth=my-relationsDepth' +
      '&sortBy=my-sortingBy' +
      '&where=my-condition',
      responseTime: this.MOCK_RESPONSE_TIME,
      response    : function() {
        this.responseText = {
          offset      : 20,
          totalObjects: 250,
          data        : [
            {objectId: 'id1'},
            {objectId: 'id2'}
          ]
        };
      }
    });

    collection.fetch({
      success: function() {
        assert.deepEqual(collection.toJSON(), [
          {___class: testSchemaName, objectId: 'id1'},
          {___class: testSchemaName, objectId: 'id2'}
        ]);

        done();
      }
    });

  });

  QUnit.test('fetch items when the instance has query params as plain data', function(assert) {
    var done = assert.async();
    var Collection = Backbone.Collection.extend({
      schemaName    : testSchemaName,
      offsetItems   : 20,
      itemsPerPage  : 50,
      properties    : 'my-properties',
      relations     : ['my-relations', 'my-second-relations'],
      relationsDepth: 123,
      sortingBy     : ['prop asc', 'prop2 desc'],
      condition     : 'Prop(test >= 20)'
    });

    var collection = new Collection();

    assert.expect(1);

    $.mockjax({
      url         : this.BASE_DATA_URL + testSchemaName + '?' +
      'offset=20' +
      '&pageSize=50' +
      '&props=my-properties' +
      '&loadRelations=my-relations,my-second-relations' +
      '&relationsDepth=123' +
      '&sortBy=prop%20asc,prop2%20desc' +
      '&where=Prop(test%20%3E=%2020)',
      responseTime: this.MOCK_RESPONSE_TIME,
      response    : function() {
        this.responseText = {
          offset      : 20,
          totalObjects: 250,
          data        : [
            {objectId: 'id1'},
            {objectId: 'id2'}
          ]
        };
      }
    });

    collection.fetch({
      success: function() {
        assert.deepEqual(collection.toJSON(), [
          {___class: testSchemaName, objectId: 'id1'},
          {___class: testSchemaName, objectId: 'id2'}
        ]);

        done();
      }
    });

  });

  QUnit.test('fetch item with query params in options', function(assert) {
    var done = assert.async();
    var Collection = Backbone.Collection.extend({
      offsetItems   : 20,
      itemsPerPage  : 50,
      schemaName    : testSchemaName,
      properties    : 'my-properties',
      relations     : ['my-relations', 'my-second-relations'],
      relationsDepth: 123,
      sortingBy     : ['prop asc', 'prop2 desc'],
      condition     : 'Prop(test >= 20)'
    });

    var collection = new Collection();

    assert.expect(1);

    $.mockjax({
      url         : this.BASE_DATA_URL + testSchemaName + '?' +
      'offset=120' +
      '&pageSize=150' +
      '&props=override-properties' +
      '&loadRelations=override-relations,override-second-relations' +
      '&relationsDepth=0' +
      '&sortBy=override-prop%20asc,override-prop2%20desc' +
      '&where=override-Prop(test%20%3E=%2020)',
      responseTime: this.MOCK_RESPONSE_TIME,
      response    : function() {
        this.responseText = {
          offset      : 20,
          totalObjects: 250,
          data        : [
            {objectId: 'id1'},
            {objectId: 'id2'}
          ]
        };
      }
    });

    collection.fetch({
      offsetItems   : 120,
      itemsPerPage  : 150,
      properties    : 'override-properties',
      relations     : ['override-relations', 'override-second-relations'],
      relationsDepth: 0,
      sortingBy     : ['override-prop asc', 'override-prop2 desc'],
      condition     : 'override-Prop(test >= 20)',

      success: function() {
        assert.deepEqual(collection.toJSON(), [
          {___class: testSchemaName, objectId: 'id1'},
          {___class: testSchemaName, objectId: 'id2'}
        ]);

        done();
      }
    });

  });

  QUnit.test('reset query params on fetch', function(assert) {
    var done = assert.async();
    var Collection = Backbone.Collection.extend({
      offsetItems   : 120,
      itemsPerPage  : 150,
      schemaName    : testSchemaName,
      properties    : 'my-properties',
      relations     : ['my-relations', 'my-second-relations'],
      relationsDepth: 123,
      sortingBy     : ['prop asc', 'prop2 desc'],
      condition     : 'Prop(test >= 20)'
    });

    var collection = new Collection();

    assert.expect(1);

    $.mockjax({
      url         : this.BASE_DATA_URL + testSchemaName,
      responseTime: this.MOCK_RESPONSE_TIME,
      response    : function() {
        this.responseText = {
          offset      : 0,
          totalObjects: 250,
          data        : [
            {objectId: 'id1'},
            {objectId: 'id2'}
          ]
        };
      }
    });

    collection.fetch({
      offsetItems   : null,
      itemsPerPage  : null,
      properties    : null,
      relations     : null,
      relationsDepth: null,
      sortingBy     : null,
      condition     : null,

      success: function() {
        assert.deepEqual(collection.toJSON(), [
          {___class: testSchemaName, objectId: 'id1'},
          {___class: testSchemaName, objectId: 'id2'}
        ]);

        done();
      }
    });

  });

  QUnit.test('on fetch reset offsetItems and totalItems props', function(assert) {
    var done = assert.async();
    var Collection = Backbone.Collection.extend({
      schemaName : testSchemaName,
      offsetItems: 120,
      totalItems : 200
    });

    var collection = new Collection();

    assert.expect(5);
    assert.equal(collection.offsetItems, 120);
    assert.equal(collection.totalItems, 200);

    $.mockjax({
      url         : this.BASE_DATA_URL + testSchemaName + '?offset=120&pageSize=10',
      responseTime: this.MOCK_RESPONSE_TIME,
      response    : function() {
        this.responseText = {
          offset      : 1,
          totalObjects: 20,
          data        : [
            {objectId: 'id1'},
            {objectId: 'id2'}
          ]
        };
      }
    });

    collection.fetch().done(function() {
      assert.equal(collection.offsetItems, 1);
      assert.equal(collection.totalItems, 20);
      assert.equal(collection.length, 2);

      done();
    });

  });

  QUnit.test('create new model', function(assert) {
    var done = assert.async();
    var collection = new Backbone.Collection(null, {schemaName: testSchemaName});
    var model;

    assert.expect(5);

    $.mockjax({
      url         : this.BASE_DATA_URL + testSchemaName,
      type        : 'POST',
      responseTime: this.MOCK_RESPONSE_TIME,
      response    : function() {
        this.responseText = {___class: testSchemaName, objectId: 'myId', name: 'myName'};
      }
    });

    collection.on('sync', function() {

      assert.equal(collection.length, 1);
      assert.deepEqual(collection.toJSON(), [{___class: testSchemaName, objectId: 'myId', name: 'myName'}]);
      assert.ok(model instanceof Backbone.Model);
      assert.equal(model.schemaName, testSchemaName);
      assert.equal(model.id, 'myId');

      done();
    });

    model = collection.create({name: 'myName'});

  });

  QUnit.test('extend method', function(assert) {
    var Collection1 = Backbone.Collection.extend({
      schemaName    : testSchemaName,
      totalItems    : 'totalItems1',
      itemsPerPage  : 'itemsPerPage1',
      properties    : 'properties1',
      relations     : 'relations1',
      relationsDepth: 'relationsDepth1',
      sortingBy     : 'sortingBy1',
      condition     : 'condition1',
      offsetItems   : 'offsetItems1',
      prop          : 'prop1',
      method        : function() {
        assert.ok('first');
      }
    });

    var Collection2 = Collection1.extend({
      schemaName    : 'secondSchemaName',
      totalItems    : 'totalItems2',
      itemsPerPage  : 'itemsPerPage2',
      properties    : 'properties2',
      relations     : 'relations2',
      relationsDepth: 'relationsDepth2',
      sortingBy     : 'sortingBy2',
      condition     : 'condition2',
      offsetItems   : 'offsetItems2',
      prop          : 'prop2',
      method        : function() {
        assert.ok('second');

        Collection1.prototype.method.call(this);
      }
    });

    var col1 = new Collection1();
    var col2 = new Collection2();

    assert.expect(23);
    assert.equal(col1.schemaName, testSchemaName);
    assert.equal(col1.totalItems, 'totalItems1');
    assert.equal(col1.itemsPerPage, 'itemsPerPage1');
    assert.equal(col1.properties, 'properties1');
    assert.equal(col1.relations, 'relations1');
    assert.equal(col1.relationsDepth, 'relationsDepth1');
    assert.equal(col1.sortingBy, 'sortingBy1');
    assert.equal(col1.condition, 'condition1');
    assert.equal(col1.offsetItems, 'offsetItems1');
    assert.equal(col1.prop, 'prop1');

    assert.equal(col2.schemaName, 'secondSchemaName');
    assert.equal(col2.totalItems, 'totalItems2');
    assert.equal(col2.itemsPerPage, 'itemsPerPage2');
    assert.equal(col2.properties, 'properties2');
    assert.equal(col2.relations, 'relations2');
    assert.equal(col2.relationsDepth, 'relationsDepth2');
    assert.equal(col2.sortingBy, 'sortingBy2');
    assert.equal(col2.condition, 'condition2');
    assert.equal(col2.offsetItems, 'offsetItems2');
    assert.equal(col2.prop, 'prop2');

    col1.method();
    col2.method();
  });

})();