$(document).ready(function () {

	// set up the article Folder fields (New page + Page Details) before the folders load
	stInitArticleFolderFields();

	// load the folder paths used for the URL folder suggestions
	stLoadFolderPaths();

	// suggest existing folders while typing a page URL
	stFolderSuggest($('#new-page-modal input[name="url"]'), $('#new-page-modal .st-folder-suggestions'), function() {
		return stBuildPageLink($('#new-page-modal input[name="title"]').val());
	}, function() {
		return $('#new-page-modal select[name="type"]').val() || 'page';
	});
	stFolderSuggest($('#st-page-details-link'), $('#st-page-details-folder-suggestions'), function() {
		return stSplitPagePath(stPageDetailsModal._originalLink).slug;
	}, function() {
		return stPageDetailsModal._type || 'page';
	});

	// build the file manager nav items
	stBuildNavItems();

	// close the right panel
	Vvveb.Gui.toggleRightColumn(false);

	if($('#new-page-modal').length) {
		$('#new-page-modal').on('shown.bs.modal', function () {
			if(!$(this).data('templates-loaded')) {
				loadTemplates();
			}

			// refresh the article folders (new ones may have been created)
			stNewArticleFolder?.build();
		});
	}


	$('#st-new-template').submit(function (e) {
		e.preventDefault();

		// first, get the page html
		var html = Vvveb.Builder.getHtml();

		// get the template details
		var templateName = $(this).find('input[name="title"]').val();

		// make the ajax call to create the template
		stAjaxCall('createTemplate', {
			name: templateName,
			html: html
		}, 'POST', true).then(async (response) => {
			if(response && response.success) {

				// close the modal
				$('#st-new-template-modal').modal('hide');

				// reload the templates
				stGetPages('template');

				// show success message
				displayToast("bg-success", "Success", "Template created successfully.");
			}
		});
	});

	$('#new-page-modal input[name="url"]').data('changed', false);
	$('#new-page-modal input[name="url"]').on('input', function() {

		// get the page title
		var title = $('#new-page-modal input[name="title"]').val();
		var pageLink = stBuildPageLink(title);

		// keep the article Folder field in step with a typed folder path
		stNewArticleFolder?.sync();

		// check if the page slug (the part after any folder path) matches the built link
		if(stSplitPagePath($(this).val()).slug != pageLink) {

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

		// only update the link if it hasn't been changed manually or it matches the built link - any
		// folder path typed before the slug is kept
		var urlParts = stSplitPagePath($('#new-page-modal input[name="url"]').val());
		if(!linkChanged) {
			$('#new-page-modal input[name="url"]').val(urlParts.prefix + pageLink);
		} else {

			// check if the link now matches the built link
			var currentLink = urlParts.slug;
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

	$('#new-page-modal select[name="type"]').on('change', function() {
		var selectedType = $(this).val();
		switch(selectedType) {

			case 'article':
				stNewArticleFolder?.show();
				$('#new-page-modal input[name="url"]').closest('.row').show();
				stUpdatePageLinkPreview();
				changeFieldLabel(
					$('#new-page-modal input[name="title"]').closest('.row').find('label'),
					$('#new-page-modal input[name="title"]'),
					'Article Name',
					'My Article'
				);
				$('#new-page-modal form .btn[type="submit"]').html('<i class="la la-check"></i> Create Article');
				changeFieldLabel(
					$('#new-page-modal input[name="url"]').closest('.row').find('label'),
					$('#new-page-modal input[name="url"]'),
					'Article Link',
					'folder/my-article'
				);
				break;
			case 'page':
				stNewArticleFolder?.hide();
				$('#new-page-modal input[name="url"]').closest('.row').show();
				stUpdatePageLinkPreview();
				changeFieldLabel(
					$('#new-page-modal input[name="title"]').closest('.row').find('label'),
					$('#new-page-modal input[name="title"]'),
					'Page Name',
					'My Page'
				);
				$('#new-page-modal form .btn[type="submit"]').html('<i class="la la-check"></i> Create Page');
				changeFieldLabel(
					$('#new-page-modal input[name="url"]').closest('.row').find('label'),
					$('#new-page-modal input[name="url"]'),
					'Page Link',
					'folder/my-page'
				);
				break;
			case 'template':
				stNewArticleFolder?.hide();
				$('#new-page-modal input[name="url"]').closest('.row').hide();
				stUpdatePageLinkPreview();
				changeFieldLabel(
					$('#new-page-modal input[name="title"]').closest('.row').find('label'),
					$('#new-page-modal input[name="title"]'),
					'Template Name',
					'My Template'
				);
				$('#new-page-modal form .btn[type="submit"]').html('<i class="la la-check"></i> Create Template');
				break;
			case 'menu':
				stNewArticleFolder?.hide();
				$('#new-page-modal input[name="url"]').closest('.row').hide().val('');
				$('#new-page-modal input[name="template"]').closest('.mb-3').hide().val('');
				stUpdatePageLinkPreview();
				changeFieldLabel(
					$('#new-page-modal input[name="title"]').closest('.row').find('label'),
					$('#new-page-modal input[name="title"]'),
					'Menu Name',
					'Main Menu'
				);
				$('#new-page-modal form .btn[type="submit"]').html('<i class="la la-check"></i> Create Menu');
				break;
			case 'footer':
				stNewArticleFolder?.hide();
				$('#new-page-modal input[name="url"]').closest('.row').hide().val('');
				$('#new-page-modal input[name="template"]').closest('.mb-3').hide().val('');
				stUpdatePageLinkPreview();
				changeFieldLabel(
					$('#new-page-modal input[name="title"]').closest('.row').find('label'),
					$('#new-page-modal input[name="title"]'),
					'Footer Name',
					'Main Footer'
				);
				$('#new-page-modal form .btn[type="submit"]').html('<i class="la la-check"></i> Create Footer');
				break;
		}

		function changeFieldLabel(label, field, name, placeholder = "") {
			if(field.length) {
				label.text(name);
			}
			if(placeholder !== "") {
				field.attr('placeholder', placeholder);
			}
		}
	});

	$('#st-search-input').on('input change', function(e) {
		e.preventDefault();
		var searchTerm = $(this).val().toLowerCase();
		var $allPages = $('#filemanager .file-tree.active li');

		// reset the list if the search is cleared
		if (searchTerm === '') {
			$allPages.show();
			return;
		}

		searchPages(searchTerm, $allPages);
	});

	$('#filemanager .clear-backspace').on('click', function(e) {
		e.preventDefault();
		$('#st-search-input').val('').trigger('input');
	});

	$('#filemanager-tabs .nav-link').on('click', function(e) {

		// get the elements data-type attribute to determine which tab was clicked
		var target = $(this).data('type');
		if(target) {
			stGetPages(target);

			// set the #new-page-modal select[name="type"] value to match the selected tab
			$('#new-page-modal select[name="type"]').val(target).trigger('change');
		}
	});
});

function stBuildNavItems() {
	const $container = $('.tab-slider-container');
	if($container.length) {
		const $slider = $container.find('#tabSlider');
		const $slideLeft = $container.find('#slideLeft');
		const $slideRight = $container.find('#slideRight');

		function updateArrowStates() {
			const scrollLeft = $slider.scrollLeft();
			const maxScroll = $slider[0].scrollWidth - $slider.innerWidth();

			// Disable left arrow if at the start
			$slideLeft.prop('disabled', scrollLeft <= 0);

			// Disable right arrow if at the end (using a 1px buffer for rounding issues)
			$slideRight.prop('disabled', scrollLeft >= maxScroll - 1);
		}

		// Initial check
		updateArrowStates();

		// Check states whenever the user scrolls
		$slider.on('scroll', updateArrowStates);

		$slideLeft.on('click', function() {
			$slider.scrollLeft($slider.scrollLeft() - $slider.innerWidth());
		});

		$slideRight.on('click', function() {
			$slider.scrollLeft($slider.scrollLeft() + $slider.innerWidth());
		});
	}
}

function loadTemplates() {

    // get the custom templates
    stAjaxCall('getTemplates', {}, 'GET').then(async (response) => {
        if(response && response.templates) {

            // merge templates and folders into the treeselect format
            var treeselectData = formatTemplatesForTreeselect(response.folders || {}, response.templates);

            // get the template container
            let templateContainers = $('.st-template-container');

            templateContainers.each(function() {
                let containerDiv = this; // Raw DOM element
                let $container = $(this); // jQuery object

                // only load the templates if we haven't already
                if(!$container.data('templates-loaded')) {

                    // clear container in case of re-render
                    containerDiv.innerHTML = '';

                    // initialise treeselect
                    let domEl = new Treeselect({
                        parentHtmlContainer: containerDiv,
                        value: null,
                        options: treeselectData,
                        isSingleSelect: true,
                        placeholder: 'Select a template',
                        searchable: true,
						disabledBranchNodes: true,
						inputCallback: (selectedValue) => {

							// check if the selected item is a folder
							if (selectedValue && String(selectedValue).startsWith('folder_')) {

							    // clear the treeselect field so it doesn't stay selected
							    domEl.updateValue(null);

							    // clear the hidden input to be safe
							    $container.parent().find('.st-template-input').val('');
							    return;
							}

							// update the hidden input for form submission
							$container.parent().find('.st-template-select').val(selectedValue);
							console.log('User selected template ID:', selectedValue);
						}
                    });

                    // mark templates as loaded
                    $container.data('templates-loaded', true);

                    // add the same attribute to the nearest modal, if there is one
                    var nearestModal = $container.closest('.modal');
                    if(nearestModal.length) {
                        nearestModal.data('templates-loaded', true);
                    }
                }
            });
        }
    });
}

/**
 * Creates the Treeselect options
 */
function formatTemplatesForTreeselect(folders, templates) {
    var folderToTemplates = {};
    var rootTemplates = [];

    // group templates by their parent folder ID
    if (templates) {
        Object.keys(templates).forEach(function(key) {
            var tpl = templates[key];

            // if it belongs to a folder, push to that folder's array
            if (tpl.folder && tpl.folder !== "") {
                if (!folderToTemplates[tpl.folder]) {
                    folderToTemplates[tpl.folder] = [];
                }
                folderToTemplates[tpl.folder].push(tpl);
            } else {

                // otherwise, it sits at the root
                rootTemplates.push(tpl);
            }
        });
    }

    // recursive function to build the folder tree templates
    function buildFolderTree(folderObject) {
        if (!folderObject || Object.keys(folderObject).length === 0) {
            return [];
        }
        return Object.keys(folderObject).map(function(key) {
            var folder = folderObject[key];
            var node = {
                name: folder.name,
                value: 'folder_' + folder.id,
				isGroupSelectable: false
            };

            var children = [];

            // add child folders recursively
            if (folder.children && Object.keys(folder.children).length > 0) {
                children = children.concat(buildFolderTree(folder.children));
            }

            // add templates that belong to this specific folder
            if (folderToTemplates[folder.id]) {
                var templateNodes = folderToTemplates[folder.id].map(function(t) {
                    return {
                        name: t.title,
                        value: t.id
                    };
                });
                children = children.concat(templateNodes);
            }

            // if the folder has either child folders or templates, attach them
            if (children.length > 0) {
                node.children = children;
            }

            return node;
        });
    }

    // build the final tree structure
    var finalTree = [];

    // add all the structured folders
    if (folders) {
        finalTree = finalTree.concat(buildFolderTree(folders));
    }

    // add root level templates at the very bottom
    var rootTemplateNodes = rootTemplates.map(function(t) {
        return { name: t.title, value: t.id };
    });
    finalTree = finalTree.concat(rootTemplateNodes);

    return finalTree;
}

function searchPages(searchTerm, list, index = 1) {
    let found = false;

    // loop through all file manager items and toggle visibility based on the search term
    list.each(function() {

        // check this is not a nested list
        if ($(this).parents('ol').length != index) {
            return;
        }

        const isFolder = $(this).hasClass('folder');
        var itemName = (isFolder) ? ($(this).data('folder') || '').toLowerCase() : ($(this).data('page') || '').toLowerCase();

        if (itemName.includes(searchTerm)) {
            found = true;
            $(this).show();

            // if a folder matches, make sure all of its contents are shown
            if (isFolder) {
                $(this).find('li').show();
            }
        } else {
            if (!isFolder) {
                $(this).hide();
            } else {

                // if it's a folder, also check if any child items match the search term
                var childList = $(this).find('li');

                if (childList.length) {
                    var matchingChild = searchPages(searchTerm, childList, index + 1);

                    if (matchingChild) {
                        found = true;
                        $(this).show();
                    } else {
                        $(this).hide();
                    }
                } else {
                    $(this).hide();
                }
            }
        }
    });

    return found;
}

function stUpdatePageLinkPreview() {

	// get the typed page path (folder path + page slug)
	var link = ($('#new-page-modal input[name="url"]').val() || '').trim().replace(/^\/+|\/+$/g, '');

	// build the full link
	var fullLink = website_url;

	// remove any trailing slash
	if(fullLink.slice(-1) == '/') {
		fullLink = fullLink.slice(0, -1);
	}

	// add the path
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

/**
 * stSplitPagePath: Splits a typed page path into the folder prefix (including the trailing slash) and the page slug.
 *
 * @param {string} path - E.g. "news/2026/my-page"
 * @returns {{prefix: string, folder: string, slug: string}}
 */
function stSplitPagePath(path) {
	path = (path || '').replace(/^\/+/, '');
	var index = path.lastIndexOf('/');
	if(index === -1) {
		return { prefix: '', folder: '', slug: path };
	}
	return {
		prefix: path.substring(0, index + 1),
		folder: path.substring(0, index).replace(/\/+$/, ''),
		slug: path.substring(index + 1)
	};
}

function stBuildPageLink(title) {
	var link = title.toLowerCase().trim()
		.replace(/[^a-z0-9\s-]/g, '')
		.replace(/\s+/g, '-')
		.replace(/-+/g, '-');
	return link;
}

// the website's page folders as {path, type} (E.g. {path: "news/2026", type: "article"}), used for the URL
// folder suggestions - type is the folder's effective type: its own, its nearest typed ancestor's, or "page"
var stFolderPaths = [];

// the raw folder tree from getPageFolders (used for the article folder tree select)
var stFolderTree = {};

// the article Folder tree selects in the New page and Page Details modals (see stArticleFolderField)
var stNewArticleFolder = null;
var stDetailsArticleFolder = null;

/**
 * stLoadFolderPaths: Loads the website's page folders and flattens them into full paths.
 */
function stLoadFolderPaths() {
	stAjaxCall('getPageFolders', {}, 'GET').then(function(response) {
		var paths = [];
		var addFolders = function(folders, parentPath, parentType) {
			if(!folders) {
				return;
			}
			Object.keys(folders).forEach(function(key) {
				var folder = folders[key];
				if(!folder || !folder.link) {
					return;
				}
				var path = parentPath ? parentPath + '/' + folder.link : folder.link;
				var type = folder.type || parentType || 'page';
				paths.push({ path: path, type: type });
				addFolders(folder.children, path, type);
			});
		};
		stFolderTree = response || {};
		addFolders(response, '', '');
		stFolderPaths = paths.sort(function(a, b) {
			return a.path.localeCompare(b.path);
		});
		stNewArticleFolder?.build();
		stDetailsArticleFolder?.build();
	}).catch(function() {});
}

/**
 * stBuildArticleFolderOptions: Builds the Treeselect options for the article folders - folders whose effective
 *  type is "article" (their own type, or their nearest typed ancestor's, or "page"), nested as in the folder
 *  tree. Non-article folders are skipped, with any article folders inside them moved up to their level.
 *
 * @param {object} folders - The folder tree (getPageFolders).
 * @param {string} parentPath - The parent folder's path.
 * @param {string} parentType - The parent folder's effective type.
 * @returns {Array}
 */
function stBuildArticleFolderOptions(folders, parentPath, parentType) {
	var options = [];
	if(!folders) {
		return options;
	}
	Object.keys(folders).forEach(function(key) {
		var folder = folders[key];
		if(!folder || !folder.link) {
			return;
		}
		var path = parentPath ? parentPath + '/' + folder.link : folder.link;
		var type = folder.type || parentType || 'page';
		var children = stBuildArticleFolderOptions(folder.children, path, type);
		if(type === 'article') {
			options.push({ name: folder.name, value: path, children: children });
		} else {
			options = options.concat(children);
		}
	});
	return options;
}

/**
 * stArticleFolderField: An article Folder field - a tree select (Treeselect) of the article folders, with
 *  sub-folders nested - tied to a page URL input. Choosing a folder puts its path in front of the page slug in
 *  the URL input, and typing a folder path in the URL input selects it (or clears it for a new folder).
 *
 * @param {object} opts
 * @param {jQuery} opts.row - The field's row (hidden unless the page is an article).
 * @param {jQuery} opts.container - The Treeselect container.
 * @param {jQuery} opts.hidden - The hidden input holding the chosen folder path.
 * @param {jQuery} opts.input - The page URL input.
 * @param {function} opts.isActive - Returns TRUE when the page is an article.
 * @param {function} [opts.defaultSlug] - Returns the slug to use when the URL has none.
 * @param {function} [opts.beforeApply] - Called before a chosen folder is written to the URL input.
 * @param {function} [opts.afterApply] - Called after a chosen folder is written to the URL input.
 * @returns {{build: function, sync: function, show: function, hide: function}}
 */
function stArticleFolderField(opts) {
	var tree = null;
	var syncing = false;

	var setValue = function(path) {
		opts.hidden.val(path || '');
		if(tree && typeof tree.updateValue === 'function') {
			syncing = true;
			try {
				tree.updateValue(path || null);
			} finally {
				syncing = false;
			}
		}
	};

	var apply = function(path) {
		if(typeof opts.beforeApply === 'function') {
			opts.beforeApply();
		}
		var slug = stSplitPagePath(opts.input.val()).slug || ((typeof opts.defaultSlug === 'function') ? (opts.defaultSlug() || '') : '');
		opts.input.val((path ? path + '/' : '') + slug).trigger('input');
		if(typeof opts.afterApply === 'function') {
			opts.afterApply();
		}
	};

	var field = {

		// (re)builds the tree select from the folder tree, keeping a still-valid choice
		build: function() {
			if(!opts.container.length || typeof Treeselect === 'undefined') {
				return;
			}
			var current = opts.hidden.val() || '';
			var exists = current !== '' && stFolderPaths.some(function(folder) {
				return folder.type === 'article' && folder.path === current;
			});
			opts.container[0].innerHTML = '';
			tree = new Treeselect({
				parentHtmlContainer: opts.container[0],
				value: exists ? current : null,
				options: stBuildArticleFolderOptions(stFolderTree, '', ''),
				isSingleSelect: true,
				searchable: true,
				placeholder: 'Choose a folder',
				inputCallback: function(path) {
					opts.hidden.val(path || '');
					if(!syncing) {
						apply(path || '');
					}
				}
			});
			opts.hidden.val(exists ? current : '');
			field.sync();
		},

		// selects the folder typed in the URL input (blank when it isn't an existing article folder)
		sync: function() {
			if(!opts.isActive()) {
				return;
			}
			var folder = stSplitPagePath(opts.input.val()).folder.toLowerCase();
			var match = stFolderPaths.find(function(item) {
				return item.type === 'article' && folder !== '' && item.path.toLowerCase() === folder;
			});
			var value = match ? match.path : '';
			if(value !== (opts.hidden.val() || '')) {
				setValue(value);
			}
		},

		show: function() {
			opts.row.removeClass('d-none');
			field.sync();
		},

		// hides and clears the field - it is only used for articles
		hide: function() {
			opts.row.addClass('d-none');
			setValue('');
		}
	};
	return field;
}

/**
 * stInitArticleFolderFields: Sets up the article Folder fields in the New page and Page Details modals.
 */
function stInitArticleFolderFields() {
	stNewArticleFolder = stArticleFolderField({
		row: $('#new-page-modal [data-key="article-folder"]'),
		container: $('#new-page-modal .st-article-folder-container'),
		hidden: $('#new-page-modal input[name="article_folder"]'),
		input: $('#new-page-modal input[name="url"]'),
		isActive: function() {
			return $('#new-page-modal select[name="type"]').val() === 'article';
		},
		defaultSlug: function() {
			return stBuildPageLink($('#new-page-modal input[name="title"]').val());
		},
		afterApply: function() {
			stUpdatePageLinkPreview();
		}
	});

	stDetailsArticleFolder = stArticleFolderField({
		row: $('#st-page-details-modal [data-key="details-article-folder"]'),
		container: $('#st-page-details-modal .st-details-article-folder-container'),
		hidden: $('#st-page-details-article-folder'),
		input: $('#st-page-details-link'),
		isActive: function() {
			return stPageDetailsModal._type === 'article';
		},
		defaultSlug: function() {
			return stSplitPagePath(stPageDetailsModal._originalLink).slug;
		},
		beforeApply: function() {

			// a folder change is a URL change - unlock the URL so it is saved
			stPageDetailsModal.unlockLink();
		}
	});

	// keep the Page Details Folder field in step with the typed URL
	$('#st-page-details-link').on('input', function() {
		stDetailsArticleFolder?.sync();
	});
}

/**
 * stFolderSuggest: Shows the existing folders that match what is being typed into a page URL input, so
 *  folders can be re-used by typing. Choosing a suggestion puts it in front of the page slug.
 *
 * @param {jQuery} input - The URL input.
 * @param {jQuery} container - The .st-folder-suggestions list-group shown below the input.
 * @param {function} [defaultSlug] - Returns a slug to use when the input has no slug yet (E.g. from the page title).
 * @param {function} [getType] - Returns the page type (E.g. "page", "article") - only folders of that type are suggested.
 */
function stFolderSuggest(input, container, defaultSlug, getType) {
	if(!input.length || !container.length) {
		return;
	}

	var hide = function() {
		container.addClass('d-none').empty();
	};

	var show = function() {
		var value = (input.val() || '').trim().replace(/^\/+/, '').toLowerCase();
		if(value === '' || input.prop('readonly')) {
			hide();
			return;
		}

		// match folders of this page type containing the typed text, skipping folders the path is already in
		var type = (typeof getType === 'function') ? (getType() || 'page') : 'page';
		var matches = stFolderPaths.filter(function(folder) {
			return folder.type === type
				&& folder.path.toLowerCase().indexOf(value) !== -1
				&& value.indexOf(folder.path.toLowerCase() + '/') !== 0;
		}).map(function(folder) {
			return folder.path;
		}).slice(0, 8);

		container.empty();
		if(!matches.length) {
			hide();
			return;
		}
		matches.forEach(function(path) {
			$('<button type="button" class="list-group-item list-group-item-action py-1 small"></button>')
				.append($('<i class="la la-folder me-1"></i>'))
				.append(document.createTextNode(path + '/'))
				.attr('data-path', path)
				.appendTo(container);
		});
		container.removeClass('d-none');
	};

	input.on('input focus', show);
	input.on('keydown', function(e) {
		if(e.key === 'Escape') {
			hide();
		}
	});
	input.on('blur', function() {

		// delay so a click on a suggestion still registers
		setTimeout(hide, 200);
	});

	// choosing a suggestion puts the folder in front of the page slug
	container.on('mousedown', '[data-path]', function(e) {
		e.preventDefault();
		var slug = stSplitPagePath(input.val()).slug;

		// a slug that only matched the folder name is the start of the folder, not the page slug
		if(slug && $(this).data('path').toLowerCase().indexOf(slug.toLowerCase()) !== -1 && (input.val() || '').indexOf('/') === -1) {
			slug = '';
		}
		if(!slug && typeof defaultSlug === 'function') {
			slug = defaultSlug() || '';
		}
		input.val($(this).data('path') + '/' + slug).trigger('input');
		hide();
		input.trigger('focus');
		if(typeof stUpdatePageLinkPreview === 'function') {
			stUpdatePageLinkPreview();
		}
	});
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

function stGetPages(type = 'page') {
	let pages = {};

	// hide the #select-actions element
	$('#select-actions').hide();

	stAjaxCall('getPages', {type: type}, 'GET').then(async (response) => {

		Vvveb.Gui.init();
		Vvveb.FileManager.init();
		Vvveb.SectionList.init();
		Vvveb.TreeList.init();
		Vvveb.Breadcrumb.init();
		Vvveb.CssEditor.init();

		// pages are listed flat - folders are only part of the page URL (see stFolderSuggest) - except for
		// articles, where the root article folders are shown as categories with each article under its root
		var rootOf = {};
		if(type === 'article' && response && response.folders) {
			var mapRoot = function(folder, rootId) {
				rootOf[folder.id] = rootId;
				if(folder.children) {
					Object.keys(folder.children).forEach(function(key) {
						mapRoot(folder.children[key], rootId);
					});
				}
			};
			Object.keys(response.folders).forEach(function(key) {
				var root = response.folders[key];
				if(!root || root.type !== 'article') {
					return;
				}
				Vvveb.FileManager.addFolder(root.name, root.id, '');
				mapRoot(root, root.id);
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
						folder: (type === 'article' && page.folder && rootOf[page.folder]) ? rootOf[page.folder] : null,
						description: page.description || '',
						type: page.type || 'page',
						full_url: page.full_url || '',
						publish_state: page.publish_state || ''
					};
				}
			});
		}

		let firstPage = Object.keys(pages)[0];
		if(firstPage) {
			Vvveb.Builder.init(pages[firstPage]["url"], function () {});
		} else {
			Vvveb.Builder.init("", function () {});
		}

		Vvveb.FileManager.addPages(pages);
		Vvveb.Builder.loadSplashscreen();
		// Vvveb.FileManager.loadPage(pages[firstPage]["name"]);
		// Vvveb.Gui.toggleRightColumn(false);
		Vvveb.Breadcrumb.init();
	});
}

window.stElementHighlightConfig = window.stElementHighlightConfig || {
	items: [
		{
			selector: "nav",
			label: "Navigation",
			color: "#de750c20",
			borderColor: "#de750c",
			labelTextColor: "#ffffff",
			labelBgColor: "#de750c"
		},
		{
			selector: "img",
			label: "Image",
			color: "rgba(14, 165, 233, 0.20)",
			borderColor: "#0284c7"
		},
		{
			selector: ".st-website-block",
			label: "Website Block",
			color: "rgba(14, 165, 233, 0.20)",
			borderColor: "#515151",
			labelTextColor: "#ffffff",
			labelBgColor: "#515151d3"
		},
		{
			selector: "a",
			label: "Link",
			color: "rgba(14, 165, 233, 0.20)",
			borderColor: "#515151",
			labelTextColor: "#ffffff",
			labelBgColor: "#515151d3"
		},
		{
			selector: "footer",
			label: "Footer",
			color: "rgba(14, 233, 116, 0.2)",
			borderColor: "#515151",
			labelTextColor: "#ffffff",
			labelBgColor: "#515151d3"
		},
	],
	defaultColor: "rgba(249, 115, 22, 0.20)",
	defaultBorderColor: "#ea580c",
	defaultLabelTextColor: "#ffffff",
	defaultLabelBgColor: "rgba(15, 23, 42, 0.90)"
};

if (Array.isArray(window.stElementHighlightConfig.items)) {
	window.stElementHighlightConfig.items = window.stElementHighlightConfig.items.map(function(item) {
		let nextItem = { ...item };
		if (typeof nextItem.enabled === "undefined") {
			nextItem.enabled = true;
		}
		return nextItem;
	});
}

Vvveb.ElementHighlighter = {
	enabled: false,
	renderRaf: null,
	renderRafWindow: null,
	renderDebounceTimer: null,
	renderDebounceDelay: 40,
	hideMenuTimer: null,
	menuElement: null,
	isRendering: false,
	storageKey: "st.vvveb.elementHighlighter.state",
	styleId: "st-vvveb-element-highlight-style",
	overlayClass: "st-vvveb-highlight-overlay",
	labelClass: "st-vvveb-highlight-label",
	menuId: "st-element-highlight-menu",
	boundFrameWindow: null,

	init: function() {
		let self = this;

		if (self.isInitialised) {
			return;
		}

		self.isInitialised = true;
		self.loadState();
		self.initToggleMenu();
		self.syncButtonState();

		window.addEventListener("vvveb.iframe.loaded", function() {
			self.cancelPendingRender();
			self.bindFrameListeners();
			if (self.enabled) {
				self.requestRender();
			}
		});

		window.addEventListener("vvveb.getHtml.before", function() {
			self.clear();
		});

		window.addEventListener("vvveb.getHtml.after", function() {
			if (self.enabled) {
				self.requestRender();
			}
		});
	},

	bindFrameListeners: function() {
		let self = this;
		let frameWindow = window.FrameWindow;
		let frameDoc = window.FrameDocument;

		if (!frameWindow || !frameDoc || !frameDoc.body) {
			return;
		}

		if (self.boundFrameWindow !== frameWindow) {
			self.boundFrameWindow = frameWindow;

			frameWindow.addEventListener("scroll", function() {
				if (self.enabled) {
					self.requestRender();
				}
			});

			frameWindow.addEventListener("resize", function() {
				if (self.enabled) {
					self.requestRender();
				}
			});
		}

		if (self.observer) {
			self.observer.disconnect();
		}

		self.observer = new MutationObserver(function() {
			if (self.isRendering) {
				return;
			}

			if (self.enabled) {
				self.requestRender();
			}
		});

		self.observer.observe(frameDoc.body, {
			subtree: true,
			childList: true,
			attributes: true,
			attributeFilter: ["class", "style"]
		});
	},

	getItems: function() {
		let config = window.stElementHighlightConfig || {};
		let items = Array.isArray(config.items) ? config.items : [];

		return items.filter(function(item) {
			return item
				&& typeof item.selector === "string"
				&& item.selector.trim() !== ""
				&& item.enabled !== false;
		});
	},

	getConfigItems: function() {
		let config = window.stElementHighlightConfig || {};
		let items = Array.isArray(config.items) ? config.items : [];

		return items.filter(function(item) {
			return item && typeof item.selector === "string" && item.selector.trim() !== "";
		});
	},

	setItems: function(items) {
		if (!Array.isArray(items)) {
			return;
		}

		window.stElementHighlightConfig = window.stElementHighlightConfig || {};
		window.stElementHighlightConfig.items = items.map(function(item) {
			let nextItem = { ...item };
			if (typeof nextItem.enabled === "undefined") {
				nextItem.enabled = true;
			}
			return nextItem;
		});

		this.renderToggleMenu();
		this.saveState();

		if (this.enabled) {
			this.requestRender();
		}
	},

	loadState: function() {
		let rawState = null;

		try {
			rawState = window.localStorage.getItem(this.storageKey);
		} catch (error) {
			return;
		}

		if (!rawState) {
			return;
		}

		let state = null;
		try {
			state = JSON.parse(rawState);
		} catch (error) {
			return;
		}

		if (!state || typeof state !== "object") {
			return;
		}

		if (typeof state.enabled === "boolean") {
			this.enabled = state.enabled;
		}

		let config = window.stElementHighlightConfig || {};
		if (!Array.isArray(config.items)) {
			return;
		}

		let enabledMap = (state.items && typeof state.items === "object") ? state.items : {};
		config.items = config.items.map(function(item) {
			let nextItem = { ...item };
			let key = (nextItem.selector || "") + "::" + (nextItem.label || "");
			if (Object.prototype.hasOwnProperty.call(enabledMap, key)) {
				nextItem.enabled = !!enabledMap[key];
			}
			return nextItem;
		});
	},

	saveState: function() {
		let config = window.stElementHighlightConfig || {};
		let items = Array.isArray(config.items) ? config.items : [];
		let persistedItems = {};

		items.forEach(function(item) {
			if (!item || typeof item.selector !== "string") {
				return;
			}

			let key = item.selector + "::" + (item.label || "");
			persistedItems[key] = (item.enabled !== false);
		});

		let state = {
			enabled: this.enabled,
			items: persistedItems
		};

		try {
			window.localStorage.setItem(this.storageKey, JSON.stringify(state));
		} catch (error) {
			return;
		}
	},

	initToggleMenu: function() {
		let self = this;
		let button = document.getElementById("toggle-element-highlight-btn");

		if (!button || self.menuElement) {
			return;
		}

		let menu = document.createElement("div");
		menu.id = self.menuId;
		menu.className = "dropdown-menu";
		menu.style.position = "fixed";
		menu.style.zIndex = "2000";
		menu.style.minWidth = "240px";
		menu.style.maxWidth = "320px";
		menu.style.maxHeight = "280px";
		menu.style.overflow = "auto";
		menu.style.display = "none";

		document.body.appendChild(menu);
		self.menuElement = menu;
		self.renderToggleMenu();

		let showMenu = function() {
			self.clearMenuHideTimer();
			self.renderToggleMenu();
			self.positionToggleMenu();
			menu.style.display = "block";
			menu.classList.add("show");
		};

		let hideMenu = function() {
			self.clearMenuHideTimer();
			self.hideMenuTimer = window.setTimeout(function() {
				menu.classList.remove("show");
				menu.style.display = "none";
			}, 140);
		};

		button.addEventListener("mouseenter", showMenu);
		button.addEventListener("mouseleave", hideMenu);
		button.addEventListener("click", function() {
			self.hideToggleMenu();
		});

		menu.addEventListener("mouseenter", function() {
			self.clearMenuHideTimer();
		});
		menu.addEventListener("mouseleave", hideMenu);

		window.addEventListener("resize", function() {
			if (menu.classList.contains("show")) {
				self.positionToggleMenu();
			}
		});
	},

	renderToggleMenu: function() {
		let self = this;
		let menu = self.menuElement;
		if (!menu) {
			return;
		}

		let items = self.getConfigItems();
		let html = "<div class='px-3 py-2 fw-semibold border-bottom'>Highlight Elements</div>";

		if (!items.length) {
			html += "<div class='px-3 py-2 text-muted small'>No highlight selectors configured.</div>";
			menu.innerHTML = html;
			return;
		}

		for (let i = 0; i < items.length; i++) {
			let item = items[i];
			let itemId = "st-highlight-toggle-" + i;
			let checked = (item.enabled !== false) ? "checked" : "";
			let label = item.label || item.selector;

			html += `
				<div class="form-check py-2 border-bottom" data-st-highlight-item-index="${i}" style="padding-left: 40px;">
					<input class="form-check-input" type="checkbox" value="1" id="${itemId}" ${checked}>
					<label class="form-check-label w-100" for="${itemId}" title="${item.selector}">
						${label}
					</label>
				</div>
			`;
		}

		menu.innerHTML = html;

		menu.querySelectorAll("[data-st-highlight-item-index]").forEach(function(wrapper) {
			let idx = Number(wrapper.getAttribute("data-st-highlight-item-index"));
			let input = wrapper.querySelector("input[type='checkbox']");

			if (!input || Number.isNaN(idx)) {
				return;
			}

			input.addEventListener("click", function(event) {
				event.stopPropagation();
			});

			input.addEventListener("change", function() {
				let config = window.stElementHighlightConfig || {};
				if (!Array.isArray(config.items) || !config.items[idx]) {
					return;
				}

				config.items[idx].enabled = input.checked;
				self.saveState();
				if (self.enabled) {
					self.requestRender();
				}
			});
		});
	},

	positionToggleMenu: function() {
		let button = document.getElementById("toggle-element-highlight-btn");
		let menu = this.menuElement;

		if (!button || !menu) {
			return;
		}

		let rect = button.getBoundingClientRect();
		let left = rect.left;
		let top = rect.bottom + 6;

		menu.style.left = left + "px";
		menu.style.top = top + "px";
	},

	clearMenuHideTimer: function() {
		if (!this.hideMenuTimer) {
			return;
		}

		window.clearTimeout(this.hideMenuTimer);
		this.hideMenuTimer = null;
	},

	hideToggleMenu: function() {
		if (!this.menuElement) {
			return;
		}

		this.clearMenuHideTimer();
		this.menuElement.classList.remove("show");
		this.menuElement.style.display = "none";
	},

	toggle: function(forceState = null) {
		let nextState = (typeof forceState === "boolean") ? forceState : !this.enabled;
		this.enabled = nextState;

		if (this.enabled) {
			this.requestRender();
		} else {
			this.clear();
		}

		this.saveState();
		this.syncButtonState();
	},

	syncButtonState: function() {
		let button = document.getElementById("toggle-element-highlight-btn");
		if (!button) {
			return;
		}

		if (this.enabled) {
			button.classList.add("active");
			button.setAttribute("aria-pressed", "true");
			button.setAttribute("title", "Hide element highlights");
		} else {
			button.classList.remove("active");
			button.setAttribute("aria-pressed", "false");
			button.setAttribute("title", "Show element highlights");
		}

		this.renderToggleMenu();
	},

	requestRender: function() {
		let self = this;

		if (self.renderDebounceTimer) {
			window.clearTimeout(self.renderDebounceTimer);
		}

		self.renderDebounceTimer = window.setTimeout(function() {
			self.renderDebounceTimer = null;
			self.queueAnimationRender();
		}, self.renderDebounceDelay);
	},

	queueAnimationRender: function() {
		let self = this;
		let frameWindow = window;

		if (self.renderRaf) {
			return;
		}

		self.renderRafWindow = frameWindow;
		self.renderRaf = frameWindow.requestAnimationFrame(function() {
			self.renderRaf = null;
			self.renderRafWindow = null;
			self.render();
		});
	},

	cancelPendingRender: function() {
		if (this.renderDebounceTimer) {
			window.clearTimeout(this.renderDebounceTimer);
			this.renderDebounceTimer = null;
		}

		if (!this.renderRaf || !this.renderRafWindow) {
			this.renderRaf = null;
			this.renderRafWindow = null;
			return;
		}

		this.renderRafWindow.cancelAnimationFrame(this.renderRaf);
		this.renderRaf = null;
		this.renderRafWindow = null;
	},

	ensureStyles: function(doc) {
		if (!doc || !doc.head || doc.getElementById(this.styleId)) {
			return;
		}

		let style = doc.createElement("style");
		style.id = this.styleId;
		style.textContent = `
			.${this.overlayClass} {
				position: absolute;
				box-sizing: border-box;
				pointer-events: none;
				box-shadow: 0 0 8px var(--st-highlight-border, #0284c7);
				border: 2px solid var(--st-highlight-border, #0284c7);
				background: var(--st-highlight-color, rgba(14, 165, 233, 0.20));
				z-index: 2147483000;
				border-radius: 3px;
			}

			.${this.overlayClass} .${this.labelClass} {
				position: absolute;
				right: 0;
				top: 0;
				transform: translateY(-100%);
				padding: 2px 8px;
				font-size: 11px;
				line-height: 1.4;
				color: var(--st-highlight-label-text, #ffffff);
				background: var(--st-highlight-label-bg, rgba(15, 23, 42, 0.90));
				white-space: nowrap;
				border-top-left-radius: 3px;
				border-top-right-radius: 3px;
			}
		`;

		doc.head.appendChild(style);
	},

	render: function() {
		let doc = window.FrameDocument;
		let frameWindow = window.FrameWindow;
		let config = window.stElementHighlightConfig || {};

		if (!this.enabled || !doc || !frameWindow || !doc.body) {
			return;
		}

		this.isRendering = true;

		try {
			this.clear();
			this.ensureStyles(doc);

			let items = this.getItems();
			if (!items.length) {
				return;
			}

			for (let i = 0; i < items.length; i++) {
				let item = items[i];
				let matches = [];

				try {
					matches = doc.querySelectorAll(item.selector);
				} catch (error) {
					continue;
				}
				let label = item.label || item.selector;
				let color = item.color || config.defaultColor || "rgba(14, 165, 233, 0.20)";
				let borderColor = item.borderColor || config.defaultBorderColor || "#0284c7";
				let labelTextColor = item.labelTextColor || config.defaultLabelTextColor || "#ffffff";
				let labelBgColor = item.labelBgColor || config.defaultLabelBgColor || "rgba(15, 23, 42, 0.90)";

				matches.forEach((element) => {
					let rect = element.getBoundingClientRect();
					if (rect.width <= 0 || rect.height <= 0) {
						return;
					}

					let overlay = doc.createElement("div");
					overlay.classList.add(this.overlayClass);
					overlay.setAttribute("data-st-highlight-overlay", "true");
					overlay.style.left = (rect.left + frameWindow.scrollX) + "px";
					overlay.style.top = (rect.top + frameWindow.scrollY) + "px";
					overlay.style.width = rect.width + "px";
					overlay.style.height = rect.height + "px";
					overlay.style.setProperty("--st-highlight-color", color);
					overlay.style.setProperty("--st-highlight-border", borderColor);
					overlay.style.setProperty("--st-highlight-label-text", labelTextColor);
					overlay.style.setProperty("--st-highlight-label-bg", labelBgColor);

					let labelEl = doc.createElement("span");
					labelEl.classList.add(this.labelClass);
					labelEl.textContent = label;
					overlay.appendChild(labelEl);

					doc.body.appendChild(overlay);
				});
			}
		} finally {
			this.isRendering = false;
		}
	},

	clear: function() {
		let doc = window.FrameDocument;
		if (!doc) {
			return;
		}

		doc.querySelectorAll("[data-st-highlight-overlay='true']").forEach(function(el) {
			el.remove();
		});
	}
};

if (Vvveb.Gui) {
	Vvveb.Gui.toggleElementHighlightOverlay = function() {
		Vvveb.ElementHighlighter.toggle();
	};
}

// Page Details Modal — rename page, edit URL slug, and link navigation menu
let stCurrentPageAutoid = null;

const stPageDetailsModal = {
	_modal: null,
	_originalTitle: '',
	_originalLink: '',
	_originalMetaTitle: '',
	_originalMetaDescription: '',
	_originalMenuAutoid: '',
	_originalFooterAutoid: '',
	_originalImageAutoid: '',
	_type: 'page',

	// unlocks the URL field so a changed URL is saved
	unlockLink: function() {
		const linkInput = document.getElementById('st-page-details-link');
		const lockBtn = document.getElementById('st-page-details-link-unlock');
		this._linkUnlocked = true;
		if (linkInput) {
			linkInput.readOnly = false;
		}
		if (lockBtn) {
			lockBtn.innerHTML = '<i class="la la-unlock"></i>';
		}
	},
	_linkUnlocked: false,

	// sets the featured image thumbnail and document autoid (empty values clear the image)
	setImage: function(src, autoid) {
		const imageThumb = document.getElementById('st-page-details-image-thumb');
		const imageAutoidInput = document.getElementById('st-page-details-image-autoid');
		const imageRemoveBtn = document.getElementById('st-page-details-image-remove');
		const hasImage = !!(src && autoid);
		if (imageThumb) {
			imageThumb.src = hasImage ? src : '';
			imageThumb.classList.toggle('d-none', !hasImage);
		}
		if (imageAutoidInput) {
			imageAutoidInput.value = hasImage ? autoid : '';
		}
		if (imageRemoveBtn) {
			imageRemoveBtn.classList.toggle('d-none', !hasImage);
		}
	},

	getModal: function() {
		if (!this._modal) {
			const el = document.getElementById('st-page-details-modal');
			if (el) {
				this._modal = bootstrap.Modal.getOrCreateInstance(el);
			}
		}
		return this._modal;
	},

	open: function(pageAutoid) {
		if (!pageAutoid || pageAutoid.indexOf('menu_') === 0 || pageAutoid.indexOf('footer_') === 0) {
			return;
		}

		stCurrentPageAutoid = pageAutoid;

		const modal = this.getModal();
		if (!modal) {
			return;
		}

		// Reset link unlock state
		this._linkUnlocked = false;
		const linkInput = document.getElementById('st-page-details-link');
		const lockBtn = document.getElementById('st-page-details-link-unlock');
		if (linkInput) {
			linkInput.readOnly = true;
		}
		if (lockBtn) {
			lockBtn.innerHTML = '<i class="la la-lock"></i>';
		}

		// Reset fields to loading state
		const nameInput = document.getElementById('st-page-details-name');
		const metaTitleInput = document.getElementById('st-page-details-meta-title');
		const metaDescriptionInput = document.getElementById('st-page-details-meta-description');
		const menuSelect = document.getElementById('st-page-details-menu-select');
		const footerSelect = document.getElementById('st-page-details-footer-select');
		if (nameInput) {
			nameInput.value = '';
			nameInput.placeholder = 'Loading…';
		}
		if (linkInput) {
			linkInput.value = '';
		}
		if (metaTitleInput) {
			metaTitleInput.value = '';
			metaTitleInput.placeholder = 'Loading…';
		}
		if (metaDescriptionInput) {
			metaDescriptionInput.value = '';
			metaDescriptionInput.placeholder = 'Loading…';
		}
		if (menuSelect) {
			menuSelect.innerHTML = '<option value="">Loading…</option>';
			menuSelect.disabled = true;
		}
		if (footerSelect) {
			footerSelect.innerHTML = '<option value="">Loading…</option>';
			footerSelect.disabled = true;
		}
		this.setImage('', '');
		this._originalImageAutoid = '';
		this._type = 'page';

		// always start on the Page tab
		const pageTab = document.querySelector('#st-page-details-modal [data-bs-target="#st-page-details-tab-page"]');
		if (pageTab && typeof bootstrap !== 'undefined' && bootstrap.Tab) {
			bootstrap.Tab.getOrCreateInstance(pageTab).show();
		}
		stDetailsArticleFolder?.hide();

		modal.show();

		stAjaxCall('getPageDetails', { page_autoid: pageAutoid }, 'GET').then(function(response) {
			if (!response) {
				return;
			}

			const nameInput = document.getElementById('st-page-details-name');
			const linkInput = document.getElementById('st-page-details-link');
			const metaTitleInput = document.getElementById('st-page-details-meta-title');
			const metaDescriptionInput = document.getElementById('st-page-details-meta-description');
			const menuSelect = document.getElementById('st-page-details-menu-select');
			const footerSelect = document.getElementById('st-page-details-footer-select');

			if (nameInput) {
				nameInput.value = response.title || '';
				nameInput.placeholder = 'Page title';
				stPageDetailsModal._originalTitle = response.title || '';
			}
			if (linkInput) {
				linkInput.value = response.link || '';
				stPageDetailsModal._originalLink = response.link || '';
			}
			if (metaTitleInput) {
				metaTitleInput.value = response.meta_title || '';
				metaTitleInput.placeholder = 'Meta title';
				stPageDetailsModal._originalMetaTitle = response.meta_title || '';
			}
			if (metaDescriptionInput) {
				metaDescriptionInput.value = response.meta_description || '';
				metaDescriptionInput.placeholder = 'Meta description';
				stPageDetailsModal._originalMetaDescription = response.meta_description || '';
			}

			stPageDetailsModal._type = response.type || 'page';

			// articles must be in a folder - show the Folder field for them
			if (stDetailsArticleFolder) {
				stDetailsArticleFolder.build();
				if (stPageDetailsModal._type === 'article') {
					stDetailsArticleFolder.show();
				} else {
					stDetailsArticleFolder.hide();
				}
			}
			stPageDetailsModal.setImage(response.image || '', response.image_autoid || '');
			stPageDetailsModal._originalImageAutoid = (response.image && response.image_autoid) ? response.image_autoid : '';

			if (menuSelect) {
				menuSelect.disabled = false;
				const menus = response.menus || [];
				const linkedMenuAutoid = response.linked_menu_autoid || '';
				stPageDetailsModal._originalMenuAutoid = linkedMenuAutoid;

				let html = '<option value="">— No linked menu —</option>';
				menus.forEach(function(menu) {
					const isSelected = menu.autoid === linkedMenuAutoid ? ' selected' : '';
					const defaultLabel = menu['default'] ? ' (default)' : '';
					html += `<option value="${menu.autoid}"${isSelected}>${menu.name}${defaultLabel}</option>`;
				});
				menuSelect.innerHTML = html;
			}

			if (footerSelect) {
				footerSelect.disabled = false;
				const footers = response.footers || [];
				const linkedFooterAutoid = response.linked_footer_autoid || '';
				stPageDetailsModal._originalFooterAutoid = linkedFooterAutoid;

				let footerHtml = '<option value="">— No linked footer —</option>';
				footers.forEach(function(footer) {
					const isSelected = footer.autoid === linkedFooterAutoid ? ' selected' : '';
					const defaultLabel = footer['default'] ? ' (default)' : '';
					footerHtml += `<option value="${footer.autoid}"${isSelected}>${footer.name}${defaultLabel}</option>`;
				});
				footerSelect.innerHTML = footerHtml;
			}
		});
	},

	save: function() {
		if (!stCurrentPageAutoid) {
			return;
		}

		const nameInput            = document.getElementById('st-page-details-name');
		const linkInput            = document.getElementById('st-page-details-link');
		const metaTitleInput       = document.getElementById('st-page-details-meta-title');
		const metaDescriptionInput = document.getElementById('st-page-details-meta-description');
		const menuSelect           = document.getElementById('st-page-details-menu-select');
		const footerSelect         = document.getElementById('st-page-details-footer-select');

		const title           = nameInput ? nameInput.value.trim() : '';
		const link            = (linkInput && this._linkUnlocked) ? linkInput.value.trim() : '';
		const metaTitle       = metaTitleInput ? metaTitleInput.value.trim() : '';
		const metaDescription = metaDescriptionInput ? metaDescriptionInput.value.trim() : '';
		const menuAutoid      = menuSelect ? menuSelect.value : '';
		const footerAutoid    = footerSelect ? footerSelect.value : '';
		const imageAutoidInput = document.getElementById('st-page-details-image-autoid');
		const imageAutoid     = imageAutoidInput ? imageAutoidInput.value : '';

		if (!title) {
			displayToast('bg-warning', 'Warning', 'Page title cannot be empty.');
			return;
		}

		const titleChanged  = title !== this._originalTitle;
		const linkChanged   = link !== '' && link !== this._originalLink;
		const metaChanged   = metaTitle !== this._originalMetaTitle || metaDescription !== this._originalMetaDescription;
		const menuChanged   = menuAutoid !== this._originalMenuAutoid;
		const footerChanged = footerAutoid !== this._originalFooterAutoid;
		const imageChanged  = imageAutoid !== this._originalImageAutoid;

		const tasks = [];

		if (titleChanged || linkChanged || metaChanged || imageChanged) {
			const renameData = {
				page_autoid: stCurrentPageAutoid,
				title: title,
				meta_title: metaTitle,
				meta_description: metaDescription
			};
			if (linkChanged) {
				renameData.link = link;
			}
			if (imageChanged) {
				// an empty autoid clears the featured image
				renameData.image_autoid = imageAutoid;
			}
			tasks.push(
				stAjaxCall('renamePage', renameData, 'POST').then(function(response) {
					if (response && response.success) {
						// Update the label in the file tree
						const treeItem = document.querySelector(`[data-id="${stCurrentPageAutoid}"]`);
						if (treeItem) {
							const span = treeItem.querySelector('label span');
							if (span) {
								span.textContent = response.title;
							}
						}
					}
				})
			);
		}

		if (menuChanged) {
			tasks.push(
				stAjaxCall('linkPageMenu', { page_autoid: stCurrentPageAutoid, menu_autoid: menuAutoid }, 'POST')
			);
		}

		if (footerChanged) {
			tasks.push(
				stAjaxCall('linkPageFooter', { page_autoid: stCurrentPageAutoid, footer_autoid: footerAutoid }, 'POST')
			);
		}

		if (!tasks.length) {
			bootstrap.Modal.getOrCreateInstance(document.getElementById('st-page-details-modal')).hide();
			return;
		}

		Promise.all(tasks).then(function() {
			displayToast('bg-success', 'Success', 'Page details saved.');
			bootstrap.Modal.getOrCreateInstance(document.getElementById('st-page-details-modal')).hide();
		}).catch(function() {
			displayToast('bg-danger', 'Error', 'Could not save page details.');
		});
	},

	init: function() {
		const saveBtn = document.getElementById('st-page-details-save');
		if (saveBtn) {
			saveBtn.addEventListener('click', function() {
				stPageDetailsModal.save();
			});
		}

		// featured image - pick a document from the file manager
		const imageChooseBtn = document.getElementById('st-page-details-image-choose');
		if (imageChooseBtn) {
			imageChooseBtn.addEventListener('click', function() {
				if (!Vvveb.MediaModal) {
					Vvveb.MediaModal = new FileManager(true);
				}
				Vvveb.MediaModal.open(null, function(src, autoid) {
					if (!autoid) {
						displayToast('bg-warning', 'Warning', 'Please choose an image from the file manager.');
						return;
					}
					stPageDetailsModal.setImage(src, autoid);
				});
			});
		}

		const imageRemoveBtn = document.getElementById('st-page-details-image-remove');
		if (imageRemoveBtn) {
			imageRemoveBtn.addEventListener('click', function() {
				stPageDetailsModal.setImage('', '');
			});
		}

		const lockBtn = document.getElementById('st-page-details-link-unlock');
		if (lockBtn) {
			lockBtn.addEventListener('click', function() {
				const linkInput = document.getElementById('st-page-details-link');
				stPageDetailsModal._linkUnlocked = !stPageDetailsModal._linkUnlocked;
				if (linkInput) {
					linkInput.readOnly = !stPageDetailsModal._linkUnlocked;
				}
				lockBtn.innerHTML = stPageDetailsModal._linkUnlocked
					? '<i class="la la-unlock"></i>'
					: '<i class="la la-lock"></i>';
			});
		}

		const defaultBtn = document.getElementById('st-page-details-set-default');
		if (defaultBtn) {
			defaultBtn.addEventListener('click', function() {
				const menuSelect = document.getElementById('st-page-details-menu-select');
				const menuAutoid = menuSelect ? menuSelect.value : '';
				if (!menuAutoid) {
					displayToast('bg-warning', 'Warning', 'Please select a menu to set as default.');
					return;
				}
				stAjaxCall('setDefaultMenu', { menu_autoid: menuAutoid }, 'POST').then(function(response) {
					if (response && response.success) {
						displayToast('bg-success', 'Success', 'Default menu set.');
						// Refresh menu list to show updated default labels
						stAjaxCall('getPageDetails', { page_autoid: stCurrentPageAutoid }, 'GET').then(function(resp) {
							if (!resp) {
								return;
							}
							const menuSelect = document.getElementById('st-page-details-menu-select');
							if (!menuSelect) {
								return;
							}
							const currentValue = menuSelect.value;
							const menus = resp.menus || [];
							let html = '<option value="">— No linked menu —</option>';
							menus.forEach(function(menu) {
								const isSelected = menu.autoid === currentValue ? ' selected' : '';
								const defaultLabel = menu['default'] ? ' (default)' : '';
								html += `<option value="${menu.autoid}"${isSelected}>${menu.name}${defaultLabel}</option>`;
							});
							menuSelect.innerHTML = html;
						});
					}
				});
			});
		}

		const defaultFooterBtn = document.getElementById('st-page-details-set-default-footer');
		if (defaultFooterBtn) {
			defaultFooterBtn.addEventListener('click', function() {
				const footerSelect = document.getElementById('st-page-details-footer-select');
				const footerAutoid = footerSelect ? footerSelect.value : '';
				if (!footerAutoid) {
					displayToast('bg-warning', 'Warning', 'Please select a footer to set as default.');
					return;
				}
				stAjaxCall('setDefaultFooter', { footer_autoid: footerAutoid }, 'POST').then(function(response) {
					if (response && response.success) {
						displayToast('bg-success', 'Success', 'Default footer set.');
						// Refresh footer list to show updated default labels
						stAjaxCall('getPageDetails', { page_autoid: stCurrentPageAutoid }, 'GET').then(function(resp) {
							if (!resp) {
								return;
							}
							const footerSelect = document.getElementById('st-page-details-footer-select');
							if (!footerSelect) {
								return;
							}
							const currentValue = footerSelect.value;
							const footers = resp.footers || [];
							let html = '<option value="">— No linked footer —</option>';
							footers.forEach(function(footer) {
								const isSelected = footer.autoid === currentValue ? ' selected' : '';
								const defaultLabel = footer['default'] ? ' (default)' : '';
								html += `<option value="${footer.autoid}"${isSelected}>${footer.name}${defaultLabel}</option>`;
							});
							footerSelect.innerHTML = html;
						});
					}
				});
			});
		}

		// Toolbar button
		const toolbarBtn = document.getElementById('st-page-details-btn');
		if (toolbarBtn) {
			toolbarBtn.addEventListener('click', function() {
				stPageDetailsModal.open(stCurrentPageAutoid);
			});
		}

		// Page list .page-details button (event delegation on file manager)
		const filemanager = document.getElementById('filemanager');
		if (filemanager) {
			filemanager.addEventListener('click', function(e) {
				const btn = e.target.closest('.page-details');
				if (!btn) {
					return;
				}
				e.stopImmediatePropagation();
				e.preventDefault();
				const li = btn.closest('li[data-page]');
				if (!li) {
					return;
				}
				const pageId = li.dataset.id || null;
				if (pageId) {
					stPageDetailsModal.open(pageId);
				}
			}, true); // capture phase so we beat builder.js
		}
	}
};

window.addEventListener('vvveb.FileManager.loadPage', function(e) {
	stCurrentPageAutoid = (e.detail && e.detail.id) ? e.detail.id : null;

	const previewBtn = document.querySelector('.btn-preview-url');
	if (previewBtn) {
		previewBtn.href = (e.detail && e.detail.full_url) ? e.detail.full_url : '#';
	}

	const btn = document.getElementById('st-page-details-btn');
	if (btn) {
		if (stCurrentPageAutoid
			&& stCurrentPageAutoid.indexOf('menu_') !== 0
			&& stCurrentPageAutoid.indexOf('footer_') !== 0
		) {
			btn.classList.remove('d-none');
		} else {
			btn.classList.add('d-none');
		}
	}
});

stPageDetailsModal.init();

// Publish / Unpublish — Draft pages are not on the website; Published pages are live from their publish date
const stPublishControl = {
	_pageAutoid: null,
	_status: 'draft',
	_publishDate: '',
	_title: '',

	// formats a Date as a datetime-local value (local time, Y-m-dTH:i)
	toInputValue: function(date) {
		const pad = function(n) { return String(n).padStart(2, '0'); };
		return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate())
			+ 'T' + pad(date.getHours()) + ':' + pad(date.getMinutes());
	},

	// formats a datetime-local value for display
	toDisplay: function(value) {
		const date = new Date(value);
		return isNaN(date.getTime()) ? value : date.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
	},

	// updates the button for the current state
	render: function() {
		const btn = document.getElementById('st-publish-btn');
		if (!btn) {
			return;
		}
		const label = btn.querySelector('.st-publish-label');
		const isPublished = this._status === 'published';
		if (label) {
			label.textContent = isPublished ? 'Unpublish' : 'Publish';
		}
		btn.classList.toggle('btn-success', !isPublished);
		btn.classList.toggle('btn-outline-secondary', isPublished);

		// show when a published page is scheduled for the future
		let title = isPublished ? 'Unpublish page (set back to draft)' : 'Publish page';
		if (isPublished && this._publishDate && new Date(this._publishDate) > new Date()) {
			title = 'Scheduled for ' + this.toDisplay(this._publishDate) + ' — click to unpublish';
		}
		btn.title = title;
	},

	// loads the publishing state for a page (hidden for menus, footers, and templates)
	refresh: function(pageAutoid) {
		const btn = document.getElementById('st-publish-btn');
		if (!btn) {
			return;
		}
		this._pageAutoid = null;
		btn.classList.add('d-none');
		stSetPreviewVisible(true);
		if (!pageAutoid || pageAutoid.indexOf('menu_') === 0 || pageAutoid.indexOf('footer_') === 0) {
			return;
		}

		stAjaxCall('getPageDetails', { page_autoid: pageAutoid }, 'GET').then(function(response) {
			if (!response || stCurrentPageAutoid !== pageAutoid) {
				return;
			}

			// draft and scheduled pages aren't on the website, so there's nothing to view
			stSetPreviewVisible(response.type === 'template' || response.state === 'published');
			if (response.type === 'template') {
				return;
			}
			stPublishControl._pageAutoid = pageAutoid;
			stPublishControl._status = response.status || 'draft';
			stPublishControl._publishDate = response.publish_date || '';
			stPublishControl._title = response.title || '';
			stPublishControl.render();
			btn.classList.remove('d-none');
		}).catch(function() {});
	},

	// opens the date picker, defaulting to the previous publish date (or now)
	openPublish: function() {
		const input = document.getElementById('st-publish-date');
		if (input) {
			input.value = this._publishDate || this.toInputValue(new Date());
		}
		bootstrap.Modal.getOrCreateInstance(document.getElementById('st-publish-modal')).show();
	},

	publish: function() {
		const pageAutoid = this._pageAutoid;
		const input = document.getElementById('st-publish-date');
		const publishDate = input ? input.value : '';
		if (!pageAutoid) {
			return;
		}
		if (!publishDate) {
			displayToast('bg-warning', 'Warning', 'Please choose a publish date and time.');
			return;
		}

		stAjaxCall('publishPage', { page_autoid: pageAutoid, publish_date: publishDate }, 'POST', true).then(function(response) {
			if (!response || !response.success) {
				displayToast('bg-danger', 'Error', 'Could not publish the page.');
				return;
			}
			bootstrap.Modal.getOrCreateInstance(document.getElementById('st-publish-modal')).hide();
			stPublishControl._status = 'published';
			stPublishControl._publishDate = response.publish_date || publishDate;
			stPublishControl.render();
			stSetPagePublishState(pageAutoid, response.live ? 'published' : 'scheduled');
			stSetPreviewVisible(!!response.live);
			if (response.live) {
				displayToast('bg-success', 'Success', 'Page published.');
			} else {
				displayToast('bg-success', 'Success', 'Page scheduled for ' + stPublishControl.toDisplay(stPublishControl._publishDate) + '.');
			}
		}).catch(function() {});
	},

	unpublish: function() {
		const pageAutoid = this._pageAutoid;
		if (!pageAutoid) {
			return;
		}
		stUnpublishConfirm(this._title).then(function(confirmed) {
			if (!confirmed) {
				return;
			}
			stAjaxCall('unpublishPage', { page_autoid: pageAutoid }, 'POST', true).then(function(response) {
				if (!response || !response.success) {
					displayToast('bg-danger', 'Error', 'Could not unpublish the page.');
					return;
				}
				stPublishControl._status = 'draft';
				stPublishControl.render();
				stSetPagePublishState(pageAutoid, 'draft');
				stSetPreviewVisible(false);
				displayToast('bg-success', 'Success', 'Page unpublished. It is now a draft.');
			}).catch(function() {});
		});
	},

	init: function() {
		const btn = document.getElementById('st-publish-btn');
		if (btn) {
			btn.addEventListener('click', function() {
				if (stPublishControl._status === 'published') {
					stPublishControl.unpublish();
				} else {
					stPublishControl.openPublish();
				}
			});
		}

		const confirmBtn = document.getElementById('st-publish-confirm');
		if (confirmBtn) {
			confirmBtn.addEventListener('click', function() {
				stPublishControl.publish();
			});
		}

		window.addEventListener('vvveb.FileManager.loadPage', function(e) {
			stPublishControl.refresh((e.detail && e.detail.id) ? e.detail.id : null);
		});
	}
};

stPublishControl.init();

/**
 * stSetPagePublishState: Updates a page's status dot in the page list (green published, amber scheduled, grey draft).
 *
 * @param {string} autoid - The page autoid.
 * @param {string} state - "published", "scheduled" or "draft".
 */
function stSetPagePublishState(autoid, state) {
	if (!autoid || !state) {
		return;
	}
	document.querySelectorAll('#filemanager li[data-id="' + autoid + '"] .st-publish-dot').forEach(function(dot) {
		dot.classList.remove('st-publish-dot-published', 'st-publish-dot-scheduled', 'st-publish-dot-draft');
		dot.classList.add('st-publish-dot-' + state);
		dot.title = state.charAt(0).toUpperCase() + state.slice(1);
	});

	// only live pages can be viewed on the website
	document.querySelectorAll('#filemanager li[data-id="' + autoid + '"] a.view').forEach(function(link) {
		link.classList.toggle('d-none', state !== 'published');
	});
}

/**
 * stSetPreviewVisible: Shows or hides the toolbar "View page" button (hidden for draft and scheduled pages).
 *
 * @param {boolean} visible
 */
function stSetPreviewVisible(visible) {
	document.querySelectorAll('.btn-preview-url').forEach(function(link) {
		link.classList.toggle('d-none', !visible);
	});
}

/**
 * stUnpublishConfirm: Shows a Bootstrap 5 confirmation modal before unpublishing a page.
 * Returns a Promise that resolves to true (proceed) or false (cancel).
 *
 * @param {string} pageTitle - The title of the page being unpublished.
 * @returns {Promise<boolean>}
 */
function stUnpublishConfirm(pageTitle) {
	return new Promise(function(resolve) {
		var modalId = 'st-unpublish-confirm-modal';
		var existing = document.getElementById(modalId);
		if (existing) {
			existing.remove();
		}

		var modal = document.createElement('div');
		modal.id = modalId;
		modal.className = 'modal fade';
		modal.setAttribute('tabindex', '-1');
		modal.setAttribute('aria-modal', 'true');
		modal.setAttribute('role', 'dialog');
		modal.innerHTML = [
			'<div class="modal-dialog modal-dialog-centered">',
				'<div class="modal-content">',
					'<div class="modal-header">',
						'<h5 class="modal-title"><i class="la la-eye-slash me-1"></i> Unpublish Page</h5>',
						'<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>',
					'</div>',
					'<div class="modal-body">',
						'<p>Are you sure you want to unpublish <strong class="st-unpublish-page-name"></strong>?</p>',
						'<p class="text-muted mb-0">The page will be set back to draft and will no longer be available on the website.</p>',
					'</div>',
					'<div class="modal-footer">',
						'<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>',
						'<button type="button" class="btn btn-danger" id="st-unpublish-confirm-ok"><i class="la la-eye-slash me-1"></i> Unpublish</button>',
					'</div>',
				'</div>',
			'</div>'
		].join('');

		// set page name safely (no XSS)
		modal.querySelector('.st-unpublish-page-name').textContent = pageTitle || 'this page';

		document.body.appendChild(modal);

		var bsModal = new bootstrap.Modal(modal, { backdrop: 'static', keyboard: false });
		var resolved = false;

		modal.querySelector('#st-unpublish-confirm-ok').addEventListener('click', function() {
			resolved = true; // must be set before hide() — Bootstrap fires hide.bs.modal synchronously
			bsModal.hide();
			resolve(true);
		});

		// any modal close that wasn't the OK button means the user cancelled
		modal.addEventListener('hide.bs.modal', function() {
			if (!resolved) {
				resolve(false);
			}
		});

		modal.addEventListener('hidden.bs.modal', function() {
			modal.remove();
		});

		bsModal.show();
	});
}

/**
 * stNavSaveConfirm: Shows a Bootstrap 5 confirmation modal before saving nav changes.
 * Returns a Promise that resolves to true (proceed) or false (cancel).
 *
 * @param {string} menuName - The name of the navigation menu being changed.
 * @returns {Promise<boolean>}
 */
function stNavSaveConfirm(menuName) {
	return new Promise(function(resolve) {
		var modalId = 'st-nav-save-confirm-modal';
		var existing = document.getElementById(modalId);
		if (existing) {
			existing.remove();
		}

		var modal = document.createElement('div');
		modal.id = modalId;
		modal.className = 'modal fade';
		modal.setAttribute('tabindex', '-1');
		modal.setAttribute('aria-modal', 'true');
		modal.setAttribute('role', 'dialog');
		modal.innerHTML = [
			'<div class="modal-dialog modal-dialog-centered">',
				'<div class="modal-content">',
					'<div class="modal-header">',
						'<h5 class="modal-title"><i class="la la-globe me-1"></i> Navigation Changes</h5>',
						'<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>',
					'</div>',
					'<div class="modal-body">',
						'<p>You have made changes to the <strong class="st-nav-menu-name"></strong> navigation.</p>',
						'<p class="text-muted mb-0">These changes will be saved and applied to <strong>all pages</strong> using this navigation. Do you want to continue?</p>',
					'</div>',
					'<div class="modal-footer">',
						'<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>',
						'<button type="button" class="btn btn-primary" id="st-nav-confirm-ok"><i class="la la-save me-1"></i> Save with Navigation</button>',
					'</div>',
				'</div>',
			'</div>'
		].join('');

		// set menu name safely (no XSS)
		modal.querySelector('.st-nav-menu-name').textContent = menuName;

		document.body.appendChild(modal);

		var bsModal = new bootstrap.Modal(modal, { backdrop: 'static', keyboard: false });
		var resolved = false;

		modal.querySelector('#st-nav-confirm-ok').addEventListener('click', function() {
			resolved = true; // must be set before hide() — Bootstrap fires hide.bs.modal synchronously
			bsModal.hide();
			resolve(true);
		});

		// any modal close that wasn't the OK button means the user cancelled
		modal.addEventListener('hide.bs.modal', function() {
			if (!resolved) {
				resolve(false);
			}
		});

		modal.addEventListener('hidden.bs.modal', function() {
			modal.remove();
		});

		bsModal.show();
	});
}

/**
 * stFooterSaveConfirm: Shows a Bootstrap 5 confirmation modal before saving footer changes.
 * Returns a Promise that resolves to true (proceed) or false (cancel).
 *
 * @param {string} footerName - The name of the footer being changed.
 * @returns {Promise<boolean>}
 */
function stFooterSaveConfirm(footerName) {
	return new Promise(function(resolve) {
		var modalId = 'st-footer-save-confirm-modal';
		var existing = document.getElementById(modalId);
		if (existing) {
			existing.remove();
		}

		var modal = document.createElement('div');
		modal.id = modalId;
		modal.className = 'modal fade';
		modal.setAttribute('tabindex', '-1');
		modal.setAttribute('aria-modal', 'true');
		modal.setAttribute('role', 'dialog');
		modal.innerHTML = [
			'<div class="modal-dialog modal-dialog-centered">',
				'<div class="modal-content">',
					'<div class="modal-header">',
						'<h5 class="modal-title"><i class="la la-globe me-1"></i> Footer Changes</h5>',
						'<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>',
					'</div>',
					'<div class="modal-body">',
						'<p>You have made changes to the <strong class="st-footer-name"></strong> footer.</p>',
						'<p class="text-muted mb-0">These changes will be saved and applied to <strong>all pages</strong> using this footer. Do you want to continue?</p>',
					'</div>',
					'<div class="modal-footer">',
						'<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>',
						'<button type="button" class="btn btn-primary" id="st-footer-confirm-ok"><i class="la la-save me-1"></i> Save with Footer</button>',
					'</div>',
				'</div>',
			'</div>'
		].join('');

		// set footer name safely (no XSS)
		modal.querySelector('.st-footer-name').textContent = footerName;

		document.body.appendChild(modal);

		var bsModal = new bootstrap.Modal(modal, { backdrop: 'static', keyboard: false });
		var resolved = false;

		modal.querySelector('#st-footer-confirm-ok').addEventListener('click', function() {
			resolved = true; // must be set before hide() — Bootstrap fires hide.bs.modal synchronously
			bsModal.hide();
			resolve(true);
		});

		// any modal close that wasn't the OK button means the user cancelled
		modal.addEventListener('hide.bs.modal', function() {
			if (!resolved) {
				resolve(false);
			}
		});

		modal.addEventListener('hidden.bs.modal', function() {
			modal.remove();
		});

		bsModal.show();
	});
}

Vvveb.ElementHighlighter.init();