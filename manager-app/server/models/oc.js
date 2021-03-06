const shell = require('shelljs')
const fs = require('fs');

const TOKEN = loadToken();
const MAX_RETRIES = 60; // 5 minutes
const INTERVAL = 5 * 1000; // 5 seconds

function loadToken() {
  try {
    return fs.readFileSync('/run/secrets/kubernetes.io/serviceaccount/token', 'utf8');
  } catch (error) {
    throw new Error('Missing required TOKEN. Check that the ServiceAccount is properly defined.\n' + error);
  }
}

function ocRun(command) {
  const oc_command = command + ' --token=' + TOKEN;
  const result = shell.exec(oc_command, {silent: true});
  if(result.code !== 0) {
    console.log('Unable to run command[%d]. Error: %s', result.code, result.stderr);
  }
  return result;
}

//TODO: It seems it's being executed twice
function waitUntilReady(waitUntil, callbackFn, errorCallbackFn) {
  let retries = 0;
  const timer = setInterval(() => {
    console.log("Waiting for environment to be ready: %d/%d.", retries, MAX_RETRIES);
    if(ocRun(waitUntil.command).stdout === waitUntil.expectation.toString()) {
      callbackFn();
      clearInterval(timer);
      return;
    }
    if(retries === MAX_RETRIES) {
      errorCallbackFn("Timeout waiting for environment to be ready");
      clearInterval(timer);
      return;
    }
    retries++;
  }, INTERVAL);
}

exports.run = (config, callbackFn, errorCallbackFn) => {
  const commands = config.commands;
  for(let i = 0; i < commands.length; i++) {
    const result = ocRun(commands[i]);
    if(result.code !== 0) {
      return errorCallbackFn("Unable to execute oc command: " + result.stderr);
    }
  }
  if(config.waitUntil !== undefined) {
    waitUntilReady(config.waitUntil, callbackFn, errorCallbackFn);
  } else {
    callbackFn();
  }
};

exports.getDemoAppRoute = () => {
  return shell.exec("oc get route -n demo demoapp -o jsonpath='{.spec.host}'", {silent: true}).stdout;
}
