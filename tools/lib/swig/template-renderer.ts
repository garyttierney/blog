import * as swig from 'swig';
import {config} from '../../config/project';

let templateRenderer = new swig.Swig({
    locals: {
        site: {
            title: config.TITLE,
            description: config.DESCRIPTION
        },
        config: config
    },
    loader: swig.loaders.fs(config.LAYOUT_DIR)
});


export = templateRenderer;