function load() {
	sendRequest("https://www.pressdemocrat.com/")
	.then((html) => {
		const script_regex = /<script\s+type="text\/javascript"\s*>\s*window\["feedPdListPda1251"\]\s*=\s*(.*?);<\/script>/;
		const script_match = html.match(script_regex);
		const articles = JSON.parse(script_match[1]).articles;

		var results = [];

		for (const article of articles) {
			const uri = article.href;
			const date = new Date(article.dates.published);
			const item = Item.createWithUriDate(uri, date);
			item.title = article.headline;
			item.body = '<p>' + article.description + '</p>';

			const name = article.byline.name;
			const identity = Identity.createWithName(name);
			item.author = identity;

			const image = article.images[0];
			const media = 'https://imengine.prod.srp.navigacloud.com/?uuid=' + image.uuid + '&type=primary&q=75&width=' + image.width;
			const attachment = MediaAttachment.createWithUrl(media);
			attachment.text = image.alt;
			item.attachments = [attachment];

			results.push(item);
		}

		processResults(results);
	})
	.catch((requestError) => {
		console.log(requestError);
	});
}
