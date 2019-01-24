var request = require('request');
var axios = require('axios');
var fs = require('fs');
var path = require('path');

let count;
let downloadedCount = 0;  // 已下载数
let picArr = [];
let picLen;
let maxDownLoad = 10; // 最大并发下载数
let startTime;
let endTime;

const api = 'http://api.pmkoo.cn/aiss/suite/suiteList.do';

start(api);

async function start(url) {
	const {data, success} = await axios.post(url, {
		'page': 1,
		'userId': 153044
	}).then(e => e.data);
	
	if (!success) throw new Error('请求失败');
	
	picArr = getPicList(data.list);
	picLen = picArr.length;
	
	// maxDownLoad = picLen;
	
	startTime = new Date().getTime();
	makeDir(picArr);
	download();
}

function getPicList(list) {
	let res = [];
	list.forEach(item => {
		let nickname = item["author"]["nickname"]
		let catalog = item["source"]["catalog"]
		let name = item["source"]["name"]
		let issue = item["issue"]
		let pictureCount = item["pictureCount"]
		
		for (let i=0; i< pictureCount; i++) {
			let url = `http://aiss.obs.cn-north-1.myhwclouds.com/picture/${catalog}/${issue}/${i}.jpg`;
			
			// request(url).pipe(fs.createWriteStream(`./ais/${issue}-${nickname}.jpg`));
			let dir = path.resolve(name, `${issue}-${nickname}`);
			let filepath = path.join(dir, `${i}.jpg`);
			res.push({url, name: `${issue}-${nickname}-${i}`, dir, filepath})
		}
	})
	
	return res;
}

function download(arr) {
	// 最大并发
	for (let i=0; i<maxDownLoad; i++) {
		count = i;
		downloadOne();
	}
}

function downloadOne() {
	const currentIndex = count;
	if (downloadedCount >= picLen) {
		endTime = new Date().getTime();
		console.log(`全部下载完毕, 共耗时${((endTime - startTime)/1000).toFixed(1)}s`);
		return;
	}
	
	if (currentIndex > picLen) {
		// console.log(`没有更多资源`);
		return;
	}
	
	const {url, name, filepath} = picArr[currentIndex] || {};
	
	const w = fs.createWriteStream(filepath);
	w.on('pipe', (src) => {
		console.log(`${filepath}正在下载:${currentIndex + 1}/${picLen}`);
	});
	w.on('close', () => {
		console.log(`${filepath}下载完毕:${currentIndex + 1}/${picLen}`);
		count = count + 1;
		downloadedCount++;
		downloadOne();
	})
	request(url).pipe(w)
}

function makeDir(arr) {
	const root = path.resolve();
	arr.forEach(e => {
		const {dir} = e;
		const [empty, dir1, dir2] = dir.split(root)[1].split('\\');
		try {
			fs.mkdirSync(dir1);
			// console.log(`创建目录${dir1}成功`);
		} catch (e) {
			// console.log(`目录${dir1}已存在:`);
			try {
				fs.mkdirSync(`${dir1}/${dir2}`);
				// console.log(`创建目录${dir1}/${dir2}成功`);
			} catch (e) {
				// console.log(`目录${dir1}/${dir2}已存在`);
			}
		}
	})
}