import * as gulp from 'gulp';
import * as del from 'del';
import {join} from 'path';
import {config} from '../config/project';

export = () => {
    return del(join('./', config.BUILD_DEST));
}