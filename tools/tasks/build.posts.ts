import {PostMeta} from "../utils/post-meta.interface";
import {config} from '../config/project';

import {join} from 'path';
import * as through from 'through2';
import * as gulp from 'gulp';
import * as gulpLoadPlugins from 'gulp-load-plugins';
import * as readingTime from 'reading-time';
import * as templateRenderer from '../lib/swig/template-renderer';
import * as postLoader from '../utils/post-loader';
import * as glob from 'glob';
import * as fs from 'fs';
import {basename} from 'path';

const plugins = <any>gulpLoadPlugins();

export = function (cb : any) {
    templateRenderer.invalidateCache();

    return gulp.src(join(config.POSTS_DEST, '**', '*.json'))
        .pipe(through.obj(
            function (file : any, err : any, cb : any) {
                let post : PostMeta = postLoader(file);
                let relatedPosts = glob.sync(join(config.POSTS_DEST, '**', '*.json'))
                    .map(relatedPostPath => {
                        let relatedPost : PostMeta = postLoader(String(fs.readFileSync(relatedPostPath)));
                        let matches = post.categories.filter(category => relatedPost.categories.indexOf(category) != -1);
                        let matchCount = matches.length;

                        return {
                            path: post,
                            timestamp: relatedPost.timestamp,
                            categories: relatedPost.categories,
                            title: relatedPost.title,
                            summary: relatedPost.summary,
                            readingTime: relatedPost.readingTime,
                            date: relatedPost.date,
                            matches: matchCount,
                            id: basename(relatedPostPath).replace('.json', '')
                        };
                    })
                    .filter(p => p.matches > 0)
                    .sort((a : any, b : any) => {
                        let matchesCountDiff = a.matches - b.matches;
                        if (matchesCountDiff !== 0) {
                            return matchesCountDiff;
                        }

                        return a.timestamp - b.timestamp;
                    })
                    .slice(0, 3);

                let content = templateRenderer.renderFile(config.LAYOUT_POST, {
                    post: post,
                    related: relatedPosts
                });

                file.contents = new Buffer(content);

                cb(null, file);
            }
        ))
        .pipe(plugins.rename({
            extname: '.html'
        }))
        .pipe(gulp.dest(config.POSTS_HTML_DEST))
        .pipe(plugins.connect.reload());
}