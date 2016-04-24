import * as gulp from 'gulp';
import * as gulpLoadPlugins from 'gulp-load-plugins';

let plugins = <any>gulpLoadPlugins();

export = function (cb: any) {
    return gulp.src('./src/content/assets/**/*')
        .pipe(gulp.dest('./build/assets'));
}