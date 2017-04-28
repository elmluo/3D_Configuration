var fs = require('fs');							//文件读写模块
var path = require('path');						//系统路径模块
var url = require('url');
var gulp = require('gulp');
var livereload = require('gulp-livereload');	//实时刷新
var webserver = require('gulp-webserver');		//web服务

var path = "./" 

//web服务器
gulp.task('webserver', function() {
    gulp.src(path) 			//服务器目录（./代表根目录）
    .pipe(webserver({ 						//运行gulp-webserver
    	host: "localhost",					//主机名，默认 localhost
        port: 8008, 						//端口，默认 8000
        path: "/",							//路径，默认为 /
        livereload: {						//是否启用自动刷新，参数类型为 Boolean/Object，默认为false
			enable: true,					
            path: path
        }, 	
        directoryListing: {					//是否启用目录列表，参数类型为 Boolean/Object，默认为false
            enable: false,						
            path: path
        },	
        //fallback: './res',				//(未知)		
        open: true,							//是否自动打开网页，参数类型为 Boolean/Object，默认为false
        https: false,						//是否采用https协议，参数类型为 Boolean/Object，默认为false
        middleware: function(req, res, next) {		//连接中间件
            //mock local data
            var urlObj = url.parse(req.url, true),	//获取请求路径
                method = req.method;				//获取请求方法类型

            if (!urlObj.pathname.match(/^\/mock/)) { //不是mock开头的数据，直接next
                next();
                return;
            }
            var mockDataFile = path.join(__dirname, urlObj.pathname) + ".js";	//将多个参数合成一个path
            //检查文件是否存在
            fs.access(mockDataFile, fs.F_OK, function(err) {
                if (err) {
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({
                        "status": "没有找到此文件",
                        "notFound": mockDataFile
                    }));
                    return;
                }
                var data = fs.readFileSync(mockDataFile, 'utf-8');
                res.setHeader('Content-Type', 'application/json');
                res.end(data);
            });
            next();
        },
        proxies: []
    }));
});


// 默认任务
gulp.task('default', ['webserver']);