$(document).ready(function () {
});

var st_forms = {};

function stAjaxCall(a, d = {}, t = 'GET') {

	// get the current page url
	var url = new URL(window.location.href);

	// get the i & w parameters from the url
	var i = url.searchParams.get('i');
	var w = url.searchParams.get('w');

	// get the root url
	url = url.origin + '/';

	// run the ajax call
	return new Promise((resolve, reject) => {
		$.ajax({
			url: url + 'process/vvveb.php',
			type: t,
			data: {
				i: i,
				w: w,
				a: a,
				d: JSON.stringify(d)
			},
			success: function(response) {

				// check if the response is valid JSON
				var r = response;
				if (typeof response === 'string') {
					try {
						r = JSON.parse(response);
					} catch (e) {
						console.error('Invalid JSON response:', response);
						reject();
						return;
					}
				}
				resolve(r);
			},
			error: function() {
				console.error('Ajax call failed:', a);
				reject();
			}
		});
	});
}

var mediaPath = "/media/";
var docinc = "";
var doclink = window.location.href;
var mediaScanUrl = "scan.php";
var uploadUrl = "upload.php";
stAjaxCall('getFilePath', [], 'GET').then(async (response) => {
	if(response.docinc) {
		docinc = response.docinc;
		mediaPath = docinc.replace(/^.*?\/public\//, '../../');
		if(response.doclink) {
			doclink = response.doclink;
		}
	}
});

function stGetPages() {
	let pages = {};
	stAjaxCall('getPages', {}, 'GET').then(async (response) => {

		// build the pages object from the response
		if(response && response.length) {
			response.forEach(function (page) {
				if(
					(page.url == undefined
						|| page.url == null
						|| page.url == ''
					)
					&& page.title == "Home"
				) {
					page.url = "/";
				}
				if (page.title && page.url && page.id) {
					pages[page.title] = {
						id: page.id,
						name: page.title,
						file: page.url,
						title: page.title,
						url: page.url,
						folder: page.folder || null,
						description: page.description || ''
					};
				}
			});
		}

		let firstPage = Object.keys(pages)[0];
		Vvveb.Builder.init(pages[firstPage]["url"], function () {

		});

		Vvveb.Gui.init();
		Vvveb.FileManager.init();
		Vvveb.SectionList.init();
		Vvveb.TreeList.init();
		Vvveb.Breadcrumb.init();
		Vvveb.CssEditor.init();

		Vvveb.FileManager.addPages(pages);
		Vvveb.FileManager.loadPage(pages[firstPage]["name"]);
		Vvveb.Gui.toggleRightColumn(false);
		Vvveb.Breadcrumb.init();
	});
}

// test commit