(function() {

  QUnit.module('Native Backbone.Collection', {

    afterEach: function(assert) {
      $.mockjax.clear();
    }

  });

  QUnit.test('on create', function(assert) {
    var collection = new Backbone.Collection([{prop: 'myProp'}]);

    assert.equal(collection.schemaName, undefined);
    assert.equal(collection.totalItems, undefined);
    assert.equal(collection.offsetItems, undefined);
    assert.equal(collection.itemsPerPage, undefined);
    assert.equal(collection.properties, undefined);
    assert.equal(collection.relations, undefined);
    assert.equal(collection.relationsDepth, undefined);
    assert.equal(collection.sortingBy, undefined);
    assert.equal(collection.condition, undefined);
    assert.deepEqual(collection.toJSON(), [{prop: 'myProp'}]);
  });

  QUnit.test('url method', function(assert) {
    var collection = new Backbone.Collection();

    assert.equal(_.result(collection, 'url'), undefined);
  });

  QUnit.test('describe return undefined', function(assert) {
    var collection = new Backbone.Collection();

    assert.equal(collection.describe(), undefined);
  });

  QUnit.test('fetch method without any qury params', function(assert) {
    var collection = new Backbone.Collection();

    collection.url = '/myUrl';

    var done = assert.async();

    assert.expect(1);

    $.mockjax({
      url         : '/myUrl',
      responseTime: this.MOCK_RESPONSE_TIME,
      response    : function() {
        this.responseText = [{id: 'my-id'}];
      }
    });

    collection.fetch({
      offsetItems   : 10,
      itemsPerPage  : 40,
      properties    : 'override-properties',
      relations     : ['override-relations', 'override-second-relations'],
      relationsDepth: 0,
      sortingBy     : ['override-prop asc', 'override-prop2 desc'],

      success: function() {
        assert.deepEqual(collection.toJSON(), [{id: 'my-id'}]);

        done();
      }
    });
  });

  QUnit.test('get method', function(assert) {
    var collection = new Backbone.Collection([{id: '1'}, {id: '2'}, {id: '3'}]);

    assert.ok(collection.get('1') instanceof Backbone.Model);
    assert.equal(collection.get('1'), collection.at(0));
    assert.equal(collection.get({id: '2'}), collection.at(1));
    assert.equal(collection.get(collection.at(2)), collection.at(2));
  });

  QUnit.test('sync method', function(assert) {
    var env = this;
    var done = assert.async();
    var collection = new Backbone.Collection();

    this.loginUser();

    $.mockjax(function(requestSettings) {
      assert.equal(requestSettings.headers && requestSettings.headers['application-type'], undefined);
      assert.equal(requestSettings.headers && requestSettings.headers['application-id'], undefined);
      assert.equal(requestSettings.headers && requestSettings.headers['secret-key'], undefined);
      assert.equal(requestSettings.headers && requestSettings.headers['user-token'], undefined);

      return {
        url         : '/',
        responseTime: env.MOCK_RESPONSE_TIME,
        responseText: [{id: '1'}, {id: '2'}]
      };
    });

    collection.url = '/';
    collection.fetch().done(function() {
      assert.deepEqual(collection.toJSON(), [{id: '1'}, {id: '2'}]);
      done();
    });

    this.logoutUser();
  });

  QUnit.test('extend method', function(assert) {
    var Collection1 = Backbone.Collection.extend({
      prop  : 'prop1',
      method: function() {
        assert.ok('first');
      }
    });

    var Collection2 = Collection1.extend({
      prop  : 'prop2',
      method: function() {
        assert.ok('second');

        Collection1.prototype.method.call(this);
      }
    });

    var col1 = new Collection1();
    var col2 = new Collection2();

    assert.expect(5);
    assert.equal(col1.prop, 'prop1');
    assert.equal(col2.prop, 'prop2');

    col1.method();
    col2.method();
  });

})();