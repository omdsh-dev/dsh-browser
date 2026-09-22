import process from 'node:process';
import {Buffer} from 'node:buffer';
import {promisify} from 'node:util';
import childProcess from 'node:child_process';
import fs, {constants as fsConstants} from 'node:fs/promises';

const execFile = promisify(childProcess.execFile);

export const powerShellPath = () => `${process.env.SYSTEMROOT || process.env.windir || String.raw`C:\Windows`}\\System32\\WindowsPowerShell\\v1.0\\powershell.exe`;

// Cache for PowerShell accessibility check
let canAccessCache;

export const canAccessPowerShell = async () => {
	canAccessCache ??= (async () => {
		try {
			await fs.access(powerShellPath(), fsConstants.X_OK);
			return true;
		} catch {
			return false;
		}
	})();

	return canAccessCache;
};

const argumentsPrefix = [
	'-NoProfile',
	'-NonInteractive',
	'-ExecutionPolicy',
	'Bypass',
	'-EncodedCommand',
];

const encodeCommand = command => Buffer.from(command, 'utf16le').toString('base64');

const escapeArgument = value => `'${String(value).replaceAll('\'', '\'\'')}'`;

const createArguments = command => [...argumentsPrefix, encodeCommand(command)];

export const executePowerShell = async (command, options = {}) => {
	const {
		powerShellPath: psPath,
		...execFileOptions
	} = options;

	return execFile(
		psPath ?? powerShellPath(),
		createArguments(command),
		{
			encoding: 'utf8',
			...execFileOptions,
		},
	);
};

executePowerShell.argumentsPrefix = argumentsPrefix;
executePowerShell.encodeCommand = encodeCommand;
executePowerShell.escapeArgument = escapeArgument;
executePowerShell.createArguments = createArguments;

export const executePowerShellSync = (command, options = {}) => {
	const {
		powerShellPath: psPath,
		...execFileOptions
	} = options;

	return childProcess.execFileSync(
		psPath ?? powerShellPath(),
		createArguments(command),
		{
			encoding: 'utf8',
			...execFileOptions,
		},
	);
};
