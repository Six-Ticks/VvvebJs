$(document).ready(function () {

	// build the page folders on load
	stBuildPageFolders();

	var folder_select = $('select.st-parent-folder-select');
	folder_select.on('mousedown', function() {

        // loop through all options and set their text to the prefixed version
        $(this).find('option').each(function() {
            $(this).text($(this).data('prefixed-name'));
        });
    });

	folder_select.on('change', function() {

        // get just the one option that was selected
        var selectedOption = $(this).find('option:selected');

        // set the selected option's text to the clean version
        selectedOption.text(selectedOption.data('clean-name'));

		// update the link preview
		stUpdatePageLinkPreview();
    });

	$('#st-new-folder').submit(function (e) {
		e.preventDefault();

		// get the folder details
		var folderName = $(this).find('input[name="title"]').val();
		var parent = $(this).find('select[name="parent"]').val();

		// make the ajax call to create the folder
		stAjaxCall('createFolder', {
			name: folderName,
			parent: parent
		}, 'POST', true).then(async (response) => {
			if(response && response.success) {

				// close the modal
				$('#st-new-folder-modal').modal('hide');

				// reload the pages
				stGetPages();

				// rebuild the page folders
				stBuildPageFolders();
			}
		});
	});

	$('#new-page-modal input[name="url"]').data('changed', false);
	$('#new-page-modal input[name="url"]').on('input', function() {

		// get the page title
		var title = $('#new-page-modal input[name="title"]').val();
		var pageLink = stBuildPageLink(title);

		// check if the link matches the built link
		if($(this).val() != pageLink) {

			// mark as changed
			$(this).data('changed', true);
		} else {

			// mark as not changed
			$(this).data('changed', false);
		}

		// update the link preview
		stUpdatePageLinkPreview();
	});

	$('#new-page-modal input[name="url"]').on('change', function() {

		// if empty, mark as not changed and build from title
		if($(this).val() == '') {
			var title = $('#new-page-modal input[name="title"]').val();
			var link = stBuildPageLink(title);
			$('#new-page-modal input[name="url"]').val(link);
			$(this).data('changed', false);

			// update the link preview
			stUpdatePageLinkPreview();
		}
	});

	$('#new-page-modal input[name="title"]').on('input', function() {

		// check that the link hasn't been manually changed
		var linkChanged = $('#new-page-modal input[name="url"]').data('changed');
		var title = $(this).val();
		var pageLink = stBuildPageLink(title);

		// only update the link if it hasn't been changed manually or it matches the built link
		if(!linkChanged) {
			$('#new-page-modal input[name="url"]').val(pageLink);
		} else {

			// check if the link now matches the built link
			var currentLink = $('#new-page-modal input[name="url"]').val();
			if(currentLink == pageLink
				|| currentLink == ''
			) {

				// mark as not changed
				$('#new-page-modal input[name="url"]').data('changed', false);
			}
		}

		// update the link preview
		stUpdatePageLinkPreview();
	});

	
});

function stUpdatePageLinkPreview() {

	// get the page link value
	var link = $('#new-page-modal input[name="url"]').val();

	// get the selected folder
	var selectedFolder = $('#new-page-modal select[name="folder"] option:selected');
	var folderLink = selectedFolder.attr('data-link');

	// check if the folder has a parent
	var parent = selectedFolder.data('parent');
	while(parent) {

		// get the parent option
		var parentOption = $('#new-page-modal select[name="folder"] option[value="' + parent + '"]');

		// prepend the parent link
		folderLink = parentOption.attr('data-link') + '/' + folderLink;

		// get the next parent
		parent = parentOption.data('parent');
	}

	// build the full link
	var fullLink = website_url;

	// remove any trailing slash
	if(fullLink.slice(-1) == '/') {
		fullLink = fullLink.slice(0, -1);
	}

	// add the folder & link
	if(folderLink) {
		fullLink += '/' + folderLink;
	}
	if(link) {
		fullLink += '/' + link;
	}

	// add a trailing slash if not present
	if(fullLink.slice(-1) != '/') {
		fullLink += '/';
	}

	// set the preview text
	$('#st-page-link-preview').text(fullLink);
}

function stBuildPageLink(title) {
	var link = title.toLowerCase().trim()
		.replace(/[^a-z0-9\s-]/g, '')
		.replace(/\s+/g, '-')
		.replace(/-+/g, '-');
	return link;
}

