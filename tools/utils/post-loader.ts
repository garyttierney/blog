import {PostMeta} from "./post-meta.interface";

const postLoader = function(file: any) : PostMeta {
    let content = file;

    if (typeof content !== 'string') {
        content = String(file.contents);
    }

    let post : PostMeta = JSON.parse(content);
    post.date = new Date(post.timestamp * 1000);

    return post;
};

export = postLoader;