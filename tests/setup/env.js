(function() {

  var APPLICATION_TYPE = 'JS';
  var APPLICATION_ID = 'my-app-id';
  var APP_SECRET_KEY = 'my-secret-key';
  var USER_TOKEN = 'my-user-token';
  var APPLICATION_VERSION = 'my-version';
  var CLASS_KEY = '___class';
  var ID_ATTR = 'objectId';

  QUnit.config.noglobals = true;

  QUnit.testStart(function() {
    Backendless.initApp(APPLICATION_ID, APP_SECRET_KEY, APPLICATION_VERSION);

    var env = QUnit.config.current.testEnvironment;

    env.APPLICATION_TYPE = APPLICATION_TYPE;
    env.APPLICATION_ID = APPLICATION_ID;
    env.APP_SECRET_KEY = APP_SECRET_KEY;
    env.USER_TOKEN = USER_TOKEN;
    env.APPLICATION_VERSION = APPLICATION_VERSION;
    env.BASE_DATA_URL = Backendless.appPath + '/data/';
    env.CLASS_KEY = CLASS_KEY;
    env.ID_ATTR = ID_ATTR;
    env.MOCK_RESPONSE_TIME = 100;

    env.loginUser = function() {
      Backendless.LocalCache.set('user-token', USER_TOKEN);
    };

    env.logoutUser = function() {
      Backendless.LocalCache.remove('user-token');
    };

  });

})();