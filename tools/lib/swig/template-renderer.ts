import * as swig from 'swig';
import {config} from '../../config/project';

let templateRenderer = new swig.Swig({
    locals: {
        site: {
            title: config.TITLE,
            description: config.DESCRIPTION,
            name: config.NAME,
            author_name: config.AUTHOR_NAME,
            author_email: config.AUTHOR_EMAIL,
            url: config.URL
        },
        config: config
    },
    loader: swig.loaders.fs(config.LAYOUT_DIR)
});


export = templateRenderer;
