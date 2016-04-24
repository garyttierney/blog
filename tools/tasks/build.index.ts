import {PostMeta} from "../utils/post-meta.interface";
import {config} from '../config/project';

import {join} from 'path';
import * as through from 'through2';
import * as gulp from 'gulp';
import * as gulpLoadPlugins from 'gulp-load-plugins';
import * as readingTime from 'reading-time';
import * as Highlights from 'highlights';
import * as marked from 'marked';

const highlighter = new Highlights();
const plugins = <any>gulpLoadPlugins();

var renderer = new marked.Renderer();
renderer.code = function (code : string, language : string) {
    return highlighter.highlightSync({
        fileContents: code,
        scopeName: `source.${language}`
    });
};

export = function (cb : any) {
    return gulp.src(join(config.POSTS_SRC, '**', '*.md'))
        .pipe(plugins.markdownToJson({
            renderer: renderer
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