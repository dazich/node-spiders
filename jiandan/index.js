const axios = require('axios')
const request = require('request')
const fs = require('fs');
const cheerio = require('cheerio')
const {decode} = require('./libs/encode');
const b = require('./libs/base64')

let count;
let downloadedCount = 0;  // 已下载数
let picArr = [];
let picLen;
let maxDownLoad = 5; // 最大并发下载数
let startTime;
let endTime;
let crawlPage = 3; // 要爬取的页数  0 为爬取所有

// http://jandan.net/ooxx/page-34
const baseUrl = 'http://jandan.net/ooxx';

start(baseUrl);

async function start(url) {
	const pageAmount = +await getPageAmount(url) + 1;
	crawlPage = crawlPage || pageAmount;
	
	for(let i=1; i <= crawlPage; i++) {
		console.log(`正在获取第${i}页图片数据...`);
		const arr = await getImgSrcArr(`${baseUrl}/page-${i}`);
		await new Promise(r => setTimeout(() => r(), Math.random()*200));
		picArr = picArr.concat(arr);
		console.log(`第${i}页数据获取完毕。`);
	}
	
	picLen = picArr.length;
	console.log(`共获取${picLen}条数据`);
	
	startTime = new Date().getTime();
	download(picArr);
}

async function getPageAmount(url) {
	return axios(url).then(e => {
		const $ = cheerio.load(e.data);
		return $('span[class=current-comment-page] + a').html();
	})
}
async function getImgSrcArr(url) {
	return axios(url).then(e => {
		const $ = cheerio.load(e.data);
		const hashSpan = $('span[class=img-hash]');
		const imgSrcArr = [];
		hashSpan.map((i, el) => {
			const hash = $(el).text();
			const src = 'http:' + decode(hash);
			imgSrcArr.push(src);
		})
		// console.log(imgSrcArr);
		
		return imgSrcArr;
	})
}

function download() {
	// 控制并发
	for (let i=0; i<maxDownLoad; i++) {
		count = i;
		downloadOne();
	}
}

function downloadOne() {
	const currentIndex = count;
	console.log(`已下载${downloadedCount}/${picLen}`)
	if (downloadedCount >= picLen) {
		endTime = new Date().getTime();
		console.log(`全部下载完毕, 共耗时${((endTime - startTime)/1000).toFixed(1)}s`);
		return;
	}
	
	if (currentIndex > picLen - 1) {
		return;
	}
	
	console.log(`准备下载第${currentIndex}张照片`)
	const v = picArr[currentIndex];
	const type = v.substring(v.lastIndexOf('.') + 1) || 'jpg';
	const w = fs.createWriteStream(`./data/jiandan-${currentIndex}.${type}`);
	w.on('close', () => {
		// console.error(`第${currentIndex}张下载完毕${v}`);
		count = count + 1;
		downloadedCount++;
		downloadOne()
	});
	request(v).pipe(w)
}



