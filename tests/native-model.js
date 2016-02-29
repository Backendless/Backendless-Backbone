(function() {

  var model;

  QUnit.module('Native Backbone.Model', {

    afterEach: function(assert) {
      $.mockjax.clear();
    }

  });

  QUnit.test('on create', function(assert) {
    var collection = new Backbone.Collection();
    var model = new Backbone.Model({prop: 'myProp'}, {collection: collection});

    assert.equal(model.schemaName, undefined);
    assert.equal(model.schemaTypes, undefined);
    assert.equal(model.properties, undefined);
    assert.equal(model.relations, undefined);
    assert.equal(model.relationsDepth, undefined);
    assert.equal(model.sortingBy, undefined);
    assert.equal(model.condition, undefined);
    assert.equal(model.id, undefined);
    assert.equal(model.idAttribute, 'id');
    assert.equal(model.get(this.CLASS_KEY), undefined);
    assert.equal(model.collection, collection);
    assert.deepEqual(model.toJSON(), {prop: 'myProp'});
  });

  QUnit.test('url method', function(assert) {
    var model = new Backbone.Model();

    assert.equal(_.result(model, 'urlRoot'), undefined);

    assert.throws(
      function() {
        _.result(model, 'url');
      },
      'A "url" property or function must be specified'
    );
  });

  QUnit.test('describe return undefined', function(assert) {
    var model = new Backbone.Model();

    assert.equal(model.describe(), undefined);
  });

  QUnit.test('fetch method without any qury params', function(assert) {
    var model = new Backbone.Model();

    model.urlRoot = '/modelUrl';

    var done = assert.async();

    assert.expect(1);

    $.mockjax({
      url         : '/modelUrl',
      responseTime: this.MOCK_RESPONSE_TIME,
      response    : function() {
        this.responseText = {id: 'my-id'};
      }
    });

    model.fetch({
      id            : 'my-id',
      isFirst       : true,
      isLast        : true,
      properties    : 'override-properties',
      relations     : ['override-relations', 'override-second-relations'],
      relationsDepth: 0,
      sortingBy     : ['override-prop asc', 'override-prop2 desc'],

      success: function() {
        assert.deepEqual(model.toJSON(), {id: 'my-id'});

        done();
      }
    });
  });

  QUnit.test('set method', function(assert) {
    var model = new Backbone.Model();

    model.set({
      item: {
        test: [new Backbone.Model({name: 'nested'})],
        foo : {
          items: new Backbone.Collection([{id: 1}, {id: 2}]),
          arr  : [1, 2, 3],
          num  : 12
        }
      }
    });

    assert.ok(model.get('item').test[0] instanceof Backbone.Model);
    assert.ok(model.get('item').foo.items.at(1) instanceof Backbone.Model);
    assert.deepEqual(model.toJSON(), {
      item: {
        test: [{name: 'nested'}],
        foo : {
          items: [{id: 1}, {id: 2}],
          arr  : [1, 2, 3],
          num  : 12
        }
      }
    });
  });

  QUnit.test('sync method', function(assert) {
    var env = this;
    var done = assert.async();
    var model = new Backbone.Model();

    this.loginUser();

    $.mockjax(function(requestSettings) {
      assert.equal(requestSettings.headers && requestSettings.headers['application-type'], undefined);
      assert.equal(requestSettings.headers && requestSettings.headers['application-id'], undefined);
      assert.equal(requestSettings.headers && requestSettings.headers['secret-key'], undefined);
      assert.equal(requestSettings.headers && requestSettings.headers['user-token'], undefined);

      return {
        url         : '/',
        responseTime: env.MOCK_RESPONSE_TIME,
        responseText: {}
      };
    });

    model.url = '/';
    model.fetch().done(function() {
      assert.deepEqual(model.toJSON(), {});
      done();
    });

    this.logoutUser();
  });

  QUnit.test('PATCH method', function(assert) {
    var done = assert.async();
    var model = new Backbone.Model({id: 1, age: 30, city: 'myCity'});

    $.mockjax({
      url         : '/1',
      type        : 'PATCH',
      responseTime: this.MOCK_RESPONSE_TIME,
      responseText: {name: 'name2'}
    });

    model.urlRoot = '/';
    model.save({name: 'name1'}, {patch: true}).done(function() {
      assert.deepEqual(model.toJSON(), {
        id  : 1,
        age : 30,
        city: 'myCity',
        name: 'name2'
      });

      done();
    });

  });

  QUnit.test('extend method', function(assert) {
    var Model1 = Backbone.Model.extend({
      prop  : 'prop1',
      method: function() {
        assert.ok('first');
      }
    });

    var Model2 = Model1.extend({
      prop  : 'prop2',
      method: function() {
        assert.ok('second');

        Model1.prototype.method.call(this);
      }
    });

    var model1 = new Model1();
    var model2 = new Model2();

    assert.expect(5);
    assert.equal(model1.prop, 'prop1');
    assert.equal(model2.prop, 'prop2');

    model1.method();
    model2.method();
  });

})();