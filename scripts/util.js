/*
 * Copied from: https://github.com/forcedotcom/source-deploy-retrieve-test-utils/blob/main/scripts/util.js
 */

import shell from 'shelljs';

const terminalCodes = {
  Red: '\\033[31m',
  LightGrey: '\\033[37m',
  Bold: '\\033[1m',
  ResetAll: '\\033[0m',
};

export const run = (status, f) => {
  let result;
  shell.exec(`printf "🐎 ${status}..."`);
  const { LightGrey, Bold, ResetAll } = terminalCodes;
  try {
    result = f();
  } catch (e) {
    shell.exec(`printf "\\r❗️ ${status}...${Bold}${LightGrey}failed${ResetAll}\\n"`);
    shell.exec(`printf "${e.message}"`);
    process.exit(1);
  }
  shell.exec(`printf "\\r✅ ${status}...${Bold}${LightGrey}done${ResetAll}\\n"`);
  return result;
};

export const execSilent = (command, swallowError) => {
  const prevConfig = shell.config.fatal;
  shell.config.fatal = true;
  try {
    return shell.exec(command, { silent: true });
  } catch (e) {
    if (swallowError) {
      return;
    }
    throw e;
  } finally {
    shell.config.fatal = prevConfig;
  }
};

export { terminalCodes };