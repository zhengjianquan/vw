var gulp = require('gulp'),
	postcss = require('gulp-postcss'),//引入postcss
	clean = require('gulp-clean'),//用来清空文件夹，防止多余文件
	runSequence = require('run-sequence'),//同步执行插件
    rev = require('gulp-rev'),//生成静态资源版本号
    revCollector = require('gulp-rev-collector'),
    cleanCss = require('gulp-clean-css'),//css压缩插件
    uglify = require('gulp-uglify'),//js压缩插件
    jsImport = require('gulp-js-import'),//js引用模块
    imagemin = require('gulp-imagemin'),//图片自动压缩
    fileinclude = require('gulp-file-include'),//html include
    batch = require('gulp-batch'),
    watch = require('gulp-watch'),//文件监听插件
    del= require('del')//文件监听插件
;

//另一个postcss配置：为pc或者特殊页面单独配置css预处理选项
var precss = require('precss'),
	postcssImport = require('postcss-import'),
	postcssAssets = require('postcss-assets')
;

var postcssPc = [
	precss,
	postcssImport,
	postcssAssets
];

// 定义css js 源文件路径
var filePaths={
	cssSrc:'assets/**/*.css',
	jsonSrc:'assets/**/*.json',
	jsSrc:'assets/**/*.js',
	imgSrc:'assets/img/**/*',
	htmlSrc:'pages/**/*.html',
	phpSrc:'pages/**/*.php'
}

// 错误处理
function swallowError(error) {
	console.error(error.toString());
	this.emit('end');
}

var tasks = {
	clean:function(){
		gulp.src(['public/','view/'],{read:false}).pipe(clean());
	},
	revcss:function(){
		gulp.src(filePaths.cssSrc)
			.pipe(postcss())
			.on('error', swallowError)
			// .pipe(cleanCss())//压缩
			.pipe(rev())
			.on('error', swallowError)
			.pipe(gulp.dest('public'))
			.pipe(rev.manifest())
			.pipe(gulp.dest('assets/css'))
		;
	},
	revjs:function(){
		gulp.src(filePaths.jsSrc)
			.pipe(jsImport())
			.on('error', swallowError)
			// .pipe(uglify())
			.pipe(rev())
			.on('error', swallowError)
			.pipe(gulp.dest('public'))
			.pipe(rev.manifest())
			.pipe(gulp.dest('assets/js'))
		;
	},
	revimport:function(){
		gulp.src('public/**/*.js')
			.pipe(jsImport())
			.on('error', swallowError)
			// .pipe(uglify())
			.pipe(gulp.dest('public'))
		;
	},
	revimg:function(){
		gulp.src(filePaths.imgSrc)
			.pipe(rev())
			.on('error', swallowError)
			.pipe(imagemin({
			    interlaced: true,
			    progressive: true,
			    optimizationLevel: 7,
			    svgoPlugins: [{removeViewBox: true}]
			}))
			.on('error', swallowError)
			.pipe(gulp.dest('public/img'))
			.pipe(rev.manifest())
			.on('error', swallowError)
			.pipe(gulp.dest('assets/img'))
		;
	},
	revhtml:function(){
		// setTimeout(function(){
			gulp.src(['assets/**/*.json','pages/**/*.html', 'pages/**/*.php'])
		        .pipe(revCollector())
		        .on('error', swallowError)
				.pipe(fileinclude({
					prefix: '@@',
					basepath: '@file'
				}))
				.on('error', swallowError)
		        .pipe(gulp.dest('./view'))
		    ;
		// },300);
	},
	revcssimg:function(){
		gulp.src(['public/**/*.json','public/**/*.css'])
	        .pipe(revCollector())
	        .on('error', swallowError)
	        .pipe(gulp.dest('public'))
        ;
	},
	jsmin:function(){
		gulp.src('public/**/*.js')
			.pipe(uglify())
			.on('error', swallowError)
			.pipe(gulp.dest('public'))
		;
	},cssmin:function(){
		gulp.src('public/**/*.css')
			.pipe(cleanCss())
			.on('error', swallowError)
			.pipe(gulp.dest('public'))
		;
	}
}

// 清空public文件夹
gulp.task('clean',function(){
    return tasks.clean();
});
// css文件处理
gulp.task('revcss',function(){
	return tasks.revcss();
});
// js文件处理
gulp.task('revjs',function(){
	return tasks.revjs();
});
// js import
gulp.task('revimport',function(){
	return tasks.revimport();
});
// 图片文件处理
gulp.task('revimg',function(){
	return tasks.revimg();
});
//Html替换css、js文件版本
gulp.task('revhtml', function () {
    return tasks.revhtml();
});
//css替换背景图版本
gulp.task('revcssimg',['revimg'], function () {
    return tasks.revcssimg();
});
gulp.task('dev',['clean'], function (done) {
    condition = false;
    runSequence(
    	['clean'],
    	['revimg'],
        ['revcss'],
        ['revjs'],
        ['revhtml'],
        ['revcssimg'],
        // ['revimport'],
        done);
});

gulp.task('default',['dev']);

// css压缩
gulp.task('cssmin', function () {
    return tasks.cssmin();
});
// js压缩
gulp.task('jsmin', function () {
    return tasks.jsmin();
});

// js css压缩
gulp.task('min',['cssmin','jsmin']);

gulp.task('cleancss', function () {
  return del([
    'public/**/*.css',
  ]);
});
gulp.task('cleanjs', function () {
  return del([
    'public/**/*.js',
  ]);
});


//watch监控文件修改
var assetsExp = new RegExp('assets');
var cssExp = new RegExp('.css$');
var jsExp = new RegExp('.js$');
var jsonExp = new RegExp('.json$');
gulp.task('watch',function(){
	gulp.watch([filePaths.cssSrc,filePaths.jsSrc,filePaths.imgSrc,filePaths.jsonSrc,filePaths.htmlSrc,filePaths.phpSrc],function(e){
		// console.log(e);
		var isAssets = assetsExp.test(e.path);
		var isCss = cssExp.test(e.path);
    	var isJs = jsExp.test(e.path);
    	var isJson = jsonExp.test(e.path);
    	var publicPath = e.path.replace('assets','public');
    	// 如果监听到删除了assets静态文件目录中的文件
    	if(e.type == 'deleted'){
			gulp.src(publicPath,{read:false})
			.pipe(clean())
			console.log(e.path + ' del ok!');
    	}else{
    		if(isAssets){
	    		if(isJs){
	    			gulp.start('cleanjs');
	    			gulp.start('revjs');
	    		}else if(isCss){
	    			gulp.start('cleancss');
	    			gulp.start('revcss');
	    		}else if(isJson){
	    			gulp.start('revhtml');
	    		}
	    		else{
	    			gulp.start(['revimg','revhtml']);
	    		}
	    	}else{
	    		gulp.start(['revhtml']);
	    	}
    	}
	});
});





