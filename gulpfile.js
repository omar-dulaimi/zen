eval(
  require('typescript').transpile(
    require('fs').readFileSync('./tools/gulpfile.ts').toString(),
    require('./tools/tsconfig.gulp.json').compilerOptions
  )
);
