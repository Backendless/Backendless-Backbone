(function() {

  QUnit.module('Backendless.Helpers');

  QUnit.test('extend AjaxOptions by Backendless headers when user is not logged', function(assert) {
    var ajaxOptions = {
      headers: {
        test: 'my-test-header'
      }
    };

    var extendedAjaxOptions = Backendless.extendAjaxOptionsByBackendlessHeaders(ajaxOptions);

    assert.equal(ajaxOptions, extendedAjaxOptions);
    assert.equal(ajaxOptions.headers, extendedAjaxOptions.headers);
    assert.equal(ajaxOptions.headers['application-type'], this.APPLICATION_TYPE);
    assert.equal(ajaxOptions.headers['application-id'], this.APPLICATION_ID);
    assert.equal(ajaxOptions.headers['secret-key'], this.APP_SECRET_KEY);
    assert.equal(ajaxOptions.headers['test'], 'my-test-header');
    assert.strictEqual(ajaxOptions.headers['user-token'], undefined);
  });

  QUnit.test('extend AjaxOptions by Backendless headers when user is logged', function(assert) {
    this.loginUser();

    var ajaxOptions = {
      headers: {
        test: 'my-test-header'
      }
    };

    var extendedAjaxOptions = Backendless.extendAjaxOptionsByBackendlessHeaders(ajaxOptions);

    assert.equal(ajaxOptions, extendedAjaxOptions);
    assert.equal(ajaxOptions.headers, extendedAjaxOptions.headers);
    assert.equal(ajaxOptions.headers['application-type'], this.APPLICATION_TYPE);
    assert.equal(ajaxOptions.headers['application-id'], this.APPLICATION_ID);
    assert.equal(ajaxOptions.headers['secret-key'], this.APP_SECRET_KEY);
    assert.equal(ajaxOptions.headers['user-token'], this.USER_TOKEN);
    assert.equal(ajaxOptions.headers['test'], 'my-test-header');

    this.logoutUser();
  });

  QUnit.test('extend AjaxOptions by Backendless headers not passed', function(assert) {
    this.loginUser();

    var ajaxOptions = {};

    var extendedAjaxOptions = Backendless.extendAjaxOptionsByBackendlessHeaders(ajaxOptions);

    assert.equal(ajaxOptions, extendedAjaxOptions);
    assert.equal(ajaxOptions.headers, extendedAjaxOptions.headers);
    assert.equal(ajaxOptions.headers['application-type'], this.APPLICATION_TYPE);
    assert.equal(ajaxOptions.headers['application-id'], this.APPLICATION_ID);
    assert.equal(ajaxOptions.headers['secret-key'], this.APP_SECRET_KEY);
    assert.equal(ajaxOptions.headers['user-token'], this.USER_TOKEN);

    this.logoutUser();
  });

})();