import * as gulp from 'gulp';
import {getAssetDependencies} from '../config/dependencies';

export = function (cb: any) {
    let fonts = getAssetDependencies()
        .filter(dep => dep.type === 'font' && !!dep.glob)
        .map(dep => dep.glob);

  return gulp.src(fonts)
      .pipe(gulp.dest('./build/fonts'));
};