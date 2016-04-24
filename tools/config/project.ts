import {join} from 'path';

class ProjectConfig {
    BUILD_DEST = 'build/';

    POSTS_SRC = 'src/content/posts';
    POSTS_DEST = 'build/content/index';
    POSTS_HTML_DEST = 'build/posts/';
    POSTS_LISTING_URL ='/archives/page-%page%.html';
    POST_URL = '/posts/%postid%.html';

    LAYOUT_DIR = 'src/layout';
    LAYOUT_POST_LISTING = 'post_listing.html.twig';
    LAYOUT_POST = 'post.html.twig';

    PAGES_SRC = 'src/content/pages';

    SASS_SRC = 'src/sass';
    SASS_DEST = 'build/css';

    TITLE = 'protectyour.pw';
    DESCRIPTION = 'A blog about Linux and programming';

    POSTS_PER_PAGE = 1;
}

export const config = new ProjectConfig();
