import * as gulp from 'gulp';
import * as gulpLoadPlugins from 'gulp-load-plugins';
import {config} from '../config/project';
import {join} from 'path';
import * as runSequence from 'run-sequence';

let plugins = <any>gulpLoadPlugins();

gulp.task('serve.connect', function () {
});

export = function (cb : any) {
    runSequence('build');

    gulp.watch(join(config.SASS_SRC, '**', '*.scss'), ['build.sass']);
    gulp.watch(join(config.PAGES_SRC, '**', '*.twig'), ['build.pages']);
    gulp.watch(join(config.POSTS_SRC, '**', '*.md'), ['build.index']);
    gulp.watch(join(config.POSTS_DEST, '**', '*.json'), ['build.posts', 'build.posts-listing']);
    gulp.watch(join(config.LAYOUT_DIR, '**', '*.twig'), ['build.posts', 'build.pages', 'build.posts-listing']);

    return plugins.connect.server({
        root: './build',
        livereload: true
    });
};