'use strict';
const { ActionInputs } = require('./action-inputs.js');
const { PinCheck } = require('./pin-check.js');

const report = new PinCheck(ActionInputs.fromEnv(process.env)).run();
report.toLines().forEach(line => console.log(line));
process.exit(report.exitCode);
