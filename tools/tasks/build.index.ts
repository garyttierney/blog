import {PostMeta} from "../utils/post-meta.interface";
import {config} from '../config/project';

import {join} from 'path';
import * as through from 'through2';
import * as gulp from 'gulp';
import * as gulpLoadPlugins from 'gulp-load-plugins';
import * as readingTime from 'reading-time';
import * as hljs from 'highlight.js';

const plugins = <any>gulpLoadPlugins();

export = function (cb : any) {
    return gulp.src(join(config.POSTS_SRC, '**', '*.md'))
        .pipe(plugins.markdownToJson({
            highlight: function (code : string, lang : string, callback : any) {
                return hljs.highlight(lang, code).value;
            }
        }))
        .pipe(through.obj(
            function (chunk : any, enc : string, callback : any) {
                if (chunk.isNull()) {
                    return callback(chunk, null);
                }

                let post : PostMeta = JSON.parse(chunk.contents);
                let time = readingTime(post.body);

                post.readingTime = time.text;
                post.summary = post.body.substring(0, post.body.indexOf('<!---more-->'));

                chunk.contents = new Buffer(JSON.stringify(post));

                callback(null, chunk);
            })
        )
        .pipe(gulp.dest(join(config.POSTS_DEST)));
};