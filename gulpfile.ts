import * as gulp from 'gulp';
import * as util from 'gulp-util';
import * as chalk from 'chalk';
import {readdirSync, existsSync, lstatSync} from 'fs';
import {join} from 'path';

export function loadTasks(path : string) : void {
    util.log('Loading tasks folder', chalk.yellow(path));
    readDir(path, taskname => registerTask(taskname, path));
}

function registerTask(taskname : string, path : string) : void {
    const TASK = join('.', path, taskname);
    util.log('Registering task', chalk.yellow(TASK));

    //noinspection TypeScriptValidateTypes
    gulp.task(taskname, function (cb: any) {
        let task = require('./' + TASK);
        if (task.length > 0) {
            return task(cb);
        }

    });
}

function readDir(root : string, cb : (taskname : string) => void) {
    if (!existsSync(root)) return;

    walk(root);

    function walk(path : string) {
        let files = readdirSync(path);
        for (let i = 0; i < files.length; i += 1) {
            let file = files[i];
            let curPath = join(path, file);
            if (lstatSync(curPath).isFile() && /\.ts$/.test(file)) {
                let taskname = file.replace(/\.ts$/, '');
                cb(taskname);
            }
        }
    }
}

loadTasks('./tools/tasks');