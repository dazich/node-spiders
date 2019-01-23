const axios = require('axios')
const request = require('request')
const fs = require('fs');
const cheerio = require('cheerio')
const {decode} = require('./libs/encode');
const b = require('./libs/base64')

// http://jandan.net/ooxx/page-34
const baseUrl = 'http://jandan.net/ooxx';

start(baseUrl);

async function start(url) {
	const imgSrcArr = await getImgSrcArr(url);
	downlaod(imgSrcArr);
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

function downlaod(imgSrcArr) {
	imgSrcArr.forEach((v, i) => {
		const w = fs.createWriteStream(`./data/jiandan-${i}.jpg`);
		w.on('close', () => {
			console.error(`第${i}张下载完毕`);
		});
		request(v).pipe(w)
	})
}



