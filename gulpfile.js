const { src, dest, parallel, series, watch } = require("gulp");
//var gulp = require('gulp'),
const browserSync = require("browser-sync").create();
const settings = require("./settings");
const scss = require("gulp-sass")(require("sass"));
const autoprefixer = require("gulp-autoprefixer");
const cleancss = require("gulp-clean-css");
const fileinclude = require("gulp-file-include");
const concat = require("gulp-concat");
// Подключаем gulp-uglify-es
const uglify = require("gulp-uglify-es").default;

// Подключаем gulp-imagemin для работы с изображениями
const imagemin = import('gulp-imagemin');

// Подключаем модуль gulp-newer
const newer = require("gulp-newer");

// Подключаем модуль del
const del = require("del");

const webpack = require("webpack");
// browserSync = require('browser-sync').create(),
// postcss = require('gulp-postcss'),
// rgba = require('postcss-hexrgba'),
// autoprefixer = require('autoprefixer'),
// cssvars = require('postcss-simple-vars'),
// nested = require('postcss-nested'),
// cssImport = require('postcss-import'),
// mixins = require('postcss-mixins'),
// colorFunctions = require('postcss-color-function');

function server() {
  browserSync.init({
    //proxy: "http://localhost:8000", // Адрес вашего Docker-сервера
    //port: 3000, // Порт, на котором будет работать BrowserSync
    // Инициализация Browsersync
    //server: { baseDir: 'app/' }, // Указываем папку сервера
    notify: false, // Отключаем уведомления
    //online: true // Режим работы: true или false
    proxy: settings.urlToPreview,
    //ghostMode: false
  });
}

function watching() {
  watch("./dev/scss/**/*", styles);
  watch(["./dev/js/**/*.js", "!./js/*.min.js"], scripts);
  watch("./dev/images/**/*", images);
  watch("./dev/php/**/*", php);
  watch([
    settings.themeLocation + "/**/*.php",
    settings.themeLocation + "/assets/css/**/*.css",
    settings.themeLocation + "/assets/js/**/*.js",
  ]).on("change", browserSync.reload);
}

function styles() {
  return (
    src("./dev/scss/main.scss") // Выбираем источник: "app/sass/main.sass" или "app/less/main.less"
      //.pipe(sourcemaps.init())
      .pipe(scss()) // Преобразуем значение переменной "preprocessor" в функцию
      .pipe(concat("app.min.css")) // Конкатенируем в файл app.min.js
      .pipe(
        autoprefixer({ overrideBrowserslist: ["last 10 versions"], grid: true })
      ) // Создадим префиксы с помощью Autoprefixer
      .pipe(
        cleancss({
          level: { 1: { specialComments: 0 } } /* , format: 'beautify' */,
        })
      ) // Минифицируем стили
      //.pipe(sourcemaps.write())
      .pipe(dest(settings.themeLocation + "/assets/css/")) // Выгрузим результат в папку "имя темы/css/"
      .pipe(browserSync.stream())
  ); // Сделаем инъекцию в браузер
}

function scripts() {
  return webpack(require("./webpack.config.js"), function (err, stats) {
    if (err) {
      console.log(err.toString());
    }
    console.log(stats.toString());
  });
}

function images() {
  return src("./dev/images/**/*") // Берём все изображения из папки источника
    .pipe(newer(settings.themeLocation + "/assets/images/")) // Проверяем, было ли изменено (сжато) изображение ранее
    .pipe(imagemin()) // Сжимаем и оптимизируем изображеня
    .pipe(dest(settings.themeLocation + "/assets/images/")); // Выгружаем оптимизированные изображения в папку назначения
}

function php() {
  return src("./dev/php/**/*")
    .pipe(newer(settings.themeLocation))
    .pipe(dest(settings.themeLocation))
    .pipe(browserSync.stream());
}

function buildcopy() {
  return src(
    [
      // Выбираем нужные файлы
      "./css/**/*.min.css",
      "./js/**/*.min.js",
      "./images/**/*",
      "./*.php",
      "./fonts/**/*",
    ],
    { base: "./" }
  ) // Параметр "base" сохраняет структуру проекта при копировании
    .pipe(dest(settings.themeLocation)); // Выгружаем в папку с финальной сборкой
}

function cleandist() {
  return del(settings.themeLocation + "/**/*", { force: true }); // Удаляем всё содержимое папки "dist/"
}

exports.server = server;
exports.watching = watching;
exports.styles = styles;
exports.scripts = scripts;
//exports.build = series(cleandist, styles, scripts, images, buildcopy);
exports.default = parallel(server, watching);