function stBuildPageFolders() {

	// get a list of available page folders
	stAjaxCall('getPageFolders', {}, 'GET').then(async (response) => {
		if(response) {
			var folderSelect = $('.st-parent-folder-select');
			folderSelect.each(function () {
				var currentFolder = $(this);

				// clear the existing options
				currentFolder.empty();

				// add a blank option
				var blankOption = $('<option></option>')
					.attr('value', '')
					.attr('selected', 'selected')
					.text('- none -');
				currentFolder.append(blankOption);

				// loop through the folders and add them to the select
				if(Object.keys(response).length) {
					Object.keys(response).forEach(function(folder) {
						var curr_folder = response[folder];
						stAddFolderOptions(currentFolder, curr_folder);
					});
				}
			});
		}
	});
}

function stAddFolderOptions(selectElement, folder, level = 0, parent = "") {

	// build the icons for the level
	var prefix = '';
    for(var i = 0; i < level; i++) {

        // set 3 non-breaking spaces per level
        prefix += '\u00A0\u00A0\u00A0';
    }

	// add an icon for child options
	if (level > 0) {
        prefix += '└─ ';
    }

	// get the clean & prefixed names
	var cleanName = folder.name;
    var prefixedName = prefix + cleanName;

	// build the option element
	var option = $('<option></option>')
		.attr('value', folder.id)
		.attr('data-link', folder.link)
		.text(prefixedName)
		.data('clean-name', cleanName)
		.data('prefixed-name', prefixedName);

	// add the parent id if it exists
	if(parent != "") {
		option.data('parent', parent);
	}

	// add the option to the select element
	selectElement.append(option);

	// check for child folders
	if(folder.children && Object.keys(folder.children).length) {
		level++;

		// loop through the child folders
		Object.keys(folder.children).forEach(function(childKey) {
			stAddFolderOptions(selectElement, folder.children[childKey], level, folder.id);
		});
	}
}


var st_forms = {};

function stAjaxCall(a, d = {}, t = 'GET', alert = false) {

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
			error: function(response) {
				console.error('Ajax call failed:', a);
				if(alert) {

					// check if the response is valid JSON
					var r = (response.responseJson && typeof response.responseJSON === 'object') ? response.responseJSON : response.responseText;
					var alert_message = 'An error occurred while processing your request.';
					if (typeof r === 'string') {
						try {
							r = JSON.parse(r);
							if(r && r.message) {
								alert_message = r.message;
							}
							if(r && r.errors) {
								alert_message += '\n\n' + r.errors.join('\n');
							}
						} catch (e) {
							console.error('Invalid JSON response:', r);
						}
					}
					displayToast("bg-danger", "Error", alert_message);
				}
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
var website_url = "";
stAjaxCall('getFilePath', [], 'GET').then(async (response) => {
	if(response.docinc) {
		docinc = response.docinc;
		mediaPath = docinc.replace(/^.*?\/public\//, '../../');
		if(response.doclink) {
			doclink = response.doclink;
		}
	}

	// check for a page link
	if(response.website_url) {
		website_url = response.website_url;
	}
});

function stGetPages() {
	let pages = {};

	stAjaxCall('getPages', {}, 'GET').then(async (response) => {

		Vvveb.Gui.init();
		Vvveb.FileManager.init();
		Vvveb.SectionList.init();
		Vvveb.TreeList.init();
		Vvveb.Breadcrumb.init();
		Vvveb.CssEditor.init();

		// build the folders in the file manager
		if(response && response.folders) {
			Object.keys(response.folders).forEach(function(folder) {
				var curr_folder = response.folders[folder];
				stAddFolder(curr_folder);
			});
		}

		// build the pages object from the response
		if(response && response.pages) {
			response.pages.forEach(function (page) {
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
		Vvveb.Builder.init(pages[firstPage]["url"], function () {});

		Vvveb.FileManager.addPages(pages);
		Vvveb.FileManager.loadPage(pages[firstPage]["name"]);
		Vvveb.Gui.toggleRightColumn(false);
		Vvveb.Breadcrumb.init();
	});
}

function stAddFolder(folder, parent = "") {

	// add the parent folder
	Vvveb.FileManager.addFolder(folder.name, folder.id, parent);

	// check for any children
	if(folder.children) {
		Object.keys(folder.children).forEach(function(childKey) {
			var child_folder = folder.children[childKey];
			stAddFolder(child_folder, folder.id);
		});
	}
}