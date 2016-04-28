import * as gulp from 'gulp';
import * as runSequence from 'run-sequence';

export = (cb : any) => {
    return runSequence('build.index', 'build.posts', 'build.posts-listing',
        ['build.sass', 'build.pages', 'build.assets', 'build.fonts'], 'build.sitemap', cb);
}