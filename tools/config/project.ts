import {join} from 'path';

class ProjectConfig {
    BUILD_DEST = 'build/';

    POSTS_SRC = 'src/content/posts';
    POSTS_DEST = 'build/content/index';
    POSTS_HTML_DEST = 'build/posts/';
    POSTS_LISTING_URL ='/archives/page-%page%.html';
    POST_URL = '/posts/%postid%.html';

    /**
     * The fraction of categories which must match for a post to be deemed related.
     */
    RELATED_POST_CATEGORIES = 2/3;

    LAYOUT_DIR = 'src/layout';
    LAYOUT_POST_LISTING = 'post_listing.html.twig';
    LAYOUT_POST = 'post.html.twig';

    PAGES_SRC = 'src/content/pages';

    SASS_SRC = 'src/sass';
    SASS_DEST = 'build/css';

    TITLE = 'My Blog';
    NAME = 'Gary Tierney\'s Blog';
    AUTHOR_NAME = 'Gary Tierney';
    AUTHOR_EMAIL = 'gary.tierney@gmx.com';
    URL = 'https://garyttierney.github.io/';

    DESCRIPTION = 'A blog about Linux and programming';

    POSTS_PER_PAGE = 5;
}

export const config = new ProjectConfig();
