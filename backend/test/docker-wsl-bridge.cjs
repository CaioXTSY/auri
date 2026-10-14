// Test-only adapter: invokes Docker in the explicitly selected local WSL distro.
// No shell interpolation and no change to production runner behavior.
const cp = require('node:child_process');
const distro = process.env.AURI_TCC_DOCKER_WSL;
if (distro && process.platform === 'win32') {
  const prefix = ['-d', distro, '--', 'docker'];
  const spawn = cp.spawn;
  const execFileSync = cp.execFileSync;
  cp.spawn = (command, args, options) => command === 'docker'
    ? spawn('wsl.exe', [...prefix, ...args], options) : spawn(command, args, options);
  cp.execFileSync = (command, args, options) => command === 'docker'
    ? execFileSync('wsl.exe', [...prefix, ...args], options) : execFileSync(command, args, options);
}
