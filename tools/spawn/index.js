import cp from "child_process";
import {platform} from "os";

export function spawn(...options){
    const commands = [];
    console.log(options)
    for (let i = 0; i < options.length; i++) {
        if (options[i].startsWith('-')){
            commands[commands.length - 1].push(options[i]);
        }else{
            commands.push([options[i]]);
        }
    }
    for (let command of commands) {
        spawnCommand('npx cmmn '+command.join(' '), command[0]+'\t', {
            color: 'red',
            shell: true,
            stdio: "pipe"
        });
    }
}


/**
 * @param command {string}
 * @param prefix {string}
 * @param options {cp.SpawnOptions}
 */
export const spawnCommand = (command, prefix, options) => {
    if (!options?.stdio && (platform() === 'linux')) {
        options = { ...(options ?? {}), stdio: 'inherit' };
    }
    const proc = cp.spawn(command, options);
    if (options?.stdio !== 'inherit') {
        if (prefix) {
            proc.stdin.pipe(process.stdin);
            pipe(proc.stdout, process.stdout, prefix);
            pipe(proc.stderr, process.stderr, prefix);
        } else {
            proc.stdin.pipe(process.stdin);
            proc.stdout.pipe(process.stdout);
            proc.stderr.pipe(process.stderr);
        }
    }
    return proc;
}
function pipe(stream, target, prefix){
    let _offset = 0;
    const _NEWLINE = '\n'.charCodeAt(0);
    const _prefix = Buffer.from(prefix, 'utf-8');
    const _buffer = Buffer.alloc(1024 * 128);
    const addBytes = (bytes) => {
        for (const byte of bytes) {
            _buffer[_offset] = byte;
            _offset += 1;
        }
    }
    const addBuffer = (buf) => {
        buf.copy(_buffer, _offset);
        _offset += buf.length;
    }
    const flush = () => {
        if (_offset > 0) {
            target.write(_buffer.slice(0, _offset));
            _offset = 0;
        }
    }
    addBuffer(_prefix);
    stream.on('readable', () => {
        const data = stream.read();
        if (data) {
            for (const [ , byte ] of data.entries()) {
                addBytes([byte]);
                if (byte === _NEWLINE) {
                    flush();
                    addBuffer(_prefix);
                }
            }
        }
    });
}
