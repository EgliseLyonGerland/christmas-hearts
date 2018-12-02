const yargs = require('yargs');

(() =>
  yargs
    .usage('Usage: $0 <command> [options]')
    .locale('en')
    .commandDir('commands')
    .demandCommand()
    .epilog(`© Église Lyon Gerland ${new Date().getFullYear()}`)
    .wrap(Math.min(100, yargs.terminalWidth()))
    .help().argv)();
