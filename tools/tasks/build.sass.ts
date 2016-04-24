import {config} from '../config/project';
import {join} from 'path';
import * as gulp from 'gulp';
import * as gulpLoadPlugins from 'gulp-load-plugins';
import * as autoprefixer from 'gulp-autoprefixer';
import * as runSequence from 'run-sequence';
import {getAssetDependencies} from "../config/dependencies";

let plugins = <any>gulpLoadPlugins();

gulp.task('build.sass.build-sass', function() {
    return gulp.src(join(config.SASS_SRC, '**', '*.scss'))
        .pipe(plugins.sass().on('error', plugins.sass.logError))
        .pipe(autoprefixer({
            browsers: ['last 2 versions', '> 5%']
        }))
        .pipe(gulp.dest(config.SASS_DEST))
        .pipe(plugins.connect.reload());
});

gulp.task('build.sass.compile-css', function () {
    let cssFiles = getAssetDependencies()
        .filter(dep => dep.type === 'css')
        .map(dep => dep.path);

    cssFiles.push(join(config.SASS_DEST, 'main.css'));

    return gulp.src(cssFiles)
        .pipe(plugins.concat('main.css'))
        .pipe(gulp.dest(config.SASS_DEST));
});

export = function (cb: any) {
    return runSequence('build.sass.build-sass', 'build.sass.compile-css', cb);
};

