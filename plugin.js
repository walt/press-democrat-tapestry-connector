function load() {
	sendRequest("https://www.pressdemocrat.com/")
	.then((html) => {
		const debug = false;
		const results = [];

		const articleRegex = /<article.*?>(.*?)<\/article>/gs;
		const timestampRegex = /data-timestamp="(\d+)"/;
		const urlRegex = /href="([^"]+)"/;
		const titleRegex = /title="([^"]+)"/;
		const excerptRegex = /<div class="excerpt">(.*?)<\/div>/s;
		const imageSrcRegex = /src="([^"]+)"/;
		const imageDataSrcRegex = /data-src="([^"]+)"/;

		let match;

		while ((match = articleRegex.exec(html)) !== null) {
			if (!match[1]) {
				console.log(match);
				continue;
			}

			const content = match[1];

			const urlMatch = content.match(urlRegex);
			const timestampMatch = match[0].match(timestampRegex);
			const titleMatch = content.match(titleRegex);
			const excerptMatch = content.match(excerptRegex);
			const imageSrcMatch = content.match(imageSrcRegex);
			const imageDataSrcMatch = content.match(imageDataSrcRegex);

			let url = null;
			let date = null;
			let title = null;
			let excerpt = null;
			let image = null;

			if (urlMatch && urlMatch[1]) {
				url = urlMatch[1];
				if (debug) console.log(url);
			} else {
				if (debug) console.log("-- URL NOT FOUND --");
			}

			if (timestampMatch && timestampMatch[1]) {
				date = new Date(fixTimestamp(timestampMatch[1] * 1000));
				if (debug) console.log(date);
			} else {
				if (debug) console.log("-- DATE NOT FOUND --");
			}

			if (titleMatch && titleMatch[1]) {
				title = titleMatch[1];
				if (debug) console.log(title);
			} else {
				if (debug) console.log("-- TITLE NOT FOUND --");
			}

			if (excerptMatch && excerptMatch[1]) {
				excerpt = `<p>${excerptMatch[1].trim()}</p>`;
				if (debug) console.log(excerpt);
			} else {
				if (debug) console.log("-- Excerpt not found --");
			}

			if (imageSrcMatch && imageSrcMatch[1]) {
				if (!imageSrcMatch[1].startsWith("data:")) {
					image = imageSrcMatch[1];
					if (debug) console.log(image);
				} else {
					if (imageDataSrcMatch && imageDataSrcMatch[1]) {
						image = imageDataSrcMatch[1];
						if (debug) console.log(image);
					}
				}
			}
			if (debug && !image) console.log("-- Image not found --");

			if (debug) console.log("");

			if (url && date) {
				const item = Item.createWithUriDate(url, date);

				if (title) item.title = title;
				if (excerpt) item.body = excerpt;

				if (image) {
					const attachment = MediaAttachment.createWithUrl(image);
					item.attachments = [attachment];
				}

				results.push(item);
			}
		}

		processResults(results);
	})
	.catch((requestError) => {
		processError(requestError);
	});
}

function fixTimestamp(ts) {
	const wrongDate = new Date(ts);
	const wallClockStr = wrongDate.toISOString().slice(0, 19);

	const formatter = new Intl.DateTimeFormat("en-US", {
		timeZone: "America/Los_Angeles",
		timeZoneName: "shortOffset",
	});
	const parts = formatter.formatToParts(wrongDate);
	const offsetStr = parts.find(p => p.type === "timeZoneName").value;
	const offsetHours = parseInt(offsetStr.replace("GMT", ""), 10);

	const correctedTs = wrongDate.getTime() - offsetHours * 3600 * 1000;
	return new Date(correctedTs);
}
