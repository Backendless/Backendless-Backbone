(function() {

  var testSchemaName = 'testSchema';

  QUnit.module('Backbone.Model', {

    afterEach: function(assert) {
      $.mockjax.clear();
    }

  });

  QUnit.test('on create should get schemaName from options', function(assert) {
    var model = new Backbone.Model(null, {schemaName: testSchemaName});

    assert.equal(model.schemaName, testSchemaName);
    assert.equal(model.idAttribute, this.ID_ATTR);
    assert.equal(model.get(this.CLASS_KEY), testSchemaName);
  });

  QUnit.test('on create should get schemaName from collection', function(assert) {
    var collection = new Backbone.Collection(null, {schemaName: testSchemaName});
    var model = new Backbone.Model(null, {collection: collection});

    assert.equal(model.schemaName, testSchemaName);
    assert.equal(model.idAttribute, this.ID_ATTR);
    assert.equal(model.get(this.CLASS_KEY), testSchemaName);
  });

  QUnit.test('on create should get schemaName from attr', function(assert) {
    var attrs = {prop: 'value'};
    attrs[this.CLASS_KEY] = testSchemaName;
    var model = new Backbone.Model(attrs);

    assert.equal(model.schemaName, testSchemaName);
    assert.equal(model.idAttribute, this.ID_ATTR);
    assert.equal(model.get(this.CLASS_KEY), testSchemaName);
    assert.equal(model.get('prop'), 'value');
  });

  QUnit.test('should have correct url', function(assert) {
    var model1 = new Backbone.Model(null, {schemaName: testSchemaName});
    var model2 = new Backbone.Model({objectId: 'my-id'}, {schemaName: testSchemaName});

    assert.equal(_.result(model1, 'url'), this.BASE_DATA_URL + testSchemaName);
    assert.equal(_.result(model2, 'url'), this.BASE_DATA_URL + testSchemaName + '/my-id');
  });

  QUnit.test('get url params', function(assert) {
    var model = new Backbone.Model(null, {schemaName: testSchemaName});
    model.properties = 'properties';
    model.relations = ['relations1', 'relations2'];
    model.relationsDepth = function() {return 10;};
    model.sortingBy = null;
    model.condition = 'condition';
    model.mytest = 'mytest';

    assert.deepEqual(model.getUrlParams(), {
      loadRelations : [
        'relations1',
        'relations2'
      ],
      props         : 'properties',
      relationsDepth: 10,
      where         : 'condition'
    });

    assert.deepEqual(model.getUrlParams({relations: '1234', sortingBy: ['sort1', 'sort2'], relationsDepth: 0, myProp: 'test'}), {
      loadRelations : '1234',
      props         : 'properties',
      where         : 'condition',
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
    var model = new Backbone.Model(null, {schemaName: testSchemaName});

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

    model.describe({
      success: function() {
        assert.deepEqual(model.schema, schema);
        done();
      }
    });

    model.describe().done(function() {
      assert.deepEqual(model.schema, schema);
      done2();
    });

    this.logoutUser();
  });

  QUnit.test('set complex object and value should not cloned', function(assert) {
    var data = {test: {foo: 'foo', array: [1, 2, 3]}, num: 3};
    var data2 = {test: {foo: 'foo2', array: [{test: 1}], flag: {value: true}}, num: 10};
    var model = new Backbone.Model(null, {schemaName: testSchemaName});

    model.set(data);
    assert.equal(model.get('test').array, data.test.array);
    assert.equal(model.get('test'), data.test);
    assert.equal(model.get('num'), data.num);

    model.set(data2);
    assert.equal(model.get('test'), data2.test);
    assert.equal(model.get('num'), data2.num);
  });

  QUnit.test('set complex objects and transform them to instance of Backbone.Collection', function(assert) {
    var item1 = {name: 'Jim'};
    var item2 = {name: 'Bob'};
    var item3 = {name: 'Jack'};

    item1[this.CLASS_KEY] = 'myColl';

    var model = new Backbone.Model({items: [item1, item2]}, {schemaName: testSchemaName});

    assert.ok(model.get('items') instanceof Backbone.Collection);
    assert.equal(model.get('items').schemaName, 'myColl');
    assert.deepEqual(model.toJSON(), {
      ___class: testSchemaName,
      items   : [
        {
          ___class: 'myColl',
          name    : 'Jim'
        },
        {
          ___class: 'myColl',
          name    : 'Bob'
        }
      ]
    });

    var Model = Backbone.Model.extend({schemaName: testSchemaName, schemaTypes: {items: 'MyItems'}});
    var model2 = new Model({items: [item3, item2]});

    assert.ok(model2.get('items') instanceof Backbone.Collection);
    assert.equal(model2.get('items').schemaName, 'MyItems');
    assert.deepEqual(model2.toJSON(), {
      ___class: testSchemaName,
      items   : [
        {
          ___class: 'MyItems',
          name    : 'Jack'
        },
        {
          ___class: 'MyItems',
          name    : 'Bob'
        }
      ]
    });
  });

  QUnit.test('set complex objects in deep level and transform them to instance of Backbone.Collection', function(assert) {
    var item1 = {name: 'Jim'};
    var item2 = {name: 'Bob'};
    var item3 = {name: 'Jack'};

    item1[this.CLASS_KEY] = 'myItem';

    var model = new Backbone.Model({test: {foo: {items: [item1, item2]}}}, {schemaName: testSchemaName});

    assert.ok(model.get('test').foo.items instanceof Backbone.Collection);
    assert.equal(model.get('test').foo.items.schemaName, 'myItem');
    assert.deepEqual(model.toJSON(), {
      ___class: testSchemaName,
      test    : {
        foo: {
          items: [
            {
              ___class: 'myItem',
              name    : 'Jim'
            },
            {
              ___class: 'myItem',
              name    : 'Bob'
            }
          ]
        }
      }
    });

    var Model2 = Backbone.Model.extend({schemaName: testSchemaName, schemaTypes: {items: 'MySecondItem'}});
    var model2 = new Model2({test: {foo: {items: [item2, item3]}}});

    assert.ok(model2.get('test').foo.items instanceof Backbone.Collection);
    assert.equal(model2.get('test').foo.items.schemaName, 'MySecondItem');
    assert.deepEqual(model2.toJSON(), {
      ___class: testSchemaName,
      test    : {
        foo: {
          items: [{
            ___class: 'MySecondItem',
            name    : 'Bob'
          }, {
            ___class: 'MySecondItem',
            name    : 'Jack'
          }]
        }
      }
    });
  });

  QUnit.test('set complex objects and transform them to instance of Backbone.Model', function(assert) {
    var item1 = {name: 'Jim'};
    var item2 = {name: 'Bob'};

    item1[this.CLASS_KEY] = 'myItem';

    var model = new Backbone.Model({item: item1}, {schemaName: testSchemaName});

    assert.ok(model.get('item') instanceof Backbone.Model);
    assert.equal(model.get('item').schemaName, 'myItem');
    assert.deepEqual(model.toJSON(), {
      ___class: testSchemaName,
      item    : {
        ___class: 'myItem',
        name    : 'Jim'
      }
    });

    var Model2 = Backbone.Model.extend({schemaName: testSchemaName, schemaTypes: {item: 'MySecondItem'}});
    var model2 = new Model2({item: item2});

    assert.ok(model2.get('item') instanceof Backbone.Model);
    assert.equal(model2.get('item').schemaName, 'MySecondItem');
    assert.deepEqual(model2.toJSON(), {
      ___class: testSchemaName,
      item    : {
        ___class: 'MySecondItem',
        name    : 'Bob'
      }
    });
  });

  QUnit.test('set complex objects in deep level and transform them to instance of Backbone.Model', function(assert) {
    var item1 = {name: 'Jim'};
    var item2 = {name: 'Bob'};

    item1[this.CLASS_KEY] = 'myItem';

    var model = new Backbone.Model({test: {foo: {item: item1}}}, {schemaName: testSchemaName});

    assert.ok(model.get('test').foo.item instanceof Backbone.Model);
    assert.equal(model.get('test').foo.item.schemaName, 'myItem');
    assert.deepEqual(model.toJSON(), {
      ___class: testSchemaName,
      test    : {
        foo: {
          item: {
            ___class: 'myItem',
            name    : 'Jim'
          }
        }
      }
    });

    var Model2 = Backbone.Model.extend({schemaName: testSchemaName, schemaTypes: {item: 'MySecondItem'}});
    var model2 = new Model2({test: {foo: {item: item2}}});

    assert.ok(model2.get('test').foo.item instanceof Backbone.Model);
    assert.equal(model2.get('test').foo.item.schemaName, 'MySecondItem');
    assert.deepEqual(model2.toJSON(), {
      ___class: testSchemaName,
      test    : {
        foo: {
          item: {
            ___class: 'MySecondItem',
            name    : 'Bob'
          }
        }
      }
    });
  });

  QUnit.test('nested instances of Backbone.Model should fire events to above', function(assert) {
    assert.expect(3);

    var done = assert.async();
    var done2 = assert.async();
    var done3 = assert.async();

    var model = new Backbone.Model({test: {foo: {item: {objectId: 'id', name: 'Jim'}}}}, {schemaName: testSchemaName, schemaTypes: {item: 'MySecondItem'}});
    model.on('item.change', function(itemModel) {
      assert.equal(itemModel, model.get('test').foo.item);
      done();
    });
    model.on('item.change:num', function(itemModel) {
      assert.equal(itemModel, model.get('test').foo.item);
      done2();
    });
    model.on('item.custom-event', function(itemModel) {
      assert.equal(itemModel, model.get('test').foo.item);
      done3();
    });

    model.get('test').foo.item.set({num: 123});
    model.get('test').foo.item.trigger('custom-event', model.get('test').foo.item);

  });

  QUnit.test('nested instances of Backbone.Collection should fire events to above', function(assert) {
    assert.expect(5);

    var done = assert.async();
    var done2 = assert.async();
    var done3 = assert.async();
    var done4 = assert.async();
    var done5 = assert.async();

    var model = new Backbone.Model({items: [{objectId: 'id', name: 'Jim'}]}, {schemaName: testSchemaName, schemaTypes: {items: 'MyItems'}});
    var items = model.get('items');

    model.on('items.change', function(itemModel) {
      assert.equal(itemModel, items.at(0));
      done();
    });
    model.on('items.change:num', function(itemModel) {
      assert.equal(itemModel, items.at(0));
      done2();
    });
    model.on('items.add', function(itemModel) {
      assert.equal(itemModel, items.at(1));
      done3();
    });
    model.on('items.remove', function(itemModel) {
      assert.deepEqual(itemModel.toJSON(), {___class: 'MyItems', name: 'Bob'});
      done4();
    });
    model.on('items.custom-event', function(itemsCollection) {
      assert.equal(itemsCollection, items);
      done5();
    });

    items.at(0).set({num: 123});
    items.add({name: 'Bob'});
    items.remove(items.at(1));
    items.trigger('custom-event', items);
  });

  QUnit.test('after fetch should transform nested items which have ___class', function(assert) {
    var env = this;
    var model = new Backbone.Model({objectId: 'my-id'}, {schemaName: testSchemaName});
    var item;
    var done = assert.async();
    var done2 = assert.async();

    assert.expect(9);

    this.loginUser();

    var mockjaxId = $.mockjax(function(requestSettings) {
      assert.equal(requestSettings.headers['application-type'], env.APPLICATION_TYPE);
      assert.equal(requestSettings.headers['application-id'], env.APPLICATION_ID);
      assert.equal(requestSettings.headers['secret-key'], env.APP_SECRET_KEY);
      assert.equal(requestSettings.headers['user-token'], env.USER_TOKEN);

      return {
        url         : env.BASE_DATA_URL + testSchemaName + '/my-id',
        responseTime: env.MOCK_RESPONSE_TIME,
        responseText: {objectId: 'id', name: 'Jim', item: {___class: 'nestedItem', age: 30}}
      };
    });

    model.fetch().done(function() {
      item = model.get('item');
      assert.ok(model.get('item') instanceof Backbone.Model);
      assert.deepEqual(model.get('item').toJSON(), {___class: 'nestedItem', age: 30});
      done();
    });

    $.mockjax.clear(mockjaxId);

    $.mockjax({
      url         : env.BASE_DATA_URL + testSchemaName + '/my-id',
      responseTime: env.MOCK_RESPONSE_TIME,
      responseText: {objectId: 'id', name: 'Bob', item: {___class: 'nestedItem', age: 40}}
    });

    model.fetch().done(function() {
      assert.equal(item, model.get('item'));
      assert.ok(model.get('item') instanceof Backbone.Model);
      assert.deepEqual(model.get('item').toJSON(), {___class: 'nestedItem', age: 40});
      done2();
    });

    this.logoutUser();
  });

  QUnit.test('should transform nested items after fetch parent', function(assert) {
    var env = this;
    var model = new Backbone.Model({item: {objectId: 'id', name: 'Jim'}}, {schemaName: testSchemaName, schemaTypes: {item: 'MySecondItem'}});
    var item = model.get('item');
    var done = assert.async();

    assert.expect(8);
    assert.ok(item instanceof Backbone.Model);

    this.loginUser();

    $.mockjax(function(requestSettings) {
      assert.equal(requestSettings.headers['application-type'], env.APPLICATION_TYPE);
      assert.equal(requestSettings.headers['application-id'], env.APPLICATION_ID);
      assert.equal(requestSettings.headers['secret-key'], env.APP_SECRET_KEY);
      assert.equal(requestSettings.headers['user-token'], env.USER_TOKEN);

      return {
        url         : env.BASE_DATA_URL + testSchemaName + '/id',
        responseTime: env.MOCK_RESPONSE_TIME,
        responseText: {objectId: 'id', name: 'Jim', age: 30}
      };
    });

    model.get('item').on('sync', function() {
      assert.equal(item, model.get('item'));
      assert.ok(item instanceof Backbone.Model);
      assert.deepEqual(model.get('item').toJSON(), {
        ___class: 'MySecondItem',
        age     : 30,
        name    : 'Jim',
        objectId: 'id'
      });

      done();
    });

    model.get('item').fetch();

    this.logoutUser();
  });

  QUnit.test('find item by id', function(assert) {
    var model = new Backbone.Model(null, {schemaName: testSchemaName});
    var done = assert.async();

    assert.expect(1);

    $.mockjax({
      url         : this.BASE_DATA_URL + testSchemaName + '/my-id',
      responseTime: this.MOCK_RESPONSE_TIME,
      response    : function() {
        this.responseText = {objectId: 'my-id', name: 'Jim', age: 30, nested: {___class: 'nested', name: 'test'}};
      }
    });

    model.fetch({
      id     : 'my-id',
      success: function() {
        assert.deepEqual(model.toJSON(), {
          ___class: testSchemaName,
          age     : 30,
          name    : 'Jim',
          nested  : {
            ___class: 'nested',
            name    : 'test'
          },
          objectId: 'my-id'
        });

        done();
      }
    });
  });

  QUnit.test('find item by id should override current id after result', function(assert) {
    var model = new Backbone.Model({objectId: 'current-id'}, {schemaName: testSchemaName});
    var done = assert.async();

    assert.expect(2);

    $.mockjax({
      url         : this.BASE_DATA_URL + testSchemaName + '/my-new-id',
      responseTime: this.MOCK_RESPONSE_TIME,
      response    : function() {
        this.responseText = {objectId: 'my-new-id', name: 'Jim', age: 30, nested: {___class: 'nested', name: 'test'}};
      }
    });

    model.fetch({
      id     : 'my-new-id',
      success: function() {
        assert.equal(model.id, 'my-new-id');
        assert.deepEqual(model.toJSON(), {
          ___class: testSchemaName,
          age     : 30,
          name    : 'Jim',
          nested  : {
            ___class: 'nested',
            name    : 'test'
          },
          objectId: 'my-new-id'
        });

        done();
      }
    });
  });

  QUnit.test('find the first item', function(assert) {
    var model = new Backbone.Model(null, {schemaName: testSchemaName});
    var done = assert.async();

    assert.expect(1);

    $.mockjax({
      url         : this.BASE_DATA_URL + testSchemaName + '/first',
      responseTime: this.MOCK_RESPONSE_TIME,
      response    : function() {
        this.responseText = {objectId: 'my-id', name: 'Jim', age: 30, nested: {___class: 'nested', name: 'test'}};
      }
    });

    model.fetch({
      success: function() {
        assert.deepEqual(model.toJSON(), {
          ___class: testSchemaName,
          age     : 30,
          name    : 'Jim',
          nested  : {
            ___class: 'nested',
            name    : 'test'
          },
          objectId: 'my-id'
        });

        done();
      }
    });
  });

  QUnit.test('find the last item', function(assert) {
    var model = new Backbone.Model(null, {schemaName: testSchemaName});
    var done = assert.async();

    assert.expect(1);

    $.mockjax({
      url         : this.BASE_DATA_URL + testSchemaName + '/last',
      responseTime: this.MOCK_RESPONSE_TIME,
      response    : function() {
        this.responseText = {objectId: 'my-id', name: 'Jim', age: 30, nested: {___class: 'nested', name: 'test'}};
      }
    });

    model.fetch({
      isLast : true,
      success: function() {
        assert.deepEqual(model.toJSON(), {
          ___class: testSchemaName,
          age     : 30,
          name    : 'Jim',
          nested  : {
            ___class: 'nested',
            name    : 'test'
          },
          objectId: 'my-id'
        });

        done();
      }
    });
  });

  QUnit.test('find item when passed id and isLast', function(assert) {
    var model = new Backbone.Model(null, {schemaName: testSchemaName});
    var done = assert.async();

    assert.expect(1);

    $.mockjax({
      url         : this.BASE_DATA_URL + testSchemaName + '/my-id',
      responseTime: this.MOCK_RESPONSE_TIME,
      response    : function() {
        this.responseText = {objectId: 'my-id', name: 'Nick'};
      }
    });

    model.fetch({
      id     : 'my-id',
      isLast : true,
      success: function() {
        assert.deepEqual(model.toJSON(), {
          ___class: testSchemaName,
          name    : 'Nick',
          objectId: 'my-id'
        });

        done();
      }
    });
  });

  QUnit.test('fetch item when the instance has query params as functions', function(assert) {
    var done = assert.async();
    var Model = Backbone.Model.extend({
      schemaName    : testSchemaName,
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

    var model = new Model();

    assert.expect(1);

    $.mockjax({
      url         : this.BASE_DATA_URL + testSchemaName + '/first?' +
      'props=my-properties' +
      '&loadRelations=my-relations' +
      '&relationsDepth=my-relationsDepth' +
      '&sortBy=my-sortingBy' +
      '&where=my-condition',
      responseTime: this.MOCK_RESPONSE_TIME,
      response    : function() {
        this.responseText = {objectId: 'my-id', name: 'Jim'};
      }
    });

    model.fetch({
      success: function() {
        assert.deepEqual(model.toJSON(), {
          ___class: testSchemaName,
          name    : 'Jim',
          objectId: 'my-id'
        });

        done();
      }
    });

  });

  QUnit.test('fetch item when the instance has query params as plain data', function(assert) {
    var done = assert.async();
    var Model = Backbone.Model.extend({
      schemaName    : testSchemaName,
      properties    : 'my-properties',
      relations     : ['my-relations', 'my-second-relations'],
      relationsDepth: 123,
      sortingBy     : ['prop asc', 'prop2 desc'],
      condition     : 'Prop(test >= 20)'
    });

    var model = new Model();

    assert.expect(1);

    $.mockjax({
      url         : this.BASE_DATA_URL + testSchemaName + '/first?' +
      'props=my-properties' +
      '&loadRelations=my-relations,my-second-relations' +
      '&relationsDepth=123' +
      '&sortBy=prop%20asc,prop2%20desc' +
      '&where=Prop(test%20%3E=%2020)',
      responseTime: this.MOCK_RESPONSE_TIME,
      response    : function() {
        this.responseText = {objectId: 'my-id', name: 'Jim'};
      }
    });

    model.fetch({
      success: function() {
        assert.deepEqual(model.toJSON(), {
          ___class: testSchemaName,
          name    : 'Jim',
          objectId: 'my-id'
        });

        done();
      }
    });

  });

  QUnit.test('fetch item with query params in options', function(assert) {
    var done = assert.async();
    var Model = Backbone.Model.extend({
      schemaName    : testSchemaName,
      properties    : 'my-properties',
      relations     : ['my-relations', 'my-second-relations'],
      relationsDepth: 123,
      sortingBy     : ['prop asc', 'prop2 desc'],
      condition     : 'Prop(test >= 20)'
    });

    var model = new Model();

    assert.expect(1);

    $.mockjax({
      url         : this.BASE_DATA_URL + testSchemaName + '/first?' +
      'props=override-properties' +
      '&loadRelations=override-relations,override-second-relations' +
      '&relationsDepth=0' +
      '&sortBy=override-prop%20asc,override-prop2%20desc' +
      '&where=override-Prop(test%20%3E=%2020)',
      responseTime: this.MOCK_RESPONSE_TIME,
      response    : function() {
        this.responseText = {objectId: 'my-id', name: 'Jim'};
      }
    });

    model.fetch({
      properties    : 'override-properties',
      relations     : ['override-relations', 'override-second-relations'],
      relationsDepth: 0,
      sortingBy     : ['override-prop asc', 'override-prop2 desc'],
      condition     : 'override-Prop(test >= 20)',

      success: function() {
        assert.deepEqual(model.toJSON(), {
          ___class: testSchemaName,
          name    : 'Jim',
          objectId: 'my-id'
        });

        done();
      }
    });

  });

  QUnit.test('reset query params on fetch', function(assert) {
    var done = assert.async();
    var Model = Backbone.Model.extend({
      schemaName    : testSchemaName,
      properties    : 'my-properties',
      relations     : ['my-relations', 'my-second-relations'],
      relationsDepth: 123,
      sortingBy     : ['prop asc', 'prop2 desc'],
      condition     : 'Prop(test >= 20)'
    });

    var model = new Model();

    assert.expect(1);

    $.mockjax({
      url         : this.BASE_DATA_URL + testSchemaName+'/first',
      responseTime: this.MOCK_RESPONSE_TIME,
      response    : function() {
        this.responseText = {objectId: 'my-id', name: 'Jim'};
      }
    });

    model.fetch({
      properties    : null,
      relations     : null,
      relationsDepth: null,
      sortingBy     : null,
      condition     : null,

      success: function() {
        assert.deepEqual(model.toJSON(), {
          ___class: testSchemaName,
          name    : 'Jim',
          objectId: 'my-id'
        });

        done();
      }
    });

  });

  QUnit.test('after fetch should not create a new Backbone.Model instance for nested items', function(assert) {
    var env = this;
    var model = new Backbone.Model({objectId: 'id', item: {objectId: 'sub-id', name: 'Jim'}}, {schemaName: testSchemaName, schemaTypes: {item: 'MySecondItem'}});
    var item = model.get('item');
    var done = assert.async();

    assert.expect(8);
    assert.ok(item instanceof Backbone.Model);

    this.loginUser();

    $.mockjax(function(requestSettings) {
      assert.equal(requestSettings.headers['application-type'], env.APPLICATION_TYPE);
      assert.equal(requestSettings.headers['application-id'], env.APPLICATION_ID);
      assert.equal(requestSettings.headers['secret-key'], env.APP_SECRET_KEY);
      assert.equal(requestSettings.headers['user-token'], env.USER_TOKEN);

      return {
        url         : env.BASE_DATA_URL + testSchemaName + '/id',
        responseTime: this.MOCK_RESPONSE_TIME,
        responseText: {objectId: 'id', item: {objectId: 'sub-id', name: 'Jim', age: 30}}
      };
    });

    model.on('sync', function() {
      assert.equal(item, model.get('item'));
      assert.ok(model.get('item') instanceof Backbone.Model);
      assert.deepEqual(model.toJSON(), {
        ___class: testSchemaName,
        item    : {
          ___class: 'MySecondItem',
          name    : 'Jim',
          age     : 30,
          objectId: 'sub-id'
        },
        objectId: 'id'
      });

      done();
    });

    model.fetch();

    this.logoutUser();
  });

  QUnit.test('after fetch should remove missed and add new props for nested items', function(assert) {
    var model = new Backbone.Model({objectId: 'id', item: {objectId: 'sub-id', name: 'Jim'}}, {schemaName: testSchemaName, schemaTypes: {item: 'MySecondItem'}});
    var done = assert.async();

    assert.expect(1);

    $.mockjax({
      url         : this.BASE_DATA_URL + testSchemaName + '/id',
      responseTime: this.MOCK_RESPONSE_TIME,
      responseText: {objectId: 'id', item: {objectId: 'sub-id', name: 'Jim', flag: false}}
    });

    model.fetch().done(function() {
      assert.deepEqual(model.toJSON(), {
        ___class: testSchemaName,
        item    : {
          ___class: 'MySecondItem',
          name    : 'Jim',
          flag    : false,
          objectId: 'sub-id'
        },
        objectId: 'id'
      });

      done();
    });

  });

  QUnit.test('after fetch should create a new Backbone.Collection instance for nested items', function(assert) {
    var env = this;
    var model = new Backbone.Model({objectId: 'id'}, {schemaName: testSchemaName});
    var done = assert.async();

    assert.expect(2);

    $.mockjax({
      url         : env.BASE_DATA_URL + testSchemaName + '/id',
      responseTime: env.MOCK_RESPONSE_TIME,
      responseText: {
        objectId: 'id', items: [
          {___class: 'nested', name: '1'},
          {___class: 'nested', name: '2'},
          {___class: 'nested', name: '3'}
        ]
      }
    });

    model.fetch({
      success: function() {
        assert.ok(model.get('items') instanceof Backbone.Collection);
        assert.deepEqual(model.toJSON(), {
          ___class: testSchemaName,
          objectId: 'id',
          items   : [
            {___class: 'nested', name: '1'},
            {___class: 'nested', name: '2'},
            {___class: 'nested', name: '3'}
          ]
        });

        done();
      }
    });

    this.logoutUser();
  });

  QUnit.test('after fetch should update nested items collection', function(assert) {
    var env = this;
    var items = [
      {___class: 'nested', objectId: '1', name: 'Jim'},
      {___class: 'nested', objectId: '2', name: 'Bob'},
      {___class: 'nested', objectId: '3', name: 'Jack'}
    ];

    var model = new Backbone.Model({objectId: 'id', items: items}, {schemaName: testSchemaName});
    var done = assert.async();

    assert.expect(2);

    $.mockjax({
      url         : env.BASE_DATA_URL + testSchemaName + '/id',
      responseTime: env.MOCK_RESPONSE_TIME,
      responseText: {
        objectId: 'id',
        items   : [
          {___class: 'nested', objectId: '1', name: 'Jim'},
          {___class: 'nested', objectId: '2', name: 'Nick'},
          {___class: 'nested', objectId: '4', name: 'Jack'}
        ]
      }
    });

    model.fetch({
      success: function() {
        assert.ok(model.get('items') instanceof Backbone.Collection);
        assert.deepEqual(model.toJSON(), {
          ___class: testSchemaName,
          objectId: 'id',
          items   : [
            {___class: 'nested', objectId: '1', name: 'Jim'},
            {___class: 'nested', objectId: '2', name: 'Nick'},
            {___class: 'nested', objectId: '4', name: 'Jack'}
          ]
        });

        done();
      }
    });

    this.logoutUser();
  });

  QUnit.test('after destroy nested item, parent should be updated', function(assert) {
    var env = this;
    var items = [
      {___class: 'nested', objectId: '1', name: 'Jim'},
      {___class: 'nested', objectId: '2', name: 'Bob'},
      {___class: 'nested', objectId: '3', name: 'Jack'}
    ];

    var model = new Backbone.Model({objectId: 'id', items: items}, {schemaName: testSchemaName});
    var item1 = model.get('items').at(0);
    var item3 = model.get('items').at(2);
    var done = assert.async();

    assert.expect(4);

    $.mockjax({
      url         : env.BASE_DATA_URL + 'nested/2',
      type        : 'DELETE',
      responseTime: env.MOCK_RESPONSE_TIME,
      responseText: {}
    });

    assert.ok(model.get('items') instanceof Backbone.Collection);

    model.get('items').get('2').destroy({
      success: function() {
        assert.equal(model.get('items').at(0), item1);
        assert.equal(model.get('items').at(1), item3);

        assert.deepEqual(model.toJSON(), {
          ___class: testSchemaName,
          objectId: 'id',
          items   : [
            {___class: 'nested', objectId: '1', name: 'Jim'},
            {___class: 'nested', objectId: '3', name: 'Jack'}
          ]
        });

        done();
      }
    });

  });

  QUnit.test('should set nested item', function(assert) {
    var model = new Backbone.Model({objectId: 'id'}, {schemaName: testSchemaName});
    var nestedModel = new Backbone.Model({objectId: 'id', name: 'test'}, {schemaName: 'nested'});

    model.set({nestedItem: nestedModel});

    assert.deepEqual(model.toJSON(), {
      ___class  : testSchemaName,
      objectId  : 'id',
      nestedItem: {
        ___class: 'nested',
        name    : 'test',
        objectId: 'id'
      }
    });
  });

  QUnit.test('should set native Backbone item', function(assert) {
    var model = new Backbone.Model({objectId: 'id'}, {schemaName: testSchemaName});
    var nestedModel = new Backbone.Model({objectId: 'id', name: 'test'});

    model.set({nestedItem: nestedModel});

    assert.deepEqual(model.toJSON(), {
      ___class  : testSchemaName,
      objectId  : 'id',
      nestedItem: {
        name    : 'test',
        objectId: 'id'
      }
    });
  });

  QUnit.test('should save nested item', function(assert) {
    var model = new Backbone.Model({objectId: 'id'}, {schemaName: testSchemaName});
    var nestedModel = new Backbone.Model({name: 'test'}, {schemaName: 'nested'});
    var done = assert.async();

    assert.expect(2);

    $.mockjax({
      url         : this.BASE_DATA_URL + testSchemaName + '/id',
      type        : 'PUT',
      responseTime: this.MOCK_RESPONSE_TIME,
      response    : function(requestSettings) {
        assert.deepEqual(JSON.parse(requestSettings.data), {
          ___class  : testSchemaName,
          nestedItem: {
            ___class: 'nested',
            name    : 'test'
          },
          objectId  : 'id'
        });

        this.responseText = {objectId: 'id', nestedItem: {objectId: 'nested-id', name: 'test'}};
      }
    });

    model.save({nestedItem: nestedModel}).done(function() {
      assert.deepEqual(model.toJSON(), {
        ___class  : testSchemaName,
        objectId  : 'id',
        nestedItem: {
          name    : 'test',
          objectId: 'nested-id'
        }
      });

      done();
    });

  });

  QUnit.test('should change PATCH method to POST', function(assert) {
    var model = new Backbone.Model({test: 123}, {schemaName: testSchemaName});
    var done = assert.async();

    assert.expect(2);

    $.mockjax({
      url         : this.BASE_DATA_URL + testSchemaName,
      type        : 'POST',
      responseTime: this.MOCK_RESPONSE_TIME,
      response    : function(requestSettings) {
        assert.deepEqual(JSON.parse(requestSettings.data), {
          ___class: testSchemaName,
          name    : 'test',
          test    : 123
        });

        this.responseText = {___class: testSchemaName, objectId: 'id', name: 'test', test: 123};
      }
    });

    model.save({name: 'test'}, {patch: true}).done(function() {
      assert.deepEqual(model.toJSON(), {
        ___class: testSchemaName,
        objectId: 'id',
        name    : 'test',
        test    : 123
      });

      done();
    });

  });

  QUnit.test('should change PATCH method to PUT', function(assert) {
    var model = new Backbone.Model({objectId: 'id'}, {schemaName: testSchemaName});
    var done = assert.async();

    assert.expect(2);

    $.mockjax({
      url         : this.BASE_DATA_URL + testSchemaName + '/id',
      type        : 'PUT',
      responseTime: this.MOCK_RESPONSE_TIME,
      response    : function(requestSettings) {
        assert.deepEqual(JSON.parse(requestSettings.data), {
          name: 'test'
        });

        this.responseText = {objectId: 'id', name: 'test'};
      }
    });

    model.save({name: 'test'}, {patch: true}).done(function() {
      assert.deepEqual(model.toJSON(), {
        ___class: testSchemaName,
        objectId: 'id',
        name    : 'test'
      });

      done();
    });

  });

  QUnit.test('toJSON method should transform nested Backbone.Model/Collection to JSON', function(assert) {
    var model = new Backbone.Model({
      item: new Backbone.Model({name: 'nested1'}, {schemaName: 'schemaName1'}),
      data: {
        items : new Backbone.Collection([{name: 'item1'}, {name: 'items2'}], {schemaName: 'schemaName2'}),
        arr   : [1, 2, 3],
        obj   : {
          test: 'testobj'
        },
        foo   : {
          testItem: new Backbone.Model({name: 'foo-item'}, {schemaName: 'schemaName3'})
        },
        native: {
          model     : new Backbone.Model({test: 'test'}),
          collection: new Backbone.Collection([{test: 'test1'}, {test: 'test2'}])
        }
      }
    }, {schemaName: testSchemaName});

    assert.deepEqual(model.toJSON(), {
      ___class: 'testSchema',
      item    : {___class: 'schemaName1', name: 'nested1'},
      data    : {
        arr: [1, 2, 3],
        foo: {
          testItem: {___class: 'schemaName3', name: 'foo-item'}
        },

        items: [
          {___class: 'schemaName2', name: 'item1'},
          {___class: 'schemaName2', name: 'items2'}
        ],

        native: {
          collection: [{test: 'test1'}, {test: 'test2'}],
          model     : {test: 'test'}
        },

        obj: {test: 'testobj'}
      }
    });

  });

  QUnit.test('extend method', function(assert) {
    var Model1 = Backbone.Model.extend({
      schemaName    : testSchemaName,
      schemaTypes   : 'schemaTypes1',
      properties    : 'properties1',
      relations     : 'relations1',
      relationsDepth: 'relationsDepth1',
      sortingBy     : 'sortingBy1',
      condition     : 'condition1',
      prop          : 'prop1',
      method        : function() {
        assert.ok('first');
      }
    });

    var Model2 = Model1.extend({
      schemaName    : 'secondSchemaName',
      schemaTypes   : 'schemaTypes2',
      properties    : 'properties2',
      relations     : 'relations2',
      relationsDepth: 'relationsDepth2',
      sortingBy     : 'sortingBy2',
      condition     : 'condition2',
      prop          : 'prop2',
      method        : function() {
        assert.ok('second');

        Model1.prototype.method.call(this);
      }
    });

    var model1 = new Model1();
    var model2 = new Model2();

    assert.expect(19);
    assert.equal(model1.schemaName, testSchemaName);
    assert.equal(model1.schemaTypes, 'schemaTypes1');
    assert.equal(model1.properties, 'properties1');
    assert.equal(model1.relations, 'relations1');
    assert.equal(model1.relationsDepth, 'relationsDepth1');
    assert.equal(model1.sortingBy, 'sortingBy1');
    assert.equal(model1.condition, 'condition1');
    assert.equal(model1.prop, 'prop1');

    assert.equal(model2.schemaName, 'secondSchemaName');
    assert.equal(model2.schemaTypes, 'schemaTypes2');
    assert.equal(model2.properties, 'properties2');
    assert.equal(model2.relations, 'relations2');
    assert.equal(model2.relationsDepth, 'relationsDepth2');
    assert.equal(model2.sortingBy, 'sortingBy2');
    assert.equal(model2.condition, 'condition2');
    assert.equal(model2.prop, 'prop2');

    model1.method();
    model2.method();
  });

})();