'use strict';
const gulp = require('gulp');

const eslint = require('gulp-eslint');

const less = require('gulp-less');
const cleanCSS = require('gulp-clean-css');


/**
 * Means to gracefully handle errors, rather than droppping out of a "watch" session
 */
function handleError(err) {
  console.log(err.toString());
  this.emit('end');
}

gulp.task('less', () => {
  return gulp.src('./less/[^_]*.less')
    .pipe(less())
    .on('error', handleError)
    .pipe(cleanCSS({ 'keepBreaks': true }))
    .pipe(gulp.dest('./web/css'));
});

gulp.task('lint', () => {
  return gulp.src('./js/**/*.{js,jsx}')
    .pipe(eslint())
    .pipe(eslint.formatEach('compact', process.stderr));
});

gulp.task('default', ['less', 'lint']);

gulp.task('watch', () => {
  gulp.watch('./less/*.less', ['less']);
});
