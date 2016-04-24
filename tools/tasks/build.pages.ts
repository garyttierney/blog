import {PostMeta} from "../utils/post-meta.interface";
import {config} from '../config/project';

import {join} from 'path';
import * as gulp from 'gulp';
import * as gulpLoadPlugins from 'gulp-load-plugins';
import * as templateRenderer from '../lib/swig/template-renderer';
import * as through from 'through2';

let plugins = <any>gulpLoadPlugins();

export = function (cb: any) {
    templateRenderer.invalidateCache();

    return gulp.src(join(config.PAGES_SRC, '**', '*.html.twig'))
        .pipe(through.obj(
            function (file: any, err: any, cb: any) {
                if (file.isNull()) {
                    return cb(null, file);
                }

                let content = templateRenderer.renderFile(file.path);
                file.contents = new Buffer(content);

                cb(null, file);
            }
        ))
        .pipe(plugins.rename({
            extname: ''
        }))
        .pipe(gulp.dest(config.BUILD_DEST));

}