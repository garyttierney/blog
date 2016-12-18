import * as gulp from 'gulp';
import * as gulpLoadPlugins from 'gulp-load-plugins';
import {config} from '../config/project';
import {join} from 'path';
import * as runSequence from 'run-sequence';

let plugins = <any>gulpLoadPlugins();

export = function (cb : any) {
    return gulp.src(join(config.BUILD_DEST, '**', '*'))
        .pipe(plugins.ghPages({
            force: true,
            branch: 'master',
            remoteUrl: 'git@github.com:garyttierney/garyttierney.github.io.git'
        }));

};
