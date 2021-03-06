import {config} from '../config/project';

import * as gulp from 'gulp';
import * as gulpLoadPlugins from 'gulp-load-plugins';

let plugins = <any>gulpLoadPlugins();

export = function (cb : any) {
    return gulp.src('build/**/*.html')
        .pipe(plugins.sitemap({
            siteUrl: config.URL,
            changefreq: 'weekly'
        }))
        .pipe(gulp.dest('./build'));
}
