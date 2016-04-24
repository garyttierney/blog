import * as gulp from 'gulp';
import * as fs from 'fs';
import * as glob from 'glob';
import {basename, join} from 'path';
import {config} from '../config/project';
import {PostMeta} from "../utils/post-meta.interface";
import * as templateRenderer from '../lib/swig/template-renderer';
import * as postLoader from '../utils/post-loader';

export = function (cb : any) {
    templateRenderer.invalidateCache();

    if (!fs.existsSync('./build/archives')) {
        fs.mkdir('./build/archives');
    }

    let posts = glob.sync(join(config.POSTS_DEST, '**', '*.json'))
        .map(post => {
            let meta : PostMeta = postLoader(String(fs.readFileSync(post)));

            return {
                path: post,
                timestamp: meta.timestamp,
                categories: meta.categories,
                title: meta.title,
                summary: meta.summary,
                readingTime: meta.readingTime,
                date: meta.date,
                id: basename(post).replace('.json', '')
            };
        })
        .sort((a : any, b : any) => a.timestamp > b.timestamp ? -1 : 1);

    var i = 0,
        n = posts.length;

    let numPages = Math.ceil(n / config.POSTS_PER_PAGE);

    while (i < n) {
        let pageNumber = 1 + Math.floor(i / config.POSTS_PER_PAGE);
        let pagePosts = posts.slice(i, i += config.POSTS_PER_PAGE);
        let hasPrev = i >= 1;
        let hasNext = i < n;

        let minRange = Math.max(1, pageNumber - 2);
        let maxRange = Math.min(numPages, pageNumber + 2);
        let range : number[] = [];

        for (var rangeId = minRange; rangeId <= maxRange; rangeId++) {
            range.push(rangeId);
        }

        let output = templateRenderer.renderFile(config.LAYOUT_POST_LISTING, {
            numPages,
            hasPrev,
            pageNumber,
            pagePosts,
            hasNext,
            range
        });

        let path = './build' + config.POSTS_LISTING_URL.replace('%page%', pageNumber.toString());

        fs.writeFileSync(path, output);
    }

    cb();
};